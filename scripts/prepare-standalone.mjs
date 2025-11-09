import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const webDir = path.join(repoRoot, 'apps', 'web');
const builtNextDir = path.join(webDir, '.next');
const builtStandaloneDir = path.join(builtNextDir, 'standalone');
const builtStaticDir = path.join(builtNextDir, 'static');
const rootNextDir = path.join(repoRoot, '.next');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyDir(src, dest) {
  await fs.rm(dest, { recursive: true, force: true });
  await ensureDir(path.dirname(dest));
  await fs.cp(src, dest, { recursive: true });
}

async function main() {
  const stats = await fs.stat(builtNextDir).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`Missing Next.js build output at ${builtNextDir}`);
  }

  const standaloneStats = await fs.stat(builtStandaloneDir).catch(() => null);
  if (!standaloneStats || !standaloneStats.isDirectory()) {
    throw new Error(`Missing Next.js standalone output at ${builtStandaloneDir}`);
  }

  await fs.rm(rootNextDir, { recursive: true, force: true });
  await ensureDir(rootNextDir);

  const outputStandaloneDir = path.join(rootNextDir, 'standalone');
  await copyDir(builtStandaloneDir, outputStandaloneDir);

  const outputStaticDir = path.join(rootNextDir, 'static');
  const staticStats = await fs.stat(builtStaticDir).catch(() => null);
  if (staticStats && staticStats.isDirectory()) {
    await copyDir(builtStaticDir, outputStaticDir);
  }

  const publicDir = path.join(webDir, 'public');
  const outputPublicDir = path.join(rootNextDir, 'public');
  const publicStats = await fs.stat(publicDir).catch(() => null);
  if (publicStats && publicStats.isDirectory()) {
    await copyDir(publicDir, outputPublicDir);
  }

  const launchServerPath = path.join(rootNextDir, 'server.js');
  const standaloneEntry = path.join('standalone', 'apps', 'web', 'server.js');
  const launcherSource = `const path = require('node:path');
const entry = path.join(__dirname, ${JSON.stringify(standaloneEntry)});
require(entry);
`;
  await fs.writeFile(launchServerPath, launcherSource, 'utf8');
}

main().catch((error) => {
  console.error('Failed to prepare standalone deployment output:', error);
  process.exit(1);
});
