-- Supabase SQL Schema Setup
-- Run these queries in your Supabase SQL Editor to create the required tables

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  member_id TEXT UNIQUE,
  mudra_gold INTEGER DEFAULT 0,
  mudra_silver INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT user_id_unique UNIQUE(user_id)
);

-- 2. Booking Requests Table
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  mudra_reward INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT,
  booking_request_id UUID REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  mudra_reward INTEGER DEFAULT 0,
  payment_id TEXT,
  order_status TEXT DEFAULT 'confirmed', -- confirmed, shipped, delivered, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'completed', -- completed, pending, failed, refunded
  payment_method TEXT DEFAULT 'razorpay',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_product UNIQUE(user_id, product_id)
);

-- 6. Cart/Tray Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON public.booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart_items(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- User Profiles
CREATE POLICY "Users can read their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Booking Requests
CREATE POLICY "Users can read their own bookings" ON public.booking_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert bookings" ON public.booking_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.booking_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can read their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments
CREATE POLICY "Users can read their payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = payments.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Wishlist
CREATE POLICY "Users can manage their wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Cart
CREATE POLICY "Users can manage their cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Useful Views
CREATE OR REPLACE VIEW user_booking_summary AS
SELECT 
  bp.user_id,
  up.member_id,
  up.full_name,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN bp.status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN bp.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  SUM(bp.price) as total_value,
  SUM(bp.mudra_reward) as total_mudra_earned
FROM public.booking_requests bp
LEFT JOIN public.user_profiles up ON bp.user_id = up.user_id
GROUP BY bp.user_id, up.member_id, up.full_name;

CREATE OR REPLACE VIEW user_order_summary AS
SELECT 
  o.user_id,
  up.member_id,
  up.full_name,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders,
  SUM(o.price) as total_spent,
  SUM(o.mudra_reward) as total_mudra_earned
FROM public.orders o
LEFT JOIN public.user_profiles up ON o.user_id = up.user_id
GROUP BY o.user_id, up.member_id, up.full_name;
