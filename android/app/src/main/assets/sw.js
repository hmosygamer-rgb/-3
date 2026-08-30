const CACHE='qareeb-v4';
const ASSETS=['./','./index.html','./styles.css','./app.js','./qareeb-logo.png','./manifest.webmanifest','./vendor/qrcode.js','./vendor/jsQR.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(res=>{if(new URL(event.request.url).origin===location.origin){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return res;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));});
