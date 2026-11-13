
import fs from 'node:fs';
import path from 'node:path';

const DIST = './dist';
const BASE = '/jovenesladp';

const EXTENSIONS = /\.(html|css|js|mjs)$/i;

function processDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.error(`No existe el directorio: ${directory}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      processDirectory(filePath);
      continue;
    }

    if (!EXTENSIONS.test(entry.name)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Evitar duplicar el prefijo si ya existe.
    content = content.replace(
      /(["'(=])\/(?!jovenesladp\/)(images|icons)\//g,
      `$1${BASE}/$2/`
    );

    fs.writeFileSync(filePath, content, 'utf8');
  }
}

processDirectory(DIST);

console.log('Rutas ajustadas correctamente para GitHub Pages.');
