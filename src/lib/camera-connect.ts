export type CameraType = "" | "ip" | "dvr" | "mobile" | "usb" | "cloud";

export interface CameraConnectionResult {
  success: boolean;
  message: string;
  streamUrl?: string;
  candidates?: string[];
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
      const auth = user ? `${encodeURIComponent(user)}${pass ? `:${encodeURIComponent(pass)}` : ''}@` : '';

      const ports = ['', '554', '8554', '88', '80'];
      const rtspPaths = [
        '/stream1', '/h264', '/videoMain', '/live.sdp', '/onvif1', '/',
        // Common vendor paths
        '/cam/realmonitor?channel=1&subtype=0',  // Dahua
        '/Streaming/Channels/1',  // Hikvision
        '/live/ch0',  // Various
        '/live/main',  // Various
        '/live'  // Common
      ];
      const httpPaths = [
        '/video.cgi', '/videostream.cgi', '/mjpeg.cgi', '/videostream', '/live', '/',
        // Common vendor paths
        '/video1.mjpg',  // Various MJPEG
        '/cgi-bin/video.jpg',  // Common snapshot
        '/axis-cgi/mjpg/video.cgi',  // Axis
        '/img/video.mjpeg',  // Common MJPEG
        '/mjpg/video.mjpg'  // Common MJPEG
      ];

      // Vendor-specific additions: V380 family / V380E common paths
      const v380Rtsp = ['/av0_0', '/live/1', '/live/0', '/ch01/av_stream', '/channel=1&stream=0', '/user=admin&password=&channel=1&stream=0'];
      const v380Http = ['/live', '/video', '/video1', '/media/?action=stream', '/cgi-bin/guest/rtp'];

      // Append V380 paths to candidate lists (low risk - attempts many paths)
      for (const p of v380Rtsp) rtspPaths.push(p);
      for (const p of v380Http) httpPaths.push(p);

      const candidates: string[] = [];

      // RTSP candidates (with and without explicit port)
      for (const port of ports) {
        const portSuffix = port ? `:${port}` : '';
        for (const p of rtspPaths) {
          const path = p === '/' ? '' : p;
          candidates.push(`rtsp://${auth}${host}${portSuffix}${path}`);
        }
      }

      // HTTP MJPEG / CGI candidates
      for (const port of ports) {
        const portSuffix = port ? `:${port}` : '';
        for (const p of httpPaths) {
          const path = p === '/' ? '' : p;
          candidates.push(`http://${auth}${host}${portSuffix}${path}`);
        }
      }

      // Deduplicate candidates while preserving order
      const seen = new Set<string>();
      const uniq = candidates.filter((c) => {
        if (seen.has(c)) return false;
        seen.add(c);
        return true;
      });

      return { 
        success: true, 
        message: 'Attempting to connect to IP camera using common stream paths...', 
        candidates: uniq 
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