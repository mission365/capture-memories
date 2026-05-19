'use client';

import { useEffect, useRef, useState } from 'react';
import AboutPageAdminPanel from '@/components/about-page-admin-panel';
import BookUsAdminPanel from '@/components/book-us-admin-panel';
import PackagesAdminPanel from '@/components/packages-admin-panel';
import SampleWorksAdminPanel from '@/components/sample-works-admin-panel';
import SiteIdentityAdminPanel from '@/components/site-identity-admin-panel';
import { Spinner } from '@/components/ui/spinner';
import { createWhatsAppLink, normalizeBookUsContent } from '@/lib/book-us-content';
import {
  normalizeAlbumStoryGalleryItems,
  normalizeAlbumStoryGalleries,
  normalizeFeaturedAlbums,
} from '@/lib/featured-albums';
import { normalizePackageCatalog, normalizePackageCards, normalizePackageShowcase } from '@/lib/package-content';
import { normalizeSampleWorks } from '@/lib/sample-works-content';
import {
  clearStoredSupabaseSession,
  createHeroSlide,
  deleteHeroSlide,
  getSupabaseConfig,
  isSupabaseConfigured,
  listHeroSlides,
  listSiteSections,
  restoreSupabaseSession,
  signInWithPassword,
  signOutSupabase,
  storeSupabaseSession,
  upsertSiteSection,
  updateHeroSlide,
  uploadHeroSlideImage,
  uploadStorageImage,
} from '@/lib/supabase-browser';
import { createSiteSectionMap, getLatestSiteSectionRows } from '@/lib/site-sections';
import { getUploadedStorageUrl, normalizeSupabaseStorageUrl } from '@/lib/storage-url';

function createEmptyForm() {
  return {
    title: '',
    imageUrl: '',
    sortOrder: '1',
    isActive: true,
  };
}

function createEmptyFeaturedAlbumForm() {
  return {
    title: '',
    slug: '',
    heroTitle: '',
    heroSubtitle: '',
    pageCaption: '',
    story: '',
    credit: '',
    imageUrl: '',
    sortOrder: '1',
  };
}

const NEW_FEATURED_ALBUM_OPTION = '__new__';
const PACKAGE_CATALOG_SECTION = {
  key: 'packageCatalog',
  label: 'Package Catalog',
  description: 'Create package categories, their landing cards, and the package cards shown inside each category page.',
};
const LEGACY_PACKAGE_SECTION_KEYS = ['packageShowcase', 'sonatonPackages', 'muslimPackages'];
const ADMIN_WORKSPACES = [
  { id: 'slider', label: 'Slider', description: 'Hero slides, image upload, and display order.' },
  { id: 'albums', label: 'Featured Albums', description: 'Album covers, stories, and gallery images.' },
  { id: 'about', label: 'About Page', description: 'Team members, office info, and media.' },
  { id: 'site', label: 'Site Identity', description: 'Brand details and header/footer social links.' },
  { id: 'bookUs', label: 'Book Us', description: 'Contact-only Book Us page and WhatsApp action.' },
  { id: 'sampleWorks', label: 'Sample Works', description: 'Sample works images, filters, and uploads.' },
  { id: 'packages', label: 'Packages', description: 'Package cards, showcase cards, and modal details.' },
  { id: 'content', label: 'Content Sections', description: 'Advanced raw editor for the remaining sections.' },
];

