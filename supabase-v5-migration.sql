-- ─────────────────────────────────────────────
-- HOXA v5.1 Migration — Multi-Corridor Architecture
-- Run this in Supabase SQL Editor AFTER the base schema
-- ─────────────────────────────────────────────

-- ══════════════════════════════════════════════
-- 1. NEW TABLES
-- ══════════════════════════════════════════════

-- ── CORRIDORS ───────────────────────────────
-- Every active exchange route is one record. Adding a corridor = one insert.
create table if not exists corridors (
  id uuid primary key default gen_random_uuid(),
  send_country text not null,         -- ISO 2-letter: GH, CI, SN, NG, KE
  send_currency text not null,        -- GHS, XOF, NGN, KES
  receive_country text not null,
  receive_currency text not null,
  collection_account_id uuid,         -- FK added after hoxa_collection_accounts exists
  min_amount numeric not null default 10,
  max_amount numeric not null default 50000,
  is_active boolean not null default true,
  launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (send_country, send_currency, receive_country, receive_currency)
);

alter table corridors add column if not exists send_country text not null default '';
alter table corridors add column if not exists send_currency text not null default '';
alter table corridors add column if not exists receive_country text not null default '';
alter table corridors add column if not exists receive_currency text not null default '';
alter table corridors add column if not exists collection_account_id uuid;
alter table corridors add column if not exists min_amount numeric not null default 10;
alter table corridors add column if not exists max_amount numeric not null default 50000;
alter table corridors add column if not exists is_active boolean not null default true;
alter table corridors add column if not exists launched_at timestamptz;
alter table corridors add column if not exists created_at timestamptz not null default now();
alter table corridors add column if not exists updated_at timestamptz not null default now();
alter table corridors enable row level security;
drop policy if exists "Anyone can read active corridors" on corridors;
drop policy if exists "Admins manage corridors" on corridors;
create policy "Anyone can read active corridors" on corridors for select using (true);
create policy "Admins manage corridors" on corridors for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ── HOXA COLLECTION ACCOUNTS ────────────────
-- One per currency/country — where buyers send money
create table if not exists hoxa_collection_accounts (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  currency text not null,
  provider text not null,              -- "MTN Ghana", "Orange CI", "GCB Bank"
  account_number text not null,
  account_name text not null default 'HOXA Secure Account',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hoxa_collection_accounts add column if not exists country text not null default '';
alter table hoxa_collection_accounts add column if not exists currency text not null default '';
alter table hoxa_collection_accounts add column if not exists provider text not null default '';
alter table hoxa_collection_accounts add column if not exists account_number text not null default '';
alter table hoxa_collection_accounts add column if not exists account_name text not null default 'HOXA Secure Account';
alter table hoxa_collection_accounts add column if not exists is_active boolean not null default true;
alter table hoxa_collection_accounts add column if not exists created_at timestamptz not null default now();
alter table hoxa_collection_accounts add column if not exists updated_at timestamptz not null default now();
alter table hoxa_collection_accounts enable row level security;
drop policy if exists "Anyone can read active collection accounts" on hoxa_collection_accounts;
drop policy if exists "Admins manage collection accounts" on hoxa_collection_accounts;
create policy "Anyone can read active collection accounts" on hoxa_collection_accounts
  for select using (true);
create policy "Admins manage collection accounts" on hoxa_collection_accounts for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Add FK from corridors to collection accounts (safe re-run)
alter table corridors
  drop constraint if exists corridors_collection_account_fk;
alter table corridors
  add constraint corridors_collection_account_fk
  foreign key (collection_account_id)
  references hoxa_collection_accounts(id);

-- ── PAYMENT PROVIDERS ───────────────────────
-- Every payment method in every country — USSD, app, bank, QR
create table if not exists payment_providers (
  id uuid primary key default gen_random_uuid(),
  country text not null,               -- GH, CI, SN, NG
  currency text not null,              -- GHS, XOF, NGN
  provider_name text not null,         -- "Wave", "MTN MoMo", "Orange Money", "GCB Bank"
  method_type text not null check (method_type in ('app','ussd','bank','qr','cash_deposit')),
  display_name text not null,          -- shown on method selector card
  display_icon text,                   -- icon slug for the selector
  instruction_template jsonb not null default '{}',  -- varies by method_type
  account_number_format text,          -- regex for validation
  account_number_length integer,
  sort_order integer not null default 100,  -- lower = shown first (apps first, USSD last)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country, currency, provider_name)
);

