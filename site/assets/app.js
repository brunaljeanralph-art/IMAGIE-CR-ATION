import { supabase, isSupabaseConfigured } from './supabase-client.js';
import { openProductModal } from './product-modal.js';
import { authPageHtml, bindAuthPage } from './auth-pages.js';
import { createCompareTools, filterAndSortProducts, getRecommendations } from './services/storefront-tools.js';
const PHONE_MAIN='50940437940';
// Community membership is required by default. Guest purchase must be explicitly enabled by the owner.
const GUEST_PURCHASE=import.meta.env?.VITE_ALLOW_GUEST_PURCHASE==='true';
const GUEST_CART_KEY='imagie-guest-cart';
const authCtx=()=>({supabase,lang:currentLang,turnstileSiteKey:TURNSTILE_SITE_KEY,termsVersion:COMMUNITY_TERMS_VERSION,esc:escapeHtml,phoneMain:PHONE_MAIN});
const AUTH_PAGES=['connexion','inscription','mot-de-passe-oublie','completer-profil'];
const loadGuestCart=()=>{if(!GUEST_PURCHASE)return [];try{const v=JSON.parse(localStorage.getItem(GUEST_CART_KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.sku==='string'&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<1000).map(x=>({sku:x.sku,qty:x.qty,variantId:typeof x.variantId==='string'?x.variantId:null,variantLabel:typeof x.variantLabel==='string'?x.variantLabel:'',priceAdjustment:Number(x.priceAdjustment)||0})):[]}catch(_){return []}};
const canOrderProduct=p=>{const variants=Array.isArray(p?.variants)?p.variants.filter(v=>v.active!==false&&Number(p?.price??0)+Number(v.price_adjustment||0)>=0):[];const stockOk=!p?.track_inventory||(variants.length?variants.some(v=>Number(v.stock_quantity)>0):Number(p?.stock_quantity)>0);return p?.price!==null&&p?.price!==undefined&&p?.price_status==='active'&&stockOk&&(p?.backend_ready===true||(GUEST_PURCHASE&&!cartOwnerId));};
const TURNSTILE_SITE_KEY=(import.meta.env?.VITE_TURNSTILE_SITE_KEY||'').trim();
const WEB_PUSH_PUBLIC_KEY=(import.meta.env?.VITE_WEB_PUSH_PUBLIC_KEY||'').trim();
const SOCIAL_ICONS={facebook:'<path d="M14 8h2.5V4.5H14A4 4 0 0 0 10 8.5V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V9a1 1 0 0 1 1-1z"/>',whatsapp:'<path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.8-2-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2z"/>',email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',instagram:'<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r=".6"/>',x:'<path d="M4.5 4.5l15 15M19.5 4.5l-15 15"/>',tiktok:'<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2 3.8 4.5 4"/>',youtube:'<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.5 9.5v5l4-2.5z"/>',linkedin:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 11v5M8 8v.01M11.5 16v-5M11.5 13c0-1.5 1-2 2.2-2s2.3.7 2.3 2.3V16"/>'};
// Add the owner's real profile URLs here (empty = icon hidden; nothing is invented).
const socialLinks=()=>[['facebook','Facebook',CONTACT.facebook],['whatsapp','WhatsApp',`https://wa.me/${PHONE_MAIN}`],['email','E-mail',`mailto:${CONTACT.email}`],['instagram','Instagram',''],['x','X',''],['tiktok','TikTok',''],['youtube','YouTube',''],['linkedin','LinkedIn','']].filter(x=>x[2]);
let deferredInstall=null;
const INSTALL_TXT={fr:'📲 Installer l’app',ht:'📲 Enstale app la',en:'📲 Install the app',es:'📲 Instalar la app'};
const IOS_HINT={fr:'Sur iPhone : Partager ⬆ puis « Sur l’écran d’accueil ».',ht:'Sou iPhone: Pataje ⬆ epi « Sou ekran akèy ».',en:'On iPhone: Share ⬆ then “Add to Home Screen”.',es:'En iPhone: Compartir ⬆ y «Añadir a pantalla de inicio».'};
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;const b=document.getElementById('install-app');if(b&&!isStandalone())b.hidden=false});
window.addEventListener('appinstalled',()=>{deferredInstall=null;const b=document.getElementById('install-app');if(b)b.hidden=true});
const socialRow=()=>`<ul class="social-row">${socialLinks().map(([id,label,url])=>`<li><a href="${escapeHtml(url)}" aria-label="${label}" ${url.startsWith('mailto:')?'':'target="_blank" rel="noopener"'}><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOCIAL_ICONS[id]}</svg></a></li>`).join('')}</ul>`;
const CONTACT={main:'+509 40 43 7940',secondary1:'+509 36 94 2951',secondary2:'+509 35 61 1326',email:'dieudonnejuillet473@gmail.com',facebook:'https://www.facebook.com/profile.php?id=61558712566102',location:'Carrefour, Haïti'};
const PAGES=[['home','Accueil','index.html'],['boutique','Boutique','boutique.html'],['metiers','Nos métiers','metiers.html'],['offres','Offres','offres.html'],['a-propos','À propos','a-propos.html'],['suivi','Suivre ma commande','suivi.html'],['compte','Mon compte','compte.html'],['contact','Contact','contact.html']];
const LANGS=[['fr','🇫🇷 Français'],['ht','🇭🇹 Kreyòl'],['en','🇬🇧 English'],['es','🇪🇸 Español'],['pt','🇧🇷 Português'],['de','🇩🇪 Deutsch'],['it','🇮🇹 Italiano'],['ar','🇸🇦 العربية'],['zh','🇨🇳 中文']];
const T={
 fr:{welcome:'Bienvenue chez Imagie Création',hero:'Vos idées, en couleurs.',intro:'Impression, personnalisation et création sur mesure. Découvrez nos produits, nos équipements et nos services.',shop:'Découvrir la boutique',services:'Nos services',popular:'Les produits préférés de nos clients',new:'Découvertes & nouveautés',why:'Pourquoi choisir Imagie Création ?',about:'Une créativité au service de vos idées',all:'Tous',search:'Rechercher un produit ou un code',add:'Ajouter au panier',view:'Voir le produit',quote:'Demander un devis',pricePending:'Prix à confirmer',cart:'Mon panier',checkout:'Commander sur WhatsApp',empty:'Votre panier est vide.',home:'Accueil',contact:'Contact',track:'Suivre ma commande',account:'Mon compte',offers:'Offres & promotions',categories:'Catégories',noProduct:'Aucun produit trouvé.',
 },
 ht:{welcome:'Byenveni lakay Imagie Création',hero:'Ide ou yo, an koulè.',intro:'Enpresyon, pèsonalizasyon ak kreyasyon sou mezi. Dekouvri pwodwi, ekipman ak sèvis nou yo.',shop:'Dekouvri boutik la',services:'Sèvis nou yo',popular:'Pwodwi kliyan nou yo pi renmen',new:'Dekouvèt ak nouvo arivaj',why:'Poukisa chwazi Imagie Création?',about:'Kreyativite nan sèvis lide ou yo',all:'Tout',search:'Chèche yon pwodwi oswa yon kòd',add:'Ajoute nan panye',view:'Gade pwodwi a',quote:'Mande yon devi',pricePending:'Pri pou konfime',cart:'Panye mwen',checkout:'Kòmande sou WhatsApp',empty:'Panye ou vid.',home:'Akèy',contact:'Kontak',track:'Swiv kòmand mwen',account:'Kont mwen',offers:'Òf ak pwomosyon',categories:'Kategori',noProduct:'Pa gen pwodwi ki koresponn.',
 },
 en:{welcome:'Welcome to Imagie Création',hero:'Bring your ideas to life.',intro:'Printing, customization and made-to-order creations. Explore our products, equipment and services.',shop:'Explore the shop',services:'Our services',popular:'Customer favourites',new:'Discoveries & new arrivals',why:'Why choose Imagie Création?',about:'Creativity at the service of your ideas',all:'All',search:'Search by product or code',add:'Add to cart',view:'View product',quote:'Request a quote',pricePending:'Price to be confirmed',cart:'My cart',checkout:'Order on WhatsApp',empty:'Your cart is empty.',home:'Home',contact:'Contact',track:'Track my order',account:'My account',offers:'Offers & promotions',categories:'Categories',noProduct:'No products found.',
 },
 es:{welcome:'Bienvenido a Imagie Création',hero:'Tus ideas, llenas de color.',intro:'Impresión, personalización y creación a medida. Descubre nuestros productos, equipos y servicios.',shop:'Ver la tienda',services:'Nuestros servicios',popular:'Los favoritos de nuestros clientes',new:'Novedades',why:'¿Por qué elegir Imagie Création?',about:'Creatividad al servicio de tus ideas',all:'Todos',search:'Buscar producto o código',add:'Añadir al carrito',view:'Ver producto',quote:'Solicitar presupuesto',pricePending:'Precio por confirmar',cart:'Mi carrito',checkout:'Pedir por WhatsApp',empty:'Tu carrito está vacío.',home:'Inicio',contact:'Contacto',track:'Seguir mi pedido',account:'Mi cuenta',offers:'Ofertas y promociones',categories:'Categorías',noProduct:'No se encontraron productos.',
 },
 pt:{welcome:'Bem-vindo à Imagie Création',hero:'Dê vida às suas ideias.',intro:'Impressão, personalização e criação sob medida.',shop:'Ver a loja',services:'Nossos serviços',popular:'Favoritos dos clientes',all:'Todos',search:'Pesquisar produto ou código',add:'Adicionar ao carrinho',quote:'Solicitar orçamento',pricePending:'Preço a confirmar',home:'Início',contact:'Contato',track:'Acompanhar pedido',account:'Minha conta',offers:'Ofertas',categories:'Categorias'},
 de:{welcome:'Willkommen bei Imagie Création',hero:'Ideen in Farbe.',intro:'Druck, Personalisierung und maßgeschneiderte Kreationen.',shop:'Shop entdecken',services:'Unsere Leistungen',popular:'Kundenfavoriten',all:'Alle',search:'Produkt oder Code suchen',add:'In den Warenkorb',quote:'Angebot anfragen',pricePending:'Preis auf Anfrage',home:'Startseite',contact:'Kontakt',track:'Bestellung verfolgen',account:'Mein Konto',offers:'Angebote',categories:'Kategorien'},
 it:{welcome:'Benvenuti da Imagie Création',hero:'Dai colore alle tue idee.',intro:'Stampa, personalizzazione e creazioni su misura.',shop:'Scopri il negozio',services:'I nostri servizi',popular:'I preferiti dei clienti',all:'Tutti',search:'Cerca un prodotto o codice',add:'Aggiungi al carrello',quote:'Richiedi un preventivo',pricePending:'Prezzo da confermare',home:'Home',contact:'Contatti',track:'Traccia ordine',account:'Il mio account',offers:'Offerte',categories:'Categorie'},
 ar:{welcome:'مرحبًا بكم في Imagie Création',hero:'حوّل أفكارك إلى ألوان.',intro:'الطباعة والتخصيص والإبداع حسب الطلب.',shop:'اكتشف المتجر',services:'خدماتنا',popular:'منتجات يفضلها العملاء',all:'الكل',search:'ابحث عن منتج أو رمز',add:'أضف إلى السلة',quote:'اطلب عرض سعر',pricePending:'السعر قيد التأكيد',home:'الرئيسية',contact:'اتصل بنا',track:'تتبع الطلب',account:'حسابي',offers:'العروض',categories:'الفئات'},
 zh:{welcome:'欢迎来到 Imagie Création',hero:'让创意绽放色彩。',intro:'印刷、个性化定制与创意制作。',shop:'浏览商店',services:'我们的服务',popular:'客户喜爱的产品',all:'全部',search:'搜索产品或编码',add:'加入购物车',quote:'申请报价',pricePending:'价格待确认',home:'首页',contact:'联系',track:'查询订单',account:'我的账户',offers:'优惠活动',categories:'分类'}
};
let currentLang=localStorage.getItem('imagie-lang')||'fr';
let catalog={currency:'USD',categories:[],products:[]};let cart=[];let cartOwnerId=null;let cartSyncQueue=Promise.resolve();let compareTools=null;let checkoutAddresses=[];
const cartStorageKey=(userId)=>`imagie-cart:${userId}`;
const COMMUNITY_TERMS_VERSION='imagie-community-v1-2026-11-21';
const page=document.body.dataset.page||'home';
const t=(key)=>((T[currentLang]||T.fr)[key]||(T.fr[key]||key));
const money=(v)=>v==null?t('pricePending'):`$${Number(v).toFixed(2)}`;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function navLink(key,label,href){return `<a href="${href}" class="${page===key?'active':''}">${label}</a>`}
function shell(){
 document.documentElement.lang=currentLang;document.documentElement.dir=currentLang==='ar'?'rtl':'ltr';
 const navLabels={home:t('home'),boutique:'Boutique',metiers:'Nos métiers',offres:t('offers'),'a-propos':'À propos',suivi:t('track'),compte:t('account'),contact:t('contact')};
 const nav=PAGES.map(([k,l,h])=>navLink(k,navLabels[k]||l,h)).join('');
 document.getElementById('app').innerHTML=`
 <header class="site-header"><div class="container header-inner">
  <a class="brand" href="index.html" aria-label="Imagie Création - Accueil"><img src="/assets/imagie-logo-original.jpg" alt="Logo original Imagie Création"><span>IMAGIE<small>CRÉATION</small></span></a>
  <div class="head-actions"><select id="language" class="lang-select" aria-label="Langue">${LANGS.map(([v,n])=>`<option value="${v}" ${currentLang===v?'selected':''}>${n}</option>`).join('')}</select>
  <a class="icon-btn" href="compte.html" aria-label="Mon compte">♙</a><button class="icon-btn" id="open-cart" aria-label="Panier">🛒<span class="cart-count" id="cart-count">${cart.reduce((s,x)=>s+x.qty,0)}</span></button><button class="menu-btn" id="open-menu" aria-label="Ouvrir le menu">☰</button></div>
 </div></header>
 <div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" id="drawer"><div class="drawer-top"><div class="footer-brand"><img src="/assets/imagie-logo-original.jpg" alt=""><b>IMAGIE CRÉATION</b></div><button class="menu-btn" id="close-menu" aria-label="Fermer">×</button></div><nav>${nav}</nav><p class="drawer-note">Votre imagination, notre création. · Carrefour, Haïti</p></aside>
 <main id="main-content"></main>
 <section class="push-consent" id="push-consent" aria-live="polite" hidden><div><b>Recevez les nouveautés IMAGIE CRÉATION</b><p>Autorisez les notifications pour découvrir les nouveaux produits, offres et annonces de la communauté.</p></div><div class="push-consent-actions"><button class="btn small" id="enable-push" type="button">Activer les notifications</button><button class="btn small secondary" id="dismiss-push" type="button">Pas maintenant</button></div><p class="push-consent-status" id="push-consent-status" role="status"></p></section>
 <footer class="site-footer"><div class="container"><div class="footer-grid"><div><div class="footer-brand"><img src="/assets/imagie-logo-original.jpg" alt="Logo Imagie Création"><div><b>IMAGIE CRÉATION</b><p>Impression, personnalisation et solutions créatives.</p></div></div><p>Vos idées, en couleurs.</p></div><div><h3>Navigation</h3><div class="footer-links">${PAGES.slice(0,4).map(([k,l,h])=>`<a href="${h}">${({home:t('home'),boutique:'Boutique',metiers:'Nos métiers',offres:t('offers')})[k]||l}</a>`).join('')}</div></div><div><h3>Informations</h3><div class="footer-links"><a href="a-propos.html">À propos</a><a href="confidentialite.html">Confidentialité</a><a href="conditions.html">Conditions générales</a><a href="livraison.html">Livraison & retours</a></div></div><div><h3>Contact</h3><div class="footer-links"><a href="tel:+50940437940">${CONTACT.main}</a><a href="tel:+50936942951">${CONTACT.secondary1}</a><a href="tel:+50935611326">${CONTACT.secondary2}</a><a href="mailto:${CONTACT.email}">${CONTACT.email}</a><a href="${CONTACT.facebook}" target="_blank" rel="noopener">Facebook · Imagie Création</a><span>${CONTACT.location}</span></div></div></div><div class="footer-brandbar"><div class="fb-id"><img src="/assets/imagie-logo-original.jpg" alt=""><span class="fb-word">IMAGIE CRÉATION</span></div><p class="fb-copy">© 2026 IMAGIE CRÉATION · Tous droits réservés</p><p class="fb-tag">Créativité · Qualité · Personnalisation</p>${socialRow()}<button id="install-app" class="btn small secondary install-btn" type="button" hidden>${INSTALL_TXT[currentLang]||INSTALL_TXT.en}</button></div></div></footer>
 <div class="drawer-cart" id="cart-overlay"><div class="cart-panel"><div class="section-head"><div><div class="kicker">IMAGIE CRÉATION</div><h2>${t('cart')}</h2></div><button class="icon-btn" id="close-cart" style="color:var(--navy);border-color:var(--line);background:#fff">×</button></div><div id="cart-items"></div><div id="cart-summary"></div></div></div><div class="toast" id="toast"></div>`;
 document.getElementById('language').addEventListener('change',e=>{currentLang=e.target.value;localStorage.setItem('imagie-lang',currentLang);location.reload()});
 const drawer=document.getElementById('drawer'),back=document.getElementById('drawer-backdrop');
 const setDrawer=open=>{drawer.classList.toggle('open',open);back.classList.toggle('open',open)};
 document.getElementById('open-menu').onclick=()=>setDrawer(true);document.getElementById('close-menu').onclick=()=>setDrawer(false);back.onclick=()=>setDrawer(false);drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setDrawer(false)));
 document.getElementById('open-cart').onclick=openCart;document.getElementById('close-cart').onclick=closeCart;document.getElementById('cart-overlay').addEventListener('click',e=>{if(e.target.id==='cart-overlay')closeCart()});
 const installBtn=document.getElementById('install-app');
 const isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);
 if(!isStandalone()&&(deferredInstall||isIos))installBtn.hidden=false;
 installBtn.onclick=async()=>{if(deferredInstall){deferredInstall.prompt();try{await deferredInstall.userChoice}catch(_){}deferredInstall=null;installBtn.hidden=true}else showToast(IOS_HINT[currentLang]||IOS_HINT.en)};
 renderCartCount();
}
function pageHeader(title,desc){return `<section class="page-hero"><div class="container page-heading"><div class="crumb"><a href="index.html">${t('home')}</a> / ${escapeHtml(title)}</div><div class="kicker">IMAGIE CRÉATION</div><h1>${title}</h1><p>${desc}</p></div></section>`}
function productCard(p){
 const cat=(catalog.categories||[]).find(c=>c.slug===p.category);
 const price=p.price==null?`<span class="price pending">${t('pricePending')}</span>`:`<span class="price">${money(p.price)}${p.price_status!=='active'?'<small class="smallprint"> · prix provisoire / à valider</small>':''}</span>`;
 const icon=({sublimation:'☕',equipment:'⚙️',print:'🖨️',embroidery:'🧵',consumables:'🧰',textile:'👕',promotion:'🎁'})[p.category]||'✨';
 const art=p.image_url?`<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p['name_'+currentLang]||p.name_fr)}" loading="lazy">`:`<span class="emoji">${icon}</span>`;
 const canOrder=canOrderProduct(p);
 const addButton=canOrder?(p.variants?.length?`<button class="btn small" data-add="${escapeHtml(p.sku)}">Choisir une option</button>`:`<button class="btn small" data-add="${escapeHtml(p.sku)}">${t('add')}</button>`):`<button class="btn small" disabled title="Produit visible, mais son prix, son stock ou sa configuration doit être validé avant la commande">${p.price==null?t('pricePending'):'Bientôt disponible'}</button>`;
 const compared=compareTools?.isSelected(p.sku)===true;
 return `<article class="product-card reveal"><div class="product-art">${art}<small>${escapeHtml(cat?.name_fr||'Produit')}</small></div><div class="product-info"><span class="sku">${escapeHtml(p.sku)}</span><h3>${escapeHtml(p['name_'+currentLang]||p.name_fr)}</h3><p>${p.variants?.length?escapeHtml(p.variants.map(v=>v.display_name||v.name||v.sku).join(' · ')):'Personnalisable selon disponibilité'}</p>${price}<div class="card-actions">${addButton}<button class="btn small secondary" data-details="${escapeHtml(p.sku)}">${t('view')}</button><button class="btn small outline" data-wishlist="${escapeHtml(p.sku)}" aria-label="Ajouter aux favoris">♡</button><button class="btn small outline" data-compare="${escapeHtml(p.sku)}" aria-pressed="${compared}">${compared?'✓ Comparé':'⇄ Comparer'}</button></div></div></article>`;
}
function home(){const featured=catalog.products.slice(0,8);return `<div class="container"><section class="hero"><div class="hero-copy"><span class="eyebrow">✦ ${t('welcome')}</span><h1>${t('hero')}</h1><p>${t('intro')}</p><div class="hero-actions"><a class="btn" href="boutique.html">${t('shop')} →</a><a class="btn secondary" href="https://wa.me/${PHONE_MAIN}?text=${encodeURIComponent('Bonjour Imagie Création, je souhaite avoir des informations sur vos produits et services.')}" target="_blank" rel="noopener">Commander sur WhatsApp</a></div></div><div class="hero-art"><div class="art-orbit"><span class="paint">🎨</span></div></div><div class="slider-controls" id="slider-controls"><button class="slider-dot active" data-slide="0" aria-label="Diapositive 1"></button><button class="slider-dot" data-slide="1" aria-label="Diapositive 2"></button><button class="slider-dot" data-slide="2" aria-label="Diapositive 3"></button><button class="slider-pause" id="slider-pause">Ⅱ Pause</button></div></section><div class="brand-stripe"></div></div>
 <section class="section container"><div class="section-head"><div><div class="kicker">Sélection Imagie</div><h2>${t('popular')}</h2><p>Des articles personnalisables et des solutions pour vos projets créatifs.</p></div><a class="text-link" href="boutique.html">Voir toute la boutique →</a></div><div class="grid">${featured.map(productCard).join('')}</div></section>
 <section class="dark-band"><div class="container"><div class="section-head"><div><div class="kicker">Nos engagements</div><h2>${t('why')}</h2><p>Une expérience claire, un accompagnement humain et des créations adaptées à vos besoins.</p></div></div><div class="benefit-list"><div class="benefit">✦ <b>Large choix</b><span>Produits, équipements et consommables.</span></div><div class="benefit">✦ <b>Personnalisation</b><span>Des solutions adaptées à vos idées.</span></div><div class="benefit">✦ <b>Accompagnement</b><span>Un devis avant les projets sur mesure.</span></div><div class="benefit">✦ <b>Suivi</b><span>Une information claire à chaque étape.</span></div></div></div></section>
 <section class="section container"><div class="section-head"><div><div class="kicker">Nos métiers</div><h2>${t('services')}</h2><p>Du produit vierge à la création personnalisée, découvrez nos domaines d'intervention.</p></div><a class="text-link" href="metiers.html">Tous nos métiers →</a></div>${serviceGrid()}</section>`}
