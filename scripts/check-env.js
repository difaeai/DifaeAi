#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

function logOk(msg) { console.log('\x1b[32m✔\x1b[0m', msg); }
function logWarn(msg) { console.log('\x1b[33m!\x1b[0m', msg); }
function logErr(msg) { console.error('\x1b[31m✖\x1b[0m', msg); }

let failed = false;

// Node version
const nodeVersion = process.version;
logOk(`Node detected: ${nodeVersion}`);

// npm availability
const npm = spawnSync('npm', ['-v'], { encoding: 'utf8' });
if (npm.error) {
  logErr('npm not found. Please install Node.js (npm comes bundled) from https://nodejs.org');
  failed = true;
} else {
  logOk(`npm detected: ${npm.stdout.trim()}`);
}

// node_modules
const root = process.cwd();
if (!existsSync(path.join(root, 'node_modules'))){
  logWarn('node_modules not found. Run `npm ci` or `npm install` to install dependencies.');
  // do not mark as fatal here — we allow the install to be run separately or as a pre-launch task
} else {
  logOk('node_modules present');
}

// ffmpeg check (optional)
const ff = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (ff.error) {
  logWarn('ffmpeg not found on PATH. RTSP/video streaming features that spawn ffmpeg will not work until ffmpeg is installed.');
} else {
  const line = ff.stdout.split('\n')[0] || ff.stderr.split('\n')[0];
  logOk(`ffmpeg detected: ${line}`);
}

// Check if port 3000 is already in use (Windows / PowerShell friendly)
try {
  const netstat = spawnSync('netstat', ['-ano'], { encoding: 'utf8' });
  if (!netstat.error) {
    const lines = netstat.stdout.split('\n');
    const found = lines.find(l => l.includes(':3000') && (l.includes('LISTENING') || l.includes('LISTEN')) );
    if (found) {
      logWarn(`Port 3000 appears in use: ${found.trim()}`);
    } else {
      logOk('Port 3000 appears free');
    }
  }
} catch (e) {
  // ignore; netstat may not be available in some environments
}

if (failed) {
  logErr('\nEnvironment check failed. Install Node/npm and try again.');
  process.exit(1);
}

console.log('\nAll done. If node_modules is missing run `npm ci`.');
process.exit(0);
