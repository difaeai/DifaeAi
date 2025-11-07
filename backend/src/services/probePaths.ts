const COMMON_RTSP_PATHS = [
  '/',
  '/stream1',
  '/h264',
  '/h265',
  '/live.sdp',
  '/profile2/media.smp',
  '/axis-media/media.amp',
  '/cam/realmonitor?channel=1&subtype=0',
  '/live/ch00_0',
  '/h264/ch1/main/av_stream',
];

export const MJPEG_PATHS = ['/video.cgi', '/mjpeg', '/cgi-bin/mjpeg?channel=0&subtype=0'];

export function buildRtspUrls(host: string, type: string) {
  const sanitized = host.replace(/\/+$/, '');
  return COMMON_RTSP_PATHS.map((path) => `rtsp://${sanitized}${path}`);
}