function serviceGrid(){const items=[['🎨','Sublimation','Personnalisation de tasses, tumblers, textiles et objets adaptés.'],['👕','T-shirts & DTF','Impression textile et transferts pour vêtements et supports.'],['✨','Stickers UV DTF','Autocollants et transferts adaptés à plusieurs surfaces.'],['🖼️','Bannières & vinyles','Supports grand format pour événements et visibilité.'],['🧵','Broderie','Personnalisation de casquettes, polos, uniformes et sacs.'],['⚙️','Équipements & consommables','Machines, films, encres, papiers et outils de production.']];return `<div class="feature-grid">${items.map(([ic,n,d])=>`<article id="${n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]+/g,'-').replace(/^-|-$/g,'')}" class="feature-card reveal"><div class="feature-icon">${ic}</div><h3>${n}</h3><p>${d}</p><a class="text-link" href="metiers.html#${n.toLowerCase().replace(/[^a-z]+/g,'-')}">${t('quote')} →</a></article>`).join('')}</div>`}
function matchesCategory(p,cat){if(cat==='all')return true;const name=(p.name_fr||'').toLowerCase();if(cat==='cups')return /tasse|tas |mug/.test(name);if(cat==='tumblers')return /tumbler|thermos|gourde|bidon|gobelet/.test(name);if(cat==='banner')return /banni|bâche|banner|roll-up|x-banner/.test(name);return p.category===cat;}
function shop(){return `${pageHeader('Boutique','Explorez les produits, équipements et consommables. Les tarifs non confirmés seront ajoutés après validation.') }<section class="page-content container"><div class="panel shop-tools-panel" style="margin-bottom:18px"><div class="shop-filter-grid"><div class="field full"><label for="product-search">${t('search')}</label><input id="product-search" class="searchbox" type="search" placeholder="${t('search')}" aria-label="${t('search')}"></div><div class="field"><label for="product-sort">Trier par</label><select id="product-sort"><option value="featured">Sélection Imagie</option><option value="newest">Plus récents</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option><option value="name">Nom A–Z</option></select></div><div class="field"><label for="product-availability">Disponibilité</label><select id="product-availability"><option value="all">Tous les produits</option><option value="available">Commandables maintenant</option></select></div><div class="field"><label for="product-price-min">Prix minimum (USD)</label><input id="product-price-min" type="number" min="0" step="0.01" inputmode="decimal"></div><div class="field"><label for="product-price-max">Prix maximum (USD)</label><input id="product-price-max" type="number" min="0" step="0.01" inputmode="decimal"></div><div class="field"><label>&nbsp;</label><button type="button" class="btn secondary" id="clear-product-filters">Effacer les filtres</button></div></div><div class="category-row" id="category-filters"><button class="chip active" data-category="all">${t('all')}</button>${[['cups','Tasses'],['tumblers','Tumblers'],['textile','Textile'],['banner','Bannières'],['equipment','Équipements'],['print','Impressions'],['embroidery','Broderie'],['consumables','Consommables'],['sublimation','Sublimation']].map(([slug,label])=>`<button class="chip" data-category="${slug}">${label}</button>`).join('')}</div><div class="compare-toolbar"><span id="compare-count">0/3 produit(s)</span><div><button class="btn small" id="compare-open" type="button" disabled>Comparer les produits</button><button class="btn small secondary" id="compare-clear" type="button" disabled>Vider</button></div></div></div><div class="section-head"><div><h2 id="results-title">${catalog.products.length} références à configurer</h2><p>Les prix, stocks et variantes définitifs sont validés depuis le catalogue sécurisé.</p></div></div><div class="grid" id="product-list">${catalog.products.map(productCard).join('')}</div></section>`}
function services(){return `${pageHeader('Nos métiers','Des solutions de création, d’impression et de personnalisation pour vos projets personnels et professionnels.')}<section class="page-content container"><div class="feature-grid">${[['🎨','Sublimation','Personnalisation de tasses, tumblers, textiles et objets adaptés.'],['👕','T-shirts & DTF','Impression textile et transferts pour vêtements et supports.'],['✨','Stickers UV DTF','Autocollants et transferts adaptés à plusieurs surfaces.'],['🖼️','Bannières & vinyles','Supports grand format pour événements et visibilité.'],['🧵','Broderie','Personnalisation de casquettes, polos, uniformes et sacs.'],['⚙️','Équipements & consommables','Machines, films, encres, papiers et outils de production.']].map(([ic,n,d])=>`<article class="feature-card reveal"><div class="feature-icon">${ic}</div><h3>${n}</h3><p>${d}</p></article>`).join('')}</div><div class="panel" id="quote-form-panel" style="margin-top:24px"><div class="section-head"><div><div class="kicker">Projet personnalisé</div><h2>Demander un devis</h2><p>Réservé aux membres IMAGIE. Décrivez votre projet et joignez votre logo, visuel ou document si nécessaire.</p></div></div><form id="quote-form" class="form-grid"><div class="field"><label for="quote-name">Nom complet</label><input id="quote-name" name="name" autocomplete="name" required maxlength="120"></div><div class="field"><label for="quote-phone">Téléphone</label><input id="quote-phone" name="phone" type="tel" required maxlength="30"></div><div class="field"><label for="quote-service">Service demandé</label><select id="quote-service" name="service_type" required><option value="">Choisir un service</option><option>Sublimation</option><option>DTF / UV DTF</option><option>Stickers / vinyle</option><option>Bannières / impression grand format</option><option>Broderie</option><option>Création graphique / logo</option><option>Équipement / consommables</option><option>Autre</option></select></div><div class="field"><label for="quote-quantity">Quantité estimée</label><input id="quote-quantity" name="quantity" type="number" min="1" max="100000" step="1"></div><div class="field"><label for="quote-dimensions">Dimensions / format</label><input id="quote-dimensions" name="dimensions" maxlength="160" placeholder="Ex. 30 x 40 cm, 40 oz…"></div><div class="field"><label for="quote-deadline">Date souhaitée</label><input id="quote-deadline" name="deadline" type="date"></div><div class="field full"><label for="quote-details">Description du projet</label><textarea id="quote-details" name="details" required minlength="10" rows="4" maxlength="4000" placeholder="Décrivez le produit, les couleurs, la personnalisation, la quantité et les détails utiles."></textarea></div><div class="field full"><label for="quote-file">Logo ou fichier de référence (JPG, PNG, WebP ou PDF, 15 Mo maximum)</label><input id="quote-file" name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></div><div class="field full"><button class="btn" type="submit">Envoyer ma demande de devis</button><p id="quote-message" class="smallprint" role="status" aria-live="polite">Vous devez être membre connecté pour envoyer une demande et retrouver son suivi dans votre compte.</p></div></form></div></section>`}

