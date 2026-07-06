import { getCategoryPackageImage, getPackageImageBySlug } from './edrive-package-images';

export type PublicPackageCategory = 'jet-ski' | 'jet-car' | 'combo' | 'family' | 'vip';

export type PublicPackage = {
  slug: string;
  name: string;
  category: PublicPackageCategory;
  badge?: string;
  duration: string;
  priceLabel: string;
  bestFor: string;
  description: string;
  image: string;
};

type PublicPackageContent = Omit<PublicPackage, 'image'>;

export const packageCategoryLabels: Record<PublicPackageCategory, string> = {
  'jet-ski': 'Jet Ski',
  'jet-car': 'Jet Car',
  combo: 'Combo',
  family: 'Family / Group',
  vip: 'VIP / Premium'
};

export const packageCategoryDescriptions: Record<PublicPackageCategory, string> = {
  'jet-ski': 'High-energy jet ski rental packages in Dubai for solo riders, couples, and guided coastline tours.',
  'jet-car': 'Luxury jet car rental Dubai experiences made for photos, celebrations, and relaxed marine cruising.',
  combo: 'Jet ski and jet car packages Dubai guests can combine into one easy Dubai Islands water sports plan.',
  family: 'Flexible water sports Dubai packages for families, friends, birthdays, groups, and corporate days.',
  vip: 'Private, premium Dubai marine experiences with elevated support, sunset timing, and custom planning.'
};

export const packageCategoryImageFallbacks: Record<PublicPackageCategory, string> = {
  'jet-ski': getCategoryPackageImage('jet-ski', 0),
  'jet-car': getCategoryPackageImage('jet-car', 0),
  combo: getCategoryPackageImage('combo', 0),
  family: getCategoryPackageImage('family', 0),
  vip: getCategoryPackageImage('vip', 0)
};

export const publicPackageCategories: PublicPackageCategory[] = ['jet-ski', 'jet-car', 'combo', 'family', 'vip'];

