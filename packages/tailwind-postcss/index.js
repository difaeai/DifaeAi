const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const postcss = require('postcss');
const fg = require('fast-glob');
const tailwind = require('tailwindcss');

const TOKEN_REGEX = /[!A-Za-z0-9\-:\/\[\]\.%=_]+/g;
const CONFIG_CANDIDATES = [
  'tailwind.config.js',
  'tailwind.config.cjs',
  'tailwind.config.mjs'
];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findConfig(startDir) {
  let current = startDir;
  while (true) {
    for (const candidate of CONFIG_CANDIDATES) {
      const fullPath = path.join(current, candidate);
      if (await fileExists(fullPath)) {
        return fullPath;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function loadConfigModule(configPath) {
  if (!configPath) {
    return {};
  }
  const ext = path.extname(configPath);
  if (ext === '.mjs') {
    const mod = await import(pathToFileURL(configPath).href);
    return mod.default ?? mod;
  }
  const required = require(configPath);
  return required?.default ?? required;
}

function mergeConfigs(baseConfig, overrideConfig) {
  if (!overrideConfig || typeof overrideConfig !== 'object') {
    return baseConfig;
  }
  return { ...baseConfig, ...overrideConfig };
}

function extractContentSpecs(config) {
  const files = [];
  const raw = [];
  if (!config || !config.content) {
    return { files, raw };
  }

  function addEntry(entry) {
    if (!entry) return;
    if (typeof entry === 'string') {
      files.push(entry);
      return;
    }
    if (Array.isArray(entry)) {
      for (const item of entry) {
        addEntry(item);
      }
      return;
    }
    if (typeof entry === 'object') {
      if (entry.files) {
        addEntry(entry.files);
      }
      if (entry.raw) {
        if (typeof entry.raw === 'string') {
          raw.push(entry.raw);
        } else if (Array.isArray(entry.raw)) {
          for (const value of entry.raw) {
            if (typeof value === 'string') {
              raw.push(value);
            }
          }
        }
      }
    }
  }

  if (Array.isArray(config.content)) {
    for (const item of config.content) {
      addEntry(item);
    }
  } else if (typeof config.content === 'object') {
    addEntry(config.content.files ?? config.content);
    if (config.content.raw) {
      addEntry({ raw: config.content.raw });
    }
  }

  return { files, raw };
}

async function readCandidatesFromFile(filePath, designSystem, accumulator) {
  const content = await fs.readFile(filePath, 'utf8');
  const matches = content.match(TOKEN_REGEX);
  if (!matches) {
    return;
  }
  for (const token of matches) {
    try {
      const parsed = designSystem.parseCandidate(token);
      if (parsed && parsed.length > 0) {
        accumulator.add(token);
      }
    } catch {
      // Ignore invalid candidates.
    }
  }
}

async function collectCandidates(contentGlobs, rawEntries, cwd, designSystem) {
  const candidates = new Set();
  if (contentGlobs.length > 0) {
    const files = await fg(contentGlobs, {
      cwd,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/dist/**', '**/build/**'],
    });
    for (const file of files) {
      await readCandidatesFromFile(file, designSystem, candidates);
    }
  }
  for (const raw of rawEntries) {
    const matches = raw.match(TOKEN_REGEX);
    if (!matches) continue;
    for (const token of matches) {
      try {
        const parsed = designSystem.parseCandidate(token);
        if (parsed && parsed.length > 0) {
          candidates.add(token);
        }
      } catch {
        // Ignore invalid candidates from raw entries.
      }
    }
  }
  return Array.from(candidates);
}

function createModuleLoader(configDir, configPath) {
  const resolvePaths = [];
  if (configDir) {
    resolvePaths.push(configDir);
  }
  if (configPath) {
    resolvePaths.push(path.dirname(configPath));
  }
  resolvePaths.push(process.cwd());
  const defaultRequire = createRequire(__filename);

  return async function loadModule(id, base) {
    const search = [];
    if (base) search.push(base);
    search.push(...resolvePaths);
    let resolved;
    if (configPath && (id === 'tailwind.config.js' || id === './tailwind.config.js')) {
      resolved = configPath;
    }
    for (const candidate of search) {
      if (resolved) break;
      try {
        resolved = defaultRequire.resolve(id, { paths: [candidate] });
        break;
      } catch {
        // continue searching
      }
    }
    if (!resolved) {
      resolved = defaultRequire.resolve(id);
    }
    const imported = await import(pathToFileURL(resolved).href);
    return {
      path: resolved,
      base: path.dirname(resolved),
      module: imported.default ?? imported,
    };
  };
}

function createStylesheetLoader(configDir) {
  const basePaths = [];
  if (configDir) {
    basePaths.push(configDir);
  }
  basePaths.push(process.cwd());
  const defaultRequire = createRequire(__filename);

  return async function loadStylesheet(id, base) {
    const search = [];
    if (base) search.push(base);
    search.push(...basePaths);
    let resolved;
    for (const candidate of search) {
      try {
        resolved = defaultRequire.resolve(id, { paths: [candidate] });
        break;
      } catch {
        // keep searching
      }
    }
    if (!resolved) {
      resolved = defaultRequire.resolve(id);
    }
    const contents = await fs.readFile(resolved, 'utf8');
    return {
      path: resolved,
      base: path.dirname(resolved),
      contents,
    };
  };
}

module.exports = function tailwindcssPostcss(userOptions = {}) {
  const normalized = typeof userOptions === 'string' ? { config: userOptions } : userOptions ?? {};

  return {
    postcssPlugin: '@tailwindcss/postcss',
    async Once(root) {
      const cssFile = root.source && root.source.input ? root.source.input.file : null;
      const cssDir = cssFile ? path.dirname(cssFile) : process.cwd();

      const configOverride = normalized.config;
      const configPath = typeof configOverride === 'string'
        ? path.resolve(cssDir, configOverride)
        : await findConfig(cssDir);

      const fileConfig = await loadConfigModule(configPath);
      const inlineConfig = configOverride && typeof configOverride === 'object' && !Array.isArray(configOverride)
        ? configOverride
        : {};
      const mergedConfig = mergeConfigs(fileConfig, inlineConfig);
      const configDir = configPath ? path.dirname(configPath) : cssDir;

      const moduleLoader = createModuleLoader(configDir, configPath);
      const stylesheetLoader = createStylesheetLoader(configDir);
      const compileOptions = {
        base: configDir,
        loadModule: moduleLoader,
        loadStylesheet: stylesheetLoader,
        config: mergedConfig,
      };

      const configDirective = configPath
        ? `@config "${path.relative(configDir, configPath) || path.basename(configPath)}";\n`
        : '';
      const sourceCss = configDirective + root.toString();

      const designSystem = await tailwind.__unstable__loadDesignSystem(sourceCss, compileOptions);
      const { files: contentGlobs, raw } = extractContentSpecs(mergedConfig);
      const candidateGlobs = contentGlobs.map((pattern) =>
        path.isAbsolute(pattern) ? pattern : path.join(configDir, pattern)
      );
      const candidates = await collectCandidates(candidateGlobs, raw, configDir, designSystem);
      const { build } = await tailwind.compile(sourceCss, compileOptions);
      const cssOutput = build(candidates);

      const parsed = postcss.parse(cssOutput, { from: root.source?.input.file });
      root.removeAll();
      root.append(parsed.nodes);
    },
  };
};

module.exports.postcss = true;