function offers(){return `${pageHeader('Offres & promotions','Retrouvez les offres Imagie Création. Les promotions seront publiées uniquement après validation de leurs conditions et de leurs tarifs.')}<section class="page-content container"><div class="feature-grid"><article class="offer-card" style="padding:25px"><div class="feature-icon">🎁</div><h3>Offres personnalisées</h3><p>Demandez une proposition selon la quantité et le type de personnalisation.</p><a class="btn small" href="contact.html">Demander un devis</a></article><article class="offer-card" style="padding:25px"><div class="feature-icon">🏷️</div><h3>Promotions saisonnières</h3><p>Les campagnes et dates seront ajoutées par l'administrateur.</p><span class="smallprint">Aucune promotion fictive affichée.</span></article><article class="offer-card" style="padding:25px"><div class="feature-icon">📦</div><h3>Commandes en quantité</h3><p>Pour les commandes en volume, contactez-nous afin de recevoir un devis adapté.</p><a class="btn small" href="contact.html">Nous contacter</a></article></div></section>`}
function about(){return `${pageHeader('À propos','Imagie Création transforme les idées en produits et supports personnalisés.')}<section class="page-content container"><div class="split"><div class="panel"><div class="kicker">Notre vision</div><h2 style="color:var(--navy)">La créativité au service de vos projets.</h2><p>IMAGIE CRÉATION rassemble la personnalisation, l'impression et la création graphique dans une expérience simple et accessible.</p><p>Notre ambition est de proposer des produits et des solutions adaptés aux particuliers, aux créateurs et aux entreprises.</p></div><div class="panel"><div class="kicker">Notre mission</div><h2 style="color:var(--navy)">Faire de chaque idée une création.</h2><p>Écouter le besoin, conseiller le bon support, préparer la personnalisation et accompagner le client jusqu'à la livraison.</p><p>Les détails historiques et la touche personnelle du fondateur seront ajoutés à partir des informations qu'il aura validées.</p></div></div><div class="panel" style="margin-top:18px"><h2 style="color:var(--navy)">Pourquoi nous choisir ?</h2><div class="benefit-list" style="margin-top:18px"><div class="benefit" style="background:#f7fafb;border-color:var(--line);color:var(--navy)"><b>Large choix</b><span>Produits et équipements.</span></div><div class="benefit" style="background:#f7fafb;border-color:var(--line);color:var(--navy)"><b>Sur mesure</b><span>Personnalisation selon le projet.</span></div><div class="benefit" style="background:#f7fafb;border-color:var(--line);color:var(--navy)"><b>Accompagnement</b><span>Conseils et devis clairs.</span></div><div class="benefit" style="background:#f7fafb;border-color:var(--line);color:var(--navy)"><b>Transparence</b><span>Prix et délais confirmés.</span></div></div></div></section>`}
function tracking(){return `${pageHeader('Suivre ma commande','Entrez vos informations pour consulter l’avancement de votre commande.')}<section class="page-content container"><div class="panel" style="max-width:650px;margin:auto"><form id="tracking-form" class="form-grid"><div class="field full"><label>Code de commande</label><input name="code" required placeholder="Ex. IM-2026-0001"></div><div class="field full"><label>Téléphone utilisé lors de la commande</label><input name="phone" required type="tel" placeholder="+509 ..."></div><div class="field full"><button class="btn" type="submit">Rechercher ma commande</button></div></form><div id="tracking-result" style="margin-top:14px"></div><div class="notice info" style="margin-top:17px">Connectez-vous avec votre compte client. Pour protéger vos informations, vous ne pourrez consulter que les commandes associées à votre compte et au téléphone enregistré.</div></div></section>`}
function account(){return `${pageHeader('Mon compte','Créez votre compte Imagie pour rejoindre notre communauté et profiter de votre espace client.')}<section class="page-content container">
<div class="notice info community-intro"><b>Bienvenue dans la communauté IMAGIE.</b> Créez gratuitement votre compte pour retrouver vos commandes, sauvegarder vos informations, demander des devis et accéder aux avantages réservés aux membres.</div>
<div id="auth-config-warning" class="notice danger" hidden>La connexion sécurisée n’est pas encore configurée. Le propriétaire doit connecter le projet Supabase avant que les comptes clients puissent être activés.</div>
<div id="auth-status" class="notice info" role="status" aria-live="polite">Vous pouvez parcourir le catalogue. Un compte membre est obligatoire pour ajouter au panier, commander, suivre vos commandes et profiter des avantages de la communauté.</div>
<div class="panel captcha-panel"><div class="kicker">Protection du compte</div><h3>Vérification de sécurité</h3><p class="smallprint">Confirmez que vous êtes une personne réelle avant de créer un compte, de vous connecter ou de réinitialiser votre mot de passe.</p><div id="turnstile-widget"></div><p id="captcha-status" class="smallprint" role="status" aria-live="polite">Chargement de la vérification anti-robot…</p></div>
<div id="account-auth" class="split account-auth-grid">
 <div class="panel"><div class="kicker">Nouveau membre</div><h2 style="color:var(--navy)">Créer mon compte</h2><p>Rejoignez la communauté Imagie Création. L’inscription est gratuite.</p>
  <form id="signup-form" class="form-grid">
   <div class="field full"><label for="signup-name">Nom complet</label><input id="signup-name" name="full_name" autocomplete="name" required maxlength="120"></div>
   <div class="field full"><label for="signup-phone">Téléphone</label><input id="signup-phone" name="phone" type="tel" autocomplete="tel" required maxlength="30"></div>
   <div class="field full"><label for="signup-email">Adresse e-mail</label><input id="signup-email" name="email" type="email" autocomplete="email" required maxlength="254"></div>
   <div class="field full"><label for="signup-password">Mot de passe</label><input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="10" required><small class="smallprint">10 caractères minimum. Utilisez un mot de passe unique.</small></div>
   <div class="field full"><label class="checkbox-line"><input type="checkbox" name="terms" required> Je confirme vouloir rejoindre gratuitement la communauté IMAGIE CRÉATION. J’accepte les <a href="conditions.html" target="_blank" rel="noopener">conditions d’utilisation</a> et la <a href="confidentialite.html" target="_blank" rel="noopener">politique de confidentialité</a>.</label></div>
   <div class="field full"><button class="btn" type="submit">Créer mon compte membre</button></div>
  </form>
 </div>
 <div class="panel"><div class="kicker">Déjà membre ?</div><h2 style="color:var(--navy)">Se connecter</h2>
  <form id="login-form" class="form-grid">
   <div class="field full"><label for="login-email">Adresse e-mail</label><input id="login-email" name="email" type="email" autocomplete="username" required></div>
   <div class="field full"><label for="login-password">Mot de passe</label><input id="login-password" name="password" type="password" autocomplete="current-password" required></div>
   <div class="field full"><button class="btn" type="submit">Connexion à mon compte</button></div>
  </form>
  <div class="auth-separator"><span>ou continuer avec</span></div>
  <div class="field full"><label class="checkbox-line"><input type="checkbox" id="oauth-community-consent"> J’accepte de rejoindre la communauté IMAGIE et ses conditions.</label></div>
  <div class="auth-provider-grid"><button class="btn secondary" id="oauth-google" type="button">Continuer avec Google</button><button class="btn secondary" id="oauth-facebook" type="button">Continuer avec Facebook</button></div><p class="smallprint">Les connexions Google et Facebook utilisent les contrôles d’identité et anti-abus propres à chaque fournisseur. Elles doivent être configurées et testées dans Supabase avant activation publique.</p>
  <form id="reset-form" class="reset-form"><div class="field"><label for="reset-email">Mot de passe oublié ? Saisissez votre e-mail</label><input id="reset-email" name="email" type="email" required></div><button class="text-link" type="submit">Recevoir un lien de réinitialisation</button></form>
 </div>
</div>
<div id="member-area" hidden>
 <div id="community-acceptance-panel" class="panel notice info" hidden><h3>Finaliser votre adhésion à la communauté</h3><p>Avant d’utiliser le panier et les avantages membres, confirmez votre adhésion et l’acceptation des conditions IMAGIE CRÉATION.</p><label class="checkbox-line"><input type="checkbox" id="member-consent-checkbox"> J’accepte de rejoindre la communauté IMAGIE CRÉATION et ses conditions.</label><button class="btn" id="member-consent-button" type="button" disabled>Confirmer mon adhésion</button></div>
 <div class="member-welcome panel"><div><div class="kicker">Espace membre</div><h2 id="member-name" style="color:var(--navy)">Bienvenue</h2><p>Vous faites partie de la communauté Imagie Création.</p><a id="owner-console-link" class="btn small" href="admin.html" hidden>Ouvrir la console propriétaire</a></div><button class="btn secondary small" id="signout-button" type="button">Se déconnecter</button></div>
 <div class="membership-card panel"><div><div class="kicker">Votre carte membre</div><h2>IMAGIE COMMUNITY</h2><p id="member-number" class="member-number">Identifiant membre —</p></div><div class="membership-meta"><span id="member-tier">Membre</span><b id="member-points">0 point</b></div></div>
 <div class="feature-grid member-benefits">
  <article class="feature-card"><div class="feature-icon">📦</div><h3>Mes commandes</h3><p>Retrouvez l’historique et consultez les états de vos commandes.</p></article>
  <article class="feature-card"><div class="feature-icon">📍</div><h3>Mes informations</h3><p>Enregistrez votre téléphone et vos adresses pour simplifier vos prochaines demandes.</p></article>
  <article class="feature-card"><div class="feature-icon">🎨</div><h3>Mes projets & devis</h3><p>Retrouvez vos demandes de personnalisation et de devis.</p></article>
  <article class="feature-card"><div class="feature-icon">🎁</div><h3>Avantages membres</h3><p>Accédez aux actualités et offres réservées aux membres lorsqu’elles sont publiées. Les réductions et récompenses dépendent des campagnes actives.</p></article>
 </div>
 <div class="split member-panels">
  <div class="panel"><div class="kicker">Profil</div><h2 style="color:var(--navy)">Mes informations</h2><form id="member-profile-form" class="form-grid"><div class="field full"><label for="member-full-name">Nom complet</label><input id="member-full-name" name="full_name" required maxlength="120"></div><div class="field full"><label for="member-phone-input">Téléphone</label><input id="member-phone-input" name="phone" type="tel" maxlength="30"></div><div class="field full"><button class="btn" type="submit">Enregistrer mes informations</button></div></form></div>
  <div class="panel"><div class="kicker">Vie de la communauté</div><h2 style="color:var(--navy)">Actualités membres</h2><div id="member-announcements"><p class="smallprint">Les annonces et avantages de la communauté apparaîtront ici.</p></div></div>
 </div>
 <div class="panel member-address-panel" style="margin-top:18px"><div class="kicker">Livraison</div><h2 style="color:var(--navy)">Mes adresses</h2><p class="smallprint">Enregistrez une adresse pour simplifier vos prochaines commandes. Vous pourrez la choisir dans le panier.</p><form id="member-address-form" class="form-grid"><div class="field"><label>Nom du destinataire</label><input name="recipient_name" maxlength="120" required></div><div class="field"><label>Téléphone</label><input name="phone" type="tel" maxlength="30" required></div><div class="field"><label>Pays</label><input name="country" value="Haïti" maxlength="80" required></div><div class="field"><label>Département / Région</label><input name="region" maxlength="100"></div><div class="field"><label>Ville / Commune</label><input name="city" maxlength="100" required></div><div class="field"><label>Code postal (facultatif)</label><input name="postal_code" maxlength="20"></div><div class="field full"><label>Adresse complète</label><input name="street_address" maxlength="240" required></div><div class="field full"><label>Instructions de livraison (facultatif)</label><textarea name="delivery_notes" rows="2" maxlength="500"></textarea></div><div class="field full"><label class="checkbox-line"><input type="checkbox" name="is_default"> Définir comme adresse principale</label></div><div class="field full"><button class="btn" type="submit">Enregistrer cette adresse</button></div></form><div id="member-addresses" class="member-address-list" aria-live="polite"><p class="smallprint">Chargement des adresses…</p></div></div>
 <div class="split" style="margin-top:18px"><div class="panel"><div class="kicker">Mes favoris</div><h2 style="color:var(--navy)">Ma liste de souhaits</h2><div id="member-favorites"><p class="smallprint">Vos produits favoris apparaîtront ici.</p></div></div><div class="panel"><div class="kicker">Mon activité</div><h2 style="color:var(--navy)">Mes dernières commandes</h2><div id="member-orders"><p class="smallprint">Chargement de votre historique…</p></div></div></div>
 <div class="panel" style="margin-top:18px"><div class="kicker">Mes projets</div><h2 style="color:var(--navy)">Mes demandes de devis</h2><div id="member-quotes"><p class="smallprint">Vos demandes envoyées apparaîtront ici.</p></div><a class="text-link" href="metiers.html#quote-form-panel">Faire une nouvelle demande →</a></div>
</div>
<p class="smallprint" style="margin-top:18px">Votre compte client est distinct de l’espace d’administration. Les clients ne peuvent jamais accéder aux outils de gestion de l’entreprise.</p>
</section>`}
function contact(){return `${pageHeader('Contact','Une question, un projet ou une demande de devis ? Écrivez-nous.')}<section class="page-content container"><div class="split"><div class="panel"><div class="kicker">Écrivez-nous</div><form id="contact-form" class="form-grid"><div class="field full"><label>Votre nom</label><input name="name" required></div><div class="field"><label>Téléphone</label><input name="phone" type="tel"></div><div class="field"><label>E-mail</label><input name="email" type="email"></div><div class="field full"><label>Votre message</label><textarea name="message" required></textarea></div><div class="field full"><button class="btn" type="submit">Envoyer sur WhatsApp</button></div></form></div><div class="panel"><div class="kicker">Coordonnées</div><h2 style="color:var(--navy)">Imagie Création</h2><p>📍 ${CONTACT.location}</p><p>WhatsApp principal<br><a class="text-link" href="https://wa.me/${PHONE_MAIN}" target="_blank">${CONTACT.main}</a></p><p>Téléphones secondaires<br><a href="tel:+50936942951">${CONTACT.secondary1}</a><br><a href="tel:+50935611326">${CONTACT.secondary2}</a></p><p>E-mail<br><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p><p>Facebook<br><a class="text-link" href="${CONTACT.facebook}" target="_blank" rel="noopener">Imagie Création</a></p><div class="notice info">Vérifier les coordonnées et l'accès aux comptes sociaux avant la publication officielle.</div></div></div></section>`}
function legal(title,body){return `${pageHeader(title,'Informations utiles pour les clients d’IMAGIE CRÉATION.')}<section class="page-content container"><div class="panel"><div class="notice info">Texte provisoire : les politiques finales doivent être adaptées aux opérations réelles et validées avant le lancement.</div><h2 style="color:var(--navy)">${title}</h2><p>${body}</p></div></section>`}
function admin(){return `${pageHeader('Administration privée','Espace de contrôle réservé au propriétaire IMAGIE CRÉATION.')}<section class="page-content container"><div class="admin-shell"><div class="admin-top panel"><div><div class="kicker">Console propriétaire</div><h2 style="color:var(--navy)">Tableau de bord</h2><p>Gérez les produits, commandes, clients, demandes de devis et offres.</p></div><span class="admin-lock">🔒 Accès privé</span></div><div class="admin-stats" id="admin-stats"><div class="stat-card"><small>Produits actifs</small><b>—</b></div><div class="stat-card"><small>Commandes</small><b>—</b></div><div class="stat-card"><small>Clients membres</small><b>—</b></div><div class="stat-card"><small>Demandes de devis</small><b>—</b></div></div><div class="panel admin-section"><div class="section-head"><div><div class="kicker">Catalogue</div><h2>Ajouter un produit</h2></div></div><form id="admin-product-form" class="form-grid"><div class="field"><label>Code SKU</label><input name="sku" required maxlength="60"></div><div class="field"><label>Catégorie</label><select name="category"><option value="sublimation">Sublimation</option><option value="equipment">Équipements</option><option value="printing">Impressions</option><option value="embroidery">Broderie</option><option value="consumables">Consommables</option><option value="textile">Textiles</option><option value="promotion">Articles promotionnels</option></select></div><div class="field full"><label>Nom français</label><input name="name_fr" required maxlength="160"></div><div class="field full"><label>Description française</label><textarea name="description_fr" rows="2"></textarea></div><div class="field full"><label>Photo du produit (JPG/PNG, max. 5 Mo)</label><input name="image" type="file" accept="image/jpeg,image/png"></div><div class="field"><label>Prix (laisser vide si à confirmer)</label><input name="price" type="number" min="0" step="0.01"></div><div class="field"><label>Stock initial</label><input name="stock" type="number" min="0" step="1" value="0"></div><div class="field full"><label class="checkbox-line"><input type="checkbox" name="track_inventory" checked> Suivre le stock (décocher pour services / commandes sur devis)</label></div><div class="field full"><label class="checkbox-line"><input type="checkbox" name="active"> Publier le produit après validation</label></div><div class="field full"><button class="btn" type="submit">Enregistrer le produit</button></div></form><div id="admin-product-message" class="smallprint" role="status"></div><h3 style="margin-top:24px">Catalogue existant</h3><div id="admin-products"><p class="smallprint">Chargement des produits…</p></div></div><div class="panel admin-section"><div class="kicker">Catalogue avancé</div><h2>Variantes de produits</h2><p class="smallprint">Créez les tailles, couleurs et autres options commandables. Chaque variante possède son propre stock et peut avoir un supplément de prix.</p><form id="admin-variant-form" class="form-grid"><div class="field full"><label>Produit parent</label><select name="product_id" id="admin-variant-product" required><option value="">Chargement…</option></select></div><div class="field"><label>SKU de la variante</label><input name="sku" maxlength="60" required></div><div class="field"><label>Nom de la variante</label><input name="label_fr" maxlength="120" placeholder="Couleur / taille" required></div><div class="field full"><label>Valeurs JSON de la variante</label><input name="option_values" maxlength="1000" placeholder="{&quot;Couleur&quot;:&quot;Noir&quot;,&quot;Taille&quot;:&quot;M&quot;}" required><small class="smallprint">Exemple : {"Couleur":"Noir","Taille":"M"}. Les valeurs seront conservées dans le détail de la commande.</small></div><div class="field"><label>Supplément de prix (USD)</label><input name="price_adjustment" type="number" step="0.01" value="0" required></div><div class="field"><label>Stock de cette variante</label><input name="stock_quantity" type="number" min="0" step="1" value="0" required></div><div class="field full"><label class="checkbox-line"><input type="checkbox" name="active" checked> Variante active</label></div><div class="field full"><button class="btn" type="submit">Ajouter la variante</button></div></form><div id="admin-variant-message" class="smallprint" role="status"></div><div id="admin-variants"><p class="smallprint">Chargement des variantes…</p></div></div><div class="panel admin-section"><div class="kicker">Commandes récentes</div><h2 style="color:var(--navy)">Commandes</h2><div id="admin-orders"><p class="smallprint">Chargement…</p></div></div><div class="panel admin-section"><div class="kicker">Demandes clients</div><h2 style="color:var(--navy)">Demandes de devis</h2><div id="admin-quotes"><p class="smallprint">Chargement des demandes…</p></div></div><div class="panel admin-section"><div class="kicker">Communauté</div><h2 style="color:var(--navy)">Publier une actualité membre</h2><form id="admin-announcement-form" class="form-grid"><div class="field full"><label>Titre</label><input name="title" required maxlength="140"></div><div class="field full"><label>Message</label><textarea name="body" required rows="3"></textarea></div><div class="field full"><label class="checkbox-line"><input type="checkbox" name="active" checked> Publier pour les membres</label></div><div class="field full"><button class="btn" type="submit">Publier l’actualité</button></div></form><div id="admin-announcement-message" class="smallprint"></div></div><div class="panel admin-section"><div class="kicker">Communauté</div><h2 style="color:var(--navy)">Clients membres</h2><div id="admin-customers"><p class="smallprint">Chargement…</p></div></div></div></section>`}

