<?php

namespace MarketSpace\Controllers;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * ProfileController — Get and update the authenticated user's profile.
 */
class ProfileController
{
    /**
     * GET /api/profile
     *
     * Return the current user's profile.
     */
    public static function show(Request $request, array $params): void
    {
        $profile = $request->auth('profile');

        Response::success($profile);
    }

    /**
     * PUT /api/profile
     *
     * Update the current user's profile (full_name, birthday, address).
     * Expects any of: { full_name, birthday, address }
     */
    public static function update(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $token   = $request->auth('token');

        $allowedFields = ['full_name', 'birthday', 'address'];
        $updates = [];

        foreach ($allowedFields as $field) {
            $value = $request->body($field);
            if ($value !== null) {
                $updates[$field] = $value;
            }
        }

        if (empty($updates)) {
            Response::error('No valid fields to update. Allowed: full_name, birthday, address');
        }

        $client = SupabaseClient::serviceClient();
        $result = $client->from('profiles')
            ->update($updates)
            ->eq('id', $profile['id'])
            ->execute();

        Response::success(['message' => 'Profile updated', 'data' => $result]);
    }
}
