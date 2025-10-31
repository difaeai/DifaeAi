
import express from 'express';
import http from 'http';
import next from 'next';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import url from 'url';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  // Set up WebSocket server for video streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/stream' });

  wss.on('connection', (ws, req) => {
    const { query } = url.parse(req.url || '', true);
    const rtspUrl = query.rtsp_url as string;

    if (!rtspUrl) {
      console.log('RTSP URL is required');
      ws.close(1008, 'RTSP URL required');
      return;
    }
    
    console.log(`Client connected for stream: ${rtspUrl}`);

    const ffmpeg = spawn('ffmpeg', [
      '-i',
      rtspUrl,
      '-f',
      'mpegts',
      '-codec:v',
      'mpeg1video',
      '-s',
      '1280x720',
      '-b:v',
      '1000k',
      '-bf',
      '0',
      '-r', 
      '30',
      '-'
    ]);

    ffmpeg.stdout.on('data', (data) => {
      ws.send(data);
    });

    ffmpeg.stderr.on('data', (data) => {
      console.error(`FFMPEG Error: ${data.toString()}`);
    });
    
    ffmpeg.on('close', (code) => {
      console.log(`FFMPEG process closed with code ${code}`);
      ws.close();
    });

    ws.on('close', () => {
      console.log('Client disconnected, stopping ffmpeg stream.');
      ffmpeg.kill();
    });
  });

  // Handle all other requests with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    // DO NOT print a "Ready on" message. The hosting environment detects this automatically.
  });

}).catch(err => {
    console.error('Error starting server', err);
    process.exit(1);
});
