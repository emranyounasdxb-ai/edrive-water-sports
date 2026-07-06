export type PackageImageCategory = 'jet-ski' | 'jet-car' | 'combo' | 'family' | 'vip';

type PackageLike = {
  slug: string;
  category: PackageImageCategory;
  image?: string | null;
};

const jetSkiBase = '/images/edrive/packages/jet-ski';
const jetCarBase = '/images/edrive/packages/jet-car';

function formatNumber(value: number) {
  return String(value).padStart(2, '0');
}

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

export const jetSkiPackageImages = Array.from(
  { length: 49 },
  (_, index) => `${jetSkiBase}/jet-ski-package-${formatNumber(index + 1)}.webp`
);

export const jetCarPackageImages = Array.from(
  { length: 21 },
  (_, index) => `${jetCarBase}/jet-car-package-${formatNumber(index + 1)}.webp`
);

export function getJetSkiPackageImage(index = 0) {
  return jetSkiPackageImages[normalizeIndex(index, jetSkiPackageImages.length)];
}

export function getJetCarPackageImage(index = 0) {
  return jetCarPackageImages[normalizeIndex(index, jetCarPackageImages.length)];
}

export const packageImageBySlug: Record<string, string> = {
  'dubai-islands-quick-splash': getJetSkiPackageImage(0),
  'marina-rush-jet-ski': getJetSkiPackageImage(1),
  'burj-al-arab-photo-ride': getJetSkiPackageImage(2),
  'atlantis-wave-explorer': getJetSkiPackageImage(3),
  'palm-jumeirah-jet-ski-tour': getJetSkiPackageImage(4),
  'sunrise-jet-ski-ride': getJetSkiPackageImage(5),
  'golden-hour-jet-ski': getJetSkiPackageImage(6),
  'sunset-splash-experience': getJetSkiPackageImage(7),
  'couple-jet-ski-escape': getJetSkiPackageImage(8),
  'friends-water-adventure': getJetSkiPackageImage(9),
  'solo-rider-express': getJetSkiPackageImage(10),
  'dubai-skyline-jet-ski-tour': getJetSkiPackageImage(11),
  '30-minute-adrenaline-ride': getJetSkiPackageImage(12),
  '60-minute-explorer-ride': getJetSkiPackageImage(13),
  '90-minute-premium-coast-ride': getJetSkiPackageImage(14),
  '120-minute-ultimate-jet-ski-tour': getJetSkiPackageImage(15),
  'beginner-friendly-jet-ski-ride': getJetSkiPackageImage(16),
  'vip-guided-jet-ski-experience': getJetSkiPackageImage(17),

  'dubai-jet-car-cruise': getJetCarPackageImage(0),
  'luxury-water-car-experience': getJetCarPackageImage(1),
  'jet-car-photo-session-ride': getJetCarPackageImage(2),
  'couple-jet-car-experience': getJetCarPackageImage(3),
  'vip-jet-car-drive': getJetCarPackageImage(4),
  'sunset-jet-car-cruise': getJetCarPackageImage(5),
  'dubai-islands-jet-car-tour': getJetCarPackageImage(6),
  'marina-view-jet-car-ride': getJetCarPackageImage(7),
  'premium-sports-jet-car-ride': getJetCarPackageImage(8),
  '30-minute-jet-car-trial': getJetCarPackageImage(9),
  '60-minute-jet-car-experience': getJetCarPackageImage(10),
  '90-minute-jet-car-adventure': getJetCarPackageImage(11),
  '120-minute-ultimate-jet-car-cruise': getJetCarPackageImage(12),
  'birthday-jet-car-experience': getJetCarPackageImage(13),

  'jet-ski-jet-car-combo': getJetSkiPackageImage(18),
  'couple-luxury-water-combo': getJetCarPackageImage(14),
  'friends-adventure-combo': getJetSkiPackageImage(19),
  'dubai-islands-combo-ride': getJetCarPackageImage(15),
  'sunset-combo-experience': getJetSkiPackageImage(20),
  'vip-marine-combo': getJetCarPackageImage(16),
  'family-water-sports-combo': getJetSkiPackageImage(21),
  'ultimate-edrive-experience': getJetCarPackageImage(17),

  'family-splash-day': getJetSkiPackageImage(22),
  'group-adventure-ride': getJetCarPackageImage(18),
  'friends-weekend-package': getJetSkiPackageImage(23),
  'birthday-group-experience': getJetCarPackageImage(19),
  'corporate-water-sports-day': getJetSkiPackageImage(24),

  'vip-sunset-marine-experience': getJetSkiPackageImage(25),
  'private-guided-water-tour': getJetCarPackageImage(20),
  'premium-photo-video-ride': getJetSkiPackageImage(26),
  'luxury-couple-marine-ride': getJetSkiPackageImage(27),
  'full-premium-edrive-day': getJetSkiPackageImage(28)
};

export function getPackageImageBySlug(slug: string) {
  return packageImageBySlug[slug];
}

export function getCategoryPackageImage(category: PackageImageCategory, index = 0) {
  if (category === 'jet-ski') return getJetSkiPackageImage(index);
  if (category === 'jet-car') return getJetCarPackageImage(index);

  if (category === 'combo') {
    const comboImages = [
      getJetSkiPackageImage(18),
      getJetCarPackageImage(14),
      getJetSkiPackageImage(19),
      getJetCarPackageImage(15),
      getJetSkiPackageImage(20),
      getJetCarPackageImage(16),
      getJetSkiPackageImage(21),
      getJetCarPackageImage(17)
    ];
    return comboImages[normalizeIndex(index, comboImages.length)];
  }

  if (category === 'family') {
    const familyImages = [
      getJetSkiPackageImage(22),
      getJetCarPackageImage(18),
      getJetSkiPackageImage(23),
      getJetCarPackageImage(19),
      getJetSkiPackageImage(24)
    ];
    return familyImages[normalizeIndex(index, familyImages.length)];
  }

  const vipImages = [
    getJetSkiPackageImage(25),
    getJetCarPackageImage(20),
    getJetSkiPackageImage(26),
    getJetSkiPackageImage(27),
    getJetSkiPackageImage(28)
  ];
  return vipImages[normalizeIndex(index, vipImages.length)];
}

export function getPackageImage(packageItem: PackageLike, index = 0) {
  return getPackageImageBySlug(packageItem.slug) || getCategoryPackageImage(packageItem.category, index) || packageItem.image || '';
}

export function getLivePackageImage(category: string, seed = 0) {
  if (category === 'jet_ski_rental') return getJetSkiPackageImage(seed);
  if (category === 'jet_car_rental') return getJetCarPackageImage(seed);
  return getJetSkiPackageImage(seed);
}
