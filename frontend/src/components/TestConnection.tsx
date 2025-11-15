import { useEffect, useMemo, useState } from 'react';
import { ProbeCandidate } from '@/api/client';
import { useProbe } from '@/hooks/useProbe';
import { useCameraStore } from '@/state/useCameraStore';
import { HlsPlayer } from './HlsPlayer';
import { ProbeResultsList } from './ProbeResultsList';

interface TestConnectionProps {
  bridgeCameraId: string;
}

const BRIDGE_ORIGIN = import.meta.env.VITE_BRIDGE_AGENT_ORIGIN ?? 'http://localhost:8787';

export function TestConnection({ bridgeCameraId }: TestConnectionProps) {
  const { mutateAsync, data, error, isPending } = useProbe();
  const ipAddress = useCameraStore((state) => state.ipAddress);
  const publicIpAddress = useCameraStore((state) => state.publicIpAddress);
  const selectedStreamUrl = useCameraStore((state) => state.selectedStreamUrl);
  const storedUsername = useCameraStore((state) => state.username);
  const storedPassword = useCameraStore((state) => state.password);
  const setSelectedStreamUrl = useCameraStore((state) => state.setSelectedStreamUrl);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [previewError, setPreviewError] = useState<string>();
  const [pairingCode, setPairingCode] = useState<string>();
  const [pairingError, setPairingError] = useState<string>();
  const [bridgeToken, setBridgeToken] = useState<string>();
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number>();
  const [isPairing, setIsPairing] = useState(false);
  const [isStartingBridge, setIsStartingBridge] = useState(false);
  const [useLocalMachine, setUseLocalMachine] = useState(false);
  const [localIp, setLocalIp] = useState(() => ipAddress || '192.168.18.130');
  const [localPort, setLocalPort] = useState('554');
  const [localPath, setLocalPath] = useState('h264');
  const [localUsername, setLocalUsername] = useState(() => storedUsername || 'admin');
  const [localPassword, setLocalPassword] = useState(() => storedPassword || 'Berreto@121');
  const [localError, setLocalError] = useState<string>();

  useEffect(() => {
    setPreviewUrl(undefined);
    setPreviewError(undefined);
  }, [selectedStreamUrl]);

  useEffect(() => {
    if (!useLocalMachine) {
      return;
    }
    if (ipAddress && !localIp) {
      setLocalIp(ipAddress);
    }
  }, [ipAddress, localIp, useLocalMachine]);

  const hlsUrl = useMemo(() => {
    if (!selectedStreamUrl) {
      return undefined;
    }
    const url = new URL(`/stream/${bridgeCameraId}/playlist.m3u8`, BRIDGE_ORIGIN);
    url.searchParams.set('sourceUrl', encodeURIComponent(selectedStreamUrl));
    return url.toString();
  }, [bridgeCameraId, selectedStreamUrl]);

  const localRtspUrl = useMemo(() => {
    if (!localIp) {
      return '';
    }
    const trimmedPath = localPath.replace(/^\/+/, '');
    const encodedUsername = localUsername ? encodeURIComponent(localUsername) : '';
    const encodedPassword = localPassword ? encodeURIComponent(localPassword) : '';
    const authSegment = encodedUsername
      ? `${encodedUsername}${encodedPassword ? `:${encodedPassword}` : ''}@`
      : '';
    const portSegment = localPort ? `:${localPort}` : '';
    const pathSegment = trimmedPath ? `/${trimmedPath}` : '';
    return `rtsp://${authSegment}${localIp}${portSegment}${pathSegment}`;
  }, [localIp, localPassword, localPath, localPort, localUsername]);

  const validateLocalIp = (value: string) => {
    const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    return ipRegex.test(value.trim());
  };

  const handleTest = async () => {
    setPreviewUrl(undefined);
    setPreviewError(undefined);
    if (useLocalMachine) {
      if (!validateLocalIp(localIp)) {
        setLocalError('Enter a valid local IPv4 address (e.g. 192.168.18.130).');
        return;
      }
      setLocalError(undefined);
      setSelectedStreamUrl(localRtspUrl);
      const manualCandidate: ProbeCandidate = {
        protocol: 'rtsp',
        url: localRtspUrl,
        confidence: 1,
        verified: true,
        verificationMethod: 'ffprobe',
        notes: 'Manual local RTSP entry',
      };
      await startBridgeStream(manualCandidate);
      return;
    }
    const targetIp = publicIpAddress || ipAddress;
    await mutateAsync(targetIp);
  };

  const handleSelect = (candidate: ProbeCandidate) => {
    if (candidate.protocol === 'mjpeg') {
      setPreviewUrl(candidate.url);
      return;
    }
    if (candidate.protocol === 'rtsp') {
      void startBridgeStream(candidate);
    }
  };

  useEffect(() => {
    void fetchPairingCode();
  }, []);

  const fetchPairingCode = async () => {
    try {
      const response = await fetch(`${BRIDGE_ORIGIN}/pairing-code`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Bridge agent unreachable (${response.status})`);
      }
      const payload = await response.json();
      setPairingCode(payload.pairCode);
      setPairingError(undefined);
    } catch (fetchError) {
      setPairingError((fetchError as Error).message);
    }
  };

  const pairWithAgent = async () => {
    if (!pairingCode) {
      await fetchPairingCode();
      return;
    }
    setIsPairing(true);
    try {
      const response = await fetch(`${BRIDGE_ORIGIN}/api/v1/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair_code: pairingCode }),
      });
      if (!response.ok) {
        throw new Error('Pairing failed. Check the bridge agent console for the latest code.');
      }
      const payload = await response.json();
      setBridgeToken(payload.token);
      setTokenExpiresAt(Date.now() + payload.expiresIn * 1000);
      setPairingError(undefined);
    } catch (pairError) {
      setPairingError((pairError as Error).message);
    } finally {
      setIsPairing(false);
    }
  };

  const startBridgeStream = async (candidate: ProbeCandidate) => {
    if (!bridgeToken || (tokenExpiresAt && tokenExpiresAt < Date.now())) {
      setPreviewError('Pair with the bridge agent before starting a stream.');
      return;
    }
    if (!hlsUrl) {
      setPreviewError('Bridge preview URL unavailable.');
      return;
    }
    setIsStartingBridge(true);
    try {
      const response = await fetch(`${BRIDGE_ORIGIN}/api/v1/cameras/${bridgeCameraId}/streams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bridgeToken}`,
        },
        body: JSON.stringify({
          sourceUrl: candidate.url,
          protocol: candidate.protocol,
        }),
      });
      if (!response.ok) {
        throw new Error(`Bridge agent rejected request (${response.status})`);
      }
      const payload = await response.json();
      const playlist = payload.playlist ? new URL(payload.playlist, BRIDGE_ORIGIN).toString() : hlsUrl;
      setPreviewUrl(playlist);
      setPreviewError(undefined);
    } catch (startError) {
      setPreviewError((startError as Error).message);
    } finally {
      setIsStartingBridge(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <button
          type="button"
          onClick={handleTest}
          disabled={
            isPending ||
            isStartingBridge ||
            (!useLocalMachine && !ipAddress)
          }
          className="rounded bg-emerald-500 px-4 py-2 font-medium text-slate-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
        >
          {useLocalMachine
            ? isStartingBridge
              ? 'Starting preview…'
              : 'Test Local Connection'
            : isPending
              ? 'Probing…'
              : 'Test Connection'}
        </button>
        <p className="mt-2 text-xs text-slate-400">
          We only probe a short list of safe RTSP and MJPEG endpoints. Authenticate manually if prompted. No password brute forcing is performed.
        </p>
      </div>

      <BridgeAgentPairing
        pairingCode={pairingCode}
        pairingError={pairingError}
        isPairing={isPairing}
        pairWithAgent={pairWithAgent}
        fetchPairingCode={fetchPairingCode}
        tokenExpiresAt={tokenExpiresAt}
      />

      <LocalMachineOption
        enabled={useLocalMachine}
        onToggle={(checked) => {
          setUseLocalMachine(checked);
          if (!checked) {
            setLocalError(undefined);
          }
        }}
        localIp={localIp}
        setLocalIp={(value) => {
          setLocalIp(value);
          setLocalError(undefined);
        }}
        localPort={localPort}
        setLocalPort={setLocalPort}
        localPath={localPath}
        setLocalPath={setLocalPath}
        localUsername={localUsername}
        setLocalUsername={setLocalUsername}
        localPassword={localPassword}
        setLocalPassword={setLocalPassword}
        localRtspUrl={localRtspUrl}
        localError={localError}
      />

      {error && <div className="rounded border border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error.message}</div>}
      {data && (
        <ProbeResultsList
          candidates={
            data.candidates.map((candidate) => {
              if (!publicIpAddress || candidate.protocol !== 'rtsp') {
                return candidate;
              }
              try {
                const url = new URL(candidate.url);
                url.hostname = publicIpAddress;
                return { ...candidate, url: url.toString() };
              } catch (error) {
                console.warn('Failed to update candidate with public IP', error);
                return { ...candidate, url: candidate.url.replace(/rtsp:\/\/(.*?)(?=\/|$)/, `rtsp://${publicIpAddress}`) };
              }
            })
          }
          onSelect={(candidate) => handleSelect(candidate)}
          isLoadingPreview={isPending || isStartingBridge}
        />
      )}

      <PreviewPanel previewUrl={previewUrl} previewError={previewError} selectedStreamUrl={selectedStreamUrl} />
    </div>
  );
}

interface PreviewPanelProps {
  previewUrl?: string;
  previewError?: string;
  selectedStreamUrl?: string;
}

function PreviewPanel({ previewUrl, previewError, selectedStreamUrl }: PreviewPanelProps) {
  if (!selectedStreamUrl) {
    return <p className="text-sm text-slate-400">Select a candidate to attempt a preview.</p>;
  }

  if (previewError) {
    return <div className="rounded border border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-300">{previewError}</div>;
  }

  if (!previewUrl) {
    return (
      <div className="rounded border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
        Preview is available once the bridge agent is running and paired. Start the bridge agent locally and keep this page open.
      </div>
    );
  }

  if (previewUrl.endsWith('.m3u8')) {
    return <HlsPlayer src={previewUrl} />;
  }

  return <img src={previewUrl} alt="Camera preview" className="aspect-video w-full rounded-lg border border-slate-800 object-cover" />;
}

interface BridgeAgentPairingProps {
  pairingCode?: string;
  pairingError?: string;
  isPairing: boolean;
  tokenExpiresAt?: number;
  pairWithAgent: () => Promise<void>;
  fetchPairingCode: () => Promise<void>;
}

function BridgeAgentPairing({ pairingCode, pairingError, isPairing, pairWithAgent, fetchPairingCode, tokenExpiresAt }: BridgeAgentPairingProps) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Bridge agent pairing</p>
          <p className="text-xs text-slate-400">
            Runs locally on the same LAN. Tokens expire after 10 minutes and are required to start proxy streams.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPairingCode}
            className="rounded border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
          >
            Refresh code
          </button>
          <button
            type="button"
            onClick={() => pairWithAgent()}
            className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
            disabled={isPairing}
          >
            {isPairing ? 'Pairing…' : 'Pair now'}
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-xs uppercase tracking-wide text-slate-500">Code</span>
        <span className="text-xl font-mono">{pairingCode ?? '— — — — — —'}</span>
      </div>
      {tokenExpiresAt && tokenExpiresAt > Date.now() && (
        <p className="mt-2 text-xs text-emerald-400">
          Paired — token expires in {Math.max(0, Math.round((tokenExpiresAt - Date.now()) / 1000))}s
        </p>
      )}
      {pairingError && <p className="mt-2 text-xs text-red-400">{pairingError}</p>}
    </div>
  );
}

