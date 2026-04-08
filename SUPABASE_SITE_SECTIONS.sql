create table if not exists public.site_sections (
  section_key text primary key,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_sections_updated_at on public.site_sections;

create trigger set_site_sections_updated_at
before update on public.site_sections
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.site_sections enable row level security;

drop policy if exists "Public can read site sections" on public.site_sections;
create policy "Public can read site sections"
on public.site_sections
for select
using (true);

drop policy if exists "Authenticated users can manage site sections" on public.site_sections;
create policy "Authenticated users can manage site sections"
on public.site_sections
for all
to authenticated
using (true)
with check (true);
