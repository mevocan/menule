FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev libzip-dev unzip git \
    && docker-php-ext-install pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY uploads.ini /usr/local/etc/php/conf.d/uploads.ini
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
