-- Adds a buying price to catalogue items. Run once, after docs/schema.sql.
--
-- Buying prices are in their own table so row level security can hide them: every
-- role reads the catalogue to make bills, but only administrators and pharmacists
-- may see what the hospital pays. `catalogue.price` remains the selling price.

begin;

create table public.item_costs (
  id text primary key references public.catalogue (id) on delete cascade,
  buying_price integer not null check (buying_price >= 0)
);

alter table public.item_costs enable row level security;

create policy item_costs_all on public.item_costs for all to authenticated
  using ((select public.staff_role()) in ('admin', 'pharmacist'))
  with check ((select public.staff_role()) in ('admin', 'pharmacist'));

grant select, insert, update, delete on public.item_costs to authenticated;
grant all on public.item_costs to service_role;

create trigger audit_item_costs after insert or update or delete on public.item_costs
  for each row execute function public.audit_row();

-- The buying price at the moment of sale, so that profit on old bills stays correct
-- after prices change. Null if none was recorded. Bill lines are readable by all staff,
-- so read access is limited to the other columns.
alter table public.bill_lines add column unit_cost integer;

revoke select on public.bill_lines from authenticated;
grant select (bill_id, position, item_id, name, department, unit_price, qty, amount)
  on public.bill_lines to authenticated;

create function public.set_line_cost() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.unit_cost := (select buying_price from public.item_costs where id = new.item_id);
  return new;
end;
$$;
revoke all on function public.set_line_cost() from public, anon, authenticated;

create trigger bill_lines_cost before insert on public.bill_lines
  for each row execute function public.set_line_cost();

commit;

-- Makes the API notice the new table straight away.
notify pgrst, 'reload schema';
