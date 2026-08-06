export type PackagePriceAudience = 'b2c' | 'b2b';

export type PackagePricingFields = {
  base_price?: number | string | null;
  b2b_price?: number | string | null;
  offer_enabled?: boolean | null;
  offer_name?: string | null;
  b2c_offer_price?: number | string | null;
  b2b_offer_price?: number | string | null;
};

function amount(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getNormalPackagePrice(pkg: PackagePricingFields, audience: PackagePriceAudience) {
  return amount(audience === 'b2c' ? pkg.base_price : pkg.b2b_price);
}

export function getOfferPackagePrice(pkg: PackagePricingFields, audience: PackagePriceAudience) {
  return amount(audience === 'b2c' ? pkg.b2c_offer_price : pkg.b2b_offer_price);
}

export function isPackageOfferActive(pkg: PackagePricingFields, audience: PackagePriceAudience = 'b2c') {
  const label = String(pkg.offer_name || '').trim();
  const b2cNormal = getNormalPackagePrice(pkg, 'b2c');
  const b2bNormal = getNormalPackagePrice(pkg, 'b2b');
  const b2cOffer = getOfferPackagePrice(pkg, 'b2c');
  const b2bOffer = getOfferPackagePrice(pkg, 'b2b');
  const audienceOfferIsValid = audience === 'b2c'
    ? b2cOffer > 0 && b2cOffer < b2cNormal
    : b2bOffer > 0 && b2bOffer < b2bNormal && (b2cOffer <= 0 || b2bOffer <= b2cOffer);
  return pkg.offer_enabled === true
    && label.length >= 2 && label.length <= 40
    && audienceOfferIsValid;
}

export function getEffectivePackagePrice(pkg: PackagePricingFields, audience: PackagePriceAudience) {
  return isPackageOfferActive(pkg, audience) ? getOfferPackagePrice(pkg, audience) : getNormalPackagePrice(pkg, audience);
}

export function getPackageSavings(pkg: PackagePricingFields, audience: PackagePriceAudience) {
  return isPackageOfferActive(pkg, audience) ? getNormalPackagePrice(pkg, audience) - getOfferPackagePrice(pkg, audience) : 0;
}

export function getPackagePricePresentation(pkg: PackagePricingFields, audience: PackagePriceAudience) {
  const active = isPackageOfferActive(pkg, audience);
  const normalPrice = getNormalPackagePrice(pkg, audience);
  const offerPrice = getOfferPackagePrice(pkg, audience);
  return {
    active,
    label: active ? String(pkg.offer_name).trim() : '',
    normalPrice,
    offerPrice: active ? offerPrice : null,
    effectivePrice: active ? offerPrice : normalPrice,
    savings: active ? normalPrice - offerPrice : 0
  };
}
