function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeFeaturedAlbum(album = {}, index = 0) {
  const title = readText(album?.title) || `Featured Album ${index + 1}`;
  let slug = readText(album?.slug);

  if (!slug && title) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (!slug) {
    slug = `album-${index + 1}`;
  }

  return {
    title,
    slug,
    heroTitle: readText(album?.heroTitle) || title,
    heroSubtitle: readText(album?.heroSubtitle),
    story: readText(album?.story),
    credit: readText(album?.credit),
    image: readText(album?.image || album?.imageUrl),
  };
}

export function normalizeFeaturedAlbums(albums = []) {
  if (!Array.isArray(albums)) {
    return [];
  }

  return albums
    .map((album, index) => normalizeFeaturedAlbum(album, index))
    .filter((album) => Boolean(album.slug));
}

export function normalizeAlbumStoryGalleryItem(item = {}) {
  return {
    image: readText(item?.image || item?.imageUrl),
    caption: readText(item?.caption),
  };
}

export function normalizeAlbumStoryGalleryItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizeAlbumStoryGalleryItem(item))
    .filter((item) => Boolean(item.image));
}

export function normalizeAlbumStoryGalleries(galleries = {}) {
  if (!galleries || Array.isArray(galleries) || typeof galleries !== 'object') {
    return {};
  }

  return Object.entries(galleries).reduce((accumulator, [slug, items]) => {
    const normalizedSlug = readText(slug);

    if (!normalizedSlug) {
      return accumulator;
    }

    accumulator[normalizedSlug] = normalizeAlbumStoryGalleryItems(items);
    return accumulator;
  }, {});
}
