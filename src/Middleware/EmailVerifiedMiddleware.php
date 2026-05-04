<?php

namespace MarketSpace\Middleware;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;

/**
 * EmailVerifiedMiddleware — Blocks unverified accounts.
 *
 * Must run AFTER AuthMiddleware so that $request->auth('user') is available.
 * Checks the Supabase auth user's email_confirmed_at field.
 */
class EmailVerifiedMiddleware
{
    /**
     * Invoke the middleware.
     *
     * Halts with 403 if the user's email is not confirmed.
     */
    public static function handle(Request $request): void
    {
        $user = $request->auth('user');

        if (!$user) {
            Response::unauthorized('Authentication required');
        }

        $confirmedAt = $user['email_confirmed_at'] ?? null;

        if (empty($confirmedAt)) {
            Response::forbidden(
                'Email verification required. Please check your inbox and verify your email address.'
            );
        }
    }
}
