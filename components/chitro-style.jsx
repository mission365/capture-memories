import HeroSliderAdmin from '@/components/hero-slider-admin';
import { createWhatsAppLink, DEFAULT_BOOK_US_CONTENT, normalizeBookUsContent } from '@/lib/book-us-content';
import { normalizeAlbumStoryGalleries, normalizeFeaturedAlbums } from '@/lib/featured-albums';
import { defaultHeroSlides, normalizeHeroSlides } from '@/lib/hero-slides';
import { normalizePackageCards, normalizePackageDetailSections, normalizePackageShowcase } from '@/lib/package-content';
import { normalizeSampleWorks, SAMPLE_WORK_FILTERS } from '@/lib/sample-works-content';
import { isSupabaseConfigured, listHeroSlides, listSiteSections } from '@/lib/supabase-browser';
import { ChevronLeft, ChevronRight, Facebook, Instagram, Mail, MapPin, Menu, MessageSquare, Phone, Youtube } from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';

const site = {
  brand: 'ChitroStyle',
  tagline: 'Wedding Photography Studio',
  logoUrl: '/icon.svg',
  email: 'hello@chitrostyle.com',
  phone: '+880 1XXX-XXXXXX',
  location: 'Dhaka, Bangladesh',
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  twitterUrl: 'https://twitter.com',
};

const navItems = [
  { name: 'Home', link: '/' },
  { name: 'About', link: '/about' },
  { name: 'Packages', link: '/packages' },
  { name: 'Sample Works', link: '/sample-works' },
  { name: 'Book Us', link: '/book' },
  { name: 'Why Us', link: '/why-us' },
];

const packages = [
  {
    name: 'River Gorai',
    badge: 'Starter',
    price: '৳45,000',
    summary: 'Simple and elegant wedding coverage for intimate celebrations.',
    photo: ['Unlimited photos', 'All selected photos color corrected', '1 event day coverage'],
    video: ['2 edited highlight videos', '1 short promo reel', 'Basic documentation film'],
    delivery: ['Google Drive delivery', 'Delivery within agreed timeline'],
  },
  {
    name: 'River Bangali',
    badge: 'Popular',
    price: '৳75,000',
    summary: 'A balanced package for couples who want both beauty and value.',
    photo: ['Unlimited photos', 'Premium photo retouching', '1 PhotoBook included'],
    video: ['Cinematic highlight film', 'Teaser reel', 'Full event documentation'],
    delivery: ['Custom pendrive box', 'Digital backup', 'Priority response'],
  },
  {
    name: 'River Brahmaputra',
    badge: 'Premium',
    price: '৳120,000',
    summary: 'Full cinematic storytelling with premium albums and artistic direction.',
    photo: ['Unlimited photos', '2 premium albums', 'Creative portrait session'],
    video: ['Premium cinematic film', 'Trailer cut', 'Long documentary edit'],
    delivery: ['Luxury box delivery', 'Cloud backup', 'Fast track support'],
  },
];

const sampleWorks = normalizeSampleWorks([]);

const whyUs = [
  {
    title: 'Artistic Direction',
    text: 'We guide posing, framing, and flow so couples feel comfortable and look natural in every frame.',
  },
  {
    title: 'Cinematic Aesthetic',
    text: 'Our editing style focuses on timeless colors, emotional pacing, and refined storytelling.',
  },
  {
    title: 'Reliable Delivery',
    text: 'We communicate clearly, respect deadlines, and maintain a polished client experience from booking to delivery.',
  },
  {
    title: 'Cultural Sensitivity',
    text: 'From holud to reception, we understand traditions and document them with care and authenticity.',
  },
  {
    title: 'Premium Output',
    text: 'Albums, films, teasers, and digital delivery are designed to feel elegant, memorable, and lasting.',
  },
  {
    title: 'End-to-End Support',
    text: 'We help with timeline planning, visual suggestions, and photo priorities before the event starts.',
  },
];

const jobs = [
  {
    title: 'Junior Photo Editor',
    type: 'Full Time',
    location: 'Dhaka',
    description: 'Edit wedding galleries, maintain consistent color tones, and support delivery workflows.',
  },
  {
    title: 'Cinematography Assistant',
    type: 'Contract',
    location: 'Remote / Event Based',
    description: 'Support event shoots, gear handling, and secondary camera coverage for wedding films.',
  },
  {
    title: 'Client Communication Executive',
    type: 'Full Time',
    location: 'Dhaka',
    description: 'Handle inquiries, booking coordination, and post-event delivery communication with clients.',
  },
];

