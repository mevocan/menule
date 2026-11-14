#!/bin/sh
# Container açılışı: önbellekleri oluştur, migration'ları uygula, servisleri başlat.
set -e
cd /var/www/html

# storage/app kalıcı volume; ilk açılışta boş gelebilir.
mkdir -p storage/app/public storage/app/private

php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan migrate --force
php artisan storage:link --force

# Yukarıdaki komutlar root olarak çalıştı; php-fpm ve worker (www-data) yazabilsin.
chown -R www-data:www-data storage bootstrap/cache

exec /usr/bin/supervisord -c /etc/supervisord.conf
