<?php

namespace MarketSpace\Controllers;

use MarketSpace\Core\Request;
use MarketSpace\Core\Response;
use MarketSpace\Core\SupabaseClient;

/**
 * OrderController — Checkout, order history, and status management.
 *
 * Enforces single-shop-per-order rule: if the cart has items from multiple shops,
 * one order per shop is created.
 */
class OrderController
{
    /**
     * POST /api/orders — Checkout (creates orders + order_items, clears cart).
     */
    public static function checkout(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        // Fetch cart with product data
        $cartItems = $client->from('cart_items')
            ->select('*, product:products(*)')
            ->eq('customer_id', $profile['id'])
            ->execute();

        if (empty($cartItems) || isset($cartItems['_http_code'])) {
            Response::error('Cart is empty');
        }

        // Group by shop_id
        $grouped = [];
        foreach ($cartItems as $item) {
            $shopId = $item['product']['shop_id'] ?? null;
            if (!$shopId) continue;
            $grouped[$shopId][] = $item;
        }

        $orders = [];
        foreach ($grouped as $shopId => $items) {
            $total = 0;
            foreach ($items as $item) {
                $total += $item['product']['price'] * $item['quantity'];
            }

            // Create order
            $order = $client->from('orders')
                ->insert([
                    'customer_id'  => $profile['id'],
                    'shop_id'      => $shopId,
                    'status'       => 'pending',
                    'total_amount' => $total,
                ])
                ->execute();

            $orderId = $order[0]['id'] ?? null;
            if (!$orderId) continue;

            // Create order items
            foreach ($items as $item) {
                $client->from('order_items')
                    ->insert([
                        'order_id'          => $orderId,
                        'product_id'        => $item['product_id'],
                        'quantity'          => $item['quantity'],
                        'price_at_purchase' => $item['product']['price'],
                    ])
                    ->execute();
            }

            $orders[] = $order[0];
        }

        // Clear cart
        $client->from('cart_items')
            ->delete()
            ->eq('customer_id', $profile['id'])
            ->execute();

        Response::created(['message' => 'Order(s) placed', 'orders' => $orders]);
    }

    /**
     * GET /api/customer/orders — Customer order history.
     */
    public static function customerOrders(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $client  = SupabaseClient::serviceClient();

        $orders = $client->from('orders')
            ->select('*')
            ->eq('customer_id', $profile['id'])
            ->order('created_at', 'desc')
            ->execute();

        Response::success($orders);
    }

    /**
     * GET /api/owner/orders — Incoming orders for the owner's shop.
     */
    public static function ownerOrders(Request $request, array $params): void
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

        $orders = $client->from('orders')
            ->select('*')
            ->eq('shop_id', $shop['id'])
            ->order('created_at', 'desc')
            ->execute();

        Response::success($orders);
    }

    /**
     * PUT /api/owner/orders/{id}/status — Update order status.
     * Expects: { status }
     */
    public static function updateStatus(Request $request, array $params): void
    {
        $profile = $request->auth('profile');
        $orderId = $params['id'] ?? '';
        $status  = $request->body('status');

        $allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
        if (!$status || !in_array($status, $allowed, true)) {
            Response::error('status must be one of: ' . implode(', ', $allowed));
        }

        $client = SupabaseClient::serviceClient();

        $shop = $client->from('shops')
            ->select('id')
            ->eq('owner_id', $profile['id'])
            ->single();

        if (!$shop) {
            Response::notFound('You do not have a shop');
        }

        $result = $client->from('orders')
            ->update(['status' => $status])
            ->eq('id', $orderId)
            ->eq('shop_id', $shop['id'])
            ->execute();

        Response::success(['message' => 'Order status updated', 'data' => $result]);
    }
}
