import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import net from 'net';

export type ProbeRequest = {
  candidates: string[];
  timeoutMs?: number;
  concurrentLimit?: number;
  username?: string;
  password?: string;
};

export type ProbeResult = {
  ok: boolean;
  url: string;
  stderr: string;
  latencyMs: number;
  // Optional hints
  requiresAuth?: boolean;
  probeType?: 'lightweight' | 'ffmpeg' | 'tcp';
  statusCode?: number;
  contentType?: string;
};

// Try common MJPEG paths and snapshot URLs for HTTP cameras
const mjpegPaths = [
  '/video.mjpg', '/video.mjpeg', '/mjpg/video.mjpg', '/mjpeg', '/live.mjpeg',
  // Common vendor paths
  '/axis-cgi/mjpg/video.cgi', '/videostream.cgi?streamType=mjpeg',
  // Snapshot endpoints (useful for probing)
  '/Jpeg/CameraPosition1', '/shot.jpg', '/snapshot.jpg', '/image.jpg'
];

function generateMjpegCandidates(baseUrl: string): string[] {
  const url = new URL(baseUrl);
  return mjpegPaths.map(path => {
    const candidate = new URL(url);
    candidate.pathname = path;
    return candidate.toString();
  });
}

// Lightweight RTSP DESCRIBE probe to detect auth requirement and basic reachability
async function lightweightRtspProbe(url: string, timeoutMs: number): Promise<Partial<ProbeResult>> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const port = Number(parsed.port) || 554;
      const path = parsed.pathname + (parsed.search || '');
      const sock = new net.Socket();
      let collected = '';
      let finished = false;

      const onFinish = (partial: Partial<ProbeResult>) => {
        if (finished) return;
        finished = true;
        try { sock.destroy(); } catch (e) {}
        resolve(partial);
      };

      sock.setTimeout(timeoutMs);
      sock.connect(port, host, () => {
        // Send a minimal DESCRIBE request
        const req = `DESCRIBE ${url} RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: difae-probe\r\n\r\n`;
        sock.write(req);
      });

      sock.on('data', (b) => {
        collected += b.toString();
        // Look for status line
        const m = collected.match(/^RTSP\/\d\.\d (\d{3})/m);
        if (m) {
          const status = Number(m[1]);
          const authHeader = /WWW-Authenticate:/i.test(collected);
          onFinish({
            ok: status >= 200 && status < 300,
            requiresAuth: status === 401 || authHeader,
            probeType: 'tcp',
            stderr: collected,
            statusCode: status
          });
        }
      });

      sock.on('error', (err) => {
        onFinish({ ok: false, stderr: String(err), probeType: 'tcp' });
      });

      sock.on('timeout', () => onFinish({ ok: false, stderr: 'timeout', probeType: 'tcp' }));
    } catch (e) {
      resolve({ ok: false, stderr: String(e) });
    }
  });
}

// Lightweight HTTP probe: HEAD then GET for content-type and auth detection
async function lightweightHttpProbe(url: string, timeoutMs: number): Promise<Partial<ProbeResult>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Try HEAD first
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (!res) throw new Error('no-response');
    clearTimeout(id);
    const contentType = res.headers.get('content-type') || undefined;
    const requiresAuth = res.status === 401;
    const ok = res.ok && (res.status === 200 || res.status === 206);
    return { ok, requiresAuth, probeType: 'lightweight', statusCode: res.status, contentType } as Partial<ProbeResult>;
  } catch (e) {
    clearTimeout(id);
    // Try a lightweight GET for MJPEG / snapshot detection
    try {
      const controller2 = new AbortController();
      const id2 = setTimeout(() => controller2.abort(), timeoutMs);
      const res2 = await fetch(url, { method: 'GET', signal: controller2.signal });
      clearTimeout(id2);
      const contentType = res2.headers.get('content-type') || undefined;
      return { ok: res2.ok, requiresAuth: res2.status === 401, probeType: 'lightweight', statusCode: res2.status, contentType } as Partial<ProbeResult>;
    } catch (e2) {
      return { ok: false, stderr: String(e2) };
    }
  }
}

