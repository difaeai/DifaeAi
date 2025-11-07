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
  const selectedStreamUrl = useCameraStore((state) => state.selectedStreamUrl);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [previewError, setPreviewError] = useState<string>();
  const [pairingCode, setPairingCode] = useState<string>();
  const [pairingError, setPairingError] = useState<string>();
  const [bridgeToken, setBridgeToken] = useState<string>();
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number>();
  const [isPairing, setIsPairing] = useState(false);
  const [isStartingBridge, setIsStartingBridge] = useState(false);

  useEffect(() => {
    setPreviewUrl(undefined);
    setPreviewError(undefined);
  }, [selectedStreamUrl]);

  const hlsUrl = useMemo(() => {
    if (!selectedStreamUrl) {
      return undefined;
    }
    const url = new URL(`/stream/${bridgeCameraId}/playlist.m3u8`, BRIDGE_ORIGIN);
    url.searchParams.set('sourceUrl', encodeURIComponent(selectedStreamUrl));
    return url.toString();
  }, [bridgeCameraId, selectedStreamUrl]);

  const handleTest = async () => {
    setPreviewUrl(undefined);
    setPreviewError(undefined);
    await mutateAsync(ipAddress);
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
          disabled={!ipAddress || isPending}
          className="rounded bg-emerald-500 px-4 py-2 font-medium text-slate-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
        >
          {isPending ? 'Probing…' : 'Test Connection'}
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

      {error && <div className="rounded border border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error.message}</div>}
      {data && (
        <ProbeResultsList
          candidates={data.candidates}
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
