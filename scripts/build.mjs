import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html', 'src', 'public', 'data', 'manifest.webmanifest', 'sw.js']) await cp(file, `dist/${file}`, { recursive: true });
await writeFile('dist/.nojekyll', '');
console.log('Statik uygulama dist/ klasörüne hazırlandı.');