alter table payment_providers alter column name set default '';
alter table payment_providers add column if not exists country text not null default '';
alter table payment_providers add column if not exists currency text not null default '';
alter table payment_providers add column if not exists provider_name text not null default '';
alter table payment_providers add column if not exists method_type text not null default 'app';
alter table payment_providers add column if not exists display_name text not null default '';
alter table payment_providers add column if not exists display_icon text;
alter table payment_providers add column if not exists instruction_template jsonb not null default '{}';
alter table payment_providers add column if not exists account_number_format text;
alter table payment_providers add column if not exists account_number_length integer;
alter table payment_providers add column if not exists sort_order integer not null default 100;
alter table payment_providers add column if not exists is_active boolean not null default true;
alter table payment_providers add column if not exists created_at timestamptz not null default now();
alter table payment_providers add column if not exists updated_at timestamptz not null default now();
alter table payment_providers enable row level security;
drop policy if exists "Anyone can read active providers" on payment_providers;
drop policy if exists "Admins manage providers" on payment_providers;
create policy "Anyone can read active providers" on payment_providers for select using (true);
create policy "Admins manage providers" on payment_providers for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ── BUYER-SELLER WATCHES ────────────────────
-- "Notify me when available" records
create table if not exists buyer_seller_watches (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references sellers(id) on delete cascade,
  amount numeric,
  corridor_id uuid references corridors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, seller_id, corridor_id)
);

alter table buyer_seller_watches enable row level security;
drop policy if exists "Buyers manage own watches" on buyer_seller_watches;
drop policy if exists "Admins read all watches" on buyer_seller_watches;
create policy "Buyers manage own watches" on buyer_seller_watches for all using (auth.uid() = buyer_id);
create policy "Admins read all watches" on buyer_seller_watches for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ══════════════════════════════════════════════
-- 2. MODIFY EXISTING TABLES
-- ══════════════════════════════════════════════

-- ── PROFILES — add buyer fraud/preference fields ──
alter table profiles add column if not exists registered_send_account text;
alter table profiles add column if not exists registered_send_country text;
alter table profiles add column if not exists preferred_payment_method uuid references payment_providers(id);
alter table profiles add column if not exists unconfirmed_claim_count integer not null default 0;
alter table profiles add column if not exists unconfirmed_claim_reset_at timestamptz;
alter table profiles add column if not exists fraud_flag boolean not null default false;
alter table profiles add column if not exists fraud_flag_reason text;

-- ── SELLERS — add v5.1 availability & multi-corridor fields ──
alter table sellers add column if not exists weekly_hours jsonb not null default '{}';
alter table sellers add column if not exists timezone text not null default 'Africa/Accra';
alter table sellers add column if not exists manual_availability_status text
  check (manual_availability_status in ('available','offline'));
alter table sellers add column if not exists auto_accept_enabled boolean not null default true;
alter table sellers add column if not exists auto_accept_rules jsonb not null default '{}';
alter table sellers add column if not exists settlement_accounts jsonb not null default '{}';
alter table sellers add column if not exists supported_corridors uuid[] not null default '{}';
alter table sellers add column if not exists supported_receive_countries text[] not null default '{}';
alter table sellers add column if not exists admin_availability_override text
  check (admin_availability_override in ('available','offline'));

-- ── TRANSACTIONS — complete v5.1 state machine ──
-- First drop the old status check constraint
alter table transactions drop constraint if exists transactions_status_check;

