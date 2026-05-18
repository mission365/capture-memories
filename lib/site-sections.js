function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readTimestamp(value) {
  const parsed = Date.parse(readText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRowFreshness(row = {}, index = 0) {
  return {
    timestamp: Math.max(readTimestamp(row?.updated_at), readTimestamp(row?.created_at)),
    index,
  };
}

export function getLatestSiteSectionRows(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  const latestRows = new Map();

  items.forEach((item, index) => {
    const sectionKey = readText(item?.section_key);

    if (!sectionKey) {
      return;
    }

    const currentMeta = getRowFreshness(item, index);
    const previous = latestRows.get(sectionKey);

    if (!previous) {
      latestRows.set(sectionKey, { item, meta: currentMeta });
      return;
    }

    if (
      currentMeta.timestamp > previous.meta.timestamp ||
      (currentMeta.timestamp === previous.meta.timestamp && currentMeta.index > previous.meta.index)
    ) {
      latestRows.set(sectionKey, { item, meta: currentMeta });
    }
  });

  return Array.from(latestRows.values())
    .map((entry) => entry.item)
    .sort((left, right) => readText(left?.section_key).localeCompare(readText(right?.section_key)));
}

export function createSiteSectionMap(items = []) {
  return getLatestSiteSectionRows(items).reduce((accumulator, item) => {
    accumulator[item.section_key] = item.content;
    return accumulator;
  }, {});
}
