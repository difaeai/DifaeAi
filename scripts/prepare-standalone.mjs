import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const webDir = path.join(repoRoot, 'apps', 'web');
const builtNextDir = path.join(webDir, '.next');
const rootNextDir = path.join(repoRoot, '.next');

async function main() {
  const stats = await fs.stat(builtNextDir).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`Missing Next.js build output at ${builtNextDir}`);
  }

  await fs.rm(rootNextDir, { recursive: true, force: true });
  await fs.cp(builtNextDir, rootNextDir, { recursive: true });

  const standaloneDir = path.join(rootNextDir, 'standalone');
  const entryPoint = path.join(standaloneDir, 'server.js');

  const entrySource = `const path = require('node:path');

const serverPath = path.join(__dirname, 'apps', 'web', 'server.js');
require(serverPath);
`;

  await fs.mkdir(standaloneDir, { recursive: true });
  await fs.writeFile(entryPoint, entrySource, 'utf8');
}

main().catch((error) => {
  console.error('Failed to prepare standalone deployment output:', error);
  process.exit(1);
});
