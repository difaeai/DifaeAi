import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const webDir = path.join(repoRoot, 'apps', 'web');
const builtNextDir = path.join(webDir, '.next');
const rootNextDir = path.join(repoRoot, '.next');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyDir(src, dest) {
  await fs.rm(dest, { recursive: true, force: true });
  await ensureDir(path.dirname(dest));
  await fs.cp(src, dest, { recursive: true });
}

async function writeStandaloneServer(standaloneDir) {
  const serverPath = path.join(standaloneDir, 'server.js');
  const packageJsonPath = path.join(standaloneDir, 'package.json');
  const serverSource = `const { createServer } = require('node:http');
const { parse } = require('node:url');
const path = require('node:path');
const next = require('next');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const projectDir = path.join(__dirname, '..', '..', 'apps', 'web');
const app = next({ dev: false, dir: projectDir });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '8080', 10);
const host = '0.0.0.0';

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req?.url || '', true);
      handle(req, res, parsedUrl);
    }).listen(port, host, () => {
      console.log('Next.js server ready on port ' + port);
    });
  })
  .catch((err) => {
    console.error('Error starting Next.js server', err);
    process.exit(1);
  });
`;

  await fs.mkdir(standaloneDir, { recursive: true });
  await fs.writeFile(serverPath, serverSource, 'utf8');
  const pkg = { type: 'commonjs' };
  await fs.writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

async function main() {
  const stats = await fs.stat(builtNextDir).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`Missing Next.js build output at ${builtNextDir}`);
  }

  await fs.rm(rootNextDir, { recursive: true, force: true });
  await ensureDir(rootNextDir);
  await fs.cp(builtNextDir, rootNextDir, { recursive: true });

  const standaloneDir = path.join(rootNextDir, 'standalone');
  await fs.rm(standaloneDir, { recursive: true, force: true });
  await ensureDir(standaloneDir);

  const standaloneNextDir = path.join(standaloneDir, '.next');
  await copyDir(builtNextDir, standaloneNextDir);

  await writeStandaloneServer(standaloneDir);
}

main().catch((error) => {
  console.error('Failed to prepare standalone deployment output:', error);
  process.exit(1);
});
