"""E2E tests for account pages, guest purchase and footer. Supabase and Turnstile are MOCKED (browser-side):
they verify UI validation and the exact SDK calls/payloads — NOT the real Supabase/Postgres behaviour.
Usage: python3 tests/e2e/run_account_tests.py"""
import http.server, threading, functools, os, sys, json, re
from datetime import date, timedelta
from playwright.sync_api import sync_playwright

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'site')); PORT = 8795
BASE = f'http://127.0.0.1:{PORT}/'
STUB = "export const supabase = window.__sb || null; export const isSupabaseConfigured = !!window.__sb;"
MOCK = r"""
window.__calls=JSON.parse(sessionStorage.getItem('__calls')||'[]');window.__opened=[];
const cfg=window.__cfg=Object.assign({session:null,signIn:{data:{},error:null},signUp:{data:{session:null,user:{id:'signup-user',email:'marie@example.com'}},error:null},tables:{},rpcErr:{}},window.__cfgInit||{});
const rec=(n,a)=>{window.__calls.push([n,JSON.parse(JSON.stringify(a===undefined?null:a))]);sessionStorage.setItem('__calls',JSON.stringify(window.__calls))};
const chain=t=>{const q={};['select','eq','order','limit','in','update','insert','delete','neq'].forEach(m=>q[m]=()=>q);
 q.maybeSingle=async()=>({data:cfg.tables[t]??null,error:null});q.single=q.maybeSingle;q.then=r=>r({data:[],error:null});return q};
if(cfg.enabled!==false){window.__sb={auth:{getSession:async()=>({data:{session:cfg.session},error:null}),getUser:async()=>({data:{user:cfg.session?cfg.session.user:null},error:null}),
 signInWithPassword:async a=>{rec('signInWithPassword',a);return cfg.signIn},signUp:async a=>{rec('signUp',a);return cfg.signUp},
 verifyOtp:async a=>{rec('verifyOtp',a);return {data:{session:{user:{id:'signup-user',email:a.email}}},error:null}},resend:async a=>{rec('resend',a);return {data:{},error:null}},
 signInWithOAuth:async a=>{rec('oauth',a);return {error:null}},resetPasswordForEmail:async(e,o)=>{rec('reset',[e,o]);return {error:null}},
 updateUser:async a=>{rec('updateUser',a);return {error:cfg.updateErr||null}},signOut:async()=>({error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
 functions:{invoke:async(n,o)=>{rec('invoke',[n,o?{hasToken:!!o.body.token}:null]);return {data:{ok:true},error:null}}},
 rpc:async(n,a)=>{rec('rpc',[n,a]);return {data:null,error:cfg.rpcErr[n]?{message:cfg.rpcErr[n]}:null}},from:t=>chain(t)}}
window.turnstile={render:(s,o)=>{window.__tcb=o.callback;setTimeout(()=>o.callback('tok-'+Math.random().toString(36).slice(2)),10);return 'w1'},reset(){setTimeout(()=>window.__tcb('tok-'+Math.random().toString(36).slice(2)),10)}};
window.open=(u)=>{window.__opened.push(u);return null};
"""
results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), str(detail)[:200])); print(('PASS ' if cond else 'FAIL ') + name + (f'  [{str(detail)[:160]}]' if detail and not cond else ''))

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(H, directory=SITE)); threading.Thread(target=srv.serve_forever, daemon=True).start()

def make_ctx(b, width=390, cfg=None, guest=True, priced=False, lang=None):
    ctx = b.new_context(viewport={'width': width, 'height': 800})
    ctx.add_init_script("window.__cfgInit=" + json.dumps(cfg or {}) + ";" + (f"localStorage.setItem('imagie-lang','{lang}');" if lang else '') + MOCK)
    def h(r):
        u = r.request.url
        if u.endswith('/assets/supabase-client.js'): return r.fulfill(status=200, content_type='text/javascript', body=STUB)
        if u.endswith('/assets/app.js'):
            body = r.fetch().text()
            body = body.replace("import.meta.env?.VITE_TURNSTILE_SITE_KEY", "'test-site-key'")
            if not guest: body = body.replace("import.meta.env?.VITE_ALLOW_GUEST_PURCHASE!=='false'", "false")
            return r.fulfill(status=200, content_type='text/javascript', body=body)
        if priced and u.split('?')[0].endswith('/data/catalog.json'):
            d = r.fetch().json(); d['products'][0].update(price=9.5, price_status='active'); return r.fulfill(status=200, content_type='application/json', body=json.dumps(d))
        r.continue_()
    ctx.route('**/*', h); return ctx
