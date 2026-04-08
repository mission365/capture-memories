'use client';

function getYouTubeEmbedUrl(value) {
  const rawUrl = typeof value === 'string' ? value.trim() : '';

  if (!rawUrl) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      } else if (parsed.pathname.startsWith('/live/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return '';
    }

    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  } catch (_error) {
    return '';
  }
}

export default function AboutPageAdminPanel({
  form,
  members,
  statusLabel,
  saving,
  progress,
  progressLabel,
  officeImagePreviewUrl,
  onFormChange,
  onSave,
  onReset,
  onRefresh,
  onAddMember,
  onUpdateMember,
  onMoveMember,
  onRemoveMember,
  onOfficeImageFileChange,
}) {
  const updateField = (key, value) => {
    onFormChange((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="mt-8">
      <form onSubmit={onSave} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">About page</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Manage all About page content here, including founding members and their image uploads.
            </p>
            <div className="mt-4 inline-flex rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-600">
              {statusLabel}
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

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
              <h3 className="text-lg font-semibold text-stone-950">Page intro</h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Page eyebrow">
                  <input
                    type="text"
                    value={form.eyebrow}
                    onChange={(event) => updateField('eyebrow', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </Field>
                <Field label="Page title">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </Field>
              </div>

              <Field label="Intro text" className="mt-5">
                <textarea
                  value={form.intro}
                  onChange={(event) => updateField('intro', event.target.value)}
                  className="mt-2 min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
              <h3 className="text-lg font-semibold text-stone-950">Team section</h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Team eyebrow">
                  <input
                    type="text"
                    value={form.teamEyebrow}
                    onChange={(event) => updateField('teamEyebrow', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </Field>
                <Field label="Team title">
                  <input
                    type="text"
                    value={form.teamTitle}
                    onChange={(event) => updateField('teamTitle', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </Field>
              </div>

              <AboutMembersEditor
                members={members}
                onAddMember={onAddMember}
                onUpdateMember={onUpdateMember}
                onMoveMember={onMoveMember}
                onRemoveMember={onRemoveMember}
              />
            </div>
          </div>

          <div className="space-y-6">
            <AboutOfficeEditor form={form} updateField={updateField} />

            <AboutMediaEditor
              form={form}
              officeImagePreviewUrl={officeImagePreviewUrl}
              updateField={updateField}
              onOfficeImageFileChange={onOfficeImageFileChange}
            />

            {(saving || progress > 0) && (
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-stone-700">{progressLabel || 'Uploading image...'}</p>
                  <p className="text-sm font-semibold text-stone-900">{progress}%</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-stone-900 transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving About page...' : 'Save About Page'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-stone-700 ${className}`.trim()}>
      {label}
      {children}
    </label>
  );
}

function AboutOfficeEditor({ form, updateField }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
      <h3 className="text-lg font-semibold text-stone-950">Office details</h3>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Office heading">
          <input
            type="text"
            value={form.officeHeading}
            onChange={(event) => updateField('officeHeading', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </Field>

        <Field label="Phone heading">
          <input
            type="text"
            value={form.phoneHeading}
            onChange={(event) => updateField('phoneHeading', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </Field>
      </div>

      <Field label="Address lines" className="mt-5">
        <textarea
          value={form.address}
          onChange={(event) => updateField('address', event.target.value)}
          className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          placeholder="One address line per row"
        />
      </Field>

      <Field label="Phone numbers" className="mt-5">
        <textarea
          value={form.phones}
          onChange={(event) => updateField('phones', event.target.value)}
          className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          placeholder="One phone number per row"
        />
      </Field>

      <Field label="Map query" className="mt-5">
        <input
          type="text"
          value={form.mapQuery}
          onChange={(event) => updateField('mapQuery', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        />
      </Field>

    </div>
  );
}

function AboutMembersEditor({ members, onAddMember, onUpdateMember, onMoveMember, onRemoveMember }) {
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-stone-600">Upload founding member photos and keep their order from here.</p>
        <button
          type="button"
          onClick={onAddMember}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
        >
          Add member
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {members.map((member, index) => (
          <div key={member.id} className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">Member {index + 1}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onMoveMember(index, -1)}
                  disabled={index === 0}
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => onMoveMember(index, 1)}
                  disabled={index === members.length - 1}
                  className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveMember(member.id)}
                  className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Name">
                <input
                  type="text"
                  value={member.name}
                  onChange={(event) => onUpdateMember(member.id, { name: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
              <Field label="Role">
                <input
                  type="text"
                  value={member.role}
                  onChange={(event) => onUpdateMember(member.id, { role: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>

            <Field label="Image URL" className="mt-5">
              <input
                type="url"
                value={member.imageUrl}
                onChange={(event) => onUpdateMember(member.id, { imageUrl: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
              />
            </Field>

            <Field label="Or upload image" className="mt-5">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onUpdateMember(member.id, { file: event.target.files?.[0] || null })}
                className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
              />
            </Field>

            {member.file && (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                Selected file: <span className="font-medium text-stone-900">{member.file.name}</span>
              </div>
            )}

            {member.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-50">
                <img
                  src={member.imageUrl}
                  alt={member.name || `Founding member ${index + 1}`}
                  className="h-48 w-full object-cover"
                />
              </div>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Facebook URL">
                <input
                  type="url"
                  value={member.facebookUrl}
                  onChange={(event) => onUpdateMember(member.id, { facebookUrl: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
              <Field label="Instagram URL">
                <input
                  type="url"
                  value={member.instagramUrl}
                  onChange={(event) => onUpdateMember(member.id, { instagramUrl: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="YouTube URL">
                <input
                  type="url"
                  value={member.youtubeUrl}
                  onChange={(event) => onUpdateMember(member.id, { youtubeUrl: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={member.email}
                  onChange={(event) => onUpdateMember(member.id, { email: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutMediaEditor({ form, officeImagePreviewUrl, updateField, onOfficeImageFileChange }) {
  const videoPreviewUrl = getYouTubeEmbedUrl(form.officeTourVideoUrl || form.officeTourImageUrl);
  const fallbackImageUrl = videoPreviewUrl ? officeImagePreviewUrl : officeImagePreviewUrl || form.officeTourImageUrl;

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
      <h3 className="text-lg font-semibold text-stone-950">Office media</h3>

      <Field label="Section title" className="mt-5">
        <input
          type="text"
          value={form.officeTourTitle}
          onChange={(event) => updateField('officeTourTitle', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        />
      </Field>

      <Field label="YouTube video URL" className="mt-5">
        <input
          type="url"
          value={form.officeTourVideoUrl}
          onChange={(event) => updateField('officeTourVideoUrl', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="mt-2 text-xs leading-6 text-stone-500">
          This link will show as the embedded video in the Life at Capture Memories section.
        </p>
      </Field>

      <Field label="Section subtitle" className="mt-5">
        <textarea
          value={form.officeTourSubtitle}
          onChange={(event) => updateField('officeTourSubtitle', event.target.value)}
          className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        />
      </Field>

      <Field label="Fallback image URL (optional)" className="mt-5">
        <input
          type="url"
          value={form.officeTourImageUrl}
          onChange={(event) => updateField('officeTourImageUrl', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
        />
        <p className="mt-2 text-xs leading-6 text-stone-500">
          Used only when no YouTube video URL is provided. If you paste a YouTube link here, we will still use it as the video.
        </p>
      </Field>

      <Field label="Or upload fallback image" className="mt-5">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onOfficeImageFileChange(event.target.files?.[0] || null)}
          className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
        />
      </Field>

      {videoPreviewUrl ? (
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white">
          <div className="aspect-video">
            <iframe
              src={videoPreviewUrl}
              title="Office media preview"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      ) : fallbackImageUrl ? (
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white">
          <img
            src={fallbackImageUrl}
            alt="Office media preview"
            className="h-56 w-full object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