const publicPackageData: PublicPackageContent[] = [
  {
    slug: 'dubai-islands-quick-splash',
    name: 'Dubai Islands Quick Splash',
    category: 'jet-ski',
    badge: 'Popular',
    duration: '30 minutes',
    priceLabel: 'From AED 300',
    bestFor: 'Beginners, solo riders, quick rides',
    description: 'A short jet ski Dubai Islands ride with premium dock support, ideal for first-time guests who want instant water sports energy.'
  },
  {
    slug: 'marina-rush-jet-ski',
    name: 'Marina Rush Jet Ski',
    category: 'jet-ski',
    badge: 'Popular',
    duration: '60 minutes',
    priceLabel: 'From AED 450',
    bestFor: 'Adrenaline seekers and skyline photos',
    description: 'A lively jet ski rental Dubai route with open-water bursts, skyline views, and a confident guided pace.'
  },
  {
    slug: 'burj-al-arab-photo-ride',
    name: 'Burj Al Arab Photo Ride',
    category: 'jet-ski',
    badge: 'Photo Friendly',
    duration: '90 minutes',
    priceLabel: 'From AED 600',
    bestFor: 'Iconic Dubai photo moments',
    description: 'A premium jet ski ride shaped around smooth cruising and memorable Burj Al Arab photo stops when conditions allow.'
  },
  {
    slug: 'atlantis-wave-explorer',
    name: 'Atlantis Wave Explorer',
    category: 'jet-ski',
    badge: 'Explorer',
    duration: '90 minutes',
    priceLabel: 'From AED 600',
    bestFor: 'Palm views and guided exploring',
    description: 'A scenic jet ski Dubai experience for guests who want a broader coastline ride and premium route guidance.'
  },
  {
    slug: 'palm-jumeirah-jet-ski-tour',
    name: 'Palm Jumeirah Jet Ski Tour',
    category: 'jet-ski',
    badge: 'Tour',
    duration: '120 minutes',
    priceLabel: 'From AED 700',
    bestFor: 'Longer touring and Dubai landmarks',
    description: 'A relaxed luxury jet ski rental Dubai tour with more time on the water and a polished Palm Jumeirah feel.'
  },
  {
    slug: 'sunrise-jet-ski-ride',
    name: 'Sunrise Jet Ski Ride',
    category: 'jet-ski',
    badge: 'Sunrise',
    duration: '60 minutes',
    priceLabel: 'Ask for price',
    bestFor: 'Early riders and calm water',
    description: 'A peaceful early ride with soft Dubai light, cooler conditions, and a smooth start to the day on the water.'
  },
  {
    slug: 'golden-hour-jet-ski',
    name: 'Golden Hour Jet Ski',
    category: 'jet-ski',
    badge: 'Sunset',
    duration: '60 minutes',
    priceLabel: 'From AED 450',
    bestFor: 'Couples, friends, evening photos',
    description: 'A warm golden-hour jet ski session designed for flattering photos, premium views, and an easy Dubai Islands departure.'
  },
  {
    slug: 'sunset-splash-experience',
    name: 'Sunset Splash Experience',
    category: 'jet-ski',
    badge: 'Sunset',
    duration: '90 minutes',
    priceLabel: 'From AED 600',
    bestFor: 'Evening adventures and content',
    description: 'A sunset-focused water sports Dubai package with extra time for relaxed cruising and picture-ready moments.'
  },
  {
    slug: 'couple-jet-ski-escape',
    name: 'Couple Jet Ski Escape',
    category: 'jet-ski',
    badge: 'Couple',
    duration: '60 minutes',
    priceLabel: 'From AED 450',
    bestFor: 'Couples and anniversary rides',
    description: 'A couple-friendly jet ski Dubai ride with clear support, smooth timing, and an easy booking path for two.'
  },
  {
    slug: 'friends-water-adventure',
    name: 'Friends Water Adventure',
    category: 'jet-ski',
    badge: 'Group',
    duration: '60 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Small friend groups',
    description: 'A lively group-friendly jet ski rental Dubai package for friends who want shared energy and simple coordination.'
  },
  {
    slug: 'solo-rider-express',
    name: 'Solo Rider Express',
    category: 'jet-ski',
    badge: 'Solo',
    duration: '30 minutes',
    priceLabel: 'From AED 300',
    bestFor: 'Solo guests and quick sessions',
    description: 'A focused ride for solo guests who want a premium jet ski session without needing a long schedule.'
  },
  {
    slug: 'dubai-skyline-jet-ski-tour',
    name: 'Dubai Skyline Jet Ski Tour',
    category: 'jet-ski',
    badge: 'Photo Friendly',
    duration: '90 minutes',
    priceLabel: 'From AED 600',
    bestFor: 'Skyline photos and touring',
    description: 'A guided Dubai skyline route combining jet ski excitement with wide waterfront views and premium photo opportunities.'
  },
  {
    slug: '30-minute-adrenaline-ride',
    name: '30-Minute Adrenaline Ride',
    category: 'jet-ski',
    badge: 'Best Value',
    duration: '30 minutes',
    priceLabel: 'From AED 300',
    bestFor: 'Fast rides and first timers',
    description: 'A compact jet ski package with quick acceleration, safety briefing, and a smooth first taste of Dubai water sports.'
  },
  {
    slug: '60-minute-explorer-ride',
    name: '60-Minute Explorer Ride',
    category: 'jet-ski',
    badge: 'Best Value',
    duration: '60 minutes',
    priceLabel: 'From AED 450',
    bestFor: 'Balanced ride time',
    description: 'A balanced jet ski rental package with enough time for cruising, photos, and a proper Dubai Islands marine experience.'
  },
  {
    slug: '90-minute-premium-coast-ride',
    name: '90-Minute Premium Coast Ride',
    category: 'jet-ski',
    badge: 'Premium',
    duration: '90 minutes',
    priceLabel: 'From AED 600',
    bestFor: 'Longer coast rides',
    description: 'A premium coast ride for guests who want extra time, guided comfort, and a more complete jet ski Dubai route.'
  },
  {
    slug: '120-minute-ultimate-jet-ski-tour',
    name: '120-Minute Ultimate Jet Ski Tour',
    category: 'jet-ski',
    badge: 'Premium',
    duration: '120 minutes',
    priceLabel: 'From AED 700',
    bestFor: 'Full jet ski touring',
    description: 'A longer luxury jet ski rental Dubai tour built for guests who want landmark views and a complete water sports session.'
  },
  {
    slug: 'beginner-friendly-jet-ski-ride',
    name: 'Beginner Friendly Jet Ski Ride',
    category: 'jet-ski',
    badge: 'Beginner Friendly',
    duration: '30 minutes',
    priceLabel: 'From AED 300',
    bestFor: 'First-time riders',
    description: 'A supportive beginner jet ski ride with safety briefing, steady guidance, and a confidence-building pace.'
  },
  {
    slug: 'vip-guided-jet-ski-experience',
    name: 'VIP Guided Jet Ski Experience',
    category: 'jet-ski',
    badge: 'VIP',
    duration: '90 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Private guided sessions',
    description: 'A private guided jet ski Dubai experience with elevated timing support and a more personal premium route.'
  },
  {
    slug: 'dubai-jet-car-cruise',
    name: 'Dubai Jet Car Cruise',
    category: 'jet-car',
    badge: 'Popular',
    duration: '30 minutes',
    priceLabel: 'From AED 700',
    bestFor: 'First jet car ride and photos',
    description: 'A signature jet car rental Dubai cruise with luxury water-car styling, captain support, and easy photo moments.'
  },
  {
    slug: 'luxury-water-car-experience',
    name: 'Luxury Water Car Experience',
    category: 'jet-car',
    badge: 'Popular',
    duration: '60 minutes',
    priceLabel: 'From AED 1,200',
    bestFor: 'Luxury cruising and couples',
    description: 'A refined jet car Dubai experience with comfortable pacing, premium marina views, and standout water-level presence.'
  },
  {
    slug: 'jet-car-photo-session-ride',
    name: 'Jet Car Photo Session Ride',
    category: 'jet-car',
    badge: 'Photo Friendly',
    duration: '60 minutes',
    priceLabel: 'Ask for price',
    bestFor: 'Content, birthdays, influencers',
    description: 'A photo-friendly jet car ride planned around clean angles, calm pauses, and a polished Dubai marine backdrop.'
  },
  {
    slug: 'couple-jet-car-experience',
    name: 'Couple Jet Car Experience',
    category: 'jet-car',
    badge: 'Couple',
    duration: '60 minutes',
    priceLabel: 'From AED 1,200',
    bestFor: 'Couples and special dates',
    description: 'A private couple jet car Dubai cruise for guests who want comfort, style, and a memorable shared ride.'
  },
  {
    slug: 'vip-jet-car-drive',
    name: 'VIP Jet Car Drive',
    category: 'jet-car',
    badge: 'VIP',
    duration: '90 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'VIP clients and private hosts',
    description: 'A VIP jet car experience with premium support, flexible pacing, and a luxury-first Dubai waterfront feel.'
  },
  {
    slug: 'sunset-jet-car-cruise',
    name: 'Sunset Jet Car Cruise',
    category: 'jet-car',
    badge: 'Sunset',
    duration: '60 minutes',
    priceLabel: 'From AED 1,200',
    bestFor: 'Golden-hour jet car photos',
    description: 'A sunset jet car cruise that pairs luxury water-car presence with soft evening light and relaxed route planning.'
  },
  {
    slug: 'dubai-islands-jet-car-tour',
    name: 'Dubai Islands Jet Car Tour',
    category: 'jet-car',
    badge: 'Tour',
    duration: '90 minutes',
    priceLabel: 'From AED 1,700',
    bestFor: 'Dubai Islands exploring',
    description: 'A premium Dubai Islands jet car tour for guests who want longer cruising and a distinctive marine experience.'
  },
  {
    slug: 'marina-view-jet-car-ride',
    name: 'Marina View Jet Car Ride',
    category: 'jet-car',
    badge: 'Photo Friendly',
    duration: '60 minutes',
    priceLabel: 'From AED 1,200',
    bestFor: 'Marina views and relaxed cruising',
    description: 'A stylish jet car ride with a calm marina pace, great water-level views, and premium support throughout.'
  },
  {
    slug: 'premium-sports-jet-car-ride',
    name: 'Premium Sports Jet Car Ride',
    category: 'jet-car',
    badge: 'Premium',
    duration: '60 minutes',
    priceLabel: 'From AED 1,200',
    bestFor: 'Luxury sports styling',
    description: 'A sporty jet car rental package designed for guests who want statement visuals and smooth Dubai marine cruising.'
  },
  {
    slug: '30-minute-jet-car-trial',
    name: '30-Minute Jet Car Trial',
    category: 'jet-car',
    badge: 'Best Value',
    duration: '30 minutes',
    priceLabel: 'From AED 700',
    bestFor: 'Trying the jet car',
    description: 'A short trial-style jet car Dubai ride for guests who want the look, the photos, and a quick luxury cruise.'
  },
  {
    slug: '60-minute-jet-car-experience',
    name: '60-Minute Jet Car Experience',
    category: 'jet-car',
    badge: 'Best Value',
    duration: '60 minutes',
    priceLabel: 'From AED 1,200',
    bestFor: 'Balanced jet car ride time',
    description: 'A balanced one-hour jet car rental Dubai package with enough time for cruising, photos, and relaxed enjoyment.'
  },
  {
    slug: '90-minute-jet-car-adventure',
    name: '90-Minute Jet Car Adventure',
    category: 'jet-car',
    badge: 'Adventure',
    duration: '90 minutes',
    priceLabel: 'From AED 1,700',
    bestFor: 'Extended jet car cruising',
    description: 'An extended jet car adventure with more waterfront time and a flexible route for special occasions or content.'
  },
  {
    slug: '120-minute-ultimate-jet-car-cruise',
    name: '120-Minute Ultimate Jet Car Cruise',
    category: 'jet-car',
    badge: 'Premium',
    duration: '120 minutes',
    priceLabel: 'From AED 2,100',
    bestFor: 'Long luxury cruises',
    description: 'A full-length jet car Dubai cruise for guests who want maximum time, comfort, and a premium marine arrival.'
  },
  {
    slug: 'birthday-jet-car-experience',
    name: 'Birthday Jet Car Experience',
    category: 'jet-car',
    badge: 'Birthday',
    duration: '60 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Birthdays and celebrations',
    description: 'A celebration-ready jet car package with easy coordination, photo-friendly timing, and a premium birthday feel.'
  },
  {
    slug: 'jet-ski-jet-car-combo',
    name: 'Jet Ski + Jet Car Combo',
    category: 'combo',
    badge: 'Popular',
    duration: '60-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Guests who want both experiences',
    description: 'A simple jet ski and jet car package Dubai visitors can book together for a complete eDrive water sports day.'
  },
  {
    slug: 'couple-luxury-water-combo',
    name: 'Couple Luxury Water Combo',
    category: 'combo',
    badge: 'Couple',
    duration: '90-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Couples and special trips',
    description: 'A couple-focused combo pairing jet ski excitement with a luxury jet car cruise for a memorable Dubai date.'
  },
  {
    slug: 'friends-adventure-combo',
    name: 'Friends Adventure Combo',
    category: 'combo',
    badge: 'Group',
    duration: '90-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Friends and small groups',
    description: 'A high-energy combo for friends who want variety, shared photos, and a premium Dubai Islands water sports plan.'
  },
  {
    slug: 'dubai-islands-combo-ride',
    name: 'Dubai Islands Combo Ride',
    category: 'combo',
    badge: 'Best Value',
    duration: '60-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Dubai Islands visitors',
    description: 'A flexible combo ride based at Dubai Islands, blending jet ski motion with jet car style in one itinerary.'
  },
  {
    slug: 'sunset-combo-experience',
    name: 'Sunset Combo Experience',
    category: 'combo',
    badge: 'Sunset',
    duration: '90-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Golden-hour groups and couples',
    description: 'A sunset combo package for guests who want beautiful light, water sports energy, and luxury jet car presence.'
  },
  {
    slug: 'vip-marine-combo',
    name: 'VIP Marine Combo',
    category: 'combo',
    badge: 'VIP',
    duration: 'Custom duration',
    priceLabel: 'Custom quote',
    bestFor: 'Private VIP bookings',
    description: 'A private marine combo with elevated planning, preferred timings, and premium support from arrival to finish.'
  },
  {
    slug: 'family-water-sports-combo',
    name: 'Family Water Sports Combo',
    category: 'combo',
    badge: 'Family',
    duration: '90-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Families and mixed ages',
    description: 'A family-friendly combo with clear coordination, flexible pacing, and experiences selected around comfort and fun.'
  },
  {
    slug: 'ultimate-edrive-experience',
    name: 'Ultimate eDrive Experience',
    category: 'combo',
    badge: 'Premium',
    duration: 'Custom duration',
    priceLabel: 'Custom quote',
    bestFor: 'Guests who want the full offer',
    description: 'The most complete eDrive package, combining premium ride planning, jet ski energy, and luxury jet car cruising.'
  },
  {
    slug: 'family-splash-day',
    name: 'Family Splash Day',
    category: 'family',
    badge: 'Family',
    duration: '60-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Families with flexible needs',
    description: 'A family water sports Dubai package built around comfort, clear support, and easy scheduling for all guests.'
  },
  {
    slug: 'group-adventure-ride',
    name: 'Group Adventure Ride',
    category: 'family',
    badge: 'Group',
    duration: '60-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Groups and friends',
    description: 'A coordinated group ride for Dubai visitors who want a simple plan, multiple guests, and premium water support.'
  },
  {
    slug: 'friends-weekend-package',
    name: 'Friends Weekend Package',
    category: 'family',
    badge: 'Group',
    duration: '60-120 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Weekend plans',
    description: 'A weekend-ready package for friends who want Dubai water sports, flexible timing, and easy WhatsApp coordination.'
  },
  {
    slug: 'birthday-group-experience',
    name: 'Birthday Group Experience',
    category: 'family',
    badge: 'Birthday',
    duration: 'Custom group timing',
    priceLabel: 'Custom quote',
    bestFor: 'Birthday groups',
    description: 'A celebration package for birthdays, with group planning support and ride options shaped around the occasion.'
  },
  {
    slug: 'corporate-water-sports-day',
    name: 'Corporate Water Sports Day',
    category: 'family',
    badge: 'Corporate',
    duration: 'Custom group timing',
    priceLabel: 'Custom quote',
    bestFor: 'Teams and company outings',
    description: 'A corporate water sports Dubai experience with practical group coordination, premium presentation, and team-friendly timing.'
  },
  {
    slug: 'vip-sunset-marine-experience',
    name: 'VIP Sunset Marine Experience',
    category: 'vip',
    badge: 'VIP',
    duration: '90-180 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Sunset VIP bookings',
    description: 'A VIP sunset marine experience with preferred timing, polished support, and a premium Dubai Islands atmosphere.'
  },
  {
    slug: 'private-guided-water-tour',
    name: 'Private Guided Water Tour',
    category: 'vip',
    badge: 'Private',
    duration: '90-180 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Private guided touring',
    description: 'A private guided water tour for guests who want a tailored Dubai marine route and attentive support.'
  },
  {
    slug: 'premium-photo-video-ride',
    name: 'Premium Photo & Video Ride',
    category: 'vip',
    badge: 'Photo Friendly',
    duration: '90-180 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Content-focused guests',
    description: 'A premium photo and video ride planned around timing, route, and smooth moments for standout Dubai content.'
  },
  {
    slug: 'luxury-couple-marine-ride',
    name: 'Luxury Couple Marine Ride',
    category: 'vip',
    badge: 'Couple',
    duration: '90-180 minutes',
    priceLabel: 'Custom quote',
    bestFor: 'Luxury couples and proposals',
    description: 'A luxury couple marine ride with private-feeling support, beautiful timing, and refined Dubai water sports details.'
  },
  {
    slug: 'full-premium-edrive-day',
    name: 'Full Premium eDrive Day',
    category: 'vip',
    badge: 'Premium',
    duration: 'Custom VIP timing',
    priceLabel: 'Custom quote',
    bestFor: 'Full premium planning',
    description: 'A complete premium eDrive day for VIP guests who want custom timing, multiple ride styles, and elevated service.'
  }
];

