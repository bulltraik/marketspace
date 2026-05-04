<?php

namespace MarketSpace\Middleware;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;

/**
 * RoleMiddleware — Enforces customer / shop_owner guard.
 *
 * Must run AFTER AuthMiddleware so that $request->auth('profile') is available.
 */
class RoleMiddleware
{
    /**
     * Create a role-checking callable for the given required role.
     *
     * Usage in routes.php:
     *   $shopOwnerGuard = RoleMiddleware::require('shop_owner');
     *   $router->get('/api/owner/shop', $handler, [$authMiddleware, $shopOwnerGuard]);
     *
     * @param string $requiredRole  'customer' or 'shop_owner'
     * @return callable
     */
    public static function require(string $requiredRole): callable
    {
        return function (Request $request) use ($requiredRole): void {
            $profile = $request->auth('profile');

            if (!$profile || ($profile['role'] ?? null) !== $requiredRole) {
                Response::forbidden(
                    "This route requires the '{$requiredRole}' role"
                );
            }
        };
    }
}
