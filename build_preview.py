#!/usr/bin/env python3
"""Bundle the static front-end into ONE html file (visitor preview, no Supabase) for claude.ai Artifacts.
Usage: python3 tools/build_preview.py out.html   (run from the repo root)"""
import re, base64, json, sys, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site') + os.sep
rd = lambda p: open(ROOT + p, encoding='utf-8').read()
css, app, modal, auth = rd('assets/app.css'), rd('assets/app.js'), rd('assets/product-modal.js'), rd('assets/auth-pages.js')
cat = json.load(open(ROOT + 'data/catalog.json', encoding='utf-8'))
logo = base64.b64encode(open(ROOT + 'assets/imagie-logo-original.jpg', 'rb').read()).decode()

def rep(s, old, new, n=1):
    assert s.count(old) == n, (old[:60], s.count(old)); return s.replace(old, new)

# ---- adapt modules
app = rep(app, "import { supabase, isSupabaseConfigured } from './supabase-client.js';\n", "const supabase=null,isSupabaseConfigured=false;\n")
app = rep(app, "import { openProductModal } from './product-modal.js';\n", "")
app = rep(app, "import { authPageHtml, bindAuthPage } from './auth-pages.js';\n", "")
app = rep(app, "const response=await fetch('/data/catalog.json');if(response.ok)base=await response.json();", "base=JSON.parse(JSON.stringify(window.__CATALOG__));")
app = rep(app, "'serviceWorker'in navigator&&location.protocol.startsWith('http')", "false")
app, n1 = re.subn(r"location\.href=(`[^`]*`|'[^']*'|target)", r"__go(\1)", app)
app = app.replace('src="/assets/imagie-logo-original.jpg"', 'src="${window.__LOGO__}"')
auth = auth.replace('src="/assets/imagie-logo-original.jpg"', 'src="${window.__LOGO__}"')
auth = rep(auth, "const go = (url) => { location.href = url; };", "const go = (url) => { window.__go(url); };")
# each module in its own scope (avoids duplicate top-level names)
def scoped(code, exports):
    code = re.sub(r'^export\s+(async\s+)?(function|const|let)\s', lambda m: (m.group(1) or '') + m.group(2) + ' ', code, flags=re.M)
    return "const {%s}=(()=>{\n%s\nreturn {%s};})();\n" % (', '.join(exports), code, ', '.join(exports))
auth_s = scoped(auth, ['authPageHtml', 'bindAuthPage'])
modal_s = scoped(modal, ['openProductModal'])

ROUTES = ['home','boutique','metiers','offres','a-propos','suivi','compte','contact','confidentialite','conditions','livraison','admin','connexion','inscription','mot-de-passe-oublie','completer-profil']
page_js = """(function(){var R=%s;var h=(location.hash||'#home').slice(1);document.body.dataset.page=R.indexOf(h)>-1?h:'notfound';
window.__go=function(u){var m=String(u).match(/([a-z-]+)\\.html/);var n=m?(m[1]==='index'?'home':m[1]):'home';location.hash='#'+n;location.reload()};
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var v=a.getAttribute('href');if(/^\\/?[a-z-]+\\.html(\\?.*)?$/.test(v)){e.preventDefault();window.__go(v)}},true);
window.addEventListener('hashchange',function(){location.reload()});})();""" % json.dumps(ROUTES)

