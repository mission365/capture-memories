'use client';

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-stone-700 ${className}`.trim()}>
      {label}
      {children}
    </label>
  );
}

export default function BookUsAdminPanel({
  form,
  hasCustomValue,
  saving,
  whatsappLink,
  onFormChange,
  onSave,
  onReset,
  onRefresh,
}) {
  const updateField = (key, value) => {
    onFormChange((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="mt-8">
      <form onSubmit={onSave} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">Book Us</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Manage the contact-only Book Us page, including the WhatsApp button link and displayed contact details.
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

        <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
          <h3 className="text-lg font-semibold text-stone-950">Heading</h3>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Field label="Page heading">
              <input
                type="text"
                value={form.heading}
                onChange={(event) => updateField('heading', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
            <Field label="Page subheading">
              <input
                type="text"
                value={form.subheading}
                onChange={(event) => updateField('subheading', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
            <h3 className="text-lg font-semibold text-stone-950">Office</h3>
            <Field label="Office title" className="mt-5">
              <input
                type="text"
                value={form.officeTitle}
                onChange={(event) => updateField('officeTitle', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
            <Field label="Office address lines" className="mt-5">
              <textarea
                value={form.officeLines}
                onChange={(event) => updateField('officeLines', event.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                placeholder="One address line per row"
              />
            </Field>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
            <h3 className="text-lg font-semibold text-stone-950">Phone & Email</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Phone title">
                <input
                  type="text"
                  value={form.phoneTitle}
                  onChange={(event) => updateField('phoneTitle', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
              <Field label="Phone number">
                <input
                  type="text"
                  value={form.phoneNumber}
                  onChange={(event) => updateField('phoneNumber', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Email title">
                <input
                  type="text"
                  value={form.emailTitle}
                  onChange={(event) => updateField('emailTitle', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  value={form.emailAddress}
                  onChange={(event) => updateField('emailAddress', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
          <h3 className="text-lg font-semibold text-stone-950">WhatsApp</h3>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Field label="WhatsApp title">
              <input
                type="text"
                value={form.whatsappTitle}
                onChange={(event) => updateField('whatsappTitle', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
            <Field label="WhatsApp number">
              <input
                type="text"
                value={form.whatsappNumber}
                onChange={(event) => updateField('whatsappNumber', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Field label="WhatsApp button label">
              <input
                type="text"
                value={form.whatsappLabel}
                onChange={(event) => updateField('whatsappLabel', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
            <Field label="Prefilled WhatsApp message">
              <input
                type="text"
                value={form.whatsappMessage}
                onChange={(event) => updateField('whatsappMessage', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>
          </div>

          <div className="mt-5 rounded-[1rem] border border-stone-200 bg-white p-4 text-sm text-stone-600">
            <p className="font-semibold text-stone-900">Generated WhatsApp link</p>
            <p className="mt-2 break-all">{whatsappLink || 'Add a WhatsApp number to generate the live link.'}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving Book Us...' : 'Save Book Us'}
        </button>
      </form>
    </div>
  );
}
