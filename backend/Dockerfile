# Production imajı (Coolify). Yerel geliştirme: kökteki docker-compose.yml.
# Tek container: nginx + php-fpm + kuyruk worker'ı (supervisord).
FROM php:8.4-fpm-alpine

RUN apk add --no-cache nginx supervisor libpq libzip \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS postgresql-dev libzip-dev \
    && docker-php-ext-install pdo_pgsql zip opcache \
    && apk del .build-deps

COPY docker/production/php.ini /usr/local/etc/php/conf.d/zz-production.ini
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Bağımlılıklar ayrı katmanda (kod değişince yeniden indirilmez).
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi \
    && mkdir -p storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/production/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/production/supervisord.conf /etc/supervisord.conf
COPY docker/production/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://127.0.0.1/up > /dev/null || exit 1

CMD ["entrypoint"]
