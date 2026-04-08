# Supabase setup

## 1. Environment variables

Add these variables to your local `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=site-assets
```

## 2. Create the slider table

Run the SQL from [supabase/hero-slides.sql](/e:/2026/clockosoft/chitrography/supabase/hero-slides.sql) in the Supabase SQL editor.

## 3. Create the site sections table

Run [SUPABASE_SITE_SECTIONS.sql](/e:/2026/clockosoft/chitrography/SUPABASE_SITE_SECTIONS.sql) in the SQL editor. This creates the `site_sections` table that stores all editable sections except the hero slider.

## 4. Create a public storage bucket

Run [SUPABASE_STORAGE_SETUP.sql](/e:/2026/clockosoft/chitrography/SUPABASE_STORAGE_SETUP.sql) in the SQL editor too. It creates the `site-assets` bucket and adds the storage policies needed for upload, update, delete, and public read.

The admin page uploads slider images into:

```text
hero-slides/<timestamp>-<filename>
```

## 5. Create an admin user

Go to Supabase Authentication, then create a user with email and password. That account can login at `/admin`.

## 6. Restart the app

After saving `.env.local`, restart your dev server so the client can read the new values.

## 7. Manage content

Open `/admin`, login, and create or edit records in `hero_slides` and `site_sections`. The homepage slider and the rest of the editable sections will automatically read from Supabase. If Supabase is empty or not configured, the site falls back to the current demo content.

## Extend the same pattern

If you want packages, albums, testimonials, and other homepage sections to become dynamic too, repeat the same flow:

1. Create a table for that section.
2. Add public `select` policy plus authenticated `insert/update/delete` policy.
3. Build an admin form.
4. Replace the hardcoded array with a `list...()` function and fallback data.
