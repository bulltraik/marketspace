# MarketSpace — System Plan

**Stack:** PHP (vanilla) · TypeScript (vanilla) · Supabase (PostgreSQL + Auth + Storage)

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Project File Structure](#2-project-file-structure)
3. [Database Schema](#3-database-schema)
4. [Row Level Security (RLS)](#4-row-level-security-rls)
5. [PHP API Endpoints](#5-php-api-endpoints)
6. [Auth & RBAC Flow](#6-auth--rbac-flow)
7. [Supabase Storage Buckets](#7-supabase-storage-buckets)
8. [TypeScript Client Strategy](#8-typescript-client-strategy)
9. [Advice & Critical Notes](#9-advice--critical-notes)

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│               Client Layer (TypeScript)                  │
│   Customer View  │  Shop Owner View  │  Auth Pages       │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼─────────────────────────────────┐
│                  PHP API Layer                           │
│   Router (path dispatch)  │  Controllers  │  Middleware  │
│                           │  (Auth + RBAC)               │
└──────┬─────────────────────────────────┬─────────────────┘
       │                                 │
┌──────▼─────────────────────────────────▼─────────────────┐
│                 Data Layer (Supabase)                    │
│   Auth (Email + GitHub OAuth)  │  PostgreSQL  │  Storage │
└──────────────────────────────────────────────────────────┘
```

> **Note:** The TypeScript client interacts directly with Supabase for two things only:
> - GitHub OAuth via `supabase.auth.signInWithOAuth()`
> - File uploads directly to Supabase Storage via the JS SDK
>
> Everything else goes through the PHP API.

---

## 2. Project File Structure

```
marketspace/
├── public/
│   └── index.php                       # Front controller — all requests route here
│
├── src/
│   ├── Core/
│   │   ├── Router.php                  # Regex-based path dispatcher
│   │   ├── Request.php                 # Wraps $_SERVER, $_POST, $_GET, body
│   │   ├── Response.php                # JSON response helper
│   │   └── SupabaseClient.php          # cURL wrapper for PostgREST + Auth Admin API
│   │
│   ├── Middleware/
│   │   ├── AuthMiddleware.php          # Validates JWT via Supabase Auth
│   │   ├── RoleMiddleware.php          # Enforces customer / shop_owner guard
│   │   └── EmailVerifiedMiddleware.php # Blocks unverified accounts
│   │
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── ProfileController.php
│   │   ├── ShopController.php
│   │   ├── ProductController.php
│   │   ├── CartController.php
│   │   ├── OrderController.php
│   │   └── AdvertisementController.php
│   │
│   └── routes.php                      # Centralized route definitions
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── customer/
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── browse.ts
│   │   │   │   ├── cart.ts
│   │   │   │   └── orders.ts
│   │   │   ├── owner/
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── ads.ts
│   │   │   │   └── settings.ts
│   │   │   └── auth/
│   │   │       ├── login.ts
│   │   │       ├── register.ts
│   │   │       └── verify.ts
│   │   │
│   │   ├── components/
│   │   │   ├── AdPreview.ts            # Live font/copy preview for ads
│   │   │   └── FileUploader.ts         # Direct-to-Storage uploader
│   │   │
│   │   ├── services/
│   │   │   ├── supabase.ts             # Supabase JS client init
│   │   │   └── api.ts                  # Fetch wrapper for PHP API
│   │   │
│   │   └── types/
│   │       └── index.ts                # Shared TypeScript types
│   │
│   ├── dist/
│   └── tsconfig.json
│
├── config/
│   └── env.php                         # SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.
│
└── composer.json
```

---

## 3. Database Schema

```sql
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('customer', 'shop_owner')),
  full_name   TEXT,
  birthday    DATE,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  bio             TEXT,
  banner_url      TEXT,
  avatar_url      TEXT,
  payment_qr_url  TEXT,    -- path in private storage bucket
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  slug  TEXT UNIQUE NOT NULL
);

CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES categories(id),
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL,
  image_url    TEXT,
  stock        INTEGER,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE advertisements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id),
  promo_image_url TEXT,
  copy_text       TEXT,
  font_style      TEXT CHECK (font_style IN ('modern', 'classic', 'technical', 'elegant')),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1,
  UNIQUE (customer_id, product_id)
);

CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES profiles(id),
  shop_id      UUID NOT NULL REFERENCES shops(id),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  quantity          INTEGER NOT NULL,
  price_at_purchase NUMERIC(10,2) NOT NULL
);

-- Analytics: log every shop page visit
CREATE TABLE shop_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  viewer_id  UUID REFERENCES profiles(id),  -- nullable (anonymous visitors)
  viewed_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Row Level Security (RLS)

> RLS must be configured **before** any controller is written. Never rely on PHP logic alone for data isolation.

```sql
-- profiles: user owns their own row only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles
  USING (id = auth.uid());

-- shops: anyone can read, only owner can write
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read shops"  ON shops FOR SELECT USING (true);
CREATE POLICY "owner write shop"   ON shops FOR ALL    USING (owner_id = auth.uid());

-- products: anyone can read, owner writes via their shop
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read products" ON products FOR SELECT USING (true);
CREATE POLICY "owner write products" ON products FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- advertisements: anyone can read, owner writes via their shop
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ads"  ON advertisements FOR SELECT USING (true);
CREATE POLICY "owner write ads"  ON advertisements FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- cart_items: customer sees and manages only their own cart
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON cart_items
  USING (customer_id = auth.uid());

-- orders: customer sees own orders; shop owner sees orders for their shop
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer own orders" ON orders FOR SELECT
  USING (customer_id = auth.uid());
CREATE POLICY "owner shop orders"   ON orders FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "owner update order status" ON orders FOR UPDATE
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- order_items: follows parent order access
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own order items" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()));

-- shop_views: insert only, owner reads own shop's views
ALTER TABLE shop_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert view"       ON shop_views FOR INSERT WITH CHECK (true);
CREATE POLICY "owner read views"  ON shop_views FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
```

---

## 5. PHP API Endpoints

### Auth
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/api/auth/register` | — | Create auth user + profile row |
| POST | `/api/auth/login` | — | Exchange email/password for JWT |
| POST | `/api/auth/logout` | Auth | Invalidate session |
| GET  | `/api/auth/callback` | — | GitHub OAuth redirect handler |

### Profile
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/api/profile` | Auth | Get own profile |
| PUT | `/api/profile` | Auth | Update name / birthday / address |

### Shops (Public)
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/api/shops` | — | List all active shops |
| GET | `/api/shops/{slug}` | — | Shop detail + products + active ads |

### Shop Owner Management
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/api/owner/shop` | shop_owner | Get own shop |
| PUT | `/api/owner/shop` | shop_owner | Update name / bio / slug |
| PUT | `/api/owner/shop/media` | shop_owner | Update banner / avatar URL |
| PUT | `/api/owner/shop/qr` | shop_owner | Update payment QR storage path |
| GET | `/api/owner/shop/qr/signed` | Auth | Get 1-hour signed URL for QR code |

### Products
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/api/owner/products` | shop_owner | List own products |
| POST | `/api/owner/products` | shop_owner | Create product |
| PUT | `/api/owner/products/{id}` | shop_owner | Update product |
| DELETE | `/api/owner/products/{id}` | shop_owner | Soft delete (`is_active = false`) |

### Advertisements
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/api/owner/ads` | shop_owner | List own ads |
| POST | `/api/owner/ads` | shop_owner | Create ad |
| PUT | `/api/owner/ads/{id}` | shop_owner | Update ad |
| DELETE | `/api/owner/ads/{id}` | shop_owner | Delete ad |

### Cart
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/api/cart` | customer | Get cart with product details |
| POST | `/api/cart` | customer | Add item |
| PUT | `/api/cart/{itemId}` | customer | Update quantity |
| DELETE | `/api/cart/{itemId}` | customer | Remove item |

### Orders
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/api/orders` | customer | Checkout (creates order + order_items, clears cart) |
| GET | `/api/customer/orders` | customer | Order history |
| GET | `/api/owner/orders` | shop_owner | Incoming orders for own shop |
| PUT | `/api/owner/orders/{id}/status` | shop_owner | Update order status |

---

## 6. Auth & RBAC Flow

### Registration
```
Client  →  POST /api/auth/register { email, password, role }
PHP     →  Supabase Auth Admin API: create user
PHP     →  INSERT INTO profiles { id, role }
Supabase→  Auto-sends verification email
Response→  201 Created (user must verify email before access)
```

### Email/Password Login
```
Client  →  POST /api/auth/login { email, password }
PHP     →  POST https://{project}.supabase.co/auth/v1/token?grant_type=password
Response→  { access_token, refresh_token, expires_in }
Client  →  Stores access_token in memory / sessionStorage (never localStorage)
```

### GitHub OAuth
```
Client  →  supabase.auth.signInWithOAuth({ provider: 'github' })
Supabase→  Redirects to GitHub, back to /auth/callback
PHP     →  GET /api/auth/callback
           Check if profiles row exists for this user_id
           If not → INSERT profiles { id, role: 'customer' } (GitHub is customer-only)
```

### Every Protected Request
```
Client  →  Authorization: Bearer <JWT>
AuthMiddleware  →  GET https://{project}.supabase.co/auth/v1/user
                   Validates token, extracts user_id
                   Fetches profiles.role from DB
EmailVerifiedMiddleware → Check auth.users.email_confirmed_at IS NOT NULL
RoleMiddleware  →  Compare route requirement vs profiles.role
                   Mismatch → 403 Forbidden
```

---

## 7. Supabase Storage Buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `shop-banners` | Public | Shop banner images |
| `shop-avatars` | Public | Shop profile pictures |
| `product-images` | Public | Product photos |
| `ad-images` | Public | Advertisement promo images |
| `payment-qr-codes` | **Private** | QR codes — served via signed URL (1-hour expiry) |

### Upload Strategy

The TypeScript client uploads files **directly to Supabase Storage** using the Supabase JS SDK and the user's JWT. PHP never handles binary file data.

```typescript
// Example: product image upload
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`${shopId}/${Date.now()}.jpg`, file)

// Then send only the URL to PHP
await apiFetch('/owner/products', {
  method: 'POST',
  body: JSON.stringify({ ...productData, image_url: data.path })
})
```

### Signed URL for Payment QR
```
Client  →  GET /api/owner/shop/qr/signed
PHP     →  Calls Supabase Storage Admin API to generate signed URL (3600s expiry)
Response→  { signed_url: "https://..." }
Client  →  Renders QR image from signed URL in a modal
```

---

## 8. TypeScript Client Strategy

### Supabase client init

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### PHP API wrapper

```typescript
// services/api.ts
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
}

export const api = {
  get:    (path: string)              => apiFetch(path),
  post:   (path: string, body: unknown) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path: string, body: unknown) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path: string)              => apiFetch(path, { method: 'DELETE' })
}
```

### Client-side routing (vanilla)

```typescript
// Reads pathname and dynamically imports the correct page module
const routes: Record<string, () => Promise<void>> = {
  '/':               () => import('./pages/customer/browse').then(m => m.init()),
  '/dashboard':      () => import('./pages/customer/dashboard').then(m => m.init()),
  '/owner/dashboard':() => import('./pages/owner/dashboard').then(m => m.init()),
  '/owner/products': () => import('./pages/owner/products').then(m => m.init()),
  '/owner/ads':      () => import('./pages/owner/ads').then(m => m.init()),
}

const handler = routes[window.location.pathname]
if (handler) handler()
```

---

## 9. Advice & Critical Notes

### Do these first, before any feature work

1. **RLS before controllers.** Configure all RLS policies before writing a single PHP controller. PHP logic is a second layer, not the primary access control.

2. **Two Supabase PHP clients.** Create a `Service Role` client (server-side only, never exposed to browser) for admin operations like token verification and user creation, and a separate `Anon Key` client for public queries.

3. **Implement `EmailVerifiedMiddleware` early.** It must gate every protected route from the start. Retrofitting this after features are built creates security gaps.

4. **Slug enforcement at DB level.** Use `UNIQUE` constraint on `shops.slug`. Slugify on creation in PHP, do not rely on the client to send a clean slug.

5. **Log shop views from day one.** Add a `shop_views` INSERT inside `GET /api/shops/{slug}` immediately. Analytics data cannot be backfilled.

### Payment QR flow design

Since payments are peer-to-peer (no payment gateway), the UX flow must be explicit to avoid dispute:

```
Customer lands on shop page
  → Adds product(s) to cart
  → Clicks "Checkout"
  → PHP creates order with status = 'pending'
  → Modal opens with shop's QR code (signed URL, 1hr)
  → Customer scans and pays externally
  → Customer clicks "I've paid" → order status = 'pending' (awaiting confirmation)
  → Shop owner sees order, confirms payment → status = 'paid'
  → Owner updates to 'shipped' / 'delivered' manually
```

### Cart-to-Order rule

A single cart checkout should only cover products from **one shop** per order. If a customer has items from multiple shops, create one `orders` row per shop. Enforce this in `POST /api/orders`.

### PHP `SupabaseClient.php` outline

```php
class SupabaseClient {
  private string $baseUrl;
  private string $serviceKey;

  public function __construct() {
    $this->baseUrl    = getenv('SUPABASE_URL');
    $this->serviceKey = getenv('SUPABASE_SERVICE_KEY');
  }

  // Verify JWT and return user object
  public function getUser(string $jwt): ?array { ... }

  // PostgREST query
  public function from(string $table): QueryBuilder { ... }

  // Generate signed storage URL
  public function signedUrl(string $bucket, string $path, int $expiresIn = 3600): string { ... }
}
```

### TypeScript types (shared)

```typescript
// types/index.ts
export type Role = 'customer' | 'shop_owner'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type FontStyle = 'modern' | 'classic' | 'technical' | 'elegant'

export interface Profile { id: string; role: Role; full_name: string | null; birthday: string | null; address: string | null }
export interface Shop { id: string; owner_id: string; name: string; slug: string; bio: string | null; banner_url: string | null; avatar_url: string | null }
export interface Product { id: string; shop_id: string; category_id: string | null; name: string; description: string | null; price: number; image_url: string | null; stock: number | null; is_active: boolean }
export interface Advertisement { id: string; shop_id: string; product_id: string | null; promo_image_url: string | null; copy_text: string | null; font_style: FontStyle; is_active: boolean }
export interface CartItem { id: string; customer_id: string; product_id: string; quantity: number; product?: Product }
export interface Order { id: string; customer_id: string; shop_id: string; status: OrderStatus; total_amount: number; created_at: string }
export interface OrderItem { id: string; order_id: string; product_id: string; quantity: number; price_at_purchase: number }
```
