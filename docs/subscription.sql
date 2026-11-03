-- Run this in your NEW database when you create it. Nothing runs it automatically.
create table subscription (
  id integer primary key default 1 check (id = 1), -- one row: one hospital per deployment
  is_paid boolean not null default true,
  ends_at date,
  sent_reminders jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS on with no policies: only the server's service role key can read or change it,
-- so the hospital's own users cannot un-pause themselves.
alter table subscription enable row level security;

insert into subscription (id) values (1);
