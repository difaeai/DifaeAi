import type { ProbeCandidate } from '@/api/client';
import { useCameraStore } from '@/state/useCameraStore';

interface ProbeResultsListProps {
  candidates: ProbeCandidate[];
  onSelect: (candidate: ProbeCandidate) => void;
  isLoadingPreview: boolean;
}

export function ProbeResultsList({ candidates, onSelect, isLoadingPreview }: ProbeResultsListProps) {
  const selectedStreamUrl = useCameraStore((state) => state.selectedStreamUrl);
  const storeSelect = useCameraStore((state) => state.setSelectedStreamUrl);

  const handleSelect = (candidate: ProbeCandidate) => {
    storeSelect(candidate.url);
    onSelect(candidate);
  };

  return (
    <div className="mt-4 space-y-2">
      {candidates.length === 0 && <p className="text-sm text-slate-400">No candidates detected yet. Adjust network settings or try the bridge agent.</p>}
      {candidates.map((candidate) => {
        const isSelected = selectedStreamUrl === candidate.url;
        return (
          <button
            key={candidate.url}
            onClick={() => handleSelect(candidate)}
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
            }`}
            disabled={isLoadingPreview}
          >
            <div>
              <p className="font-medium text-slate-100">{candidate.protocol.toUpperCase()}</p>
              <p className="text-xs text-slate-400">{candidate.url}</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Confidence {(candidate.confidence * 100).toFixed(0)}%</p>
              <p>{candidate.verified ? 'Verified stream' : 'Unverified'}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
