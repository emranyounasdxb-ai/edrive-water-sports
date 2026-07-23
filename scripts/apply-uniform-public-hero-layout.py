from pathlib import Path
import re

pages_path = Path('components/edrive/public-pages.tsx')
hero_css_path = Path('app/hero-cta.css')
contact_css_path = Path('app/contact-page-polish.css')
guard_path = Path('scripts/production-guard.mjs')

pages = pages_path.read_text(encoding='utf-8')
hero_css = hero_css_path.read_text(encoding='utf-8')
contact_css = contact_css_path.read_text(encoding='utf-8')
guard = guard_path.read_text(encoding='utf-8')

section_marker = "const sectionPad = 'py-10 sm:py-12 lg:py-14';"
shared_constants = """const sectionPad = 'py-10 sm:py-12 lg:py-14';
const publicHeroFrameClass = 'relative isolate min-h-[600px] overflow-hidden bg-primary-900 text-white sm:min-h-[620px] lg:min-h-[640px] xl:min-h-[680px]';
const publicHeroContentClass = 'container-x relative flex min-h-[600px] items-center pb-10 pt-28 sm:min-h-[620px] sm:pb-12 sm:pt-28 lg:min-h-[640px] lg:pb-14 lg:pt-24 xl:min-h-[680px]';"""
if section_marker not in pages:
    raise SystemExit('Section padding marker not found')
pages = pages.replace(section_marker, shared_constants, 1)

home_frame = '<section className="relative isolate min-h-[600px] overflow-hidden bg-primary-900 text-white sm:min-h-[620px] lg:min-h-[640px] xl:min-h-[680px]" data-public-hero>'
public_frame = '<section className="relative isolate min-h-[500px] overflow-hidden bg-primary-900 text-white sm:min-h-[540px] lg:min-h-[580px] xl:min-h-[620px]" data-public-hero>'
home_content = '<div className="container-x relative flex min-h-[600px] items-center pb-10 pt-28 sm:min-h-[620px] sm:pb-12 sm:pt-28 lg:min-h-[640px] lg:pb-14 lg:pt-24 xl:min-h-[680px]">'
public_content = '<div className="container-x relative flex min-h-[500px] items-center py-20 sm:min-h-[540px] sm:py-24 lg:min-h-[580px] lg:py-28 xl:min-h-[620px]">'
for marker in (home_frame, public_frame, home_content, public_content):
    if marker not in pages:
        raise SystemExit(f'Public hero marker not found: {marker[:60]}')
pages = pages.replace(home_frame, '<section className={publicHeroFrameClass} data-public-hero>', 1)
pages = pages.replace(public_frame, '<section className={publicHeroFrameClass} data-public-hero>', 1)
pages = pages.replace(home_content, '<div className={publicHeroContentClass}>', 1)
pages = pages.replace(public_content, '<div className={publicHeroContentClass}>', 1)

old_root = """[data-public-main] > [data-public-hero]:first-of-type {
  margin-top: calc(-1 * var(--public-header-height));
  min-height: 520px !important;
}"""
new_root = """[data-public-main] > [data-public-hero]:first-of-type {
  margin-top: calc(-1 * var(--public-header-height));
}"""
if old_root not in hero_css:
    raise SystemExit('Shared hero root sizing override not found')
hero_css = hero_css.replace(old_root, new_root, 1)

old_container = """[data-public-main] > [data-public-hero]:first-of-type > .container-x.relative {
  z-index: 3;
  min-height: 520px !important;
  align-items: center !important;
  padding-top: 110px !important;
  padding-bottom: 48px !important;
}"""
new_container = """[data-public-main] > [data-public-hero]:first-of-type > .container-x.relative {
  z-index: 3;
  align-items: center !important;
}"""
if old_container not in hero_css:
    raise SystemExit('Shared hero content sizing override not found')
hero_css = hero_css.replace(old_container, new_container, 1)

hero_css, min_media_count = re.subn(
    r"\n@media \(min-width: 768px\) \{.*?\n\}\n\n@media \(min-width: 1280px\) \{.*?\n\}\n",
    "\n",
    hero_css,
    count=1,
    flags=re.S,
)
if min_media_count != 1:
    raise SystemExit(f'Shared hero desktop sizing media removal count={min_media_count}')

for mobile_rule in (
    """  [data-public-main] > [data-public-hero]:first-of-type {
    min-height: 540px !important;
  }

""",
    """  [data-public-main] > [data-public-hero]:first-of-type > .container-x.relative {
    min-height: 540px !important;
    padding-top: 104px !important;
    padding-bottom: 36px !important;
  }

""",
):
    if mobile_rule not in hero_css:
        raise SystemExit('Shared hero mobile sizing override not found')
    hero_css = hero_css.replace(mobile_rule, '', 1)

contact_pattern = re.compile(
    r"\n?\s*\[data-public-main\] > \[data-public-hero\]:first-of-type:has\(\+ section\.container-x\.grid\)(?: > \.container-x\.relative| \.mt-7| h1)? \{.*?\}\n",
    re.S,
)
contact_css, contact_override_count = contact_pattern.subn('\n', contact_css)
if contact_override_count != 6:
    raise SystemExit(f'Contact hero override removal count={contact_override_count}')

insert_after = "assert(publicPages.includes('className=\"object-cover object-center\"'), 'Shared public heroes must render their assigned image consistently.');"
new_guard_block = """assert(publicPages.includes('className=\"object-cover object-center\"'), 'Shared public heroes must render their assigned image consistently.');
assert(publicPages.includes('const publicHeroFrameClass ='), 'All public pages must use one shared hero frame contract.');
assert(publicPages.includes('const publicHeroContentClass ='), 'All public pages must use one shared hero content contract.');
assert(publicPages.match(/className=\{publicHeroFrameClass\}/g)?.length === 2, 'HomeHero and PublicHero must use the same hero frame class.');
assert(publicPages.match(/className=\{publicHeroContentClass\}/g)?.length === 2, 'HomeHero and PublicHero must use the same hero content class.');
assert(!heroCtaStyles.includes('min-height: 520px !important'), 'Global hero polish must not override shared component height.');
assert(!heroCtaStyles.includes('min-height: 540px !important'), 'Mobile hero polish must not override shared component height.');
assert(!contactPolishStyles.includes('[data-public-hero]:first-of-type:has(+ section.container-x.grid)'), 'Contact page must not compress or hide the shared public hero.');"""
if insert_after not in guard:
    raise SystemExit('Production guard insertion marker not found')
guard = guard.replace(insert_after, new_guard_block, 1)

pages_path.write_text(pages, encoding='utf-8')
hero_css_path.write_text(hero_css, encoding='utf-8')
contact_css_path.write_text(contact_css, encoding='utf-8')
guard_path.write_text(guard, encoding='utf-8')