async function bindCustomerTracking(){
 const form=document.getElementById('tracking-form');const result=document.getElementById('tracking-result');
 form.onsubmit=async e=>{e.preventDefault();if(!supabase){result.innerHTML='<div class="notice danger">Le service de compte n’est pas encore configuré. Réessayez après l’activation de l’espace membre.</div>';return;}const {data:{session}}=await supabase.auth.getSession();if(!session){location.href='compte.html?next=track';return;}const {data:membership}=await supabase.from('customer_memberships').select('status,community_terms_accepted_at').eq('user_id',session.user.id).maybeSingle();if(membership?.status!=='active'||!membership?.community_terms_accepted_at){result.innerHTML='<div class="notice danger">Votre adhésion Imagie Community doit être active pour consulter le suivi.</div>';return;}const f=new FormData(form);const code=String(f.get('code')).trim();const phone=String(f.get('phone')).replace(/[^0-9]/g,'');result.innerHTML='<div class="notice info">Recherche sécurisée de votre commande…</div>';const {data:order,error}=await supabase.from('orders').select('order_number,status,payment_status,customer_phone,created_at,updated_at').eq('order_number',code).eq('user_id',session.user.id).maybeSingle();if(error||!order||String(order.customer_phone||'').replace(/[^0-9]/g,'')!==phone){result.innerHTML='<div class="notice danger">Aucune commande correspondante trouvée pour ce compte et ce téléphone.</div>';return;}const statusLabels={received:'Commande reçue',awaiting_confirmation:'En attente de confirmation',payment_pending:'Paiement en attente',confirmed:'Confirmée',in_preparation:'En préparation',in_production:'En production',shipped:'Expédiée',ready_for_pickup:'Prête à retirer',delivered:'Livrée',cancelled:'Annulée',refunded:'Remboursée'};result.innerHTML=`<div class="notice info"><b>${escapeHtml(order.order_number)}</b><p>État : <strong>${escapeHtml(statusLabels[order.status]||order.status)}</strong></p><small>Dernière mise à jour : ${new Date(order.updated_at||order.created_at).toLocaleString()}</small></div>`;};
}

