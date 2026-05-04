<?php

namespace MarketSpace\Core;

/**
 * Router — Regex-based path dispatcher.
 *
 * Supports route parameters like {id} and {slug}.
 */
class Router
{
    private array $routes = [];

    /**
     * Register a route.
     *
     * @param string   $method     HTTP method (GET, POST, PUT, DELETE)
     * @param string   $pattern    Route pattern, e.g. '/api/shops/{slug}'
     * @param callable $handler    Handler function receiving (Request, array $params)
     * @param array    $middleware Array of middleware callables
     */
    public function add(string $method, string $pattern, callable $handler, array $middleware = []): void
    {
        $this->routes[] = [
            'method'     => strtoupper($method),
            'pattern'    => $pattern,
            'handler'    => $handler,
            'middleware'  => $middleware,
        ];
    }

    // Convenience methods
    public function get(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('GET', $pattern, $handler, $middleware);
    }

    public function post(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('POST', $pattern, $handler, $middleware);
    }

    public function put(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('PUT', $pattern, $handler, $middleware);
    }

    public function delete(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('DELETE', $pattern, $handler, $middleware);
    }

    /**
     * Dispatch the request to a matching route.
     */
    public function dispatch(Request $request): void
    {
        $method = $request->method();
        $path   = $request->path();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $regex = $this->patternToRegex($route['pattern']);
            if (preg_match($regex, $path, $matches)) {
                // Extract named params
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                // Run middleware chain
                foreach ($route['middleware'] as $mw) {
                    call_user_func($mw, $request);
                    // Middleware calls Response::error() to halt — if we reach here, it passed
                }

                // Call the handler
                call_user_func($route['handler'], $request, $params);
                return;
            }
        }

        Response::notFound('Route not found');
    }

    /**
     * Convert a route pattern like '/api/shops/{slug}' to a regex.
     */
    private function patternToRegex(string $pattern): string
    {
        $regex = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $pattern);
        return '#^' . $regex . '$#';
    }
}
