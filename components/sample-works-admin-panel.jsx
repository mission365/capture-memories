import { useEffect, useState } from 'react';
import { SAMPLE_WORK_FILTERS, normalizeSampleWorks } from '@/lib/sample-works-content';

const SAMPLE_WORK_SECTIONS = SAMPLE_WORK_FILTERS.filter((itemName) => itemName !== 'All');
const DEFAULT_SAMPLE_WORK_SECTION = SAMPLE_WORK_SECTIONS[0] || 'Indoor Event';

function createEmptySampleWork(category = DEFAULT_SAMPLE_WORK_SECTION) {
  return {
    title: '',
    category,
    image: '',
    file: null,
  };
}

function createSampleWorkFromFile(file, category = DEFAULT_SAMPLE_WORK_SECTION) {
  return {
    ...createEmptySampleWork(category),
    file,
  };
}

function createSampleWorkEditor(item = {}) {
  const normalizedItem = normalizeSampleWorks([item])[0];

  return {
    title: normalizedItem?.title || '',
    category: normalizedItem?.category || DEFAULT_SAMPLE_WORK_SECTION,
    image: normalizedItem?.image || '',
    file: null,
  };
}

function createSampleWorkEditors(items = []) {
  const normalizedItems = normalizeSampleWorks(items);

  if (normalizedItems.length === 0) {
    return [createEmptySampleWork()];
  }

  return normalizedItems.map((item) => createSampleWorkEditor(item));
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

  return <img src={imageSource} alt={alt} className="h-56 w-full object-cover" />;
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-stone-700 ${className}`.trim()}>
      {label}
      {children}
    </label>
  );
}

export default function SampleWorksAdminPanel({
  items,
  hasCustomValue,
  saving,
  progress,
  progressLabel,
  onRefresh,
  onSave,
}) {
  const [editorItems, setEditorItems] = useState(() => createSampleWorkEditors(items));
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    setEditorItems(createSampleWorkEditors(items));
  }, [items]);

  useEffect(() => {
    if (activeSection && !SAMPLE_WORK_SECTIONS.includes(activeSection)) {
      setActiveSection('');
    }
  }, [activeSection]);

  function resetEditor() {
    setEditorItems(createSampleWorkEditors(items));
  }

  function updateItem(index, patch) {
    setEditorItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function addItem(category = DEFAULT_SAMPLE_WORK_SECTION) {
    setEditorItems((current) => [...current, createEmptySampleWork(category)]);
  }

  function handleFileSelection(index, fileList) {
    const selectedFiles = Array.from(fileList || []).filter((file) => file instanceof File);

    if (selectedFiles.length === 0) {
      return;
    }

    setEditorItems((current) => {
      const currentItem = current[index];

      if (!currentItem) {
        return current;
      }

      const [firstFile, ...remainingFiles] = selectedFiles;
      const nextItems = [...current];

      nextItems[index] = {
        ...currentItem,
        image: '',
        file: firstFile,
      };

      if (remainingFiles.length > 0) {
        const newItems = remainingFiles.map((file) => createSampleWorkFromFile(file, currentItem.category));
        nextItems.splice(index + 1, 0, ...newItems);
      }

      return nextItems;
    });
  }

  function moveItemWithinSection(index, category, direction) {
    setEditorItems((current) => {
      const sectionIndexes = current.reduce((indexes, item, itemIndex) => {
        if (item.category === category) {
          indexes.push(itemIndex);
        }

        return indexes;
      }, []);
      const sectionPosition = sectionIndexes.indexOf(index);
      const nextIndex = sectionIndexes[sectionPosition + direction];

      const nextItems = [...current];

      if (sectionPosition === -1 || typeof nextIndex !== 'number') {
        return current;
      }

      [nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]];
      return nextItems;
    });
  }

  function getItemsAfterRemoval(currentItems, index) {
    const nextItems = currentItems.filter((_, itemIndex) => itemIndex !== index);
    return nextItems.length > 0 ? nextItems : [createEmptySampleWork()];
  }

  async function handleRemoveItem(index) {
    const nextItems = getItemsAfterRemoval(editorItems, index);
    setEditorItems(nextItems);
    await onSave(nextItems);
  }

  async function saveItems() {
    await onSave(editorItems);
  }

  const sectionEntries = SAMPLE_WORK_SECTIONS.map((sectionName) => ({
    name: sectionName,
    entries: editorItems.reduce((itemsInSection, item, index) => {
      if (item.category === sectionName) {
        itemsInSection.push({ item, index });
      }

      return itemsInSection;
    }, []),
  }));
  const selectedSection = sectionEntries.find((section) => section.name === activeSection) || null;

  return (
    <div className="mt-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">Sample Works</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Upload and organize the images shown on the Sample Works page. Choose the event group where each image
              should appear.
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
              onClick={resetEditor}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
            >
              Reset editor
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-600">
          Use either an image URL or upload from your computer. The category select controls which button group the
          image appears under on the frontend.
        </div>

        {(saving || progress > 0) && (
          <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-stone-700">{progressLabel || 'Saving sample works...'}</p>
              <p className="text-sm font-semibold text-stone-900">{progress}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-stone-900 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sectionEntries.map((section) => {
              const isActive = activeSection === section.name;

              return (
                <button
                  key={section.name}
                  type="button"
                  onClick={() => setActiveSection(section.name)}
                  className={`rounded-[1.5rem] border p-6 text-left transition ${
                    isActive
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-950 hover:border-stone-400 hover:bg-white'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.25em] ${
                      isActive ? 'text-white/70' : 'text-stone-500'
                    }`}
                  >
                    Sample Works
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{section.name}</h3>
                  <p className={`mt-3 text-sm leading-7 ${isActive ? 'text-white/80' : 'text-stone-600'}`}>
                    {section.entries.length > 0
                      ? `${section.entries.length} sample work${section.entries.length === 1 ? '' : 's'} available.`
                      : 'No sample works added yet.'}
                  </p>
                </button>
              );
            })}
          </div>

          {!selectedSection ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-6 text-sm text-stone-600">
              Click any section card to open and manage that sample works group.
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-stone-950">{selectedSection.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    {selectedSection.entries.length > 0
                      ? `${selectedSection.entries.length} sample work${
                          selectedSection.entries.length === 1 ? '' : 's'
                        } in this section.`
                      : 'No sample works added in this section yet.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('')}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                  >
                    Back to sections
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem(selectedSection.name)}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                  >
                    Add sample work
                  </button>
                </div>
              </div>

              {selectedSection.entries.length === 0 ? (
                <div className="mt-5 rounded-[1.25rem] border border-dashed border-stone-300 bg-white px-5 py-6 text-sm text-stone-600">
                  This section is empty right now. Use <span className="font-semibold text-stone-900">Add sample work</span> to
                  create a new card here.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {selectedSection.entries.map(({ item, index }, sectionIndex) => (
                    <div key={`sample-work-${index}`} className="rounded-[1.25rem] border border-stone-200 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
                          Sample Work {sectionIndex + 1}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={saveItems}
                            disabled={saving}
                            className="rounded-full border border-stone-900 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItemWithinSection(index, selectedSection.name, -1)}
                            disabled={sectionIndex === 0}
                            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItemWithinSection(index, selectedSection.name, 1)}
                            disabled={sectionIndex === selectedSection.entries.length - 1}
                            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={saving}
                            className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {saving ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-2">
                        <Field label="Title">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(event) => updateItem(index, { title: event.target.value })}
                            className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                            placeholder="Grand Reception Frames"
                          />
                        </Field>

                        <Field label="Section">
                          <select
                            value={item.category}
                            onChange={(event) => updateItem(index, { category: event.target.value })}
                            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                          >
                            {SAMPLE_WORK_SECTIONS.map((filterName) => (
                              <option key={filterName} value={filterName}>
                                {filterName}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <Field label="Image URL" className="mt-5">
                        <input
                          type="url"
                          value={item.image}
                          onChange={(event) => updateItem(index, { image: event.target.value })}
                          className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                          placeholder="Paste image URL"
                        />
                      </Field>

                      <Field label="Or upload image from computer" className="mt-5">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            handleFileSelection(index, event.target.files);
                            event.target.value = '';
                          }}
                          className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
                        />
                      </Field>

                      {item.file && (
                        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                          Selected file: <span className="font-medium text-stone-900">{item.file.name}</span>
                          <button
                            type="button"
                            onClick={() => updateItem(index, { file: null })}
                            className="ml-3 text-sm font-semibold text-stone-900 underline underline-offset-4"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {(item.image || item.file) && (
                        <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-50">
                          <ImagePreview src={item.image} file={item.file} alt={item.title || `Sample work ${sectionIndex + 1}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
