// Rasterize the SVG masters into the 1024px PNGs @capacitor/assets expects.
// ../icon.svg is the full icon (also the web/PWA icon); assets/icon-foreground.svg
// and assets/icon-background.svg are the two adaptive-icon layers, drawn on a
// 108-unit canvas with the glyph already inside the safe zone (central 66/108),
// so they are rendered 1:1 — no rescaling here.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';

const read = p => readFileSync(new URL(p, import.meta.url));
mkdirSync('assets', { recursive: true });   // the PNGs are ignored; the SVG masters are tracked

const render = (svg, out) => sharp(svg, { density: 300 }).resize(1024, 1024).png().toFile(out);
await render(read('../icon.svg'), 'assets/icon-only.png');                       // legacy launchers
await render(read('./assets/icon-background.svg'), 'assets/icon-background.png');
await render(read('./assets/icon-foreground.svg'), 'assets/icon-foreground.png');

console.log('icon sources written to assets/');
