import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('apps/web/.next');
const destination = resolve('.next');

if (!existsSync(source)) {
  throw new Error(`Expected Next.js build output at ${source}, but the directory was not found.`);
}

if (existsSync(destination)) {
  rmSync(destination, { recursive: true, force: true });
}

cpSync(source, destination, { recursive: true });

const nestedStandalone = resolve('.next/standalone/apps/web/.next');
const expectedStandalone = resolve('.next/standalone/.next');

if (existsSync(nestedStandalone) && !existsSync(expectedStandalone)) {
  cpSync(nestedStandalone, expectedStandalone, { recursive: true });
}
