"""E2E tests (visitor path) — Playwright (Python) against the source files WITHOUT Vite.
Supabase is stubbed (supabase=null, like an unconfigured deployment). Authenticated flows are NOT covered here.
Usage: python3 tests/e2e/run_visitor_tests.py
"""
import http.server, threading, functools, os, sys, json
from playwright.sync_api import sync_playwright

SITE = os.path.join(os.path.dirname(__file__), '..', '..', 'site')
PORT = 8791
PAGES = ['index','boutique','metiers','offres','a-propos','suivi','compte','contact','confidentialite','conditions','livraison','admin','404']
STUB = "export const supabase=null;export const isSupabaseConfigured=false;"
CSP = ("default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob: https://*.supabase.co; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com; "
       "frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'")
results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
def serve():
    handler = functools.partial(H, directory=os.path.abspath(SITE))
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler); threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv
srv = serve()
BASE = f'http://127.0.0.1:{PORT}/'

def route(ctx):
    def handler(r):
        u = r.request.url
        if u.endswith('/assets/supabase-client.js'):
            return r.fulfill(status=200, content_type='text/javascript', body=STUB)
        if u.startswith(BASE) and not u.split('?')[0].rsplit('/',1)[-1].count('.'):  # clean routes -> index
            return r.continue_()
        r.continue_()
    ctx.route('**/*', handler)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width':390,'height':800}); route(ctx)
    errors = []; csp = []; dialogs = []
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: (errors.append(m.text) if m.type=='error' else None))
    pg.on('dialog', lambda d: (dialogs.append(d.message), d.dismiss()))
    # 1. every page renders with no JS error and has a heading
    for name in PAGES:
        errors.clear(); pg.goto(BASE + name + '.html'); pg.wait_for_timeout(300)
        h = pg.locator('h1,h2').count()
        check(f'page {name}.html renders (no JS error, has heading)', not errors and h>0, '; '.join(errors)[:160])
    # admin: no admin data for a visitor
    pg.goto(BASE+'admin.html'); pg.wait_for_timeout(400)
    txt = pg.inner_text('body')
    check('admin.html shows no dashboard to a visitor', 'Commandes' not in txt or 'Vérification' in txt or 'connexion' in txt.lower() or 'privée' in txt.lower(), txt[:120])
    check('admin.html has noindex meta', pg.locator('meta[name=robots][content*=noindex]').count()==1)
    # 2. menu -> independent pages, logo -> home
    pg.goto(BASE+'index.html'); pg.wait_for_timeout(300)
    for label, href in [('Boutique','boutique.html'),('Nos métiers','metiers.html'),('Offres','offres.html'),('À propos','a-propos.html'),('Suivre ma commande','suivi.html'),('Contact','contact.html')]:
        link = pg.locator(f'a[href="{href}"], a[href="/{href}"]').first
        check(f'nav link {label} exists', link.count()>0)
    # mobile drawer
    pg.goto(BASE+'index.html'); pg.wait_for_timeout(300)
    btn = pg.locator('button[aria-label*="enu"], .menu-toggle, #menu-toggle').first
    if btn.count():
        btn.click(); pg.wait_for_timeout(250)
        pg.locator('nav a[href*="boutique"]').first.click(); pg.wait_for_timeout(400)
        check('mobile menu: click opens independent page', pg.url.endswith('boutique.html'), pg.url)
        check('mobile drawer closed after navigation', pg.locator('nav.open, .drawer.open, body.menu-open').count()==0)
        pg.go_back(); pg.wait_for_timeout(300)
        check('browser back returns to previous page', pg.url.endswith('index.html') or pg.url==BASE, pg.url)
    else:
        check('mobile menu toggle found', False)
    # 3. shop: search, filter, modal
    pg.goto(BASE+'boutique.html'); pg.wait_for_timeout(500)
    n_all = pg.locator('.product-card').count()
    check('shop lists the 48 catalogue families', n_all==48, str(n_all))
    pg.fill('#product-search','tumbler'); pg.wait_for_timeout(250)
    n_t = pg.locator('.product-card').count()
    check('shop search filters products', 0 < n_t < n_all, str(n_t))
    pg.fill('#product-search',''); pg.wait_for_timeout(200)
    check('provisional/unconfirmed products cannot be added to cart (no enabled Add button)', pg.locator('.product-card [data-add]').count()==0)
    pg.locator('.product-card [data-details]').first.focus(); pg.locator('.product-card [data-details]').first.click(); pg.wait_for_timeout(250)
    check('product detail opens an accessible dialog (role=dialog, aria-modal)', pg.locator('[role=dialog][aria-modal=true]').count()==1)
    check('no native alert() used', not dialogs, str(dialogs))
    check('dialog moves focus inside', pg.evaluate("document.querySelector('.pm').contains(document.activeElement)"))
    pg.keyboard.press('Tab'); pg.keyboard.press('Tab'); pg.keyboard.press('Tab')
    check('focus stays trapped in dialog', pg.evaluate("document.querySelector('.pm').contains(document.activeElement)"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    check('Escape closes dialog and restores focus to trigger', pg.locator('.pm').count()==0 and pg.evaluate("document.activeElement.hasAttribute('data-details')"))
    # 3b. PWA install (Chrome): button appears on beforeinstallprompt and triggers the prompt
    pg.goto(BASE+'index.html'); pg.wait_for_timeout(400)
    check('install button hidden until the browser offers installation', pg.is_hidden('#install-app'))
    pg.evaluate("window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'),{prompt(){window.__prompted=1},userChoice:Promise.resolve({outcome:'accepted'})}))"); pg.wait_for_timeout(100)
    check('install button shown after beforeinstallprompt', pg.is_visible('#install-app'))
    pg.click('#install-app'); pg.wait_for_timeout(150)
    check('install click calls prompt() and hides the button', pg.evaluate('window.__prompted')==1 and pg.is_hidden('#install-app'))
    man = pg.evaluate("fetch('/manifest.webmanifest').then(r=>r.json())")
    ok_icons = all(pg.evaluate("u=>fetch(u).then(r=>r.status===200&&r.headers.get('content-type').includes('png'))", i['src']) for i in man['icons'])
    check('manifest icons load as PNG (192/512 + maskable)', ok_icons and len(man['icons'])==3)
    check('apple-touch-icon present', pg.locator('link[rel=apple-touch-icon]').count()==1)
    # 4. languages / RTL
    pg.goto(BASE+'boutique.html'); pg.wait_for_timeout(300)
    for lang in ['pt','de','it','zh','ht','en','es','fr']:
        pg.select_option('#language', lang); pg.wait_for_timeout(500)
        check(f'language {lang}: html[lang] updated', pg.evaluate("document.documentElement.lang")==lang, pg.evaluate("document.documentElement.lang"))
    pg.select_option('#language','ar'); pg.wait_for_timeout(500)
    check('Arabic: layout is RTL', pg.evaluate("document.documentElement.dir")=='rtl' or pg.evaluate("getComputedStyle(document.body).direction")=='rtl', pg.evaluate("document.documentElement.dir"))
    pg.locator('.product-card [data-details]').first.click(); pg.wait_for_timeout(250)
    check('Arabic: dialog text localised', 'إغلاق' in pg.inner_text('.pm') or pg.locator('.pm-x[aria-label="إغلاق"]').count()==1)
    pg.keyboard.press('Escape'); pg.select_option('#language','ht'); pg.wait_for_timeout(500)
    name = pg.locator('.product-card h3').first.inner_text()
    check('Kreyòl: product card shows name_ht', name != '' and name != json.load(open(os.path.join(SITE,'data','catalog.json'),encoding='utf-8'))['products'][0]['name_fr'], name)
    pg.select_option('#language','fr'); pg.wait_for_timeout(400)
    ctx.close()
    # 5. responsive overflow
    for w in (360,390,768,1024,1440):
        c = b.new_context(viewport={'width':w,'height':800}); route(c); q = c.new_page()
        bad=[]
        for name in ['index','boutique','compte','contact','metiers']:
            q.goto(BASE+name+'.html'); q.wait_for_timeout(250)
            if q.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth+1"): bad.append(name)
        check(f'no horizontal overflow at {w}px', not bad, ','.join(bad)); c.close()
    # 6. reduced motion: slider does not auto-advance
    c = b.new_context(viewport={'width':390,'height':800}, reduced_motion='reduce'); route(c); q = c.new_page()
    q.goto(BASE+'index.html'); q.wait_for_timeout(300); h0 = q.inner_text('.hero h1'); q.wait_for_timeout(6500); h1 = q.inner_text('.hero h1')
    check('reduced-motion: hero slider starts paused', h0==h1 and 'Reprendre' in q.inner_text('#slider-pause'))
    c.close()
    # 7. normal motion: slider advances; pause works
    c = b.new_context(viewport={'width':390,'height':800}); route(c); q = c.new_page()
    q.goto(BASE+'index.html'); q.wait_for_timeout(300); a0=q.inner_text('.hero h1'); q.wait_for_timeout(6200); a1=q.inner_text('.hero h1')
    check('slider auto-advances', a0!=a1)
    q.click('#slider-pause'); b0=q.inner_text('.hero h1'); q.wait_for_timeout(6200)
    check('slider pause button stops auto-advance', q.inner_text('.hero h1')==b0)
    c.close()
    # 8. enforced CSP (same policy as vercel.json, enforced here) -> no violations on public pages
    c = b.new_context(viewport={'width':390,'height':800}); 
    def h2(r):
        u=r.request.url
        if u.endswith('/assets/supabase-client.js'): return r.fulfill(status=200, content_type='text/javascript', body=STUB)
        resp=r.fetch(); hd=dict(resp.headers); hd['content-security-policy']=CSP; r.fulfill(response=resp, headers=hd)
    c.route('**/*', h2); q=c.new_page(); viol=[]
    q.on('console', lambda m: viol.append(m.text) if 'Content Security Policy' in m.text else None)
    for name in ['index','boutique','metiers','compte','contact','suivi']:
        q.goto(BASE+name+'.html'); q.wait_for_timeout(300)
    q.goto(BASE+'boutique.html'); q.locator('.product-card [data-details]').first.click(); q.wait_for_timeout(200)
    check('enforced CSP: no violations on public pages + product dialog', not viol, '; '.join(viol)[:200]); c.close()
    # 9. a11y basics
    c = b.new_context(viewport={'width':390,'height':800}); route(c); q=c.new_page()
    for name in ['compte','contact','suivi','metiers']:
        q.goto(BASE+name+'.html'); q.wait_for_timeout(400)
        unlabeled = q.evaluate("[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e=>!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.name||e.id||e.type)")
        check(f'{name}: every form control has a label', not unlabeled, ','.join(unlabeled))
    q.goto(BASE+'boutique.html'); q.wait_for_timeout(300)
    noalt = q.evaluate("[...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length")
    check('all images have alt', noalt==0, str(noalt))
    c.close(); b.close()
srv.shutdown()
fails=[r for r in results if not r[1]]
print(f'\n{len(results)-len(fails)}/{len(results)} passed'); json.dump(results, open(os.path.join(os.path.dirname(__file__),'last-results.json'),'w'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)
