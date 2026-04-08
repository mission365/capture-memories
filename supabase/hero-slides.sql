create extension if not exists pgcrypto;

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  sort_order integer not null default 1,
  is_active boolean not null default true,
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

drop trigger if exists set_hero_slides_updated_at on public.hero_slides;

create trigger set_hero_slides_updated_at
before update on public.hero_slides
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.hero_slides enable row level security;

drop policy if exists "Public can read active hero slides" on public.hero_slides;
create policy "Public can read active hero slides"
on public.hero_slides
for select
using (is_active = true);

drop policy if exists "Authenticated users can manage hero slides" on public.hero_slides;
create policy "Authenticated users can manage hero slides"
on public.hero_slides
for all
to authenticated
using (true)
with check (true);
