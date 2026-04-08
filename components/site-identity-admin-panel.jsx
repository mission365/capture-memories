'use client';

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-stone-700 ${className}`.trim()}>
      {label}
      {children}
    </label>
  );
}

export default function SiteIdentityAdminPanel({
  form,
  hasCustomValue,
  saving,
  logoPreviewUrl,
  onFormChange,
  onSave,
  onReset,
  onRefresh,
  onLogoFileChange,
}) {
  const updateField = (key, value) => {
    onFormChange((current) => ({ ...current, [key]: value }));
  };
  const activeLogoPreviewUrl = logoPreviewUrl || form.logoUrl;

  return (
    <div className="mt-8">
      <form onSubmit={onSave} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">Site Identity</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Update brand details and the Facebook, Instagram, and YouTube links used in the header and footer.
            </p>
            <div className="mt-4 inline-flex rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-600">
              {hasCustomValue ? 'Saved in Supabase' : 'Using fallback data'}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
            >
              Reset editor
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
            <h3 className="text-lg font-semibold text-stone-950">Brand Details</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Brand name">
                <input
                  type="text"
                  value={form.brand}
                  onChange={(event) => updateField('brand', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
              <Field label="Tagline">
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(event) => updateField('tagline', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>

            <Field label="Location" className="mt-5">
              <input
                type="text"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>

            <Field label="Logo image URL" className="mt-5">
              <input
                type="url"
                value={form.logoUrl}
                onChange={(event) => updateField('logoUrl', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>

            <Field label="Or upload logo from computer" className="mt-5">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onLogoFileChange(event.target.files?.[0] || null)}
                className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
              />
            </Field>

            {activeLogoPreviewUrl && (
              <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white p-4">
                <img src={activeLogoPreviewUrl} alt="Site logo preview" className="mx-auto h-20 w-20 object-contain" />
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
            <h3 className="text-lg font-semibold text-stone-950">Social Links</h3>
            <Field label="Facebook URL" className="mt-5">
              <input
                type="url"
                value={form.facebookUrl}
                onChange={(event) => updateField('facebookUrl', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>

            <Field label="Instagram URL" className="mt-5">
              <input
                type="url"
                value={form.instagramUrl}
                onChange={(event) => updateField('instagramUrl', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>

            <Field label="YouTube URL" className="mt-5">
              <input
                type="url"
                value={form.youtubeUrl}
                onChange={(event) => updateField('youtubeUrl', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving Site Identity...' : 'Save Site Identity'}
        </button>
      </form>
    </div>
  );
}
