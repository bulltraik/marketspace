<?php

namespace MarketSpace\Controllers;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * AdvertisementController — CRUD for shop owner's advertisements.
 */
class AdvertisementController
{
    /**
     * GET /api/owner/ads — List own ads.
     */
    public static function index(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $ads = $client->from('advertisements')
            ->select('*')
            ->eq('shop_id', $shop['id'])
            ->order('created_at', 'desc')
            ->execute();

        Response::success($ads);
    }

    /**
     * POST /api/owner/ads — Create ad.
     * Expects: { product_id?, promo_image_url?, copy_text?, font_style? }
     */
    public static function store(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $fontStyle = $request->body('font_style');
        $allowed = ['modern', 'classic', 'technical', 'elegant'];
        if ($fontStyle && !in_array($fontStyle, $allowed, true)) {
            Response::error('font_style must be one of: ' . implode(', ', $allowed));
        }

        $data = array_filter([
            'shop_id'         => $shop['id'],
            'product_id'      => $request->body('product_id'),
            'promo_image_url' => $request->body('promo_image_url'),
            'copy_text'       => $request->body('copy_text'),
            'font_style'      => $fontStyle,
        ], fn($v) => $v !== null);

        $result = $client->from('advertisements')
            ->insert($data)
            ->execute();

        Response::created($result);
    }

    /**
     * PUT /api/owner/ads/{id} — Update ad.
     */
    public static function update(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $adId    = $params['id'] ?? '';
        $client  = SupabaseClient::serviceClient();

        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $fields  = ['product_id', 'promo_image_url', 'copy_text', 'font_style', 'is_active'];
        $updates = [];
        foreach ($fields as $f) {
            $v = $request->body($f);
            if ($v !== null) $updates[$f] = $v;
        }

        if (empty($updates)) {
            Response::error('No valid fields to update');
        }

        $result = $client->from('advertisements')
            ->update($updates)
            ->eq('id', $adId)
            ->eq('shop_id', $shop['id'])
            ->execute();

        Response::success(['message' => 'Ad updated', 'data' => $result]);
    }

    /**
     * DELETE /api/owner/ads/{id} — Delete ad.
     */
    public static function destroy(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $adId    = $params['id'] ?? '';
        $client  = SupabaseClient::serviceClient();

        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $client->from('advertisements')
            ->delete()
            ->eq('id', $adId)
            ->eq('shop_id', $shop['id'])
            ->execute();

        Response::success(['message' => 'Ad deleted']);
    }
}
