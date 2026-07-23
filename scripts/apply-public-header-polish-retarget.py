from pathlib import Path

hero_css_path = Path('app/hero-cta.css')
contact_css_path = Path('app/contact-page-polish.css')
public_pages_path = Path('components/edrive/public-pages.tsx')
module_path = Path('components/edrive/public-shell.module.css')
guard_path = Path('scripts/production-guard.mjs')

hero_css = hero_css_path.read_text(encoding='utf-8')
contact_css = contact_css_path.read_text(encoding='utf-8')
public_pages = public_pages_path.read_text(encoding='utf-8')
module_css = module_path.read_text(encoding='utf-8')
guard = guard_path.read_text(encoding='utf-8')

hero_css = hero_css.replace('main > section.relative.isolate', '[data-public-main] > [data-public-hero]')
hero_css = hero_css.replace('main.pt-\\[86px\\] > section.relative.isolate:first-child', '[data-public-main] > [data-public-hero]:first-of-type')
hero_css = hero_css.replace('margin-top: -86px;', 'margin-top: calc(-1 * var(--public-header-height));')
contact_css = contact_css.replace('main.pt-\\[86px\\] > section.relative.isolate:first-child', '[data-public-main] > [data-public-hero]:first-of-type')

if 'main.pt-\\[86px\\]' in hero_css or 'main.pt-\\[86px\\]' in contact_css:
    raise SystemExit('Legacy pt-[86px] polish selector remains')
if 'margin-top: calc(-1 * var(--public-header-height));' not in hero_css:
    raise SystemExit('Shared header overlap variable was not applied')

home_marker = '<section className="relative isolate min-h-[600px] overflow-hidden bg-primary-900 text-white sm:min-h-[620px] lg:min-h-[640px] xl:min-h-[680px]">'
public_marker = '<section className="relative isolate min-h-[500px] overflow-hidden bg-primary-900 text-white sm:min-h-[540px] lg:min-h-[580px] xl:min-h-[620px]">'
if home_marker not in public_pages or public_marker not in public_pages:
    raise SystemExit('Public hero section markers were not found')
public_pages = public_pages.replace(home_marker, home_marker.replace('>', ' data-public-hero>', 1), 1)
public_pages = public_pages.replace(public_marker, public_marker.replace('>', ' data-public-hero>', 1), 1)

old_module_rule = '''.main > section:first-of-type,
.main > div:first-of-type {
  margin-top: 0 !important;
}'''
new_module_rule = '''.main > section:first-of-type:not([data-public-hero]),
.main > div:first-of-type {
  margin-top: 0 !important;
}'''
if old_module_rule not in module_css:
    raise SystemExit('Public first-section spacing rule was not found')
module_css = module_css.replace(old_module_rule, new_module_rule, 1)

guard = guard.replace(
    "const publicShellStyles = read('components/edrive/public-shell.module.css');",
    "const publicShellStyles = read('components/edrive/public-shell.module.css');\nconst publicPages = read('components/edrive/public-pages.tsx');\nconst heroCtaStyles = read('app/hero-cta.css');\nconst contactPolishStyles = read('app/contact-page-polish.css');",
)
guard = guard.replace(
    "assert(publicShellStyles.includes('.main > section:first-of-type'), 'The first rendered public section must be protected from accidental top margin.');",
    "assert(publicShellStyles.includes('.main > section:first-of-type:not([data-public-hero])'), 'Non-hero public sections must be protected from accidental top margin.');\nassert(publicPages.match(/data-public-hero/g)?.length === 2, 'HomeHero and PublicHero must keep stable public hero markers.');\nassert(heroCtaStyles.includes('[data-public-main] > [data-public-hero]:first-of-type'), 'Hero polish must target stable public layout markers.');\nassert(heroCtaStyles.includes('margin-top: calc(-1 * var(--public-header-height))'), 'Public hero must overlap the shared header height without a blank strip.');\nassert(contactPolishStyles.includes('[data-public-main] > [data-public-hero]:first-of-type'), 'Contact polish must target stable public layout markers.');\nassert(!heroCtaStyles.includes('main.pt-\\\\[86px\\\\]'), 'Hero polish must not depend on the removed Tailwind top-padding class.');\nassert(!contactPolishStyles.includes('main.pt-\\\\[86px\\\\]'), 'Contact polish must not depend on the removed Tailwind top-padding class.');",
)

hero_css_path.write_text(hero_css, encoding='utf-8')
contact_css_path.write_text(contact_css, encoding='utf-8')
public_pages_path.write_text(public_pages, encoding='utf-8')
module_path.write_text(module_css, encoding='utf-8')
guard_path.write_text(guard, encoding='utf-8')