-- Add new v5.1 status constraint with all states
alter table transactions add constraint transactions_status_check
  check (status in (
    'initiated','queued','activated',
    'pending_acceptance','accepted',
    'awaiting_payment',
    'pending_ops_confirmation',
    'payment_confirmed','payment_rejected','window_expired','payment_expired',
    'fulfillment_in_progress',
    'pending_receipt_confirmation',
    'receipt_confirmed','auto_confirmed','disputed',
    'pending_settlement','fully_completed',
    'acceptance_failed','silent_reroute',
    'cancelled',
    -- Legacy statuses for backward compat
    'pending_seller','seller_accepted','seller_rejected','seller_timeout',
    'payment_submitted','payment_verified','fulfillment','completed'
  ));

-- Add new transaction fields
alter table transactions add column if not exists hoxa_transaction_id text unique;
alter table transactions add column if not exists corridor_id uuid references corridors(id);
alter table transactions add column if not exists buyer_destination_country text;
alter table transactions add column if not exists send_amount numeric;
alter table transactions add column if not exists send_currency text;
alter table transactions add column if not exists receive_amount numeric;
alter table transactions add column if not exists receive_currency text;
alter table transactions add column if not exists exchange_rate numeric;
alter table transactions add column if not exists hoxa_fee_amount numeric not null default 0;
alter table transactions add column if not exists seller_settlement_amount numeric;
alter table transactions add column if not exists buyer_send_account text;
alter table transactions add column if not exists buyer_send_provider text;
alter table transactions add column if not exists buyer_selected_payment_method uuid references payment_providers(id);
alter table transactions add column if not exists buyer_receive_account text;
alter table transactions add column if not exists buyer_receive_provider text;
alter table transactions add column if not exists rate_locked_at timestamptz;
alter table transactions add column if not exists rate_expires_at timestamptz;
alter table transactions add column if not exists ive_paid_tapped_at timestamptz;
alter table transactions add column if not exists payment_window_expires_at timestamptz;
alter table transactions add column if not exists payment_confirmed_at timestamptz;
alter table transactions add column if not exists fulfillment_notified_at timestamptz;
alter table transactions add column if not exists fulfillment_confirmed_at timestamptz;
alter table transactions add column if not exists receipt_confirmed_at timestamptz;
alter table transactions add column if not exists settlement_released_at timestamptz;
alter table transactions add column if not exists auto_confirm_due_at timestamptz;
alter table transactions add column if not exists dispute_reason text;
alter table transactions add column if not exists ops_reject_reason text;
alter table transactions add column if not exists payment_screen_loaded_at timestamptz;
alter table transactions add column if not exists updated_at timestamptz not null default now();

-- ══════════════════════════════════════════════
-- 3. GENERATE HOXA TRANSACTION IDs
-- ══════════════════════════════════════════════

-- Function to generate human-readable transaction IDs: HOXA-XXXX
create or replace function generate_hoxa_transaction_id()
returns trigger language plpgsql as $$
declare
  new_id text;
  seq_val integer;
begin
  -- Use a sequence for unique numeric IDs
  select nextval('hoxa_txn_seq') into seq_val;
  new_id := 'HOXA-' || lpad(seq_val::text, 4, '0');
  new.hoxa_transaction_id := new_id;
  return new;
end;
$$;

-- Create the sequence
create sequence if not exists hoxa_txn_seq start with 1000;

-- Trigger on insert
drop trigger if exists set_hoxa_transaction_id on transactions;
create trigger set_hoxa_transaction_id
  before insert on transactions
  for each row
  when (new.hoxa_transaction_id is null)
  execute function generate_hoxa_transaction_id();

-- ══════════════════════════════════════════════
-- 4. AUTO-UPDATE updated_at TRIGGERS
-- ══════════════════════════════════════════════

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_transactions_updated_at on transactions;
create trigger set_transactions_updated_at before update on transactions
  for each row execute function update_updated_at();

drop trigger if exists set_corridors_updated_at on corridors;
create trigger set_corridors_updated_at before update on corridors
  for each row execute function update_updated_at();

drop trigger if exists set_payment_providers_updated_at on payment_providers;
create trigger set_payment_providers_updated_at before update on payment_providers
  for each row execute function update_updated_at();

