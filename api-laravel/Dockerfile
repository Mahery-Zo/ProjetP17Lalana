FROM php:8.2-fpm-bookworm

# System dependencies
RUN apt-get update && apt-get install -y \
    git curl unzip zip ca-certificates \
    libzip-dev libpng-dev libonig-dev libxml2-dev libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions needed for Laravel + PostgreSQL
RUN docker-php-ext-install \
    pdo pdo_pgsql pgsql \
    mbstring exif pcntl bcmath \
    gd zip

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www/html
ENV COMPOSER_ALLOW_SUPERUSER=1

# Firestore requirements: gRPC + Protobuf
RUN apt-get update && apt-get install -y \
    git unzip \
    autoconf g++ make pkg-config \
    && pecl install grpc protobuf \
    && docker-php-ext-enable grpc protobuf \
    && apt-get clean && rm -rf /var/lib/apt/lists/*