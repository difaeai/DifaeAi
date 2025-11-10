const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

const candidateEntries = [
  path.join(projectRoot, '.next', 'standalone', 'server.js'),
  path.join(projectRoot, '.next', 'standalone', 'apps', 'web', 'server.js'),
  path.join(projectRoot, '.next', 'server.js'),
  path.join(projectRoot, 'apps', 'web', '.next', 'standalone', 'server.js'),
  path.join(projectRoot, 'apps', 'web', '.next', 'standalone', 'apps', 'web', 'server.js')
];

const resolvedEntry = candidateEntries.find((filePath) => fs.existsSync(filePath));

if (!resolvedEntry) {
  const relativeCandidates = candidateEntries.map((filePath) =>
    path.relative(projectRoot, filePath) || '.'
  );

  console.error(
    'Unable to locate a Next.js standalone server entry point. The build output is expected to contain one of the following files:'
  );
  relativeCandidates.forEach((candidate) => {
    console.error(` - ${candidate}`);
  });
  process.exit(1);
}

console.log(`Starting Next.js standalone server from: ${path.relative(projectRoot, resolvedEntry)}`);

require(resolvedEntry);
