import { spawn } from 'child_process';

export function checkStreamWithFfprobe(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const args = [
      '-v',
      'error',
      '-rtsp_transport',
      'tcp',
      '-select_streams',
      'v:0',
      '-count_frames',
      '-show_entries',
      'stream=nb_read_frames',
      '-of',
      'default=nokey=1:noprint_wrappers=1',
      url,
    ];

    const ffprobe = spawn('ffprobe', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let output = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        ffprobe.kill('SIGKILL');
        resolve(false);
      }
    }, timeoutMs);

    ffprobe.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    ffprobe.on('close', () => {
      if (finished) {
        return;
      }
      clearTimeout(timer);
      finished = true;
      const frames = Number(output.trim());
      resolve(Number.isFinite(frames) && frames > 0);
    });

    ffprobe.on('error', () => {
      if (!finished) {
        clearTimeout(timer);
        finished = true;
        resolve(false);
      }
    });
  });
}

export async function headRequest(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      requiresAuth: response.status === 401 || response.status === 403,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : 'unknown error',
      requiresAuth: false,
    };
  } finally {
    clearTimeout(timer);
  }
}
