<?php

namespace MarketSpace\Controllers;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * CartController — Customer shopping cart management.
 */
class CartController
{
    /**
     * GET /api/cart
     */
    public static function index(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $items = $client->from('cart_items')
            ->select('*, product:products(*)')
            ->eq('customer_id', $profile['id'])
            ->execute();

        Response::success($items);
    }

    /**
     * POST /api/cart — { product_id, quantity? }
     */
    public static function store(Request $request, array $params): void
    {
        $profile   = $request->auth('profile');
        $productId = $request->body('product_id');
        $quantity  = $request->body('quantity') ?? 1;

        if (!$productId) {
            Response::error('product_id is required');
        }

        $client = SupabaseClient::serviceClient();

        $existing = $client->from('cart_items')
            ->select('id, quantity')
            ->eq('customer_id', $profile['id'])
            ->eq('product_id', $productId)
            ->single();

        if ($existing) {
            $result = $client->from('cart_items')
                ->update(['quantity' => $existing['quantity'] + $quantity])
                ->eq('id', $existing['id'])
                ->execute();
            Response::success(['message' => 'Quantity updated', 'data' => $result]);
        }

        $result = $client->from('cart_items')
            ->insert([
                'customer_id' => $profile['id'],
                'product_id'  => $productId,
                'quantity'    => $quantity,
            ])
            ->execute();

        Response::created($result);
    }

    /**
     * PUT /api/cart/{itemId} — { quantity }
     */
    public static function update(Request $request, array $params): void
    {
        $profile  = $request->auth('profile');
        $itemId   = $params['itemId'] ?? '';
        $quantity = $request->body('quantity');

        if ($quantity === null || $quantity < 1) {
            Response::error('quantity must be at least 1');
        }

        $client = SupabaseClient::serviceClient();
        $result = $client->from('cart_items')
            ->update(['quantity' => $quantity])
            ->eq('id', $itemId)
            ->eq('customer_id', $profile['id'])
            ->execute();

        Response::success(['message' => 'Cart item updated', 'data' => $result]);
    }

    /**
     * DELETE /api/cart/{itemId}
     */
    public static function destroy(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $itemId  = $params['itemId'] ?? '';
        $client  = SupabaseClient::serviceClient();

        $client->from('cart_items')
            ->delete()
            ->eq('id', $itemId)
            ->eq('customer_id', $profile['id'])
            ->execute();

        Response::success(['message' => 'Item removed from cart']);
    }
}
