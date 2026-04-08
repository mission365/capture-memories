import { useEffect, useState } from 'react';
import { normalizePackageCards, normalizePackageShowcase } from '@/lib/package-content';

const SHOWCASE_CONFIG = [
  { link: '/packages/sonaton', label: 'Sonaton Card', fallbackName: 'Sonaton Package' },
  { link: '/packages/muslim', label: 'Muslim Card', fallbackName: 'Muslim Package' },
];

const PACKAGE_COLLECTIONS = [
  { key: 'sonatonPackages', title: 'Sonaton Packages', description: 'Cards shown on the Sonaton package page.' },
  { key: 'muslimPackages', title: 'Muslim Packages', description: 'Cards shown on the Muslim package page.' },
];

function toMultilineText(lines = []) {
  return Array.isArray(lines) ? lines.join('\n') : '';
}

function parseMultilineText(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEmptyDetailSectionEditor() {
  return {
    title: '',
    price: '',
    linesText: '',
  };
}

function createDetailSectionEditor(section = {}) {
  return {
    title: typeof section.title === 'string' ? section.title : '',
    price: typeof section.price === 'string' ? section.price : '',
    linesText: toMultilineText(section.lines),
  };
}

function createEmptyPackageCardEditor() {
  return {
    title: '',
    price: '',
    subtitle: '',
    featuresText: '',
    note: '',
    hasSecondary: false,
    secondaryTitle: '',
    secondaryPrice: '',
    secondaryFeaturesText: '',
    detailSections: [],
  };
}

function createPackageCardEditor(item = {}) {
  const normalizedItem = normalizePackageCards([item])[0];

  if (!normalizedItem) {
    return createEmptyPackageCardEditor();
  }

  return {
    title: normalizedItem.title,
    price: normalizedItem.price,
    subtitle: normalizedItem.subtitle,
    featuresText: toMultilineText(normalizedItem.features),
    note: normalizedItem.note,
    hasSecondary: Boolean(normalizedItem.secondary),
    secondaryTitle: normalizedItem.secondary?.title || '',
    secondaryPrice: normalizedItem.secondary?.price || '',
    secondaryFeaturesText: toMultilineText(normalizedItem.secondary?.features),
    detailSections: normalizedItem.detailSections.map((section) => createDetailSectionEditor(section)),
  };
}

function createPackageCardEditors(items = []) {
  const normalizedItems = normalizePackageCards(items);

  if (normalizedItems.length === 0) {
    return [createEmptyPackageCardEditor()];
  }

  return normalizedItems.map((item) => createPackageCardEditor(item));
}

function createPanelState(sections = []) {
  const sectionMap = sections.reduce((accumulator, section) => {
    accumulator[section.key] = section.currentValue;
    return accumulator;
  }, {});

  const normalizedShowcase = normalizePackageShowcase(sectionMap.packageShowcase);

  return {
    packageShowcase: SHOWCASE_CONFIG.map((config) => {
      const matchedItem = normalizedShowcase.find((item) => item.link === config.link);

      return {
        label: config.label,
        link: config.link,
        name: matchedItem?.name || config.fallbackName,
        image: matchedItem?.image || '',
        file: null,
      };
    }),
    sonatonPackages: createPackageCardEditors(sectionMap.sonatonPackages),
    muslimPackages: createPackageCardEditors(sectionMap.muslimPackages),
  };
}

function buildPackageCard(editor) {
  const features = parseMultilineText(editor.featuresText);
  const detailSections = editor.detailSections
    .map((section) => ({
      title: section.title.trim(),
      price: section.price.trim(),
      lines: parseMultilineText(section.linesText),
    }))
    .filter((section) => section.title || section.price || section.lines.length > 0);

  const secondaryFeatures = parseMultilineText(editor.secondaryFeaturesText);
  const hasSecondary =
    editor.hasSecondary ||
    editor.secondaryTitle.trim() ||
    editor.secondaryPrice.trim() ||
    secondaryFeatures.length > 0;

  const nextCard = {
    title: editor.title.trim(),
    price: editor.price.trim(),
    subtitle: editor.subtitle.trim(),
    features,
    note: editor.note.trim(),
  };

  if (hasSecondary) {
    nextCard.secondary = {
      title: editor.secondaryTitle.trim(),
      price: editor.secondaryPrice.trim(),
      features: secondaryFeatures,
    };
  }

  if (detailSections.length > 0) {
    nextCard.detailSections = detailSections;
  }

  return nextCard;
}

function buildPackageCollection(editors = []) {
  return normalizePackageCards(editors.map((editor) => buildPackageCard(editor)));
}

function SectionBadge({ saved }) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${
        saved ? 'bg-stone-900 text-white' : 'bg-white text-stone-600'
      }`}
    >
      {saved ? 'Saved' : 'Fallback'}
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

function ImagePreview({ src, file, alt }) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!(file instanceof File)) {
      setPreviewUrl('');
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file]);

  const imageSource = previewUrl || src;

  if (!imageSource) {
    return null;
  }

  return <img src={imageSource} alt={alt} className="h-44 w-full object-cover" />;
}

export default function PackagesAdminPanel({ sections, saving, onRefresh, onSave }) {
  const [panelState, setPanelState] = useState(() => createPanelState(sections));

  useEffect(() => {
    setPanelState(createPanelState(sections));
  }, [sections]);

  const sectionMeta = sections.reduce((accumulator, section) => {
    accumulator[section.key] = section;
    return accumulator;
  }, {});

  function resetPanel() {
    setPanelState(createPanelState(sections));
  }

  function updateShowcaseCard(index, patch) {
    setPanelState((current) => ({
      ...current,
      packageShowcase: current.packageShowcase.map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...patch } : card
      ),
    }));
  }

  function updatePackageCard(sectionKey, index, patch) {
    setPanelState((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((card, cardIndex) => (cardIndex === index ? { ...card, ...patch } : card)),
    }));
  }

  function addPackageCard(sectionKey) {
    setPanelState((current) => ({
      ...current,
      [sectionKey]: [...current[sectionKey], createEmptyPackageCardEditor()],
    }));
  }

  function movePackageCard(sectionKey, index, direction) {
    setPanelState((current) => {
      const nextIndex = index + direction;
      const cards = [...current[sectionKey]];

      if (nextIndex < 0 || nextIndex >= cards.length) {
        return current;
      }

      [cards[index], cards[nextIndex]] = [cards[nextIndex], cards[index]];
      return { ...current, [sectionKey]: cards };
    });
  }

  function removePackageCard(sectionKey, index) {
    setPanelState((current) => {
      const cards = current[sectionKey].filter((_, cardIndex) => cardIndex !== index);
      return {
        ...current,
        [sectionKey]: cards.length > 0 ? cards : [createEmptyPackageCardEditor()],
      };
    });
  }

  function addDetailSection(sectionKey, cardIndex) {
    setPanelState((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((card, index) =>
        index === cardIndex
          ? { ...card, detailSections: [...card.detailSections, createEmptyDetailSectionEditor()] }
          : card
      ),
    }));
  }

  function updateDetailSection(sectionKey, cardIndex, detailIndex, patch) {
    setPanelState((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((card, index) =>
        index === cardIndex
          ? {
              ...card,
              detailSections: card.detailSections.map((section, sectionIndex) =>
                sectionIndex === detailIndex ? { ...section, ...patch } : section
              ),
            }
          : card
      ),
    }));
  }

  function moveDetailSection(sectionKey, cardIndex, detailIndex, direction) {
    setPanelState((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((card, index) => {
        if (index !== cardIndex) {
          return card;
        }

        const nextIndex = detailIndex + direction;
        const detailSections = [...card.detailSections];

        if (nextIndex < 0 || nextIndex >= detailSections.length) {
          return card;
        }

        [detailSections[detailIndex], detailSections[nextIndex]] = [detailSections[nextIndex], detailSections[detailIndex]];

        return { ...card, detailSections };
      }),
    }));
  }

  function removeDetailSection(sectionKey, cardIndex, detailIndex) {
    setPanelState((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((card, index) =>
        index === cardIndex
          ? {
              ...card,
              detailSections: card.detailSections.filter((_, sectionIndex) => sectionIndex !== detailIndex),
            }
          : card
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await onSave({
      packageShowcase: panelState.packageShowcase.map((card) => ({
        name: card.name.trim(),
        link: card.link,
        image: card.image.trim(),
        file: card.file instanceof File ? card.file : null,
      })),
      sonatonPackages: buildPackageCollection(panelState.sonatonPackages),
      muslimPackages: buildPackageCollection(panelState.muslimPackages),
    });
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">Packages</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Manage the landing cards and the full Sonaton and Muslim package card collections from one place.
            </p>
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
              onClick={resetPanel}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
            >
              Reset editor
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-600">
          The card fields control what appears on the page. The modal section editors control exactly what shows after
          clicking <span className="font-semibold text-stone-900">Details</span>.
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-stone-950">Package Showcase</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                These two cards appear on the main Packages page and also control the title shown inside each package page.
              </p>
            </div>
            <SectionBadge saved={sectionMeta.packageShowcase?.hasCustomValue} />
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {panelState.packageShowcase.map((card, index) => (
              <div key={card.link} className="rounded-[1.25rem] border border-stone-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">{card.label}</p>
                <p className="mt-2 text-sm text-stone-600">Route: {card.link}</p>

                <Field label="Card name" className="mt-5">
                  <input
                    type="text"
                    value={card.name}
                    onChange={(event) => updateShowcaseCard(index, { name: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </Field>

                <Field label="Card image URL" className="mt-5">
                  <input
                    type="url"
                    value={card.image}
                    onChange={(event) => updateShowcaseCard(index, { image: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  />
                </Field>

                <Field label="Or upload image from computer" className="mt-5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => updateShowcaseCard(index, { file: event.target.files?.[0] || null })}
                    className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
                  />
                </Field>

                {card.file && (
                  <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                    Selected file: <span className="font-medium text-stone-900">{card.file.name}</span>
                    <button
                      type="button"
                      onClick={() => updateShowcaseCard(index, { file: null })}
                      className="ml-3 text-sm font-semibold text-stone-900 underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {(card.image || card.file) && (
                  <div className="mt-5 overflow-hidden rounded-[1rem] border border-stone-200 bg-stone-50">
                    <ImagePreview src={card.image} file={card.file} alt={card.name || card.label} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {PACKAGE_COLLECTIONS.map((collection) => {
            const cards = panelState[collection.key];

            return (
              <div key={collection.key} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-950">{collection.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-stone-600">{collection.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <SectionBadge saved={sectionMeta[collection.key]?.hasCustomValue} />
                    <button
                      type="button"
                      onClick={() => addPackageCard(collection.key)}
                      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                    >
                      Add card
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {cards.map((card, cardIndex) => (
                    <div key={`${collection.key}-${cardIndex}`} className="rounded-[1.25rem] border border-stone-200 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
                          Card {cardIndex + 1}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => movePackageCard(collection.key, cardIndex, -1)}
                            disabled={cardIndex === 0}
                            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            onClick={() => movePackageCard(collection.key, cardIndex, 1)}
                            disabled={cardIndex === cards.length - 1}
                            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            onClick={() => removePackageCard(collection.key, cardIndex)}
                            className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-2">
                        <Field label="Package title">
                          <input
                            type="text"
                            value={card.title}
                            onChange={(event) => updatePackageCard(collection.key, cardIndex, { title: event.target.value })}
                            className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                          />
                        </Field>
                        <Field label="Price">
                          <input
                            type="text"
                            value={card.price}
                            onChange={(event) => updatePackageCard(collection.key, cardIndex, { price: event.target.value })}
                            className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                          />
                        </Field>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-2">
                        <Field label="Subtitle / short note">
                          <input
                            type="text"
                            value={card.subtitle}
                            onChange={(event) => updatePackageCard(collection.key, cardIndex, { subtitle: event.target.value })}
                            className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                          />
                        </Field>
                        <Field label="Package note">
                          <input
                            type="text"
                            value={card.note}
                            onChange={(event) => updatePackageCard(collection.key, cardIndex, { note: event.target.value })}
                            className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                          />
                        </Field>
                      </div>

                      <Field label="Card feature lines" className="mt-5">
                        <textarea
                          value={card.featuresText}
                          onChange={(event) => updatePackageCard(collection.key, cardIndex, { featuresText: event.target.value })}
                          className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                          placeholder="One feature per line"
                        />
                      </Field>

                      <div className="mt-6 rounded-[1rem] border border-stone-200 bg-stone-50 p-4">
                        <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
                          <input
                            type="checkbox"
                            checked={card.hasSecondary}
                            onChange={(event) => updatePackageCard(collection.key, cardIndex, { hasSecondary: event.target.checked })}
                            className="h-4 w-4 rounded border-stone-300"
                          />
                          Show secondary block on the card
                        </label>

                        {card.hasSecondary && (
                          <div className="mt-5 space-y-5">
                            <div className="grid gap-5 xl:grid-cols-2">
                              <Field label="Secondary title">
                                <input
                                  type="text"
                                  value={card.secondaryTitle}
                                  onChange={(event) =>
                                    updatePackageCard(collection.key, cardIndex, { secondaryTitle: event.target.value })
                                  }
                                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                />
                              </Field>
                              <Field label="Secondary price">
                                <input
                                  type="text"
                                  value={card.secondaryPrice}
                                  onChange={(event) =>
                                    updatePackageCard(collection.key, cardIndex, { secondaryPrice: event.target.value })
                                  }
                                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                />
                              </Field>
                            </div>

                            <Field label="Secondary feature lines">
                              <textarea
                                value={card.secondaryFeaturesText}
                                onChange={(event) =>
                                  updatePackageCard(collection.key, cardIndex, { secondaryFeaturesText: event.target.value })
                                }
                                className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                placeholder="One feature per line"
                              />
                            </Field>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 rounded-[1rem] border border-stone-200 bg-stone-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="text-base font-semibold text-stone-950">Details modal sections</h4>
                            <p className="mt-2 text-sm leading-7 text-stone-600">
                              These sections are shown inside the popup after clicking the Details button.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addDetailSection(collection.key, cardIndex)}
                            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                          >
                            Add modal section
                          </button>
                        </div>

                        {card.detailSections.length === 0 ? (
                          <div className="mt-5 rounded-[1rem] border border-dashed border-stone-300 bg-white px-4 py-4 text-sm text-stone-600">
                            No custom modal sections added yet. Add sections here to control the popup content from the backend.
                          </div>
                        ) : (
                          <div className="mt-5 space-y-4">
                            {card.detailSections.map((detailSection, detailIndex) => (
                              <div
                                key={`${collection.key}-${cardIndex}-detail-${detailIndex}`}
                                className="rounded-[1rem] border border-stone-200 bg-white p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
                                    Modal Section {detailIndex + 1}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => moveDetailSection(collection.key, cardIndex, detailIndex, -1)}
                                      disabled={detailIndex === 0}
                                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Move up
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveDetailSection(collection.key, cardIndex, detailIndex, 1)}
                                      disabled={detailIndex === card.detailSections.length - 1}
                                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Move down
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeDetailSection(collection.key, cardIndex, detailIndex)}
                                      className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-5 xl:grid-cols-2">
                                  <Field label="Section title">
                                    <input
                                      type="text"
                                      value={detailSection.title}
                                      onChange={(event) =>
                                        updateDetailSection(collection.key, cardIndex, detailIndex, {
                                          title: event.target.value,
                                        })
                                      }
                                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                    />
                                  </Field>
                                  <Field label="Section price (optional)">
                                    <input
                                      type="text"
                                      value={detailSection.price}
                                      onChange={(event) =>
                                        updateDetailSection(collection.key, cardIndex, detailIndex, {
                                          price: event.target.value,
                                        })
                                      }
                                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                    />
                                  </Field>
                                </div>

                                <Field label="Section lines" className="mt-4">
                                  <textarea
                                    value={detailSection.linesText}
                                    onChange={(event) =>
                                      updateDetailSection(collection.key, cardIndex, detailIndex, {
                                        linesText: event.target.value,
                                      })
                                    }
                                    className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                    placeholder="One line per row"
                                  />
                                </Field>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving packages...' : 'Save Package Content'}
        </button>
      </form>
    </div>
  );
}
