const publicImageOverrides: Record<string, string> = {
  'jc-01-1784787349440-ff5a3c33.png': '/images/edrive/optimized/jc-01.webp',
  'jc-02-1784787373151-52c6f274.png': '/images/edrive/optimized/jc-02.webp',
  'jc-03-1784787390536-1174d1cf.png': '/images/edrive/optimized/jc-03.webp',
  'jc-04-1784787407735-acbab058.png': '/images/edrive/optimized/jc-04.webp',
  'js-01-1784787466599-b074a243.png': '/images/edrive/optimized/js-01.webp',
  'js-02-1784787484974-6248e417.png': '/images/edrive/optimized/js-02.webp',
  'jet-car-2-seater-20-min-1784892534634-4ea6f595.png': '/images/edrive/optimized/jet-car-2-seater-20-min.webp',
  'jet-car-2-seater-30-min-1784892549257-7e3281c7.png': '/images/edrive/optimized/jet-car-2-seater-30-min.webp',
  'jet-car-2-seater-60-min-1784892561481-9ea66a08.png': '/images/edrive/optimized/jet-car-2-seater-60-min.webp',
  'jet-car-4-seater-20-min-1784892578312-4187f20f.png': '/images/edrive/optimized/jet-car-4-seater-20-min.webp',
  'jet-ski-30-minutes-1784892438058-bc182ff1.png': '/images/edrive/optimized/jet-ski-30-minutes.webp',
  'jet-ski-60-minutes-1784892456033-958e189a.png': '/images/edrive/optimized/jet-ski-60-minutes.webp',
  'jet-ski-90-minutes-1784892477753-536596ec.png': '/images/edrive/optimized/jet-ski-90-minutes.webp'
};

export function getPublicImageUrl(source: string | null | undefined) {
  const original = String(source || '').trim();
  if (!original) return original;

  const filename = original.split(/[?#]/, 1)[0]?.split('/').pop() || '';
  return publicImageOverrides[filename] || original;
}
