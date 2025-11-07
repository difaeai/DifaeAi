import { useMutation } from '@tanstack/react-query';
import { probeCamera } from '@/api/client';
import { useCameraStore } from '@/state/useCameraStore';

export function useProbe() {
  const cameraType = useCameraStore((state) => state.cameraType);

  return useMutation({
    mutationKey: ['probe', cameraType],
    mutationFn: async (ip: string) => {
      return probeCamera(ip, cameraType, cameraType !== 'cloud' && cameraType !== 'mobile');
    },
  });
}
