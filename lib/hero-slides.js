export const defaultHeroSlides = [];

export function normalizeHeroSlide(slide, index = 0) {
  const image = slide?.image_url || slide?.image || '';
  return {
    id: slide?.id ?? `slide-${index + 1}`,
    title: slide?.title?.trim() || `Hero Slide ${index + 1}`,
    image,
    sortOrder: Number.isFinite(Number(slide?.sort_order)) ? Number(slide.sort_order) : index + 1,
    isActive: slide?.is_active ?? true,
  };
}

export function normalizeHeroSlides(slides = []) {
  return slides
    .map((slide, index) => normalizeHeroSlide(slide, index))
    .filter((slide) => Boolean(slide.image));
}
