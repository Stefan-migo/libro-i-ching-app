self.addEventListener("activate", event => {
 event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
 const {request} = event;
 const url = new URL(request.url);
 if (request.method !== "GET" || request.mode !== "navigate" ||
     url.origin !== self.location.origin || url.search) return;

 // The diary and the site's access checks always use the network.
 event.respondWith(fetch(request).catch(() => new Response(
  '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>I Ching · Sin conexión</title><body style="margin:2rem;font:1rem system-ui;background:#f6f2e8;color:#183631"><h1>Sin conexión</h1><p>Vuelve a conectarte para abrir el libro y tu diario.</p><a href="./">Volver a intentar</a></body></html>',
  {status:503, headers:{"Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store"}}
 )));
});
