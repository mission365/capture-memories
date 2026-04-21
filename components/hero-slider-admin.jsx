'use client';

import { useEffect, useState } from 'react';
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
import { normalizePackageCards, normalizePackageShowcase } from '@/lib/package-content';
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
    story: '',
    credit: '',
    imageUrl: '',
    sortOrder: '1',
  };
}

const NEW_FEATURED_ALBUM_OPTION = '__new__';
const PACKAGE_SECTION_DEFINITIONS = [
  { key: 'packageShowcase', label: 'Package Showcase', description: 'Main packages page category cards and titles.' },
  { key: 'sonatonPackages', label: 'Sonaton Packages', description: 'All cards shown on the Sonaton package page.' },
  { key: 'muslimPackages', label: 'Muslim Packages', description: 'All cards shown on the Muslim package page.' },
];
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

function createSectionMap(items = []) {
  return items.reduce((accumulator, item) => {
    if (item?.section_key) {
      accumulator[item.section_key] = item.content;
    }

    return accumulator;
  }, {});
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
    imageUrl: readInputText(member?.image),
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
    officeTourImageUrl: readInputText(officeTour.image),
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
    logoUrl: readInputText(content?.logoUrl),
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
  const [selectedSectionKey, setSelectedSectionKey] = useState(contentSections[0]?.key || '');
  const [sectionEditor, setSectionEditor] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const supabaseConfig = getSupabaseConfig();
  const configured = isSupabaseConfigured();
  const sectionMap = createSectionMap(sectionItems);
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
  const packageSections = PACKAGE_SECTION_DEFINITIONS.map((section) => {
    const hasCustomValue = Object.prototype.hasOwnProperty.call(sectionMap, section.key);
    const rawValue = hasCustomValue ? sectionMap[section.key] : defaultContent[section.key];
    const currentValue =
      section.key === 'packageShowcase' ? normalizePackageShowcase(rawValue) : normalizePackageCards(rawValue);

    return {
      ...section,
      currentValue,
      hasCustomValue,
    };
  });
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
      statusLabel: `${packageSections.length} package groups`,
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

  async function loadSlides(accessToken) {
    setLoadingSlides(true);
    setError('');

    try {
      const items = await listHeroSlides({
        includeInactive: true,
        accessToken,
      });
      const nextSlides = Array.isArray(items) ? items : [];
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
      const nextItems = Array.isArray(items) ? items : [];
      setSectionItems(nextItems);
      resetAboutPageEditor(getMergedAboutPageContent(createSectionMap(nextItems), defaultContent));
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
    setSelectedFile(null);
    setForm({
      title: '',
      imageUrl: '',
      sortOrder: String((nextCount || 0) + 1),
      isActive: true,
    });
  }

  function startEditing(slide) {
    setEditingId(slide.id);
    setSelectedFile(null);
    setMessage('');
    setError('');
    setForm({
      title: slide.title || '',
      imageUrl: slide.image_url || '',
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
      let imageUrl = form.imageUrl.trim();

      if (selectedFile) {
        const upload = await uploadHeroSlideImage(selectedFile, session.access_token);
        imageUrl = upload.publicUrl;
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

      if (editingId) {
        await updateHeroSlide(editingId, payload, session.access_token);
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

  async function handleDeleteSlide(slideId) {
    if (!session?.access_token) return;

    const shouldDelete =
      typeof window === 'undefined' ? true : window.confirm('Do you want to delete this slide?');

    if (!shouldDelete) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      await deleteHeroSlide(slideId, session.access_token);
      const nextSlides = await loadSlides(session.access_token);

      if (editingId === slideId) {
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
    if (options.clearProgress !== false) {
      setFeaturedAlbumProgress(0);
      setFeaturedAlbumProgressLabel('');
    }
    setFeaturedAlbumForm({
      title: '',
      slug: '',
      heroTitle: '',
      heroSubtitle: '',
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
    setFeaturedAlbumProgress(0);
    setFeaturedAlbumProgressLabel('');
    setMessage('');
    setError('');
    setFeaturedAlbumForm({
      title: album.title || '',
      slug: album.slug || '',
      heroTitle: album.heroTitle || '',
      heroSubtitle: album.heroSubtitle || '',
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
        looksLikeYouTubeUrl(rawOfficeTourImageUrl) && !rawOfficeTourVideoUrl ? '' : rawOfficeTourImageUrl;

      if (aboutPageOfficeImageFile) {
        const upload = await uploadStorageImage(aboutPageOfficeImageFile, session.access_token, 'about-page', {
          onProgress: (percent) => {
            updateUploadProgress(`Uploading office image... ${percent}%`, percent);
          },
        });
        officeTourImageUrl = upload.publicUrl;
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

        let imageUrl = member.imageUrl.trim();

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
          imageUrl = upload.publicUrl;
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

  async function handleSaveFeaturedAlbum(event) {
    event.preventDefault();

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
        (featuredAlbumFile ? 1 : 0) + featuredAlbumGalleryItems.filter((item) => item.file instanceof File).length;
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

      let imageUrl = featuredAlbumForm.imageUrl.trim();

      if (featuredAlbumFile) {
        const upload = await uploadStorageImage(featuredAlbumFile, session.access_token, 'featured-albums', {
          onProgress: (percent) => {
            updateUploadProgress(`Uploading cover image... ${percent}%`, percent);
          },
        });
        imageUrl = upload.publicUrl;
        completedUploads += 1;
      }

      if (!imageUrl) {
        throw new Error('Please paste an image URL or upload an image file for the featured album.');
      }

      const nextGalleryItems = [];

      for (let index = 0; index < featuredAlbumGalleryItems.length; index += 1) {
        const item = featuredAlbumGalleryItems[index];
        const caption = item.caption.trim();
        const hasInput = Boolean(item.imageUrl.trim() || caption || item.file instanceof File);

        if (!hasInput) {
          continue;
        }

        let galleryImageUrl = item.imageUrl.trim();

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
          galleryImageUrl = upload.publicUrl;
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

      if (nextGalleryItems.length === 0) {
        throw new Error('Add at least one gallery image with a caption for this featured album.');
      }

      setFeaturedAlbumProgress(pendingUploadCount > 0 ? 95 : 60);
      setFeaturedAlbumProgressLabel('Saving album content...');

      const nextAlbum = {
        title,
        slug,
        heroTitle: featuredAlbumForm.heroTitle.trim() || title,
        heroSubtitle: featuredAlbumForm.heroSubtitle.trim() || '',
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

      if (editingFeaturedAlbumSlug && editingFeaturedAlbumSlug !== slug) {
        delete nextGalleries[editingFeaturedAlbumSlug];
      }

      nextGalleries[slug] = nextGalleryItems;

      await Promise.all([
        saveFeaturedAlbums(nextAlbums),
        saveAlbumStoryGalleries(nextGalleries),
      ]);

      setFeaturedAlbumProgress(100);
      setFeaturedAlbumProgressLabel('Completed');
      resetFeaturedAlbumForm(nextAlbums.length, { clearProgress: false });
      setMessage(editingFeaturedAlbumSlug ? 'Featured album updated successfully.' : 'Featured album created successfully.');
    } catch (saveError) {
      setFeaturedAlbumProgress(0);
      setFeaturedAlbumProgressLabel('');
      setError(saveError.message || 'Featured album could not be saved.');
    } finally {
      setSavingAlbums(false);
    }
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
      let logoUrl = siteIdentityForm.logoUrl.trim();

      if (siteIdentityLogoFile instanceof File) {
        const upload = await uploadStorageImage(siteIdentityLogoFile, session.access_token, 'site-identity');
        logoUrl = upload.publicUrl;
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
        let imageUrl = typeof item?.image === 'string' ? item.image.trim() : '';

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
          imageUrl = upload.publicUrl;
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
      const nextShowcase = await Promise.all(
        (nextSections?.packageShowcase || []).map(async (card) => {
          let imageUrl = typeof card?.image === 'string' ? card.image : '';

          if (card?.file instanceof File) {
            const upload = await uploadStorageImage(card.file, session.access_token, 'package-showcase');
            imageUrl = upload.publicUrl;
          }

          return {
            name: typeof card?.name === 'string' ? card.name : '',
            link: typeof card?.link === 'string' ? card.link : '',
            image: imageUrl,
          };
        })
      );

      const sectionPayloads = PACKAGE_SECTION_DEFINITIONS.map((section) => ({
        key: section.key,
        content:
          section.key === 'packageShowcase'
            ? normalizePackageShowcase(nextShowcase)
            : normalizePackageCards(nextSections?.[section.key]),
      }));

      const responses = await Promise.all(
        sectionPayloads.map((section) => upsertSiteSection(section.key, section.content, session.access_token))
      );

      responses
        .map((response) => normalizeSectionResponse(response))
        .filter(Boolean)
        .forEach((savedSection) => patchSectionItem(savedSection));

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
    <section className="bg-stone-50 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        {session && (
          <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm md:flex-row md:items-end md:justify-between md:p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-stone-500">Website Admin</p>
              <h1 className="mt-4 text-3xl font-semibold text-stone-950 md:text-5xl">Manage slider and all site sections</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-700">
                Login with your Supabase user, upload slider images, and update every content section that powers the
                public site.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
              >
                View Home
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
                <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-stone-500">Workspace Overview</p>
                      <h2 className="mt-3 text-2xl font-semibold text-stone-950">{activeWorkspace.label}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-600">{activeWorkspace.description}</p>
                      {activeAdminSection === 'content' && selectedSectionDefinition && (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                          Editing raw section: {selectedSectionDefinition.label}
                        </p>
                      )}
                    </div>
                    <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-700">
                      {activeWorkspace.statusLabel}
                    </div>
                  </div>
                </div>

                <div className={`mt-8 ${activeAdminSection === 'slider' ? 'block' : 'hidden'}`}>
              <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <form onSubmit={handleSaveSlide} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-950">
                      {editingId ? 'Edit slide' : 'Create a new slide'}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
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

                <label className="mt-8 block text-sm font-medium text-stone-700">
                  Slide title
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Optional title for your own tracking"
                  />
                </label>

                <label className="mt-5 block text-sm font-medium text-stone-700">
                  Image URL
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    placeholder="Paste image URL"
                  />
                </label>

                <label className="mt-5 block text-sm font-medium text-stone-700">
                  Or upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    className="mt-2 block w-full rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600"
                  />
                </label>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Sort order
                    <input
                      type="number"
                      min="1"
                      value={form.sortOrder}
                      onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 sm:mt-7">
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
                    <img src={previewUrl || form.imageUrl} alt="Slide preview" className="h-56 w-full object-cover" />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Slide' : 'Save Slide'}
                </button>
              </form>

              <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-950">All slider items</h2>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      These records are loaded from the <span className="font-semibold text-stone-900">hero_slides</span>{' '}
                      table.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadSlides(session.access_token)}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
                  >
                    Refresh
                  </button>
                </div>

                {loadingSlides ? (
                  <div className="mt-8 rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">Loading slides...</div>
                ) : slides.length === 0 ? (
                  <div className="mt-8 rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                    No slides found yet. Create your first one from the form.
                  </div>
                ) : (
                  <div className="mt-8 space-y-5">
                    {slides.map((slide) => (
                      <article
                        key={slide.id}
                        className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-50"
                      >
                        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                          <img
                            src={slide.image_url}
                            alt={slide.title || 'Hero slide'}
                            className="h-full min-h-48 w-full object-cover"
                          />
                          <div className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="text-lg font-semibold text-stone-950">{slide.title || 'Untitled slide'}</p>
                                <p className="mt-2 break-all text-sm text-stone-600">{slide.image_url}</p>
                              </div>
                              <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-600">
                                {slide.is_active ? 'Active' : 'Hidden'}
                              </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-600">
                              <span className="rounded-full bg-white px-4 py-2">Order: {slide.sort_order ?? 1}</span>
                              <span className="rounded-full bg-white px-4 py-2">ID: {slide.id}</span>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => startEditing(slide)}
                                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlide(slide.id)}
                                className="rounded-full border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
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

            <div className={`mt-8 ${activeAdminSection === 'albums' ? 'block' : 'hidden'}`}>
              <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <form onSubmit={handleSaveFeaturedAlbum} className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-950">
                      {editingFeaturedAlbumSlug ? 'Edit featured album' : 'Create featured album'}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      Upload the album cover image, then manage title, slug, story, and cover from one place.
                    </p>
                    <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                        {editingFeaturedAlbumSlug ? 'Currently editing' : 'Preparing gallery for'}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-stone-950">{featuredAlbumTargetName}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {featuredAlbumTargetPath ? `Page: ${featuredAlbumTargetPath}` : 'Add a slug to create the album page path.'}
                      </p>
                    </div>
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
                  <p className="mt-2 text-xs leading-6 text-stone-500">
                    Select an existing featured album to load its cover, story, and gallery images before uploading new ones.
                  </p>
                </label>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Album title
                    <input
                      type="text"
                      value={featuredAlbumForm.title}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, title: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="Urban Exhibition Chitro"
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
                      placeholder="urban-exhibition-chitro"
                      required
                    />
                    <p className="mt-2 text-xs leading-6 text-stone-500">
                      Album page: {featuredAlbumForm.slug.trim() ? `/sample-works/${featuredAlbumForm.slug.trim()}` : '/sample-works/your-slug'}
                    </p>
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
                      placeholder="Urban Exhibition Chitro"
                    />
                  </label>

                  <label className="block text-sm font-medium text-stone-700">
                    Hero subtitle
                    <input
                      type="text"
                      value={featuredAlbumForm.heroSubtitle}
                      onChange={(event) => setFeaturedAlbumForm((current) => ({ ...current, heroSubtitle: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                      placeholder="CHITROGOLPO OF THE CITY"
                    />
                  </label>
                </div>

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
                      src={featuredAlbumPreviewUrl || featuredAlbumForm.imageUrl}
                      alt="Featured album preview"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                )}

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
                              src={item.imageUrl}
                              alt={item.caption || `Gallery image ${index + 1}`}
                              className="h-52 w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

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

                <button
                  type="submit"
                  disabled={savingAlbums}
                  className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAlbums ? 'Saving album...' : editingFeaturedAlbumSlug ? 'Update Album' : 'Save Album'}
                </button>
              </form>

              <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-950">Featured albums</h2>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      These records are saved into the <span className="font-semibold text-stone-900">featuredAlbums</span>{' '}
                      content section, and their detail page galleries are saved into{' '}
                      <span className="font-semibold text-stone-900">albumStoryGalleries</span>.
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
                    Loading featured albums...
                  </div>
                ) : featuredAlbums.length === 0 ? (
                  <div className="mt-8 rounded-3xl bg-stone-50 px-5 py-4 text-sm text-stone-600">
                    No featured albums found yet. Create your first one from the form.
                  </div>
                ) : (
                  <div className="mt-8 space-y-5">
                    {featuredAlbums.map((album, index) => {
                      const galleryItems = albumStoryGalleries[album.slug] || [];
                      const isEditingAlbum = editingFeaturedAlbumSlug === album.slug;

                      return (
                        <article
                          key={album.slug || `${album.title}-${index}`}
                          className={`overflow-hidden rounded-[1.5rem] border bg-stone-50 ${
                            isEditingAlbum ? 'border-stone-900 shadow-[0_0_0_1px_rgba(28,25,23,0.12)]' : 'border-stone-200'
                          }`}
                        >
                          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                            <img
                              src={album.image}
                              alt={album.title || 'Featured album'}
                              className="h-full min-h-48 w-full object-cover"
                            />
                            <div className="p-5">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <p className="text-lg font-semibold text-stone-950">{album.title || 'Untitled album'}</p>
                                  <p className="mt-2 text-sm text-stone-600">Slug: {album.slug || 'missing-slug'}</p>
                                  <p className="mt-2 text-sm text-stone-600">Gallery images: {galleryItems.length}</p>
                                  {isEditingAlbum && (
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-900">
                                      Now open in editor
                                    </p>
                                  )}
                                </div>
                                <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-600">
                                  Order {index + 1}
                                </div>
                              </div>

                              <p className="mt-4 line-clamp-3 text-sm leading-7 text-stone-700">{album.story}</p>

                              <div className="mt-6 rounded-[1.25rem] border border-stone-200 bg-white p-4">
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
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {galleryItems.map((item, galleryIndex) => (
                                      <figure
                                        key={`${album.slug}-${galleryIndex}`}
                                        className="overflow-hidden rounded-[1rem] border border-stone-200 bg-stone-50"
                                      >
                                        <img
                                          src={item.image}
                                          alt={item.caption || `${album.title} gallery image ${galleryIndex + 1}`}
                                          className="h-32 w-full object-cover"
                                        />
                                        <figcaption className="p-3 text-xs leading-6 text-stone-700">
                                          <p className="font-semibold uppercase tracking-[0.2em] text-stone-500">
                                            Image {galleryIndex + 1}
                                          </p>
                                          <p className="mt-2 line-clamp-3">{item.caption || 'No caption added yet.'}</p>
                                        </figcaption>
                                      </figure>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-4 rounded-[1rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                                    No gallery images have been saved for this album yet.
                                  </div>
                                )}
                              </div>

                              <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => startEditingFeaturedAlbum(album, index)}
                                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                                >
                                  Edit Album & Gallery
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeaturedAlbum(album.slug)}
                                  className="rounded-full border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900"
                                >
                                  Delete
                                </button>
                              </div>
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
                sections={packageSections}
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
