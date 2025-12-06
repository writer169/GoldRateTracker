const CACHE_NAME = 'gold-rate-v1';
const API_CACHE = 'gold-rate-api-v1';

// Файлы для кэширования при установке
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker установлен');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Активируем новый SW сразу
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker активирован');
  
  event.waitUntil(
    Promise.all([
      // Очистка старых кэшей
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
              console.log('Удаление старого кэша:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Берем контроль над всеми клиентами
      self.clients.claim()
    ])
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Для API запросов используем Network First стратегию
  if (url.hostname === 'm-lombard.kz') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Клонируем ответ для кэша
          const responseClone = response.clone();
          
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, возвращаем из кэша
          return caches.match(request);
        })
    );
    return;
  }

  // Для статических файлов используем Cache First стратегию
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Не кэшируем не-успешные ответы
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// Обработка фоновой синхронизации (опционально)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rates') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации
      fetch('https://m-lombard.kz/ru/api/admin/purities/?format=json')
        .then(response => response.json())
        .then(data => {
          console.log('Фоновая синхронизация выполнена:', data);
        })
        .catch(err => {
          console.log('Ошибка фоновой синхронизации:', err);
        })
    );
  }
});

// Периодическая фоновая синхронизация (Periodic Background Sync API)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-rate-update') {
    event.waitUntil(
      fetch('https://m-lombard.kz/ru/api/admin/purities/?format=json')
        .then(response => response.json())
        .then(data => {
          console.log('Периодическое обновление выполнено:', data);
          
          // Можно отправить уведомление пользователю
          self.registration.showNotification('Gold Rate Monitor', {
            body: 'Цены на золото обновлены',
            icon: '/icon-192.png',
            badge: '/icon-192.png'
          });
        })
        .catch(err => {
          console.log('Ошибка периодического обновления:', err);
        })
    );
  }
});