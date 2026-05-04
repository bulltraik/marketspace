-- ==========================================
-- MarketSpace: Database Schema (#3)
-- ==========================================

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


-- ==========================================
-- MarketSpace: Row Level Security (RLS) (#4)
-- ==========================================

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