D = [
 ['👤','Paj kont yo (klasik, apa)','Chak bagay gen pwòp paj li: Konekte, Kreye kont, Modpas bliye, Konplete pwofil. Ti lyen yo anba fòm lan, tankou sou Google.','connexion'],
 ['📝','Fòm pou kreye kont','Prenon, Non, dat nesans (18 an minimòm), telefòn, imèl, modpas. Si moun lan gen mwens pase 18 an, fòm lan refize l.','inscription'],
 ['🔑','Modpas bliye','Moun lan antre imèl li, epi li resevwa yon lyen. Mesaj la pa di si kont lan egziste (sekirite).','mot-de-passe-oublie'],
 ['🌐','Google, Facebook ak X','Bouton yo la pou moun ki pa vle ranpli fòm lan. (Yo mache sèlman lè Supabase konekte.)','inscription'],
 ['🛒','Achte san kont','Moun lan ka kòmande san kont (komand WhatsApp). Kont lan sèvi pou avantaj manm yo: anons, favori, swivi.',''],
 ['🧩','Anba sit la (footer)','Logo orijinal, © 2026, ak ikòn rezo sosyal (Facebook, WhatsApp, imèl). Lòt rezo yo ap parèt lè w ban m lyen yo.','home|bottom'],
 ['📲','Bouton Enstale app la','Sou Chrome, li parèt nan footer la. Li pa parèt sou Artifact la; li parèt sou vrè sit la (Vercel).',''],
 ['🧾','Fich pwodwi','Nan Boutik, peze “Gade pwodwi a”: fenèt aksesib (klavye, Échap), varyant afiche.','boutique'],
 ['🚫','Paj 404','Eseye yon adrès ki pa egziste.','paj-sa-a-pa-egziste'],
 ['⛔','Sa ki dezaktive isit la','Kont reyèl, panye manm, Turnstile ak admin bezwen Supabase. Isit la fòm yo verifye done yo sèlman, anyen pa anrejistre. Pri yo pa konfime, kidonk bouton Ajoute a gri.','']
]
upd_js = """(function(){var D=%s;
var b=document.createElement('button');b.id='upd-btn';b.type='button';b.textContent='🛠 Mizajou';document.body.appendChild(b);
var st=document.createElement('style');st.textContent='#upd-btn{position:fixed;inset-inline-start:12px;inset-block-end:calc(12px + env(safe-area-inset-bottom,0px));z-index:900;background:#e8532b;color:#fff;border:0;border-radius:999px;padding:10px 16px;font:600 14px/1 inherit;box-shadow:0 8px 20px rgba(0,0,0,.25);cursor:pointer}.upd-i{border-top:1px solid var(--line);padding:10px 0}.upd-i b{display:block}.upd-i button{background:none;border:0;color:var(--orange);font-weight:700;cursor:pointer;padding:4px 0}';document.head.appendChild(st);
if(sessionStorage.getItem('updBottom')){sessionStorage.removeItem('updBottom');setTimeout(function(){window.scrollTo(0,document.body.scrollHeight)},900)}
function open(){if(document.querySelector('.pm-backdrop'))return;var r=document.createElement('div');r.className='pm-backdrop';
r.innerHTML='<div class="pm" role="dialog" aria-modal="true" aria-labelledby="upd-t" tabindex="-1"><button type="button" class="pm-x" aria-label="Fèmen">×</button><h2 id="upd-t">Sa mwen mete ajou</h2><p class="pm-note">Aperçu vizitè sou Artifact. Se menm kòd ak zip la, san Supabase.</p>'+D.map(function(d){return '<div class="upd-i"><b>'+d[0]+' '+d[1]+'</b><span>'+d[2]+'</span>'+(d[3]?'<br><button type="button" data-g="'+d[3]+'">Wè li →</button>':'')+'</div>'}).join('')+'</div>';
document.body.appendChild(r);document.body.classList.add('pm-open');r.querySelector('.pm').focus();
function c(){document.removeEventListener('keydown',k,true);r.remove();document.body.classList.remove('pm-open');b.focus()}
function k(e){if(e.key==='Escape'){e.preventDefault();c()}}document.addEventListener('keydown',k,true);
r.addEventListener('click',function(e){if(e.target===r||e.target.closest('.pm-x')){c();return}var g=e.target.closest('[data-g]');if(g){var p=g.dataset.g.split('|');if(p[1]==='bottom')sessionStorage.setItem('updBottom','1');location.hash='#'+p[0];location.reload()}})}
b.onclick=open;})();""" % json.dumps(D, ensure_ascii=False)

html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="color-scheme" content="light"><meta name="theme-color" content="#132f43"><title>Imagie Création — aperçu</title>
<style>:root{{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}html{{scroll-padding-top:calc(80px + env(safe-area-inset-top,0px))}}
{css}
.site-header{{top:env(safe-area-inset-top,0px)}}</style></head>
<body data-page="home"><script>{page_js}</script><div id="app"></div>
<script>window.__CATALOG__={json.dumps(cat, ensure_ascii=False)};window.__LOGO__="data:image/jpeg;base64,{logo}";</script>
<script type="module">
{modal_s}
{auth_s}
{app}
</script><script>{upd_js}</script></body></html>"""
out = sys.argv[1] if len(sys.argv) > 1 else 'preview.html'
open(out, 'w', encoding='utf-8').write(html)
print('written', out, len(html)//1024, 'KB; location.href rewrites in app.js:', n1)
