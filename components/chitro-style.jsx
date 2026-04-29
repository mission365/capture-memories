import HeroSliderAdmin from '@/components/hero-slider-admin';
import { createWhatsAppLink, DEFAULT_BOOK_US_CONTENT, normalizeBookUsContent } from '@/lib/book-us-content';
import { normalizeAlbumStoryGalleries, normalizeFeaturedAlbums } from '@/lib/featured-albums';
import { defaultHeroSlides, normalizeHeroSlides } from '@/lib/hero-slides';
import { normalizePackageCards, normalizePackageDetailSections, normalizePackageShowcase } from '@/lib/package-content';
import { normalizeSampleWorks, SAMPLE_WORK_FILTERS } from '@/lib/sample-works-content';
import { isSupabaseConfigured, listHeroSlides, listSiteSections } from '@/lib/supabase-browser';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Gift,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Phone,
  Sparkles,
  Video,
  Youtube,
} from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname as useNextPathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

function SafeImage({ src, alt, className, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
          <Skeleton className="h-full w-full" />
          <Spinner className="absolute size-10 text-[#FF4B4B]" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        {...props}
      />
    </div>
  );
}

const PACKAGE_FALLBACK_ICONS = [Camera, Video, Gift, Sparkles, MessageSquare];

const site = {
  brand: '',
  tagline: '',
  logoUrl: '',
  email: '',
  phone: '',
  location: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  twitterUrl: '',
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

const featuredAlbums = [];

const albumStoryGalleries = {};

const packageShowcase = normalizePackageShowcase([]);

const addOnsCatalog = [
  { name: 'Storybook', image: '' },
  { name: 'Additional Prints', image: '' },
  { name: 'Additional Photographer', image: '' },
  { name: 'Additional Cinematographer', image: '' },
  { name: 'Drone', image: '' },
  { name: 'Additional Session', image: '' },
  { name: 'Homeshoot', image: '' },
  { name: 'Quick Delivery', image: '' },
  { name: 'Photoframe', image: '' },
];

const foundingMembers = [
  {
    name: 'Avijit Nandy',
    role: 'Co-Founder & Core Photographer',
    image: '',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    youtubeUrl: '',
    email: 'hello@chitrostyle.com',
  },
  {
    name: 'Amin Abu Ahmed Ashraf (Dolon)',
    role: 'Co-Founder & Core Photographer',
    image: '',
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
  image: '',
  title: '',
  subtitle: '',
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
  const pathname = useNextPathname();
  const router = useRouter();

  const navigate = (path) => {
    router.push(path);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    {
      href: siteIdentity.facebookUrl,
      label: 'Facebook',
      icon: Facebook,
      colorClassName: 'text-[#1877F2] border-[#1877F2]/35 bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white',
    },
    {
      href: siteIdentity.instagramUrl,
      label: 'Instagram',
      icon: Instagram,
      colorClassName: 'text-[#E1306C] border-[#E1306C]/35 bg-[#E1306C]/10 hover:bg-[#E1306C] hover:text-white',
    },
    {
      href: siteIdentity.youtubeUrl,
      label: 'YouTube',
      icon: Youtube,
      colorClassName: 'text-[#FF0000] border-[#FF0000]/35 bg-[#FF0000]/10 hover:bg-[#FF0000] hover:text-white',
    },
  ].filter((item) => Boolean(item.href));

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-3 py-4 sm:px-4 md:px-6">
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer text-left"
          >
            <div className="header-brand-spotlight min-h-[1.75rem] text-xl font-semibold tracking-[0.3em] uppercase">
              {siteContentReady ? siteIdentity.brand : <Skeleton className="h-6 w-32 bg-stone-800" />}
            </div>
            <div className="min-h-[1rem] text-xs text-white/65">
              {siteContentReady ? siteIdentity.tagline : <Skeleton className="mt-1 h-3 w-48 bg-stone-800" />}
            </div>
          </div>

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
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition duration-300 hover:-translate-y-0.5 ${item.colorClassName}`}
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
                className={`menu-inner-hover px-4 py-3 rounded-lg text-left text-sm font-medium transition ${isPathActive(pathname, item.link)
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
    {
      href: siteIdentity.facebookUrl,
      label: 'Facebook',
      icon: Facebook,
      colorClassName: 'text-[#1877F2] hover:scale-110',
    },
    {
      href: siteIdentity.instagramUrl,
      label: 'Instagram',
      icon: Instagram,
      colorClassName: 'text-[#E1306C] hover:scale-110',
    },
    {
      href: siteIdentity.youtubeUrl,
      label: 'YouTube',
      icon: Youtube,
      colorClassName: 'text-[#FF0000] hover:scale-110',
    },
  ].filter((item) => Boolean(item.href));

  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/5 bg-black pt-16 pb-8 md:pt-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold tracking-wider text-white uppercase">
                {siteIdentity.brand || 'ChitroStyle'}
              </h3>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                {siteIdentity.tagline || 'Capturing your precious moments with love and authenticity.'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {footerSocialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 transition-all duration-300 menu-inner-hover ${item.colorClassName}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Quick Links</h4>
            <nav className="mt-6 flex flex-col gap-4">
              {visibleNavItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.link)}
                  className="w-fit text-sm text-stone-400 transition hover:text-white hover:translate-x-1 duration-200"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Contact Us</h4>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
                <p className="text-sm leading-6 text-stone-400">
                  {siteIdentity.location || 'Dhaka, Bangladesh'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-stone-500" />
                <a href={`tel:${siteIdentity.phone}`} className="text-sm text-stone-400 hover:text-white transition">
                  {siteIdentity.phone || '+880 1XXX-XXXXXX'}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-stone-500" />
                <a href={`mailto:${siteIdentity.email}`} className="text-sm text-stone-600 hover:text-white transition">
                  {siteIdentity.email || 'hello@chitrostyle.com'}
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Newsletter or Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Office Hours</h4>
            <div className="mt-6 space-y-3">
              <p className="text-sm text-stone-400">Saturday — Thursday</p>
              <p className="text-sm font-medium text-white">11:00 AM — 08:00 PM</p>
              <p className="mt-4 text-xs italic text-stone-600">
                Please book an appointment before visiting.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
              © {currentYear} {siteIdentity.brand || 'ChitroStyle'} Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">
              <span>Made with love by</span>
              <a href="https://clockosoft.com" target="_blank" rel="noreferrer" className="font-semibold text-stone-300 hover:text-white transition">
                Clockosoft
              </a>
            </div>
          </div>
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
          setSlides([]);
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
      <section id="home-hero-slider" className="relative min-h-[88svh] overflow-hidden bg-stone-100 md:min-h-[92vh]">
        {hasVisibleSlides ? (
          <>
            {visibleSlides.map((item, idx) => (
              <div
                key={item.id || item.image}
                className={`absolute inset-0 transition-opacity duration-700 ${active === idx ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
              >
                <SafeImage
                  src={item.image}
                  alt={item.title || `Hero slide ${idx + 1}`}
                  className="h-full min-h-[88svh] w-full object-cover md:min-h-[92vh]"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  decoding="async"
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
          {siteContentReady && siteIdentity.logoUrl ? (
            <SafeImage src={siteIdentity.logoUrl} alt={`${siteIdentity.brand} logo`} className="mx-auto h-16 w-16 md:h-20 md:w-20" />
          ) : (
            <div className="mx-auto h-16 w-16 rounded-[1.25rem] bg-stone-200 md:h-20 md:w-20" />
          )}
          <div
            className="mt-8 min-h-[3rem] text-4xl font-semibold text-stone-950 md:min-h-[3.75rem] md:text-5xl"
          >
            {siteContentReady ? siteIdentity.brand : <Skeleton className="mx-auto h-12 w-64 bg-stone-100" />}
          </div>
          <div className="mx-auto mt-6 min-h-[6rem] max-w-3xl text-base leading-8 text-stone-700 md:min-h-[8rem] md:text-lg">
            {siteContentReady ? (
              homeIntro
            ) : (
              <div className="space-y-3">
                <Skeleton className="mx-auto h-4 w-full bg-stone-100" />
                <Skeleton className="mx-auto h-4 w-[90%] bg-stone-100" />
                <Skeleton className="mx-auto h-4 w-[95%] bg-stone-100" />
              </div>
            )}
          </div>

          <h3 className="mt-14 font-serif text-3xl italic text-stone-900 md:text-4xl">Featured Albums</h3>

          {siteContentReady ? (
            <div className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-2">
              {featuredAlbums.map((album) => (
                <button
                  key={album.slug || album.title}
                  type="button"
                  onClick={() => navigate(`/sample-works/${album.slug}`)}
                  className="featured-album-card group text-center"
                >
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-50 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                    {album.image ? (
                      <SafeImage
                        src={album.image}
                        alt={album.title}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full bg-stone-200" />
                    )}
                  </div>
                  <p className="mt-5 text-base font-medium text-stone-900 transition group-hover:text-stone-950 md:text-lg">
                    {album.title}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="text-center">
                  <div className="aspect-[4/3] w-full rounded-[1.75rem] border border-stone-200 bg-stone-100 shadow-sm" />
                  <div className="mx-auto mt-5 h-6 w-40 rounded-full bg-stone-200" />
                </div>
              ))}
            </div>
          )}
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
                    {member.image ? (
                      <SafeImage
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover grayscale"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-stone-200 text-3xl font-semibold text-stone-500">
                        {member.name.charAt(0)}
                      </div>
                    )}
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
          ) : officeMedia.image ? (
            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100 shadow-sm">
              <div className="relative aspect-video overflow-hidden">
                <SafeImage
                  src={officeMedia.image}
                  alt="Office tour preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100 shadow-sm">
              <div className="aspect-video bg-stone-200" />
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

function formatPackageTextLegacy(value = '') {
  return String(value || '')
    .replace(/\s*\+\s*/g, ' · ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getPackageEyebrowLegacy(item) {
  return formatPackageText(item);
}

function formatPackageText(value = '') {
  return String(value || '')
    .replace(/\s*\+\s*/g, ' / ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getPackageEyebrow(item) {
  const searchableText = [item.subtitle, item.secondary?.title, ...(item.features || [])].join(' ').toLowerCase();
  const hasPhoto = searchableText.includes('photograph') || searchableText.includes('photo');
  const hasCinema =
    searchableText.includes('cinematograph') ||
    searchableText.includes('video') ||
    searchableText.includes('film') ||
    searchableText.includes('reel');

  if (hasPhoto && hasCinema) {
    return 'Photography + Cinema';
  }

  if (hasCinema) {
    return 'Cinematography';
  }

  if (hasPhoto) {
    return 'Photography';
  }

  if (searchableText.includes('destination') || searchableText.includes('travel')) {
    return 'Destination Story';
  }

  if (searchableText.includes('outdoor')) {
    return 'Outdoor Story';
  }

  return 'Wedding Package';
}

function getPackageHeroIcon(item) {
  const searchableText = [item.subtitle, item.secondary?.title, ...(item.features || [])].join(' ').toLowerCase();
  const hasPhoto = searchableText.includes('photograph') || searchableText.includes('photo');
  const hasCinema =
    searchableText.includes('cinematograph') ||
    searchableText.includes('video') ||
    searchableText.includes('film') ||
    searchableText.includes('reel');

  if (!hasPhoto && hasCinema) {
    return Video;
  }

  return Camera;
}

function getPackageFeatureMeta(feature = '', index = 0, context = '') {
  const normalizedFeature = [context, feature].filter(Boolean).join(' ').toLowerCase();

  if (normalizedFeature.includes('photograph') || normalizedFeature.includes('photo')) {
    return { Icon: Camera, label: formatPackageText(feature) };
  }

  if (
    normalizedFeature.includes('cinematograph') ||
    normalizedFeature.includes('video') ||
    normalizedFeature.includes('film') ||
    normalizedFeature.includes('reel')
  ) {
    return { Icon: Video, label: formatPackageText(feature) };
  }

  if (
    normalizedFeature.includes('album') ||
    normalizedFeature.includes('book') ||
    normalizedFeature.includes('delivery') ||
    normalizedFeature.includes('drive') ||
    normalizedFeature.includes('pendrive')
  ) {
    return { Icon: Gift, label: formatPackageText(feature) };
  }

  if (
    normalizedFeature.includes('drone') ||
    normalizedFeature.includes('lead') ||
    normalizedFeature.includes('travel') ||
    normalizedFeature.includes('outdoor') ||
    normalizedFeature.includes('day') ||
    normalizedFeature.includes('hour') ||
    normalizedFeature.includes('duration') ||
    normalizedFeature.includes('coverage')
  ) {
    return { Icon: Sparkles, label: formatPackageText(feature) };
  }

  return {
    Icon: PACKAGE_FALLBACK_ICONS[index % PACKAGE_FALLBACK_ICONS.length],
    label: formatPackageText(feature),
  };
}

function PackageFeatureRow({
  feature,
  index = 0,
  context = '',
  bulletClassName = 'bg-[#ce4257]',
  itemClassName = 'flex items-start gap-3',
  textClassName = 'text-[15px] leading-7 text-[#4f000b]',
}) {
  const { label } = getPackageFeatureMeta(feature, index, context);

  return (
    <li className={itemClassName}>
      <span className={`mt-[0.55rem] h-2 w-2 shrink-0 rounded-full ${bulletClassName}`} />
      <p className={textClassName}>{label}</p>
    </li>
  );
}

function PackageDetailsModal({ item, navigate, onClose }) {
  const sections = getPackageDetailSections(item);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-slate-300 bg-[linear-gradient(180deg,#f9fafb_0%,#f3f4f6_55%,#e5e7eb_100%)] px-6 py-10 text-center shadow-2xl md:px-10 md:py-12"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-900"
        >
          Close
        </button>

        <h2 className="mx-auto max-w-2xl text-2xl font-semibold uppercase text-slate-900 md:text-4xl">
          {item.title} Details
        </h2>

        <div className="mt-10 space-y-10">
          {sections.map((section, sectionIndex) => (
            <div key={`${item.title}-section-${sectionIndex}`}>
              {section.title && <h3 className="text-xl font-semibold text-slate-900 md:text-2xl">{section.title}</h3>}
              {section.price && <p className="mt-3 text-lg text-slate-700">{section.price}</p>}
              <div className="mt-5 rounded-[1.15rem] border border-slate-300/80 bg-white/70 px-4 py-3 text-left shadow-[0_10px_24px_rgba(31,41,55,0.06)]">
                <ul className="space-y-2.5">
                  {section.lines.map((line, lineIndex) => (
                    <PackageFeatureRow
                      key={`${item.title}-section-${sectionIndex}-line-${lineIndex}`}
                      feature={line}
                      index={lineIndex}
                      context={section.title}
                      bulletClassName="bg-slate-500"
                      textClassName="text-base leading-7 text-slate-800"
                    />
                  ))}
                </ul>
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
          className="mt-12 rounded-full border border-slate-700 bg-[linear-gradient(135deg,#1f2937_0%,#374151_65%,#6b7280_100%)] px-8 py-3 text-lg text-white transition hover:brightness-105"
        >
          Book us now!
        </button>
      </div>
    </div>
  );
}

function PackageInfoCard({ item, onOpenDetails }) {
  return (
    <article className="mx-auto flex h-full w-full max-w-sm flex-col rounded-[2rem] bg-[linear-gradient(140deg,#4b5563_0%,#374151_48%,#111827_100%)] p-[1px] shadow-[0_22px_50px_rgba(17,24,39,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(17,24,39,0.3)]">
      <div className="flex h-full flex-col overflow-hidden rounded-[calc(2rem-1px)] bg-[linear-gradient(180deg,#f9fafb_0%,#f3f4f6_55%,#e5e7eb_100%)]">
        <div className="relative overflow-hidden px-5 py-5 text-center text-white md:px-7">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#1f2937_0%,#374151_55%,#6b7280_100%)]" />
          <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-slate-200/20 blur-2xl" />

          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white md:text-[11px]">
              Package Name
            </p>
            <h3 className="mx-auto mt-2 max-w-xs text-xl font-semibold uppercase leading-tight text-white md:text-2xl">
              {item.title}
            </h3>
            {item.subtitle && <p className="mt-2 text-sm leading-6 text-white/90">{item.subtitle}</p>}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-4 pt-3.5 md:px-6">
          <div className="rounded-[1.5rem] border border-slate-300/70 bg-white/80 px-4 py-3 text-center shadow-[0_12px_28px_rgba(31,41,55,0.08)] backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-600 md:text-xs">Package Price</p>
            <p className="mt-1.5 font-serif text-3xl leading-none text-slate-900 md:text-4xl">{item.price}</p>
          </div>

          <div className="mt-3.5 rounded-[1.15rem] border border-slate-300/70 bg-white/75 px-4 py-2 text-left shadow-[0_8px_20px_rgba(31,41,55,0.06)]">
            <ul className="space-y-1.5">
              {item.features.map((feature, featureIndex) => (
                <PackageFeatureRow
                  key={`${item.title}-feature-${featureIndex}`}
                  feature={feature}
                  index={featureIndex}
                  bulletClassName="bg-slate-500"
                  textClassName="text-[15px] leading-7 text-slate-800"
                />
              ))}
            </ul>
          </div>

          {item.secondary && (
            <div className="mt-3.5 rounded-[1.35rem] border border-slate-300/70 bg-[linear-gradient(135deg,rgba(107,114,128,0.12)_0%,rgba(148,163,184,0.16)_100%)] px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-700 md:text-xs">{item.secondary.title}</p>
              <p className="mt-1.5 font-serif text-2xl leading-none text-slate-900 md:text-3xl">{item.secondary.price}</p>
              <div className="mt-2.5 rounded-[1rem] border border-slate-300/70 bg-white/70 px-3.5 py-2.5">
                <ul className="space-y-1">
                {item.secondary.features.map((feature, featureIndex) => (
                  <PackageFeatureRow
                    key={`${item.title}-secondary-feature-${featureIndex}`}
                    feature={feature}
                    index={featureIndex}
                    context={item.secondary.title}
                    bulletClassName="bg-slate-500"
                    textClassName="text-sm leading-7 text-slate-800"
                  />
                ))}
                </ul>
              </div>
            </div>
          )}

          {item.note && (
            <div className="mt-3.5 rounded-[1.2rem] border border-slate-300/70 bg-slate-50 px-4 py-2.5">
              <p className="text-sm leading-6 text-slate-700">{item.note}</p>
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={() => onOpenDetails(item)}
              className="details-glow-button w-full rounded-full border border-slate-700 bg-[linear-gradient(135deg,#1f2937_0%,#374151_65%,#6b7280_100%)] px-6 py-2.5 text-lg text-white transition hover:brightness-105"
            >
              Details
            </button>
          </div>

        </div>
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
          <h1 className="text-2xl font-semibold uppercase text-stone-950 md:text-4xl">{title}</h1>
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
              <div className={`mt-16 grid gap-10 ${section.gridClassName}`}>
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
        <section className="border-b border-stone-200 bg-white px-6 py-10 md:py-12">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto h-12 w-full max-w-md rounded-full bg-stone-200" />
            <div className="mx-auto mt-8 h-24 w-full max-w-3xl rounded-[1.5rem] bg-stone-200" />
          </div>
        </section>

        <section className="bg-white px-6 py-16 md:py-20">
          <div className={`mx-auto grid max-w-7xl gap-10 ${gridClassName}`}>
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
      <section className="border-b border-stone-200 bg-white px-6 py-10 md:py-12">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-semibold uppercase text-stone-950 md:text-6xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">{description}</p>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:py-20">
        <div className={`mx-auto grid max-w-7xl gap-10 ${gridClassName}`}>
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
  const getShowcaseName = (item) => {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    if (name) {
      return name;
    }

    switch (item?.link) {
      case '/packages/sonaton':
        return 'Sonaton Package';
      case '/packages/muslim':
        return 'Muslim Package';
      default:
        return 'Packages';
    }
  };

  const getShowcaseImage = (item) => {
    const image = typeof item?.image === 'string' ? item.image.trim() : '';
    if (image) return image;

    switch (item?.link) {
      case '/packages/sonaton':
        return 'https://images.unsplash.com/photo-1523437237164-d442d57cc3c9?auto=format&fit=crop&w=1400&q=80';
      case '/packages/muslim':
        return 'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1400&q=80';
      default:
        return '';
    }
  };

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
                key={item.link}
                type="button"
                onClick={() => navigate(item.link)}
                className="package-showcase-card group text-center"
              >
                <div className="relative min-h-[240px] overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-50 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl sm:min-h-[280px]">
                  {getShowcaseImage(item) ? (
                    <div className="absolute inset-0">
                      <SafeImage
                        src={getShowcaseImage(item)}
                        alt={getShowcaseName(item)}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-stone-200" />
                  )}
                </div>

                <p className="mt-5 text-base font-medium text-stone-900 transition group-hover:text-stone-950 md:text-lg">
                  {getShowcaseName(item)}
                </p>
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
                  {item.image ? (
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="h-36 w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-stone-100 text-stone-400">
                      <Gift className="h-8 w-8" />
                    </div>
                  )}
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
                  <SafeImage
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
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-12 bg-white">
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
                {work.image ? (
                  <SafeImage
                    src={work.image}
                    alt={work.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-100" />
                )}
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

function FloatingWhatsAppButton() {
  const { bookUs } = useSiteContent();
  const bookUsContent = normalizeBookUsContent(bookUs);
  const whatsappLink = createWhatsAppLink(bookUsContent);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const heroSection = document.getElementById('home-hero-slider');

    if (!heroSection) {
      setIsVisible(true);
      return undefined;
    }

    const updateVisibility = () => {
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      setIsVisible(window.scrollY > heroBottom - 32);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  if (!whatsappLink || !isVisible) {
    return null;
  }

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noreferrer"
      aria-label={`Book on WhatsApp at ${bookUsContent.whatsappNumber}`}
      className="group fixed bottom-4 right-4 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200/70 bg-[radial-gradient(circle_at_30%_30%,#ffffff_0%,#ecfdf3_40%,#dcfce7_100%)] shadow-[0_16px_35px_rgba(16,185,129,0.32)] transition duration-300 hover:-translate-y-1 hover:scale-[1.05] hover:shadow-[0_22px_45px_rgba(16,185,129,0.4)] md:bottom-7 md:right-7 md:h-20 md:w-20"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full border border-emerald-300/70 opacity-70 motion-safe:animate-ping"
        style={{ animationDuration: '2.4s' }}
      />
      <span className="pointer-events-none absolute inset-[3px] rounded-full border border-emerald-200/70" />
      <span className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(145deg,#16a34a_0%,#22c55e_55%,#4ade80_100%)] shadow-[0_14px_30px_rgba(5,150,105,0.35)] transition duration-300 group-hover:scale-110 md:h-14 md:w-14">
        <MessageCircle className="h-6 w-6 text-white md:h-8 md:w-8" strokeWidth={2.4} />
      </span>
    </a>
  );
}

function FloatingBookUsButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const heroSection = document.getElementById('home-hero-slider');

    if (!heroSection) {
      setIsVisible(true);
      return undefined;
    }

    const updateVisibility = () => {
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      setIsVisible(window.scrollY > heroBottom - 32);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <a
      href="/book"
      aria-label="Go to book us page"
      className="group fixed bottom-4 left-4 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full border border-sky-200/80 bg-[radial-gradient(circle_at_30%_30%,#ffffff_0%,#eff6ff_42%,#dbeafe_100%)] shadow-[0_16px_35px_rgba(37,99,235,0.28)] transition duration-300 hover:-translate-y-1 hover:scale-[1.05] hover:shadow-[0_22px_45px_rgba(37,99,235,0.36)] md:bottom-7 md:left-7 md:h-20 md:w-20"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full border border-sky-300/80 opacity-70 motion-safe:animate-ping"
        style={{ animationDuration: '2.4s' }}
      />
      <span className="pointer-events-none absolute inset-[3px] rounded-full border border-sky-200/80" />
      <span className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(145deg,#2563eb_0%,#3b82f6_55%,#60a5fa_100%)] px-1 text-center shadow-[0_14px_30px_rgba(37,99,235,0.35)] transition duration-300 group-hover:scale-110 md:h-14 md:w-14">
        <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.08em] text-white md:text-[10px]">
          Book Us
        </span>
      </span>
    </a>
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
    const albumPage = siteContent.featuredAlbums.find((album) => {
      const targetPath = `/sample-works/${album.slug}`;
      return pathname === targetPath || decodeURIComponent(pathname) === targetPath;
    });

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
          {!isAdminRoute && <FloatingBookUsButton />}
          {!isAdminRoute && <FloatingWhatsAppButton />}
          <Footer navigate={navigate} />
        </div>
      </SiteContentContext.Provider>
    </SiteContentReadyContext.Provider>
  );
}