drop trigger if exists set_collection_accounts_updated_at on hoxa_collection_accounts;
create trigger set_collection_accounts_updated_at before update on hoxa_collection_accounts
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════
-- 5. REALTIME SUBSCRIPTIONS
-- ══════════════════════════════════════════════

do $$ begin
  alter publication supabase_realtime add table corridors;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table buyer_seller_watches;
exception when others then null; end $$;

-- ══════════════════════════════════════════════
-- 6. SEED DATA — Launch corridor + providers
-- ══════════════════════════════════════════════

-- Insert initial collection accounts (safe re-run)
insert into hoxa_collection_accounts (id, country, currency, provider, account_number, account_name)
select 'a0000000-0000-0000-0000-000000000001', 'GH', 'GHS', 'MTN Ghana', '0241234567', 'HOXA Secure Account'
where not exists (select 1 from hoxa_collection_accounts where id = 'a0000000-0000-0000-0000-000000000001');

insert into hoxa_collection_accounts (id, country, currency, provider, account_number, account_name)
select 'a0000000-0000-0000-0000-000000000002', 'CI', 'XOF', 'Orange Money', '0712345678', 'HOXA Secure Account'
where not exists (select 1 from hoxa_collection_accounts where id = 'a0000000-0000-0000-0000-000000000002');

-- Insert launch corridors (safe re-run)
insert into corridors (send_country, send_currency, receive_country, receive_currency, collection_account_id, min_amount, max_amount, is_active, launched_at)
select 'GH', 'GHS', 'CI', 'XOF', 'a0000000-0000-0000-0000-000000000001', 50, 50000, true, now()
where not exists (select 1 from corridors where send_country='GH' and send_currency='GHS' and receive_country='CI' and receive_currency='XOF');

insert into corridors (send_country, send_currency, receive_country, receive_currency, collection_account_id, min_amount, max_amount, is_active, launched_at)
select 'CI', 'XOF', 'GH', 'GHS', 'a0000000-0000-0000-0000-000000000002', 5000, 5000000, true, now()
where not exists (select 1 from corridors where send_country='CI' and send_currency='XOF' and receive_country='GH' and receive_currency='GHS');

-- ── XOF ↔ XOF (same currency, different UEMOA countries) ──
insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Senegal', 'XOF', 'Côte d''Ivoire', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Senegal' and receive_country='Côte d''Ivoire');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Côte d''Ivoire', 'XOF', 'Senegal', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Côte d''Ivoire' and receive_country='Senegal');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Senegal', 'XOF', 'Mali', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Senegal' and receive_country='Mali');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Mali', 'XOF', 'Senegal', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Mali' and receive_country='Senegal');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Senegal', 'XOF', 'Burkina Faso', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Senegal' and receive_country='Burkina Faso');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Burkina Faso', 'XOF', 'Senegal', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Burkina Faso' and receive_country='Senegal');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Côte d''Ivoire', 'XOF', 'Mali', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Côte d''Ivoire' and receive_country='Mali');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Mali', 'XOF', 'Côte d''Ivoire', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Mali' and receive_country='Côte d''Ivoire');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Côte d''Ivoire', 'XOF', 'Burkina Faso', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Côte d''Ivoire' and receive_country='Burkina Faso');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Burkina Faso', 'XOF', 'Côte d''Ivoire', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Burkina Faso' and receive_country='Côte d''Ivoire');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Togo', 'XOF', 'Benin', 'XOF', 1000, 1000000, true, now()
where not exists (select 1 from corridors where send_country='Togo' and receive_country='Benin');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Benin', 'XOF', 'Togo', 'XOF', 1000, 1000000, true, now()
where not exists (select 1 from corridors where send_country='Benin' and receive_country='Togo');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Togo', 'XOF', 'Côte d''Ivoire', 'XOF', 1000, 1000000, true, now()
where not exists (select 1 from corridors where send_country='Togo' and receive_country='Côte d''Ivoire');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Benin', 'XOF', 'Senegal', 'XOF', 1000, 1000000, true, now()
where not exists (select 1 from corridors where send_country='Benin' and receive_country='Senegal');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Niger', 'XOF', 'Senegal', 'XOF', 1000, 1000000, true, now()
where not exists (select 1 from corridors where send_country='Niger' and receive_country='Senegal');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Senegal', 'XOF', 'Niger', 'XOF', 1000, 1000000, true, now()
where not exists (select 1 from corridors where send_country='Senegal' and receive_country='Niger');

