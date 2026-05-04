FROM php:8.2-apache

# Install git, zip, unzip for Composer
RUN apt-get update && apt-get install -y \
    git \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite for our API routing
RUN a2enmod rewrite

# Update Apache document root to point to the public directory
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . /var/www/html/

# Install dependencies (ignoring dev dependencies for production)
RUN composer install --no-dev --optimize-autoloader

# Set permissions for Apache
RUN chown -R www-data:www-data /var/www/html
