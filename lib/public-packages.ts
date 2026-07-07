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

export const packageCategoryLabels: Record<PublicPackageCategory, string> = {
  'jet-ski': 'Jet Ski',
  'jet-car': 'Jet Car',
  combo: 'Combo',
  family: 'Family / Group',
  vip: 'VIP / Premium'
};

export const packageCategoryDescriptions: Record<PublicPackageCategory, string> = {
  'jet-ski': 'Jet ski water sports experiences.',
  'jet-car': 'Jet car water sports experiences.',
  combo: 'Combined water sports experiences.',
  family: 'Family and group water sports experiences.',
  vip: 'VIP and premium water sports experiences.'
};

export const publicPackageCategories: PublicPackageCategory[] = [];
export const publicPackages: PublicPackage[] = [];
export const popularPackageSlugs: string[] = [];

export function getPublicPackageBySlug(slug?: string | null) {
  if (!slug) return null;
  return publicPackages.find((packageItem) => packageItem.slug === slug) ?? null;
}

export function getPackagesByCategory(category: PublicPackageCategory) {
  return publicPackages.filter((packageItem) => packageItem.category === category);
}

export function getPackagesBySlugs(slugs: string[]) {
  return slugs.map((slug) => getPublicPackageBySlug(slug)).filter(Boolean) as PublicPackage[];
}

export function getBookingHref(slug: string) {
  return `/booking?package=${encodeURIComponent(slug)}`;
}
