<?php

namespace MarketSpace\Middleware;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * AuthMiddleware — Validates JWT via Supabase Auth.
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it against Supabase, and attaches the authenticated
 * user data to the request for downstream handlers.
 */
class AuthMiddleware
{
    /**
     * Invoke the middleware.
     *
     * Halts with 401 if the token is missing or invalid.
     */
    public static function handle(Request $request): void
    {
        $token = $request->bearerToken();

        if (!$token) {
            Response::unauthorized('Missing Authorization header');
        }

        $client = SupabaseClient::serviceClient();
        $user   = $client->getUser($token);

        if (!$user) {
            Response::unauthorized('Invalid or expired token');
        }

        // Fetch the profile row so downstream handlers have access to the role
        $profile = $client->from('profiles')
            ->select('*')
            ->eq('id', $user['id'])
            ->single();

        if (!$profile) {
            Response::unauthorized('User profile not found');
        }

        // Stash auth context on the request for controllers
        $request->setAuth([
            'user'    => $user,
            'profile' => $profile,
            'token'   => $token,
        ]);
    }
}
