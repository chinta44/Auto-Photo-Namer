import fs from 'fs';
import path from 'path';

const icons = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/base64-icons.json'), 'utf8'));

const htmlPath = path.join(process.cwd(), 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const oldIconsRegex = /<!-- Genuine Multi-Res ICO[\s\S]*?<link rel="icon" type="image\/png" href="\/favicon\.png\?v=1\.6\.0" \/>/;

const newIconsSection = `<!-- Fail-safe Data URI Icons (Git-proof & Zero-Corruption Guaranteed v1.6.1) -->
    <link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,${icons.b32}" />
    <link rel="icon" type="image/png" sizes="16x16" href="data:image/png;base64,${icons.b16}" />
    <link rel="apple-touch-icon" sizes="180x180" href="data:image/png;base64,${icons.b180}" />

    <!-- Static File Fallbacks -->
    <link rel="manifest" href="/manifest.json?v=1.6.1" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico?v=1.6.1" />
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=1.6.1" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=1.6.1" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=1.6.1" />
    <link rel="icon" type="image/png" href="/favicon.png?v=1.6.1" />`;

html = html.replace(oldIconsRegex, newIconsSection);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully embedded Data URIs into index.html');
