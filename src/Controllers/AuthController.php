<?php

namespace MarketSpace\Controllers;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * AuthController — Registration, login, logout, and OAuth callback.
 */
class AuthController
{
    /**
     * POST /api/auth/register
     *
     * Create a new user via Supabase Auth Admin API and insert a profiles row.
     * Expects: { email, password, role }
     */
    public static function register(Request $request, array $params): void
    {
        $email    = $request->body('email');
        $password = $request->body('password');
        $fullName = $request->body('full_name');
        $role     = 'customer';

        if (!$email || !$password || !$fullName) {
            Response::error('full_name, email, and password are required');
        }

        $client = SupabaseClient::serviceClient();

        // 1. Create the auth user
        $authResult = $client->createUser($email, $password, ['role' => $role]);

        if (isset($authResult['error']) || !isset($authResult['id'])) {
            $msg = $authResult['msg'] ?? $authResult['message'] ?? $authResult['error'] ?? 'Failed to create user';
            Response::error($msg, $authResult['_http_code'] ?? 400);
        }

        $userId = $authResult['id'];

        // 2. Insert the profile row
        $profile = $client->from('profiles')
            ->insert([
                'id'        => $userId,
                'role'      => $role,
                'full_name' => $fullName,
            ])
            ->execute();

        Response::created([
            'message' => 'Registration successful. Please verify your email.',
            'user_id' => $userId,
        ]);
    }

    /**
     * POST /api/auth/login
     *
     * Exchange email + password for a JWT session.
     * Expects: { email, password }
     */
    public static function login(Request $request, array $params): void
    {
        $email    = $request->body('email');
        $password = $request->body('password');

        if (!$email || !$password) {
            Response::error('email and password are required');
        }

        $client = SupabaseClient::anonClient();
        $result = $client->signInWithPassword($email, $password);

        if (isset($result['error']) || !isset($result['access_token'])) {
            $msg = $result['error_description'] ?? $result['msg'] ?? 'Invalid credentials';
            Response::error($msg, 401);
        }

        Response::success([
            'access_token'  => $result['access_token'],
            'refresh_token' => $result['refresh_token'] ?? null,
            'expires_in'    => $result['expires_in'] ?? null,
            'token_type'    => $result['token_type'] ?? 'bearer',
        ]);
    }

    /**
     * POST /api/auth/logout
     *
     * Invalidate the current session (requires auth).
     */
    public static function logout(Request $request, array $params): void
    {
        $token  = $request->auth('token');
        $client = SupabaseClient::serviceClient();
        $client->signOut($token);

        Response::success(['message' => 'Logged out successfully']);
    }

    /**
     * GET /api/auth/callback
     *
     * GitHub OAuth redirect handler.
     * If no profile exists for this auth user, create one with role = 'customer'.
     */
    public static function callback(Request $request, array $params): void
    {
        // After GitHub OAuth, Supabase redirects here with the session in the URL fragment.
        // The JS client handles the token exchange; this endpoint ensures a profile row exists.
        $token = $request->bearerToken();

        if (!$token) {
            Response::error('Missing token in OAuth callback', 400);
        }

        $client = SupabaseClient::serviceClient();
        $user   = $client->getUser($token);

        if (!$user) {
            Response::unauthorized('Invalid token');
        }

        // Check if profile exists
        $existing = $client->from('profiles')
            ->select('id')
            ->eq('id', $user['id'])
            ->single();

        if (!$existing) {
            // First-time GitHub user — default to customer
            $client->from('profiles')
                ->insert([
                    'id'   => $user['id'],
                    'role' => 'customer',
                ])
                ->execute();
        }

        Response::success(['message' => 'OAuth callback processed', 'user_id' => $user['id']]);
    }
}