const featuredAlbums = [
  {
    title: 'Urban Exhibition Chitro',
    slug: 'urban-exhibition-chitro',
    heroTitle: 'Urban Exhibition Chitro',
    heroSubtitle: 'CHITROGOLPO OF THE CITY',
    story:
      'This album follows a wedding story shaped by public spaces, textured architecture, and quiet moments inside a busy city. We wanted every frame to feel grounded, intimate, and alive with the rhythm of the place around the couple.',
    credit: '© ChitroStyle Album / 2026',
    image:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Sonali Unlimited Utshob',
    slug: 'sonali-unlimited-utshob',
    heroTitle: 'Sonali Unlimited Utshob',
    heroSubtitle: 'A GOLDEN CELEBRATION STORY',
    story:
      'Warm light, flowing fabric, and joyful movement define this gallery. We documented the celebration with a soft golden palette so the album feels festive, emotional, and rich with the atmosphere of the day.',
    credit: '© ChitroStyle Celebration Story / 2026',
    image:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Dipshikhar Aayojon',
    slug: 'dipshikhar-aayojon',
    heroTitle: 'Dipshikhar Aayojon',
    heroSubtitle: 'AN INTIMATE WEDDING MEMORY',
    story:
      'This series is built around mood, ritual, and expressive portraiture. We focused on contrast, shadow, and ceremonial detail to preserve the elegance of the moment without losing its personal warmth.',
    credit: '© ChitroStyle Ritual Story / 2026',
    image:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Gaye Holud',
    slug: 'gaye-holud',
    heroTitle: 'Gaye Holud',
    heroSubtitle: 'A HALDI DAY CHITROGOLPO',
    story:
      'Joy, color, and family energy shaped this album from beginning to end. Our approach was to keep the images playful and sunlit while holding on to the closeness and tradition that make a holud unforgettable.',
    credit: '© ChitroStyle Holud Story / 2026',
    image:
      'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Shonar Shondha',
    slug: 'shonar-shondha',
    heroTitle: 'Shonar Shondha',
    heroSubtitle: 'AN EVENING OF GOLDEN LIGHT',
    story:
      'Shonar Shondha is about glow, softness, and the tenderness that appears just before evening fades. We photographed this story with an emphasis on natural color, romantic spacing, and graceful movement.',
    credit: '© ChitroStyle Evening Story / 2026',
    image:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Bridal Portrait',
    slug: 'bridal-portrait',
    heroTitle: 'Bridal Portrait',
    heroSubtitle: 'A PORTRAIT-LED PHOTO STORY',
    story:
      'This album celebrates styling, confidence, and stillness. Every portrait was built to highlight expression, dress detail, and the quiet power of a bride fully present in her own story.',
    credit: '© ChitroStyle Portrait Story / 2026',
    image:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Reception Glow',
    slug: 'reception-glow',
    heroTitle: 'Reception Glow',
    heroSubtitle: 'A NIGHT OF LIGHT AND JOY',
    story:
      'Reception Glow gathers the brightness of decor, stage moments, and shared celebration into one polished visual story. We treated the evening like a cinematic sequence with elegance and warmth in every frame.',
    credit: '© ChitroStyle Reception Story / 2026',
    image:
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Outdoor Love Story',
    slug: 'outdoor-love-story',
    heroTitle: 'Outdoor Love Story',
    heroSubtitle: 'A NATURAL LIGHT CHITROGOLPO',
    story:
      'Set against open air and soft landscapes, this gallery leans into the feeling of freedom and connection. We photographed the couple with distance, breathing space, and natural light to let the story unfold gently.',
    credit: '© ChitroStyle Outdoor Story / 2026',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
];

const albumStoryGalleries = {
  'urban-exhibition-chitro': [
    {
      image:
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80',
      caption:
        'A city-side frame where architecture, texture, and human scale come together to give the couple a cinematic sense of place.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80',
      caption:
        'We kept the composition open and breathable so the environment feels like part of the story, not just a backdrop.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Portrait moments were shaped with clean geometry and soft contrast to preserve an elegant editorial mood.',
    },
  ],
  'sonali-unlimited-utshob': [
    {
      image:
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Golden light and flowing fabric define the emotional tone of this album, giving every frame a celebratory warmth.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      caption:
        'This sequence focuses on movement, anticipation, and the joy that builds around the couple before the main event.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
      caption:
        'We used backlight and negative space to let the couple stand out with a soft, memorable glow.',
    },
  ],
  'dipshikhar-aayojon': [
    {
      image:
        'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1600&q=80',
      caption:
        'This frame leans into ritual, costume, and expression, turning a quiet moment into a timeless portrait.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1516557070061-c3d1653fa646?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Detail shots help anchor the full story by preserving the handmade textures and ceremonial styling of the day.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1600&q=80',
      caption:
        'We balanced emotion with atmosphere so the album feels intimate without losing the scale of the celebration.',
    },
  ],
  'gaye-holud': [
    {
      image:
        'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Bright florals, laughter, and family energy create the signature rhythm of a holud day, and this frame captures that perfectly.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Color and styling are treated as storytelling elements here, adding personality to every portrait and candid glance.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      caption:
        'The album moves between playful interaction and refined composition, keeping the mood festive but polished.',
    },
  ],
  'shonar-shondha': [
    {
      image:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Evening light turns ordinary surroundings into something tender and cinematic, which is the heart of this story.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
      caption:
        'We framed the couple with warmth and distance so the silence between them could be felt as much as it was seen.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Decor, lighting, and gesture all work together to build the soft golden identity of the album.',
    },
  ],
  'bridal-portrait': [
    {
      image:
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1600&q=80',
      caption:
        'This portrait uses clean framing and expressive styling to highlight confidence, grace, and stillness.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1516557070061-c3d1653fa646?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Close detail photographs give texture to the narrative and make the beauty choices part of the visual memory.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1600&q=80',
      caption:
        'The overall portrait direction stays natural, but every angle is refined enough to feel editorial.',
    },
  ],
  'reception-glow': [
    {
      image:
        'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=80',
      caption:
        'This wide frame introduces the visual richness of the reception with layered light, decor, and stage atmosphere.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
      caption:
        'We focused on glow and softness so the couple remains the emotional center even inside a busy celebration.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
      caption:
        'Reception portraits here are treated like cinematic pauses that slow the story down for a more intimate reading.',
    },
  ],
  'outdoor-love-story': [
    {
      image:
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
      caption:
        'An open outdoor setting gives the couple room to move naturally, which keeps the romance easy and unforced.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      caption:
        'This composition leans on surrounding landscape and soft light to create a spacious, dreamlike feeling.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1600&q=80',
      caption:
        'The final frames keep the mood tender and grounded, letting the environment quietly support the couple story.',
    },
  ],
};

const packageShowcase = normalizePackageShowcase([
  {
    name: 'Sonaton Package',
    link: '/packages/sonaton',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Muslim Package',
    link: '/packages/muslim',
    image:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
  },
]);

const addOnsCatalog = [
  {
    name: 'Storybook',
    image:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Additional Prints',
    image:
      'https://images.unsplash.com/photo-1516557070061-c3d1653fa646?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Additional Photographer',
    image:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Additional Cinematographer',
    image:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Drone',
    image:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Additional Session',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Homeshoot',
    image:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Quick Delivery',
    image:
      'https://images.unsplash.com/photo-1513278974582-3e1b4a4fa21d?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Photoframe',
    image:
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=700&q=80',
  },
];

const foundingMembers = [
  {
    name: 'Avijit Nandy',
    role: 'Co-Founder & Core Photographer',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    youtubeUrl: '',
    email: 'hello@chitrostyle.com',
  },
  {
    name: 'Amin Abu Ahmed Ashraf (Dolon)',
    role: 'Co-Founder & Core Photographer',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    youtubeUrl: '',
    email: 'hello@chitrostyle.com',
  },
];

const aboutIntro =
  'Team ChitroStyle is a group of passionate and talented individuals who come together to create stunning images and capture beautiful moments on your special day. Each team member brings their unique skill set and perspective to the table, ensuring that every aspect of your wedding photography is covered. Every team member plays a critical role in bringing your vision to life. The team also includes skilled editors who work behind the scenes to enhance the images, create a cohesive story, and produce a final product that exceeds your expectations. With our wedding photography team by your side, you can rest assured that every moment of your special day will be captured flawlessly.';

const homeIntro = `Welcome to ${site.brand}, a creative wedding photography team from Bangladesh. Our journey began more than a decade ago. We believe every wedding is unique, and we tell the story through our photos. From the villages to the cities, we have been documenting Bangladeshi weddings with warmth, emotion, and timeless detail.`;

const aboutPageContent = {
  eyebrow: 'About Us',
  title: 'About Us',
  teamEyebrow: 'Our Team',
  teamTitle: 'Founding Members',
  officeHeading: 'Our Office',
  phoneHeading: 'Phone',
};

const officeInfo = {
  address: [
    '3B#2nd Floor, House#612, Road#8,',
    'Avenue#6, Mirpur DOHS, Dhaka-1216, Bangladesh',
  ],
  phones: ['+8801711-996633', '+8801312-030609'],
  mapQuery: '3B#2nd Floor, House#612, Road#8, Avenue#6, Mirpur DOHS, Dhaka-1216, Bangladesh',
};

const officeTour = {
  image:
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  title: 'Life at Capture Memories',
  subtitle:
    'The team also includes skilled editors who work behind the scenes to enhance the images, create the story, and produce a final product that exceeds your expectations.',
  videoUrl: '',
};

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSiteIdentity(content = {}) {
  return {
    brand: readText(content?.brand) || site.brand,
    tagline: readText(content?.tagline) || site.tagline,
    logoUrl: readText(content?.logoUrl) || site.logoUrl,
    email: readText(content?.email) || site.email,
    phone: readText(content?.phone) || site.phone,
    location: readText(content?.location) || site.location,
    facebookUrl: readText(content?.facebookUrl) || site.facebookUrl,
    instagramUrl: readText(content?.instagramUrl) || site.instagramUrl,
    youtubeUrl: readText(content?.youtubeUrl) || site.youtubeUrl,
    twitterUrl: readText(content?.twitterUrl) || site.twitterUrl,
  };
}

function normalizeFoundingMembers(members = []) {
  if (!Array.isArray(members) || members.length === 0) {
    return foundingMembers;
  }

  return members
    .map((member, index) => ({
      name: readText(member?.name) || `Team Member ${index + 1}`,
      role: readText(member?.role),
      image: readText(member?.image),
      facebookUrl: readText(member?.facebookUrl),
      instagramUrl: readText(member?.instagramUrl),
      youtubeUrl: readText(member?.youtubeUrl),
      email: readText(member?.email),
    }))
    .filter((member) => Boolean(member.name));
}

function normalizeAboutPageContent(content = {}) {
  return {
    eyebrow: readText(content?.eyebrow) || aboutPageContent.eyebrow,
    title: readText(content?.title) || aboutPageContent.title,
    teamEyebrow: readText(content?.teamEyebrow) || aboutPageContent.teamEyebrow,
    teamTitle: readText(content?.teamTitle) || aboutPageContent.teamTitle,
    officeHeading: readText(content?.officeHeading) || aboutPageContent.officeHeading,
    phoneHeading: readText(content?.phoneHeading) || aboutPageContent.phoneHeading,
  };
}

function normalizeOfficeInfo(content = {}) {
  const address = Array.isArray(content?.address)
    ? content.address.map((line) => readText(line)).filter(Boolean)
    : [];
  const phones = Array.isArray(content?.phones)
    ? content.phones.map((phone) => readText(phone)).filter(Boolean)
    : [];

  return {
    address: address.length > 0 ? address : officeInfo.address,
    phones: phones.length > 0 ? phones : officeInfo.phones,
    mapQuery: readText(content?.mapQuery) || officeInfo.mapQuery,
  };
}

function normalizeOfficeTour(content = {}) {
  const nextTitle = readText(content?.title);
  const nextVideoUrl = readText(content?.videoUrl);
  const nextImage = readText(content?.image);
  const inferredVideoUrl = nextVideoUrl || (getYouTubeEmbedUrl(nextImage) ? nextImage : '');

  return {
    image: getYouTubeEmbedUrl(nextImage) ? officeTour.image : nextImage || officeTour.image,
    title: nextTitle && nextTitle !== 'Life at ChitroStyle' ? nextTitle : officeTour.title,
    subtitle: readText(content?.subtitle) || officeTour.subtitle,
    videoUrl: inferredVideoUrl && inferredVideoUrl !== 'https://youtube.com' ? inferredVideoUrl : officeTour.videoUrl,
  };
}

function normalizeAboutPage(content = {}) {
  const nextContent = content && typeof content === 'object' && !Array.isArray(content) ? content : {};

  return {
    intro: readText(nextContent.intro || nextContent.aboutIntro) || aboutIntro,
    pageContent: normalizeAboutPageContent(nextContent.pageContent || nextContent.aboutPageContent),
    foundingMembers: normalizeFoundingMembers(nextContent.foundingMembers),
    officeInfo: normalizeOfficeInfo(nextContent.officeInfo),
    officeTour: normalizeOfficeTour(nextContent.officeTour),
  };
}

function getYouTubeEmbedUrl(value) {
  const rawUrl = readText(value);

  if (!rawUrl) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      } else if (parsed.pathname.startsWith('/live/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return '';
    }

    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  } catch (_error) {
    return '';
  }
}

const defaultAboutPage = normalizeAboutPage({
  intro: aboutIntro,
  pageContent: aboutPageContent,
  foundingMembers,
  officeInfo,
  officeTour,
});

