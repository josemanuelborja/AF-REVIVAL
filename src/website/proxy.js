// Reverse proxy: forwards authenticated requests to the game registration backend
const http = require('node:http');
const https = require('node:https');
const { backendErrorPage, injectBanner } = require('./views');

// Forward a request to the registration backend, injecting the banner on the register page
function proxyToBackend(req, res, options = {}) {
  const backend = new URL(process.env.REGISTRATION_BACKEND_URL);
  const client = backend.protocol === 'https:' ? https : http;

  // Copy the incoming headers and point them at the backend
  const headers = { ...req.headers };
  headers.host = backend.host;
  // Ask for uncompressed HTML so the banner can be injected
  headers['accept-encoding'] = 'identity';
  // Never leak the gateway session cookie to the backend
  if (headers.cookie) {
    headers.cookie = headers.cookie
      .split(';')
      .filter((part) => !part.trim().startsWith('af.sid'))
      .join(';');
    if (!headers.cookie.trim()) delete headers.cookie;
  }

  const proxyReq = client.request(
    {
      protocol: backend.protocol,
      hostname: backend.hostname,
      port: backend.port || (backend.protocol === 'https:' ? 443 : 80),
      path: req.originalUrl,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || '';
      const isHtml = contentType.includes('text/html');

      // Keep redirects on the gateway instead of leaking the backend URL
      const outHeaders = { ...proxyRes.headers };
      if (outHeaders.location && outHeaders.location.startsWith(backend.origin)) {
        outHeaders.location = outHeaders.location.slice(backend.origin.length) || '/';
      }

      // Rewrite backend HTML: add the banner and keep links on the gateway
      if (isHtml) {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          let html = Buffer.concat(chunks).toString('utf8');

          // Turn absolute backend URLs into gateway-relative URLs
          html = html.split(backend.origin).join('');
          if (options.banner) html = injectBanner(html);

          const body = Buffer.from(html, 'utf8');
          delete outHeaders['content-encoding'];
          delete outHeaders['content-length'];
          delete outHeaders['transfer-encoding'];
          delete outHeaders['content-security-policy'];

          res.writeHead(proxyRes.statusCode, outHeaders);
          res.end(body);
        });
        return;
      }

      // Everything else (CSS, JS, images, etc.) is streamed as-is
      res.writeHead(proxyRes.statusCode, outHeaders);
      proxyRes.pipe(res);
    },
  );

  proxyReq.setTimeout(15000, () => {
    proxyReq.destroy(new Error('Backend timeout'));
  });

  proxyReq.on('error', (error) => {
    console.error('Registration proxy error:', error.message);
    if (!res.headersSent) res.status(502).send(backendErrorPage());
    else res.end();
  });

  req.pipe(proxyReq);
}

module.exports = { proxyToBackend };