async function probeUrl(url: string, timeoutMs: number, ffmpegAvailable = true): Promise<ProbeResult> {
  const start = Date.now();
  // First try a lightweight probe (RTSP DESCRIBE or HTTP HEAD/GET)
  try {
    if (url.startsWith('rtsp://')) {
      const lw = await lightweightRtspProbe(url, Math.max(2000, timeoutMs));
      if (lw.ok || lw.requiresAuth) {
        return {
          ok: !!lw.ok,
          url,
          stderr: lw.stderr || '',
          latencyMs: Date.now() - start,
          requiresAuth: !!lw.requiresAuth,
          probeType: lw.probeType || 'tcp',
          statusCode: lw.statusCode
        };
      }
      // If lightweight inconclusive, fall through to ffmpeg
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      const lw = await lightweightHttpProbe(url, Math.max(2000, timeoutMs));
      if (lw.ok || lw.requiresAuth) {
        return {
          ok: !!lw.ok,
          url,
          stderr: lw.stderr || '',
          latencyMs: Date.now() - start,
          requiresAuth: !!lw.requiresAuth,
          probeType: lw.probeType || 'lightweight',
          statusCode: lw.statusCode,
          contentType: lw.contentType
        };
      }
      // else fall through to ffmpeg for deeper check
    }
  } catch (e) {
    // ignore and try ffmpeg below
  }

  // If we reach here, perform ffmpeg-based probe (if ffmpeg exists)
  if (!ffmpegAvailable) {
    return {
      ok: false,
      url,
      stderr: 'ffmpeg not available on server PATH',
      latencyMs: Date.now() - start,
      probeType: 'ffmpeg'
    };
  }
  const isSnapshot = /\.(jpe?g|png)$/i.test(url);
  let ffmpegArgs: string[] = [];
  if (isSnapshot) {
    ffmpegArgs = ['-headers', 'Range: bytes=0-1023', '-i', url, '-f', 'null', '-'];
  } else if (url.startsWith('rtsp://')) {
    ffmpegArgs = ['-rtsp_transport', 'tcp', '-i', url, '-t', '2', '-f', 'null', '-'];
  } else {
    ffmpegArgs = ['-i', url, '-t', '3', '-f', 'null', '-'];
  }

  return new Promise((resolve) => {
    const ff = spawn('ffmpeg', ffmpegArgs);
    let stderr = '';
    let finished = false;

    const onFinish = (ok: boolean) => {
      if (finished) return;
      finished = true;
      try { ff.kill('SIGKILL'); } catch (e) {}
      resolve({ 
        ok, 
        url, 
        stderr, 
        latencyMs: Date.now() - start,
        probeType: 'ffmpeg'
      });
    };

    ff.stderr.on('data', (chunk) => {
      stderr += String(chunk);
      if (/frame=\s*\d+/i.test(stderr) || (url.includes('mjpg') && stderr.includes('Input #0')) || (isSnapshot && stderr.includes('Server:'))) {
        onFinish(true);
      }
    });

    ff.on('error', (err) => {
      stderr += String(err.message || err);
      onFinish(false);
    });

    ff.on('close', (code) => {
      if (!finished) {
        onFinish(code === 0);
      }
    });

    setTimeout(() => onFinish(false), timeoutMs).unref();
  });
}

