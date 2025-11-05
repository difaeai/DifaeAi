const apiBase = window.location.origin.replace(/:\d+$/, ':8088');
const tokenForm = document.getElementById('token-form');
const tokenOutput = document.getElementById('token-output');
const hlsVideo = document.getElementById('hls-video');
const webrtcStatus = document.getElementById('webrtc-status');
const startWebrtcBtn = document.getElementById('start-webrtc');
const webrtcVideo = document.getElementById('webrtc-video');

let playbackInfo = null;
let janus = null;
let streamingPlugin = null;
let janusSessionServer = null;
let janusInitPromise = null;

const JanusLib = window.Janus;

function ensureJanusInit() {
  if (!JanusLib) {
    return Promise.reject(new Error('Janus library not loaded'));
  }
  if (!janusInitPromise) {
    janusInitPromise = new Promise((resolve) => {
      JanusLib.init({
        debug: false,
        callback: resolve,
      });
    });
  }
  return janusInitPromise;
}

async function ensureJanusSession(serverUrl, token) {
  await ensureJanusInit();
  if (janus && janusSessionServer === serverUrl) {
    return janus;
  }
  if (janus) {
    janus.destroy({ noRequest: true });
    janus = null;
    streamingPlugin = null;
  }
  return new Promise((resolve, reject) => {
    janus = new JanusLib({
      server: serverUrl,
      token,
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      success: () => {
        janusSessionServer = serverUrl;
        resolve(janus);
      },
      error: (err) => {
        janus = null;
        janusSessionServer = null;
        reject(err);
      },
      destroyed: () => {
        janus = null;
        janusSessionServer = null;
        streamingPlugin = null;
        webrtcStatus.textContent = 'Session destroyed';
      },
    });
  });
}

async function attachStreamingPlugin(mountpoint, janusToken) {
  return new Promise((resolve, reject) => {
    janus.attach({
      plugin: 'janus.plugin.streaming',
      success: (pluginHandle) => {
        streamingPlugin = pluginHandle;
        webrtcStatus.textContent = 'Streaming plugin attached';
        const body = { request: 'watch', alias: mountpoint };
        if (janusToken) body.token = janusToken;
        pluginHandle.send({ message: body });
        resolve(pluginHandle);
      },
      error: (err) => {
        reject(err);
      },
      onmessage: (msg, jsep) => {
        if (msg?.error) {
          webrtcStatus.textContent = `Streaming error: ${msg.error}`;
          return;
        }
        const result = msg?.result;
        if (result?.status) {
          webrtcStatus.textContent = `Stream status: ${result.status}`;
        }
        if (jsep) {
          streamingPlugin.createAnswer({
            jsep,
            media: { audioSend: false, videoSend: false, audioRecv: true, videoRecv: true },
            success: (jsepAnswer) => {
              const startBody = { request: 'start' };
              streamingPlugin.send({ message: startBody, jsep: jsepAnswer });
            },
            error: (err) => {
              webrtcStatus.textContent = `Answer error: ${err}`;
            },
          });
        }
      },
      onremotestream: (stream) => {
        JanusLib.attachMediaStream(webrtcVideo, stream);
        webrtcStatus.textContent = 'WebRTC stream playing';
      },
      oncleanup: () => {
        streamingPlugin = null;
        webrtcStatus.textContent = 'Stream cleaned up';
      },
    });
  });
}

async function startWebrtcPlayback() {
  if (!playbackInfo) {
    alert('Request a playback token first.');
    return;
  }
  if (!JanusLib || !JanusLib.isWebrtcSupported()) {
    alert('WebRTC not supported in this browser or Janus library missing.');
    return;
  }
  startWebrtcBtn.disabled = true;
  webrtcStatus.textContent = 'Connecting to Janus...';
  try {
    await ensureJanusSession(playbackInfo.playback.webrtc, playbackInfo.token);
    await attachStreamingPlugin(playbackInfo.mountpoint, playbackInfo.token);
  } catch (error) {
    console.error('Janus connection failed', error);
    webrtcStatus.textContent = `Janus error: ${error.message ?? error}`;
  } finally {
    startWebrtcBtn.disabled = false;
  }
}

async function requestToken(cameraId) {
  const res = await fetch(`${apiBase}/streams/${cameraId}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scope: ['webrtc', 'hls'] }),
  });
  if (!res.ok) throw new Error('Failed to request token');
  return res.json();
}

tokenForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(tokenForm);
  const cameraId = data.get('cameraId');
  try {
    playbackInfo = await requestToken(cameraId);
    tokenOutput.textContent = JSON.stringify(playbackInfo, null, 2);
    setupHls(playbackInfo.playback.hls);
    webrtcStatus.textContent = 'Token ready; click "Start WebRTC" when Janus mount is live.';
  } catch (error) {
    tokenOutput.textContent = error.message;
  }
});

function setupHls(url) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(hlsVideo);
  } else if (hlsVideo.canPlayType('application/vnd.apple.mpegurl')) {
    hlsVideo.src = url;
  } else {
    console.warn('HLS not supported in this browser');
  }
}

startWebrtcBtn.addEventListener('click', () => {
  startWebrtcPlayback();
});