function createGalleryEditorId() {
  return `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEditableGalleryItem(item = {}) {
  const normalizedItem = normalizeAlbumStoryGalleryItems([item])[0];

  return {
    id: createGalleryEditorId(),
    imageUrl: normalizedItem?.image || '',
    caption: normalizedItem?.caption || '',
    file: null,
  };
}

function createEditableGalleryItems(items = []) {
  const normalizedItems = normalizeAlbumStoryGalleryItems(items);

  if (normalizedItems.length === 0) {
    return [createEditableGalleryItem()];
  }

  return normalizedItems.map((item) => createEditableGalleryItem(item));
}

function formatSectionValue(value, fallbackValue) {
  const nextValue = typeof value === 'undefined' ? fallbackValue : value;
  if (typeof fallbackValue === 'string') {
    return typeof nextValue === 'string' ? nextValue : '';
  }

  return JSON.stringify(nextValue, null, 2);
}

function normalizeSectionResponse(payload) {
  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  return payload || null;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getPackageCatalogContent(sectionMap = {}, defaultContent = {}) {
  const fallbackCatalog = Array.isArray(defaultContent.packageCatalog) ? defaultContent.packageCatalog : [];

  if (Object.prototype.hasOwnProperty.call(sectionMap, PACKAGE_CATALOG_SECTION.key)) {
    return normalizePackageCatalog(sectionMap.packageCatalog, fallbackCatalog);
  }

  const showcaseItems = normalizePackageShowcase(
    Object.prototype.hasOwnProperty.call(sectionMap, 'packageShowcase')
      ? sectionMap.packageShowcase
      : defaultContent.packageShowcase
  );

  const legacyCatalog = fallbackCatalog.map((category) => {
    const collectionKey = `${category.slug}Packages`;
    const savedItems = Object.prototype.hasOwnProperty.call(sectionMap, collectionKey)
      ? sectionMap[collectionKey]
      : defaultContent[collectionKey];
    const showcaseItem = showcaseItems.find((item) => item.link === category.link);

    return {
      slug: category.slug,
      name: showcaseItem?.name || category.name,
      description: category.description,
      image: showcaseItem?.image || category.image,
      items: normalizePackageCards(savedItems),
    };
  });

  return normalizePackageCatalog(legacyCatalog, fallbackCatalog);
}

function getMergedAboutPageContent(sectionMap = {}, defaultContent = {}) {
  const fallbackAboutPage = isPlainObject(defaultContent.aboutPage) ? defaultContent.aboutPage : {};
  const savedAboutPage = isPlainObject(sectionMap.aboutPage) ? sectionMap.aboutPage : {};
  const legacyAboutPageContent = isPlainObject(sectionMap.aboutPageContent) ? sectionMap.aboutPageContent : {};
  const savedPageContent = isPlainObject(savedAboutPage.pageContent)
    ? savedAboutPage.pageContent
    : isPlainObject(savedAboutPage.aboutPageContent)
      ? savedAboutPage.aboutPageContent
      : {};
  const legacyOfficeInfo = isPlainObject(sectionMap.officeInfo) ? sectionMap.officeInfo : {};
  const savedOfficeInfo = isPlainObject(savedAboutPage.officeInfo) ? savedAboutPage.officeInfo : {};
  const legacyOfficeTour = isPlainObject(sectionMap.officeTour) ? sectionMap.officeTour : {};
  const savedOfficeTour = isPlainObject(savedAboutPage.officeTour) ? savedAboutPage.officeTour : {};
  const fallbackMembers = Array.isArray(fallbackAboutPage.foundingMembers) ? fallbackAboutPage.foundingMembers : [];
  const legacyMembers = Array.isArray(sectionMap.foundingMembers) ? sectionMap.foundingMembers : null;
  const savedMembers = Array.isArray(savedAboutPage.foundingMembers) ? savedAboutPage.foundingMembers : null;

  return {
    ...fallbackAboutPage,
    intro:
      typeof savedAboutPage.intro === 'string'
        ? savedAboutPage.intro
        : typeof savedAboutPage.aboutIntro === 'string'
          ? savedAboutPage.aboutIntro
          : typeof sectionMap.aboutIntro === 'string'
            ? sectionMap.aboutIntro
            : fallbackAboutPage.intro || '',
    pageContent: {
      ...(isPlainObject(fallbackAboutPage.pageContent) ? fallbackAboutPage.pageContent : {}),
      ...legacyAboutPageContent,
      ...savedPageContent,
    },
    foundingMembers: savedMembers || legacyMembers || fallbackMembers,
    officeInfo: {
      ...(isPlainObject(fallbackAboutPage.officeInfo) ? fallbackAboutPage.officeInfo : {}),
      ...legacyOfficeInfo,
      ...savedOfficeInfo,
    },
    officeTour: {
      ...(isPlainObject(fallbackAboutPage.officeTour) ? fallbackAboutPage.officeTour : {}),
      ...legacyOfficeTour,
      ...savedOfficeTour,
    },
  };
}

function readInputText(value) {
  return typeof value === 'string' ? value : '';
}

function createAboutMemberEditorId() {
  return `about-member-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEditableAboutMember(member = {}) {
  return {
    id: createAboutMemberEditorId(),
    name: readInputText(member?.name),
    role: readInputText(member?.role),
    imageUrl: normalizeSupabaseStorageUrl(readInputText(member?.image)),
    facebookUrl: readInputText(member?.facebookUrl),
    instagramUrl: readInputText(member?.instagramUrl),
    youtubeUrl: readInputText(member?.youtubeUrl),
    email: readInputText(member?.email),
    file: null,
  };
}

function createEditableAboutMembers(members = []) {
  if (!Array.isArray(members) || members.length === 0) {
    return [createEditableAboutMember()];
  }

  return members.map((member) => createEditableAboutMember(member));
}

function createAboutPageForm(content = {}) {
  const nextContent = isPlainObject(content) ? content : {};
  const pageContent = isPlainObject(nextContent.pageContent) ? nextContent.pageContent : {};
  const officeInfo = isPlainObject(nextContent.officeInfo) ? nextContent.officeInfo : {};
  const officeTour = isPlainObject(nextContent.officeTour) ? nextContent.officeTour : {};

  return {
    intro: readInputText(nextContent.intro),
    eyebrow: readInputText(pageContent.eyebrow),
    title: readInputText(pageContent.title),
    teamEyebrow: readInputText(pageContent.teamEyebrow),
    teamTitle: readInputText(pageContent.teamTitle),
    officeHeading: readInputText(pageContent.officeHeading),
    phoneHeading: readInputText(pageContent.phoneHeading),
    address: Array.isArray(officeInfo.address) ? officeInfo.address.join('\n') : '',
    phones: Array.isArray(officeInfo.phones) ? officeInfo.phones.join('\n') : '',
    mapQuery: readInputText(officeInfo.mapQuery),
    officeTourTitle: readInputText(officeTour.title),
    officeTourSubtitle: readInputText(officeTour.subtitle),
    officeTourVideoUrl: readInputText(officeTour.videoUrl),
    officeTourImageUrl: normalizeSupabaseStorageUrl(readInputText(officeTour.image)),
  };
}

function createBookUsForm(content = {}) {
  const normalizedContent = normalizeBookUsContent(content);

  return {
    heading: readInputText(normalizedContent.heading),
    subheading: readInputText(normalizedContent.subheading),
    officeTitle: readInputText(normalizedContent.officeTitle),
    officeLines: Array.isArray(normalizedContent.officeLines) ? normalizedContent.officeLines.join('\n') : '',
    phoneTitle: readInputText(normalizedContent.phoneTitle),
    phoneNumber: readInputText(normalizedContent.phoneNumber),
    emailTitle: readInputText(normalizedContent.emailTitle),
    emailAddress: readInputText(normalizedContent.emailAddress),
    whatsappTitle: readInputText(normalizedContent.whatsappTitle),
    whatsappNumber: readInputText(normalizedContent.whatsappNumber),
    whatsappLabel: readInputText(normalizedContent.whatsappLabel),
    whatsappMessage: readInputText(normalizedContent.whatsappMessage),
  };
}

function createSiteIdentityForm(content = {}) {
  return {
    brand: readInputText(content?.brand),
    tagline: readInputText(content?.tagline),
    logoUrl: normalizeSupabaseStorageUrl(readInputText(content?.logoUrl)),
    email: readInputText(content?.email),
    phone: readInputText(content?.phone),
    location: readInputText(content?.location),
    facebookUrl: readInputText(content?.facebookUrl),
    instagramUrl: readInputText(content?.instagramUrl),
    youtubeUrl: readInputText(content?.youtubeUrl),
  };
}

function parseMultilineList(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function looksLikeYouTubeUrl(value) {
  return /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(String(value || '').trim());
}

function createHeroSlideSelector(slide = {}) {
  return {
    id: readInputText(slide?.id),
    imageUrl: normalizeSupabaseStorageUrl(readInputText(slide?.image_url || slide?.image)),
    createdAt: readInputText(slide?.created_at),
    sortOrder: Number.isFinite(Number(slide?.sort_order)) ? Number(slide.sort_order) : null,
    title: readInputText(slide?.title),
  };
}

function createHeroSlideAdminKey(slide = {}, index = 0) {
  const selector = createHeroSlideSelector(slide);

  return (
    selector.id ||
    [
      selector.createdAt || `row-${index + 1}`,
      selector.imageUrl || 'no-image',
      selector.sortOrder ?? index + 1,
      index + 1,
    ].join('::')
  );
}

export default function HeroSliderAdmin({ navigate, defaultContent = {}, contentSections = [] }) {
  const initialAboutPageContent = getMergedAboutPageContent({}, defaultContent);
  const initialSiteIdentityContent = defaultContent.site || {};
  const initialBookUsContent = normalizeBookUsContent(defaultContent.bookUs);
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [sectionItems, setSectionItems] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [hasLoadedSections, setHasLoadedSections] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAlbums, setSavingAlbums] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [savingSiteIdentity, setSavingSiteIdentity] = useState(false);
  const [savingBookUs, setSavingBookUs] = useState(false);
  const [savingSampleWorks, setSavingSampleWorks] = useState(false);
  const [sampleWorksProgress, setSampleWorksProgress] = useState(0);
  const [sampleWorksProgressLabel, setSampleWorksProgressLabel] = useState('');
  const [savingPackageSections, setSavingPackageSections] = useState(false);
  const [featuredAlbumProgress, setFeaturedAlbumProgress] = useState(0);
  const [featuredAlbumProgressLabel, setFeaturedAlbumProgressLabel] = useState('');
  const [aboutPageProgress, setAboutPageProgress] = useState(0);
  const [aboutPageProgressLabel, setAboutPageProgressLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [featuredAlbumFile, setFeaturedAlbumFile] = useState(null);
  const [featuredAlbumPreviewUrl, setFeaturedAlbumPreviewUrl] = useState('');
  const [editingFeaturedAlbumSlug, setEditingFeaturedAlbumSlug] = useState(null);
  const [featuredAlbumForm, setFeaturedAlbumForm] = useState(createEmptyFeaturedAlbumForm);
  const [featuredAlbumGalleryItems, setFeaturedAlbumGalleryItems] = useState(() => createEditableGalleryItems());
  const [showFeaturedAlbumGalleryEditor, setShowFeaturedAlbumGalleryEditor] = useState(false);
  const [aboutPageForm, setAboutPageForm] = useState(() => createAboutPageForm(initialAboutPageContent));
  const [aboutPageMembers, setAboutPageMembers] = useState(() =>
    createEditableAboutMembers(initialAboutPageContent.foundingMembers)
  );
  const [aboutPageOfficeImageFile, setAboutPageOfficeImageFile] = useState(null);
  const [aboutPageOfficeImagePreviewUrl, setAboutPageOfficeImagePreviewUrl] = useState('');
  const [savingAboutPage, setSavingAboutPage] = useState(false);
  const [siteIdentityForm, setSiteIdentityForm] = useState(() => createSiteIdentityForm(initialSiteIdentityContent));
  const [siteIdentityLogoFile, setSiteIdentityLogoFile] = useState(null);
  const [siteIdentityLogoPreviewUrl, setSiteIdentityLogoPreviewUrl] = useState('');
  const [bookUsForm, setBookUsForm] = useState(() => createBookUsForm(initialBookUsContent));
  const [activeAdminSection, setActiveAdminSection] = useState('slider');
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingSlideSelector, setEditingSlideSelector] = useState(null);
  const [selectedSectionKey, setSelectedSectionKey] = useState(contentSections[0]?.key || '');
  const [sectionEditor, setSectionEditor] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sliderEditorRef = useRef(null);
  const sliderItemsScrollerRef = useRef(null);
  const featuredAlbumEditorRef = useRef(null);
  const featuredAlbumsScrollerRef = useRef(null);
  const [sliderItemsPanelHeight, setSliderItemsPanelHeight] = useState(null);
  const [sliderItemsViewportHeight, setSliderItemsViewportHeight] = useState(null);
  const [featuredAlbumsPanelHeight, setFeaturedAlbumsPanelHeight] = useState(null);

  const supabaseConfig = getSupabaseConfig();
  const configured = isSupabaseConfigured();
  const sectionMap = createSiteSectionMap(sectionItems);
  const mergedAboutPageContent = getMergedAboutPageContent(sectionMap, defaultContent);
  const selectedSectionDefinition =
    contentSections.find((section) => section.key === selectedSectionKey) || contentSections[0] || null;
  const selectedFallbackValue = selectedSectionDefinition
    ? (selectedSectionDefinition.key === 'aboutPage'
        ? mergedAboutPageContent
        : defaultContent[selectedSectionDefinition.key])
    : '';
  const selectedSectionValue = selectedSectionDefinition
    ? (selectedSectionDefinition.key === 'aboutPage'
        ? mergedAboutPageContent
        : Object.prototype.hasOwnProperty.call(sectionMap, selectedSectionDefinition.key)
        ? sectionMap[selectedSectionDefinition.key]
        : selectedFallbackValue)
    : '';
  const hasLegacyAboutPageValue = [
    'aboutIntro',
    'aboutPageContent',
    'foundingMembers',
    'officeInfo',
    'officeTour',
  ].some((key) => Object.prototype.hasOwnProperty.call(sectionMap, key));
  const aboutPageStatusLabel = Object.prototype.hasOwnProperty.call(sectionMap, 'aboutPage')
    ? 'Saved in Supabase'
    : hasLegacyAboutPageValue
      ? 'Loaded from legacy About rows'
      : 'Using fallback data';
  const hasSiteCustomValue = Object.prototype.hasOwnProperty.call(sectionMap, 'site');
  const siteIdentityContent = hasSiteCustomValue ? sectionMap.site : defaultContent.site;
  const featuredAlbums = normalizeFeaturedAlbums(
    Object.prototype.hasOwnProperty.call(sectionMap, 'featuredAlbums')
      ? sectionMap.featuredAlbums
      : defaultContent.featuredAlbums
  );
  const albumStoryGalleries = normalizeAlbumStoryGalleries(
    Object.prototype.hasOwnProperty.call(sectionMap, 'albumStoryGalleries')
      ? sectionMap.albumStoryGalleries
      : defaultContent.albumStoryGalleries
  );
  const hasBookUsCustomValue = Object.prototype.hasOwnProperty.call(sectionMap, 'bookUs');
  const bookUsContent = normalizeBookUsContent(hasBookUsCustomValue ? sectionMap.bookUs : defaultContent.bookUs);
  const featuredAlbumTargetName =
    featuredAlbumForm.title.trim() || featuredAlbumForm.slug.trim() || 'New featured album';
  const featuredAlbumTargetPath = featuredAlbumForm.slug.trim()
    ? `/sample-works/${featuredAlbumForm.slug.trim()}`
    : '';
  const selectedFeaturedAlbumValue = editingFeaturedAlbumSlug || NEW_FEATURED_ALBUM_OPTION;
  const hasLegacyPackageContent = LEGACY_PACKAGE_SECTION_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(sectionMap, key)
  );
  const packageCatalogSection = {
    ...PACKAGE_CATALOG_SECTION,
    currentValue: getPackageCatalogContent(sectionMap, defaultContent),
    hasCustomValue:
      Object.prototype.hasOwnProperty.call(sectionMap, PACKAGE_CATALOG_SECTION.key) || hasLegacyPackageContent,
  };
  const hasSampleWorksCustomValue = Object.prototype.hasOwnProperty.call(sectionMap, 'sampleWorks');
  const sampleWorksHydrating = Boolean(session?.access_token) && !hasLoadedSections;
  const sampleWorksItems = normalizeSampleWorks(
    sampleWorksHydrating ? [] : hasSampleWorksCustomValue ? sectionMap.sampleWorks : defaultContent.sampleWorks
  );
  const adminWorkspaces = [
    {
      ...ADMIN_WORKSPACES[0],
      statusLabel: loadingSlides ? 'Loading...' : `${slides.length} slide${slides.length === 1 ? '' : 's'}`,
    },
    {
      ...ADMIN_WORKSPACES[1],
      statusLabel: loadingSections ? 'Loading...' : `${featuredAlbums.length} album${featuredAlbums.length === 1 ? '' : 's'}`,
    },
    {
      ...ADMIN_WORKSPACES[2],
      statusLabel: aboutPageStatusLabel,
    },
    {
      ...ADMIN_WORKSPACES[3],
      statusLabel: loadingSections ? 'Loading...' : hasSiteCustomValue ? 'Saved in Supabase' : 'Using fallback data',
    },
    {
      ...ADMIN_WORKSPACES[4],
      statusLabel: loadingSections ? 'Loading...' : hasBookUsCustomValue ? 'Saved in Supabase' : 'Using fallback data',
    },
    {
      ...ADMIN_WORKSPACES[5],
      statusLabel:
        loadingSections || sampleWorksHydrating
          ? 'Loading...'
          : `${sampleWorksItems.length} item${sampleWorksItems.length === 1 ? '' : 's'}`,
    },
    {
      ...ADMIN_WORKSPACES[6],
      statusLabel: loadingSections
        ? 'Loading...'
        : `${packageCatalogSection.currentValue.length} categor${packageCatalogSection.currentValue.length === 1 ? 'y' : 'ies'}`,
    },
    {
      ...ADMIN_WORKSPACES[7],
      statusLabel: `${contentSections.length} section${contentSections.length === 1 ? '' : 's'}`,
    },
  ];
  const activeWorkspace = adminWorkspaces.find((workspace) => workspace.id === activeAdminSection) || adminWorkspaces[0];
  const getSectionHasCustomValue = (sectionKey) =>
    sectionKey === 'aboutPage'
      ? Object.prototype.hasOwnProperty.call(sectionMap, 'aboutPage') || hasLegacyAboutPageValue
      : Object.prototype.hasOwnProperty.call(sectionMap, sectionKey);
  const sliderItemsCardHeight = sliderItemsPanelHeight ? Math.min(sliderItemsPanelHeight + 108, 590) : 590;
  const featuredAlbumsCardHeight = featuredAlbumsPanelHeight || null;

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!featuredAlbumFile) {
      setFeaturedAlbumPreviewUrl('');
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(featuredAlbumFile);
    setFeaturedAlbumPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [featuredAlbumFile]);

  useEffect(() => {
    if (!aboutPageOfficeImageFile) {
      setAboutPageOfficeImagePreviewUrl('');
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(aboutPageOfficeImageFile);
    setAboutPageOfficeImagePreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [aboutPageOfficeImageFile]);

  useEffect(() => {
    if (!siteIdentityLogoFile) {
      setSiteIdentityLogoPreviewUrl('');
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(siteIdentityLogoFile);
    setSiteIdentityLogoPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [siteIdentityLogoFile]);

  useEffect(() => {
    if (contentSections.length === 0) {
      if (selectedSectionKey) {
        setSelectedSectionKey('');
      }
      return;
    }

    const hasSelectedSection = contentSections.some((section) => section.key === selectedSectionKey);

    if (!hasSelectedSection) {
      setSelectedSectionKey(contentSections[0].key);
    }
  }, [contentSections, selectedSectionKey]);

  useEffect(() => {
    setSiteIdentityForm(createSiteIdentityForm(siteIdentityContent));
    setSiteIdentityLogoFile(null);
  }, [sectionItems, defaultContent]);

  useEffect(() => {
    setBookUsForm(createBookUsForm(bookUsContent));
  }, [sectionItems, defaultContent]);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      if (!configured) {
        setBooting(false);
        return;
      }

      try {
        const restored = await restoreSupabaseSession();
        if (!ignore && restored) {
          setSession(restored);
        }
      } catch (restoreError) {
        if (!ignore) {
          setError(restoreError.message || 'Saved session could not be restored.');
        }
      } finally {
        if (!ignore) {
          setBooting(false);
        }
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [configured]);

  useEffect(() => {
    if (!session?.access_token) return;
    loadSlides(session.access_token);
    loadSections(session.access_token);
  }, [session?.access_token]);

  useEffect(() => {
    if (!selectedSectionDefinition) {
      setSectionEditor('');
      return;
    }

    setSectionEditor(formatSectionValue(selectedSectionValue, selectedFallbackValue));
  }, [selectedFallbackValue, selectedSectionDefinition, selectedSectionValue]);

  useEffect(() => {
    if (activeAdminSection !== 'slider') {
      setSliderItemsPanelHeight(null);
      return;
    }

    const element = sliderEditorRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setSliderItemsPanelHeight(element.offsetHeight || null);
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);

      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [activeAdminSection, editingId, previewUrl, form.imageUrl]);

  useEffect(() => {
    if (activeAdminSection !== 'slider') {
      setSliderItemsViewportHeight(null);
      return;
    }

    const element = sliderItemsScrollerRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setSliderItemsViewportHeight(element.clientHeight || null);
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);

      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [activeAdminSection, sliderItemsPanelHeight]);

  useEffect(() => {
    if (activeAdminSection !== 'albums') {
      setFeaturedAlbumsPanelHeight(null);
      return;
    }

    const element = featuredAlbumEditorRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setFeaturedAlbumsPanelHeight(element.offsetHeight || null);
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);

      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [
    activeAdminSection,
    editingFeaturedAlbumSlug,
    featuredAlbumPreviewUrl,
    featuredAlbumForm.imageUrl,
    featuredAlbumGalleryItems.length,
    showFeaturedAlbumGalleryEditor,
  ]);

  async function loadSlides(accessToken) {
    setLoadingSlides(true);
    setError('');

    try {
      const items = await listHeroSlides({
        includeInactive: true,
        accessToken,
      });
      const nextSlides = Array.isArray(items)
        ? items.map((item, index) => {
            const normalizedImageUrl = normalizeSupabaseStorageUrl(item?.image_url);

            return {
              ...item,
              image_url: normalizedImageUrl,
              _selector: createHeroSlideSelector({
                ...item,
                image_url: normalizedImageUrl,
              }),
              _adminKey: createHeroSlideAdminKey(
                {
                  ...item,
                  image_url: normalizedImageUrl,
                },
                index
              ),
            };
          })
        : [];
      setSlides(nextSlides);
      return nextSlides;
    } catch (loadError) {
      setError(loadError.message || 'Slides could not be loaded.');
      return [];
    } finally {
      setLoadingSlides(false);
    }
  }

  async function loadSections(accessToken) {
    setLoadingSections(true);
    setError('');

    try {
      const items = await listSiteSections({ accessToken });
      const nextItems = getLatestSiteSectionRows(items);
      setSectionItems(nextItems);
      resetAboutPageEditor(getMergedAboutPageContent(createSiteSectionMap(nextItems), defaultContent));
      return nextItems;
    } catch (loadError) {
      setError(loadError.message || 'Content sections could not be loaded.');
      return [];
    } finally {
      setHasLoadedSections(true);
      setLoadingSections(false);
    }
  }

  function patchSectionItem(savedSection) {
    if (!savedSection?.section_key) {
      return;
    }

    setSectionItems((current) => {
      const nextItems = current.filter((item) => item.section_key !== savedSection.section_key);
      nextItems.push(savedSection);
      return nextItems.sort((left, right) => left.section_key.localeCompare(right.section_key));
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const nextSession = await signInWithPassword(authForm);
      storeSupabaseSession(nextSession);
      setSession(nextSession);
      setAuthForm({ email: '', password: '' });
      setMessage('Login successful. You can now manage slider images and all site sections.');
    } catch (loginError) {
      setError(loginError.message || 'Login failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setMessage('');
    setError('');

    try {
      if (session?.access_token) {
        await signOutSupabase(session.access_token);
      }
    } catch (_logoutError) {
      // Clearing the local session is enough even if the network call fails.
    } finally {
      clearStoredSupabaseSession();
      setSession(null);
      setSlides([]);
      setSectionItems([]);
      setHasLoadedSections(false);
      setEditingId(null);
      setEditingSlideSelector(null);
      setSelectedFile(null);
      setForm(createEmptyForm());
      setEditingFeaturedAlbumSlug(null);
      setFeaturedAlbumFile(null);
      setFeaturedAlbumForm(createEmptyFeaturedAlbumForm());
      setFeaturedAlbumGalleryItems(createEditableGalleryItems());
      resetAboutPageEditor(initialAboutPageContent);
      setSiteIdentityForm(createSiteIdentityForm(initialSiteIdentityContent));
      setSiteIdentityLogoFile(null);
      setBookUsForm(createBookUsForm(initialBookUsContent));
      setActiveAdminSection('slider');
      setSelectedSectionKey(contentSections[0]?.key || '');
      setSectionEditor('');
      setLoggingOut(false);
    }
  }

  function resetForm(nextCount = slides.length) {
    setEditingId(null);
    setEditingSlideSelector(null);
    setSelectedFile(null);
    setForm({
      title: '',
      imageUrl: '',
      sortOrder: String((nextCount || 0) + 1),
      isActive: true,
    });
  }

  function startEditing(slide) {
    setEditingId(slide._adminKey || createHeroSlideAdminKey(slide));
    setEditingSlideSelector(slide._selector || createHeroSlideSelector(slide));
    setSelectedFile(null);
    setMessage('');
    setError('');
    setForm({
      title: slide.title || '',
      imageUrl: normalizeSupabaseStorageUrl(slide.image_url || ''),
      sortOrder: String(slide.sort_order ?? 1),
      isActive: slide.is_active ?? true,
    });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function handleSaveSlide(event) {
    event.preventDefault();

    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      let imageUrl = normalizeSupabaseStorageUrl(form.imageUrl.trim());

      if (selectedFile) {
        const upload = await uploadHeroSlideImage(selectedFile, session.access_token);
        imageUrl = getUploadedStorageUrl(upload);
      }

      if (!imageUrl) {
        throw new Error('Please paste an image URL or upload an image file.');
      }

      const payload = {
        title: form.title.trim() || null,
        image_url: imageUrl,
        sort_order: Number(form.sortOrder || 1),
        is_active: form.isActive,
      };

      if (editingSlideSelector) {
        await updateHeroSlide(editingSlideSelector, payload, session.access_token);
        setMessage('Slide updated successfully.');
      } else {
        await createHeroSlide(payload, session.access_token);
        setMessage('Slide created successfully.');
      }

      const nextSlides = await loadSlides(session.access_token);
      resetForm(nextSlides.length);
    } catch (saveError) {
      setError(saveError.message || 'Slide could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSlide(slide) {
    if (!session?.access_token) return;

    const shouldDelete =
      typeof window === 'undefined' ? true : window.confirm('Do you want to delete this slide?');

    if (!shouldDelete) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const selector = slide?._selector || createHeroSlideSelector(slide);
      await deleteHeroSlide(selector, session.access_token);
      const nextSlides = await loadSlides(session.access_token);

      if (editingId === (slide?._adminKey || createHeroSlideAdminKey(slide))) {
        resetForm(nextSlides.length);
      }

      setMessage('Slide deleted successfully.');
    } catch (deleteError) {
      setError(deleteError.message || 'Slide could not be deleted.');
    } finally {
      setSaving(false);
    }
  }

  function resetSectionEditor() {
    setSectionEditor(formatSectionValue(selectedSectionValue, selectedFallbackValue));
  }

  function resetAboutPageEditor(content = mergedAboutPageContent, options = {}) {
    setAboutPageForm(createAboutPageForm(content));
    setAboutPageMembers(createEditableAboutMembers(content?.foundingMembers));
    setAboutPageOfficeImageFile(null);

    if (options.clearProgress !== false) {
      setAboutPageProgress(0);
      setAboutPageProgressLabel('');
    }
  }

  function updateAboutPageMember(memberId, patch) {
    setAboutPageMembers((current) => current.map((member) => (member.id === memberId ? { ...member, ...patch } : member)));
  }

  function addAboutPageMember() {
    setAboutPageMembers((current) => [...current, createEditableAboutMember()]);
  }

  function moveAboutPageMember(index, direction) {
    setAboutPageMembers((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextMembers = [...current];
      [nextMembers[index], nextMembers[nextIndex]] = [nextMembers[nextIndex], nextMembers[index]];
      return nextMembers;
    });
  }

  function removeAboutPageMember(memberId) {
    setAboutPageMembers((current) => {
      const nextMembers = current.filter((member) => member.id !== memberId);
      return nextMembers.length > 0 ? nextMembers : [createEditableAboutMember()];
    });
  }

  function resetFeaturedAlbumForm(nextCount = featuredAlbums.length, options = {}) {
    setEditingFeaturedAlbumSlug(null);
    setFeaturedAlbumFile(null);
    setFeaturedAlbumGalleryItems(createEditableGalleryItems());
    setShowFeaturedAlbumGalleryEditor(false);
    if (options.clearProgress !== false) {
      setFeaturedAlbumProgress(0);
      setFeaturedAlbumProgressLabel('');
    }
    setFeaturedAlbumForm({
      title: '',
      slug: '',
      heroTitle: '',
      heroSubtitle: '',
      pageCaption: '',
      story: '',
      credit: '',
      imageUrl: '',
      sortOrder: String((nextCount || 0) + 1),
    });
  }

  function startEditingFeaturedAlbum(album, index) {
    setEditingFeaturedAlbumSlug(album.slug);
    setFeaturedAlbumFile(null);
    setFeaturedAlbumGalleryItems(createEditableGalleryItems(albumStoryGalleries[album.slug] || []));
    setShowFeaturedAlbumGalleryEditor(false);
    setFeaturedAlbumProgress(0);
    setFeaturedAlbumProgressLabel('');
    setMessage('');
    setError('');
    setFeaturedAlbumForm({
      title: album.title || '',
      slug: album.slug || '',
      heroTitle: album.heroTitle || '',
      heroSubtitle: album.heroSubtitle || '',
      pageCaption: album.pageCaption || album.caption || '',
      story: album.story || '',
      credit: album.credit || '',
      imageUrl: album.image || '',
      sortOrder: String(index + 1),
    });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleFeaturedAlbumSelection(nextSlug) {
    setMessage('');
    setError('');

    if (nextSlug === NEW_FEATURED_ALBUM_OPTION) {
      resetFeaturedAlbumForm();
      return;
    }

    const nextIndex = featuredAlbums.findIndex((album) => album.slug === nextSlug);

    if (nextIndex === -1) {
      return;
    }

    startEditingFeaturedAlbum(featuredAlbums[nextIndex], nextIndex);
  }

  async function saveFeaturedAlbums(nextAlbums) {
    const response = await upsertSiteSection('featuredAlbums', nextAlbums, session.access_token);
    const savedSection = normalizeSectionResponse(response);
    patchSectionItem(savedSection);
    return savedSection;
  }

  async function saveAlbumStoryGalleries(nextGalleries) {
    const response = await upsertSiteSection('albumStoryGalleries', nextGalleries, session.access_token);
    const savedSection = normalizeSectionResponse(response);
    patchSectionItem(savedSection);
    return savedSection;
  }

  async function saveAboutPageSection(payload) {
    const response = await upsertSiteSection('aboutPage', payload, session.access_token);
    const savedSection = normalizeSectionResponse(response);
    patchSectionItem(savedSection);
    return savedSection;
  }

  function updateFeaturedAlbumGalleryItem(itemId, patch) {
    setFeaturedAlbumGalleryItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );
  }

  function addFeaturedAlbumGalleryItem() {
    setFeaturedAlbumGalleryItems((current) => [...current, createEditableGalleryItem()]);
  }

  function moveFeaturedAlbumGalleryItem(index, direction) {
    setFeaturedAlbumGalleryItems((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextItems = [...current];
      [nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]];
      return nextItems;
    });
  }

  function removeFeaturedAlbumGalleryItem(itemId) {
    setFeaturedAlbumGalleryItems((current) => {
      const nextItems = current.filter((item) => item.id !== itemId);
      return nextItems.length > 0 ? nextItems : createEditableGalleryItems();
    });
  }

  async function handleSaveAboutPage(event) {
    event.preventDefault();

    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    setSavingAboutPage(true);
    setMessage('');
    setError('');

    try {
      const pendingUploadCount =
        (aboutPageOfficeImageFile ? 1 : 0) + aboutPageMembers.filter((member) => member.file instanceof File).length;
      let completedUploads = 0;

      const updateUploadProgress = (label, percent = 0) => {
        if (pendingUploadCount === 0) {
          setAboutPageProgress(25);
          setAboutPageProgressLabel(label);
          return;
        }

        const totalProgress = Math.min(
          92,
          Math.max(1, Math.round(((completedUploads + percent / 100) / pendingUploadCount) * 92))
        );
        setAboutPageProgress(totalProgress);
        setAboutPageProgressLabel(label);
      };

      if (pendingUploadCount > 0) {
        setAboutPageProgress(1);
        setAboutPageProgressLabel('Uploading About page images...');
      } else {
        setAboutPageProgress(25);
        setAboutPageProgressLabel('Saving About page content...');
      }

      const rawOfficeTourImageUrl = aboutPageForm.officeTourImageUrl.trim();
      const rawOfficeTourVideoUrl = aboutPageForm.officeTourVideoUrl.trim();
      const inferredOfficeTourVideoUrl =
        rawOfficeTourVideoUrl || (looksLikeYouTubeUrl(rawOfficeTourImageUrl) ? rawOfficeTourImageUrl : '');
      let officeTourImageUrl =
        looksLikeYouTubeUrl(rawOfficeTourImageUrl) && !rawOfficeTourVideoUrl
          ? ''
          : normalizeSupabaseStorageUrl(rawOfficeTourImageUrl);

      if (aboutPageOfficeImageFile) {
        const upload = await uploadStorageImage(aboutPageOfficeImageFile, session.access_token, 'about-page', {
          onProgress: (percent) => {
            updateUploadProgress(`Uploading office image... ${percent}%`, percent);
          },
        });
        officeTourImageUrl = getUploadedStorageUrl(upload);
        completedUploads += 1;
      }

      const nextMembers = [];

      for (let index = 0; index < aboutPageMembers.length; index += 1) {
        const member = aboutPageMembers[index];
        const name = member.name.trim();
        const role = member.role.trim();
        const facebookUrl = member.facebookUrl.trim();
        const instagramUrl = member.instagramUrl.trim();
        const youtubeUrl = member.youtubeUrl.trim();
        const email = member.email.trim();
        const hasInput = Boolean(
          name ||
            role ||
            member.imageUrl.trim() ||
            facebookUrl ||
            instagramUrl ||
            youtubeUrl ||
            email ||
            member.file instanceof File
        );

        if (!hasInput) {
          continue;
        }

        let imageUrl = normalizeSupabaseStorageUrl(member.imageUrl.trim());

        if (member.file instanceof File) {
          const uploadLabelNumber = completedUploads + 1;
          const upload = await uploadStorageImage(member.file, session.access_token, 'about-page-members', {
            onProgress: (percent) => {
              updateUploadProgress(
                `Uploading founding member image ${uploadLabelNumber} of ${pendingUploadCount}... ${percent}%`,
                percent
              );
            },
          });
          imageUrl = getUploadedStorageUrl(upload);
          completedUploads += 1;
        }

        if (!name) {
          throw new Error(`Founding member ${index + 1} needs a name.`);
        }

        if (!role) {
          throw new Error(`Founding member ${index + 1} needs a role.`);
        }

        if (!imageUrl) {
          throw new Error(`Founding member ${index + 1} needs an image URL or upload.`);
        }

        nextMembers.push({
          name,
          role,
          image: imageUrl,
          facebookUrl,
          instagramUrl,
          youtubeUrl,
          email,
        });
      }

      if (nextMembers.length === 0) {
        throw new Error('Add at least one founding member before saving the About page.');
      }

      setAboutPageProgress(pendingUploadCount > 0 ? 95 : 60);
      setAboutPageProgressLabel('Saving About page content...');

      const payload = {
        intro: aboutPageForm.intro.trim(),
        pageContent: {
          eyebrow: aboutPageForm.eyebrow.trim(),
          title: aboutPageForm.title.trim(),
          teamEyebrow: aboutPageForm.teamEyebrow.trim(),
          teamTitle: aboutPageForm.teamTitle.trim(),
          officeHeading: aboutPageForm.officeHeading.trim(),
          phoneHeading: aboutPageForm.phoneHeading.trim(),
        },
        foundingMembers: nextMembers,
        officeInfo: {
          address: parseMultilineList(aboutPageForm.address),
          phones: parseMultilineList(aboutPageForm.phones),
          mapQuery: aboutPageForm.mapQuery.trim(),
        },
        officeTour: {
          image: officeTourImageUrl,
          title: aboutPageForm.officeTourTitle.trim(),
          subtitle: aboutPageForm.officeTourSubtitle.trim(),
          videoUrl: inferredOfficeTourVideoUrl,
        },
      };

      const savedSection = await saveAboutPageSection(payload);
      const nextMergedContent = getMergedAboutPageContent(
        {
          ...sectionMap,
          aboutPage: savedSection?.content || payload,
        },
        defaultContent
      );

      setAboutPageProgress(100);
      setAboutPageProgressLabel('Completed');
      resetAboutPageEditor(nextMergedContent, { clearProgress: false });
      setMessage('About page updated successfully.');
    } catch (saveError) {
      setAboutPageProgress(0);
      setAboutPageProgressLabel('');
      setError(saveError.message || 'About page could not be saved.');
    } finally {
      setSavingAboutPage(false);
    }
  }

  async function saveFeaturedAlbum(options = {}) {
    const {
      includeGalleryChanges = true,
      requireGallery = true,
      keepEditorOpen = false,
      successMessage,
    } = options;

    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    setSavingAlbums(true);
    setMessage('');
    setError('');

    try {
      const title = featuredAlbumForm.title.trim();
      const slug = featuredAlbumForm.slug.trim();

      if (!title || !slug) {
        throw new Error('Featured album title and slug are required.');
      }

      const pendingUploadCount =
        (featuredAlbumFile ? 1 : 0) +
        (includeGalleryChanges ? featuredAlbumGalleryItems.filter((item) => item.file instanceof File).length : 0);
      let completedUploads = 0;

      const updateUploadProgress = (label, percent = 0) => {
        if (pendingUploadCount === 0) {
          setFeaturedAlbumProgress(25);
          setFeaturedAlbumProgressLabel(label);
          return;
        }

        const totalProgress = Math.min(
          92,
          Math.max(1, Math.round(((completedUploads + percent / 100) / pendingUploadCount) * 92))
        );
        setFeaturedAlbumProgress(totalProgress);
        setFeaturedAlbumProgressLabel(label);
      };

      if (pendingUploadCount > 0) {
        setFeaturedAlbumProgress(1);
        setFeaturedAlbumProgressLabel('Uploading images...');
      } else {
        setFeaturedAlbumProgress(25);
        setFeaturedAlbumProgressLabel('Saving album content...');
      }

      let imageUrl = normalizeSupabaseStorageUrl(featuredAlbumForm.imageUrl.trim());

      if (featuredAlbumFile) {
        const upload = await uploadStorageImage(featuredAlbumFile, session.access_token, 'featured-albums', {
          onProgress: (percent) => {
            updateUploadProgress(`Uploading cover image... ${percent}%`, percent);
          },
        });
        imageUrl = getUploadedStorageUrl(upload);
        completedUploads += 1;
      }

      if (!imageUrl) {
        throw new Error('Please paste an image URL or upload an image file for the featured album.');
      }

      const nextGalleryItems = [];

      if (includeGalleryChanges) {
        for (let index = 0; index < featuredAlbumGalleryItems.length; index += 1) {
          const item = featuredAlbumGalleryItems[index];
          const caption = item.caption.trim();
          const hasInput = Boolean(item.imageUrl.trim() || caption || item.file instanceof File);

          if (!hasInput) {
            continue;
          }

          let galleryImageUrl = normalizeSupabaseStorageUrl(item.imageUrl.trim());

          if (item.file instanceof File) {
            const uploadLabelNumber = completedUploads + 1;
            const upload = await uploadStorageImage(item.file, session.access_token, 'featured-albums-gallery', {
              onProgress: (percent) => {
                updateUploadProgress(
                  `Uploading gallery image ${uploadLabelNumber} of ${pendingUploadCount}... ${percent}%`,
                  percent
                );
              },
            });
            galleryImageUrl = getUploadedStorageUrl(upload);
            completedUploads += 1;
          }

          if (!galleryImageUrl) {
            throw new Error(`Gallery image ${index + 1} needs an image URL or upload.`);
          }

          if (!caption) {
            throw new Error(`Gallery image ${index + 1} needs a caption.`);
          }

          nextGalleryItems.push({
            image: galleryImageUrl,
            caption,
          });
        }
      }

      if (requireGallery && nextGalleryItems.length === 0) {
        throw new Error('Add at least one gallery image with a caption for this featured album.');
      }

      setFeaturedAlbumProgress(pendingUploadCount > 0 ? 95 : 60);
      setFeaturedAlbumProgressLabel('Saving album content...');

      const nextAlbum = {
        title,
        slug,
        heroTitle: featuredAlbumForm.heroTitle.trim() || title,
        heroSubtitle: featuredAlbumForm.heroSubtitle.trim() || '',
        pageCaption: featuredAlbumForm.pageCaption.trim() || '',
        story: featuredAlbumForm.story.trim() || '',
        credit: featuredAlbumForm.credit.trim() || '',
        image: imageUrl,
      };

      const orderedAlbums = featuredAlbums.map((album, index) => ({
        ...album,
        sortOrder: index + 1,
      }));
      const nextSortOrder = Math.max(1, Number(featuredAlbumForm.sortOrder || 1));
      const filteredAlbums = orderedAlbums.filter((album) => album.slug !== editingFeaturedAlbumSlug);

      if (filteredAlbums.some((album) => album.slug === nextAlbum.slug)) {
        throw new Error('This slug is already being used by another featured album.');
      }

      filteredAlbums.splice(nextSortOrder - 1, 0, {
        ...nextAlbum,
        sortOrder: nextSortOrder,
      });

      const nextAlbums = filteredAlbums
        .map((album, index) => ({
          ...album,
          sortOrder: index + 1,
        }))
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map(({ sortOrder, ...album }) => album);

      const nextGalleries = {
        ...albumStoryGalleries,
      };
      const savedGalleryItems = editingFeaturedAlbumSlug ? albumStoryGalleries[editingFeaturedAlbumSlug] || [] : [];

      if (editingFeaturedAlbumSlug && editingFeaturedAlbumSlug !== slug) {
        delete nextGalleries[editingFeaturedAlbumSlug];
      }

      nextGalleries[slug] = includeGalleryChanges
        ? nextGalleryItems
        : editingFeaturedAlbumSlug
          ? savedGalleryItems
          : nextGalleries[slug] || [];

      await Promise.all([
        saveFeaturedAlbums(nextAlbums),
        saveAlbumStoryGalleries(nextGalleries),
      ]);

      setFeaturedAlbumProgress(100);
      setFeaturedAlbumProgressLabel('Completed');

      if (keepEditorOpen) {
        const savedAlbumIndex = nextAlbums.findIndex((album) => album.slug === slug);
        setEditingFeaturedAlbumSlug(slug);
        setFeaturedAlbumFile(null);
        setFeaturedAlbumForm({
          title: nextAlbum.title,
          slug: nextAlbum.slug,
          heroTitle: nextAlbum.heroTitle,
          heroSubtitle: nextAlbum.heroSubtitle,
          pageCaption: nextAlbum.pageCaption,
          story: nextAlbum.story,
          credit: nextAlbum.credit,
          imageUrl: nextAlbum.image,
          sortOrder: String(savedAlbumIndex >= 0 ? savedAlbumIndex + 1 : nextSortOrder),
        });
      } else {
        resetFeaturedAlbumForm(nextAlbums.length, { clearProgress: false });
      }

      setMessage(
        successMessage || (editingFeaturedAlbumSlug ? 'Featured album updated successfully.' : 'Featured album created successfully.')
      );
    } catch (saveError) {
      setFeaturedAlbumProgress(0);
      setFeaturedAlbumProgressLabel('');
      setError(saveError.message || 'Featured album could not be saved.');
    } finally {
      setSavingAlbums(false);
    }
  }

  async function handleSaveFeaturedAlbum(event) {
    event.preventDefault();

    await saveFeaturedAlbum({
      includeGalleryChanges: true,
      requireGallery: true,
      keepEditorOpen: false,
      successMessage: editingFeaturedAlbumSlug
        ? 'Featured album and gallery updated successfully.'
        : 'Featured album and gallery created successfully.',
    });
  }

  async function handleSaveFeaturedAlbumDetails() {
    await saveFeaturedAlbum({
      includeGalleryChanges: false,
      requireGallery: false,
      keepEditorOpen: true,
      successMessage: editingFeaturedAlbumSlug
        ? 'Featured album details saved. Click Add Gallery Image to update the gallery.'
        : 'Featured album saved. Click Add Gallery Image to continue.',
    });
  }

  async function handleDeleteFeaturedAlbum(slug) {
    if (!session?.access_token) return;

    const shouldDelete =
      typeof window === 'undefined' ? true : window.confirm('Do you want to delete this featured album?');

    if (!shouldDelete) return;

    setSavingAlbums(true);
    setFeaturedAlbumProgress(20);
    setFeaturedAlbumProgressLabel('Deleting album...');
    setMessage('');
    setError('');

    try {
      const nextAlbums = featuredAlbums.filter((album) => album.slug !== slug);
      const nextGalleries = {
        ...albumStoryGalleries,
      };
      delete nextGalleries[slug];

      await Promise.all([
        saveFeaturedAlbums(nextAlbums),
        saveAlbumStoryGalleries(nextGalleries),
      ]);

      if (editingFeaturedAlbumSlug === slug) {
        resetFeaturedAlbumForm(nextAlbums.length);
      }

      setFeaturedAlbumProgress(100);
      setFeaturedAlbumProgressLabel('Completed');
      setMessage('Featured album deleted successfully.');
    } catch (deleteError) {
      setFeaturedAlbumProgress(0);
      setFeaturedAlbumProgressLabel('');
      setError(deleteError.message || 'Featured album could not be deleted.');
    } finally {
      setSavingAlbums(false);
    }
  }

  async function handleSaveSection(event) {
    event.preventDefault();

    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    if (!selectedSectionDefinition) {
      setError('Please choose a content section first.');
      return;
    }

    setSavingSection(true);
    setMessage('');
    setError('');

    try {
      const fallbackValue = defaultContent[selectedSectionDefinition.key];
      const parsedContent =
        typeof fallbackValue === 'string' ? sectionEditor : JSON.parse(sectionEditor || 'null');

      const response = await upsertSiteSection(selectedSectionDefinition.key, parsedContent, session.access_token);
      const savedSection = normalizeSectionResponse(response);
      patchSectionItem(savedSection);
      setMessage(`${selectedSectionDefinition.label} updated successfully.`);
    } catch (saveError) {
      setError(saveError.message || 'Content section could not be saved.');
    } finally {
      setSavingSection(false);
    }
  }

  async function handleSaveSiteIdentity(event) {
    event.preventDefault();

    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    setSavingSiteIdentity(true);
    setMessage('');
    setError('');

    try {
      let logoUrl = normalizeSupabaseStorageUrl(siteIdentityForm.logoUrl.trim());

      if (siteIdentityLogoFile instanceof File) {
        const upload = await uploadStorageImage(siteIdentityLogoFile, session.access_token, 'site-identity');
        logoUrl = getUploadedStorageUrl(upload);
      }

      const payload = {
        brand: siteIdentityForm.brand.trim(),
        tagline: siteIdentityForm.tagline.trim(),
        logoUrl,
        email: siteIdentityForm.email.trim(),
        phone: siteIdentityForm.phone.trim(),
        location: siteIdentityForm.location.trim(),
        facebookUrl: siteIdentityForm.facebookUrl.trim(),
        instagramUrl: siteIdentityForm.instagramUrl.trim(),
        youtubeUrl: siteIdentityForm.youtubeUrl.trim(),
      };

      const response = await upsertSiteSection('site', payload, session.access_token);
      const savedSection = normalizeSectionResponse(response);
      patchSectionItem(savedSection);
      setSiteIdentityForm(createSiteIdentityForm(payload));
      setSiteIdentityLogoFile(null);
      setMessage('Site identity updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Site identity could not be saved.');
    } finally {
      setSavingSiteIdentity(false);
    }
  }

  async function handleSaveBookUs(event) {
    event.preventDefault();

    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    setSavingBookUs(true);
    setMessage('');
    setError('');

    try {
      const payload = normalizeBookUsContent({
        heading: bookUsForm.heading,
        subheading: bookUsForm.subheading,
        officeTitle: bookUsForm.officeTitle,
        officeLines: parseMultilineList(bookUsForm.officeLines),
        phoneTitle: bookUsForm.phoneTitle,
        phoneNumber: bookUsForm.phoneNumber,
        emailTitle: bookUsForm.emailTitle,
        emailAddress: bookUsForm.emailAddress,
        whatsappTitle: bookUsForm.whatsappTitle,
        whatsappNumber: bookUsForm.whatsappNumber,
        whatsappLabel: bookUsForm.whatsappLabel,
        whatsappMessage: bookUsForm.whatsappMessage,
      });

      const response = await upsertSiteSection('bookUs', payload, session.access_token);
      const savedSection = normalizeSectionResponse(response);
      patchSectionItem(savedSection);
      setBookUsForm(createBookUsForm(payload));
      setMessage('Book Us updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Book Us could not be saved.');
    } finally {
      setSavingBookUs(false);
    }
  }

  async function handleSaveSampleWorks(nextItems) {
    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    setSavingSampleWorks(true);
    setSampleWorksProgress(1);
    setSampleWorksProgressLabel('Preparing sample works...');
    setMessage('');
    setError('');

    try {
      const sampleWorkItems = Array.isArray(nextItems) ? nextItems : [];
      const pendingUploadCount = sampleWorkItems.filter((item) => item?.file instanceof File).length;
      let completedUploads = 0;

      const updateUploadProgress = (label, percent = 0) => {
        if (pendingUploadCount === 0) {
          setSampleWorksProgress(25);
          setSampleWorksProgressLabel(label);
          return;
        }

        const totalProgress = Math.min(
          92,
          Math.max(1, Math.round(((completedUploads + percent / 100) / pendingUploadCount) * 92))
        );
        setSampleWorksProgress(totalProgress);
        setSampleWorksProgressLabel(label);
      };

      if (pendingUploadCount > 0) {
        setSampleWorksProgress(1);
        setSampleWorksProgressLabel('Uploading sample work images...');
      }

      const uploadedItems = [];

      for (let index = 0; index < sampleWorkItems.length; index += 1) {
        const item = sampleWorkItems[index];
        let imageUrl =
          typeof item?.image === 'string' ? normalizeSupabaseStorageUrl(item.image.trim()) : '';

        if (item?.file instanceof File) {
          const uploadLabelNumber = completedUploads + 1;
          const upload = await uploadStorageImage(item.file, session.access_token, 'sample-works', {
            onProgress: (percent) => {
              updateUploadProgress(
                `Uploading sample work image ${uploadLabelNumber} of ${pendingUploadCount}... ${percent}%`,
                percent
              );
            },
          });
          imageUrl = getUploadedStorageUrl(upload);
          completedUploads += 1;
        }

        uploadedItems.push({
          title: typeof item?.title === 'string' ? item.title.trim() : '',
          category: typeof item?.category === 'string' ? item.category.trim() : '',
          image: imageUrl,
        });
      }

      const normalizedItems = normalizeSampleWorks(uploadedItems);
      setSampleWorksProgress(pendingUploadCount > 0 ? 95 : 60);
      setSampleWorksProgressLabel('Saving sample works...');
      const response = await upsertSiteSection('sampleWorks', normalizedItems, session.access_token);
      const savedSection = normalizeSectionResponse(response);
      patchSectionItem(savedSection);
      setSampleWorksProgress(100);
      setSampleWorksProgressLabel('Completed');
      setMessage('Sample works updated successfully.');
    } catch (saveError) {
      setSampleWorksProgress(0);
      setSampleWorksProgressLabel('');
      setError(saveError.message || 'Sample works could not be saved.');
    } finally {
      setSavingSampleWorks(false);
    }
  }

  async function handleSavePackageSections(nextSections) {
    if (!session?.access_token) {
      setError('Please login first.');
      return;
    }

    setSavingPackageSections(true);
    setMessage('');
    setError('');

    try {
      const nextCatalog = await Promise.all(
        (nextSections?.packageCatalog || []).map(async (category) => {
          let imageUrl =
            typeof category?.image === 'string' ? normalizeSupabaseStorageUrl(category.image) : '';

          if (category?.file instanceof File) {
            const upload = await uploadStorageImage(category.file, session.access_token, 'package-showcase');
            imageUrl = getUploadedStorageUrl(upload);
          }

          return {
            slug: typeof category?.slug === 'string' ? category.slug : '',
            name: typeof category?.name === 'string' ? category.name : '',
            description: typeof category?.description === 'string' ? category.description : '',
            image: imageUrl,
            items: normalizePackageCards(category?.items),
          };
        })
      );
      const normalizedCatalog = normalizePackageCatalog(nextCatalog, defaultContent.packageCatalog);
      const response = await upsertSiteSection(PACKAGE_CATALOG_SECTION.key, normalizedCatalog, session.access_token);
      const savedSection = normalizeSectionResponse(response);

      if (savedSection) {
        patchSectionItem(savedSection);
      }

      setMessage('Package content updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Package content could not be saved.');
    } finally {
      setSavingPackageSections(false);
    }
  }

  if (!configured) {
    return (
      <section className="bg-stone-50 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-500">Admin Setup</p>
          <h1 className="mt-4 text-3xl font-semibold text-stone-950 md:text-4xl">Supabase is not configured yet</h1>
          <p className="mt-5 text-base leading-8 text-stone-700">
            Add the environment variables below, then restart the dev server. After that, this page will become your
            full website content management panel.
          </p>
          <div className="mt-8 rounded-3xl bg-stone-950 p-6 text-sm text-stone-100">
            <p>NEXT_PUBLIC_SUPABASE_URL</p>
            <p className="mt-2">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
            <p className="mt-2">NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=site-assets</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Back to Home
          </button>
        </div>
      </section>
    );
  }

  if (booting) {
    return (
      <section className="bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-stone-200 bg-stone-50 p-10 text-center text-stone-600">
          Checking your saved admin session...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-stone-50 px-6 pt-4 pb-10 md:pt-6 md:pb-12">
      <div className="mx-auto max-w-6xl">
        {session && (
          <div className="flex flex-col gap-5 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between md:p-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Website Admin</p>
              <h1 className="mt-2.5 text-xl font-semibold leading-tight text-stone-950 md:text-[2.4rem]">
                Manage slider and all site sections
              </h1>
            </div>

            <div className="flex flex-wrap gap-3 md:self-start">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full border border-stone-300 px-4 py-2.5 text-[11px] font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
              >
                View Home
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-[11px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut && <Spinner className="size-4 text-white" />}
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!session ? (
          <div className="mx-auto mt-8 max-w-xl">
            <form onSubmit={handleLogin} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-stone-950">Admin login</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Use a Supabase Auth email and password. Create the first admin user from the Supabase dashboard.
              </p>

              <label className="mt-8 block text-sm font-medium text-stone-700">
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  placeholder="admin@example.com"
                  required
                />
              </label>

              <label className="mt-5 block text-sm font-medium text-stone-700">
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  placeholder="Your secure password"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Spinner className="size-4 text-white" />}
                {saving ? 'Signing in...' : 'Login to Admin'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-8 xl:grid-cols-[320px_1fr] xl:items-start">
              <aside className="space-y-6 xl:sticky xl:top-28">
                <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="flex flex-col gap-3">
                    <p className="text-sm uppercase tracking-[0.35em] text-stone-500">Admin Sidebar</p>
                    <h2 className="text-2xl font-semibold text-stone-950">Sections</h2>
                    <p className="text-sm leading-7 text-stone-600">
                      Select any workspace to jump directly into that part of the admin panel.
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    {adminWorkspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => setActiveAdminSection(workspace.id)}
                        className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                          activeAdminSection === workspace.id
                            ? 'border-stone-900 bg-stone-900 text-white shadow-[0_10px_30px_rgba(28,25,23,0.14)]'
                            : 'border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400 hover:bg-white'
                        }`}
                      >
                        <p className="text-base font-semibold">{workspace.label}</p>
                        <p
                          className={`mt-2 text-sm leading-6 ${
                            activeAdminSection === workspace.id ? 'text-white/80' : 'text-stone-600'
                          }`}
                        >
                          {workspace.description}
                        </p>
                        <p
                          className={`mt-3 text-xs font-semibold uppercase tracking-[0.25em] ${
                            activeAdminSection === workspace.id ? 'text-white/75' : 'text-stone-500'
                          }`}
                        >
                          {workspace.statusLabel}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-stone-500">Content Records</p>
                      <h3 className="mt-3 text-xl font-semibold text-stone-950">Raw Sections</h3>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        These records open the advanced editor directly from the sidebar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadSections(session.access_token)}
                      className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingSections ? (
                    <div className="mt-6 rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                      Loading content sections...
                    </div>
                  ) : contentSections.length === 0 ? (
                    <div className="mt-6 rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                      No content sections configured yet.
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {contentSections.map((section) => {
                        const hasCustomValue = getSectionHasCustomValue(section.key);
                        const isActiveRawSection =
                          activeAdminSection === 'content' && selectedSectionKey === section.key;

                        return (
                          <button
                            key={section.key}
                            type="button"
                            onClick={() => {
                              setActiveAdminSection('content');
                              setSelectedSectionKey(section.key);
                            }}
                            className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                              isActiveRawSection
                                ? 'border-stone-900 bg-stone-900 text-white shadow-[0_10px_30px_rgba(28,25,23,0.14)]'
                                : 'border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400 hover:bg-white'
                            }`}
                          >
                            <p className="text-base font-semibold">{section.label}</p>
                            <p
                              className={`mt-2 text-sm leading-6 ${
                                isActiveRawSection ? 'text-white/80' : 'text-stone-600'
                              }`}
                            >
                              {section.description}
                            </p>
                            <p
                              className={`mt-3 text-xs font-semibold uppercase tracking-[0.25em] ${
                                isActiveRawSection ? 'text-white/75' : 'text-stone-500'
                              }`}
                            >
                              {hasCustomValue ? 'Saved in Supabase' : 'Using fallback data'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              <div>
                <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Workspace Overview</p>
                      <h2 className="mt-2 text-xl font-semibold text-stone-950">{activeWorkspace.label}</h2>
                      <p className="mt-1.5 max-w-3xl text-xs leading-6 text-stone-600">{activeWorkspace.description}</p>
                      {activeAdminSection === 'content' && selectedSectionDefinition && (
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                          Editing raw section: {selectedSectionDefinition.label}
                        </p>
                      )}
                    </div>
                    <div className="rounded-full bg-stone-100 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-700">
                      {activeWorkspace.statusLabel}
                    </div>
                  </div>
                </div>

                <div className={`mt-8 ${activeAdminSection === 'slider' ? 'block' : 'hidden'}`}>
              <div className="grid items-start gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <form ref={sliderEditorRef} onSubmit={handleSaveSlide} className="self-start rounded-[2rem] border border-stone-200 bg-white px-6 pb-14 pt-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[1.7rem] font-semibold text-stone-950">
                      {editingId ? 'Edit slide' : 'Create a new slide'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Upload a file to Supabase Storage, or paste a direct image URL.
                    </p>
                  </div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

                <label className="mt-5 block text-sm font-medium text-stone-700">
                  Slide title
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Optional title for your own tracking"
                  />
                </label>

                <label className="mt-3.5 block text-sm font-medium text-stone-700">
                  Image URL
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Paste image URL"
                  />
                </label>

                <label className="mt-3.5 block text-sm font-medium text-stone-700">
                  Or upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-600"
                  />
                </label>

                <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Sort order
                    <input
                      type="number"
                      min="1"
                      value={form.sortOrder}
                      onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm outline-none transition focus:border-stone-500"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 sm:mt-5">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                      className="h-4 w-4 rounded border-stone-300"
                    />
                    Show this slide on homepage
                  </label>
                </div>

                {(previewUrl || form.imageUrl) && (
                  <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-50">
                    <img
                      src={normalizeSupabaseStorageUrl(previewUrl || form.imageUrl)}
                      alt="Slide preview"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-5 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Slide' : 'Save Slide'}
                </button>
              </form>

              <div
                className="self-start flex flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
                style={
                  sliderItemsCardHeight
                    ? {
                        height: sliderItemsCardHeight,
                        minHeight: sliderItemsCardHeight,
                        maxHeight: sliderItemsCardHeight,
                      }
                    : undefined
                }
              >
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-950">All slider items</h2>
                    <p className="mt-1.5 text-sm leading-6 text-stone-600">
                      These records are loaded from the <span className="font-semibold text-stone-900">hero_slides</span>{' '}
                      table.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadSlides(session.access_token)}
                    className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                  >
                    Refresh
                  </button>
                </div>

                <div
                  ref={sliderItemsScrollerRef}
                  className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 snap-y snap-mandatory scroll-smooth"
                >
                  {loadingSlides ? (
                    <div className="rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">Loading slides...</div>
                  ) : slides.length === 0 ? (
                    <div className="rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                      No slides found yet. Create your first one from the form.
                    </div>
                  ) : (
                    <div className="space-y-5 pb-1">
                      {slides.map((slide) => (
                        <article
                          key={slide._adminKey}
                          className="snap-start overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-50"
                          style={
                            sliderItemsViewportHeight
                              ? { minHeight: Math.max(320, sliderItemsViewportHeight - 16) }
                              : undefined
                          }
                        >
                          <div className="flex h-full flex-col">
                            <div className="flex h-44 items-center justify-center bg-white p-2.5 md:h-40">
                              <img
                                src={normalizeSupabaseStorageUrl(slide.image_url)}
                                alt={slide.title || 'Hero slide'}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="border-t border-stone-200 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-stone-950">{slide.title || 'Untitled slide'}</p>
                                  <p className="mt-1.5 break-all text-xs leading-5 text-stone-600">
                                    {normalizeSupabaseStorageUrl(slide.image_url)}
                                  </p>
                                </div>
                                <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                                  {slide.is_active ? 'Active' : 'Hidden'}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-stone-600">
                                <span className="rounded-full bg-white px-3 py-1.5">Order: {slide.sort_order ?? 1}</span>
                                <span className="rounded-full bg-white px-3 py-1.5">
                                  ID: {slide.id || 'Imported row without UUID'}
                                </span>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => startEditing(slide)}
                                  className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSlide(slide)}
                                  className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>

            <div className={`mt-8 ${activeAdminSection === 'albums' ? 'block' : 'hidden'}`}>
              <div className="grid items-start gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <form ref={featuredAlbumEditorRef} onSubmit={handleSaveFeaturedAlbum} className="self-start rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[1.7rem] font-semibold text-stone-950">
                      {editingFeaturedAlbumSlug ? 'Edit featured album' : 'Create featured album'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      Upload the album cover image, then manage the title, page caption, story, and gallery captions from one place.
                    </p>
                  </div>
                  {editingFeaturedAlbumSlug && (
                    <button
                      type="button"
                      onClick={() => resetFeaturedAlbumForm()}
                      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

                <label className="mt-8 block text-sm font-medium text-stone-700">
                  Choose featured album
                  <select
                    value={selectedFeaturedAlbumValue}
                    onChange={(event) => handleFeaturedAlbumSelection(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                  >
                    <option value={NEW_FEATURED_ALBUM_OPTION}>Create new featured album</option>
                    {featuredAlbums.map((album) => (
                      <option key={album.slug} value={album.slug}>
                        {album.title || album.slug} {album.slug ? `(${`/sample-works/${album.slug}`})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Album title
                    <input
                      type="text"
                      value={featuredAlbumForm.title}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, title: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="Monsoon Wedding Story"
                      required
                    />
                  </label>

                  <label className="block text-sm font-medium text-stone-700">
                    Slug
                    <input
                      type="text"
                      value={featuredAlbumForm.slug}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, slug: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="monsoon-wedding-story"
                      required
                    />
                  </label>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Hero title
                    <input
                      type="text"
                      value={featuredAlbumForm.heroTitle}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, heroTitle: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="Monsoon Wedding Story"
                    />
                  </label>

                  <label className="block text-sm font-medium text-stone-700">
                    Hero subtitle
                    <input
                      type="text"
                      value={featuredAlbumForm.heroSubtitle}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, heroSubtitle: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="CAPTURE MEMORIES ALBUM STORY"
                    />
                  </label>
                </div>

                <label className="mt-5 block text-sm font-medium text-stone-700">
                  Page caption
                  <textarea
                    value={featuredAlbumForm.pageCaption}
                    onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, pageCaption: event.target.value }))}
                    className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Write the elegant caption that will appear on the album detail page..."
                  />
                  <p className="mt-2 text-xs leading-6 text-stone-500">
                    This stays dynamic and can be updated anytime from the admin panel.
                  </p>
                </label>

                <label className="mt-5 block text-sm font-medium text-stone-700">
                  Story
                  <textarea
                    value={featuredAlbumForm.story}
                    onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, story: event.target.value }))}
                    className="mt-2 min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Write the featured album story..."
                  />
                </label>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Credit line
                    <input
                      type="text"
                      value={featuredAlbumForm.credit}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, credit: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="© Your Brand / 2026"
                    />
                  </label>

                  <label className="block text-sm font-medium text-stone-700">
                    Sort order
                    <input
                      type="number"
                      min="1"
                      value={featuredAlbumForm.sortOrder}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, sortOrder: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    />
                  </label>
                </div>

                <label className="mt-5 block text-sm font-medium text-stone-700">
                  Image URL
                  <input
                    type="url"
                    value={featuredAlbumForm.imageUrl}
                    onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, imageUrl: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Paste image URL"
                  />
                </label>

                <label className="mt-5 block text-sm font-medium text-stone-700">
                  Or upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setFeaturedAlbumFile(event.target.files?.[0] || null)}
                    className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
                  />
                </label>

                {(featuredAlbumPreviewUrl || featuredAlbumForm.imageUrl) && (
                  <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-50">
                    <img
                      src={normalizeSupabaseStorageUrl(featuredAlbumPreviewUrl || featuredAlbumForm.imageUrl)}
                      alt="Featured album preview"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveFeaturedAlbumDetails}
                    disabled={savingAlbums}
                    className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAlbums
                      ? 'Saving album...'
                      : editingFeaturedAlbumSlug
                        ? 'Save Album Details'
                        : 'Save Featured Album'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeaturedAlbumGalleryEditor((current) => !current)}
                    className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                  >
                    {showFeaturedAlbumGalleryEditor ? 'Hide Gallery Image' : 'Add Gallery Image'}
                  </button>
                </div>

                {showFeaturedAlbumGalleryEditor && (
                  <>
                    <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-stone-950">Album gallery for {featuredAlbumTargetName}</h3>
                          <p className="mt-2 text-sm leading-7 text-stone-600">
                            These images and captions will show on the featured album detail page in the same order.
                          </p>
                          <p className="mt-2 text-sm font-medium text-stone-700">
                            {featuredAlbumTargetPath ? `Target page: ${featuredAlbumTargetPath}` : 'Target page will appear after you set the slug.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addFeaturedAlbumGalleryItem}
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                        >
                          Add gallery image
                        </button>
                      </div>

                      <div className="mt-6 space-y-4">
                        {featuredAlbumGalleryItems.map((item, index) => (
                          <div key={item.id} className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
                                Gallery Image {index + 1}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveFeaturedAlbumGalleryItem(index, -1)}
                                  disabled={index === 0}
                                  className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Move up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveFeaturedAlbumGalleryItem(index, 1)}
                                  disabled={index === featuredAlbumGalleryItems.length - 1}
                                  className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Move down
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFeaturedAlbumGalleryItem(item.id)}
                                  className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <label className="mt-5 block text-sm font-medium text-stone-700">
                              Caption
                              <textarea
                                value={item.caption}
                                onChange={(event) => updateFeaturedAlbumGalleryItem(item.id, { caption: event.target.value })}
                                className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                placeholder="Write the caption that will appear under this photo..."
                              />
                            </label>

                            <label className="mt-5 block text-sm font-medium text-stone-700">
                              Image URL
                              <input
                                type="url"
                                value={item.imageUrl}
                                onChange={(event) => updateFeaturedAlbumGalleryItem(item.id, { imageUrl: event.target.value })}
                                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                                placeholder="Paste image URL"
                              />
                            </label>

                            <label className="mt-5 block text-sm font-medium text-stone-700">
                              Or upload image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => updateFeaturedAlbumGalleryItem(item.id, { file: event.target.files?.[0] || null })}
                                className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
                              />
                            </label>

                            {item.file && (
                              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                                Selected file: <span className="font-medium text-stone-900">{item.file.name}</span>
                              </div>
                            )}

                            {item.imageUrl && (
                              <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-50">
                                <img
                                  src={normalizeSupabaseStorageUrl(item.imageUrl)}
                                  alt={item.caption || `Gallery image ${index + 1}`}
                                  className="h-52 w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(savingAlbums || featuredAlbumProgress > 0) && (
                  <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-stone-700">
                        {featuredAlbumProgressLabel || 'Uploading image...'}
                      </p>
                      <p className="text-sm font-semibold text-stone-900">{featuredAlbumProgress}%</p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-stone-900 transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, featuredAlbumProgress))}%` }}
                      />
                    </div>
                  </div>
                )}

                {showFeaturedAlbumGalleryEditor && (
                  <button
                    type="submit"
                    disabled={savingAlbums}
                    className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAlbums
                      ? 'Saving album...'
                      : editingFeaturedAlbumSlug
                        ? 'Update Album & Gallery'
                        : 'Save Album & Gallery'}
                  </button>
                )}
              </form>

              <div
                className="self-start flex flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm"
                style={
                  featuredAlbumsCardHeight
                    ? {
                        height: featuredAlbumsCardHeight,
                        minHeight: featuredAlbumsCardHeight,
                        maxHeight: featuredAlbumsCardHeight,
                      }
                    : undefined
                }
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[1.7rem] font-semibold text-stone-950">Featured albums</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadSections(session.access_token)}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                  >
                    Refresh
                  </button>
                </div>

                <div ref={featuredAlbumsScrollerRef} className="mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
                  {loadingSections ? (
                    <div className="rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                      Loading featured albums...
                    </div>
                  ) : featuredAlbums.length === 0 ? (
                    <div className="rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                      No featured albums found yet. Create your first one from the form.
                    </div>
                  ) : (
                    <div className="space-y-5 pb-1">
                      {featuredAlbums.map((album, index) => {
                        const galleryItems = albumStoryGalleries[album.slug] || [];
                        const isEditingAlbum = editingFeaturedAlbumSlug === album.slug;
                        const albumImage = normalizeSupabaseStorageUrl(album.image);

                        return (
                          <article
                            key={album.slug || `${album.title}-${index}`}
                            className={`overflow-hidden rounded-[1.5rem] border bg-stone-50 ${
                              isEditingAlbum ? 'border-stone-900 shadow-[0_0_0_1px_rgba(28,25,23,0.12)]' : 'border-stone-200'
                            }`}
                          >
                            <div className="overflow-hidden border-b border-stone-200 bg-white/70">
                              <img
                                src={albumImage}
                                alt={album.title || 'Featured album'}
                                className="h-44 w-full object-cover"
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-base font-semibold text-stone-950">{album.title || 'Untitled album'}</p>
                                </div>
                                <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600">
                                  Order {index + 1}
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                                <span className="rounded-full bg-white px-3 py-1.5">Gallery: {galleryItems.length}</span>
                                {album.credit && <span className="rounded-full bg-white px-3 py-1.5">Credit: {album.credit}</span>}
                                {isEditingAlbum && (
                                  <span className="rounded-full bg-stone-900 px-3 py-1.5 font-semibold uppercase tracking-[0.18em] text-white">
                                    Open in editor
                                  </span>
                                )}
                              </div>

                              {album.pageCaption && (
                                <p className="mt-3 line-clamp-2 rounded-[1.1rem] border border-stone-200 bg-white px-3.5 py-2.5 text-sm italic leading-6 text-stone-700">
                                  {album.pageCaption}
                                </p>
                              )}

                              <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-700">
                                {album.story || 'No story added yet for this album.'}
                              </p>

                              <div className="mt-4 rounded-[1.1rem] border border-stone-200 bg-white p-3.5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-stone-950">Current gallery preview</p>
                                  <button
                                    type="button"
                                    onClick={() => startEditingFeaturedAlbum(album, index)}
                                    className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                                  >
                                    {isEditingAlbum ? 'Gallery loaded' : 'Load in editor'}
                                  </button>
                                </div>

                                {galleryItems.length > 0 ? (
                                  <div className="mt-3 overflow-x-auto pb-2">
                                    <div className="flex min-w-max gap-2.5">
                                      {galleryItems.map((item, galleryIndex) => (
                                        <figure
                                          key={`${album.slug}-${galleryIndex}`}
                                          className="w-32 shrink-0 overflow-hidden rounded-[1rem] border border-stone-200 bg-stone-50"
                                        >
                                          <img
                                            src={normalizeSupabaseStorageUrl(item.image)}
                                            alt={item.caption || `${album.title} gallery image ${galleryIndex + 1}`}
                                            className="h-24 w-full object-cover"
                                          />
                                          <figcaption className="p-2.5 text-xs leading-5 text-stone-700">
                                            <p className="font-semibold uppercase tracking-[0.2em] text-stone-500">
                                              Image {galleryIndex + 1}
                                            </p>
                                            <p className="mt-1.5 line-clamp-2">{item.caption || 'No caption added yet.'}</p>
                                          </figcaption>
                                        </figure>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 rounded-[1rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                                    No gallery images have been saved for this album yet.
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => startEditingFeaturedAlbum(album, index)}
                                  className="rounded-full bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
                                >
                                  Edit Album & Gallery
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeaturedAlbum(album.slug)}
                                  className="rounded-full border border-rose-300 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>

            <div className={activeAdminSection === 'about' ? 'block' : 'hidden'}>
              <AboutPageAdminPanel
                form={aboutPageForm}
                members={aboutPageMembers}
                statusLabel={aboutPageStatusLabel}
                saving={savingAboutPage}
                progress={aboutPageProgress}
                progressLabel={aboutPageProgressLabel}
                officeImagePreviewUrl={aboutPageOfficeImagePreviewUrl}
                onFormChange={setAboutPageForm}
                onSave={handleSaveAboutPage}
                onReset={() => resetAboutPageEditor()}
                onRefresh={() => loadSections(session.access_token)}
                onAddMember={addAboutPageMember}
                onUpdateMember={updateAboutPageMember}
                onMoveMember={moveAboutPageMember}
                onRemoveMember={removeAboutPageMember}
                onOfficeImageFileChange={setAboutPageOfficeImageFile}
              />
            </div>

            <div className={activeAdminSection === 'site' ? 'block' : 'hidden'}>
              <SiteIdentityAdminPanel
                form={siteIdentityForm}
                hasCustomValue={hasSiteCustomValue}
                saving={savingSiteIdentity}
                logoPreviewUrl={siteIdentityLogoPreviewUrl}
                onFormChange={setSiteIdentityForm}
                onSave={handleSaveSiteIdentity}
                onReset={() => {
                  setSiteIdentityForm(createSiteIdentityForm(siteIdentityContent));
                  setSiteIdentityLogoFile(null);
                }}
                onRefresh={() => loadSections(session.access_token)}
                onLogoFileChange={setSiteIdentityLogoFile}
              />
            </div>

            <div className={activeAdminSection === 'bookUs' ? 'block' : 'hidden'}>
              <BookUsAdminPanel
                form={bookUsForm}
                hasCustomValue={hasBookUsCustomValue}
                saving={savingBookUs}
                whatsappLink={createWhatsAppLink(bookUsForm)}
                onFormChange={setBookUsForm}
                onSave={handleSaveBookUs}
                onReset={() => setBookUsForm(createBookUsForm(bookUsContent))}
                onRefresh={() => loadSections(session.access_token)}
              />
            </div>

            <div className={activeAdminSection === 'sampleWorks' ? 'block' : 'hidden'}>
              <SampleWorksAdminPanel
                items={sampleWorksItems}
                hasCustomValue={hasSampleWorksCustomValue}
                saving={savingSampleWorks}
                progress={sampleWorksProgress}
                progressLabel={sampleWorksProgressLabel}
                onRefresh={() => loadSections(session.access_token)}
                onSave={handleSaveSampleWorks}
              />
            </div>

            <div className={activeAdminSection === 'packages' ? 'block' : 'hidden'}>
              <PackagesAdminPanel
                catalogSection={packageCatalogSection}
                saving={savingPackageSections}
                onRefresh={() => loadSections(session.access_token)}
                onSave={handleSavePackageSections}
              />
            </div>

                <div className={`mt-8 ${activeAdminSection === 'content' ? 'block' : 'hidden'}`}>
              <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
              <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-950">Content sections</h2>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      These records are loaded from the <span className="font-semibold text-stone-900">site_sections</span>{' '}
                      table.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadSections(session.access_token)}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                  >
                    Refresh
                  </button>
                </div>

                {loadingSections ? (
                  <div className="mt-8 rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                    Loading content sections...
                  </div>
                ) : (
                  <div className="mt-8 space-y-3">
                    {contentSections.map((section) => {
                      const hasCustomValue = getSectionHasCustomValue(section.key);

                      return (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => setSelectedSectionKey(section.key)}
                          className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                            selectedSectionKey === section.key
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400'
                          }`}
                        >
                          <p className="text-base font-semibold">{section.label}</p>
                          <p
                            className={`mt-2 text-sm leading-6 ${
                              selectedSectionKey === section.key ? 'text-white/80' : 'text-stone-600'
                            }`}
                          >
                            {section.description}
                          </p>
                          <p
                            className={`mt-3 text-xs font-semibold uppercase tracking-[0.25em] ${
                              selectedSectionKey === section.key ? 'text-white/75' : 'text-stone-500'
                            }`}
                          >
                            {hasCustomValue ? 'Saved in Supabase' : 'Using fallback data'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveSection} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                {selectedSectionDefinition ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-stone-950">{selectedSectionDefinition.label}</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-600">
                          {selectedSectionDefinition.description}
                        </p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                          Key: {selectedSectionDefinition.key}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={resetSectionEditor}
                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                      >
                        Reset editor
                      </button>
                    </div>

                    <div className="mt-8 rounded-[1.5rem] bg-stone-50 p-5 text-sm leading-7 text-stone-600">
                      {typeof selectedFallbackValue === 'string'
                        ? 'This section is plain text. Edit the text below and save.'
                        : 'This section uses JSON. Keep valid JSON format when editing arrays or objects.'}
                    </div>

                    <label className="mt-6 block text-sm font-medium text-stone-700">
                      {typeof selectedFallbackValue === 'string' ? 'Section text' : 'Section JSON'}
                      <textarea
                        value={sectionEditor}
                        onChange={(event) => setSectionEditor(event.target.value)}
                        className="mt-2 min-h-[420px] w-full rounded-[1.5rem] border border-stone-300 px-4 py-4 font-mono text-sm outline-none transition focus:border-stone-500"
                        spellCheck={false}
                      />
                    </label>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={savingSection}
                        className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingSection ? 'Saving section...' : 'Save Section'}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadSections(session.access_token)}
                        className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                      >
                        Reload from Supabase
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                    No section definition found.
                  </div>
                )}
              </form>
              </div>
            </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
