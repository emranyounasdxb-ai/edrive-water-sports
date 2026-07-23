from pathlib import Path

hero_path = Path('app/hero-cta.css')
pages_path = Path('components/edrive/public-pages.tsx')
guard_path = Path('scripts/production-guard.mjs')

hero = hero_path.read_text(encoding='utf-8')
pages = pages_path.read_text(encoding='utf-8')
guard = guard_path.read_text(encoding='utf-8')

forced_background = """  background-image: url('/images/edrive/dubai-waterfront-hero.png');
  background-size: cover;
  background-position: center 58%;
"""
if forced_background not in hero:
    raise SystemExit('Forced shared hero background marker not found')
hero = hero.replace(forced_background, '', 1)

hidden_image_rule = """[data-public-main] > [data-public-hero]:first-of-type > img {
  opacity: 0 !important;
}

"""
if hidden_image_rule not in hero:
    raise SystemExit('Hidden public hero image rule not found')
hero = hero.replace(hidden_image_rule, """[data-public-main] > [data-public-hero]:first-of-type > [data-public-hero-image] {
  z-index: 0;
  opacity: 1 !important;
}

""", 1)

hero = hero.replace('    background-position: center 55%;\n', '')
hero = hero.replace('    background-position: 64% center;\n', '')

home_image = '<Image src={dubaiWaterfrontImage} alt="Jet ski and jet car riding across the Dubai waterfront" fill priority className="object-cover object-[68%_68%]" sizes="100vw" />'
new_home_image = '<Image src={dubaiWaterfrontImage} alt="Jet ski and jet car riding across the Dubai waterfront" fill priority data-public-hero-image className="object-cover object-[68%_68%]" sizes="100vw" />'
public_image = '<Image src={image} alt={imageAlt} fill priority className="object-cover opacity-55" sizes="100vw" />'
new_public_image = '<Image src={image} alt={imageAlt} fill priority data-public-hero-image className="object-cover object-center" sizes="100vw" />'

if home_image not in pages or public_image not in pages:
    raise SystemExit('Public hero image component markers not found')
pages = pages.replace(home_image, new_home_image, 1)
pages = pages.replace(public_image, new_public_image, 1)

old_hero_count_guard = "assert(publicPages.match(/data-public-hero/g)?.length === 2, 'HomeHero and PublicHero must keep stable public hero markers.');"
new_hero_count_guard = "assert(publicPages.match(/data-public-hero(?=[\\s>])/g)?.length === 2, 'HomeHero and PublicHero must keep stable public hero markers.');"
if old_hero_count_guard not in guard:
    raise SystemExit('Public hero marker count guard not found')
guard = guard.replace(old_hero_count_guard, new_hero_count_guard, 1)

guard_marker = "assert(contactPolishStyles.includes('[data-public-main] > [data-public-hero]:first-of-type'), 'Contact polish must target stable public layout markers.');"
new_guards = """assert(contactPolishStyles.includes('[data-public-main] > [data-public-hero]:first-of-type'), 'Contact polish must target stable public layout markers.');
assert(publicPages.match(/data-public-hero-image/g)?.length === 2, 'HomeHero and PublicHero images must keep stable visibility markers.');
assert(heroCtaStyles.includes('> [data-public-hero-image]'), 'Public hero visibility must target the stable hero-image marker.');
assert(heroCtaStyles.includes('opacity: 1 !important'), 'Assigned public hero images must remain visible.');
assert(!heroCtaStyles.includes("background-image: url('/images/edrive/dubai-waterfront-hero.png')"), 'Global hero CSS must not force one shared background image across pages.');
assert(!heroCtaStyles.includes('[data-public-hero]:first-of-type > img {'), 'Global hero CSS must not hide page-specific hero images.');
assert(publicPages.includes('className="object-cover object-center"'), 'Shared public heroes must render their assigned image consistently.');"""
if guard_marker not in guard:
    raise SystemExit('Production guard insertion marker not found')
guard = guard.replace(guard_marker, new_guards, 1)

hero_path.write_text(hero, encoding='utf-8')
pages_path.write_text(pages, encoding='utf-8')
guard_path.write_text(guard, encoding='utf-8')
