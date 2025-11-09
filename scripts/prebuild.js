const fs = require('node:fs/promises');
const path = require('node:path');

async function removeNestedNodeModules() {
  const webNodeModules = path.join(__dirname, '..', 'apps', 'web', 'node_modules');

  try {
    await fs.rm(webNodeModules, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to clean ${webNodeModules}:`, error);
  }
}

removeNestedNodeModules();
