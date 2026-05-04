<?php

namespace MarketSpace\Core;

/**
 * QueryBuilder — Fluent interface for Supabase PostgREST queries.
 *
 * Usage:
 *   $client->from('products')
 *          ->select('id, name, price')
 *          ->eq('is_active', 'true')
 *          ->order('created_at', 'desc')
 *          ->limit(20)
 *          ->execute();
 */
class QueryBuilder
{
    private SupabaseClient $client;
    private string $table;
    private string $method = 'GET';
    private array $filters = [];
    private array $body = [];
    private array $extraHeaders = [];
    private ?string $userJwt = null;

    private ?string $selectColumns = null;
    private ?string $orderColumn = null;
    private ?string $orderDirection = null;
    private ?int $limitCount = null;
    private ?int $offsetCount = null;

    public function __construct(SupabaseClient $client, string $table)
    {
        $this->client = $client;
        $this->table  = $table;
    }

    // ─── Auth context ───────────────────────────────────────────

    /**
     * Execute this query as a specific user (passes their JWT to RLS).
     */
    public function asUser(string $jwt): self
    {
        $this->userJwt = $jwt;
        return $this;
    }

    // ─── SELECT ─────────────────────────────────────────────────

    public function select(string $columns = '*'): self
    {
        $this->method = 'GET';
        $this->selectColumns = $columns;
        return $this;
    }

    // ─── INSERT ─────────────────────────────────────────────────

    public function insert(array $data): self
    {
        $this->method = 'POST';
        $this->body = $data;
        $this->extraHeaders['Prefer'] = 'return=representation';
        return $this;
    }

    // ─── UPDATE ─────────────────────────────────────────────────

    public function update(array $data): self
    {
        $this->method = 'PATCH';
        $this->body = $data;
        $this->extraHeaders['Prefer'] = 'return=representation';
        return $this;
    }

    // ─── DELETE ─────────────────────────────────────────────────

    public function delete(): self
    {
        $this->method = 'DELETE';
        return $this;
    }

    // ─── Filters ────────────────────────────────────────────────

    public function eq(string $column, string $value): self
    {
        $this->filters[] = "{$column}=eq.{$value}";
        return $this;
    }

    public function neq(string $column, string $value): self
    {
        $this->filters[] = "{$column}=neq.{$value}";
        return $this;
    }

    public function gt(string $column, string $value): self
    {
        $this->filters[] = "{$column}=gt.{$value}";
        return $this;
    }

    public function lt(string $column, string $value): self
    {
        $this->filters[] = "{$column}=lt.{$value}";
        return $this;
    }

    public function gte(string $column, string $value): self
    {
        $this->filters[] = "{$column}=gte.{$value}";
        return $this;
    }

    public function lte(string $column, string $value): self
    {
        $this->filters[] = "{$column}=lte.{$value}";
        return $this;
    }

    public function like(string $column, string $pattern): self
    {
        $this->filters[] = "{$column}=like.{$pattern}";
        return $this;
    }

    public function ilike(string $column, string $pattern): self
    {
        $this->filters[] = "{$column}=ilike.{$pattern}";
        return $this;
    }

    public function in(string $column, array $values): self
    {
        $list = '(' . implode(',', $values) . ')';
        $this->filters[] = "{$column}=in.{$list}";
        return $this;
    }

    public function is(string $column, string $value): self
    {
        $this->filters[] = "{$column}=is.{$value}";
        return $this;
    }

    // ─── Ordering & Pagination ──────────────────────────────────

    public function order(string $column, string $direction = 'asc'): self
    {
        $this->orderColumn = $column;
        $this->orderDirection = $direction;
        return $this;
    }

    public function limit(int $count): self
    {
        $this->limitCount = $count;
        return $this;
    }

    public function offset(int $count): self
    {
        $this->offsetCount = $count;
        return $this;
    }

    // ─── Execution ──────────────────────────────────────────────

    /**
     * Build the query string and execute the request.
     *
     * @return array  Response data from Supabase
     */
    public function execute(): array
    {
        $params = $this->filters;

        if ($this->selectColumns) {
            array_unshift($params, "select=" . urlencode($this->selectColumns));
        }

        if ($this->orderColumn) {
            $params[] = "order={$this->orderColumn}.{$this->orderDirection}";
        }

        if ($this->limitCount !== null) {
            $params[] = "limit={$this->limitCount}";
        }

        if ($this->offsetCount !== null) {
            $params[] = "offset={$this->offsetCount}";
        }

        $queryString = implode('&', $params);

        return $this->client->postgrest(
            $this->method,
            $this->table,
            $queryString,
            $this->body,
            $this->extraHeaders,
            $this->userJwt
        );
    }

    /**
     * Execute and return the first result, or null.
     */
    public function single(): ?array
    {
        $this->extraHeaders['Accept'] = 'application/vnd.pgrst.object+json';
        $this->limitCount = 1;
        $result = $this->execute();
        return isset($result['_http_code']) && $result['_http_code'] >= 400 ? null : $result;
    }
}
