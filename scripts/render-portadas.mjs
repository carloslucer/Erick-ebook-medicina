// Exporta cada .cover de assets/fuente/portadas.html a assets/img/<id>.png
// Uso: node scripts/render-portadas.mjs  (o PLAYWRIGHT_PATH=/ruta/a/playwright si está instalado global)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = pathToFileURL(path.join(root, 'assets/fuente/portadas.html')).href;
const out = path.join(root, 'assets/img');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1000, height: 1300 } });
await page.goto(src, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const el of await page.$$('.cover')) {
  const id = await el.getAttribute('id');
  await el.screenshot({ path: path.join(out, `${id}.png`) });
  console.log('ok', id);
}
await browser.close();