async function bindCustomerAccount(){
 const warn=document.getElementById('auth-config-warning');
 const status=document.getElementById('auth-status');
 const authBox=document.getElementById('account-auth');
 const memberArea=document.getElementById('member-area');
 const captchaStatus=document.getElementById('captcha-status');
 let captchaToken=null;
 let captchaWidgetId=null;
 if(!supabase){
  warn.hidden=false;
  status.textContent='Le service de compte n’est pas encore configuré. Le propriétaire doit activer Supabase avant toute saisie de mot de passe.';
  authBox.querySelectorAll('input,button').forEach(el=>el.disabled=true);
  captchaStatus.textContent='En attente de la configuration du service de compte et de la vérification anti-robot.';
  return;
 }

 const setCaptchaMessage=(message,isError=false)=>{
  captchaStatus.textContent=message;
  captchaStatus.className=isError?'smallprint notice danger':'smallprint';
 };
 const resetCaptcha=()=>{
  captchaToken=null;
  if(window.turnstile && captchaWidgetId!==null){
   try{window.turnstile.reset(captchaWidgetId)}catch(_){/* Widget will be recreated on next account-page visit. */}
  }
 };
 const getCaptchaToken=()=>{
  if(!TURNSTILE_SITE_KEY || captchaWidgetId===null){
   throw new Error('La vérification anti-robot n’est pas encore configurée. Le propriétaire doit activer Cloudflare Turnstile et Supabase CAPTCHA.');
  }
  if(!captchaToken){
   throw new Error('Veuillez terminer la vérification anti-robot avant de continuer.');
  }
  const token=captchaToken;
  captchaToken=null;
  return token;
 };
 const renderCaptcha=async()=>{
  if(!TURNSTILE_SITE_KEY){
   setCaptchaMessage('La vérification anti-robot n’est pas encore configurée. Les inscriptions, connexions et récupérations de mot de passe restent bloquées tant que Turnstile et la protection CAPTCHA Supabase ne sont pas activés.',true);
   return;
  }
  try{
   if(!window.turnstile){
    await new Promise((resolve,reject)=>{
     let script=document.getElementById('cloudflare-turnstile-script');
     if(!script){
      script=document.createElement('script');
      script.id='cloudflare-turnstile-script';
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;script.defer=true;
      script.onload=resolve;script.onerror=()=>reject(new Error('Impossible de charger le service anti-robot.'));
      document.head.appendChild(script);
     }else if(window.turnstile){resolve()}else{script.addEventListener('load',resolve,{once:true});script.addEventListener('error',()=>reject(new Error('Impossible de charger le service anti-robot.')),{once:true});}
    });
   }
   captchaWidgetId=window.turnstile.render('#turnstile-widget',{
    sitekey:TURNSTILE_SITE_KEY,
    theme:'auto',
    size:'flexible',
    callback:(token)=>{captchaToken=token;setCaptchaMessage('Vérification réussie. Vous pouvez continuer.');},
    'expired-callback':()=>{captchaToken=null;setCaptchaMessage('La vérification a expiré. Veuillez la refaire.',true);},
    'error-callback':()=>{captchaToken=null;setCaptchaMessage('La vérification a échoué. Vérifiez votre connexion et réessayez.',true);}
   });
   setCaptchaMessage('Terminez la vérification anti-robot pour continuer.');
  }catch(error){setCaptchaMessage(error.message||'La vérification anti-robot est indisponible.',true);}
 };
 await renderCaptcha();

 async function refresh(){
  const {data:{session},error}=await supabase.auth.getSession();
  if(error){status.textContent='Impossible de vérifier la session. Réessayez.';return;}
  const newOwner=session?.user?.id||null;
  if(newOwner!==cartOwnerId){
   cartOwnerId=newOwner;
   if(cartOwnerId) await loadMemberCart(cartOwnerId); else cart=[];
   renderCartCount();
  }
  authBox.hidden=Boolean(session);memberArea.hidden=!session;
  if(!session){location.href='connexion.html'+(location.search||'');return;}
  const uid=session.user.id;
  {const {data:bdRow,error:bdErr}=await supabase.from('profiles').select('birth_date').eq('id',uid).maybeSingle();if(!bdErr&&bdRow&&!bdRow.birth_date){location.href='completer-profil.html'+(location.search||'');return;}}
  // OAuth registration asks for consent before redirect. Record that explicit choice after return.
  if(sessionStorage.getItem('imagie-oauth-community-consent')==='1'){
   const accepted=await supabase.rpc('accept_community_terms',{p_version:COMMUNITY_TERMS_VERSION});
   if(!accepted.error)sessionStorage.removeItem('imagie-oauth-community-consent');
  }
  const [{data:profile},{data:membership},{data:orders},{data:announcements},{data:favorites},{data:quotes},{data:addresses}]=await Promise.all([
   supabase.from('profiles').select('full_name,email,phone,preferred_language,role').eq('id',uid).maybeSingle(),
   supabase.from('customer_memberships').select('member_number,tier,points_balance,status,community_terms_accepted_at,joined_at').eq('user_id',uid).maybeSingle(),
   supabase.from('orders').select('order_number,status,payment_status,grand_total,currency,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(5),
   supabase.from('member_announcements').select('title,body,created_at').eq('active',true).order('created_at',{ascending:false}).limit(5),
   supabase.from('wishlist_items').select('product_id,products(name,sku,price,currency)').eq('user_id',uid).order('created_at',{ascending:false}).limit(30),
   supabase.from('quote_requests').select('id,service_type,status,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(10),
   supabase.from('addresses').select('id,recipient_name,phone,country,region,city,street_address,postal_code,delivery_notes,is_default').eq('user_id',uid).order('is_default',{ascending:false}).order('created_at',{ascending:false}).limit(20)
  ]);
  document.getElementById('member-name').textContent=`Bonjour${profile?.full_name?' '+profile.full_name:''} !`;
  document.getElementById('owner-console-link').hidden=profile?.role!=='admin';
  document.getElementById('member-number').textContent=membership?.member_number||'Identifiant membre en cours de création';
  document.getElementById('member-tier').textContent=membership?.tier||'Membre Imagie';
  document.getElementById('member-points').textContent=`${membership?.points_balance??0} points`;
  document.getElementById('member-full-name').value=profile?.full_name||session.user.user_metadata?.full_name||'';
  document.getElementById('member-phone-input').value=profile?.phone||session.user.user_metadata?.phone||'';
  const orderBox=document.getElementById('member-orders');
  orderBox.innerHTML=orders?.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Commande</th><th>Statut</th><th>Paiement</th><th>Total</th><th>Date</th></tr></thead><tbody>${orders.map(o=>`<tr><td>${escapeHtml(o.order_number)}</td><td>${escapeHtml(o.status)}</td><td>${escapeHtml(o.payment_status||'unpaid')}</td><td>${escapeHtml(o.currency||'USD')} ${Number(o.grand_total||0).toFixed(2)}</td><td>${new Date(o.created_at).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>`:'<p class="smallprint">Aucune commande enregistrée pour le moment. Vos futures commandes apparaîtront ici.</p>';
  const favoriteBox=document.getElementById('member-favorites');
  favoriteBox.innerHTML=favorites?.length?favorites.map(f=>`<div class="member-news"><b>${escapeHtml(f.products?.name?.fr||f.products?.sku||'Produit')}</b><p>${escapeHtml(f.products?.sku||'')}</p></div>`).join(''):'<p class="smallprint">Vous n’avez pas encore de favori. Utilisez le cœur sur une fiche produit pour en enregistrer.</p>';
  const quoteBox=document.getElementById('member-quotes');
  quoteBox.innerHTML=quotes?.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Service</th><th>État</th><th>Date</th></tr></thead><tbody>${quotes.map(q=>`<tr><td>${escapeHtml(q.service_type)}</td><td>${escapeHtml(q.status)}</td><td>${new Date(q.created_at).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>`:'<p class="smallprint">Aucune demande de devis pour le moment.</p>';
  const newsBox=document.getElementById('member-announcements');
  newsBox.innerHTML=announcements?.length?announcements.map(a=>`<article class="member-news"><b>${escapeHtml(a.title)}</b><p>${escapeHtml(a.body)}</p><small>${new Date(a.created_at).toLocaleDateString()}</small></article>`).join(''):'<p class="smallprint">Aucune actualité publiée pour le moment. Les annonces de la communauté apparaîtront ici.</p>';
  const addressBox=document.getElementById('member-addresses');
  if(addressBox){addressBox.innerHTML=addresses?.length?addresses.map(a=>`<article class="member-address-card"><div><b>${escapeHtml(a.recipient_name)} ${a.is_default?'<span class="address-default">Principale</span>':''}</b><p>${escapeHtml(a.street_address)}, ${escapeHtml(a.city)}${a.region?', '+escapeHtml(a.region):''}, ${escapeHtml(a.country)}</p><small>${escapeHtml(a.phone)}${a.delivery_notes?' · '+escapeHtml(a.delivery_notes):''}</small></div><div class="member-address-actions">${a.is_default?'':`<button class="btn small secondary" type="button" data-address-default="${escapeHtml(a.id)}">Principale</button>`}<button class="btn small outline" type="button" data-address-delete="${escapeHtml(a.id)}">Supprimer</button></div></article>`).join(''):'<p class="smallprint">Aucune adresse enregistrée. Ajoutez-en une pour accélérer vos prochaines commandes.</p>';}
  const consentBox=document.getElementById('community-acceptance-panel');
  const consentInput=document.getElementById('member-consent-checkbox');
  const consentButton=document.getElementById('member-consent-button');
  const membershipActive=membership?.status==='active';
  const consentNeeded=membershipActive&&!membership?.community_terms_accepted_at;
  consentBox.hidden=!consentNeeded;
  if(!membershipActive){
   status.textContent='Votre adhésion est actuellement suspendue ou indisponible. Contactez IMAGIE CRÉATION pour obtenir de l’aide.';status.className='notice danger';
  }else if(consentNeeded){
   status.textContent='Votre compte est connecté. Confirmez votre adhésion à la communauté pour activer le panier et les privilèges membres.';
   consentInput.onchange=()=>{consentButton.disabled=!consentInput.checked};
   consentButton.onclick=async()=>{
    if(!consentInput.checked)return;
    consentButton.disabled=true;consentButton.textContent='Enregistrement…';
    const {error:consentError}=await supabase.rpc('accept_community_terms',{p_version:COMMUNITY_TERMS_VERSION});
    if(consentError){status.textContent='Impossible d’enregistrer votre accord. Réessayez.';status.className='notice danger';consentButton.disabled=false;consentButton.textContent='Confirmer mon adhésion';return;}
    status.textContent='Bienvenue dans la communauté IMAGIE CRÉATION. Votre adhésion est confirmée.';status.className='notice info';await refresh();
   };
  }else if(membership?.status!=='active'){
   status.textContent='Votre adhésion est actuellement suspendue. Contactez IMAGIE CRÉATION pour obtenir de l’aide.';status.className='notice danger';
  }else{
   status.textContent='Connexion sécurisée active. Bienvenue dans la communauté Imagie.';status.className='notice info';
  }

  // Ne pas rétablir une action panier/commande tant que l'adhésion n'est pas explicitement acceptée.
  if(consentNeeded || membership?.status!=='active') return;
  const params=new URLSearchParams(location.search);const next=params.get('next');
  if(next==='checkout'||next==='cart'){location.href='boutique.html?openCart=1';return;}
  if(next==='add'&&params.get('sku')){location.href=`boutique.html?add=${encodeURIComponent(params.get('sku'))}`;return;}
  if(next==='wishlist'&&params.get('sku')){location.href=`boutique.html?wishlist=${encodeURIComponent(params.get('sku'))}`;return;}
  if(next==='track'){location.href='suivi.html';return;}
  if(next==='quote'){location.href='metiers.html#quote-form-panel';return;}
  if(next==='admin'){location.href='admin.html';return;}
 }
 async function showError(error){status.textContent=error?.message||'Une erreur est survenue. Vérifiez les informations et réessayez.';status.className='notice danger';}
 document.getElementById('signup-form').onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;status.className='notice info';status.textContent='Création de votre compte…';
  try{const token=getCaptchaToken();const {data,error}=await supabase.auth.signUp({email:String(f.get('email')).trim(),password:String(f.get('password')),options:{captchaToken:token,data:{full_name:String(f.get('full_name')).trim(),phone:String(f.get('phone')).trim(),preferred_language:currentLang},emailRedirectTo:`${location.origin}/compte.html${location.search||''}`}});if(error)throw error;if(data.session){const {error:consentError}=await supabase.rpc('accept_community_terms',{p_version:COMMUNITY_TERMS_VERSION});if(consentError){status.className='notice danger';status.textContent='Votre compte est créé, mais l’adhésion doit encore être confirmée dans votre espace membre.';}else{status.className='notice info';status.textContent='Votre compte est créé. Bienvenue dans la communauté Imagie.';}}else{status.className='notice info';status.textContent='Un lien de vérification vient d’être envoyé à votre adresse e-mail. Après confirmation, connectez-vous pour finaliser votre adhésion à la communauté.';}await refresh();}
  catch(err){await showError(err)}finally{resetCaptcha();btn.disabled=false;}
 };
 document.getElementById('login-form').onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;
  try{const token=getCaptchaToken();const {error}=await supabase.auth.signInWithPassword({email:String(f.get('email')).trim(),password:String(f.get('password')),options:{captchaToken:token}});if(error)throw error;status.className='notice info';await refresh();}
  catch(err){await showError(err)}finally{resetCaptcha();btn.disabled=false;}
 };
 for(const [id,provider] of [['oauth-google','google'],['oauth-facebook','facebook']])document.getElementById(id).onclick=async()=>{
  const button=document.getElementById(id);
  try{
   const consent=document.getElementById('oauth-community-consent');
   if(!consent.checked)throw new Error('Veuillez confirmer votre adhésion à la communauté avant de continuer.');
   button.disabled=true;
   const token=getCaptchaToken();
   const {data:captchaResult,error:captchaError}=await supabase.functions.invoke('verify-turnstile',{body:{token}});
   resetCaptcha();
   if(captchaError||!captchaResult?.ok)throw new Error('La vérification anti-robot a échoué. Veuillez recommencer.');
   sessionStorage.setItem('imagie-oauth-community-consent','1');
   const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:`${location.origin}/compte.html${location.search||''}`}});
   if(error){sessionStorage.removeItem('imagie-oauth-community-consent');throw error;}
  }catch(err){resetCaptcha();await showError(err)}finally{button.disabled=false;}
 };
 document.getElementById('reset-form').onsubmit=async e=>{
  e.preventDefault();const email=String(new FormData(e.currentTarget).get('email')).trim();
  try{const token=getCaptchaToken();const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/compte.html?mode=reset`,captchaToken:token});if(error)throw error;status.className='notice info';status.textContent='Si cette adresse correspond à un compte, un lien de réinitialisation a été envoyé.'}
  catch(err){await showError(err)}finally{resetCaptcha();}
 };
 if(new URLSearchParams(location.search).get('mode')==='reset'){const box=document.createElement('div');box.className='panel';box.innerHTML='<h2>Choisir un nouveau mot de passe</h2><form id="new-password-form" class="form-grid"><div class="field full"><label>Nouveau mot de passe</label><input name="password" type="password" minlength="10" required></div><div class="field full"><button class="btn" type="submit">Enregistrer le nouveau mot de passe</button></div></form>';document.querySelector('.account-auth-grid').before(box);box.querySelector('form').onsubmit=async e=>{e.preventDefault();const password=new FormData(e.currentTarget).get('password');const {error}=await supabase.auth.updateUser({password});if(error){await showError(error);return;}status.textContent='Votre mot de passe a été changé. Vous pouvez utiliser votre compte.';status.className='notice info';box.remove();};}
 document.getElementById('member-profile-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error}=await supabase.from('profiles').update({full_name:String(f.get('full_name')).trim(),phone:String(f.get('phone')).trim(),preferred_language:currentLang}).eq('id',user.id);if(error){await showError(error);return;}status.className='notice info';status.textContent='Vos informations ont été mises à jour.';await refresh()};
 const addressForm=document.getElementById('member-address-form');
 if(addressForm)addressForm.onsubmit=async e=>{e.preventDefault();const f=new FormData(addressForm);const {data:{user}}=await supabase.auth.getUser();if(!user)return;const payload={user_id:user.id,recipient_name:String(f.get('recipient_name')).trim(),phone:String(f.get('phone')).trim(),country:String(f.get('country')).trim(),region:String(f.get('region')||'').trim()||null,city:String(f.get('city')).trim(),street_address:String(f.get('street_address')).trim(),postal_code:String(f.get('postal_code')||'').trim()||null,delivery_notes:String(f.get('delivery_notes')||'').trim()||null,is_default:f.get('is_default')==='on'};if(payload.is_default){const {error:resetError}=await supabase.from('addresses').update({is_default:false}).eq('user_id',user.id);if(resetError){await showError(resetError);return;}}const {error:saveError}=await supabase.from('addresses').insert(payload);if(saveError){await showError(saveError);return;}addressForm.reset();status.className='notice info';status.textContent='Adresse enregistrée.';await refresh();};
 document.getElementById('member-addresses')?.querySelectorAll('[data-address-default]').forEach(button=>button.onclick=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error:resetError}=await supabase.from('addresses').update({is_default:false}).eq('user_id',user.id);if(resetError){await showError(resetError);return;}const {error}=await supabase.from('addresses').update({is_default:true}).eq('id',button.dataset.addressDefault).eq('user_id',user.id);if(error){await showError(error);return;}await refresh();});
 document.getElementById('member-addresses')?.querySelectorAll('[data-address-delete]').forEach(button=>button.onclick=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user)return;if(!window.confirm('Supprimer cette adresse ?'))return;const {error}=await supabase.from('addresses').delete().eq('id',button.dataset.addressDelete).eq('user_id',user.id);if(error){await showError(error);return;}await refresh();});
 document.getElementById('signout-button').onclick=async()=>{const {error}=await supabase.auth.signOut();if(error){await showError(error);return;}cart=[];cartOwnerId=null;renderCartCount();await refresh()};
 supabase.auth.onAuthStateChange(()=>{setTimeout(()=>refresh(),0)});
 await refresh();
}

async function bindAdminConsole(){
 const gate=document.getElementById('admin-gate');
 if(!supabase){gate.innerHTML='<h2>Console non configurée</h2><p>Le propriétaire doit d’abord configurer Supabase et appliquer le schéma SQL. La page ne donne aucun accès sans vérification serveur.</p><a class="btn" href="compte.html">Aller à la connexion</a>';return;}
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user){gate.innerHTML='<h2>Connexion propriétaire requise</h2><p>Connectez-vous avec le compte propriétaire, puis revenez ici. Les comptes clients ordinaires ne sont pas autorisés.</p><a class="btn" href="compte.html?next=admin">Ouvrir la connexion</a>';return;}
 const {data:profile,error}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(error||profile?.role!=='admin'){gate.innerHTML='<h2>Accès refusé</h2><p>Ce compte ne possède pas le rôle administrateur. Seul le propriétaire désigné peut accéder à la console.</p><a class="btn secondary" href="index.html">Retour au site</a>';return;}
 document.getElementById('main-content').innerHTML=admin();
 const [products,orders,customers,quotes,variants]=await Promise.all([
  supabase.from('products').select('id,sku,name,price,currency,stock_quantity,track_inventory,is_active').order('created_at',{ascending:false}).limit(200),
  supabase.from('orders').select('id,order_number,customer_name,customer_phone,status,payment_status,payment_method,subtotal,delivery_fee,discount_total,grand_total,currency,created_at,shipping_address,customer_note,order_items(sku_snapshot,name_snapshot,variant_snapshot,quantity,unit_price,line_total)').order('created_at',{ascending:false}).limit(200),
  supabase.from('customer_memberships').select('user_id,member_number,tier,status,points_balance,created_at,profiles(full_name,email,phone)').order('created_at',{ascending:false}).limit(100),
  supabase.from('quote_requests').select('id,customer_name,customer_phone,service_type,details,status,created_at,attachment_path').order('created_at',{ascending:false}).limit(20),
  supabase.from('product_variants').select('id,product_id,sku,label,option_values,price_adjustment,stock_quantity,active,products(sku,name)').order('created_at',{ascending:false}).limit(300)
 ]);
 const paidRevenue=(orders.data||[]).filter(o=>o.payment_status==='paid').reduce((sum,o)=>sum+Number(o.grand_total||0),0);const pendingOrders=(orders.data||[]).filter(o=>!['delivered','cancelled','refunded'].includes(o.status)).length;document.getElementById('admin-stats').innerHTML=[['Produits actifs',(products.data||[]).filter(p=>p.is_active).length],['Commandes récentes',(orders.data||[]).length],['Commandes à traiter',pendingOrders],['CA payé · 200 dernières',`$${paidRevenue.toFixed(2)}`],['Membres',(customers.data||[]).length],['Demandes de devis',(quotes.data||[]).length]].map(([label,value])=>`<div class="stat-card"><small>${label}</small><b>${value}</b></div>`).join('');
 document.getElementById('admin-product-message').textContent=products.error?'Impossible de charger les produits. Vérifiez les politiques RLS.':'';
 document.getElementById('admin-products').innerHTML=products.data?.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>SKU</th><th>Produit</th><th>Prix USD</th><th>Stock</th><th>Stock suivi</th><th>Photo</th><th>Visible</th><th>Action</th></tr></thead><tbody>${products.data.map(p=>`<tr><td>${escapeHtml(p.sku)}</td><td>${escapeHtml(p.name?.fr||p.sku)}</td><td><input type="number" min="0" step="0.01" value="${p.price??''}" data-edit-price="${p.id}" aria-label="Prix ${escapeHtml(p.sku)}" style="width:110px"></td><td><input type="number" min="0" step="1" value="${p.stock_quantity??0}" data-edit-stock="${p.id}" aria-label="Stock ${escapeHtml(p.sku)}" style="width:80px"></td><td><input type="checkbox" data-edit-track="${p.id}" ${p.track_inventory?'checked':''} aria-label="Suivre le stock ${escapeHtml(p.sku)}"></td><td><input type="file" accept="image/jpeg,image/png" data-edit-image="${p.id}" aria-label="Photo ${escapeHtml(p.sku)}" style="max-width:160px"></td><td><input type="checkbox" data-edit-active="${p.id}" ${p.is_active?'checked':''} aria-label="Visible ${escapeHtml(p.sku)}"></td><td><button class="btn small" data-save-product="${p.id}">Enregistrer</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="smallprint">Aucun produit n’est encore enregistré dans la base de données.</p>';
 const variantSelect=document.getElementById('admin-variant-product');
 variantSelect.innerHTML='<option value="">Choisir un produit</option>'+(products.data||[]).map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name?.fr||p.sku)} · ${escapeHtml(p.sku)}</option>`).join('');
 document.getElementById('admin-variants').innerHTML=variants.data?.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Produit / SKU</th><th>Variante</th><th>Options JSON</th><th>Supplément</th><th>Stock</th><th>Active</th><th>Action</th></tr></thead><tbody>${variants.data.map(v=>`<tr><td>${escapeHtml(v.products?.name?.fr||v.products?.sku||'Produit')}<br><small>${escapeHtml(v.products?.sku||'')}</small></td><td><b>${escapeHtml(v.sku)}</b><br><input data-variant-label="${v.id}" value="${escapeHtml(v.label?.fr||v.sku)}" maxlength="120"></td><td><input data-variant-options="${v.id}" value="${escapeHtml(JSON.stringify(v.option_values||{}))}" style="min-width:210px"></td><td><input data-variant-price="${v.id}" type="number" step="0.01" value="${Number(v.price_adjustment||0)}" style="width:90px"></td><td><input data-variant-stock="${v.id}" type="number" min="0" step="1" value="${Number(v.stock_quantity||0)}" style="width:80px"></td><td><input data-variant-active="${v.id}" type="checkbox" ${v.active?'checked':''}></td><td><button class="btn small" type="button" data-save-variant="${v.id}">Enregistrer</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="smallprint">Aucune variante enregistrée. Ajoutez une option pour les produits qui ont des tailles, couleurs ou modèles différents.</p>';
 document.getElementById('admin-variant-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);let optionValues;try{optionValues=JSON.parse(String(f.get('option_values')||''));}catch(_){document.getElementById('admin-variant-message').textContent='Le champ des options doit être un JSON valide.';return;}if(!optionValues||typeof optionValues!=='object'||Array.isArray(optionValues)){document.getElementById('admin-variant-message').textContent='Les options doivent être un objet JSON.';return;}const payload={product_id:String(f.get('product_id')),sku:String(f.get('sku')).trim().toUpperCase(),label:{fr:String(f.get('label_fr')).trim(),ht:String(f.get('label_fr')).trim(),en:String(f.get('label_fr')).trim(),es:String(f.get('label_fr')).trim()},option_values:optionValues,price_adjustment:Number(f.get('price_adjustment')||0),stock_quantity:Number(f.get('stock_quantity')||0),active:f.get('active')==='on'};const {error}=await supabase.from('product_variants').insert(payload);const msg=document.getElementById('admin-variant-message');if(error){msg.textContent=`Erreur : ${error.message}`;return;}msg.textContent='Variante enregistrée. Elle sera disponible dans la fiche produit après actualisation.';e.currentTarget.reset();location.reload();};
 document.querySelectorAll('[data-save-variant]').forEach(button=>button.onclick=async()=>{const id=button.dataset.saveVariant;let optionValues;try{optionValues=JSON.parse(document.querySelector(`[data-variant-options="${id}"]`).value);}catch(_){showToast('Le JSON des options est invalide.');return;}if(!optionValues||typeof optionValues!=='object'||Array.isArray(optionValues)){showToast('Les options doivent être un objet JSON.');return;}const label=String(document.querySelector(`[data-variant-label="${id}"]`).value).trim();const payload={label:{fr:label,ht:label,en:label,es:label},option_values:optionValues,price_adjustment:Number(document.querySelector(`[data-variant-price="${id}"]`).value||0),stock_quantity:Number(document.querySelector(`[data-variant-stock="${id}"]`).value||0),active:document.querySelector(`[data-variant-active="${id}"]`).checked};const {error}=await supabase.from('product_variants').update(payload).eq('id',id);if(error){showToast('Impossible de mettre à jour la variante : '+error.message);return;}showToast('Variante mise à jour.');});
 document.querySelectorAll('[data-save-product]').forEach(button=>button.onclick=async()=>{
  const id=button.dataset.saveProduct;const previous=(products.data||[]).find(p=>p.id===id)||{};const wasVisible=previous.is_active===true;const previousPrice=previous.price??null;const previousStock=Number(previous.stock_quantity||0);const previousTrack=previous.track_inventory===true;const priceField=document.querySelector(`[data-edit-price="${CSS.escape(id)}"]`);const stockField=document.querySelector(`[data-edit-stock="${CSS.escape(id)}"]`);const trackField=document.querySelector(`[data-edit-track="${CSS.escape(id)}"]`);const activeField=document.querySelector(`[data-edit-active="${CSS.escape(id)}"]`);const imageField=document.querySelector(`[data-edit-image="${CSS.escape(id)}"]`);
  const priceRaw=priceField.value.trim();const price=priceRaw===''?null:Number(priceRaw);const stock=Math.max(0,Math.floor(Number(stockField.value)||0));const visible=activeField.checked;const trackInventory=trackField.checked;
  if(price!==null&&(!Number.isFinite(price)||price<0)){showToast('Prix invalide.');return;}
  const selectedImage=imageField.files?.[0];if(selectedImage&&(selectedImage.size>5*1024*1024||!['image/jpeg','image/png'].includes(selectedImage.type))){showToast('La photo doit être un JPG/PNG de 5 Mo maximum.');return;}
  button.disabled=true;const {error:updateError}=await supabase.from('products').update({price,stock_quantity:stock,track_inventory:trackInventory,is_active:visible,price_status:price===null?'to_be_set':(visible?'active':'provisional'),updated_at:new Date().toISOString()}).eq('id',id);
  if(updateError){button.disabled=false;showToast('Modification impossible. Vérifiez les champs et les droits.');return;}
  if(selectedImage){const ext=selectedImage.type==='image/png'?'png':'jpg';const path=`${id}/${Date.now()}.${ext}`;const {error:uploadError}=await supabase.storage.from('imagie-product-images').upload(path,selectedImage,{contentType:selectedImage.type,upsert:false});if(uploadError){button.disabled=false;showToast('Produit enregistré, mais la photo n’a pas pu être chargée.');return;}await supabase.from('product_images').update({is_primary:false}).eq('product_id',id);const {error:imageError}=await supabase.from('product_images').insert({product_id:id,storage_path:path,alt_text:{fr:'Photo produit Imagie Création',ht:'Foto pwodwi Imagie Création',en:'Imagie Création product photo',es:'Foto del producto Imagie Création'},is_primary:true,sort_order:0});if(imageError){button.disabled=false;showToast('Produit enregistré, mais la photo n’a pas pu être associée.');return;}}
  button.disabled=false;const row=(products.data||[]).find(p=>p.id===id);const productName=row?.name?.fr||row?.sku||'Un produit';const becameVisible=visible&&!wasVisible;const priceChanged=price!==previousPrice;const newPhoto=Boolean(selectedImage);const restocked=trackInventory&&stock>0&&(!previousTrack||previousStock<=0);if(visible&&(becameVisible||priceChanged||newPhoto||restocked)){const pushTitle=becameVisible?'Nouveau produit chez IMAGIE CRÉATION':'Mise à jour chez IMAGIE CRÉATION';const pushBody=becameVisible?`${productName} est maintenant disponible dans notre boutique.`:`La fiche de ${productName} vient d’être mise à jour. Découvrez les nouveautés sur notre site.`;const pushed=await sendPushNotification(pushTitle,pushBody,'/boutique.html');if(!pushed.ok)showToast('Produit mis à jour. Notification non envoyée : '+pushed.error);else showToast('Produit mis à jour. Notification envoyée à '+pushed.sent+' appareil(s).');}else showToast('Produit mis à jour. Rechargez la boutique pour voir les changements.');
 });
 document.getElementById('admin-orders').innerHTML=orders.data?.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Numéro</th><th>Client</th><th>Articles / livraison</th><th>État</th><th>Sous-total</th><th>Livraison (USD)</th><th>Total (USD)</th><th>Modifier l’état</th><th>Paiement / moyen</th></tr></thead><tbody>${orders.data.map(o=>{const lines=(o.order_items||[]).map(item=>{const variant=item.variant_snapshot||{};const label=variant.label?.fr||variant.label?.ht||variant.sku||'';const options=Object.entries(variant.option_values||{}).map(([key,value])=>`${key}: ${Array.isArray(value)?value.join(', '):String(value)}`).join(' · ');return `<li>${escapeHtml(item.name_snapshot)} · ${escapeHtml(item.sku_snapshot)}${label||options?` — ${escapeHtml(label||options)}`:''} × ${Number(item.quantity)} · ${escapeHtml(o.currency||'USD')} ${Number(item.unit_price||0).toFixed(2)}</li>`}).join('');const address=o.shipping_address?`${o.shipping_address.recipient_name||''} · ${o.shipping_address.street_address||''}, ${o.shipping_address.city||''}, ${o.shipping_address.country||''} · ${o.shipping_address.phone||''}`:'Livraison / retrait à confirmer';return `<tr><td>${escapeHtml(o.order_number)}</td><td>${escapeHtml(o.customer_name)}<br><small>${escapeHtml(o.customer_phone||'')}</small></td><td><details><summary>${(o.order_items||[]).length} article(s) · voir détails</summary><ul>${lines||'<li>Détails indisponibles</li>'}</ul><p><b>Adresse :</b> ${escapeHtml(address)}</p>${o.customer_note?`<p><b>Note :</b> ${escapeHtml(o.customer_note)}</p>`:''}</details></td><td>${escapeHtml(o.status)}</td><td>${escapeHtml(o.currency||'USD')} ${Number(o.subtotal??o.grand_total??0).toFixed(2)}</td><td><div class="admin-inline-fee"><input type="number" min="0" step="0.01" data-order-delivery="${o.id}" value="${Number(o.delivery_fee||0).toFixed(2)}" aria-label="Frais de livraison ${escapeHtml(o.order_number)}"><button class="btn small" type="button" data-save-delivery="${o.id}">OK</button></div></td><td>${escapeHtml(o.currency||'USD')} ${Number(o.grand_total||0).toFixed(2)}</td><td><select data-order-status="${o.id}"><option value="received">Reçue</option><option value="awaiting_confirmation">À confirmer</option><option value="payment_pending">Paiement en attente</option><option value="confirmed">Confirmée</option><option value="in_preparation">En préparation</option><option value="in_production">En production</option><option value="shipped">Expédiée</option><option value="ready_for_pickup">Prête à retirer</option><option value="delivered">Livrée</option><option value="cancelled">Annulée</option><option value="refunded">Remboursée</option></select></td><td><select data-order-payment="${o.id}"><option value="unpaid">Non payé</option><option value="pending_review">À vérifier</option><option value="authorized">Autorisé</option><option value="paid">Payé</option><option value="failed">Échoué</option><option value="refunded">Remboursé</option></select><select data-order-method="${o.id}" aria-label="Moyen de paiement"><option value="">Moyen à préciser</option><option value="MonCash">MonCash</option><option value="NatCash">NatCash</option><option value="Espèces">Espèces</option><option value="Virement">Virement</option><option value="Autre">Autre</option></select></td></tr>`}).join('')}</tbody></table></div>`:'<p class="smallprint">Aucune commande enregistrée.</p>';
 document.querySelectorAll('[data-order-status]').forEach(sel=>{const row=(orders.data||[]).find(o=>o.id===sel.dataset.orderStatus);if(row)sel.value=row.status;sel.onchange=async()=>{const nextStatus=sel.value;const {error}=await supabase.from('orders').update({status:nextStatus}).eq('id',sel.dataset.orderStatus);if(error){showToast('Impossible de modifier le statut.');if(row)sel.value=row.status;}else{if(row)row.status=nextStatus;const notification=await supabase.functions.invoke('send-order-update',{body:{order_id:sel.dataset.orderStatus}});showToast(notification.error?'Statut mis à jour. Notification client non disponible.':'Statut mis à jour et client notifié si les notifications sont activées.');}}});
 document.querySelectorAll('[data-order-payment]').forEach(sel=>{const row=(orders.data||[]).find(o=>o.id===sel.dataset.orderPayment);if(row)sel.value=row.payment_status||'unpaid';sel.onchange=async()=>{if(sel.value==='paid'&&!window.confirm('Confirmez-vous avoir vérifié et reçu le paiement de cette commande ?')){sel.value=row?.payment_status||'unpaid';return;}const {error}=await supabase.from('orders').update({payment_status:sel.value}).eq('id',sel.dataset.orderPayment);if(error){showToast('Impossible de modifier le statut du paiement.');if(row)sel.value=row.payment_status||'unpaid';}else{if(row)row.payment_status=sel.value;showToast('Statut du paiement mis à jour.');}}});
 document.querySelectorAll('[data-order-method]').forEach(sel=>{const row=(orders.data||[]).find(o=>o.id===sel.dataset.orderMethod);if(row)sel.value=row.payment_method||'';sel.onchange=async()=>{const {error}=await supabase.from('orders').update({payment_method:sel.value||null}).eq('id',sel.dataset.orderMethod);if(error){showToast('Impossible d’enregistrer le moyen de paiement.');if(row)sel.value=row.payment_method||'';}else{if(row)row.payment_method=sel.value||null;showToast('Moyen de paiement enregistré.');}}});
 document.querySelectorAll('[data-save-delivery]').forEach(button=>button.onclick=async()=>{const id=button.dataset.saveDelivery;const row=(orders.data||[]).find(o=>o.id===id);const input=document.querySelector(`[data-order-delivery="${CSS.escape(id)}"]`);const fee=Number(input?.value);if(!row||!Number.isFinite(fee)||fee<0){showToast('Frais de livraison invalides.');return;}const total=Number(row.subtotal??row.grand_total??0)+fee-Number(row.discount_total||0);if(total<0){showToast('Le total ne peut pas être négatif.');return;}button.disabled=true;const {error}=await supabase.from('orders').update({delivery_fee:fee,grand_total:total}).eq('id',id);button.disabled=false;if(error){showToast('Impossible d’enregistrer les frais de livraison.');return;}row.delivery_fee=fee;row.grand_total=total;showToast('Frais de livraison et total mis à jour.');});

 const quoteStatuses=['new','reviewing','quoted','accepted','declined','completed'];
 document.getElementById('admin-quotes').innerHTML=quotes.data?.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Client</th><th>Service</th><th>Détails</th><th>Statut</th><th>Date</th><th>Fichier</th></tr></thead><tbody>${quotes.data.map(q=>`<tr><td>${escapeHtml(q.customer_name)}<br><small>${escapeHtml(q.customer_phone||'')}</small></td><td>${escapeHtml(q.service_type)}</td><td>${escapeHtml(q.details||'')}</td><td><select data-quote-status="${q.id}">${quoteStatuses.map(st=>`<option value="${st}">${st}</option>`).join('')}</select></td><td>${new Date(q.created_at).toLocaleDateString()}</td><td>${q.attachment_path?`<button class="btn small secondary" data-quote-file="${q.id}">Ouvrir</button>`:'—'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="smallprint">Aucune demande de devis.</p>';
 document.querySelectorAll('[data-quote-status]').forEach(sel=>{const row=(quotes.data||[]).find(q=>q.id===sel.dataset.quoteStatus);if(row)sel.value=row.status;sel.onchange=async()=>{const {error}=await supabase.from('quote_requests').update({status:sel.value}).eq('id',sel.dataset.quoteStatus);if(error){showToast('Impossible de modifier le statut du devis.');sel.value=row.status;}else{row.status=sel.value;showToast('Statut du devis mis à jour.');}}});
 document.querySelectorAll('[data-quote-file]').forEach(button=>button.onclick=async()=>{const row=(quotes.data||[]).find(q=>q.id===button.dataset.quoteFile);if(!row?.attachment_path)return;const {data,error}=await supabase.storage.from('customer-artworks').createSignedUrl(row.attachment_path,300);if(error||!data?.signedUrl){showToast('Impossible d’ouvrir le fichier du client.');return;}window.open(data.signedUrl,'_blank','noopener');});
 document.getElementById('admin-customers').innerHTML=customers.data?.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Client</th><th>E-mail</th><th>Téléphone</th><th>Numéro membre</th><th>Niveau</th><th>Points</th><th>Statut</th></tr></thead><tbody>${customers.data.map(c=>`<tr><td>${escapeHtml(c.profiles?.full_name||'Client')}</td><td>${escapeHtml(c.profiles?.email||'—')}</td><td>${escapeHtml(c.profiles?.phone||'—')}</td><td>${escapeHtml(c.member_number)}</td><td>${escapeHtml(c.tier)}</td><td>${Number(c.points_balance||0)}</td><td><select data-member-status="${c.user_id}"><option value="active">Actif</option><option value="paused">En pause</option><option value="blocked">Bloqué</option></select></td></tr>`).join('')}</tbody></table></div>`:'<p class="smallprint">Aucun membre enregistré.</p>';
 document.querySelectorAll('[data-member-status]').forEach(sel=>{const row=(customers.data||[]).find(c=>c.user_id===sel.dataset.memberStatus);if(row)sel.value=row.status;sel.onchange=async()=>{const {error}=await supabase.from('customer_memberships').update({status:sel.value}).eq('user_id',sel.dataset.memberStatus);if(error){showToast('Impossible de modifier le statut du membre.');sel.value=row.status;}else{row.status=sel.value;showToast('Statut du membre mis à jour.');}}});
 document.getElementById('admin-product-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const name=String(f.get('name_fr')).trim();const sku=String(f.get('sku')).trim().toUpperCase();const priceRaw=String(f.get('price')).trim();const slug=name.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+sku.toLowerCase();const {data:category}=await supabase.from('categories').select('id').eq('slug',String(f.get('category'))).maybeSingle();const publish=f.get('active')==='on';const hasPrice=priceRaw!=='';const payload={sku,slug,category_id:category?.id||null,name:{fr:name,ht:name,en:name,es:name},description:{fr:String(f.get('description_fr')||''),ht:String(f.get('description_fr')||'')},price:hasPrice?Number(priceRaw):null,currency:'USD',price_status:!hasPrice?'to_be_set':(publish?'active':'provisional'),stock_quantity:Number(f.get('stock')||0),track_inventory:f.get('track_inventory')==='on',is_active:publish};const {data:created,error}=await supabase.from('products').insert(payload).select('id').single();const msg=document.getElementById('admin-product-message');if(error){msg.textContent=`Erreur : ${error.message}`;return;}const photo=f.get('image');if(photo instanceof File&&photo.size>0){if(photo.size>5*1024*1024||!['image/jpeg','image/png'].includes(photo.type)){msg.textContent='Produit créé, mais la photo est ignorée : utilisez une image JPG/PNG de 5 Mo maximum.';}else{const ext=photo.type==='image/png'?'png':'jpg';const path=`${created.id}/${Date.now()}.${ext}`;const {error:uploadError}=await supabase.storage.from('imagie-product-images').upload(path,photo,{contentType:photo.type,upsert:false});if(uploadError){msg.textContent=`Produit créé, photo non chargée : ${uploadError.message}`;}else{const {error:imageError}=await supabase.from('product_images').insert({product_id:created.id,storage_path:path,alt_text:{fr:name,ht:name,en:name,es:name},is_primary:true,sort_order:0});msg.textContent=imageError?`Produit créé, photo importée mais liaison impossible : ${imageError.message}`:'Produit et photo enregistrés.';}}}else{msg.textContent='Produit enregistré. Vous pouvez lui ajouter une photo depuis la prochaine édition.';}if(publish){const pushed=await sendPushNotification('Nouveau produit chez IMAGIE CRÉATION',`${name} vient d’être ajouté à notre boutique.`, '/boutique.html');if(!pushed.ok)msg.textContent+=' Notification non envoyée : '+pushed.error;}e.currentTarget.reset();location.reload();};
 document.getElementById('admin-announcement-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {data:{user}}=await supabase.auth.getUser();const title=String(f.get('title')).trim();const body=String(f.get('body')).trim();const active=f.get('active')==='on';const {error}=await supabase.from('member_announcements').insert({title,body,active,created_by:user.id});const msg=document.getElementById('admin-announcement-message');msg.textContent=error?`Erreur : ${error.message}`:'Actualité ajoutée à la communauté.';if(!error&&active){const pushed=await sendPushNotification(title,body,'/compte.html');msg.textContent+=pushed.ok?` Notification envoyée à ${pushed.sent} appareil(s).`:` Notification non envoyée : ${pushed.error}`;}if(!error)e.currentTarget.reset();};
}

async function bindPage(){
 if(page==='home'){
   let current=0,paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const slides=[['Vos idées, en couleurs.','Impression, personnalisation et création sur mesure.','🎨'],['Équipements & consommables','Les outils et matières pour donner forme à vos projets.','⚙️'],['Bannières & impressions','Des supports qui font rayonner votre marque.','🖼️']];
   const hero=document.querySelector('.hero');const upd=()=>{const s=slides[current];hero.querySelector('h1').textContent=s[0];hero.querySelector('.hero-copy>p').textContent=s[1];hero.querySelector('.paint').textContent=s[2];document.querySelectorAll('.slider-dot').forEach((d,i)=>d.classList.toggle('active',i===current))};document.querySelectorAll('.slider-dot').forEach(d=>d.onclick=()=>{current=Number(d.dataset.slide);upd()});document.getElementById('slider-pause').textContent=paused?'▶ Reprendre':'Ⅱ Pause';document.getElementById('slider-pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'▶ Reprendre':'Ⅱ Pause'};setInterval(()=>{if(!paused&&page==='home'){current=(current+1)%slides.length;upd()}},5500);
   bindAdds();observeReveal();
 }
 if(page==='boutique'){
  let cat='all';const list=document.getElementById('product-list');
  const controls={query:document.getElementById('product-search'),sort:document.getElementById('product-sort'),available:document.getElementById('product-availability'),min:document.getElementById('product-price-min'),max:document.getElementById('product-price-max')};
  function render(){const filtered=filterAndSortProducts(catalog.products,{category:cat,query:controls.query.value,sort:controls.sort.value,available:controls.available.value==='available',min:controls.min.value,max:controls.max.value});list.innerHTML=filtered.length?filtered.map(productCard).join(''):`<div class="empty-state" style="grid-column:1/-1"><b>${t('noProduct')}</b><p>Essayez un autre mot ou une autre catégorie.</p></div>`;document.getElementById('results-title').textContent=`${filtered.length} produit(s)`;bindAdds();observeReveal();}
  document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{cat=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.classList.toggle('active',x===b));render()});
  Object.values(controls).forEach(control=>control.addEventListener(control===controls.query?'input':'change',render));
  document.getElementById('clear-product-filters').onclick=()=>{controls.query.value='';controls.sort.value='featured';controls.available.value='all';controls.min.value='';controls.max.value='';cat='all';document.querySelectorAll('[data-category]').forEach(x=>x.classList.toggle('active',x.dataset.category==='all'));render()};
  render();
 }
 if(page==='metiers'){
  const form=document.getElementById('quote-form');
  form.onsubmit=async e=>{
   e.preventDefault();
   const message=document.getElementById('quote-message');
   if(!await requireMember('quote'))return;
   const button=form.querySelector('button[type=submit]');button.disabled=true;message.textContent='Envoi de votre demande…';
   try{
    const {data:{user},error:userError}=await supabase.auth.getUser();if(userError||!user)throw new Error('Connectez-vous à votre compte membre.');
    const f=new FormData(form);const {data:profile}=await supabase.from('profiles').select('full_name,phone').eq('id',user.id).maybeSingle();
    const name=String(f.get('name')||profile?.full_name||'').trim();const phone=String(f.get('phone')||profile?.phone||'').trim();
    if(!name||!phone)throw new Error('Ajoutez votre nom et votre numéro de téléphone.');
    const file=f.get('attachment');let attachmentPath=null;
    if(file instanceof File&&file.size>0){
     const allowed=['image/jpeg','image/png','image/webp','application/pdf'];if(file.size>15*1024*1024||!allowed.includes(file.type))throw new Error('Le fichier doit être JPG, PNG, WebP ou PDF et ne pas dépasser 15 Mo.');
     const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'})[file.type];attachmentPath=`${user.id}/quotes/${crypto.randomUUID()}.${ext}`;
     const {error:uploadError}=await supabase.storage.from('customer-artworks').upload(attachmentPath,file,{contentType:file.type,upsert:false});if(uploadError)throw new Error('Le fichier n’a pas pu être chargé. Réessayez avec un fichier plus léger.');
    }
    const payload={user_id:user.id,customer_name:name,customer_email:user.email||null,customer_phone:phone,service_type:String(f.get('service_type')),quantity:f.get('quantity')?Number(f.get('quantity')):null,dimensions:String(f.get('dimensions')||'').trim()||null,deadline:String(f.get('deadline')||'')||null,details:String(f.get('details')).trim(),attachment_path:attachmentPath};
    const {error:insertError}=await supabase.from('quote_requests').insert(payload);if(insertError){if(attachmentPath)await supabase.storage.from('customer-artworks').remove([attachmentPath]);throw insertError;}
    await supabase.from('profiles').update({full_name:name,phone}).eq('id',user.id);
    form.reset();message.textContent='Votre demande de devis a bien été envoyée. Retrouvez son suivi dans Mon compte.';message.className='notice info';
   }catch(err){message.textContent=err.message||'Impossible d’envoyer la demande.';message.className='notice danger';}finally{button.disabled=false;}
  };
 }
 if(page==='suivi')await bindCustomerTracking();
 if(AUTH_PAGES.includes(page))await bindAuthPage(page,authCtx());
 if(page==='compte')await bindCustomerAccount();
 if(page==='admin')await bindAdminConsole();
 if(page==='contact')document.getElementById('contact-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);const msg=`Bonjour Imagie Création.\nNom: ${f.get('name')}\nTéléphone: ${f.get('phone')}\nE-mail: ${f.get('email')}\nMessage: ${f.get('message')}`;window.open(`https://wa.me/${PHONE_MAIN}?text=${encodeURIComponent(msg)}`,'_blank','noopener')};
}
async function requireMember(next='cart',sku=''){
 const target=`compte.html?next=${encodeURIComponent(next)}${sku?`&sku=${encodeURIComponent(sku)}`:''}`;
 const guestOk=GUEST_PURCHASE&&['add','cart','checkout'].includes(next);
 if(!supabase){if(guestOk)return true;location.href=target;return false;}
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user){if(guestOk)return true;location.href=target;return false;}
 if(cartOwnerId!==user.id){cartOwnerId=user.id;await loadMemberCart(user.id);renderCartCount();}
 const {data:membership,error:membershipError}=await supabase.from('customer_memberships').select('status,community_terms_accepted_at').eq('user_id',user.id).maybeSingle();
 if(membershipError||membership?.status!=='active'||!membership?.community_terms_accepted_at){
  showToast(!membership?.community_terms_accepted_at?'Confirmez votre adhésion à la communauté pour continuer.':'Votre adhésion Imagie Community n’est pas active.');
  location.href='compte.html';
  return false;
 }
 return true;
}
async function loadMemberCart(userId){
 const local=(()=>{try{const value=JSON.parse(localStorage.getItem(cartStorageKey(userId))||'[]');return Array.isArray(value)?value.filter(x=>x&&typeof x.sku==='string'&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=20).map(x=>({sku:x.sku,qty:x.qty,variantId:typeof x.variantId==='string'?x.variantId:null,variantLabel:typeof x.variantLabel==='string'?x.variantLabel:'',priceAdjustment:Number(x.priceAdjustment)||0})):[]}catch(_){return []}})();
 if(!supabase){cart=local;return;}
 let data=null,error=null;
 const advanced=await supabase.from('customer_cart_items').select('sku,quantity,selected_variant_id,variant_snapshot').eq('user_id',userId);
 data=advanced.data;error=advanced.error;
 // Compatibilité temporaire avec une base qui n'a pas encore reçu la migration 004.
 if(error){const legacy=await supabase.from('customer_cart_items').select('sku,quantity').eq('user_id',userId);data=legacy.data;error=legacy.error;}
 if(error){cart=local;console.warn('Panier distant indisponible; cache local conservé.',error.message);return;}
 const remote=(data||[]).map(row=>{
  const variantId=row.selected_variant_id||null;
  const product=catalog.products.find(item=>item.sku===row.sku);
  const variant=product?.variants?.find(item=>item.id===variantId);
  const snapshot=row.variant_snapshot||{};
  const labelObj=snapshot.label||{};
  const optionValues=snapshot.option_values||{};
  const optionText=Object.entries(optionValues).map(([key,value])=>`${key}: ${Array.isArray(value)?value.join(', '):String(value)}`).join(' · ');
  return {sku:row.sku,qty:Number(row.quantity),variantId,variantLabel:variant?.display_name||labelObj[currentLang]||labelObj.fr||optionText||snapshot.sku||'',priceAdjustment:Number(variant?.price_adjustment??snapshot.price_adjustment)||0};
 }).filter(item=>item.sku&&Number.isInteger(item.qty)&&item.qty>0&&item.qty<=20);
 cart=remote.length?remote:local;
 localStorage.setItem(cartStorageKey(userId),JSON.stringify(cart));
 if(!remote.length&&local.length)await persistCart(userId,local);
}
function persistCart(userId,items){
 if(!supabase||!userId)return Promise.resolve();
 const snapshot=items.map(item=>({sku:item.sku,quantity:Math.max(1,Math.min(20,Number(item.qty)||1)),variant_key:item.variantId||''}));
 cartSyncQueue=cartSyncQueue.catch(()=>{}).then(async()=>{
  if(cartOwnerId!==userId)return;
  const {error}=await supabase.rpc('sync_customer_cart',{p_items:snapshot});
  if(error)console.warn('Échec de synchronisation du panier membre.',error.message);
 });
 return cartSyncQueue;
}
function saveCart(){
 const snapshot=cart.map(item=>({sku:item.sku,qty:item.qty,variantId:item.variantId||null,variantLabel:item.variantLabel||'',priceAdjustment:Number(item.priceAdjustment)||0}));
 if(!cartOwnerId){
  if(GUEST_PURCHASE){try{localStorage.setItem(GUEST_CART_KEY,JSON.stringify(snapshot));}catch(error){console.warn('Impossible de conserver le panier local.',error);}}
  renderCartCount();
  if(document.getElementById('cart-overlay')?.classList.contains('open'))renderCart();
  return;
 }
 try{localStorage.setItem(cartStorageKey(cartOwnerId),JSON.stringify(snapshot));}catch(error){console.warn('Impossible de conserver le panier local.',error);}
 renderCartCount();
 if(document.getElementById('cart-overlay')?.classList.contains('open'))renderCart();
 void persistCart(cartOwnerId,snapshot);
}
function renderCartCount(){const element=document.getElementById('cart-count');if(element)element.textContent=String(cart.reduce((sum,item)=>sum+Number(item.qty||0),0));}
function cartLineKey(item){return `${item.sku}::${item.variantId||''}`;}
function cartLinePrice(product,item){if(!product||product.price==null)return null;if(item.variantId){const current=(product.variants||[]).find(variant=>variant.id===item.variantId);if(!current||current.active===false)return null;return Number(product.price)+Number(current.price_adjustment||0);}if(product.variants?.some(variant=>variant.active!==false))return null;return Number(product.price);}
function addSkuToCart(sku,selection=null){
 const p=catalog.products.find(x=>x.sku===sku);if(!p||(!cartOwnerId&&!GUEST_PURCHASE))return false;
 if(cartOwnerId&&p.backend_ready!==true){showToast('Ce produit doit encore être importé dans le catalogue sécurisé.');return false;}
 if(p.price==null||p.price_status!=='active'){showToast('Le prix de ce produit doit être confirmé par Imagie avant la commande.');return false;}
 if(p.variants?.length&&!selection?.variantId){showToast('Choisissez une variante avant d’ajouter ce produit.');return false;}
 const selectedVariant=selection?.variantId?(p.variants||[]).find(v=>v.id===selection.variantId):null;
 if(selection?.variantId&&!selectedVariant){showToast('Cette variante n’est plus disponible. Rechargez la fiche produit.');return false;}
 if(selectedVariant&&selectedVariant.active===false){showToast('Cette variante n’est plus disponible.');return false;}
 if(p.track_inventory&&selectedVariant&&Number(selectedVariant.stock_quantity)<1){showToast('Cette variante est actuellement indisponible.');return false;}
 if(p.track_inventory&&!selectedVariant&&Number(p.stock_quantity)<1){showToast('Ce produit est actuellement indisponible.');return false;}
 const line={sku:p.sku,qty:1,variantId:selectedVariant?.id||null,variantLabel:selection?.variantLabel||'',priceAdjustment:Number(selection?.priceAdjustment)||0};
 const existing=cart.find(x=>cartLineKey(x)===cartLineKey(line));if(existing)existing.qty=Math.min(20,existing.qty+1);else cart.push(line);
 saveCart();showToast(`${p.name_fr} · ${t('add')}`);return true;
}
function openProductDetails(sku){
 const product=catalog.products.find(item=>item.sku===sku);if(!product)return;
 openProductModal(product,{
  t,money,escapeHtml,lang:currentLang,canOrder:canOrderProduct(product),
  relatedProducts:getRecommendations(product,catalog.products,3),
  onRelated:(relatedSku)=>openProductDetails(relatedSku),
  onAdd:async(selection)=>{if(!await requireMember('add',product.sku))return false;return addSkuToCart(product.sku,selection)}
 });
}
function bindAdds(){
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=async()=>{const sku=b.dataset.add;const product=catalog.products.find(item=>item.sku===sku);if(product?.variants?.length){b.closest('.product-card')?.querySelector('[data-details]')?.click();return;}if(!await requireMember('add',sku))return;addSkuToCart(sku)});
 document.querySelectorAll('[data-details]').forEach(b=>b.onclick=()=>openProductDetails(b.dataset.details));
 document.querySelectorAll('[data-wishlist]').forEach(b=>b.onclick=async()=>{if(!await requireMember('wishlist',b.dataset.wishlist))return;const {data:{user}}=await supabase.auth.getUser();const p=catalog.products.find(x=>x.sku===b.dataset.wishlist);if(!p)return;const {data:dbProduct}=await supabase.from('products').select('id').eq('sku',p.sku).maybeSingle();if(!dbProduct){showToast('Ce produit sera disponible dans vos favoris après synchronisation du catalogue.');return;}const {data:existing}=await supabase.from('wishlist_items').select('product_id').eq('user_id',user.id).eq('product_id',dbProduct.id).maybeSingle();if(existing){const {error}=await supabase.from('wishlist_items').delete().eq('user_id',user.id).eq('product_id',dbProduct.id);if(error){showToast('Impossible de retirer ce favori.');return;}showToast('Produit retiré des favoris.');}else{const {error}=await supabase.from('wishlist_items').upsert({user_id:user.id,product_id:dbProduct.id},{onConflict:'user_id,product_id'});if(error){showToast('Impossible d’enregistrer ce favori.');return;}showToast('Produit ajouté à vos favoris.');}});
 compareTools?.bind();
}
function renderCart(){
 const box=document.getElementById('cart-items'),sum=document.getElementById('cart-summary');
 if(!cart.length){box.innerHTML=`<div class="empty-state"><b>${t('empty')}</b>Visitez la boutique pour ajouter des articles.</div>`;sum.innerHTML='';return;}
 let total=0,hasUnknown=false;
 box.innerHTML=cart.map(item=>{
  const p=catalog.products.find(x=>x.sku===item.sku),variantKey=escapeHtml(item.variantId||'');
  if(!p){hasUnknown=true;return `<div class="cart-row"><div class="cart-meta"><strong>Produit indisponible</strong><small>${escapeHtml(item.sku)}</small></div><div class="qty-controls"><button data-cart-remove="${escapeHtml(item.sku)}" data-cart-variant="${variantKey}" aria-label="Supprimer">×</button></div></div>`;}
  const variant=p.variants?.find(v=>v.id===item.variantId);if(item.variantId&&!variant)hasUnknown=true;if(p.variants?.length&&!item.variantId)hasUnknown=true;
  const unit=cartLinePrice(p,item);if(p.price==null||p.price_status!=='active'||unit===null)hasUnknown=true;else total+=unit*item.qty;
  if(p.track_inventory&&variant&&Number(variant.stock_quantity)<item.qty)hasUnknown=true;if(p.track_inventory&&!variant&&Number(p.stock_quantity)<item.qty)hasUnknown=true;
  const label=variant?.display_name||item.variantLabel||variant?.sku||'';
  return `<div class="cart-row"><div class="cart-meta"><strong>${escapeHtml(p.name_fr)}</strong><small>${escapeHtml(p.sku)}${label?' · '+escapeHtml(label):''} · ${money(unit)}</small></div><div class="qty-controls"><button data-cart-dec="${escapeHtml(p.sku)}" data-cart-variant="${variantKey}" aria-label="Diminuer">−</button><b>${item.qty}</b><button data-cart-inc="${escapeHtml(p.sku)}" data-cart-variant="${variantKey}" aria-label="Augmenter">+</button><button data-cart-remove="${escapeHtml(p.sku)}" data-cart-variant="${variantKey}" aria-label="Supprimer">×</button></div></div>`;
 }).join('');
 sum.innerHTML=`<div style="display:flex;justify-content:space-between;padding:17px 0;font-weight:800"><span>Sous-total estimatif</span><span>${hasUnknown?'À confirmer':money(total)}</span></div>${hasUnknown?'<div class="notice info">Un ou plusieurs produits, variantes, prix ou stocks ne sont pas validés. Corrigez le panier avant de commander.</div>':''}${cartOwnerId?'<div class="field full"><label for="checkout-address">Adresse de livraison enregistrée</label><select id="checkout-address"><option value="">Chargement des adresses…</option></select><small class="smallprint"><a href="compte.html">Gérer mes adresses</a>. Vous pouvez aussi convenir du retrait avec IMAGIE.</small></div><div class="field full"><label for="checkout-note">Note pour la boutique (facultatif)</label><textarea id="checkout-note" rows="2" maxlength="500" placeholder="Précision sur la commande…"></textarea></div>':''}${(!cartOwnerId&&GUEST_PURCHASE)?'<div class="guest-box"><p class="smallprint">Commande sans compte : elle est préparée avec vous sur WhatsApp. <a href="inscription.html">Créer un compte gratuit</a> donne accès à vos commandes et aux avantages de la communauté.</p><div class="field"><label for="guest-name">Nom</label><input id="guest-name" autocomplete="name" maxlength="80"></div><div class="field"><label for="guest-phone">Téléphone</label><input id="guest-phone" type="tel" autocomplete="tel" maxlength="20"></div><div class="field"><label for="guest-address">Adresse ou mode de retrait souhaité</label><input id="guest-address" maxlength="240"></div></div>':''}<button class="btn" id="checkout-wa" style="width:100%;margin-top:10px" ${hasUnknown?'disabled':''}>${t('checkout')}</button>`;
 box.querySelectorAll('[data-cart-inc]').forEach(b=>b.onclick=()=>changeQty(b.dataset.cartInc,1,b.dataset.cartVariant));
 box.querySelectorAll('[data-cart-dec]').forEach(b=>b.onclick=()=>changeQty(b.dataset.cartDec,-1,b.dataset.cartVariant));
 box.querySelectorAll('[data-cart-remove]').forEach(b=>b.onclick=()=>{cart=cart.filter(x=>cartLineKey(x)!==`${b.dataset.cartRemove}::${b.dataset.cartVariant||''}`);saveCart()});
 if(cartOwnerId)void populateCheckoutAddresses();
 document.getElementById('checkout-wa').onclick=async()=>{
  const whatsappTab=window.open('about:blank','_blank');
  if(whatsappTab)whatsappTab.opener=null;
  const session=supabase?(await supabase.auth.getSession()).data.session:null;
  if(!session&&GUEST_PURCHASE){
   if(hasUnknown){showToast('Certains prix, variantes ou stocks doivent être confirmés avant la commande.');return;}
   const gname=document.getElementById('guest-name').value.trim(),gphone=document.getElementById('guest-phone').value.trim(),gaddress=document.getElementById('guest-address').value.trim();
   if(!gname||gphone.replace(/\D/g,'').length<8||!gaddress){showToast('Indiquez votre nom, un téléphone valide et une adresse ou un mode de retrait.');return;}
   const glines=cart.map(x=>{const p=catalog.products.find(p=>p.sku===x.sku);return `- ${p.name_fr} (${p.sku})${x.variantLabel?' · '+(p.variants?.find(v=>v.id===x.variantId)?.display_name||x.variantLabel):''} x ${x.qty} — ${money(cartLinePrice(p,x))}`});
   const gmsg=`Bonjour Imagie Création.\nJe souhaite préparer une commande sans compte.\nNom: ${gname}\nTéléphone: ${gphone}\nAdresse / retrait: ${gaddress}\n${glines.join('\n')}\nSous-total estimatif (hors livraison): ${money(total)}\nMerci de confirmer la disponibilité, les frais de livraison et le paiement.`;
   cart=[];saveCart();closeCart();const waUrl=`https://wa.me/${PHONE_MAIN}?text=${encodeURIComponent(gmsg)}`;if(whatsappTab)whatsappTab.location.href=waUrl;else location.href=waUrl;showToast('Votre demande de commande est prête dans WhatsApp.');return;
  }
  if(!supabase){whatsappTab?.close();showToast('Les comptes clients doivent être activés avant la commande.');location.href='compte.html?next=checkout';return;}
  if(!session){whatsappTab?.close();showToast('Connectez-vous ou créez un compte pour commander.');location.href='compte.html?next=checkout';return;}
  if(hasUnknown){whatsappTab?.close();showToast('Certains prix, variantes ou stocks doivent être confirmés avant la commande.');return;}
  const button=document.getElementById('checkout-wa');button.disabled=true;button.textContent='Enregistrement sécurisé…';
  try{
   const addressId=document.getElementById('checkout-address')?.value||null,note=document.getElementById('checkout-note')?.value||null;
   const {data,error}=await supabase.rpc('create_order_from_cart',{p_items:cart.map(x=>({sku:x.sku,quantity:x.qty,variant_id:x.variantId||null})),p_checkout_token:crypto.randomUUID(),p_customer_note:note,p_shipping_address_id:addressId});
   if(error){whatsappTab?.close();const text=error.message||'';if(text.includes('CUSTOMER_PHONE_REQUIRED')){showToast('Ajoutez votre téléphone dans Mon compte avant de commander.');location.href='compte.html';}else if(text.includes('PRODUCT_PRICE_NOT_CONFIRMED'))showToast('Un prix doit encore être validé par Imagie.');else if(text.includes('INSUFFICIENT_STOCK'))showToast('La quantité demandée dépasse le stock disponible.');else if(text.includes('VARIANT_REQUIRED'))showToast('Choisissez une variante pour chaque produit concerné.');else if(text.includes('ADDRESS_NOT_FOUND'))showToast('Cette adresse ne vous appartient pas ou n’existe plus. Actualisez le panier.');else showToast('La commande n’a pas pu être enregistrée. Vérifiez la migration 004 puis réessayez.');return;}
   const orderNumber=data.order_number,lines=cart.map(x=>{const p=catalog.products.find(p=>p.sku===x.sku);return `- ${p.name_fr} (${p.sku})${x.variantLabel?' · '+(p.variants?.find(v=>v.id===x.variantId)?.display_name||x.variantLabel):''} x ${x.qty} — ${money(cartLinePrice(p,x))}`});
   const msg=`Bonjour Imagie Création.\nJe viens d’enregistrer la commande ${orderNumber}.\nCompte client: ${session.user.email||session.user.id}\n${lines.join('\n')}\nSous-total enregistré (hors livraison): ${data.currency} ${Number(data.total).toFixed(2)}\nMerci de confirmer les frais de livraison et les modalités de paiement.`;
   cart=[];saveCart();closeCart();const waUrl=`https://wa.me/${PHONE_MAIN}?text=${encodeURIComponent(msg)}`;if(whatsappTab)whatsappTab.location.href=waUrl;else location.href=waUrl;showToast(`Commande ${orderNumber} enregistrée.`);
  }catch(error){whatsappTab?.close();console.error('Checkout failed',error);showToast('Une erreur inattendue a empêché la commande. Réessayez.');}
  finally{if(button.isConnected){button.disabled=false;button.textContent=t('checkout');}}
 };
}
async function populateCheckoutAddresses(){
 const select=document.getElementById('checkout-address');if(!select||!supabase||!cartOwnerId)return;select.innerHTML='<option value="">Chargement…</option>';
 const {data,error}=await supabase.from('addresses').select('id,recipient_name,phone,country,region,city,street_address,postal_code,delivery_notes,is_default').eq('user_id',cartOwnerId).order('is_default',{ascending:false}).order('created_at',{ascending:false});
 if(error){select.innerHTML='<option value="">Adresses indisponibles</option>';console.warn('Unable to load customer addresses',error.message);return;}
 checkoutAddresses=data||[];select.innerHTML='<option value="">Aucune adresse — convenir du retrait / de la livraison</option>'+checkoutAddresses.map(a=>`<option value="${escapeHtml(a.id)}">${escapeHtml(a.recipient_name)} — ${escapeHtml(a.street_address)}, ${escapeHtml(a.city)}${a.is_default?' (principale)':''}</option>`).join('');
 const defaultAddress=checkoutAddresses.find(a=>a.is_default);if(defaultAddress)select.value=defaultAddress.id;
}
function changeQty(sku,delta,variantId=''){const line=cart.find(i=>i.sku===sku&&(i.variantId||'')===(variantId||''));if(!line)return;const product=catalog.products.find(p=>p.sku===sku);if(delta>0&&product?.track_inventory){const variant=variantId?product.variants?.find(v=>v.id===variantId):null;const available=variant?Number(variant.stock_quantity):Number(product.stock_quantity);if(line.qty+delta>available){showToast('La quantité demandée dépasse le stock disponible.');return;}}line.qty=Math.max(0,Math.min(20,line.qty+delta));if(line.qty<=0)cart=cart.filter(x=>x!==line);saveCart()}

async function openCart(){if(!await requireMember('cart'))return;document.getElementById('cart-overlay').classList.add('open');renderCart()}function closeCart(){document.getElementById('cart-overlay').classList.remove('open')}
let toastTimer;function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100)}
function observeReveal(){const els=document.querySelectorAll('.reveal');if(!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('visible'));return}const io=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('visible');io.unobserve(x.target)}}),{threshold:.08});els.forEach(e=>io.observe(e))}
async function loadCatalog(){
 let base={currency:'USD',categories:[],products:[]};
 try{const response=await fetch('/data/catalog.json');if(response.ok)base=await response.json();}catch(_){/* Continue with DB catalog if local seed is unavailable. */}
 // Attach the SKU-named public product photos to the local seed as a safe fallback.
 try{const imageResponse=await fetch('/products/index.json');if(imageResponse.ok){const imageIndex=await imageResponse.json();base.products=(base.products||[]).map(product=>{const url=imageIndex?.[product.sku];return {...product,image_url:product.image_url||url||null,images:product.images?.length?product.images:(url?[{url,alt:product.name_fr||product.sku}]:[])};});}}catch(_){/* Product images are optional; keep the catalogue usable without them. */}
 if(!supabase)return base;
 const {data:rows,error}=await supabase.from('products')
  .select('id,sku,name,description,price,currency,price_status,stock_quantity,track_inventory,is_active,is_featured,created_at,categories(slug,name),product_images(storage_path,alt_text,sort_order,is_primary),product_variants(id,sku,label,option_values,price_adjustment,stock_quantity,active)')
  .eq('is_active',true).order('created_at',{ascending:false}).limit(1000);
 if(error){console.warn('Catalogue distant indisponible; catalogue local utilisé.',error.message);return base;}
 const dbProducts=(rows||[]).map(row=>{
  const categorySlug=row.categories?.slug==='printing'?'print':(row.categories?.slug||'sublimation');
  const images=(row.product_images||[]).slice().sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order);
  const productImages=images.filter(image=>image.storage_path).map(image=>({url:supabase.storage.from('imagie-product-images').getPublicUrl(image.storage_path).data?.publicUrl||null,alt:image.alt_text?.[currentLang]||image.alt_text?.fr||row.sku})).filter(image=>image.url);
  const imageUrl=productImages[0]?.url||null;
  const variants=(row.product_variants||[]).filter(v=>v.active).map(v=>({id:v.id,sku:v.sku,label:v.label,display_name:v.label?.[currentLang]||v.label?.fr||v.label?.ht||v.sku||'Option',option_values:v.option_values||{},price_adjustment:Number(v.price_adjustment)||0,stock_quantity:Number(v.stock_quantity)||0,active:v.active}));
  const name=row.name||{};const description=row.description||{};
  return {id:row.id,sku:row.sku,name_fr:name.fr||row.sku,name_ht:name.ht||name.fr||row.sku,name_en:name.en||name.fr||row.sku,name_es:name.es||name.fr||row.sku,description_fr:description.fr||'',category:categorySlug,price:row.price===null?null:Number(row.price),price_status:row.price_status,stock_quantity:row.stock_quantity,track_inventory:row.track_inventory!==false,image_url:imageUrl,images:productImages,variants,is_featured:row.is_featured,created_at:row.created_at,backend_ready:true};
 });
 const bySku=new Map(dbProducts.map(p=>[p.sku,p]));
 const products=[...dbProducts,...(base.products||[]).filter(p=>!bySku.has(p.sku)).map(p=>({...p,backend_ready:false}))];
 return {...base,products};
}