export const publicPackages: PublicPackage[] = publicPackageData.map((item) => ({
  ...item,
  image: getPackageImageBySlug(item.slug) || packageCategoryImageFallbacks[item.category]
}));

export const featuredPackageSlugs = [
  'marina-rush-jet-ski',
  'burj-al-arab-photo-ride',
  'luxury-water-car-experience',
  'couple-luxury-water-combo',
  'vip-sunset-marine-experience',
  'family-splash-day',
  'dubai-jet-car-cruise',
  'ultimate-edrive-experience'
];

export const popularPackageSlugs = [
  'marina-rush-jet-ski',
  'burj-al-arab-photo-ride',
  'golden-hour-jet-ski',
  'dubai-jet-car-cruise',
  'luxury-water-car-experience',
  'jet-ski-jet-car-combo',
  'family-splash-day',
  'vip-sunset-marine-experience'
];

export function getPublicPackageBySlug(slug: string | null | undefined) {
  if (!slug) return undefined;
  return publicPackages.find((item) => item.slug === slug);
}

export function getPackagesByCategory(category: PublicPackageCategory) {
  return publicPackages.filter((item) => item.category === category);
}

export function getPackagesBySlugs(slugs: string[]) {
  const packageMap = new Map(publicPackages.map((item) => [item.slug, item]));
  return slugs.map((slug) => packageMap.get(slug)).filter((item): item is PublicPackage => Boolean(item));
}

export function getBookingHref(packageSlug: string) {
  return `/booking?package=${encodeURIComponent(packageSlug)}`;
}
