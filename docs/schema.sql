-- Complete database for the hospital POS. Run once on a new, empty Supabase project
-- (SQL Editor > New query > paste > Run). It runs as one transaction, so a failure
-- leaves the database unchanged.
--
-- The browser talks to the database directly with the public key, so everything
-- that matters is enforced here:
--   * Row level security decides who can read and change each table.
--   * Bills can only be written through create_bill, record_payment and void_bill.
--     Those functions read prices from the catalogue, never from the browser.
--   * Every change to patients, catalogue, bills and staff lands in audit_log.
--   * A paused subscription blocks data access, not just the screens.

begin;

/* ---------- Tables ---------- */

-- One row: one hospital per deployment. Only the server's secret key can touch it,
-- so the hospital's own users cannot un-pause themselves.
create table public.subscription (
  id integer primary key default 1 check (id = 1),
  is_paid boolean not null default true,
  ends_at date,
  sent_reminders jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.subscription (id) values (1);

create sequence public.staff_seq;
create table public.staff (
  id text primary key default 'STF-' || lpad(nextval('public.staff_seq')::text, 3, '0'),
  auth_user_id uuid not null unique references auth.users (id) on delete restrict,
  first_name text not null check (first_name <> ''),
  last_name text not null check (last_name <> ''),
  email text not null check (email = lower(email)),
  phone text not null default '',
  role text not null check (role in ('admin', 'cashier', 'receptionist', 'pharmacist', 'lab', 'nurse', 'doctor')),
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index staff_email_key on public.staff (email);

create sequence public.patient_seq;
create table public.patients (
  id text primary key default 'P-' || lpad(nextval('public.patient_seq')::text, 5, '0'),
  first_name text not null check (first_name <> ''),
  last_name text not null check (last_name <> ''),
  dob date check (dob <= current_date),
  gender text not null check (gender in ('Female', 'Male', 'Other')),
  phone text not null default '',
  national_id text not null default '',
  town text not null default '',
  insurer text not null default '',
  member_no text not null default '',
  next_of_kin_name text not null default '',
  next_of_kin_phone text not null default '',
  created_at timestamptz not null default now(),
  check (insurer = '' or member_no <> '')
);
create unique index patients_national_id_key on public.patients (national_id) where national_id <> '';

create sequence public.item_seq;
create table public.catalogue (
  id text primary key default 'ITM-' || lpad(nextval('public.item_seq')::text, 4, '0'),
  name text not null check (name <> ''),
  department text not null check (department in ('Consultation', 'Laboratory', 'Imaging', 'Pharmacy', 'Procedures', 'Ward')),
  price integer not null check (price >= 0),
  tracks_stock boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  unit text not null default '',
  created_at timestamptz not null default now()
);
create unique index catalogue_name_key on public.catalogue (department, lower(name));

-- A row-locked counter rather than a sequence: invoice numbers must have no gaps,
-- and a sequence skips a number whenever a transaction rolls back.
create table public.counters (
  name text primary key,
  value integer not null
);
insert into public.counters (name, value) values ('bill', 0);

create table public.bills (
  id text primary key,
  patient_id text not null references public.patients (id) on delete restrict,
  patient_name text not null,
  insurer text not null default '',
  member_no text not null default '',
  subtotal integer not null check (subtotal >= 0),
  waiver integer not null default 0 check (waiver >= 0 and waiver <= subtotal),
  total integer not null,
  status text not null check (status in ('unpaid', 'paid', 'claim', 'void')),
  payment_method text check (payment_method in ('cash', 'mpesa', 'card', 'insurance')),
  payment_reference text not null default '',
  paid_at timestamptz,
  received_by text,
  created_at timestamptz not null default now(),
  created_by text not null,
  void_reason text,
  voided_by text,
  voided_at timestamptz,
  check (total = subtotal - waiver),
  check (status <> 'paid' or (paid_at is not null and payment_method is not null)),
  check (status <> 'claim' or payment_method = 'insurance'),
  check (status <> 'void' or void_reason is not null)
);
create index bills_patient_id_idx on public.bills (patient_id);
create index bills_created_at_idx on public.bills (created_at desc);
-- One M-Pesa code can pay one bill. Voiding a bill frees its code.
create unique index bills_mpesa_reference_key on public.bills (payment_reference)
  where payment_method = 'mpesa' and status <> 'void';

-- Names and prices are copied here, so later catalogue edits or deletions
-- never change a bill that has already been issued.
create table public.bill_lines (
  bill_id text not null references public.bills (id) on delete restrict,
  position integer not null,
  item_id text not null,
  name text not null,
  department text not null,
  unit_price integer not null,
  qty integer not null check (qty > 0),
  amount integer not null,
  primary key (bill_id, position)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  table_name text not null,
  row_id text not null,
  action text not null,
  actor_id text,
  actor_name text,
  old_data jsonb,
  new_data jsonb
);
create index audit_log_at_idx on public.audit_log (at desc);

/* ---------- Who is asking ---------- */

-- The caller's role, or null if they aren't active staff or the app is paused.
-- Security definer so that policies can call it without recursing into staff's own policies.
create function public.staff_role() returns text
language sql stable security definer set search_path = ''
as $$
  select s.role from public.staff s
  where s.auth_user_id = auth.uid()
    and s.active
    and coalesce((select is_paid from public.subscription where id = 1), true)
$$;

/* ---------- Row level security ---------- */

alter table public.subscription enable row level security;
alter table public.staff enable row level security;
alter table public.patients enable row level security;
alter table public.catalogue enable row level security;
alter table public.counters enable row level security;
alter table public.bills enable row level security;
alter table public.bill_lines enable row level security;
alter table public.audit_log enable row level security;

-- Staff can see their own record even while paused, so sign-in can explain itself.
create policy staff_read on public.staff for select to authenticated
  using (auth_user_id = auth.uid() or (select public.staff_role()) = 'admin');
create policy staff_insert on public.staff for insert to authenticated
  with check ((select public.staff_role()) = 'admin');
create policy staff_update on public.staff for update to authenticated
  using ((select public.staff_role()) = 'admin')
  with check ((select public.staff_role()) = 'admin');

create policy patients_read on public.patients for select to authenticated
  using ((select public.staff_role()) is not null);
create policy patients_insert on public.patients for insert to authenticated
  with check ((select public.staff_role()) is not null);
create policy patients_update on public.patients for update to authenticated
  using ((select public.staff_role()) is not null)
  with check ((select public.staff_role()) is not null);

create policy catalogue_read on public.catalogue for select to authenticated
  using ((select public.staff_role()) is not null);
create policy catalogue_insert on public.catalogue for insert to authenticated
  with check ((select public.staff_role()) in ('admin', 'pharmacist'));
create policy catalogue_update on public.catalogue for update to authenticated
  using ((select public.staff_role()) in ('admin', 'pharmacist'))
  with check ((select public.staff_role()) in ('admin', 'pharmacist'));
create policy catalogue_delete on public.catalogue for delete to authenticated
  using ((select public.staff_role()) in ('admin', 'pharmacist'));

-- Patient pages show billing history to every role, so all active staff can read bills.
create policy bills_read on public.bills for select to authenticated
  using ((select public.staff_role()) is not null);
create policy bill_lines_read on public.bill_lines for select to authenticated
  using ((select public.staff_role()) is not null);

create policy audit_read on public.audit_log for select to authenticated
  using ((select public.staff_role()) = 'admin');

/* ---------- Grants ---------- */

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.staff, public.patients, public.catalogue, public.bills, public.bill_lines, public.audit_log to authenticated;

grant insert (auth_user_id, first_name, last_name, email, phone, role, must_change_password) on public.staff to authenticated;
grant update (first_name, last_name, email, phone, role, active, must_change_password) on public.staff to authenticated;

grant insert (first_name, last_name, dob, gender, phone, national_id, town, insurer, member_no, next_of_kin_name, next_of_kin_phone) on public.patients to authenticated;
grant update (first_name, last_name, dob, gender, phone, national_id, town, insurer, member_no, next_of_kin_name, next_of_kin_phone) on public.patients to authenticated;

grant insert (name, department, price, tracks_stock, stock, reorder_level, unit) on public.catalogue to authenticated;
grant update (name, department, price, tracks_stock, stock, reorder_level, unit) on public.catalogue to authenticated;
grant delete on public.catalogue to authenticated;

grant usage on public.staff_seq, public.patient_seq, public.item_seq to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

/* ---------- Audit trail ---------- */

create function public.audit_row() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor public.staff;
begin
  select * into v_actor from public.staff where auth_user_id = auth.uid();
  insert into public.audit_log (table_name, row_id, action, actor_id, actor_name, old_data, new_data)
  values (
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    tg_op,
    v_actor.id,
    case when v_actor.id is null then null else v_actor.first_name || ' ' || v_actor.last_name end,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger audit_staff after insert or update or delete on public.staff
  for each row execute function public.audit_row();
create trigger audit_patients after insert or update or delete on public.patients
  for each row execute function public.audit_row();
create trigger audit_catalogue after insert or update or delete on public.catalogue
  for each row execute function public.audit_row();
create trigger audit_bills after insert or update or delete on public.bills
  for each row execute function public.audit_row();

/* ---------- Staff safeguards ---------- */

-- Stops an administrator locking themselves out or removing their own admin rights.
create function public.staff_guard() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.auth_user_id = auth.uid() and new.active is distinct from old.active then
    raise exception 'You cannot deactivate your own account.';
  end if;
  if old.auth_user_id = auth.uid() and new.role is distinct from old.role then
    raise exception 'You cannot change your own role.';
  end if;
  return new;
end;
$$;

create trigger staff_guard before update on public.staff
  for each row execute function public.staff_guard();

-- Staff have no write access to their own row, so this clears only the one flag.
create function public.mark_password_changed() returns void
language sql security definer set search_path = ''
as $$
  update public.staff set must_change_password = false where auth_user_id = auth.uid();
$$;

/* ---------- Bills ---------- */

create function public.check_payment(p_method text, p_reference text, p_insurer text) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if p_method not in ('cash', 'mpesa', 'card', 'insurance') then
    raise exception 'Unknown payment method.';
  end if;
  if p_method = 'mpesa' and p_reference = '' then
    raise exception 'Enter the M-Pesa transaction code.';
  end if;
  if p_method = 'insurance' and p_insurer = '' then
    raise exception 'This patient has no insurance on file.';
  end if;
end;
$$;

-- p_lines is [{ "item_id": "...", "qty": 1 }]. p_method null leaves the bill unpaid.
create function public.create_bill(
  p_patient_id text,
  p_lines jsonb,
  p_waiver integer default 0,
  p_method text default null,
  p_reference text default ''
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text := public.staff_role();
  v_actor text;
  v_patient public.patients;
  v_line record;
  v_item public.catalogue;
  v_subtotal integer := 0;
  v_number integer;
  v_id text;
  v_status text;
  v_reference text := upper(trim(coalesce(p_reference, '')));
  v_waiver integer := coalesce(p_waiver, 0);
begin
  if v_role is null or v_role = 'doctor' then
    raise exception 'You do not have permission to create bills.';
  end if;
  if v_waiver <> 0 and v_role not in ('admin', 'cashier') then
    raise exception 'Only an administrator or cashier can give a waiver.';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one item to the bill.';
  end if;

  select * into v_patient from public.patients where id = p_patient_id;
  if not found then
    raise exception 'Patient not found.';
  end if;

  if (select count(*) <> count(distinct item_id) from jsonb_to_recordset(p_lines) as l (item_id text, qty integer)) then
    raise exception 'The same item appears twice on this bill.';
  end if;

  -- Locked in a fixed order so that two simultaneous bills can't deadlock or oversell.
  perform 1 from public.catalogue
  where id in (select item_id from jsonb_to_recordset(p_lines) as l (item_id text, qty integer))
  order by id for update;

  for v_line in select * from jsonb_to_recordset(p_lines) as l (item_id text, qty integer) loop
    select * into v_item from public.catalogue where id = v_line.item_id;
    if not found then
      raise exception 'An item on this bill is no longer in the catalogue.';
    end if;
    if v_line.qty is null or v_line.qty < 1 then
      raise exception 'Invalid quantity for %.', v_item.name;
    end if;
    if v_item.tracks_stock and v_line.qty > v_item.stock then
      raise exception 'Only % of % left in stock.', v_item.stock, v_item.name;
    end if;
    v_subtotal := v_subtotal + v_item.price * v_line.qty;
  end loop;

  if v_waiver < 0 or v_waiver > v_subtotal then
    raise exception 'Waiver must be a whole number no larger than the bill.';
  end if;
  if p_method is not null then
    perform public.check_payment(p_method, v_reference, v_patient.insurer);
  end if;

  select first_name || ' ' || last_name into v_actor from public.staff where auth_user_id = auth.uid();
  update public.counters set value = value + 1 where name = 'bill' returning value into v_number;
  v_id := 'INV-' || lpad(v_number::text, 5, '0');
  v_status := case when p_method is null then 'unpaid' when p_method = 'insurance' then 'claim' else 'paid' end;

  insert into public.bills (
    id, patient_id, patient_name, insurer, member_no, subtotal, waiver, total, status,
    payment_method, payment_reference, paid_at, received_by, created_by
  ) values (
    v_id, v_patient.id, v_patient.first_name || ' ' || v_patient.last_name, v_patient.insurer, v_patient.member_no,
    v_subtotal, v_waiver, v_subtotal - v_waiver, v_status,
    p_method, v_reference,
    case when v_status = 'paid' then now() end,
    case when p_method is not null then v_actor end,
    v_actor
  );

  for v_line in
    select l.item_id, l.qty, l.ord
    from rows from (jsonb_to_recordset(p_lines) as (item_id text, qty integer)) with ordinality as l (item_id, qty, ord)
  loop
    select * into v_item from public.catalogue where id = v_line.item_id;
    insert into public.bill_lines (bill_id, position, item_id, name, department, unit_price, qty, amount)
    values (v_id, v_line.ord, v_item.id, v_item.name, v_item.department, v_item.price, v_line.qty, v_item.price * v_line.qty);
    if v_item.tracks_stock then
      update public.catalogue set stock = stock - v_line.qty where id = v_item.id;
    end if;
  end loop;

  return v_id;
end;
$$;

-- Settles an unpaid bill, or marks a pending insurance claim as paid out.
create function public.record_payment(p_bill_id text, p_method text, p_reference text default '') returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text := public.staff_role();
  v_actor text;
  v_bill public.bills;
  v_reference text := upper(trim(coalesce(p_reference, '')));
begin
  if v_role is null or v_role = 'doctor' then
    raise exception 'You do not have permission to record payments.';
  end if;
  select * into v_bill from public.bills where id = p_bill_id for update;
  if not found then
    raise exception 'Bill not found.';
  end if;
  if v_bill.status not in ('unpaid', 'claim') then
    raise exception 'This bill has no outstanding balance.';
  end if;
  perform public.check_payment(p_method, v_reference, v_bill.insurer);

  select first_name || ' ' || last_name into v_actor from public.staff where auth_user_id = auth.uid();
  if v_bill.status = 'unpaid' and p_method = 'insurance' then
    update public.bills
    set status = 'claim', payment_method = 'insurance', payment_reference = '', received_by = v_actor
    where id = p_bill_id;
  else
    update public.bills
    set status = 'paid', payment_method = p_method, payment_reference = v_reference, paid_at = now(), received_by = v_actor
    where id = p_bill_id;
  end if;
end;
$$;

-- Cancels a bill and returns its medication to stock. Administrators only.
create function public.void_bill(p_bill_id text, p_reason text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor text;
  v_bill public.bills;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if public.staff_role() is distinct from 'admin' then
    raise exception 'Only an administrator can void a bill.';
  end if;
  if v_reason = '' then
    raise exception 'Give a reason for voiding this bill.';
  end if;
  select * into v_bill from public.bills where id = p_bill_id for update;
  if not found then
    raise exception 'Bill not found.';
  end if;
  if v_bill.status = 'void' then
    raise exception 'This bill is already void.';
  end if;

  perform 1 from public.catalogue
  where id in (select item_id from public.bill_lines where bill_id = p_bill_id)
  order by id for update;
  update public.catalogue c
  set stock = c.stock + l.qty
  from public.bill_lines l
  where l.bill_id = p_bill_id and l.item_id = c.id and c.tracks_stock;

  select first_name || ' ' || last_name into v_actor from public.staff where auth_user_id = auth.uid();
  update public.bills
  set status = 'void', void_reason = v_reason, voided_by = v_actor, voided_at = now()
  where id = p_bill_id;
end;
$$;

/* ---------- Function permissions ---------- */

revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function public.staff_role() to authenticated;
grant execute on function public.mark_password_changed() to authenticated;
grant execute on function public.create_bill(text, jsonb, integer, text, text) to authenticated;
grant execute on function public.record_payment(text, text, text) to authenticated;
grant execute on function public.void_bill(text, text) to authenticated;

commit;
