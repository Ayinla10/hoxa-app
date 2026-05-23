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

alter table corridors enable row level security;
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

alter table hoxa_collection_accounts enable row level security;
create policy "Anyone can read active collection accounts" on hoxa_collection_accounts
  for select using (true);
create policy "Admins manage collection accounts" on hoxa_collection_accounts for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Add FK from corridors to collection accounts
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
  updated_at timestamptz not null default now()
);

alter table payment_providers enable row level security;
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

create trigger set_transactions_updated_at before update on transactions
  for each row execute function update_updated_at();

create trigger set_corridors_updated_at before update on corridors
  for each row execute function update_updated_at();

create trigger set_payment_providers_updated_at before update on payment_providers
  for each row execute function update_updated_at();

create trigger set_collection_accounts_updated_at before update on hoxa_collection_accounts
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════
-- 5. REALTIME SUBSCRIPTIONS
-- ══════════════════════════════════════════════

alter publication supabase_realtime add table corridors;
alter publication supabase_realtime add table buyer_seller_watches;

-- ══════════════════════════════════════════════
-- 6. SEED DATA — Launch corridor + providers
-- ══════════════════════════════════════════════

-- Insert initial collection accounts
insert into hoxa_collection_accounts (id, country, currency, provider, account_number, account_name)
values
  ('a0000000-0000-0000-0000-000000000001', 'GH', 'GHS', 'MTN Ghana', '0241234567', 'HOXA Secure Account'),
  ('a0000000-0000-0000-0000-000000000002', 'CI', 'XOF', 'Orange Money', '0712345678', 'HOXA Secure Account')
on conflict do nothing;

-- Insert launch corridors
insert into corridors (send_country, send_currency, receive_country, receive_currency, collection_account_id, min_amount, max_amount, is_active, launched_at)
values
  ('GH', 'GHS', 'CI', 'XOF', 'a0000000-0000-0000-0000-000000000001', 50, 50000, true, now()),
  ('CI', 'XOF', 'GH', 'GHS', 'a0000000-0000-0000-0000-000000000002', 5000, 5000000, true, now())
on conflict (send_country, send_currency, receive_country, receive_currency) do nothing;

-- Insert payment providers for Ghana
insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
values
  ('GH', 'GHS', 'Wave Ghana', 'app', 'Wave', 'wave', 10,
    '{"steps": ["Open your Wave app", "Tap Send Money", "Enter the number below", "Enter the exact amount", "Add the reference in the note field", "Confirm and send"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb),
  ('GH', 'GHS', 'MTN MoMo', 'app', 'MTN MoMo', 'mtn', 20,
    '{"steps": ["Open your MTN MoMo app", "Tap Transfer", "Select Send Money", "Enter the number below", "Enter the exact amount", "Add the reference in the note", "Confirm"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb),
  ('GH', 'GHS', 'Telecel Cash', 'app', 'Telecel Cash', 'telecel', 30,
    '{"steps": ["Open your Telecel Cash app", "Tap Send Money", "Enter the number below", "Enter the exact amount", "Add the reference", "Confirm"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb),
  ('GH', 'GHS', 'MTN USSD', 'ussd', 'USSD (MTN)', 'ussd', 90,
    '{"dial": "*170#", "steps": ["Dial *170#", "Select Send Money (Option 1)", "Select MoMo User", "Enter number: {hoxa_account_number}", "Enter amount: {send_amount}", "Enter reference: {hoxa_transaction_id}", "Confirm with your PIN"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}"}}'::jsonb),
  ('GH', 'GHS', 'GCB Bank', 'bank', 'Bank Transfer', 'bank', 80,
    '{"bank_name": "GCB Bank Ghana", "account_number": "{hoxa_account_number}", "account_name": "HOXA Secure Account", "fields": {"amount": "{send_amount}", "reference": "{hoxa_transaction_id}"}}'::jsonb)
on conflict do nothing;

-- Insert payment providers for Cote d'Ivoire
insert into payment_providers (country, currency, provider_name, method_type, display_name, display_icon, sort_order, instruction_template)
values
  ('CI', 'XOF', 'Wave CI', 'app', 'Wave', 'wave', 10,
    '{"steps": ["Ouvrez votre application Wave", "Appuyez sur Envoyer", "Entrez le numero ci-dessous", "Entrez le montant exact", "Ajoutez la reference dans la note", "Confirmez"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": true}'::jsonb),
  ('CI', 'XOF', 'Orange Money CI', 'app', 'Orange Money', 'orange', 20,
    '{"steps": ["Ouvrez Orange Money", "Appuyez sur Transfert", "Entrez le numero ci-dessous", "Entrez le montant exact", "Ajoutez la reference", "Confirmez"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb),
  ('CI', 'XOF', 'MTN MoMo CI', 'app', 'MTN MoMo', 'mtn', 30,
    '{"steps": ["Ouvrez MTN MoMo", "Appuyez sur Envoyer de l''argent", "Entrez le numero", "Entrez le montant", "Ajoutez la reference", "Confirmez"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}", "note": "{hoxa_transaction_id}"}, "supports_qr": false}'::jsonb),
  ('CI', 'XOF', 'Orange USSD CI', 'ussd', 'USSD (Orange)', 'ussd', 90,
    '{"dial": "#144#", "steps": ["Composez #144#", "Selectionnez Transfert", "Entrez le numero: {hoxa_account_number}", "Entrez le montant: {send_amount}", "Entrez reference: {hoxa_transaction_id}", "Confirmez avec votre code secret"], "fields": {"number": "{hoxa_account_number}", "amount": "{send_amount}"}}'::jsonb)
on conflict do nothing;

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