-- ── XAF ↔ XAF (same currency, different CEMAC countries) ──
insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Cameroon', 'XAF', 'Chad', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Cameroon' and receive_country='Chad');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Chad', 'XAF', 'Cameroon', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Chad' and receive_country='Cameroon');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Cameroon', 'XAF', 'Gabon', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Cameroon' and receive_country='Gabon');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Gabon', 'XAF', 'Cameroon', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Gabon' and receive_country='Cameroon');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Cameroon', 'XAF', 'Republic of Congo', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Cameroon' and receive_country='Republic of Congo');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Republic of Congo', 'XAF', 'Cameroon', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Republic of Congo' and receive_country='Cameroon');

-- ── XOF ↔ XAF (cross-zone CFA) ──
insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Senegal', 'XOF', 'Cameroon', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Senegal' and receive_country='Cameroon');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Cameroon', 'XAF', 'Senegal', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Cameroon' and receive_country='Senegal');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Côte d''Ivoire', 'XOF', 'Cameroon', 'XAF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Côte d''Ivoire' and receive_country='Cameroon');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Cameroon', 'XAF', 'Côte d''Ivoire', 'XOF', 1000, 2000000, true, now()
where not exists (select 1 from corridors where send_country='Cameroon' and receive_country='Côte d''Ivoire');

-- ── GHS ↔ XOF additional countries ──
insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Ghana', 'GHS', 'Senegal', 'XOF', 50, 50000, true, now()
where not exists (select 1 from corridors where send_country='Ghana' and receive_country='Senegal');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Senegal', 'XOF', 'Ghana', 'GHS', 5000, 5000000, true, now()
where not exists (select 1 from corridors where send_country='Senegal' and receive_country='Ghana');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Ghana', 'GHS', 'Togo', 'XOF', 50, 50000, true, now()
where not exists (select 1 from corridors where send_country='Ghana' and receive_country='Togo');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Togo', 'XOF', 'Ghana', 'GHS', 5000, 5000000, true, now()
where not exists (select 1 from corridors where send_country='Togo' and receive_country='Ghana');

-- ── Nigeria ↔ Ghana ──
insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Nigeria', 'NGN', 'Ghana', 'GHS', 5000, 5000000, true, now()
where not exists (select 1 from corridors where send_country='Nigeria' and receive_country='Ghana');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Ghana', 'GHS', 'Nigeria', 'NGN', 50, 50000, true, now()
where not exists (select 1 from corridors where send_country='Ghana' and receive_country='Nigeria');

-- ── Nigeria ↔ XOF ──
insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Nigeria', 'NGN', 'Côte d''Ivoire', 'XOF', 5000, 5000000, true, now()
where not exists (select 1 from corridors where send_country='Nigeria' and receive_country='Côte d''Ivoire');

insert into corridors (send_country, send_currency, receive_country, receive_currency, min_amount, max_amount, is_active, launched_at)
select 'Nigeria', 'NGN', 'Senegal', 'XOF', 5000, 5000000, true, now()
where not exists (select 1 from corridors where send_country='Nigeria' and receive_country='Senegal');

