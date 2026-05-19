import { useEffect, useState } from 'react';
import {
  getPackageCategoryLink,
  normalizePackageCards,
  normalizePackageCatalog,
  normalizePackageCategorySlug,
  RESERVED_PACKAGE_CATEGORY_SLUGS,
} from '@/lib/package-content';

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

function createEmptyCategoryEditor() {
  return {
    slug: '',
    name: '',
    description: '',
    image: '',
    file: null,
    items: [createEmptyPackageCardEditor()],
  };
}

function createCategoryEditor(item = {}) {
  const normalizedItem = normalizePackageCatalog([item])[0];

  if (!normalizedItem) {
    return createEmptyCategoryEditor();
  }

  return {
    slug: normalizedItem.slug,
    name: normalizedItem.name,
    description: normalizedItem.description,
    image: normalizedItem.image,
    file: null,
    items: createPackageCardEditors(normalizedItem.items),
  };
}

function createPanelState(catalogSection = {}) {
  const categories = normalizePackageCatalog(catalogSection?.currentValue);

  return {
    categories: categories.length > 0 ? categories.map((item) => createCategoryEditor(item)) : [createEmptyCategoryEditor()],
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

function isDetailSectionBlank(section = {}) {
  return !section.title.trim() && !section.price.trim() && parseMultilineText(section.linesText).length === 0;
}

function isPackageCardEditorBlank(editor = {}) {
  return !(
    editor.title.trim() ||
    editor.price.trim() ||
    editor.subtitle.trim() ||
    editor.note.trim() ||
    parseMultilineText(editor.featuresText).length > 0 ||
    editor.secondaryTitle.trim() ||
    editor.secondaryPrice.trim() ||
    parseMultilineText(editor.secondaryFeaturesText).length > 0 ||
    editor.detailSections.some((section) => !isDetailSectionBlank(section))
  );
}

function isCategoryEditorBlank(editor = {}) {
  return !(
    editor.slug.trim() ||
    editor.name.trim() ||
    editor.description.trim() ||
    editor.image.trim() ||
    editor.file instanceof File ||
    editor.items.some((card) => !isPackageCardEditorBlank(card))
  );
}

function getCategoryPreview(editor = {}) {
  const slug = normalizePackageCategorySlug(editor.slug || editor.name);

  return {
    slug,
    route: getPackageCategoryLink(slug),
    isReserved: RESERVED_PACKAGE_CATEGORY_SLUGS.includes(slug),
  };
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

export default function PackagesAdminPanel({ catalogSection, saving, onRefresh, onSave }) {
  const [panelState, setPanelState] = useState(() => createPanelState(catalogSection));
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setPanelState(createPanelState(catalogSection));
    setSubmitError('');
  }, [catalogSection]);

  function resetPanel() {
    setPanelState(createPanelState(catalogSection));
    setSubmitError('');
  }

  function updateCategory(index, patch) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, ...patch } : category
      ),
    }));
  }

  function addCategory() {
    setPanelState((current) => ({
      ...current,
      categories: [...current.categories, createEmptyCategoryEditor()],
    }));
  }

  function moveCategory(index, direction) {
    setPanelState((current) => {
      const nextIndex = index + direction;
      const categories = [...current.categories];

      if (nextIndex < 0 || nextIndex >= categories.length) {
        return current;
      }

      [categories[index], categories[nextIndex]] = [categories[nextIndex], categories[index]];
      return { ...current, categories };
    });
  }

  function removeCategory(index) {
    setPanelState((current) => {
      const categories = current.categories.filter((_, categoryIndex) => categoryIndex !== index);
      return {
        ...current,
        categories: categories.length > 0 ? categories : [createEmptyCategoryEditor()],
      };
    });
  }

  function updatePackageCard(categoryIndex, cardIndex, patch) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex === categoryIndex
          ? {
              ...category,
              items: category.items.map((card, currentCardIndex) =>
                currentCardIndex === cardIndex ? { ...card, ...patch } : card
              ),
            }
          : category
      ),
    }));
  }

  function addPackageCard(categoryIndex) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex === categoryIndex
          ? { ...category, items: [...category.items, createEmptyPackageCardEditor()] }
          : category
      ),
    }));
  }

  function movePackageCard(categoryIndex, cardIndex, direction) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) => {
        if (currentCategoryIndex !== categoryIndex) {
          return category;
        }

        const nextIndex = cardIndex + direction;
        const cards = [...category.items];

        if (nextIndex < 0 || nextIndex >= cards.length) {
          return category;
        }

        [cards[cardIndex], cards[nextIndex]] = [cards[nextIndex], cards[cardIndex]];
        return { ...category, items: cards };
      }),
    }));
  }

  function removePackageCard(categoryIndex, cardIndex) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) => {
        if (currentCategoryIndex !== categoryIndex) {
          return category;
        }

        const items = category.items.filter((_, currentCardIndex) => currentCardIndex !== cardIndex);
        return {
          ...category,
          items: items.length > 0 ? items : [createEmptyPackageCardEditor()],
        };
      }),
    }));
  }

  function addDetailSection(categoryIndex, cardIndex) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex === categoryIndex
          ? {
              ...category,
              items: category.items.map((card, currentCardIndex) =>
                currentCardIndex === cardIndex
                  ? { ...card, detailSections: [...card.detailSections, createEmptyDetailSectionEditor()] }
                  : card
              ),
            }
          : category
      ),
    }));
  }

  function updateDetailSection(categoryIndex, cardIndex, detailIndex, patch) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex === categoryIndex
          ? {
              ...category,
              items: category.items.map((card, currentCardIndex) =>
                currentCardIndex === cardIndex
                  ? {
                      ...card,
                      detailSections: card.detailSections.map((section, currentDetailIndex) =>
                        currentDetailIndex === detailIndex ? { ...section, ...patch } : section
                      ),
                    }
                  : card
              ),
            }
          : category
      ),
    }));
  }

  function moveDetailSection(categoryIndex, cardIndex, detailIndex, direction) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) => {
        if (currentCategoryIndex !== categoryIndex) {
          return category;
        }

        return {
          ...category,
          items: category.items.map((card, currentCardIndex) => {
            if (currentCardIndex !== cardIndex) {
              return card;
            }

            const nextIndex = detailIndex + direction;
            const detailSections = [...card.detailSections];

            if (nextIndex < 0 || nextIndex >= detailSections.length) {
              return card;
            }

            [detailSections[detailIndex], detailSections[nextIndex]] = [
              detailSections[nextIndex],
              detailSections[detailIndex],
            ];

            return { ...card, detailSections };
          }),
        };
      }),
    }));
  }

  function removeDetailSection(categoryIndex, cardIndex, detailIndex) {
    setPanelState((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex === categoryIndex
          ? {
              ...category,
              items: category.items.map((card, currentCardIndex) =>
                currentCardIndex === cardIndex
                  ? {
                      ...card,
                      detailSections: card.detailSections.filter((_, currentDetailIndex) => currentDetailIndex !== detailIndex),
                    }
                  : card
              ),
            }
          : category
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    const nextCatalog = panelState.categories
      .filter((category) => !isCategoryEditorBlank(category))
      .map((category) => ({
        slug: normalizePackageCategorySlug(category.slug || category.name),
        name: category.name.trim(),
        description: category.description.trim(),
        image: category.image.trim(),
        file: category.file instanceof File ? category.file : null,
        items: buildPackageCollection(category.items),
      }));

    const seenSlugs = new Set();

    for (let index = 0; index < nextCatalog.length; index += 1) {
      const category = nextCatalog[index];

      if (!category.slug) {
        setSubmitError(`Category ${index + 1} needs a route slug or name.`);
        return;
      }

      if (RESERVED_PACKAGE_CATEGORY_SLUGS.includes(category.slug)) {
        setSubmitError(`"${category.slug}" is reserved. Please use a different slug.`);
        return;
      }

      if (seenSlugs.has(category.slug)) {
        setSubmitError(`The slug "${category.slug}" has been used more than once.`);
        return;
      }

      seenSlugs.add(category.slug);
    }

    await onSave({ packageCatalog: nextCatalog });
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">Packages</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Create package categories from the admin panel. Every category becomes its own page under{' '}
              <span className="font-semibold text-stone-900">/packages/&lt;slug&gt;</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SectionBadge saved={catalogSection?.hasCustomValue} />
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
            <button
              type="button"
              onClick={addCategory}
              className="rounded-full border border-stone-900 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              Add category
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-600">
          Category name and image control the main Packages page card. The slug controls the route, and the package
          card editors below control what appears inside that category page and its details modal.
        </div>

        {submitError && (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        <div className="mt-8 space-y-8">
          {panelState.categories.map((category, categoryIndex) => {
            const preview = getCategoryPreview(category);

            return (
              <div key={`package-category-${categoryIndex}`} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-950">Category {categoryIndex + 1}</h3>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      This category will appear on the main Packages page and open its own package listing page.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveCategory(categoryIndex, -1)}
                      disabled={categoryIndex === 0}
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(categoryIndex, 1)}
                      disabled={categoryIndex === panelState.categories.length - 1}
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(categoryIndex)}
                      className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <Field label="Category name">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(event) => updateCategory(categoryIndex, { name: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="Sonaton Package"
                    />
                  </Field>
                  <Field label="Route slug">
                    <input
                      type="text"
                      value={category.slug}
                      onChange={(event) => updateCategory(categoryIndex, { slug: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="sonaton"
                    />
                  </Field>
                </div>

                <Field label="Page description" className="mt-5">
                  <textarea
                    value={category.description}
                    onChange={(event) => updateCategory(categoryIndex, { description: event.target.value })}
                    className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Short introduction shown at the top of the category page"
                  />
                </Field>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <Field label="Card image URL">
                    <input
                      type="url"
                      value={category.image}
                      onChange={(event) => updateCategory(categoryIndex, { image: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    />
                  </Field>
                  <Field label="Or upload image from computer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => updateCategory(categoryIndex, { file: event.target.files?.[0] || null })}
                      className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
                    />
                  </Field>
                </div>

                <div className="mt-5 rounded-[1rem] border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
                  <p>
                    Route preview:{' '}
                    <span className="font-semibold text-stone-900">{preview.route || '/packages/your-slug'}</span>
                  </p>
                  {preview.isReserved && (
                    <p className="mt-2 text-rose-700">
                      This slug is reserved for an existing page. Please choose another one.
                    </p>
                  )}
                </div>

                {category.file && (
                  <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                    Selected file: <span className="font-medium text-stone-900">{category.file.name}</span>
                    <button
                      type="button"
                      onClick={() => updateCategory(categoryIndex, { file: null })}
                      className="ml-3 text-sm font-semibold text-stone-900 underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {(category.image || category.file) && (
                  <div className="mt-5 overflow-hidden rounded-[1rem] border border-stone-200 bg-white">
                    <ImagePreview src={category.image} file={category.file} alt={category.name || `Category ${categoryIndex + 1}`} />
                  </div>
                )}

                <div className="mt-6 rounded-[1rem] border border-stone-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-stone-950">Package cards</h4>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        Add the packages that should appear inside this category page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addPackageCard(categoryIndex)}
                      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                    >
                      Add package card
                    </button>
                  </div>

                  <div className="mt-6 space-y-5">
                    {category.items.map((card, cardIndex) => (
                      <div
                        key={`category-${categoryIndex}-card-${cardIndex}`}
                        className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
                            Package Card {cardIndex + 1}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => movePackageCard(categoryIndex, cardIndex, -1)}
                              disabled={cardIndex === 0}
                              className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Move up
                            </button>
                            <button
                              type="button"
                              onClick={() => movePackageCard(categoryIndex, cardIndex, 1)}
                              disabled={cardIndex === category.items.length - 1}
                              className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Move down
                            </button>
                            <button
                              type="button"
                              onClick={() => removePackageCard(categoryIndex, cardIndex)}
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
                              onChange={(event) => updatePackageCard(categoryIndex, cardIndex, { title: event.target.value })}
                              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                            />
                          </Field>
                          <Field label="Price">
                            <input
                              type="text"
                              value={card.price}
                              onChange={(event) => updatePackageCard(categoryIndex, cardIndex, { price: event.target.value })}
                              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                            />
                          </Field>
                        </div>

                        <div className="mt-5 grid gap-5 xl:grid-cols-2">
                          <Field label="Subtitle / short note">
                            <input
                              type="text"
                              value={card.subtitle}
                              onChange={(event) => updatePackageCard(categoryIndex, cardIndex, { subtitle: event.target.value })}
                              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                            />
                          </Field>
                          <Field label="Package note">
                            <input
                              type="text"
                              value={card.note}
                              onChange={(event) => updatePackageCard(categoryIndex, cardIndex, { note: event.target.value })}
                              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                            />
                          </Field>
                        </div>

                        <Field label="Card feature lines" className="mt-5">
                          <textarea
                            value={card.featuresText}
                            onChange={(event) => updatePackageCard(categoryIndex, cardIndex, { featuresText: event.target.value })}
                            className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                            placeholder="One feature per line"
                          />
                        </Field>

                        <div className="mt-6 rounded-[1rem] border border-stone-200 bg-white p-4">
                          <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
                            <input
                              type="checkbox"
                              checked={card.hasSecondary}
                              onChange={(event) => updatePackageCard(categoryIndex, cardIndex, { hasSecondary: event.target.checked })}
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
                                      updatePackageCard(categoryIndex, cardIndex, { secondaryTitle: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                  />
                                </Field>
                                <Field label="Secondary price">
                                  <input
                                    type="text"
                                    value={card.secondaryPrice}
                                    onChange={(event) =>
                                      updatePackageCard(categoryIndex, cardIndex, { secondaryPrice: event.target.value })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                  />
                                </Field>
                              </div>

                              <Field label="Secondary feature lines">
                                <textarea
                                  value={card.secondaryFeaturesText}
                                  onChange={(event) =>
                                    updatePackageCard(categoryIndex, cardIndex, {
                                      secondaryFeaturesText: event.target.value,
                                    })
                                  }
                                  className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                  placeholder="One feature per line"
                                />
                              </Field>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 rounded-[1rem] border border-stone-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-stone-950">Details modal sections</h4>
                              <p className="mt-2 text-sm leading-7 text-stone-600">
                                These sections are shown inside the popup after clicking the Details button.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addDetailSection(categoryIndex, cardIndex)}
                              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                            >
                              Add modal section
                            </button>
                          </div>

                          {card.detailSections.length === 0 ? (
                            <div className="mt-5 rounded-[1rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                              No custom modal sections added yet. Add sections here to control the popup content from the backend.
                            </div>
                          ) : (
                            <div className="mt-5 space-y-4">
                              {card.detailSections.map((detailSection, detailIndex) => (
                                <div
                                  key={`category-${categoryIndex}-card-${cardIndex}-detail-${detailIndex}`}
                                  className="rounded-[1rem] border border-stone-200 bg-stone-50 p-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
                                      Modal Section {detailIndex + 1}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => moveDetailSection(categoryIndex, cardIndex, detailIndex, -1)}
                                        disabled={detailIndex === 0}
                                        className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        Move up
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveDetailSection(categoryIndex, cardIndex, detailIndex, 1)}
                                        disabled={detailIndex === card.detailSections.length - 1}
                                        className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        Move down
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeDetailSection(categoryIndex, cardIndex, detailIndex)}
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
                                          updateDetailSection(categoryIndex, cardIndex, detailIndex, {
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
                                          updateDetailSection(categoryIndex, cardIndex, detailIndex, {
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
                                        updateDetailSection(categoryIndex, cardIndex, detailIndex, {
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
