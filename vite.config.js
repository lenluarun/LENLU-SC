import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: 'src',
  plugins: [
    viteSingleFile(),
    {
      name: 'copy-to-destinations',
      closeBundle() {
        const outPath = resolve(__dirname, 'src/dist/index.html');
        
        // Wait for next tick to ensure build finished write ops
        setTimeout(() => {
          if (fs.existsSync(outPath)) {
            // Copy to root
            fs.copyFileSync(outPath, resolve(__dirname, 'index.html'));
            console.log('Copied compiled index.html to root.');

            // Copy to Android assets folder
            const androidDest = resolve(__dirname, 'appp/src/main/assets/index.html');
            const androidDir = dirname(androidDest);
            if (!fs.existsSync(androidDir)) {
              fs.mkdirSync(androidDir, { recursive: true });
            }
            fs.copyFileSync(outPath, androidDest);
            console.log('Copied compiled index.html to android assets.');
          } else {
            console.error('Build output index.html not found at: ' + outPath);
          }
        }, 100);
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 100000000, // force inline of everything
    chunkSizeWarningLimit: 100000
  }
});
