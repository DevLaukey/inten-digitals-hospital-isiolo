-- Lets a catalogue item exist before its selling price is decided. Run once, after 002.
-- Such an item can't be billed: create_bill's total comes out null, which the
-- bills table refuses, so the whole bill is rejected rather than charged at nothing.

begin;

alter table public.catalogue alter column price drop not null;

commit;

notify pgrst, 'reload schema';
