
import fs from 'node:fs';
import path from 'node:path';

const DIST = './dist';
const BASE = '/jovenesladp';

function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      processDirectory(filePath);
      continue;
    }

    if (!/\.(html|css|js|mjs)$/.test(entry.name)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(
      /(["'(=])\/(images|icons)\//g,
      `$1${BASE}/$2/`
    );

    fs.writeFileSync(filePath, content);
  }
}

processDirectory(DIST);

console.log('Rutas de imágenes e iconos ajustadas para GitHub Pages.');
