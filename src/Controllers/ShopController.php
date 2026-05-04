<?php

namespace MarketSpace\Controllers;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * ShopController — Public shop browsing + owner shop management.
 */
class ShopController
{
    // ─── Public ─────────────────────────────────────────────────

    /**
     * GET /api/shops
     *
     * List all active shops.
     */
    public static function index(Request $request, array $params): void
    {
        $client = SupabaseClient::anonClient();

        $shops = $client->from('shops')
            ->select('*')
            ->eq('is_active', 'true')
            ->order('created_at', 'desc')
            ->execute();

        Response::success($shops);
    }

    /**
     * GET /api/shops/{slug}
     *
     * Shop detail with products and active ads. Also logs a shop view.
     */
    public static function show(Request $request, array $params): void
    {
        $slug   = $params['slug'] ?? '';
        $client = SupabaseClient::anonClient();

        $shop = $client->from('shops')
            ->select('*')
            ->eq('slug', $slug)
            ->eq('is_active', 'true')
            ->single();

        if (!$shop) {
            Response::notFound('Shop not found');
        }

        // Fetch products
        $products = $client->from('products')
            ->select('*')
            ->eq('shop_id', $shop['id'])
            ->eq('is_active', 'true')
            ->order('created_at', 'desc')
            ->execute();

        // Fetch active ads
        $ads = $client->from('advertisements')
            ->select('*')
            ->eq('shop_id', $shop['id'])
            ->eq('is_active', 'true')
            ->execute();

        // Log shop view (fire-and-forget via service client)
        $serviceClient = SupabaseClient::serviceClient();
        $viewerId = null;

        // If the user is authenticated, capture their ID
        $token = $request->bearerToken();
        if ($token) {
            $user = $serviceClient->getUser($token);
            $viewerId = $user['id'] ?? null;
        }

        $serviceClient->from('shop_views')
            ->insert([
                'shop_id'   => $shop['id'],
                'viewer_id' => $viewerId,
            ])
            ->execute();

        Response::success([
            'shop'     => $shop,
            'products' => $products,
            'ads'      => $ads,
        ]);
    }

    // ─── Owner Management ───────────────────────────────────────

    /**
     * POST /api/customer/shop
     *
     * Create a shop for the authenticated user and update their role to shop_owner.
     */
    public static function create(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        if ($profile['role'] === 'shop_owner') {
            Response::error('You are already a shop owner');
        }

        $name = $request->body('name');
        if (!$name) {
            Response::error('Shop name is required');
        }

        $slug = self::slugify($name);

        // 1. Create shop
        $result = $client->from('shops')
            ->insert([
                'owner_id' => $profile['id'],
                'name'     => $name,
                'slug'     => $slug,
            ])
            ->execute();

        if (isset($result['error']) || isset($result['_http_code'])) {
            Response::error('Failed to create shop. Name might be taken.', 400);
        }

        // 2. Update role to shop_owner
        $client->from('profiles')
            ->update(['role' => 'shop_owner'])
            ->eq('id', $profile['id'])
            ->execute();

        Response::created(['message' => 'Shop created successfully!']);
    }

    /**
     * GET /api/owner/shop
     *
     * Get the authenticated owner's shop.
     */
    public static function ownerShow(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $shop = $client->from('shops')
            ->select('*')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop yet');
        }

        Response::success($shop);
    }

    /**
     * PUT /api/owner/shop
     *
     * Update shop name, bio, or slug.
     */
    public static function ownerUpdate(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $allowedFields = ['name', 'bio', 'slug'];
        $updates = [];

        foreach ($allowedFields as $field) {
            $value = $request->body($field);
            if ($value !== null) {
                $updates[$field] = $value;
            }
        }

        if (empty($updates)) {
            Response::error('No valid fields to update. Allowed: name, bio, slug');
        }

        // Slugify the slug if provided
        if (isset($updates['slug'])) {
            $updates['slug'] = self::slugify($updates['slug']);
        }

        $result = $client->from('shops')
            ->update($updates)
            ->eq('owner_id', $profile['id'])
            ->execute();

        Response::success(['message' => 'Shop updated', 'data' => $result]);
    }

    /**
     * PUT /api/owner/shop/media
     *
     * Update banner_url and/or avatar_url (paths from Supabase Storage).
     */
    public static function ownerUpdateMedia(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $updates = [];
        if ($request->body('banner_url') !== null) {
            $updates['banner_url'] = $request->body('banner_url');
        }
        if ($request->body('avatar_url') !== null) {
            $updates['avatar_url'] = $request->body('avatar_url');
        }

        if (empty($updates)) {
            Response::error('Provide banner_url and/or avatar_url');
        }

        $result = $client->from('shops')
            ->update($updates)
            ->eq('owner_id', $profile['id'])
            ->execute();

        Response::success(['message' => 'Shop media updated', 'data' => $result]);
    }

    /**
     * PUT /api/owner/shop/qr
     *
     * Update payment QR code storage path.
     */
    public static function ownerUpdateQr(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $qrPath = $request->body('payment_qr_url');
        if (!$qrPath) {
            Response::error('payment_qr_url is required');
        }

        $result = $client->from('shops')
            ->update(['payment_qr_url' => $qrPath])
            ->eq('owner_id', $profile['id'])
            ->execute();

        Response::success(['message' => 'Payment QR updated', 'data' => $result]);
    }

    /**
     * GET /api/owner/shop/qr/signed
     *
     * Generate a 1-hour signed URL for the payment QR code.
     */
    public static function ownerSignedQr(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $shop = $client->from('shops')
            ->select('payment_qr_url')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop || empty($shop['payment_qr_url'])) {
            Response::notFound('No payment QR code uploaded');
        }

        $signedUrl = $client->signedUrl('payment-qr-codes', $shop['payment_qr_url'], 3600);

        Response::success(['signed_url' => $signedUrl]);
    }

    // ─── Helpers ────────────────────────────────────────────────

    /**
     * Create a URL-safe slug from a string.
     */
    private static function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9\-]/', '-', $text);
        $text = preg_replace('/-+/', '-', $text);
        return trim($text, '-');
    }
}
