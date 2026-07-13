// Service Worker do Zait Pay / Voltz Pay
// Estratégia: cacheia só o "shell" do app (HTML/CSS/JS/ícones) para abrir rápido
// e funcionar offline na parte visual. Chamadas para a API (dados financeiros)
// NUNCA são servidas do cache — sempre vão direto pra rede, pra nunca mostrar
// saldo/extrato desatualizado.

const CACHE_VERSION = 'zaitpay-shell-v1';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './api-client.js',
  './api-config.js',
  './cache-manager.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './image/zait-s-fundo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isApiRequest(url) {
  // Qualquer requisição que não seja para o mesmo domínio do painel (frontend)
  // é considerada chamada de API/backend e não deve ser cacheada.
  return url.origin !== self.location.origin;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // nunca intercepta POST/PUT/DELETE (transações)

  const url = new URL(req.url);
  if (isApiRequest(url)) return; // deixa passar direto pra rede, sem cache

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      // Cache-first pro shell abrir instantâneo; atualiza em segundo plano.
      return cached || network;
    })
  );
});
