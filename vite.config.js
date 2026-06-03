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
      name: 'local-api-endpoints',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.startsWith('/api/auth/login')) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body || '{}');
                const handler = (await import('./api/auth/login.js')).default;
                const mockRes = {
                  setHeader(name, value) {
                    res.setHeader(name, value);
                    return this;
                  },
                  status(code) {
                    res.statusCode = code;
                    return this;
                  },
                  json(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  end() {
                    res.end();
                  }
                };
                await handler({ method: 'POST', body: payload }, mockRes);
              } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else if (req.url.startsWith('/api/content')) {
            const handler = (await import('./api/content.js')).default;
            const mockRes = {
              setHeader(name, value) {
                res.setHeader(name, value);
                return this;
              },
              status(code) {
                res.statusCode = code;
                return this;
              },
              json(data) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
              end() {
                res.end();
              }
            };
            if (req.method === 'GET') {
              await handler({ method: 'GET' }, mockRes);
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const authHeader = req.headers.authorization || '';
                  await handler({ method: 'POST', body: payload, headers: { authorization: authHeader } }, mockRes);
                } catch (e) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
            }
          } else {
            next();
          }
        });
      }
    },
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
