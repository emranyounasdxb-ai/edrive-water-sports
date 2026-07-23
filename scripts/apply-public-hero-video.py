from pathlib import Path
import re

pages_path = Path('components/edrive/public-pages.tsx')
hero_css_path = Path('app/hero-cta.css')
guard_path = Path('scripts/production-guard.mjs')

pages = pages_path.read_text(encoding='utf-8')
hero_css = hero_css_path.read_text(encoding='utf-8')
guard = guard_path.read_text(encoding='utf-8')

import_marker = "import { LivePackageShowcase } from './live-package-showcase';\nimport { MotionReveal } from './motion-reveal';"
import_replacement = "import { HeroVideoMedia } from './hero-video-media';\nimport { LivePackageShowcase } from './live-package-showcase';\nimport { MotionReveal } from './motion-reveal';\nimport { PublicVideoHero, publicHeroContentClass, publicHeroFrameClass, type PublicHeroAction } from './public-video-hero';"
if import_marker not in pages:
    raise SystemExit('public-pages import marker not found')
pages = pages.replace(import_marker, import_replacement, 1)

constants_marker = "const sectionPad = 'py-10 sm:py-12 lg:py-14';\nconst publicHeroFrameClass = 'relative isolate min-h-[600px] overflow-hidden bg-primary-900 text-white sm:min-h-[620px] lg:min-h-[640px] xl:min-h-[680px]';\nconst publicHeroContentClass = 'container-x relative flex min-h-[600px] items-center pb-10 pt-28 sm:min-h-[620px] sm:pb-12 sm:pt-28 lg:min-h-[640px] lg:pb-14 lg:pt-24 xl:min-h-[680px]';"
if constants_marker not in pages:
    raise SystemExit('public hero constants marker not found')
pages = pages.replace(constants_marker, "const sectionPad = 'py-10 sm:py-12 lg:py-14';", 1)

pages, count = re.subn(
    r"type HeroAction = \{.*?\n\};",
    "type HeroAction = PublicHeroAction;",
    pages,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'HeroAction replacement count={count}')

home_image = '<Image src={dubaiWaterfrontImage} alt="Jet ski and jet car riding across the Dubai waterfront" fill priority data-public-hero-image className="object-cover object-[68%_68%]" sizes="100vw" />'
home_video = '<HeroVideoMedia fallbackImage={dubaiWaterfrontImage} fallbackAlt="Jet ski and jet car riding across the Dubai waterfront" priority objectPosition="object-[68%_68%]" />'
if home_image not in pages:
    raise SystemExit('Home hero image marker not found')
pages = pages.replace(home_image, home_video, 1)

new_public_hero = """function PublicHero({ title, text, image, imageAlt, actions = [] }: { title: string; text: string; image: string; imageAlt: string; actions?: HeroAction[] }) {
  return <PublicVideoHero title={title} text={text} fallbackImage={image} fallbackAlt={imageAlt} actions={actions} />;
}

"""
pages, count = re.subn(
    r"function PublicHero\(\{ title, text, image, imageAlt, actions = \[\] \}:.*?\nfunction HeroButton\(\{ action \}: \{ action: HeroAction \}\) \{.*?\n\}\n\n",
    new_public_hero,
    pages,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'PublicHero/HeroButton replacement count={count}')

pages_path.write_text(pages, encoding='utf-8')

image_rule = """[data-public-main] > [data-public-hero]:first-of-type > [data-public-hero-image] {
  z-index: 0;
  opacity: 1 !important;
}"""
video_rule = """[data-public-main] > [data-public-hero]:first-of-type > [data-public-hero-image],
[data-public-main] > [data-public-hero]:first-of-type > [data-public-hero-video] {
  z-index: 0;
  opacity: 1 !important;
}

[data-public-main] > [data-public-hero]:first-of-type > [data-public-hero-video] {
  pointer-events: none;
}"""
if image_rule not in hero_css:
    raise SystemExit('hero image visibility rule not found')
hero_css = hero_css.replace(image_rule, video_rule, 1)

