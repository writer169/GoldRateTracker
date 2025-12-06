import { useEffect } from 'react';

export const usePWANotification = () => {
  useEffect(() => {
    // Проверяем, запущено ли приложение как PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isPWA) {
      // Запрашиваем разрешение на уведомления при первом запуске
      // Это уберет системное уведомление Android
      if ('Notification' in window && Notification.permission === 'default') {
        // Небольшая задержка, чтобы пользователь увидел приложение
        setTimeout(() => {
          Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
            
            // Если разрешено, можно показать приветственное уведомление
            if (permission === 'granted') {
              // Отправляем тихое уведомление, чтобы система убрала свое
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification('GoldRate Monitor', {
                    body: 'Приложение готово к работе',
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'welcome',
                    silent: true, // Тихое уведомление
                    requireInteraction: false
                  });
                  
                  // Автоматически закрываем через 2 секунды
                  setTimeout(() => {
                    registration.getNotifications({ tag: 'welcome' }).then(notifications => {
                      notifications.forEach(notification => notification.close());
                    });
                  }, 2000);
                });
              }
            }
          });
        }, 1000);
      }

      // Сохраняем, что приложение было запущено
      localStorage.setItem('pwa_launched', 'true');
      localStorage.setItem('pwa_first_launch', new Date().toISOString());
    }

    // Обработка изменения display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        console.log('Приложение запущено в standalone режиме');
      }
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  return null;
};