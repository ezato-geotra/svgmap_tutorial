FROM php:8.4-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod proxy proxy_http ssl

RUN printf '%s\n' \
    'ProxyRequests Off' \
    'SSLProxyEngine On' \
    'ProxyPass /svgmapAppLayers/ https://svgmap.github.io/svgmapAppLayers/' \
    'ProxyPassReverse /svgmapAppLayers/ https://svgmap.github.io/svgmapAppLayers/' \
    > /etc/apache2/conf-available/svgmapapplayers-proxy.conf \
    && a2enconf svgmapapplayers-proxy

RUN git clone --depth 1 https://github.com/svgmap/php-cross-domain-proxy /tmp/php-cross-domain-proxy \
    && mkdir -p /var/www/html/corsaw \
    && cp /tmp/php-cross-domain-proxy/proxy.php /var/www/html/corsaw/proxy.php \
    && sed -i "s/define('CSAJAX_REFERER_FILTERS', true);/define('CSAJAX_REFERER_FILTERS', false);/" /var/www/html/corsaw/proxy.php \
    && sed -i "s/define('CSAJAX_FILTERS', true);/define('CSAJAX_FILTERS', false);/" /var/www/html/corsaw/proxy.php \
    && sed -i "s/define('CSAJAX_ADD_ALLOW_ORIGIN_HEADER', false);/define('CSAJAX_ADD_ALLOW_ORIGIN_HEADER', true);/" /var/www/html/corsaw/proxy.php \
    && rm -rf /tmp/php-cross-domain-proxy

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html