interface LocalMachineOptionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  localIp: string;
  setLocalIp: (value: string) => void;
  localPort: string;
  setLocalPort: (value: string) => void;
  localPath: string;
  setLocalPath: (value: string) => void;
  localUsername: string;
  setLocalUsername: (value: string) => void;
  localPassword: string;
  setLocalPassword: (value: string) => void;
  localRtspUrl: string;
  localError?: string;
}

function LocalMachineOption({
  enabled,
  onToggle,
  localIp,
  setLocalIp,
  localPort,
  setLocalPort,
  localPath,
  setLocalPath,
  localUsername,
  setLocalUsername,
  localPassword,
  setLocalPassword,
  localRtspUrl,
  localError,
}: LocalMachineOptionProps) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">Local machine RTSP camera</p>
          <p className="text-xs text-slate-400">
            Provide LAN credentials to tunnel the stream through the bridge agent running on this computer.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
          Test a camera on this machine
        </label>
      </div>

      {enabled && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="block text-xs uppercase tracking-wide text-slate-400">Local IP address</span>
              <input
                value={localIp}
                onChange={(event) => setLocalIp(event.target.value)}
                placeholder="192.168.18.130"
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="block text-xs uppercase tracking-wide text-slate-400">Port</span>
                <input
                  value={localPort}
                  onChange={(event) => setLocalPort(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="554"
                  className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-xs uppercase tracking-wide text-slate-400">Stream path</span>
                <input
                  value={localPath}
                  onChange={(event) => setLocalPath(event.target.value)}
                  placeholder="h264"
                  className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="block text-xs uppercase tracking-wide text-slate-400">Username</span>
              <input
                value={localUsername}
                onChange={(event) => setLocalUsername(event.target.value)}
                placeholder="admin"
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs uppercase tracking-wide text-slate-400">Password</span>
              <input
                type="password"
                value={localPassword}
                onChange={(event) => setLocalPassword(event.target.value)}
                placeholder="Berreto@121"
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
              />
            </label>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">Resulting RTSP URL</p>
            <p className="mt-2 break-all font-mono text-[11px] text-emerald-300">{localRtspUrl}</p>
            <p className="mt-2 text-[10px] text-slate-500">
              Defaults match <code>rtsp://admin:Berreto@121@192.168.18.130:554/h264</code>. Update the values to match your LAN camera.
            </p>
          </div>

          {localError && <p className="text-xs text-red-400">{localError}</p>}
        </div>
      )}
    </div>
  );
}
