// Exporta docs/fuente/pendientes-erick.html a docs/Pendientes-Erick.pdf
// Uso: node scripts/render-pendientes.mjs  (o PLAYWRIGHT_PATH=/ruta/a/playwright si está instalado global)
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(root, 'docs/fuente/pendientes-erick.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(root, 'docs/Pendientes-Erick.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('ok docs/Pendientes-Erick.pdf');
