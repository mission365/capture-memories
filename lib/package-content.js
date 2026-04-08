const PACKAGE_SHOWCASE_DEFAULTS = [
  { link: '/packages/sonaton', name: 'Sonaton Package', image: '' },
  { link: '/packages/muslim', name: 'Muslim Package', image: '' },
];

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => readText(item)).filter(Boolean);
}

function normalizePackageSecondary(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const title = readText(value.title);
  const price = readText(value.price);
  const features = normalizeStringList(value.features);

  if (!title && !price && features.length === 0) {
    return null;
  }

  return {
    title: title || 'Secondary Package',
    price,
    features,
  };
}

function createFallbackDetailSections(item = {}) {
  const sections = [];

  if (item.features?.length) {
    sections.push({
      title: item.secondary ? item.title : 'Package Highlights',
      lines: item.features,
    });
  }

  if (item.secondary) {
    sections.push({
      title: item.secondary.title,
      price: item.secondary.price,
      lines: item.secondary.features,
    });
  }

  if (item.subtitle) {
    sections.push({
      title: 'Storytelling Note',
      lines: [item.subtitle],
    });
  }

  sections.push({
    title: 'Delivery Service',
    lines: [
      'Digital copies will be provided via Google Drive or client pendrive.',
      'Albums, prints, and premium delivery boxes can be added on request.',
    ],
  });

  sections.push({
    title: 'Terms & Conditions',
    lines: [
      ...(item.note ? [item.note] : []),
      'Booking date is confirmed after the advance payment is completed.',
      'Time duration follows the selected package and extra hours may include additional charges.',
      'Rescheduling depends on team availability and existing event commitments.',
    ],
  });

  return sections;
}

export function normalizePackageDetailSections(item = {}) {
  const detailSections = Array.isArray(item.detailSections)
    ? item.detailSections
        .map((section) => ({
          title: readText(section?.title),
          price: readText(section?.price),
          lines: normalizeStringList(section?.lines),
        }))
        .filter((section) => section.title || section.price || section.lines.length > 0)
    : [];

  if (detailSections.length > 0) {
    return detailSections;
  }

  return createFallbackDetailSections(item);
}

export function normalizePackageCard(item = {}) {
  const title = readText(item.title);
  const price = readText(item.price);
  const subtitle = readText(item.subtitle);
  const features = normalizeStringList(item.features);
  const note = readText(item.note);
  const secondary = normalizePackageSecondary(item.secondary);

  return {
    title,
    price,
    subtitle,
    features,
    note,
    secondary,
    detailSections: normalizePackageDetailSections({
      title,
      subtitle,
      features,
      note,
      secondary,
      detailSections: item.detailSections,
    }),
  };
}

export function normalizePackageCards(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizePackageCard(item))
    .filter(
      (item) =>
        item.title ||
        item.price ||
        item.subtitle ||
        item.features.length > 0 ||
        item.note ||
        item.secondary ||
        item.detailSections.length > 0
    );
}

export function normalizePackageShowcase(items = []) {
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          name: readText(item?.name),
          link: readText(item?.link),
          image: readText(item?.image),
        }))
        .filter((item) => item.link)
    : [];

  return PACKAGE_SHOWCASE_DEFAULTS.map((fallbackItem) => {
    const matchedItem = normalizedItems.find((item) => item.link === fallbackItem.link);

    return {
      name: matchedItem?.name || fallbackItem.name,
      link: fallbackItem.link,
      image: matchedItem?.image || fallbackItem.image,
    };
  });
}
