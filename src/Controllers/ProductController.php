<?php

namespace MarketSpace\Controllers;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * ProductController — CRUD for shop owner's products.
 */
class ProductController
{
    /**
     * GET /api/owner/products
     *
     * List the authenticated owner's products.
     */
    public static function index(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        // Get owner's shop
        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $products = $client->from('products')
            ->select('*')
            ->eq('shop_id', $shop['id'])
            ->order('created_at', 'desc')
            ->execute();

        Response::success($products);
    }

    /**
     * POST /api/owner/products
     *
     * Create a new product.
     * Expects: { name, price, description?, category_id?, image_url?, stock? }
     */
    public static function store(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        // Get owner's shop
        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $name  = $request->body('name');
        $price = $request->body('price');

        if (!$name || $price === null) {
            Response::error('name and price are required');
        }

        $productData = [
            'shop_id'     => $shop['id'],
            'name'        => $name,
            'price'       => $price,
            'description' => $request->body('description'),
            'category_id' => $request->body('category_id'),
            'image_url'   => $request->body('image_url'),
            'stock'       => $request->body('stock'),
        ];

        // Remove null values
        $productData = array_filter($productData, fn($v) => $v !== null);

        $result = $client->from('products')
            ->insert($productData)
            ->execute();

        Response::created($result);
    }

    /**
     * PUT /api/owner/products/{id}
     *
     * Update a product.
     */
    public static function update(Request $request, array $params): void
    {
        $profile   = $request->auth('profile');
        $productId = $params['id'] ?? '';
        $client    = SupabaseClient::serviceClient();

        // Verify ownership via shop
        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $allowedFields = ['name', 'description', 'price', 'category_id', 'image_url', 'stock', 'is_active'];
        $updates = [];

        foreach ($allowedFields as $field) {
            $value = $request->body($field);
            if ($value !== null) {
                $updates[$field] = $value;
            }
        }

        if (empty($updates)) {
            Response::error('No valid fields to update');
        }

        $result = $client->from('products')
            ->update($updates)
            ->eq('id', $productId)
            ->eq('shop_id', $shop['id'])
            ->execute();

        Response::success(['message' => 'Product updated', 'data' => $result]);
    }

    /**
     * DELETE /api/owner/products/{id}
     *
     * Soft-delete a product (set is_active = false).
     */
    public static function destroy(Request $request, array $params): void
    {
        $profile   = $request->auth('profile');
        $productId = $params['id'] ?? '';
        $client    = SupabaseClient::serviceClient();

        // Verify ownership via shop
        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $result = $client->from('products')
            ->update(['is_active' => false])
            ->eq('id', $productId)
            ->eq('shop_id', $shop['id'])
            ->execute();

        Response::success(['message' => 'Product deactivated', 'data' => $result]);
    }
}