-- Insert payment providers (safe re-run — skip if provider_name already exists for that country)
insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'GH', 'GHS', 'Wave Ghana', 'app', 'Wave', 'wave', 10, '{"steps": ["Open your Wave app", "Tap Send Money", "Enter the number below", "Enter the exact amount", "Add the reference in the note field", "Confirm and send"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb
where not exists (select 1 from payment_providers where provider_name='Wave Ghana');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'GH', 'GHS', 'MTN MoMo', 'app', 'MTN MoMo', 'mtn', 20, '{"steps": ["Open your MTN MoMo app", "Tap Transfer", "Select Send Money", "Enter the number below", "Enter the exact amount", "Add the reference in the note", "Confirm"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb
where not exists (select 1 from payment_providers where provider_name='MTN MoMo');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'GH', 'GHS', 'Telecel Cash', 'app', 'Telecel Cash', 'telecel', 30, '{"steps": ["Open your Telecel Cash app", "Tap Send Money", "Enter the number below", "Enter the exact amount", "Add the reference", "Confirm"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb
where not exists (select 1 from payment_providers where provider_name='Telecel Cash');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'GH', 'GHS', 'MTN USSD', 'ussd', 'USSD (MTN)', 'ussd', 90, '{"dial": "*170#", "steps": ["Dial *170#", "Select Send Money (Option 1)", "Select MoMo User", "Enter number: {hoxa_account_number}", "Enter amount: {send_amount}", "Enter reference: {hoxa_transaction_id}", "Confirm with your PIN"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}"}}'::jsonb
where not exists (select 1 from payment_providers where provider_name='MTN USSD');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'GH', 'GHS', 'GCB Bank', 'bank', 'Bank Transfer', 'bank', 80, '{"bank_name": "GCB Bank Ghana", "account_number": "{hoxa_account_number}", "account_name": "HOXA Secure Account", "fields": {"amount": "{send_amount}", "reference": "{hoxa_transaction_id}"}}'::jsonb
where not exists (select 1 from payment_providers where provider_name='GCB Bank');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'CI', 'XOF', 'Wave CI', 'app', 'Wave', 'wave', 10, '{"steps": ["Ouvrez votre application Wave", "Appuyez sur Envoyer", "Entrez le numero ci-dessous", "Entrez le montant exact", "Ajoutez la reference dans la note", "Confirmez"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": true}'::jsonb
where not exists (select 1 from payment_providers where provider_name='Wave CI');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'CI', 'XOF', 'Orange Money CI', 'app', 'Orange Money', 'orange', 20, '{"steps": ["Ouvrez Orange Money", "Appuyez sur Transfert", "Entrez le numero ci-dessous", "Entrez le montant exact", "Ajoutez la reference", "Confirmez"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb
where not exists (select 1 from payment_providers where provider_name='Orange Money CI');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'CI', 'XOF', 'MTN MoMo CI', 'app', 'MTN MoMo CI', 'mtn', 30, '{"steps": ["Ouvrez MTN MoMo", "Appuyez sur Envoyer de l''argent", "Entrez le numero", "Entrez le montant", "Ajoutez la reference", "Confirmez"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb
where not exists (select 1 from payment_providers where provider_name='MTN MoMo CI');

insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
select 'CI', 'XOF', 'Orange USSD CI', 'ussd', 'USSD (Orange)', 'ussd', 90, '{"dial": "#144#", "steps": ["Composez #144#", "Selectionnez Transfert", "Entrez le numero: {hoxa_account_number}", "Entrez le montant: {send_amount}", "Entrez reference: {hoxa_transaction_id}", "Confirmez avec votre code secret"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}"}}'::jsonb
where not exists (select 1 from payment_providers where provider_name='Orange USSD CI');

-- ══════════════════════════════════════════════
-- 7. NEW PLATFORM SETTINGS for v5.1
-- ══════════════════════════════════════════════

insert into settings (key, value) values
  ('rate_lock_duration_seconds', '600'),
  ('payment_window_duration_seconds', '1200'),
  ('minimum_tap_time_seconds', '30'),
  ('seller_auto_accept_timeout_seconds', '15'),
  ('seller_fulfillment_sla_seconds', '900'),
  ('receipt_auto_confirm_seconds', '10800'),
  ('unconfirmed_claim_threshold', '3'),
  ('platform_open_hour', '7'),
  ('platform_close_hour', '22'),
  ('platform_timezone', '"Africa/Accra"'),
  ('queue_mode_enabled', 'true'),
  ('hoxa_buyer_fee_percent', '1'),
  ('platform_status', '"open"')
on conflict (key) do nothing;
