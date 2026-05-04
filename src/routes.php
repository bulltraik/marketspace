<?php

/**
 * MarketSpace — Route Definitions
 *
 * All API routes are registered here. The $router variable is provided by public/index.php.
 *
 * @var \MarketSpace\Core\Router $router
 */

use MarketSpace\Core\Response;
use MarketSpace\Controllers\AuthController;
use MarketSpace\Controllers\ProfileController;
use MarketSpace\Controllers\ShopController;
use MarketSpace\Controllers\ProductController;
use MarketSpace\Controllers\CartController;
use MarketSpace\Controllers\OrderController;
use MarketSpace\Controllers\AdvertisementController;
use MarketSpace\Middleware\AuthMiddleware;
use MarketSpace\Middleware\RoleMiddleware;
use MarketSpace\Middleware\EmailVerifiedMiddleware;

// ─── Middleware callables ────────────────────────────────────

$auth          = [AuthMiddleware::class, 'handle'];
$emailVerified = [EmailVerifiedMiddleware::class, 'handle'];
$shopOwner     = RoleMiddleware::require('shop_owner');
$customer      = RoleMiddleware::require('customer');

// Standard protected middleware stack (auth + email verified)
$protected = [$auth, $emailVerified];

// ─── Health check ────────────────────────────────────────────

$router->get('/api/health', function ($request, $params) {
    $config = require __DIR__ . '/../config/env.php';

    $supabaseUrl = $config['SUPABASE_URL'];
    $anonKey     = $config['SUPABASE_ANON_KEY'];

    $ch = curl_init("{$supabaseUrl}/rest/v1/");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            "apikey: {$anonKey}",
            "Authorization: Bearer {$anonKey}",
        ],
        CURLOPT_TIMEOUT => 10,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        Response::json([
            'status'   => 'error',
            'message'  => 'Failed to connect to Supabase',
            'detail'   => $error,
        ], 503);
    }

    Response::json([
        'status'         => 'ok',
        'supabase_url'   => $supabaseUrl,
        'supabase_http'  => $httpCode,
        'timestamp'      => date('c'),
    ]);
});

// ─── Auth routes ─────────────────────────────────────────────

$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login',    [AuthController::class, 'login']);
$router->post('/api/auth/logout',   [AuthController::class, 'logout'],   $protected);
$router->get('/api/auth/callback',  [AuthController::class, 'callback']);

// ─── Profile routes ─────────────────────────────────────────

$router->get('/api/profile', [ProfileController::class, 'show'],   $protected);
$router->put('/api/profile', [ProfileController::class, 'update'], $protected);

// ─── Shop routes (public) ───────────────────────────────────

$router->get('/api/shops',        [ShopController::class, 'index']);
$router->get('/api/shops/{slug}', [ShopController::class, 'show']);

// ─── Owner — Shop management ────────────────────────────────

$router->post('/api/customer/shop',        [ShopController::class, 'create'],           array_merge($protected, [$customer]));
$router->get('/api/owner/shop',            [ShopController::class, 'ownerShow'],        array_merge($protected, [$shopOwner]));
$router->put('/api/owner/shop',            [ShopController::class, 'ownerUpdate'],      array_merge($protected, [$shopOwner]));
$router->put('/api/owner/shop/media',      [ShopController::class, 'ownerUpdateMedia'], array_merge($protected, [$shopOwner]));
$router->put('/api/owner/shop/qr',         [ShopController::class, 'ownerUpdateQr'],    array_merge($protected, [$shopOwner]));
$router->get('/api/owner/shop/qr/signed',  [ShopController::class, 'ownerSignedQr'],    $protected);

// ─── Owner — Products ───────────────────────────────────────

$router->get('/api/owner/products',       [ProductController::class, 'index'],   array_merge($protected, [$shopOwner]));
$router->post('/api/owner/products',      [ProductController::class, 'store'],   array_merge($protected, [$shopOwner]));
$router->put('/api/owner/products/{id}',  [ProductController::class, 'update'],  array_merge($protected, [$shopOwner]));
$router->delete('/api/owner/products/{id}', [ProductController::class, 'destroy'], array_merge($protected, [$shopOwner]));

// ─── Owner — Advertisements ─────────────────────────────────

$router->get('/api/owner/ads',       [AdvertisementController::class, 'index'],   array_merge($protected, [$shopOwner]));
$router->post('/api/owner/ads',      [AdvertisementController::class, 'store'],   array_merge($protected, [$shopOwner]));
$router->put('/api/owner/ads/{id}',  [AdvertisementController::class, 'update'],  array_merge($protected, [$shopOwner]));
$router->delete('/api/owner/ads/{id}', [AdvertisementController::class, 'destroy'], array_merge($protected, [$shopOwner]));

// ─── Cart routes ─────────────────────────────────────────────

$router->get('/api/cart',              [CartController::class, 'index'],   array_merge($protected, [$customer]));
$router->post('/api/cart',             [CartController::class, 'store'],   array_merge($protected, [$customer]));
$router->put('/api/cart/{itemId}',     [CartController::class, 'update'],  array_merge($protected, [$customer]));
$router->delete('/api/cart/{itemId}',  [CartController::class, 'destroy'], array_merge($protected, [$customer]));

// ─── Order routes ────────────────────────────────────────────

$router->post('/api/orders',                      [OrderController::class, 'checkout'],       array_merge($protected, [$customer]));
$router->get('/api/customer/orders',              [OrderController::class, 'customerOrders'], array_merge($protected, [$customer]));
$router->get('/api/owner/orders',                 [OrderController::class, 'ownerOrders'],    array_merge($protected, [$shopOwner]));
$router->put('/api/owner/orders/{id}/status',     [OrderController::class, 'updateStatus'],   array_merge($protected, [$shopOwner]));