reduced_motion = """
@media (prefers-reduced-motion: reduce) {
  [data-public-main] > [data-public-hero]:first-of-type > [data-public-hero-video] {
    display: none;
  }
}
"""
if 'prefers-reduced-motion: reduce' not in hero_css:
    hero_css = hero_css.rstrip() + '\n' + reduced_motion

hero_css_path.write_text(hero_css, encoding='utf-8')

guard_import_marker = "const publicPages = read('components/edrive/public-pages.tsx');\nconst heroCtaStyles = read('app/hero-cta.css');"
guard_import_replacement = "const publicPages = read('components/edrive/public-pages.tsx');\nconst heroVideoMedia = read('components/edrive/hero-video-media.tsx');\nconst publicVideoHero = read('components/edrive/public-video-hero.tsx');\nconst rentalsPage = read('app/(public)/rentals/page.tsx');\nconst jetSkiRentalsPage = read('app/(public)/jet-ski-rentals/page.tsx');\nconst jetCarRentalsPage = read('app/(public)/jet-car-rentals/page.tsx');\nconst heroVideoFile = path.join(root, 'public/videos/edrive-hero-loop.mp4');\nconst heroVideoExists = fs.existsSync(heroVideoFile);\nconst heroCtaStyles = read('app/hero-cta.css');"
if guard_import_marker not in guard:
    raise SystemExit('production guard import marker not found')
guard = guard.replace(guard_import_marker, guard_import_replacement, 1)

assert_marker = "assert(publicPages.includes('const publicHeroFrameClass ='), 'All public pages must use one shared hero frame contract.');"
assert_replacement = """assert(heroVideoExists, 'Shared public hero video file must exist.');
assert(!heroVideoExists || fs.statSync(heroVideoFile).size > 1024, 'Shared public hero video file must not be empty.');
assert(heroVideoMedia.includes("publicHeroVideoPath = '/videos/edrive-hero-loop.mp4'"), 'Hero video component must use the approved shared video path.');
assert(heroVideoMedia.includes('autoPlay') && heroVideoMedia.includes('muted') && heroVideoMedia.includes('loop') && heroVideoMedia.includes('playsInline'), 'Shared hero video must autoplay silently, loop, and support inline mobile playback.');
assert(heroVideoMedia.includes('poster={fallbackImage}'), 'Shared hero video must preserve a fallback poster image.');
assert(heroCtaStyles.includes('[data-public-hero-video]'), 'Hero CSS must explicitly support the shared video layer.');
assert(heroCtaStyles.includes('prefers-reduced-motion: reduce'), 'Reduced-motion users must receive the static hero fallback.');
assert(publicPages.includes('HeroVideoMedia fallbackImage={dubaiWaterfrontImage}'), 'Home hero must use the shared video media component.');
assert(publicPages.includes('<PublicVideoHero title={title}'), 'Fleet, Membership, and Contact must use the shared video hero component.');
assert(rentalsPage.includes('<PublicVideoHero'), 'Rentals page must use the shared video hero.');
assert(jetSkiRentalsPage.includes('<PublicVideoHero'), 'Jet Ski rentals page must use the shared video hero.');
assert(jetCarRentalsPage.includes('<PublicVideoHero'), 'Jet Car rentals page must use the shared video hero.');
assert(publicVideoHero.includes('publicHeroFrameClass') && publicVideoHero.includes('publicHeroContentClass'), 'Shared video hero must preserve the locked public hero layout contract.');
assert(publicVideoHero.includes('<HeroVideoMedia'), 'Shared public hero must render the approved video media component.');
assert(publicVideoHero.includes("fallbackImage={fallbackImage}"), 'Every video hero must keep its page-specific fallback image.');
assert(publicVideoHero.includes("fallbackAlt={fallbackAlt}"), 'Every video hero must keep accessible fallback image text.');
assert(publicVideoHero.includes("export const publicHeroFrameClass ="), 'All public pages must use one shared hero frame contract.');"""
if assert_marker not in guard:
    raise SystemExit('production guard hero contract assertion marker not found')
guard = guard.replace(assert_marker, assert_replacement, 1)

guard_path.write_text(guard, encoding='utf-8')
