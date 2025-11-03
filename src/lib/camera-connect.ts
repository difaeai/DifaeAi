export type CameraType = "" | "ip" | "dvr" | "mobile" | "usb" | "cloud";

export interface CameraConnectionResult {
  success: boolean;
  message: string;
  streamUrl?: string;
  candidates?: string[];
}

const DEFAULT_PORTS = ["", "554", "8554", "88", "80", "8000", "8080", "81"] as const;
const DEFAULT_RTSP_PATHS = [
  "/stream1",
  "/h264",
  "/videoMain",
  "/live.sdp",
  "/onvif1",
  "/",
  "/cam/realmonitor?channel=1&subtype=0",
  "/Streaming/Channels/1",
  "/live/ch0",
  "/live/main",
  "/live",
];
const DEFAULT_HTTP_PATHS = [
  "/video.cgi",
  "/videostream.cgi",
  "/mjpeg.cgi",
  "/videostream",
  "/live",
  "/",
  "/video1.mjpg",
  "/cgi-bin/video.jpg",
  "/axis-cgi/mjpg/video.cgi",
  "/img/video.mjpeg",
  "/mjpg/video.mjpg",
];
const V380_RTSP_PATHS = [
  "/av0_0",
  "/live/1",
  "/live/0",
  "/ch01/av_stream",
  "/channel=1&stream=0",
  "/user=admin&password=&channel=1&stream=0",
];
const V380_HTTP_PATHS = [
  "/live",
  "/video",
  "/video1",
  "/media/?action=stream",
  "/cgi-bin/guest/rtp",
];

type IpCandidateOptions = {
  username?: string;
  password?: string;
  preferredPorts?: Array<string | number>;
  extraCandidates?: string[];
};

const mergePortPreferences = (
  preferred?: Array<string | number>,
): string[] => {
  const seen = new Set<string>();
  const merged: string[] = [];

  const append = (port: string) => {
    if (seen.has(port)) return;
    seen.add(port);
    merged.push(port);
  };

  preferred?.forEach((p) => append(String(p)));
  DEFAULT_PORTS.forEach((p) => append(p));

  return merged;
};

export function buildIpCameraCandidates(host: string, options: IpCandidateOptions = {}): string[] {
  const username = options.username?.trim() ?? "";
  const password = options.password?.trim() ?? "";
  const auth = username
    ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ""}@`
    : "";

  const ports = mergePortPreferences(options.preferredPorts);
  const rtspPaths = [...DEFAULT_RTSP_PATHS, ...V380_RTSP_PATHS];
  const httpPaths = [...DEFAULT_HTTP_PATHS, ...V380_HTTP_PATHS];

  const result: string[] = [];
  const seen = new Set<string>();
  const push = (candidate: string) => {
    if (seen.has(candidate)) return;
    seen.add(candidate);
    result.push(candidate);
  };

  options.extraCandidates?.forEach(push);

  for (const port of ports) {
    const portSuffix = port ? `:${port}` : "";
    for (const path of rtspPaths) {
      const normalizedPath = path === "/" ? "" : path;
      push(`rtsp://${auth}${host}${portSuffix}${normalizedPath}`);
    }
  }

  for (const port of ports) {
    const portSuffix = port ? `:${port}` : "";
    for (const path of httpPaths) {
      const normalizedPath = path === "/" ? "" : path;
      push(`http://${auth}${host}${portSuffix}${normalizedPath}`);
    }
  }

  return result;
}

export async function testCameraConnection(cameraType: CameraType, formData: FormData): Promise<CameraConnectionResult> {
  const data = Object.fromEntries(formData.entries());
  console.log(`Testing connection for ${cameraType}`, data);

  await new Promise((resolve) => setTimeout(resolve, 500));

  const ipLike = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/; // simple IPv4 check
  const hostLike = /^([a-zA-Z0-9\-\.]+)$/;

  switch (cameraType) {
    case 'mobile': {
      if (data['mobile-ip'] && data['mobile-port']) {
        const streamUrl = `http://${data['mobile-ip']}:${data['mobile-port']}/video`;
        return { success: true, message: 'Attempting to connect to mobile camera.', streamUrl };
      }
      return { success: false, message: 'Missing IP Address or Port for mobile camera.' };
    }

    case 'dvr': {
      if (data['dvr-ip'] && data['dvr-port'] && data['dvr-user']) {
        const streamUrl = `rtsp://${data['dvr-user']}:${data['dvr-pass']}@${data['dvr-ip']}:${data['dvr-port']}/`;
        return { success: true, message: 'Attempting to connect to DVR/NVR system.', streamUrl };
      }
      return { success: false, message: 'Missing IP, Port, or Username for DVR/NVR.' };
    }

    case 'ip': {
      let input = (data['stream-url'] as string | null) || '';
      input = input.trim();

      // Validate IP address format
      if (!input) {
        return { success: false, message: 'Please enter your camera\'s IP address.' };
      }
      
      if (!ipLike.test(input)) {
        return { success: false, message: 'The IP address format is invalid. It should look like 192.168.1.xxx' };
      }

      // Build stream candidates for the IP
      const host = input;
      const user = data['stream-user'] ? String(data['stream-user']).trim() : '';
      const pass = data['stream-pass'] ? String(data['stream-pass']).trim() : '';

      const candidates = buildIpCameraCandidates(host, {
        username: user,
        password: pass,
      });

      return {
        success: true,
        message: 'Attempting to connect to IP camera using common stream paths...',
        candidates,
      };
    }

    case 'usb':
      // The permission itself is the test for USB webcams.
      return { success: true, message: 'Webcam permission granted.' };

    case 'cloud':
      // For cloud, we simulate an auth redirect. The "test" is just initiating it.
      return { success: true, message: 'Redirecting for authentication...' };

    default:
      return { success: false, message: 'Invalid camera type provided.' };
  }
}
