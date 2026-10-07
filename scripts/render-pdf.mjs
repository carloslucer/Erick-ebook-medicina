// Exporta un HTML de docs/fuente/ a PDF en docs/
// Uso: node scripts/render-pdf.mjs <nombre-fuente> <Nombre-Salida.pdf>
//   ej: node scripts/render-pdf.mjs pendientes-erick Pendientes-Erick.pdf
// (o PLAYWRIGHT_PATH=/ruta/a/playwright si está instalado global)
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('Uso: node scripts/render-pdf.mjs <fuente> <salida.pdf>'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(root, 'docs/fuente', `${src}.html`)).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(root, 'docs', out), format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('ok docs/' + out);