function decodeVapidKey(value){const padding='='.repeat((4-value.length%4)%4);const base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function savePushSubscription(registration){
 if(!supabase||!WEB_PUSH_PUBLIC_KEY||!('Notification'in window)||!registration?.pushManager)return {ok:false,error:'Le service Push n’est pas encore configuré.'};
 try{
  let subscription=await registration.pushManager.getSubscription();
  if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeVapidKey(WEB_PUSH_PUBLIC_KEY)});
  const json=subscription.toJSON();
  if(!json.endpoint||!json.keys?.p256dh||!json.keys?.auth)throw new Error('Le navigateur n’a pas retourné une inscription Push valide.');
  const {data:{user}}=await supabase.auth.getUser();
  const {error}=await supabase.from('push_subscriptions').insert({endpoint:json.endpoint,p256dh:json.keys.p256dh,auth:json.keys.auth,user_id:user?.id||null,user_agent:navigator.userAgent.slice(0,300)});
  if(error&&error.code!=='23505')throw error;
  if(error?.code==='23505'&&user?.id){
   const {error:claimError}=await supabase.rpc('claim_push_subscription',{p_endpoint:json.endpoint});
   if(claimError)throw claimError;
  }
  return {ok:true};
 }catch(error){return {ok:false,error:error.message||'Impossible d’activer les notifications.'};}
}
async function setupPushPrompt(registration){
 const panel=document.getElementById('push-consent');
 if(!panel||!WEB_PUSH_PUBLIC_KEY||!supabase||!('Notification'in window)||!registration?.pushManager)return;
 const status=document.getElementById('push-consent-status');
 const enable=document.getElementById('enable-push');
 const dismiss=document.getElementById('dismiss-push');
 const dismissedAt=Number(localStorage.getItem('imagie-push-dismissed-at')||0);
 if(Notification.permission==='granted'){await savePushSubscription(registration);return;}
 if(Notification.permission==='denied'||Date.now()-dismissedAt<30*24*60*60*1000)return;
 window.setTimeout(()=>{panel.hidden=false;},2200);
 dismiss.onclick=()=>{localStorage.setItem('imagie-push-dismissed-at',String(Date.now()));panel.hidden=true;};
 enable.onclick=async()=>{enable.disabled=true;status.textContent='Activation des notifications…';
  try{const permission=await Notification.requestPermission();if(permission!=='granted'){status.textContent=permission==='denied'?'Autorisation refusée. Vous pourrez la modifier dans les paramètres du navigateur.':'Vous pourrez activer les notifications plus tard.';if(permission==='denied')panel.hidden=true;return;}
   const saved=await savePushSubscription(registration);if(!saved.ok)throw new Error(saved.error);localStorage.setItem('imagie-push-enabled','1');panel.hidden=true;showToast('Notifications IMAGIE activées.');
  }catch(error){status.textContent=error.message||'Activation impossible. Réessayez plus tard.';}finally{enable.disabled=false;}
 };
}
async function sendPushNotification(title,body,url='/boutique.html'){
 if(!supabase)return {ok:false,error:'Supabase n’est pas configuré.'};
 const safeUrl=typeof url==='string'&&url.startsWith('/')&&!url.startsWith('//')?url:'/boutique.html';
 const {data,error}=await supabase.functions.invoke('send-push',{body:{title:String(title).slice(0,90),body:String(body).slice(0,220),url:safeUrl}});
 if(error)return {ok:false,error:error.message||'Fonction Push non disponible.'};
 return {ok:true,sent:Number(data?.sent||0),failed:Number(data?.failed||0)};
}

