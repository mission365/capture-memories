export const defaultHeroSlides = [
  {
    id: 'fallback-1',
    title: 'Elegant Wedding Story',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-2',
    title: 'Joyful Holud Moments',
    image:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=80',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'fallback-3',
    title: 'Timeless Couple Portraits',
    image:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1400&q=80',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'fallback-4',
    title: 'Reception Highlights',
    image:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1400&q=80',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'fallback-5',
    title: 'Traditional Wedding Frames',
    image:
      'https://images.unsplash.com/photo-1516557070061-c3d1653fa646?auto=format&fit=crop&w=1400&q=80',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'fallback-6',
    title: 'Golden Evening Session',
    image:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80',
    sortOrder: 6,
    isActive: true,
  },
];

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
