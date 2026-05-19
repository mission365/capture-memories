import { normalizeSupabaseStorageUrl } from '@/lib/storage-url';

const PACKAGE_SHOWCASE_DEFAULTS = [
  { link: '/packages/sonaton', name: 'Sonaton Package', image: '' },
  { link: '/packages/muslim', name: 'Muslim Package', image: '' },
];
const PACKAGE_LINK_PREFIX = '/packages/';
export const RESERVED_PACKAGE_CATEGORY_SLUGS = ['inside-dhaka', 'outside-dhaka', 'outdoor', 'add-ons', 'admin'];

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function humanizePackageSlug(value) {
  return readText(value)
    .split('-')
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ');
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizePackageCategorySlug(value) {
  const rawValue = readText(value);

  if (!rawValue) {
    return '';
  }

  const withoutPrefix = rawValue.startsWith(PACKAGE_LINK_PREFIX) ? rawValue.slice(PACKAGE_LINK_PREFIX.length) : rawValue;

  return withoutPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getPackageCategoryLink(slug) {
  const normalizedSlug = normalizePackageCategorySlug(slug);
  return normalizedSlug ? `${PACKAGE_LINK_PREFIX}${normalizedSlug}` : '';
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
          link: getPackageCategoryLink(item?.link || item?.slug),
          image: normalizeSupabaseStorageUrl(readText(item?.image)),
        }))
        .filter((item) => item.link)
    : [];

  const sourceItems = normalizedItems.length > 0 ? normalizedItems : PACKAGE_SHOWCASE_DEFAULTS;
  const seenLinks = new Set();

  return sourceItems.filter((item) => {
    if (!item?.link || seenLinks.has(item.link)) {
      return false;
    }

    seenLinks.add(item.link);
    return true;
  });
}

export function normalizePackageCategory(item = {}, fallbackItem = {}) {
  const fallbackSlug = normalizePackageCategorySlug(
    fallbackItem?.slug || fallbackItem?.link || fallbackItem?.name || fallbackItem?.title
  );
  const slug = normalizePackageCategorySlug(item?.slug || item?.link || item?.name || item?.title) || fallbackSlug;

  if (!slug) {
    return null;
  }

  const fallbackName = readText(fallbackItem?.name || fallbackItem?.title);
  const fallbackDescription = readText(fallbackItem?.description);
  const fallbackImage = normalizeSupabaseStorageUrl(readText(fallbackItem?.image));
  const rawItems =
    Object.prototype.hasOwnProperty.call(item, 'items') || Object.prototype.hasOwnProperty.call(item, 'packages')
      ? item?.items || item?.packages
      : fallbackItem?.items || fallbackItem?.packages;

  return {
    slug,
    link: getPackageCategoryLink(slug),
    name: readText(item?.name || item?.title) || fallbackName || humanizePackageSlug(slug),
    description: readText(item?.description) || fallbackDescription,
    image: normalizeSupabaseStorageUrl(readText(item?.image)) || fallbackImage,
    items: normalizePackageCards(rawItems),
  };
}

export function normalizePackageCatalog(items = [], fallbackItems = []) {
  const sourceItems = Array.isArray(items) ? items : fallbackItems;
  const seenSlugs = new Set();

  if (!Array.isArray(sourceItems)) {
    return [];
  }

  return sourceItems
    .map((item, index) => normalizePackageCategory(item, Array.isArray(fallbackItems) ? fallbackItems[index] : {}))
    .filter((item) => {
      if (!item?.slug || seenSlugs.has(item.slug)) {
        return false;
      }

      seenSlugs.add(item.slug);
      return true;
    });
}