// Check if ffmpeg is available in PATH by running `ffmpeg -version`
async function checkFfmpegAvailable(): Promise<{ok:boolean, info?:string}> {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-version']);
    let out = '';
    let finished = false;
    p.stdout?.on('data', (c) => out += String(c));
    p.on('error', (err) => {
      if (finished) return;
      finished = true;
      resolve({ ok: false, info: String(err.message || err) });
    });
    p.on('close', (code) => {
      if (finished) return;
      finished = true;
      resolve({ ok: code === 0, info: out });
    });
    setTimeout(() => {
      if (!finished) {
        finished = true;
        try { p.kill(); } catch (e) {}
        resolve({ ok: false, info: 'timeout' });
      }
    }, 1500).unref();
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProbeRequest;
    let { candidates, timeoutMs = 7000, concurrentLimit = 3 } = body;

    if (!candidates?.length) {
      return NextResponse.json({ success: false, message: 'No candidates provided' }, { status: 400 });
    }

    // For HTTP candidates, add MJPEG paths
    candidates = candidates.flatMap(url => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return [url, ...generateMjpegCandidates(url)];
      }
      return [url];
    });

    // If candidates are bare hosts (rtsp://host or http://host with no path), expand them with common RTSP/HTTP paths
  const rtspCommonPaths = ['/stream1', '/h264', '/videoMain', '/live.sdp', '/onvif1', '/', '/cam/realmonitor?channel=1&subtype=0', '/Streaming/Channels/1', '/live/main', '/live'];
  const httpCommonPaths = ['/video.cgi', '/videostream.cgi', '/mjpeg.cgi', '/videostream', '/live', '/', '/video1.mjpg', '/cgi-bin/video.jpg', '/axis-cgi/mjpg/video.cgi', '/img/video.mjpeg', '/mjpg/video.mjpg'];

  // V380 / V380E vendor-specific patterns (iSpy common entries)
  const v380Rtsp = ['/av0_0', '/live/1', '/live/0', '/ch01/av_stream', '/channel=1&stream=0', '/user=admin&password=&channel=1&stream=0'];
  const v380Http = ['/live', '/video', '/video1', '/media/?action=stream', '/cgi-bin/guest/rtp'];

  for (const p of v380Rtsp) rtspCommonPaths.push(p);
  for (const p of v380Http) httpCommonPaths.push(p);

    const extra: string[] = [];
    for (const url of candidates) {
      try {
        const u = new URL(url);
        const pathname = (u.pathname || '/') || '/';
        const isBare = pathname === '/' || pathname === '';
        if (isBare) {
          if (u.protocol === 'rtsp:') {
            for (const p of rtspCommonPaths) {
              const c = new URL(url);
              c.pathname = p;
              extra.push(c.toString());
            }
          } else if (u.protocol === 'http:' || u.protocol === 'https:') {
            for (const p of httpCommonPaths) {
              const c = new URL(url);
              c.pathname = p;
              extra.push(c.toString());
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (extra.length) candidates = [...candidates, ...extra];

    // Deduplicate while preserving order
    candidates = [...new Set(candidates)];

    // Prioritize vendor-specific patterns (V380) to probe them first when present
    const v380Hints = ['/av0_0', '/live/1', '/live/0', '/ch01/av_stream', 'channel=1&stream=0', '/media/?action=stream'];
    const v380Candidates: string[] = [];
    const otherCandidates: string[] = [];
    for (const c of candidates) {
      if (v380Hints.some(h => c.includes(h))) v380Candidates.push(c);
      else otherCandidates.push(c);
    }
    if (v380Candidates.length) candidates = [...v380Candidates, ...otherCandidates];

    // Cap total candidates to avoid very long runs in the probe endpoint
    const MAX_CANDIDATES = 40;
    if (candidates.length > MAX_CANDIDATES) candidates = candidates.slice(0, MAX_CANDIDATES);

    const ffcheck = await checkFfmpegAvailable();
    const ffmpegAvailable = ffcheck.ok;

    const results: ProbeResult[] = [];
    let firstSuccess: ProbeResult | null = null;

    // Process candidates in parallel batches
    for (let i = 0; i < candidates.length; i += concurrentLimit) {
      const batch = candidates.slice(i, i + concurrentLimit);
      const batchResults = await Promise.all(
        batch.map(url => probeUrl(url, timeoutMs, ffmpegAvailable))
      );

      // Store all results but note first success
      for (const res of batchResults) {
        results.push(res);
        if (res.ok && !firstSuccess) {
          firstSuccess = res;
        }
      }

      // If we found a working stream, don't probe more
      if (firstSuccess) break;
    }

    // If ffmpeg is not available (or even if it is) and we didn't find a ffmpeg-validated stream,
    // prefer any lightweight probe success (HTTP HEAD/GET or RTSP DESCRIBE) as the discovered URL
    if (!firstSuccess) {
      const lw = results.find(r => r.ok && r.probeType && r.probeType !== 'ffmpeg');
      if (lw) {
        firstSuccess = lw;
      }
    }

    // If nothing found and credentials provided, retry candidates by injecting credentials where missing
    if (!firstSuccess && body.username) {
      const { username, password } = body;
      const credCandidates: string[] = [];
      for (const url of candidates) {
        try {
          const u = new URL(url);
          if (!u.username) {
            u.username = encodeURIComponent(username || '');
            if (password) u.password = encodeURIComponent(password);
            credCandidates.push(u.toString());
          }
        } catch (e) {
          // ignore
        }
      }

      // remove duplicates and any already probed URLs
      const tried = new Set(results.map(r => r.url));
      const toTry = [...new Set(credCandidates)].filter(c => !tried.has(c));

      for (let i = 0; i < toTry.length; i += concurrentLimit) {
        const batch = toTry.slice(i, i + concurrentLimit);
        const batchResults = await Promise.all(batch.map(url => probeUrl(url, timeoutMs, ffmpegAvailable)));
        for (const res of batchResults) {
          results.push(res);
          if (res.ok && !firstSuccess) firstSuccess = res;
        }
        if (firstSuccess) break;
      }
    }

    if (firstSuccess) {
      return NextResponse.json({ 
        success: true, 
        url: firstSuccess.url,
        latencyMs: firstSuccess.latencyMs,
        ffmpegAvailable,
        ffmpegInfo: ffcheck.info,
        results // include all results for UI display
      });
    }

    // No successful stream. If ffmpeg missing, provide clearer message and include ffmpeg info
    const message = ffmpegAvailable ? 'No working stream found' : 'ffmpeg not available on server; performed lightweight probes only';
    return NextResponse.json({ 
      success: false, 
      message,
      ffmpegAvailable,
      ffmpegInfo: ffcheck.info,
      results 
    }, { status: 504 });

  } catch (e) {
    return NextResponse.json({ 
      success: false, 
      message: String(e),
      results: [] 
    }, { status: 500 });
  }
}