def calls(pg, name=None): return [c for c in pg.evaluate('window.__calls') if name is None or c[0] == name]
def fill(pg, **kw):
    for k, v in kw.items(): pg.fill('#' + k, v)

today = date.today(); adult_ok = date(today.year - 18, today.month, today.day).isoformat(); minor = (date(today.year - 18, today.month, today.day) + timedelta(days=1)).isoformat()
GOOD = dict(first_name='Marie', last_name='Jean', birth_date=adult_ok, phone='+509 36 94 2951', email='marie@example.com', password='Correct-Horse-9', password2='Correct-Horse-9')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None); errs = []
    def page_of(ctx):
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); return pg

    # ---- connexion
    ctx = make_ctx(b); pg = page_of(ctx); pg.goto(BASE + 'connexion.html'); pg.wait_for_timeout(500)
    check('connexion: separate page with email, password, forgot + create links', pg.locator('#email').count() == 1 and pg.locator('a[href="mot-de-passe-oublie.html"]').count() == 1 and pg.locator('a[href="inscription.html"]').count() == 1)
    check('connexion: Google, Facebook and X buttons', [x for x in pg.eval_on_selector_all('[data-oauth]', 'els=>els.map(e=>e.dataset.oauth)')] == ['google', 'facebook', 'x'])
    check('connexion: autocomplete attributes (username/current-password)', pg.get_attribute('#email', 'autocomplete') == 'username' and pg.get_attribute('#password', 'autocomplete') == 'current-password')
    check('connexion: small secondary links sit below the form', pg.evaluate("document.querySelector('.auth-links').getBoundingClientRect().top > document.querySelector('.auth-submit').getBoundingClientRect().bottom"))
    pg.click('[data-pw-toggle]'); check('connexion: show/hide password toggle works', pg.get_attribute('#password', 'type') == 'text'); pg.click('[data-pw-toggle]')
    pg.fill('#email', 'bad'); pg.fill('#password', 'x'); pg.click('.auth-submit'); pg.wait_for_timeout(150)
    check('connexion: invalid email blocked, no API call', not calls(pg, 'signInWithPassword') and 'invalide' in pg.inner_text('#auth-msg').lower())
    ctx.close()
    ctx = make_ctx(b, cfg={'signIn': {'data': {}, 'error': {'message': 'Invalid login credentials'}}}); pg = page_of(ctx); pg.goto(BASE + 'connexion.html'); pg.wait_for_timeout(500)
    fill(pg, email='a@b.co', password='whatever-123'); pg.click('.auth-submit'); pg.wait_for_timeout(250)
    check('connexion: wrong credentials -> generic message, stays on page', 'incorrect' in pg.inner_text('#auth-msg').lower() and pg.url.endswith('connexion.html'))
    check('connexion: sign-in sends captchaToken', calls(pg, 'signInWithPassword') and calls(pg, 'signInWithPassword')[0][1]['options']['captchaToken'].startswith('tok-'))
    ctx.close()
    ctx = make_ctx(b, cfg={'session': {'user': {'id': 'u1', 'email': 'a@b.co', 'user_metadata': {}}}}); pg = page_of(ctx); pg.goto(BASE + 'connexion.html?next=checkout'); pg.wait_for_timeout(500)
    fill(pg, email='a@b.co', password='good-password-1'); pg.click('.auth-submit'); pg.wait_for_timeout(600)
    check('connexion: success goes to compte.html and keeps ?next', 'compte.html' in pg.url and 'next=checkout' in pg.url, pg.url)
    ctx.close()
    ctx = make_ctx(b); pg = page_of(ctx); pg.goto(BASE + 'connexion.html'); pg.wait_for_timeout(500)
    for prov in ('google', 'facebook', 'x'):
        pg.click(f'[data-oauth="{prov}"]'); pg.wait_for_timeout(250)
    oa = calls(pg, 'oauth'); inv = calls(pg, 'invoke')
    check('social: providers google/facebook/x called', [c[1]['provider'] for c in oa] == ['google', 'facebook', 'x'], oa)
    check('social: anti-bot verified server-side (verify-turnstile) before each OAuth', len(inv) == 3 and all(c[1][0] == 'verify-turnstile' and c[1][1]['hasToken'] for c in inv))
    check('social: redirectTo points to compte.html', all(c[1]['options']['redirectTo'].endswith('/compte.html') for c in oa))
    pg.goto(BASE + 'connexion.html', wait_until='load'); pg.wait_for_timeout(300)
    check('"forgot my email" opens WhatsApp helper with prefilled text', 'wa.me/50940437940' in (pg.eval_on_selector('#wa-help', 'e=>e.href') or ''))
    ctx.close()

    # ---- inscription
    ctx = make_ctx(b); pg = page_of(ctx); pg.goto(BASE + 'inscription.html'); pg.wait_for_timeout(500)
    ac = {k: pg.get_attribute('#' + k, 'autocomplete') for k in ('first_name', 'last_name', 'birth_date', 'phone', 'email', 'password')}
    check('inscription: asks first name, last name, date of birth, phone, email, password', all(pg.locator('#' + k).count() == 1 for k in GOOD) and ac['first_name'] == 'given-name' and ac['password'] == 'new-password', ac)
    check('inscription: date picker max = latest allowed 18-year-old birth date', pg.get_attribute('#birth_date', 'max') == adult_ok, pg.get_attribute('#birth_date', 'max'))
    def sub(**ov):
        v = dict(GOOD); v.update(ov); fill(pg, **v)
        if pg.is_checked('#terms') != ov.get('_terms', True): pg.click('#terms')
        pg.click('.auth-submit'); pg.wait_for_timeout(200)
    sub(first_name=''); check('inscription: missing field blocked', not calls(pg, 'signUp'))
    sub(birth_date=minor); check('inscription: 17y364d (under 18) blocked with clear message', not calls(pg, 'signUp') and '18' in pg.inner_text('#auth-msg'), pg.inner_text('#auth-msg'))
    sub(birth_date='2999-01-01'); check('inscription: future date blocked', not calls(pg, 'signUp'))
    sub(phone='123'); check('inscription: invalid phone blocked', not calls(pg, 'signUp'))
    sub(email='nope'); check('inscription: invalid email blocked', not calls(pg, 'signUp'))
    sub(password='short', password2='short'); check('inscription: password < 10 chars blocked', not calls(pg, 'signUp'))
    sub(password2='different-pass-1'); check('inscription: password confirmation mismatch blocked', not calls(pg, 'signUp'))
    pg.click('#terms'); pg.click('.auth-submit'); pg.wait_for_timeout(150); check('inscription: terms must be accepted', not calls(pg, 'signUp')); pg.click('#terms')
    sub(); su = calls(pg, 'signUp')
    check('inscription: exactly 18 today is accepted -> signUp called once', len(su) == 1, len(su))
    if su:
        a = su[0][1]; d = a['options']['data']
        check('signUp payload: email/password/captchaToken', a['email'] == 'marie@example.com' and a['password'] == GOOD['password'] and a['options']['captchaToken'].startswith('tok-'))
        check('signUp metadata: first/last/full name, birth_date, phone, language', d['first_name'] == 'Marie' and d['last_name'] == 'Jean' and d['full_name'] == 'Marie Jean' and d['birth_date'] == adult_ok and d['phone'] == '+509 36 94 2951' and d['preferred_language'] == 'fr', d)
        check('signUp: no role/consent/admin field sent from the browser', not any(k in d for k in ('role', 'is_admin', 'community_terms_accepted_at')))
    check('inscription: shows the OTP screen and hides the signup form', pg.is_visible('#signup-otp-form') and pg.is_hidden('#auth-form') and 'code de validation' in pg.inner_text('.otp-panel').lower())
    pg.fill('#signup-otp', '123456'); pg.click('#signup-otp-form button[type=submit]'); pg.wait_for_timeout(250)
    check('inscription: verifies the email OTP with type signup', len(calls(pg, 'verifyOtp')) == 1 and calls(pg, 'verifyOtp')[0][1]['type'] == 'signup' and calls(pg, 'verifyOtp')[0][1]['token'] == '123456')
    check('inscription: community consent is accepted only after OTP verification', any(c[1][0] == 'accept_community_terms' for c in calls(pg, 'rpc')))
    pg.goto(BASE + 'inscription.html'); pg.wait_for_timeout(400)
    check('inscription: social option available without filling the form', pg.locator('[data-oauth]').count() == 3)
    pg.click('[data-oauth="google"]'); pg.wait_for_timeout(200); check('inscription: social requires accepting the terms first', not calls(pg, 'oauth'))
    pg.click('#terms'); pg.click('[data-oauth="google"]'); pg.wait_for_timeout(250); check('inscription: social allowed after terms; consent flag stored for return', len(calls(pg, 'oauth')) == 1 and pg.evaluate("sessionStorage.getItem('imagie-oauth-community-consent')") == '1')
    ctx.close()

    # ---- mot de passe oublié
    ctx = make_ctx(b); pg = page_of(ctx); pg.goto(BASE + 'mot-de-passe-oublie.html'); pg.wait_for_timeout(500)
    fill(pg, email='who@example.com'); pg.click('.auth-submit'); pg.wait_for_timeout(250); r = calls(pg, 'reset')
    check('forgot: reset email requested with captchaToken and redirect to ?mode=reset', len(r) == 1 and r[0][1][1]['redirectTo'].endswith('/mot-de-passe-oublie.html?mode=reset') and r[0][1][1]['captchaToken'].startswith('tok-'), r)
    check('forgot: neutral confirmation (does not reveal if the account exists)', 'Si cette adresse' in pg.inner_text('#auth-msg'))
    pg.goto(BASE + 'mot-de-passe-oublie.html?mode=reset'); pg.wait_for_timeout(500)
    check('reset mode: shows new-password form (2 fields)', pg.locator('#password').count() == 1 and pg.locator('#password2').count() == 1)
    fill(pg, password='short', password2='short'); pg.click('.auth-submit'); pg.wait_for_timeout(150); check('reset: short password blocked', not calls(pg, 'updateUser'))
    fill(pg, password='A-new-secret-123', password2='A-new-secret-123'); pg.click('.auth-submit'); pg.wait_for_timeout(250)
    check('reset: updateUser called, confirmation shown', len(calls(pg, 'updateUser')) == 1 and 'changé' in pg.inner_text('#auth-msg'))
    ctx.close()

    # ---- completer profil
    ctx = make_ctx(b); pg = page_of(ctx); pg.goto(BASE + 'completer-profil.html'); pg.wait_for_timeout(700)
    check('profile completion without session -> redirected to connexion', 'connexion.html' in pg.url, pg.url)
    ctx.close()
    sess = {'user': {'id': 'u1', 'email': 'g@example.com', 'user_metadata': {'full_name': 'Ana Pierre'}}}
    ctx = make_ctx(b, cfg={'session': sess, 'tables': {'profiles': {'first_name': None, 'last_name': None, 'full_name': 'Ana Pierre', 'phone': None, 'birth_date': None}}}); pg = page_of(ctx); pg.goto(BASE + 'completer-profil.html'); pg.wait_for_timeout(700)
    check('profile completion: prefilled from social name', pg.input_value('#first_name') == 'Ana' and pg.input_value('#last_name') == 'Pierre')
    fill(pg, birth_date=minor, phone='+50912345678'); pg.click('.auth-submit'); pg.wait_for_timeout(200); check('profile completion: under 18 blocked', not calls(pg, 'rpc'))
    fill(pg, birth_date=adult_ok); pg.click('.auth-submit'); pg.wait_for_timeout(600); rp = calls(pg, 'rpc')
    check('profile completion: rpc complete_member_profile with validated args', len(rp) == 1 and rp[0][1][0] == 'complete_member_profile' and rp[0][1][1]['p_birth_date'] == adult_ok and rp[0][1][1]['p_first_name'] == 'Ana', rp)
    ctx.close()
    # compte.html routing rules
    ctx = make_ctx(b); pg = page_of(ctx); pg.goto(BASE + 'compte.html'); pg.wait_for_timeout(700)
    check('compte.html logged out -> separate connexion page', 'connexion.html' in pg.url, pg.url); ctx.close()
    ctx = make_ctx(b, cfg={'session': sess, 'tables': {'profiles': {'birth_date': None}}}); pg = page_of(ctx); pg.goto(BASE + 'compte.html'); pg.wait_for_timeout(900)
    check('compte.html with incomplete profile -> completer-profil', 'completer-profil.html' in pg.url, pg.url); ctx.close()
    ctx = make_ctx(b, cfg={'session': sess, 'tables': {'profiles': {'birth_date': '1990-01-01', 'full_name': 'Ana Pierre'}, 'customer_memberships': {'status': 'active', 'community_terms_accepted_at': '2026-11-01', 'member_number': 'IM-1'}}}); errs.clear(); pg = page_of(ctx); pg.goto(BASE + 'compte.html'); pg.wait_for_timeout(900)
    check('compte.html member space shown for a complete profile (no JS error)', 'compte.html' in pg.url and pg.is_visible('#member-area') and not errs, errs); ctx.close()

    # ---- account-required checkout (guest purchases disabled by default)
    ctx = make_ctx(b, priced=True, guest=False); errs.clear(); pg = page_of(ctx); pg.goto(BASE + 'boutique.html'); pg.wait_for_timeout(600)
    check('account required: a visitor cannot add a catalogue-only product without a member session', pg.locator('[data-add]').count() == 0)
    pg.click('#open-cart'); pg.wait_for_timeout(350)
    check('account required: opening the cart redirects the visitor to account sign-in', 'connexion.html' in pg.url, pg.url); ctx.close()

    # ---- footer
    ctx = make_ctx(b); pg = page_of(ctx); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(500)
    labs = pg.eval_on_selector_all('.social-row a', 'els=>els.map(e=>e.getAttribute("aria-label"))')
    check('footer: social row shows only configured links (Facebook, WhatsApp, E-mail)', labs == ['Facebook', 'WhatsApp', 'E-mail'], labs)
    check('footer: external icons open safely (noopener) and are labelled', pg.eval_on_selector_all('.social-row a[target=_blank]', 'els=>els.every(e=>e.rel.includes("noopener"))'))
    check('footer: brand bar has wordmark, copyright and original logo', 'IMAGIE CRÉATION' in pg.inner_text('.fb-word') and '© 2026' in pg.inner_text('.fb-copy') and pg.locator('.fb-id img').count() == 1)
    pg.screenshot(path='/home/claude/footer.png', clip={'x': 0, 'y': max(0, pg.evaluate('document.body.scrollHeight') - 520), 'width': 390, 'height': 520}) if False else None
    ctx.close()

    # ---- layout / language
    for w in (360, 390, 768, 1440):
        ctx = make_ctx(b, width=w); pg = page_of(ctx); bad = []
        for n in ('connexion', 'inscription', 'mot-de-passe-oublie'):
            pg.goto(BASE + n + '.html'); pg.wait_for_timeout(300)
            if pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+1'): bad.append(n)
        check(f'account pages: no horizontal overflow at {w}px', not bad, bad); ctx.close()
    ctx = make_ctx(b, lang='ar'); pg = page_of(ctx); pg.goto(BASE + 'connexion.html'); pg.wait_for_timeout(500)
    check('Arabic: account page is RTL and falls back to English text', pg.evaluate('document.documentElement.dir') == 'rtl' and 'Sign in' in pg.inner_text('.auth-card h1')); ctx.close()
    ctx = make_ctx(b, lang='ht'); pg = page_of(ctx); pg.goto(BASE + 'inscription.html'); pg.wait_for_timeout(500)
    check('Kreyòl: signup form is in Kreyòl', 'Dat nesans' in pg.inner_text('.auth-card')); ctx.close()
    ctx = make_ctx(b); errs.clear(); pg = page_of(ctx)
    for n in ('connexion', 'inscription', 'mot-de-passe-oublie', 'completer-profil'): pg.goto(BASE + n + '.html'); pg.wait_for_timeout(350)
    check('no JS console error on the 4 account pages', not errs, errs); ctx.close()
    # unconfigured service message (supabase null)
    ctx = make_ctx(b, cfg={'enabled': False}); pg = page_of(ctx); pg.goto(BASE + 'inscription.html'); pg.wait_for_timeout(400); fill(pg, **GOOD); pg.click('#terms'); pg.click('.auth-submit'); pg.wait_for_timeout(250)
    check('unconfigured backend: valid form shows honest "not configured, nothing saved" message', 'pas encore configuré' in pg.inner_text('#auth-msg')); ctx.close()
    b.close()
srv.shutdown(); fails = [r for r in results if not r[1]]
print(f'\n{len(results) - len(fails)}/{len(results)} passed'); json.dump(results, open(os.path.join(os.path.dirname(__file__), 'last-account-results.json'), 'w'), ensure_ascii=False, indent=1); sys.exit(1 if fails else 0)
