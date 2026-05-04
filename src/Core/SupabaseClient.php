<?php

namespace MarketSpace\Core;

/**
 * SupabaseClient — cURL wrapper for Supabase PostgREST, Auth Admin API, and Storage.
 *
 * Two usage modes:
 *   1. Service Role (admin): user creation, token verification, signed URLs
 *   2. Anon Key (public): proxied queries that still respect RLS
 */
class SupabaseClient
{
    private string $baseUrl;
    private string $apiKey;
    private bool $isServiceRole;

    public function __construct(string $baseUrl, string $apiKey, bool $isServiceRole = false)
    {
        $this->baseUrl       = rtrim($baseUrl, '/');
        $this->apiKey        = $apiKey;
        $this->isServiceRole = $isServiceRole;
    }

    /**
     * Create a service-role client (for admin operations — never expose to browser).
     */
    public static function serviceClient(): self
    {
        $config = require __DIR__ . '/../../config/env.php';
        return new self($config['SUPABASE_URL'], $config['SUPABASE_SERVICE_KEY'], true);
    }

    /**
     * Create an anon-key client (for public/RLS-respecting queries).
     */
    public static function anonClient(): self
    {
        $config = require __DIR__ . '/../../config/env.php';
        return new self($config['SUPABASE_URL'], $config['SUPABASE_ANON_KEY'], false);
    }

    // ─── Auth ───────────────────────────────────────────────────

    /**
     * Verify a JWT and return the user object.
     *
     * @return array|null  User data or null if invalid
     */
    public function getUser(string $jwt): ?array
    {
        $response = $this->request('GET', '/auth/v1/user', [], [
            'Authorization' => "Bearer {$jwt}",
        ]);

        return $response['id'] ?? null ? $response : null;
    }

    /**
     * Create a new user via the Auth Admin API (requires service role key).
     */
    public function createUser(string $email, string $password, array $metadata = []): array
    {
        return $this->request('POST', '/auth/v1/admin/users', [
            'email'           => $email,
            'password'        => $password,
            'email_confirm'   => false,
            'user_metadata'   => $metadata,
        ]);
    }

    /**
     * Exchange email + password for a JWT session.
     */
    public function signInWithPassword(string $email, string $password): array
    {
        return $this->request('POST', '/auth/v1/token?grant_type=password', [
            'email'    => $email,
            'password' => $password,
        ]);
    }

    /**
     * Sign out — revoke the refresh token.
     */
    public function signOut(string $jwt): array
    {
        return $this->request('POST', '/auth/v1/logout', [], [
            'Authorization' => "Bearer {$jwt}",
        ]);
    }

    // ─── PostgREST (Database) ───────────────────────────────────

    /**
     * Start a PostgREST query on a table.
     *
     * Returns a QueryBuilder for fluent chaining.
     */
    public function from(string $table): QueryBuilder
    {
        return new QueryBuilder($this, $table);
    }

    /**
     * Execute a raw PostgREST request.
     *
     * @internal  Used by QueryBuilder
     */
    public function postgrest(string $method, string $table, string $queryString = '', array $body = [], array $extraHeaders = [], ?string $userJwt = null): array
    {
        $path = "/rest/v1/{$table}" . ($queryString ? "?{$queryString}" : '');

        $headers = array_merge($extraHeaders, []);
        if ($userJwt) {
            $headers['Authorization'] = "Bearer {$userJwt}";
        }

        return $this->request($method, $path, $body, $headers);
    }

    // ─── Storage ────────────────────────────────────────────────

    /**
     * Generate a signed URL for a private storage object.
     */
    public function signedUrl(string $bucket, string $objectPath, int $expiresIn = 3600): string
    {
        $response = $this->request('POST', "/storage/v1/object/sign/{$bucket}/{$objectPath}", [
            'expiresIn' => $expiresIn,
        ]);

        return $this->baseUrl . '/storage/v1' . ($response['signedURL'] ?? '');
    }

    /**
     * Get the public URL of an object in a public bucket.
     */
    public function publicUrl(string $bucket, string $objectPath): string
    {
        return "{$this->baseUrl}/storage/v1/object/public/{$bucket}/{$objectPath}";
    }

    // ─── HTTP Transport ─────────────────────────────────────────

    /**
     * Send an HTTP request to Supabase.
     */
    private function request(string $method, string $path, array $body = [], array $extraHeaders = []): array
    {
        $url = $this->baseUrl . $path;

        $headers = [
            'apikey'        => $this->apiKey,
            'Content-Type'  => 'application/json',
        ];

        // Service role uses the key as the Authorization bearer by default
        if ($this->isServiceRole && !isset($extraHeaders['Authorization'])) {
            $headers['Authorization'] = "Bearer {$this->apiKey}";
        }

        $headers = array_merge($headers, $extraHeaders);

        $curlHeaders = [];
        foreach ($headers as $key => $value) {
            $curlHeaders[] = "{$key}: {$value}";
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $curlHeaders,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_TIMEOUT        => 30,
        ]);

        if (!empty($body) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $responseBody = curl_exec($ch);
        $httpCode     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error        = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['error' => $error, 'http_code' => 0];
        }

        $decoded = json_decode($responseBody, true) ?? [];
        if ($httpCode >= 400) {
            if (!is_array($decoded)) {
                $decoded = ['error' => $responseBody];
            }
            $decoded['_http_code'] = $httpCode;
        }

        return $decoded;
    }

    // ─── Getters ────────────────────────────────────────────────

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    public function getApiKey(): string
    {
        return $this->apiKey;
    }
}