async function init(){localStorage.removeItem('imagie-cart');try{catalog=await loadCatalog()}catch(e){console.error('Catalog load failed',e);catalog={currency:'USD',categories:[],products:[]}}catalog=Array.isArray(catalog)?{currency:'USD',categories:[],products:catalog}:{currency:catalog.currency||'USD',categories:catalog.categories||[],products:catalog.products||[]};compareTools=createCompareTools({getProducts:()=>catalog.products,escapeHtml,money,toast:showToast});if(supabase){try{const {data:{session}}=await supabase.auth.getSession();cartOwnerId=session?.user?.id||null;if(cartOwnerId)await loadMemberCart(cartOwnerId);else cart=loadGuestCart();}catch(_){cartOwnerId=null;cart=loadGuestCart()}}else{cartOwnerId=null;cart=loadGuestCart()}shell();let html='';switch(page){case'home':html=home();break;case'boutique':html=shop();break;case'metiers':html=services();break;case'offres':html=offers();break;case'a-propos':html=about();break;case'suivi':html=tracking();break;case'compte':html=account();break;case'contact':html=contact();break;case'confidentialite':html=legal('Politique de confidentialité','Décrire ici les données réellement collectées, leur finalité, leur durée de conservation, les prestataires et la procédure de demande/suppression.');break;case'conditions':html=legal('Conditions générales','Les conditions de vente, paiement, annulation, personnalisation et garanties doivent être rédigées et validées avant l’ouverture de la boutique.');break;case'livraison':html=legal('Livraison & retours','Préciser les zones desservies, délais, frais, retrait, retours et exceptions pour les produits personnalisés avant publication.');break;case'notfound':html=legal('Page introuvable','Cette page n’existe pas ou a été déplacée. Utilisez le menu pour revenir à l’accueil ou à la boutique.');break;case'connexion':case'inscription':case'mot-de-passe-oublie':case'completer-profil':html=authPageHtml(page,authCtx());break;case'admin':html=`<section class="page-content container"><div id="admin-gate" class="panel"><h2>Vérification de l’accès administrateur…</h2><p>Cette page est privée.</p></div></section>`;break;default:html=home()}document.getElementById('main-content').innerHTML=html;await bindPage();if(page==='boutique'){const params=new URLSearchParams(location.search);const addSku=params.get('add');const wishSku=params.get('wishlist');if(addSku&&cartOwnerId){history.replaceState({},'',location.pathname);const requested=catalog.products.find(item=>item.sku===addSku);if(requested?.variants?.length){openProductDetails(addSku);}else if(addSkuToCart(addSku)){await openCart();}}else if(wishSku&&cartOwnerId){const wishButton=document.querySelector(`[data-wishlist="${CSS.escape(wishSku)}"]`);if(wishButton)wishButton.click();history.replaceState({},'',location.pathname);}if(params.get('openCart')==='1')await openCart();}observeReveal();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('/service-worker.js').then(setupPushPrompt).catch(()=>{});}
function fixLabels(){let n=0;document.querySelectorAll('#app input:not([type=hidden]):not([type=checkbox]):not([type=radio]),#app select,#app textarea').forEach(el=>{if(el.labels&&el.labels.length)return;if(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby'))return;const lab=el.closest('.field')?.querySelector('label');if(lab){if(!el.id)el.id='f-'+(el.name||'x')+'-'+(++n)+Math.random().toString(36).slice(2,6);lab.htmlFor=el.id;return}const txt=el.getAttribute('placeholder')||el.getAttribute('name');if(txt)el.setAttribute('aria-label',txt)})}
{let ft;new MutationObserver(()=>{clearTimeout(ft);ft=setTimeout(fixLabels,30)}).observe(document.getElementById('app'),{childList:true,subtree:true})}
init();
