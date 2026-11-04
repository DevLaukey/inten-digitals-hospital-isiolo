-- Adds product categories to the catalogue's department list. Run once, after 003.
-- "Pharmacy" stays allowed, so nothing already recorded becomes invalid.

begin;

alter table public.catalogue drop constraint catalogue_department_check;
alter table public.catalogue add constraint catalogue_department_check check (department in (
  'Consultation', 'Laboratory', 'Imaging', 'Procedures', 'Ward', 'Pharmacy',
  'Tablets & Capsules', 'Syrups & Liquids', 'Injections & IV', 'Creams & Ointments',
  'Eye, Ear & Nose Drops', 'Medical Supplies'
));

commit;

notify pgrst, 'reload schema';
