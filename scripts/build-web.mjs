#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const webDir = join('apps', 'web');

const buildResult = spawnSync('next', ['build', webDir], {
  stdio: 'inherit',
  env: process.env
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const rootManifest = resolve('.next', 'standalone', '.next', 'routes-manifest.json');
if (existsSync(rootManifest)) {
  process.exit(0);
}

const appOutput = resolve(webDir, '.next');
const appManifest = resolve(appOutput, 'standalone', '.next', 'routes-manifest.json');

if (!existsSync(appManifest)) {
  console.error('Next.js build did not produce the expected routes manifest.');
  console.error(`Checked: ${rootManifest}`);
  console.error(`Checked: ${appManifest}`);
  process.exit(1);
}

rmSync(resolve('.next'), { recursive: true, force: true });
cpSync(appOutput, resolve('.next'), { recursive: true });

if (!existsSync(rootManifest)) {
  console.error(`Failed to materialize routes manifest at ${rootManifest}`);
  process.exit(1);
}
