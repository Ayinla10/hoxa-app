-- ─────────────────────────────────────────────
-- HOXA — Full Database Schema
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── PROFILES ────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  country text not null,
  role text not null default 'buyer' check (role in ('buyer','seller','admin')),
  language varchar(2) not null default 'en',
  admin_permissions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins read all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ── SELLERS ─────────────────────────────────
create table sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  payment_methods text[] not null default '{}',
  currencies text[] not null default '{}',
  daily_limit numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  completion_rate numeric not null default 0,
  avg_response_seconds numeric not null default 0,
  total_transactions integer not null default 0,
  timeout_count integer not null default 0,
  rejection_count integer not null default 0,
  is_company_seller boolean not null default false,
  created_at timestamptz not null default now()
);

alter table sellers enable row level security;
create policy "Approved sellers visible to buyers" on sellers for select using (status = 'approved');
create policy "Sellers manage own record" on sellers for all using (auth.uid() = user_id);
create policy "Admins manage all sellers" on sellers for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ── OFFERS ──────────────────────────────────
create table offers (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  from_currency text not null,
  to_currency text not null,
  rate numeric not null,
  min_amount numeric not null,
  max_amount numeric not null,
  available_liquidity numeric not null default 0,
  payment_methods text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table offers enable row level security;
create policy "Anyone can view available offers" on offers for select using (is_available = true);
create policy "Sellers manage own offers" on offers for all using (
  exists (select 1 from sellers where id = seller_id and user_id = auth.uid())
);
create policy "Admins manage all offers" on offers for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ── TRANSACTIONS ─────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references sellers(id),
  offer_id uuid not null references offers(id),
  from_currency text not null,
  to_currency text not null,
  from_amount numeric not null,
  to_amount numeric not null,
  rate numeric not null,
  status text not null default 'pending_seller' check (status in (
    'pending_seller','seller_accepted','seller_rejected','seller_timeout',
    'payment_submitted','payment_verified','fulfillment','completed','disputed','cancelled'
  )),
  payment_proof_url text,
  payment_reference text,
  payment_notes text,
  seller_response_deadline timestamptz,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;
create policy "Buyers see own transactions" on transactions for select using (auth.uid() = buyer_id);
create policy "Sellers see assigned transactions" on transactions for select using (
  exists (select 1 from sellers where id = seller_id and user_id = auth.uid())
);
create policy "Admins see all transactions" on transactions for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Buyers insert own transactions" on transactions for insert with check (auth.uid() = buyer_id);
create policy "Buyers update own transactions" on transactions for update using (auth.uid() = buyer_id);
create policy "Sellers update assigned transactions" on transactions for update using (
  exists (select 1 from sellers where id = seller_id and user_id = auth.uid())
);
create policy "Admins update transactions" on transactions for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ── NOTIFICATIONS ────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info','success','warning','error')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "Users see own notifications" on notifications for all using (auth.uid() = user_id);

-- ── AUDIT LOGS ───────────────────────────────
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),       -- null for system/cron actions
  actor_role text,                              -- 'buyer','seller','admin','system'
  action text not null,                         -- STATUS_CHANGE | ROLE_CHANGE | SETTINGS_CHANGE
  entity text not null,                         -- 'transaction' | 'profile' | 'settings'
  entity_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
create policy "Admins read audit logs" on audit_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
-- Inserts handled by SECURITY DEFINER triggers — no app-level insert policy needed

-- ── MARKETPLACE SETTINGS ─────────────────────
create table settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('seller_response_timeout_seconds', '120'),
  ('platform_fee_percent', '1.5'),
  ('supported_countries', '["Ghana","Senegal","Côte d''Ivoire","Mali","Burkina Faso","Niger","Togo","Benin","Cameroon"]'),
  ('marketplace_active', 'true');

alter table settings enable row level security;
create policy "Anyone can read settings" on settings for select using (true);
create policy "Admins update settings" on settings for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ── REALTIME ─────────────────────────────────
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table offers;

-- ── FUNCTION: auto-create profile on signup ──
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, country, role, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country', ''),
    'buyer',
    'en'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
