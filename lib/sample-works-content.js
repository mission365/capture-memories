export const SAMPLE_WORK_FILTERS = ['All', 'Indoor Event', 'Outdoor Event', 'Pre and Post Wedding', 'Sonaton Event'];

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeSampleWorkCategory(item = {}) {
  const rawCategory = readText(item?.category);
  const rawTitle = readText(item?.title);
  const lookupText = `${rawCategory} ${rawTitle}`.toLowerCase();

  if (SAMPLE_WORK_FILTERS.includes(rawCategory)) {
    return rawCategory;
  }

  if (lookupText.includes('sonaton') || lookupText.includes('holud')) {
    return 'Sonaton Event';
  }

  if (
    lookupText.includes('pre-wedding') ||
    lookupText.includes('post-wedding') ||
    lookupText.includes('couple')
  ) {
    return 'Pre and Post Wedding';
  }

  if (lookupText.includes('outdoor') || lookupText.includes('destination')) {
    return 'Outdoor Event';
  }

  return 'Indoor Event';
}

export function normalizeSampleWorks(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      title: readText(item?.title),
      category: normalizeSampleWorkCategory(item),
      image: readText(item?.image),
    }))
    .filter((item) => item.title || item.image);
}