const insideDhakaTabs = [
  {
    id: 'regular',
    label: 'Regular',
    sections: [
      {
        title: 'Affordable Packages',
        gridClassName: 'md:grid-cols-2',
        items: [
          {
            title: 'RIVER GORAI-গড়াই',
            price: '35,999 BDT',
            features: ['2 Photographers', '1 Cinematographer', '5 hours Duration', 'Less than 80 guest'],
          },
          {
            title: 'RIVER RUPSA-রূপসা',
            price: '59,999 BDT',
            features: ['3 Photographers', '2 Cinematographers', '6 hours Duration', 'No Prints'],
          },
        ],
      },
      {
        title: 'Premium Core Packages',
        gridClassName: 'md:grid-cols-2 xl:grid-cols-4',
        items: [
          {
            title: 'RIVER JADUKATA-জাদুকাটা',
            price: '79,999 BDT',
            features: [
              '3 Photographers',
              '2 Senior Cinematographers',
              'Lead by Core Photographer Dolon',
              '5 hours Duration Continual',
              'Venue based',
              'PhotoBook',
            ],
          },
          {
            title: 'RIVER DAHUK-ডাহুক',
            price: '99,999 BDT',
            subtitle: '(Storytelling)',
            features: [
              '4 Photographers',
              '3 Cinematographers',
              'Lead by Core Photographer Dolon',
              '7 hours Duration Continual',
              '(before event outdoor+venue+after)',
              'PhotoBook',
            ],
          },
          {
            title: 'RIVER ICHAMATI-ইছামতী',
            price: '94,999 BDT',
            features: [
              '4 Photographers',
              '2 Senior Cinematographers',
              'Lead by Core Photographer Avijit',
              '5 hours Duration Continual',
              'Venue based only',
              'PhotoBook',
            ],
          },
          {
            title: 'RIVER KOPOTAKKHO-কপোতাক্ষ',
            price: '1,19,999 BDT',
            subtitle: '(Storytelling)',
            features: [
              '4 Photographers',
              '3 Cinematographers',
              'Lead by Core Photographer Avijit',
              '7 hours Duration Continual',
              '(outdoor before event+venue+drone)',
              'PhotoBook',
            ],
          },
        ],
      },
      {
        title: 'Signature Storytelling',
        gridClassName: 'md:grid-cols-2',
        items: [
          {
            title: 'RIVER CHITRA-চিত্রা',
            price: '1,39,999 BDT',
            features: [
              '4 Photographers',
              '3 Cinematographers',
              'Lead by Core Avijit & Dolon',
              '6 hours Duration',
              'Photobook',
              'Drone',
            ],
          },
          {
            title: 'RIVER BANGALI-বাংলালি',
            price: '2,49,999 BDT',
            features: [
              '6 Photographers',
              '4 Cinematographers',
              'Lead by Core Avijit & Dolon',
              '13 hours Duration',
              'Photobook',
              'Drone',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'homely',
    label: 'Homely',
    sections: [
      {
        title: 'Homely Akdh/ Holud/ Mehdi/ Small Occasion - Without Stage | Less than 50 guests',
        gridClassName: 'md:grid-cols-2 xl:grid-cols-4',
        items: [
          {
            title: 'RIVER ARIYAL KHA-আড়িয়াল খা',
            price: '39,999 BDT',
            features: [
              'Avijit as Core Photographer',
              '1 Senior Cinematographer',
              '5 hours Duration',
              'No Prints',
            ],
            secondary: {
              title: 'PHOTOGRAPHY',
              price: '29,999 BDT',
              features: ['Avijit as Core Photographer', '5 hours Duration', 'No Prints'],
            },
          },
          {
            title: 'RIVER BIBIANA-বিবিয়ানা',
            price: '44,999 BDT',
            features: [
              'Avijit as Core Photographer',
              '1 Associate Photographer',
              '1 Senior Cinematographer',
              '5 hours Duration',
              'No Prints',
            ],
            secondary: {
              title: 'PHOTOGRAPHY',
              price: '34,999 BDT',
              features: [
                'Avijit as Core Photographer',
                '1 Associate Photographer',
                '5 hours Duration',
                'No Prints',
              ],
            },
          },
          {
            title: 'RIVER PAGLA-পাগলা',
            price: '34,999 BDT',
            features: [
              'Dolon as Core Photographer',
              '1 Senior Cinematographer',
              '5 hours Duration',
              'No Prints',
            ],
            secondary: {
              title: 'PHOTOGRAPHY',
              price: '24,999 BDT',
              features: ['Dolon as Core Photographer', '5 hours Duration', 'No Prints'],
            },
          },
          {
            title: 'RIVER KHOYAI-খোয়াই',
            price: '39,999 BDT',
            features: [
              'Dolon as Core Photographer',
              '1 Associate Photographer',
              '1 Senior Cinematographer',
              '5 hours Duration',
              'No Prints',
            ],
            secondary: {
              title: 'PHOTOGRAPHY',
              price: '29,999 BDT',
              features: [
                'Dolon as Core Photographer',
                '1 Associate Photographer',
                '5 hours Duration',
                'No Prints',
              ],
            },
          },
          {
            title: 'RIVER TISTA-তিস্তা',
            price: '26,999 BDT',
            features: ['1 Senior Photographer', '1 Senior Cinematographer', '5 hours Duration'],
            secondary: {
              title: 'PHOTOGRAPHY',
              price: '16,999 BDT',
              features: ['1 Senior Photographer', '5 hours Duration'],
            },
          },
          {
            title: 'RIVER PIYAIN-পিয়াইন',
            price: '31,999 BDT',
            features: [
              '1 Senior Photographer',
              '1 Associate Photographer',
              '1 Senior Cinematographer',
              '5 hours Duration',
            ],
            secondary: {
              title: 'PHOTOGRAPHY',
              price: '21,999 BDT',
              features: ['1 Senior Photographer', '1 Associate Photographer', '5 hours Duration'],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'sonaton',
    label: 'Sonaton',
    sections: [
      {
        title: 'Sonaton Packages',
        gridClassName: 'md:grid-cols-2 xl:grid-cols-3',
        items: [
          {
            title: 'RIVER HORIHORO-হরিহর',
            price: '111K-141K BDT',
            features: ['3 Photographers', '2 Cinematographers', 'HoludSnan+Biye+Bashibiye+Biday'],
            note: 'This is Only Bride side package. You can add Groom side.',
          },
          {
            title: 'RIVER PAHARIA-পাহাড়িয়া',
            price: '130K-160K BDT',
            features: [
              '4 Photographers',
              '2 Cinematographers',
              'Lead by Core Photographer Dolon',
              'HoludSnan+Biye+Bashibiye+Biday',
              'PhotoBook',
            ],
            note: 'This is Only Bride side package. You can add Groom side.',
          },
          {
            title: 'RIVER MATAMUHURI-মাতামুহুরি',
            price: '165K-195K BDT',
            features: [
              '4 Photographers',
              '3 Cinematographers',
              'Lead by Core Photographer Avijit',
              'HoludSnan+Biye+Bashibiye+Biday',
              'Drone+PhotoBook',
            ],
            note: 'This is Only Bride side package. You can add Groom side.',
          },
          {
            title: 'RIVER MANOS-মানস',
            price: '245K-275K BDT',
            features: [
              '4 Photographers',
              '2 Cinematographers',
              'Lead by Core Avijit & Dolon',
              'HoludSnan+Biye+Bashibiye+Biday',
              'PhotoBook',
            ],
            note: 'This is Only Bride side package. You can add Groom side.',
          },
          {
            title: 'RIVER PUNOBHARBA-পুনর্ভবা',
            price: '345K-385K BDT',
            features: [
              '5 Photographers',
              '3 Cinematographers',
              'Lead by Core Avijit & Dolon',
              'HoludSnan+Biye+Bashibiye+Biday',
              'PhotoBook',
            ],
            note: 'Both Bride & Groom side package',
          },
        ],
      },
    ],
  },
];

const outsideDhakaTabs = [
  {
    id: 'regular',
    label: 'Regular',
    sections: [
      {
        title: 'Destination Essentials',
        gridClassName: 'md:grid-cols-2 xl:grid-cols-3',
        items: [
          {
            title: 'RIVER MEGHNA',
            price: '64,999 BDT',
            features: [
              '3 Photographers',
              '2 Cinematographers',
              'Travel within nearby districts',
              '6 hours coverage',
              'Digital delivery',
            ],
          },
          {
            title: 'RIVER SURMA',
            price: '84,999 BDT',
            features: [
              '4 Photographers',
              '2 Cinematographers',
              '1 outdoor location included',
              '8 hours coverage',
              'Priority edit support',
            ],
          },
          {
            title: 'RIVER KARNAPHULI',
            price: '99,999 BDT',
            subtitle: '(Travel Story)',
            features: [
              '4 Photographers',
              '3 Cinematographers',
              'Destination travel support',
              '10 hours continual coverage',
              'Cloud delivery + teaser reel',
            ],
          },
        ],
      },
      {
        title: 'Premium Destination Stories',
        gridClassName: 'md:grid-cols-2',
        items: [
          {
            title: 'RIVER JAMUNA',
            price: '1,29,999 BDT',
            features: [
              '5 Photographers',
              '3 Cinematographers',
              'Lead by Core Photographer Avijit',
              'Pre-wedding outdoor included',
              'PhotoBook + cinematic teaser',
            ],
          },
          {
            title: 'RIVER PADMA',
            price: '1,69,999 BDT',
            subtitle: '(Premium Storytelling)',
            features: [
              '5 Photographers',
              '4 Cinematographers',
              'Lead by Core Avijit & Dolon',
              'Full day destination coverage',
              'Drone + premium album',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sonaton',
    label: 'Sonaton',
    sections: [
      {
        title: 'Sonaton Destination Packages',
        gridClassName: 'md:grid-cols-2 xl:grid-cols-3',
        items: [
          {
            title: 'RIVER ATRAI',
            price: '145K-175K BDT',
            features: [
              '4 Photographers',
              '2 Cinematographers',
              'Bride side destination coverage',
              'Holud + Biye + Bashor snippets',
              'Travel support included',
            ],
            note: 'Bride side package. Groom side can be added separately.',
          },
          {
            title: 'RIVER DHALESHWARI',
            price: '180K-210K BDT',
            features: [
              '4 Photographers',
              '3 Cinematographers',
              'Lead by Core Photographer Dolon',
              'Holud + Biye + Bashibhat',
              'PhotoBook included',
            ],
            note: 'Bride side package. Groom side can be added separately.',
          },
          {
            title: 'RIVER FENI',
            price: '225K-255K BDT',
            features: [
              '5 Photographers',
              '3 Cinematographers',
              'Lead by Core Photographer Avijit',
              'Drone support for venue story',
              'Premium photo album',
            ],
            note: 'Bride side package. Groom side can be added separately.',
          },
          {
            title: 'RIVER TITAS',
            price: '275K-315K BDT',
            features: [
              '5 Photographers',
              '4 Cinematographers',
              'Lead by Core Avijit & Dolon',
              'Destination stay + multi-event support',
              'Luxury album + teaser film',
            ],
            note: 'Bride and Groom side destination package.',
          },
        ],
      },
    ],
  },
];

const outdoorTabs = [
  {
    id: 'premium',
    label: 'Premium',
    sections: [
      {
        title: 'Premium Packages',
        gridClassName: 'md:grid-cols-2',
        items: [
          {
            title: 'PROKRITI KABBO - EXCLUSIVE',
            price: '99,999 BDT',
            features: [
              'Special photography & cinematography',
              'Lead by Avijit & Dolon',
              '1 Senior Cinematographer',
              'Time duration whole day',
            ],
          },
          {
            title: 'PROKRITI KABBO - PREMIUM',
            price: '149,999 BDT',
            features: [
              'Special photography & cinematography',
              'Lead by Avijit & Dolon',
              '1 Senior Cinematographer',
              'Drone coverage',
              'PhotoBook',
              'Time duration whole day',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'photography',
    label: 'Photography',
    sections: [
      {
        title: 'Photography Packages',
        gridClassName: 'md:grid-cols-2 xl:grid-cols-3',
        items: [
          {
            title: 'BONOLATA STORY',
            price: '34,999 BDT',
            features: [
              '1 Senior Photographer',
              'One outdoor location',
              '4 hours coverage',
              'Color corrected images',
            ],
          },
          {
            title: 'SHIULI LIGHT',
            price: '49,999 BDT',
            features: [
              '2 Photographers',
              'Two location flow',
              '5 hours coverage',
              'Online gallery delivery',
            ],
          },
          {
            title: 'MEGHMALA JOURNAL',
            price: '64,999 BDT',
            features: [
              '2 Photographers',
              'Lead by senior photographer',
              'Sunrise or sunset session',
              'Premium retouch set included',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'videography',
    label: 'Videography',
    sections: [
      {
        title: 'Videography Packages',
        gridClassName: 'md:grid-cols-2 xl:grid-cols-3',
        items: [
          {
            title: 'NIL DIGONTO FILM',
            price: '39,999 BDT',
            features: [
              '1 Cinematographer',
              'Cinematic highlight film',
              '4 hours outdoor coverage',
              'Edited teaser reel',
            ],
          },
          {
            title: 'JOCHONA FRAME',
            price: '59,999 BDT',
            features: [
              '2 Cinematographers',
              '5-6 minute promo edit',
              'Audio design included',
              'Full HD delivery',
            ],
          },
          {
            title: 'AKASHCHHAYA CINEMA',
            price: '79,999 BDT',
            features: [
              '2 Cinematographers',
              'Drone support',
              'Long cinematic narrative cut',
              'Priority edit timeline',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'combo',
    label: 'Combo',
    sections: [
      {
        title: 'Combo Packages',
        gridClassName: 'md:grid-cols-2',
        items: [
          {
            title: 'RANGTULI COMBO',
            price: '89,999 BDT',
            features: [
              '2 Photographers',
              '1 Cinematographer',
              'One outdoor location + travel support',
              'Highlight reel + edited photo set',
              '8x12 mini photo album',
            ],
          },
          {
            title: 'GOLPOBELA COMBO',
            price: '1,19,999 BDT',
            features: [
              '3 Photographers',
              '2 Cinematographers',
              'Drone + teaser reel',
              'Whole day outdoor coverage',
              'Premium album + social media cut',
            ],
          },
        ],
      },
    ],
  },
];

const sonatonPackages = normalizePackageCards([
  ...(insideDhakaTabs.find((tab) => tab.id === 'sonaton')?.sections ?? []),
  ...(outsideDhakaTabs.find((tab) => tab.id === 'sonaton')?.sections ?? []),
].flatMap((section) => section.items ?? []));

const muslimPackages = normalizePackageCards([
  ...(insideDhakaTabs.find((tab) => tab.id === 'regular')?.sections ?? []),
  ...(insideDhakaTabs.find((tab) => tab.id === 'homely')?.sections ?? []),
  ...(outsideDhakaTabs.find((tab) => tab.id === 'regular')?.sections ?? []),
  ...outdoorTabs.flatMap((tab) => tab.sections ?? []),
].flatMap((section) => section.items ?? []));

const defaultSiteContent = {
  site: normalizeSiteIdentity(site),
  navItems,
  packages,
  sampleWorks,
  bookUs: DEFAULT_BOOK_US_CONTENT,
  whyUs,
  jobs,
  featuredAlbums: normalizeFeaturedAlbums(featuredAlbums),
  albumStoryGalleries: normalizeAlbumStoryGalleries(albumStoryGalleries),
  packageShowcase,
  addOnsCatalog,
  homeIntro,
  aboutPage: defaultAboutPage,
  insideDhakaTabs,
  outsideDhakaTabs,
  outdoorTabs,
  sonatonPackages,
  muslimPackages,
};

const contentSectionDefinitions = [
  { key: 'site', label: 'Site Identity', description: 'Brand name, contact, location, and social links.' },
  { key: 'navItems', label: 'Navigation', description: 'Header and footer menu items.' },
  { key: 'whyUs', label: 'Why Us', description: 'Reasons and value propositions.' },
  { key: 'jobs', label: 'Career Jobs', description: 'Career openings shown on the site.' },
  { key: 'albumStoryGalleries', label: 'Album Galleries', description: 'Gallery images and captions per album slug. The featured album editor also updates this.' },
  { key: 'homeIntro', label: 'Home Intro', description: 'Homepage intro text above featured albums.' },
];

const SiteContentContext = createContext(defaultSiteContent);
const SiteContentReadyContext = createContext(false);

function useSiteContent() {
  return useContext(SiteContentContext);
}

function useSiteContentReady() {
  return useContext(SiteContentReadyContext);
}

function mergeSiteContent(sectionRows = []) {
  const merged = sectionRows.reduce((accumulator, row) => {
    if (!row?.section_key || typeof row.content === 'undefined' || row.content === null) {
      return accumulator;
    }

    const nextContent =
      row.section_key === 'site'
        ? normalizeSiteIdentity(row.content)
        : row.section_key === 'sampleWorks'
          ? normalizeSampleWorks(row.content)
          : row.section_key === 'bookUs'
            ? normalizeBookUsContent(row.content)
            : row.section_key === 'featuredAlbums'
              ? normalizeFeaturedAlbums(row.content)
              : row.section_key === 'albumStoryGalleries'
                ? normalizeAlbumStoryGalleries(row.content)
                : row.section_key === 'packageShowcase'
                  ? normalizePackageShowcase(row.content)
                  : row.section_key === 'sonatonPackages' || row.section_key === 'muslimPackages'
                    ? normalizePackageCards(row.content)
                    : row.section_key === 'aboutPage'
                      ? normalizeAboutPage(row.content)
                      : row.content;

    return {
      ...accumulator,
      [row.section_key]: nextContent,
    };
  }, defaultSiteContent);

  const legacyAboutPage = normalizeAboutPage({
    intro: merged.aboutIntro,
    pageContent: merged.aboutPageContent,
    foundingMembers: merged.foundingMembers,
    officeInfo: merged.officeInfo,
    officeTour: merged.officeTour,
  });
  const nextAboutPageSource =
    merged.aboutPage && typeof merged.aboutPage === 'object' && !Array.isArray(merged.aboutPage)
      ? merged.aboutPage
      : {};
  const nextAboutPage = normalizeAboutPage({
    intro: typeof nextAboutPageSource.intro !== 'undefined' ? nextAboutPageSource.intro : legacyAboutPage.intro,
    pageContent: nextAboutPageSource.pageContent || nextAboutPageSource.aboutPageContent || legacyAboutPage.pageContent,
    foundingMembers: Array.isArray(nextAboutPageSource.foundingMembers)
      ? nextAboutPageSource.foundingMembers
      : legacyAboutPage.foundingMembers,
    officeInfo: nextAboutPageSource.officeInfo || legacyAboutPage.officeInfo,
    officeTour: nextAboutPageSource.officeTour || legacyAboutPage.officeTour,
  });

  return {
    ...merged,
    aboutPage: nextAboutPage,
  };
}

function usePathname() {
  const getPath = () => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname || '/';
  };

  const [pathname, setPathname] = useState(getPath);

  useEffect(() => {
    const onPopState = () => setPathname(getPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path) => {
    if (typeof window === 'undefined') return;
    window.history.pushState({}, '', path);
    setPathname(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { pathname, navigate };
}

function isPathActive(pathname, link) {
  if (link === '/') return pathname === '/';
  return pathname === link || pathname.startsWith(`${link}/`);
}

function getVisibleNavItems(items = []) {
  return items.filter((item) => item?.link !== '/career' && String(item?.name || '').trim().toLowerCase() !== 'career');
}

function Header({ pathname, navigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { site, navItems } = useSiteContent();
  const siteContentReady = useSiteContentReady();
  const siteIdentity = normalizeSiteIdentity(site);
  const visibleNavItems = getVisibleNavItems(navItems);
  const headerSocialLinks = [
    { href: siteIdentity.facebookUrl, label: 'Facebook', icon: Facebook },
    { href: siteIdentity.instagramUrl, label: 'Instagram', icon: Instagram },
    { href: siteIdentity.youtubeUrl, label: 'YouTube', icon: Youtube },
  ].filter((item) => Boolean(item.href));

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-3 py-4 sm:px-4 md:px-6">
          <button onClick={() => navigate('/')} className="text-left">
            <p className="min-h-[1.75rem] text-xl font-semibold tracking-[0.3em] uppercase text-white">
              {siteContentReady ? siteIdentity.brand : ''}
            </p>
            <p className="min-h-[1rem] text-xs text-white/65">{siteContentReady ? siteIdentity.tagline : ''}</p>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {headerSocialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center text-white transition hover:text-white/70"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar */}
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <p className="text-lg font-semibold tracking-[0.3em] uppercase text-gray-900">Menu</p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-2xl text-gray-600 hover:text-gray-900"
            >
              X
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex flex-col gap-1 px-6 py-6">
            {visibleNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.link)}
                className={`px-4 py-3 rounded-lg text-left text-sm font-medium transition ${isPathActive(pathname, item.link)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-auto border-t border-gray-200 px-6 py-6">
            <button
              onClick={() => {
                navigate('/book');
                setSidebarOpen(false);
              }}
              className="w-full rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Footer({ navigate }) {
  const { navItems, site } = useSiteContent();
  const siteIdentity = normalizeSiteIdentity(site);
  const visibleNavItems = getVisibleNavItems(navItems);
  const footerSocialLinks = [
    { href: siteIdentity.facebookUrl, label: 'Facebook', icon: Facebook },
    { href: siteIdentity.instagramUrl, label: 'Instagram', icon: Instagram },
    { href: siteIdentity.youtubeUrl, label: 'YouTube', icon: Youtube },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="mt-12 border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-12 text-center">
        <div className="flex items-center gap-3 text-stone-500">
          {footerSocialLinks.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="transition hover:text-stone-900"
              >
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-stone-600">
          {visibleNavItems.map((item) => (
            <button key={item.name} onClick={() => navigate(item.link)} className="transition hover:text-stone-900">
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-white/70 md:flex-row">
          <p>Copyright 2026 {siteIdentity.brand} Inc.</p>
          <p>Made with love by Clockosoft</p>
        </div>
      </div>
    </footer>
  );
}

function PageHeader({ eyebrow, title, text, action, actionLabel }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-24 bg-white">
      <p className="text-sm uppercase tracking-[0.3em] text-gray-500">{eyebrow}</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-gray-900 md:text-6xl">{title}</h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-gray-600 md:text-lg">{text}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-8 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

function HomePage({ navigate }) {
  const slidesConfigured = isSupabaseConfigured();
  const [active, setActive] = useState(0);
  const [slides, setSlides] = useState(() => (slidesConfigured ? [] : defaultHeroSlides));
  const [slidesReady, setSlidesReady] = useState(!slidesConfigured);
  const { site, featuredAlbums, homeIntro } = useSiteContent();
  const siteContentReady = useSiteContentReady();
  const siteIdentity = normalizeSiteIdentity(site);
  const visibleSlides = slidesReady ? slides : [];
  const hasVisibleSlides = visibleSlides.length > 0;

  useEffect(() => {
    let ignore = false;

    async function loadSlides() {
      if (!slidesConfigured) {
        if (!ignore) {
          setSlides(defaultHeroSlides);
          setSlidesReady(true);
        }
        return;
      }

      try {
        const items = await listHeroSlides();
        const nextSlides = normalizeHeroSlides(items);

        if (!ignore) {
          setSlides(nextSlides);
        }
      } catch (_error) {
        if (!ignore) {
          // Only fall back after the live fetch fails so hardcoded slides do not flash first.
          setSlides(defaultHeroSlides);
        }
      } finally {
        if (!ignore) {
          setSlidesReady(true);
        }
      }
    }

    loadSlides();

    return () => {
      ignore = true;
    };
  }, [slidesConfigured]);

  useEffect(() => {
    if (visibleSlides.length > 0 && active >= visibleSlides.length) {
      setActive(0);
    }
  }, [active, visibleSlides.length]);

  useEffect(() => {
    if (visibleSlides.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % visibleSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [visibleSlides.length]);

  const previousSlide = () => setActive((prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length);
  const nextSlide = () => setActive((prev) => (prev + 1) % visibleSlides.length);

  return (
    <>
      <section className="relative min-h-[82vh] overflow-hidden bg-stone-100">
        {hasVisibleSlides ? (
          <>
            {visibleSlides.map((item, idx) => (
              <div
                key={item.id || item.image}
                className={`absolute inset-0 transition-opacity duration-700 ${active === idx ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
              >
                <img
                  src={item.image}
                  alt={item.title || `Hero slide ${idx + 1}`}
                  className="h-full min-h-[82vh] w-full object-cover"
                />
              </div>
            ))}

            <div className="absolute inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur">
              <div className="flex items-center justify-end px-4 py-3 md:px-8">
                <div className="flex items-center gap-3 text-stone-700">
                  <span className="text-xs font-medium tracking-[0.35em] text-stone-600">
                    {String(active + 1).padStart(2, '0')}/{String(visibleSlides.length).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={previousSlide}
                    aria-label="Previous slide"
                    disabled={visibleSlides.length <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next slide"
                    disabled={visibleSlides.length <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-stone-100">
            {!slidesReady && <div className="absolute inset-0 bg-stone-100/80" />}
          </div>
        )}
      </section>

      <section className="bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          {siteContentReady ? (
            <img src={siteIdentity.logoUrl || '/icon.svg'} alt={`${siteIdentity.brand} logo`} className="mx-auto h-16 w-16 md:h-20 md:w-20" />
          ) : (
            <div className="mx-auto h-16 w-16 rounded-[1.25rem] bg-stone-200 md:h-20 md:w-20" />
          )}
          <h2 className="mt-8 min-h-[3rem] text-4xl font-semibold text-stone-950 md:min-h-[3.75rem] md:text-5xl">
            {siteContentReady ? siteIdentity.brand : ''}
          </h2>
          <p className="mx-auto mt-6 min-h-[6rem] max-w-3xl text-base leading-8 text-stone-700 md:min-h-[8rem] md:text-lg">
            {siteContentReady ? homeIntro : ''}
          </p>

          <h3 className="mt-14 font-serif text-3xl italic text-stone-900 md:text-4xl">Featured Albums</h3>

          <div className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-2">
            {featuredAlbums.map((album) => (
              <button
                key={album.slug || album.title}
                type="button"
                onClick={() => navigate(`/sample-works/${album.slug}`)}
                className="group text-center"
              >
                <div className="overflow-hidden bg-stone-100 shadow-sm">
                  <img
                    src={album.image}
                    alt={album.title}
                    className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 text-base text-blue-700 transition group-hover:text-blue-900 md:text-lg">
                  {album.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AboutPage({ navigate }) {
  const { aboutPage, site } = useSiteContent();
  const siteContentReady = useSiteContentReady();
  const aboutDetails = normalizeAboutPage(aboutPage);
  const siteIdentity = normalizeSiteIdentity(site);
  const pageContent = aboutDetails.pageContent;
  const teamMembers = aboutDetails.foundingMembers;
  const officeDetails = aboutDetails.officeInfo;
  const officeMedia = aboutDetails.officeTour;
  const officeTourEmbedUrl = getYouTubeEmbedUrl(officeMedia.videoUrl);
  const officeSocialLinks = [
    { href: siteIdentity.facebookUrl, label: 'Facebook', icon: Facebook },
    { href: siteIdentity.email ? `mailto:${siteIdentity.email}` : '', label: 'Email', icon: Mail },
    { href: siteIdentity.instagramUrl, label: 'Instagram', icon: Instagram },
  ].filter((item) => Boolean(item.href));

  if (!siteContentReady) {
    return (
      <section className="bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl space-y-6 rounded-[2rem] border border-stone-200 bg-stone-50 px-8 py-10">
          <div className="h-4 w-28 rounded-full bg-stone-200" />
          <div className="h-12 w-full max-w-md rounded-full bg-stone-200" />
          <div className="h-24 w-full rounded-[1.5rem] bg-stone-200" />
          <div className="grid gap-6 pt-4 md:grid-cols-2">
            <div className="h-64 rounded-[1.5rem] bg-stone-200" />
            <div className="h-64 rounded-[1.5rem] bg-stone-200" />
          </div>
          <div className="h-80 rounded-[1.75rem] bg-stone-200" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-500">{pageContent.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-semibold uppercase text-stone-950 md:text-5xl">{pageContent.title}</h1>
          <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
            {aboutDetails.intro}
          </p>
        </div>
      </section>

      <section className="bg-white px-6 pb-24 md:pb-28">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">{pageContent.teamEyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold text-stone-950 md:text-4xl">{pageContent.teamTitle}</h2>

          <div
            className={`mt-16 grid gap-12 md:gap-16 ${teamMembers.length === 1 ? 'mx-auto max-w-2xl' : 'md:grid-cols-2'
              }`}
          >
            {teamMembers.map((member) => {
              const memberEmail = member.email || siteIdentity.email;
              const memberSocialLinks = [
                { href: member.facebookUrl || siteIdentity.facebookUrl, label: `${member.name} Facebook`, icon: Facebook },
                { href: member.instagramUrl || siteIdentity.instagramUrl, label: `${member.name} Instagram`, icon: Instagram },
                { href: member.youtubeUrl, label: `${member.name} YouTube`, icon: Youtube },
                { href: memberEmail ? `mailto:${memberEmail}` : '', label: `${member.name} Email`, icon: Mail },
              ].filter((item) => Boolean(item.href));

              return (
                <article key={member.name} className="flex flex-col items-center text-center">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-stone-100 shadow-sm md:h-32 md:w-32">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover grayscale"
                    />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-stone-950">{member.name}</h3>
                  <p className="mt-2 text-base text-stone-600">{member.role}</p>

                  {memberSocialLinks.length > 0 && (
                    <div className="mt-6 flex items-center gap-3 text-stone-500">
                      {memberSocialLinks.map((item) => {
                        const Icon = item.icon;
                        const isExternal = !item.href.startsWith('mailto:');

                        return (
                          <a
                            key={item.label}
                            href={item.href}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noreferrer' : undefined}
                            aria-label={item.label}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 transition hover:bg-stone-200 hover:text-stone-900"
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 pb-24 md:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-semibold text-stone-950 md:text-5xl">{officeMedia.title}</h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
            {officeMedia.subtitle}
          </p>

          {officeTourEmbedUrl ? (
            <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[2rem] border border-stone-200 bg-black shadow-sm">
              <div className="aspect-video">
                <iframe
                  src={officeTourEmbedUrl}
                  title={officeMedia.title || 'Office tour video'}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100 shadow-sm">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={officeMedia.image}
                  alt="Office tour preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white px-6 pb-24 md:pb-28">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="mx-auto w-full max-w-md space-y-10 text-center">
            <div>
              <MapPin className="mx-auto h-7 w-7 text-stone-700" />
              <h3 className="mt-4 text-3xl font-semibold text-stone-950">{pageContent.officeHeading}</h3>
              <div className="mt-4 space-y-1 text-sm leading-7 text-stone-600">
                {officeDetails.address.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>

            <div>
              <Phone className="mx-auto h-7 w-7 text-stone-700" />
              <h3 className="mt-4 text-3xl font-semibold text-stone-950">{pageContent.phoneHeading}</h3>
              <div className="mt-4 space-y-1 text-sm leading-7 text-stone-600">
                {officeDetails.phones.map((phone) => (
                  <p key={phone}>{phone}</p>
                ))}
              </div>
            </div>

            {officeSocialLinks.length > 0 && (
              <div className="flex items-center justify-center gap-3">
                {officeSocialLinks.map((item) => {
                  const Icon = item.icon;
                  const isExternal = !item.href.startsWith('mailto:');

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noreferrer' : undefined}
                      aria-label={item.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:opacity-80"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100 shadow-sm">
            <iframe
              title={`${siteIdentity.brand} office map`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(officeDetails.mapQuery)}&z=15&output=embed`}
              className="h-[340px] w-full md:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function getPackageDetailSections(item) {
  return normalizePackageDetailSections(item);
}

function PackageDetailsModal({ item, navigate, onClose }) {
  const sections = getPackageDetailSections(item);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white px-6 py-10 text-center shadow-2xl md:px-10 md:py-12"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-950"
        >
          Close
        </button>

        <h2 className="mx-auto max-w-2xl text-2xl font-semibold uppercase text-stone-950 md:text-4xl">
          {item.title} Details
        </h2>

        <div className="mt-10 space-y-10">
          {sections.map((section, sectionIndex) => (
            <div key={`${item.title}-section-${sectionIndex}`}>
              {section.title && <h3 className="text-xl font-semibold text-stone-950 md:text-2xl">{section.title}</h3>}
              {section.price && <p className="mt-3 text-lg text-stone-800">{section.price}</p>}
              <div className="mt-4 space-y-1 text-base leading-8 text-stone-800">
                {section.lines.map((line, lineIndex) => (
                  <p key={`${item.title}-section-${sectionIndex}-line-${lineIndex}`}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/book');
          }}
          className="mt-12 border border-stone-900 px-8 py-3 text-lg text-stone-950 transition hover:bg-stone-900 hover:text-white"
        >
          Book us now!
        </button>
      </div>
    </div>
  );
}

function PackageInfoCard({ item, onOpenDetails }) {
  return (
    <article className="mx-auto flex h-full w-full max-w-sm flex-col items-center rounded-[2rem] border border-stone-200 bg-stone-50 px-6 py-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:bg-white hover:shadow-xl md:px-8">
      <h3 className="max-w-xs text-2xl font-semibold uppercase leading-tight text-stone-950 md:text-3xl">{item.title}</h3>
      <p className="mt-6 text-4xl font-light text-stone-950 md:text-5xl">{item.price}</p>
      {item.subtitle && <p className="mt-4 text-lg text-stone-700">{item.subtitle}</p>}

      <div className="mt-8 space-y-1 text-[15px] leading-8 text-stone-900">
        {item.features.map((feature, featureIndex) => (
          <p key={`${item.title}-feature-${featureIndex}`}>{feature}</p>
        ))}
      </div>

      {item.secondary && (
        <div className="mt-8 w-full border-t border-stone-300 pt-6">
          <h4 className="text-2xl font-semibold uppercase text-stone-950">{item.secondary.title}</h4>
          <p className="mt-6 text-4xl font-light text-stone-950 md:text-5xl">{item.secondary.price}</p>
          <div className="mt-8 space-y-1 text-[15px] leading-8 text-stone-900">
            {item.secondary.features.map((feature, featureIndex) => (
              <p key={`${item.title}-secondary-feature-${featureIndex}`}>{feature}</p>
            ))}
          </div>
        </div>
      )}

      {item.note && <p className="mt-8 max-w-xs text-[15px] leading-8 text-stone-900">{item.note}</p>}

      <div className="mt-auto flex w-full justify-center pt-10">
        <button
          type="button"
          onClick={() => onOpenDetails(item)}
          className="details-glow-button w-full max-w-[300px] rounded-full border border-stone-900 bg-white px-6 py-3 text-xl text-stone-950 transition hover:bg-stone-900 hover:text-white"
        >
          Details
        </button>
      </div>
    </article>
  );
}

function PackageTabsPage({ title, description, tabs, navigate }) {
  const [activeTab, setActiveTab] = useState(() => tabs[0]?.id ?? '');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <>
      <section className="border-b border-stone-200 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-semibold uppercase text-stone-950 md:text-6xl">{title}</h1>
          <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">{description}</p>

          <div className="mt-10 flex items-center justify-center gap-6 border-b border-stone-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedPackage(null);
                }}
                className={`border-b-4 px-4 py-4 text-lg transition ${activeTab === tab.id
                    ? 'border-stone-950 text-stone-950'
                    : 'border-transparent text-stone-500 hover:text-stone-950'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl space-y-24">
          {currentTab.sections.map((section) => (
            <div key={section.title} className="text-center">
              <h2 className="text-3xl font-semibold text-stone-950 md:text-5xl">{section.title}</h2>
              <div className={`mt-16 grid gap-14 ${section.gridClassName}`}>
                {section.items.map((item) => (
                  <PackageInfoCard key={item.title} item={item} onOpenDetails={setSelectedPackage} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedPackage && (
        <PackageDetailsModal
          item={selectedPackage}
          navigate={navigate}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </>
  );
}

function PackageCardsPage({ title, description, items, navigate, gridClassName = 'md:grid-cols-2 xl:grid-cols-3' }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const siteContentReady = useSiteContentReady();

  if (!siteContentReady) {
    return (
      <>
        <section className="border-b border-stone-200 bg-white px-6 py-16 md:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto h-12 w-full max-w-md rounded-full bg-stone-200" />
            <div className="mx-auto mt-8 h-24 w-full max-w-3xl rounded-[1.5rem] bg-stone-200" />
          </div>
        </section>

        <section className="bg-white px-6 py-16 md:py-20">
          <div className={`mx-auto grid max-w-7xl gap-14 ${gridClassName}`}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`package-loading-${index}`}
                className="mx-auto h-[28rem] w-full max-w-sm rounded-[2rem] border border-stone-200 bg-stone-100"
              />
            ))}
          </div>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <section className="bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-stone-50 px-8 py-12 text-center text-stone-600">
          No packages have been added yet.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-stone-200 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-semibold uppercase text-stone-950 md:text-6xl">{title}</h1>
          <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">{description}</p>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:py-20">
        <div className={`mx-auto grid max-w-7xl gap-14 ${gridClassName}`}>
          {items.map((item) => (
            <PackageInfoCard key={item.title} item={item} onOpenDetails={setSelectedPackage} />
          ))}
        </div>
      </section>

      {selectedPackage && (
        <PackageDetailsModal
          item={selectedPackage}
          navigate={navigate}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </>
  );
}

function InsideDhakaPackagesPage({ navigate }) {
  const { insideDhakaTabs } = useSiteContent();

  return (
    <PackageTabsPage
      title="Inside Dhaka Packages"
      description="Capture the magic of your urban wedding with our photography package designed for city weddings. Our experienced photographers know the best locations for stunning city shots. Contact us today to learn more."
      tabs={insideDhakaTabs}
      navigate={navigate}
    />
  );
}

function OutsideDhakaPackagesPage({ navigate }) {
  const { outsideDhakaTabs } = useSiteContent();

  return (
    <PackageTabsPage
      title="Outside Dhaka Packages"
      description="For couples planning stories beyond the city, these destination-focused packages are designed to cover travel, outdoor portraits, and long-form event documentation with the same ChitroStyle feel."
      tabs={outsideDhakaTabs}
      navigate={navigate}
    />
  );
}

function OutdoorPackagesPage({ navigate }) {
  const { outdoorTabs } = useSiteContent();

  return (
    <PackageTabsPage
      title="Outdoor Packages"
      description="Capture your love story amidst breathtaking nature and architectural wonders. Our pre and post-wedding outdoor packages offer stunning backdrops, cinematic coverage, and polished storytelling for couples who want a destination-style memory."
      tabs={outdoorTabs}
      navigate={navigate}
    />
  );
}

function SonatonPackagesPage({ navigate }) {
  const { sonatonPackages, packageShowcase } = useSiteContent();
  const sonatonShowcase = packageShowcase.find((item) => item.link === '/packages/sonaton');

  return (
    <PackageCardsPage
      title={sonatonShowcase?.name || 'Sonaton Package'}
      description="Browse Sonaton wedding packages with curated coverage options for holud, biye, bashibiye, and destination celebrations."
      items={sonatonPackages}
      navigate={navigate}
    />
  );
}

function MuslimPackagesPage({ navigate }) {
  const { muslimPackages, packageShowcase } = useSiteContent();
  const muslimShowcase = packageShowcase.find((item) => item.link === '/packages/muslim');

  return (
    <PackageCardsPage
      title={muslimShowcase?.name || 'Muslim Package'}
      description="Explore Muslim wedding packages across inside Dhaka, destination events, and outdoor sessions with flexible coverage for akdh, holud, mehdi, wedding day, and related occasions."
      items={muslimPackages}
      navigate={navigate}
    />
  );
}

function PackagesPageLegacy({ navigate }) {
  const { packages } = useSiteContent();

  return (
    <>
      <PageHeader
        eyebrow="Packages"
        title="Flexible wedding packages designed for intimate moments and grand celebrations."
        text="Choose a package that matches your event size, delivery expectation, and storytelling preference. Each package can be adjusted based on your timeline and coverage needs."
        action={() => navigate('/book')}
        actionLabel="Request Custom Quote"
      />

      <section className="mx-auto max-w-7xl px-6 pb-24 bg-white">
        <div className="grid gap-6 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.name} className="rounded-[2rem] border border-gray-200 bg-gray-50 p-7 shadow-lg shadow-gray-200/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{pkg.name}</h2>
                  <p className="mt-2 text-sm text-gray-600">{pkg.summary}</p>
                </div>
                <span className="rounded-full border border-gray-300 px-3 py-1 text-xs uppercase tracking-[0.25em] text-gray-700">
                  {pkg.badge}
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold text-gray-900">{pkg.price}</p>

              <div className="mt-8 space-y-6 text-sm text-gray-600">
                <div>
                  <h4 className="mb-3 text-base font-medium text-gray-900">Photo Service</h4>
                  <ul className="space-y-2">
                    {pkg.photo.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-base font-medium text-gray-900">Video Service</h4>
                  <ul className="space-y-2">
                    {pkg.video.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-base font-medium text-gray-900">Delivery</h4>
                  <ul className="space-y-2">
                    {pkg.delivery.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => navigate('/book')}
                className="mt-8 inline-flex rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Book this package
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PackagesPage({ navigate }) {
  const { packageShowcase } = useSiteContent();

  return (
    <>
      <section className="bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-500">Packages</p>
          <h1 className="mt-5 text-4xl font-semibold uppercase text-stone-950 md:text-5xl">
            Find The Right Plan
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
            We believe in transparency and clarity, which is why our pricing is straightforward and easy to
            understand. Contact us to learn more about our pricing options and to book your next photography
            session.
          </p>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
            {packageShowcase.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(item.link)}
                className="group relative min-h-[360px] overflow-hidden bg-stone-100 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/30" />
                <div className="relative flex h-full items-center justify-center p-8">
                  <h2 className="font-serif text-4xl text-white md:text-[2.7rem]">{item.name}</h2>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AddOnsPage() {
  const { addOnsCatalog } = useSiteContent();

  return (
    <>
      <section className="bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-semibold uppercase text-stone-950 md:text-5xl">Add-ons</h1>
          <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
            We believe in transparency and clarity, which is why our pricing is straightforward and easy to
            understand. Contact us to learn more about our pricing options and to book your next photography
            session.
          </p>

          <div className="mt-20 grid gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
            {addOnsCatalog.map((item) => (
              <article key={item.name} className="flex flex-col items-center text-center">
                <div className="group relative w-full max-w-[220px] overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-50 shadow-sm">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-36 w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-stone-950 md:text-2xl">{item.name}</h2>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AlbumStoryPage({ album, navigate }) {
  const { albumStoryGalleries, site } = useSiteContent();
  const galleryItems = albumStoryGalleries[album.slug] ?? [];

  return (
    <>
      <section className="bg-slate-800 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center text-white">
          <h1 className="text-4xl font-semibold uppercase leading-[1.05] md:text-7xl">
            <span className="block">{album.heroTitle}</span>
            <span className="mt-3 block">{album.heroSubtitle}</span>
          </h1>
        </div>
      </section>

      <section className="bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-base leading-8 text-stone-800 md:text-lg">{album.story}</p>
          <p className="mt-10 text-sm text-stone-600">{album.credit}</p>
        </div>
      </section>

      {galleryItems.length > 0 ? (
        <section className="bg-white px-6 pb-24 md:pb-32">
          <div className="mx-auto max-w-5xl space-y-20">
            {galleryItems.map((item, index) => (
              <figure key={`${album.slug}-${index}`} className="space-y-5">
                <div className="overflow-hidden bg-stone-100 shadow-sm">
                  <img
                    src={item.image}
                    alt={item.caption || album.title}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
                <figcaption className="text-sm leading-7 text-stone-700 md:text-base">
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-white px-6 pb-24 md:pb-32">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-dashed border-stone-300 bg-stone-50 px-8 py-10 text-center">
            <p className="text-lg font-semibold text-stone-900">Gallery images will appear here.</p>
            <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">
              Add multiple photos and captions for this featured album from the admin panel, and this page will update from the backend content.
            </p>
          </div>
        </section>
      )}

      <section className="bg-white px-6 pb-16 pt-4 md:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-2xl leading-relaxed text-stone-950 md:text-3xl">
            Get your precious moments captured with love by {site.brand}
          </p>
          <button
            type="button"
            onClick={() => navigate('/book')}
            className="mt-8 rounded-full border border-stone-900 px-8 py-3 text-xl text-stone-950 transition hover:bg-stone-900 hover:text-white"
          >
            Book us now!
          </button>
        </div>
      </section>
    </>
  );
}

function SampleWorksPage() {
  const { sampleWorks } = useSiteContent();
  const [filter, setFilter] = useState('All');
  const filters = SAMPLE_WORK_FILTERS;
  const filteredItems = filter === 'All' ? sampleWorks : sampleWorks.filter((item) => item.category === filter);

  return (
    <>
      <PageHeader
        eyebrow="Sample Works"
        title="A curated collection of wedding stories, portraits, details, and cinematic moments."
        text="Explore our visual style across different wedding events and couple stories. This gallery is designed to reflect elegance, emotion, and premium presentation."
      />

      <section className="mx-auto max-w-7xl px-6 pb-8 bg-white">
        <div className="flex flex-wrap gap-3">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-5 py-2 text-sm transition ${filter === item ? 'bg-gray-900 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 bg-white">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((work, index) => (
            <div
              key={[work.title, work.category, work.image, index].filter(Boolean).join('-') || `sample-work-${index}`}
              className="group overflow-hidden rounded-[1.75rem] border border-gray-200 bg-gray-50"
            >
              <div className="h-80 overflow-hidden">
                <img src={work.image} alt={work.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function BookPageLegacy() {
  const { packages } = useSiteContent();

  return (
    <>
      <PageHeader
        eyebrow="Book Us"
        title="Tell us about your date, event style, and package preference."
        text="Send your details and we will get back with availability, pricing direction, and suitable package suggestions."
      />

      <section className="mx-auto max-w-6xl px-6 pb-24 bg-white">
        <div className="grid gap-8 rounded-[2rem] border border-gray-200 bg-gray-50 p-8 md:grid-cols-2 md:p-10">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Booking Information</h2>
            <div className="mt-6 space-y-4 text-gray-600">
              <p>• Share event date, venue, and event type.</p>
              <p>• Mention if you need photo only, video only, or both.</p>
              <p>• Let us know your expected delivery style and budget range.</p>
              <p>• We usually confirm availability after reviewing your full event details.</p>
            </div>
          </div>

          <form className="grid gap-4">
            <input className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none placeholder:text-gray-400" placeholder="Your name" />
            <input className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none placeholder:text-gray-400" placeholder="Phone number" />
            <input className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none placeholder:text-gray-400" placeholder="Email address" />
            <input className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none placeholder:text-gray-400" placeholder="Event date" />
            <input className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none placeholder:text-gray-400" placeholder="Venue / location" />
            <select className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none">
              <option>Select package</option>
              {packages.map((pkg) => (
                <option key={pkg.name}>{pkg.name}</option>
              ))}
            </select>
            <textarea className="min-h-32 rounded-2xl border border-gray-300 bg-white px-5 py-4 text-gray-900 outline-none placeholder:text-gray-400" placeholder="Tell us about your event" />
            <button type="button" className="rounded-full bg-gray-900 px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90">
              Send Booking Request
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function BookPage() {
  const { bookUs } = useSiteContent();
  const siteContentReady = useSiteContentReady();
  const bookUsContent = normalizeBookUsContent(bookUs);
  const whatsappLink = createWhatsAppLink(bookUsContent);

  function ContactInfoCard({ icon: Icon, title, lines, href = '', external = false }) {
    const cardContent = (
      <>
        <Icon className="h-8 w-8 text-slate-500" />
        <h2 className="mt-6 font-serif text-4xl font-semibold text-stone-950">{title}</h2>
        <div className="mt-6 space-y-2 text-lg leading-9 text-stone-800">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </>
    );

    if (href) {
      return (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          className="flex h-full flex-col items-center justify-start rounded-[2rem] px-6 py-10 text-center transition hover:bg-stone-50"
        >
          {cardContent}
        </a>
      );
    }

    return <div className="flex h-full flex-col items-center justify-start px-6 py-10 text-center">{cardContent}</div>;
  }

  if (!siteContentReady) {
    return (
      <section className="bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="mx-auto h-12 w-48 rounded-full bg-stone-200" />
            <div className="mx-auto mt-6 h-6 w-full max-w-2xl rounded-full bg-stone-200" />
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`book-us-skeleton-${index}`} className="rounded-[2rem] px-6 py-10 text-center">
                <div className="mx-auto h-8 w-8 rounded-full bg-stone-200" />
                <div className="mx-auto mt-6 h-10 w-40 rounded-full bg-stone-200" />
                <div className="mx-auto mt-6 h-5 w-52 rounded-full bg-stone-200" />
                <div className="mx-auto mt-3 h-5 w-40 rounded-full bg-stone-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-4xl font-semibold uppercase text-stone-950 md:text-5xl">{bookUsContent.heading}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">{bookUsContent.subheading}</p>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <ContactInfoCard icon={MapPin} title={bookUsContent.officeTitle} lines={bookUsContent.officeLines} />
          <ContactInfoCard icon={Phone} title={bookUsContent.phoneTitle} lines={[bookUsContent.phoneNumber]} />
          <ContactInfoCard icon={Mail} title={bookUsContent.emailTitle} lines={[bookUsContent.emailAddress]} />
          <ContactInfoCard
            icon={MessageSquare}
            title={bookUsContent.whatsappTitle}
            lines={[bookUsContent.whatsappNumber, bookUsContent.whatsappLabel]}
            href={whatsappLink}
            external
          />
        </div>
      </div>
    </section>
  );
}

function WhyUsPage({ navigate }) {
  const { whyUs } = useSiteContent();

  return (
    <>
      <PageHeader
        eyebrow="Why Us"
        title="Because wedding memories deserve more than ordinary coverage."
        text="We combine planning support, elegant direction, and premium post-production so your photos and films feel emotional, polished, and truly yours."
        action={() => navigate('/sample-works')}
        actionLabel="See Our Work"
      />

      <section className="mx-auto max-w-7xl px-6 pb-24 bg-white">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {whyUs.map((item) => (
            <div key={item.title} className="rounded-[2rem] border border-gray-200 bg-gray-50 p-8">
              <h3 className="text-2xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-4 leading-7 text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function CareerPage() {
  const { jobs } = useSiteContent();

  return (
    <>
      <PageHeader
        eyebrow="Career"
        title="Join a team that values creativity, discipline, and meaningful storytelling."
        text="We are always interested in meeting photographers, editors, assistants, and communicators who care about quality and client experience."
      />

      <section className="mx-auto max-w-6xl px-6 pb-24 bg-white">
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.title} className="rounded-[2rem] border border-gray-200 bg-gray-50 p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{job.title}</h2>
                  <p className="mt-3 text-gray-600">{job.description}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="rounded-full border border-gray-300 px-4 py-2">{job.type}</span>
                  <span className="rounded-full border border-gray-300 px-4 py-2">{job.location}</span>
                </div>
              </div>
              <button type="button" className="mt-6 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NotFoundPage({ navigate }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 bg-white text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-gray-500">404</p>
      <h1 className="mt-4 text-5xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-5 max-w-xl leading-8 text-gray-600">
        The page you are looking for does not exist in this preview. Go back to the homepage and continue exploring the site.
      </p>
      <button onClick={() => navigate('/')} className="mt-8 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white">
        Back to Home
      </button>
    </section>
  );
}

export default function ChitrogolpoInspiredFullSite() {
  const { pathname, navigate } = usePathname();
  const [siteContent, setSiteContent] = useState(defaultSiteContent);
  const [siteContentReady, setSiteContentReady] = useState(!isSupabaseConfigured());
  const isAdminRoute = pathname === '/admin';

  useEffect(() => {
    let ignore = false;

    async function loadSiteContent() {
      if (!isSupabaseConfigured()) {
        if (!ignore) {
          setSiteContentReady(true);
        }
        return;
      }

      try {
        const sectionRows = await listSiteSections();
        if (!ignore && Array.isArray(sectionRows) && sectionRows.length > 0) {
          setSiteContent(mergeSiteContent(sectionRows));
        }
      } catch (_error) {
        // Keep local demo content if Supabase content is unavailable.
      } finally {
        if (!ignore) {
          setSiteContentReady(true);
        }
      }
    }

    loadSiteContent();

    return () => {
      ignore = true;
    };
  }, []);

  const page = (() => {
    const isFeaturedAlbumPath = pathname.startsWith('/sample-works/') && pathname !== '/sample-works';
    const albumPage = siteContent.featuredAlbums.find((album) => pathname === `/sample-works/${album.slug}`);

    if (!siteContentReady && isFeaturedAlbumPath) {
      return (
        <section className="bg-white px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-stone-50 px-8 py-12 text-center text-stone-600">
            Loading featured album...
          </div>
        </section>
      );
    }

    if (albumPage) {
      return <AlbumStoryPage album={albumPage} navigate={navigate} />;
    }

    switch (pathname) {
      case '/':
        return <HomePage navigate={navigate} />;
      case '/admin':
        return (
          <HeroSliderAdmin
            navigate={navigate}
            defaultContent={defaultSiteContent}
            contentSections={contentSectionDefinitions}
          />
        );
      case '/about':
        return <AboutPage navigate={navigate} />;
      case '/packages':
        return <PackagesPage navigate={navigate} />;
      case '/packages/sonaton':
        return <SonatonPackagesPage navigate={navigate} />;
      case '/packages/muslim':
        return <MuslimPackagesPage navigate={navigate} />;
      case '/packages/inside-dhaka':
        return <InsideDhakaPackagesPage navigate={navigate} />;
      case '/packages/outside-dhaka':
        return <OutsideDhakaPackagesPage navigate={navigate} />;
      case '/packages/outdoor':
        return <OutdoorPackagesPage navigate={navigate} />;
      case '/packages/add-ons':
        return <AddOnsPage />;
      case '/sample-works':
        return <SampleWorksPage />;
      case '/book':
        return <BookPage />;
      case '/why-us':
        return <WhyUsPage navigate={navigate} />;
      case '/career':
        return <CareerPage />;
      default:
        return <NotFoundPage navigate={navigate} />;
    }
  })();

  return (
    <SiteContentReadyContext.Provider value={siteContentReady}>
      <SiteContentContext.Provider value={siteContent}>
        <div className={`${isAdminRoute ? '' : 'chitro-site '}min-h-screen bg-white text-gray-900`}>
          <Header pathname={pathname} navigate={navigate} />
          <main>{page}</main>
          <Footer navigate={navigate} />
        </div>
      </SiteContentContext.Provider>
    </SiteContentReadyContext.Provider>
  );
}
