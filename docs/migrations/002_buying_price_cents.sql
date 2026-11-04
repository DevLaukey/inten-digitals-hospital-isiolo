-- Lets buying prices include cents, as supplier invoices do (for example 42.39).
-- Run once, after 001_buying_price.sql. Selling prices stay in whole shillings.

begin;

alter table public.item_costs alter column buying_price type numeric(12, 2);
alter table public.bill_lines alter column unit_cost type numeric(12, 2);

commit;

notify pgrst, 'reload schema';
