import { NextResponse } from 'next/server';
import os from 'os';
import net from 'net';
import fetch from 'node-fetch';
import dgram from 'dgram';
import { spawn } from 'child_process';
import dns from 'dns';

const dnsPromises = dns.promises;

type ScanRequest = {
  subnet?: string; // e.g. 192.168.1
  start?: number;
  end?: number;
  timeoutMs?: number;
  concurrent?: number;
};

function getLocalIPv4Subnet(): string | null {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const list = ifaces[name] || [];
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
    }
  }
  return null;
}

function tcpConnect(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = new net.Socket();
    let done = false;
    const onDone = (ok: boolean) => {
      if (done) return;
      done = true;
      try { s.destroy(); } catch {}
      resolve(ok);
    };
    s.setTimeout(timeoutMs);
    s.once('error', () => onDone(false));
    s.once('timeout', () => onDone(false));
    s.connect(port, host, () => onDone(true));
  });
}

async function probeHttpSnapshot(hostWithPort: string, path: string, timeoutMs: number): Promise<{ ok: boolean; status?: number; contentType?: string; server?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const url = `http://${hostWithPort}${path}`;
    const res = await fetch(url, { method: 'GET', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    if (!res) return { ok: false };
    return { ok: res.status >= 200 && res.status < 300, status: res.status, contentType: res.headers.get('content-type') || undefined, server: res.headers.get('server') || undefined };
  } catch (e) {
    return { ok: false };
  }
}

// minimal RTSP DESCRIBE to detect RTSP presence and auth requirement
async function rtspDescribe(host: string, port: number, timeoutMs: number): Promise<{ ok: boolean; requiresAuth?: boolean; statusCode?: number; stderr?: string }> {
  return new Promise((resolve) => {
    try {
      const sock = new net.Socket();
      let collected = '';
      let finished = false;
      const onFinish = (out: { ok: boolean; requiresAuth?: boolean; statusCode?: number; stderr?: string }) => {
        if (finished) return;
        finished = true;
        try { sock.destroy(); } catch (e) {}
        resolve(out);
      };
      sock.setTimeout(timeoutMs);
      sock.once('error', (err) => onFinish({ ok: false, stderr: String(err) }));
      sock.once('timeout', () => onFinish({ ok: false, stderr: 'timeout' }));
      sock.connect(port, host, () => {
        const req = `DESCRIBE rtsp://${host}:${port}/ RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: difae-scan\r\n\r\n`;
        sock.write(req);
      });
      sock.on('data', (b) => {
        collected += b.toString();
        const m = collected.match(/^RTSP\/\d\.\d (\d{3})/m);
        if (m) {
          const status = Number(m[1]);
          const auth = /WWW-Authenticate:/i.test(collected);
          onFinish({ ok: status >= 200 && status < 300, requiresAuth: status === 401 || auth, statusCode: status, stderr: collected });
        }
      });
    } catch (e) {
      resolve({ ok: false, stderr: String(e) });
    }
  });
}

async function resolveHostname(ip: string): Promise<string | null> {
  if (!dnsPromises) return null;
  try {
    const names = await dnsPromises.reverse(ip);
    if (names && names.length > 0 && names[0]) {
      const name = names[0].replace(/\.$/, '');
      if (name && name !== ip) {
        return name;
      }
    }
  } catch (e) {
    // reverse lookup failed, fall back
  }

  try {
    const service = await dnsPromises.lookupService(ip, 80);
    if (service && service.hostname) {
      const name = service.hostname.replace(/\.$/, '');
      if (name && name !== ip && name !== 'localhost') {
        return name;
      }
    }
  } catch (e) {
    // lookupService failed
  }

  return null;
}

// Run a concurrent ping sweep (Windows `ping -n 1 -w <ms>`) to populate the ARP table
async function pingSweep(ips: string[], concurrency: number, timeoutMs = 300) {
  let idx = 0;
  const workers = new Array(concurrency).fill(0).map(async () => {
    while (true) {
      const i = idx++;
      if (i >= ips.length) break;
      const ip = ips[i];
      try {
        // Windows ping arguments: -n 1 (one echo), -w timeout in ms
        await new Promise<void>((resolve) => {
          const p = spawn('ping', ['-n', '1', '-w', String(timeoutMs), ip], { windowsHide: true });
          const t = setTimeout(() => {
            try { p.kill(); } catch (e) {}
            resolve();
          }, timeoutMs + 400);
          p.on('close', () => {
            clearTimeout(t);
            resolve();
          });
          p.on('error', () => resolve());
        });
      } catch (e) {
        // ignore per-host ping errors
      }
    }
  });
  await Promise.all(workers);
}

// Read ARP table (Windows `arp -a`) and return list of IPv4 addresses found
async function readArpTable(): Promise<string[]> {
  return new Promise((resolve) => {
    const out: string[] = [];
    const p = spawn('arp', ['-a'], { windowsHide: true });
    let buf = '';
    p.stdout?.on('data', (c) => (buf += String(c)));
    p.stderr?.on('data', () => {});
    p.on('close', () => {
      try {
        // Parse lines like:  192.168.18.10       00-11-22-33-44-55     dynamic
        const lines = buf.split(/\r?\n/);
        for (const line of lines) {
          const m = line.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-fA-F:-]{5,})\s+/);
          if (m) out.push(m[1]);
        }
      } catch (e) {
        // ignore
      }
      resolve(Array.from(new Set(out)));
    });
    p.on('error', () => resolve([]));
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScanRequest || {};
    const timeoutMs = body.timeoutMs ?? 800;
    const concurrent = body.concurrent ?? 50;
    const start = body.start ?? 1;
    const end = body.end ?? 254;

    let base = body.subnet;
    if (!base) {
      base = getLocalIPv4Subnet() || '192.168.1';
    }

    const ips: string[] = [];
    for (let i = start; i <= end; i++) ips.push(`${base}.${i}`);

  const httpSnapshotPaths = ['/image.jpg', '/snapshot.jpg', '/jpg/image.jpg', '/video.cgi', '/mjpg/video.mjpg', '/axis-cgi/jpg/image.cgi'];
  const httpPorts = [80, 8080, 8000, 81];
  const rtspPorts = [554, 8554, 88];

    const results: Array<{ ip: string; openPorts: number[]; httpHits: string[]; hostname?: string }> = [];

    // simple concurrency queue
    let index = 0;
    const workers = new Array(concurrent).fill(0).map(async () => {
      while (true) {
        const i = index++;
        if (i >= ips.length) break;
        const ip = ips[i];
        try {
          const openPorts: number[] = [];
          const httpHits: string[] = [];

          // check RTSP ports (tcp connect + describe)
          await Promise.all(rtspPorts.map(async (p) => {
            const ok = await tcpConnect(ip, p, timeoutMs);
            if (ok) {
              openPorts.push(p);
              const info = await rtspDescribe(ip, p, timeoutMs);
              if (info.ok || info.requiresAuth) {
                httpHits.push(`/rtsp:${p} (ok:${info.ok} auth:${!!info.requiresAuth})`);
              }
            }
          }));

          // quick HTTP snapshot probe for common paths across common HTTP ports
          const serverNames = new Set<string>();
          await Promise.all(httpPorts.map(async (port) => {
            await Promise.all(httpSnapshotPaths.map(async (p) => {
              const probe = await probeHttpSnapshot(`${ip}:${port}`, p, timeoutMs);
              if (probe.ok) {
                httpHits.push(`${port}${p}`);
              } else if (probe.status) {
                // include non-200 status as hint
                httpHits.push(`${port}${p} (status:${probe.status})`);
              }
              if (probe.server) {
                serverNames.add(probe.server);
              }
            }));
          }));
          serverNames.forEach((name) => httpHits.push(`server:${name}`));

          if (openPorts.length || httpHits.length) {
            results.push({ ip, openPorts, httpHits });
          }
        } catch (e) {
          // ignore per-host errors
        }
      }
    });

    await Promise.all(workers);

    // Run a lightweight ping sweep to populate the ARP table (helps discover devices that don't open common ports)
    try {
      await pingSweep(ips, Math.min(100, concurrent));
    } catch (e) {
      // ignore ping errors
    }

    // Read ARP table and merge discovered hosts
    try {
      const arpHosts = await readArpTable();
      for (const ah of arpHosts) {
        if (!results.find(r => r.ip === ah)) {
          results.push({ ip: ah, openPorts: [], httpHits: [] });
        }
      }
    } catch (e) {
      // ignore arp read errors
    }

    // If nothing found by port/http probing, attempt ONVIF WS-Discovery as a fallback
    if (results.length === 0) {
      try {
        const onvifHosts = await discoverOnvifDevices(2000);
        for (const h of onvifHosts) {
          // avoid duplicates
          if (!results.find(r => r.ip === h)) {
            results.push({ ip: h, openPorts: [], httpHits: [] });
          }
        }
      } catch (e) {
        // ignore ONVIF discovery errors
      }
    }

    await Promise.all(results.map(async (entry) => {
      if (!entry.hostname) {
        const name = await resolveHostname(entry.ip);
        if (name) entry.hostname = name;
      }
    }));
    for (const entry of results) {
      if (!entry.hostname) {
        const serverIndex = entry.httpHits.findIndex((hit) => hit.startsWith('server:'));
        if (serverIndex !== -1) {
          const serverName = entry.httpHits[serverIndex].slice('server:'.length);
          if (serverName) {
            entry.hostname = serverName;
          }
          entry.httpHits.splice(serverIndex, 1);
        }
      } else {
        entry.httpHits = entry.httpHits.filter((hit) => !(hit.startsWith('server:') && hit.slice('server:'.length) === entry.hostname));
      }
    }

    return NextResponse.json({ success: true, subnet: base, results });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

// Perform a simple ONVIF WS-Discovery probe to find ONVIF devices on the local network.
async function discoverOnvifDevices(timeoutMs = 2000): Promise<string[]> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const msg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n<e:Envelope xmlns:e=\"http://www.w3.org/2003/05/soap-envelope\" xmlns:w=\"http://schemas.xmlsoap.org/ws/2004/08/addressing\" xmlns:d=\"http://schemas.xmlsoap.org/ws/2005/04/discovery\">\n  <e:Header>\n    <w:MessageID>uuid:00000000-0000-0000-0000-000000000000</w:MessageID>\n    <w:To>urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>\n    <w:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action>\n  </e:Header>\n  <e:Body>\n    <d:Probe>\n      <d:Types>dn:NetworkVideoTransmitter</d:Types>\n    </d:Probe>\n  </e:Body>\n</e:Envelope>`);

    const discovered = new Set<string>();

    const onMessage = (buffer: Buffer, rinfo: dgram.RemoteInfo) => {
      try {
        const txt = buffer.toString('utf8');
        // Find XAddrs element
        const m = txt.match(/<XAddrs>(.*?)<\/XAddrs>/i);
        if (m && m[1]) {
          const xaddrs = m[1].trim();
          // multiple addresses separated by spaces
          const parts = xaddrs.split(/\s+/);
          for (const p of parts) {
            try {
              const u = new URL(p);
              discovered.add(u.hostname);
            } catch (e) {
              // If not a full URL, maybe an IP present; fall back to rinfo
              discovered.add(rinfo.address);
            }
          }
        } else {
          // Fallback: use sender address
          discovered.add(rinfo.address);
        }
      } catch (e) {
        // ignore
      }
    };

    socket.on('message', onMessage);
    socket.on('error', () => {});

    socket.bind(() => {
      try {
        socket.setBroadcast(true);
        socket.setMulticastTTL(2);
        const multicastAddr = '239.255.255.250';
        const multicastPort = 3702;
        socket.send(msg, 0, msg.length, multicastPort, multicastAddr, () => {});
      } catch (e) {
        // ignore
      }
    });

    setTimeout(() => {
      try { socket.close(); } catch (e) {}
      resolve(Array.from(discovered));
    }, timeoutMs).unref();
  });
}
