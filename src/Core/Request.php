<?php

namespace MarketSpace\Core;

/**
 * Request — Wraps $_SERVER, $_GET, $_POST, and php://input for clean access.
 */
class Request
{
    private string $method;
    private string $path;
    private array $query;
    private array $body;
    private array $headers;
    private array $auth = [];

    public function __construct()
    {
        $this->method  = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->path    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $this->query   = $_GET;
        $this->headers = $this->parseHeaders();

        // Parse JSON body
        $rawBody = file_get_contents('php://input');
        $this->body = json_decode($rawBody, true) ?? [];
    }

    public function method(): string
    {
        return $this->method;
    }

    public function path(): string
    {
        return $this->path;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function body(string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->body;
        }
        return $this->body[$key] ?? $default;
    }

    public function header(string $key): ?string
    {
        $normalized = strtolower($key);
        return $this->headers[$normalized] ?? null;
    }

    /**
     * Extract the Bearer token from the Authorization header.
     */
    public function bearerToken(): ?string
    {
        $auth = $this->header('authorization');
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            return substr($auth, 7);
        }
        return null;
    }

    /**
     * Parse all request headers into a normalized (lowercase key) array.
     */
    private function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;
            }
        }
        // Content-Type and Content-Length are not prefixed with HTTP_
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['content-length'] = $_SERVER['CONTENT_LENGTH'];
        }
        return $headers;
    }

    // ─── Auth context (set by AuthMiddleware) ───────────────────

    /**
     * Stash authenticated user data on the request.
     */
    public function setAuth(array $auth): void
    {
        $this->auth = $auth;
    }

    /**
     * Retrieve auth context set by middleware.
     *
     * @param string|null $key  Optional key: 'user', 'profile', or 'token'
     * @return mixed
     */
    public function auth(string $key = null): mixed
    {
        if ($key === null) {
            return $this->auth;
        }
        return $this->auth[$key] ?? null;
    }
}
