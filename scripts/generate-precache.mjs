import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');
const indexHtml = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
const serviceWorkerPath = path.join(outputDirectory, 'service-worker.js');
const discoveredAssets = new Set();
const pendingAssets = [];

for (const match of indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
  if (/\.(?:js|css)$/.test(match[1])) pendingAssets.push(match[1]);
}

while (pendingAssets.length > 0) {
  const assetUrl = pendingAssets.pop();
  if (!assetUrl || discoveredAssets.has(assetUrl)) continue;
  discoveredAssets.add(assetUrl);

  const assetPath = path.join(outputDirectory, assetUrl.slice(1));
  const content = await readFile(assetPath, 'utf8');
  const references = assetUrl.endsWith('.js')
    ? [...content.matchAll(/\bfrom\s*["'](\.?\/[^"']+\.js)["']/g)]
    : [...content.matchAll(/url\((?:["']?)(\/assets\/[^)"']+)/g)];

  for (const reference of references) {
    const referencedUrl = reference[1].startsWith('/')
      ? reference[1]
      : new URL(reference[1], `https://precache.invalid${assetUrl}`).pathname;
    if (referencedUrl.startsWith('/assets/') && !discoveredAssets.has(referencedUrl)) {
      pendingAssets.push(referencedUrl);
    }
  }
}

const assetList = [...discoveredAssets].sort();
const cacheVersion = createHash('sha256')
  .update(assetList.join('\n'))
  .digest('hex')
  .slice(0, 12);
let serviceWorker = await readFile(serviceWorkerPath, 'utf8');
serviceWorker = serviceWorker.replace(
  "const CACHE_NAME = 'rizbandy-shell-build';",
  `const CACHE_NAME = 'rizbandy-shell-${cacheVersion}';`,
);
serviceWorker = serviceWorker.replace(
  'const PRECACHE_ASSETS = [];',
  `const PRECACHE_ASSETS = ${JSON.stringify(assetList)};`,
);

if (serviceWorker.includes("const CACHE_NAME = 'rizbandy-shell-build';") ||
    serviceWorker.includes('const PRECACHE_ASSETS = [];')) {
  throw new Error('Service worker precache placeholders were not replaced.');
}

await writeFile(serviceWorkerPath, serviceWorker);
console.log(`Prepared offline shell with ${assetList.length} versioned assets.`);
