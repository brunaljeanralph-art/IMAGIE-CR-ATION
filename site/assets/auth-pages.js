// Separate, classic account pages (Google-style): connexion, inscription, mot de passe oublié, compléter le profil.
// Privacy: passwords go only to Supabase Auth (never stored by us). Date of birth is checked here (UX) AND server-side
// (see supabase/migrations/002_account_profile_adult.sql). Other languages than fr/ht/en/es fall back to English.
const T = {
  fr: { email: 'Adresse e-mail', password: 'Mot de passe', show: 'Afficher', hide: 'Masquer', or: 'ou',
    signin: 'Se connecter', signin_sub: 'Utilisez votre compte Imagie.', signin_btn: 'Connexion', forgot: 'Mot de passe oublié ?', create: 'Créer un compte',
    forgot_email: 'Je ne me souviens plus de mon e-mail', forgot_email_help: 'Écrivez-nous sur WhatsApp : nous vérifierons votre identité (nom et téléphone du compte) avant de vous aider.',
    social_note: 'Vous préférez ne pas remplir de formulaire ?', google: 'Continuer avec Google', facebook: 'Continuer avec Facebook', x: 'Continuer avec X',
    signup: 'Créer un compte', signup_sub: 'Ces informations restent privées. Elles servent à sécuriser votre compte, vérifier que vous avez 18 ans ou plus, et le récupérer en cas d’oubli.',
    first: 'Prénom', last: 'Nom', dob: 'Date de naissance', dob_hint: 'Vous devez avoir 18 ans ou plus.', phone: 'Téléphone', pwd_hint: '10 caractères minimum. Utilisez un mot de passe unique.', pwd2: 'Confirmer le mot de passe',
    terms: 'J’accepte les conditions d’utilisation et la politique de confidentialité, et je rejoins la communauté IMAGIE CRÉATION.', signup_btn: 'Créer mon compte', have: 'Vous avez déjà un compte ?', social_or: 'Ou, sans remplir le formulaire :',
    forgot_title: 'Mot de passe oublié', forgot_sub: 'Saisissez l’e-mail de votre compte. Si un compte existe, nous enverrons un lien pour choisir un nouveau mot de passe.', send_link: 'Envoyer le lien', sent: 'Si cette adresse correspond à un compte, un lien vient d’être envoyé.', back: 'Retour à la connexion',
    newpwd: 'Nouveau mot de passe', save_pwd: 'Enregistrer le mot de passe', pwd_changed: 'Votre mot de passe a été changé. Vous pouvez vous connecter.', link_invalid: 'Ce lien est invalide ou expiré. Demandez un nouveau lien.',
    complete: 'Terminez votre profil', complete_sub: 'Pour utiliser votre compte, complétez ces informations. Elles restent privées.', save_profile: 'Enregistrer', locked: 'Date de naissance déjà enregistrée.',
    e_cred: 'E-mail ou mot de passe incorrect.', e_generic: 'Une erreur est survenue. Réessayez.', e_required: 'Veuillez remplir tous les champs.', e_dob: 'Date de naissance invalide.', e_adult: 'Vous devez avoir 18 ans ou plus pour créer un compte.',
    e_pwlen: 'Le mot de passe doit contenir au moins 10 caractères.', e_pwmatch: 'Les mots de passe ne correspondent pas.', e_phone: 'Numéro de téléphone invalide.', e_terms: 'Vous devez accepter les conditions pour créer un compte.', e_email: 'Adresse e-mail invalide.',
    check_mail: 'Un code de vérification vient d’être envoyé à votre e-mail. Saisissez-le pour activer votre compte.', created: 'Compte créé. Bienvenue dans la communauté Imagie.',
    nocfg: 'Le service de compte n’est pas encore configuré : rien n’est envoyé ni enregistré. Vos informations sont valides.', captcha_wait: 'Terminez la vérification anti-robot pour continuer.', captcha_ok: 'Vérification réussie.', captcha_nocfg: 'La vérification anti-robot n’est pas encore configurée.', captcha_fail: 'La vérification anti-robot a échoué. Réessayez.', wa_hello: 'Bonjour Imagie Création, j’ai oublié l’e-mail de mon compte.' },
  ht: { email: 'Adrès imèl', password: 'Modpas', show: 'Montre', hide: 'Kache', or: 'oswa',
    signin: 'Konekte', signin_sub: 'Itilize kont Imagie ou.', signin_btn: 'Konekte', forgot: 'Modpas bliye ?', create: 'Kreye yon kont',
    forgot_email: 'Mwen pa sonje imèl mwen', forgot_email_help: 'Ekri nou sou WhatsApp: nou pral verifye idantite w (non ak telefòn kont lan) anvan nou ede w.',
    social_note: 'Ou pa vle ranpli fòm nan ?', google: 'Kontinye ak Google', facebook: 'Kontinye ak Facebook', x: 'Kontinye ak X',
    signup: 'Kreye yon kont', signup_sub: 'Enfòmasyon sa yo rete prive. Yo sèvi pou sekirize kont ou, verifye ou gen 18 an oswa plis, epi rekipere kont lan si w bliye l.',
    first: 'Prenom', last: 'Non', dob: 'Dat nesans', dob_hint: 'Ou dwe gen 18 an oswa plis.', phone: 'Telefòn', pwd_hint: '10 karaktè omwen. Itilize yon modpas ki inik.', pwd2: 'Konfime modpas la',
    terms: 'Mwen aksepte kondisyon itilizasyon yo ak politik konfidansyalite a, epi mwen antre nan kominote IMAGIE CRÉATION.', signup_btn: 'Kreye kont mwen', have: 'Ou gen yon kont deja ?', social_or: 'Oswa, san ranpli fòm nan :',
    forgot_title: 'Modpas bliye', forgot_sub: 'Antre imèl kont ou. Si gen yon kont, n ap voye yon lyen pou chwazi yon nouvo modpas.', send_link: 'Voye lyen an', sent: 'Si adrès sa a koresponn ak yon kont, nou fèk voye yon lyen.', back: 'Retounen nan koneksyon',
    newpwd: 'Nouvo modpas', save_pwd: 'Anrejistre modpas la', pwd_changed: 'Modpas ou chanje. Ou ka konekte kounye a.', link_invalid: 'Lyen sa a pa valab oswa li ekspire. Mande yon lòt lyen.',
    complete: 'Fini pwofil ou', complete_sub: 'Pou w itilize kont ou, konplete enfòmasyon sa yo. Yo rete prive.', save_profile: 'Anrejistre', locked: 'Dat nesans lan deja anrejistre.',
    e_cred: 'Imèl oswa modpas la pa kòrèk.', e_generic: 'Yon erè fèt. Eseye ankò.', e_required: 'Tanpri ranpli tout chan yo.', e_dob: 'Dat nesans lan pa valab.', e_adult: 'Ou dwe gen 18 an oswa plis pou kreye yon kont.',
    e_pwlen: 'Modpas la dwe gen omwen 10 karaktè.', e_pwmatch: 'Modpas yo pa menm.', e_phone: 'Nimewo telefòn lan pa valab.', e_terms: 'Ou dwe aksepte kondisyon yo pou kreye yon kont.', e_email: 'Adrès imèl la pa valab.',
    check_mail: 'Nou voye yon kòd verifikasyon sou imèl ou. Antre kòd la pou aktive kont ou.', created: 'Kont lan kreye. Byenveni nan kominote Imagie a.',
    nocfg: 'Sèvis kont lan poko konfigire: anyen pa voye ni anrejistre. Enfòmasyon ou yo valab.', captcha_wait: 'Fini verifikasyon anti-robo a pou kontinye.', captcha_ok: 'Verifikasyon reyisi.', captcha_nocfg: 'Verifikasyon anti-robo a poko konfigire.', captcha_fail: 'Verifikasyon anti-robo a echwe. Eseye ankò.', wa_hello: 'Bonjou Imagie Création, mwen bliye imèl kont mwen.' },
  en: { email: 'Email address', password: 'Password', show: 'Show', hide: 'Hide', or: 'or',
    signin: 'Sign in', signin_sub: 'Use your Imagie account.', signin_btn: 'Sign in', forgot: 'Forgot password?', create: 'Create account',
    forgot_email: 'I don’t remember my email', forgot_email_help: 'Write to us on WhatsApp: we will verify your identity (account name and phone) before helping you.',
    social_note: 'Prefer not to fill in a form?', google: 'Continue with Google', facebook: 'Continue with Facebook', x: 'Continue with X',
    signup: 'Create an account', signup_sub: 'This information stays private. It is used to secure your account, check that you are 18 or older, and recover your account if you forget your password.',
    first: 'First name', last: 'Last name', dob: 'Date of birth', dob_hint: 'You must be 18 or older.', phone: 'Phone', pwd_hint: 'At least 10 characters. Use a unique password.', pwd2: 'Confirm password',
    terms: 'I accept the terms of use and the privacy policy, and I join the IMAGIE CRÉATION community.', signup_btn: 'Create my account', have: 'Already have an account?', social_or: 'Or, without filling in the form:',
    forgot_title: 'Forgot password', forgot_sub: 'Enter your account email. If an account exists, we will send a link to choose a new password.', send_link: 'Send link', sent: 'If this address matches an account, a link has just been sent.', back: 'Back to sign in',
    newpwd: 'New password', save_pwd: 'Save password', pwd_changed: 'Your password has been changed. You can sign in.', link_invalid: 'This link is invalid or expired. Request a new link.',
    complete: 'Finish your profile', complete_sub: 'To use your account, complete this information. It stays private.', save_profile: 'Save', locked: 'Date of birth already saved.',
    e_cred: 'Incorrect email or password.', e_generic: 'Something went wrong. Try again.', e_required: 'Please fill in all fields.', e_dob: 'Invalid date of birth.', e_adult: 'You must be 18 or older to create an account.',
    e_pwlen: 'Password must be at least 10 characters.', e_pwmatch: 'Passwords do not match.', e_phone: 'Invalid phone number.', e_terms: 'You must accept the terms to create an account.', e_email: 'Invalid email address.',
    check_mail: 'A verification code has been sent to your email. Enter it to activate your account.', created: 'Account created. Welcome to the Imagie community.',
    nocfg: 'The account service is not configured yet: nothing is sent or saved. Your information is valid.', captcha_wait: 'Complete the anti-bot check to continue.', captcha_ok: 'Check passed.', captcha_nocfg: 'The anti-bot check is not configured yet.', captcha_fail: 'The anti-bot check failed. Try again.', wa_hello: 'Hello Imagie Création, I forgot the email of my account.' },
  es: { email: 'Correo electrónico', password: 'Contraseña', show: 'Mostrar', hide: 'Ocultar', or: 'o',
    signin: 'Iniciar sesión', signin_sub: 'Usa tu cuenta Imagie.', signin_btn: 'Entrar', forgot: '¿Olvidaste tu contraseña?', create: 'Crear cuenta',
    forgot_email: 'No recuerdo mi correo', forgot_email_help: 'Escríbenos por WhatsApp: verificaremos tu identidad (nombre y teléfono de la cuenta) antes de ayudarte.',
    social_note: '¿Prefieres no rellenar un formulario?', google: 'Continuar con Google', facebook: 'Continuar con Facebook', x: 'Continuar con X',
    signup: 'Crear una cuenta', signup_sub: 'Estos datos son privados. Sirven para proteger tu cuenta, comprobar que tienes 18 años o más y recuperarla si la olvidas.',
    first: 'Nombre', last: 'Apellido', dob: 'Fecha de nacimiento', dob_hint: 'Debes tener 18 años o más.', phone: 'Teléfono', pwd_hint: 'Mínimo 10 caracteres. Usa una contraseña única.', pwd2: 'Confirmar contraseña',
    terms: 'Acepto las condiciones de uso y la política de privacidad, y me uno a la comunidad IMAGIE CRÉATION.', signup_btn: 'Crear mi cuenta', have: '¿Ya tienes una cuenta?', social_or: 'O, sin rellenar el formulario:',
    forgot_title: 'Contraseña olvidada', forgot_sub: 'Introduce el correo de tu cuenta. Si existe, enviaremos un enlace para elegir una nueva contraseña.', send_link: 'Enviar enlace', sent: 'Si esta dirección corresponde a una cuenta, se acaba de enviar un enlace.', back: 'Volver a iniciar sesión',
    newpwd: 'Nueva contraseña', save_pwd: 'Guardar contraseña', pwd_changed: 'Tu contraseña ha sido cambiada. Ya puedes iniciar sesión.', link_invalid: 'Este enlace no es válido o ha caducado. Pide uno nuevo.',
    complete: 'Termina tu perfil', complete_sub: 'Para usar tu cuenta, completa estos datos. Son privados.', save_profile: 'Guardar', locked: 'Fecha de nacimiento ya guardada.',
    e_cred: 'Correo o contraseña incorrectos.', e_generic: 'Ocurrió un error. Inténtalo de nuevo.', e_required: 'Rellena todos los campos.', e_dob: 'Fecha de nacimiento no válida.', e_adult: 'Debes tener 18 años o más para crear una cuenta.',
    e_pwlen: 'La contraseña debe tener al menos 10 caracteres.', e_pwmatch: 'Las contraseñas no coinciden.', e_phone: 'Número de teléfono no válido.', e_terms: 'Debes aceptar las condiciones para crear una cuenta.', e_email: 'Correo no válido.',
    check_mail: 'Se ha enviado un código de verificación a tu correo. Introdúcelo para activar tu cuenta.', created: 'Cuenta creada. Bienvenido a la comunidad Imagie.',
    nocfg: 'El servicio de cuentas aún no está configurado: no se envía ni guarda nada. Tus datos son válidos.', captcha_wait: 'Completa la verificación anti-robot para continuar.', captcha_ok: 'Verificación correcta.', captcha_nocfg: 'La verificación anti-robot aún no está configurada.', captcha_fail: 'La verificación anti-robot falló. Inténtalo de nuevo.', wa_hello: 'Hola Imagie Création, olvidé el correo de mi cuenta.' }
};
const tr = (lang, k) => (T[lang] || T.en)[k] ?? T.en[k] ?? k;
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const adultCutoff = (now = new Date()) => fmt(new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()));
export function dobStatus(iso, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return 'invalid';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d || y < 1900) return 'invalid';
  return iso <= adultCutoff(now) ? 'ok' : 'minor';
}
const phoneOk = (v) => /^\+?[0-9 ()\-.]{8,20}$/.test(v) && v.replace(/\D/g, '').length >= 8;
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function authPageHtml(kind, ctx) {
  const L = (k) => ctx.esc(tr(ctx.lang, k));
  const logo = `<a class="auth-logo" href="index.html"><img src="/assets/imagie-logo-original.jpg" alt="Imagie Création"></a>`;
  const pw = (id, label, auto) => `<div class="field"><label for="${id}">${label}</label><div class="pw-wrap"><input id="${id}" class="pw" name="${id}" type="password" autocomplete="${auto}" required><button type="button" class="pw-toggle" data-pw-toggle aria-label="${L('show')}">${L('show')}</button></div></div>`;
  const social = (consent) => `<div class="auth-sep"><span>${L('or')}</span></div><p class="auth-note">${consent ? L('social_or') : L('social_note')}</p><div class="auth-social"><button class="so-btn" type="button" data-oauth="google"><span class="so-ic" aria-hidden="true">G</span>${L('google')}</button><button class="so-btn" type="button" data-oauth="facebook"><span class="so-ic" aria-hidden="true">f</span>${L('facebook')}</button><button class="so-btn" type="button" data-oauth="x"><span class="so-ic" aria-hidden="true">𝕏</span>${L('x')}</button></div>`;
  const shell = (title, sub, body) => `<section class="auth-wrap"><div class="auth-card">${logo}<h1>${title}</h1><p class="auth-sub">${sub}</p><div id="auth-msg" class="auth-msg" role="status" aria-live="polite" hidden></div>${body}<div id="turnstile-widget" class="auth-captcha"></div><p id="captcha-msg" class="auth-hint" role="status" aria-live="polite"></p></div></section>`;
  if (kind === 'connexion') return shell(L('signin'), L('signin_sub'),
    `<form id="auth-form" novalidate><div class="field"><label for="email">${L('email')}</label><input id="email" name="email" type="email" autocomplete="username" required maxlength="254"></div>${pw('password', L('password'), 'current-password')}<button class="btn auth-submit" type="submit">${L('signin_btn')}</button></form>
     <div class="auth-links"><a href="mot-de-passe-oublie.html">${L('forgot')}</a><a href="inscription.html">${L('create')}</a></div>${social(false)}
     <details class="auth-help"><summary>${L('forgot_email')}</summary><p>${L('forgot_email_help')}</p><a class="btn small" id="wa-help" target="_blank" rel="noopener" href="#">WhatsApp</a></details>`);
  if (kind === 'inscription') return shell(L('signup'), L('signup_sub'),
    `<form id="auth-form" novalidate><div class="auth-row"><div class="field"><label for="first_name">${L('first')}</label><input id="first_name" name="first_name" autocomplete="given-name" required maxlength="60"></div><div class="field"><label for="last_name">${L('last')}</label><input id="last_name" name="last_name" autocomplete="family-name" required maxlength="60"></div></div>
     <div class="field"><label for="birth_date">${L('dob')}</label><input id="birth_date" name="birth_date" type="date" autocomplete="bday" required min="1900-01-01" max="${adultCutoff()}"><small>${L('dob_hint')}</small></div>
     <div class="field"><label for="phone">${L('phone')}</label><input id="phone" name="phone" type="tel" autocomplete="tel" required maxlength="20" placeholder="+509 …"></div>
     <div class="field"><label for="email">${L('email')}</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="254"></div>
     ${pw('password', L('password'), 'new-password')}<small class="auth-hint">${L('pwd_hint')}</small>${pw('password2', L('pwd2'), 'new-password')}
     <label class="checkbox-line auth-terms"><input type="checkbox" id="terms" name="terms" required> <span>${L('terms')}</span></label>
     <button class="btn auth-submit" type="submit">${L('signup_btn')}</button></form>
     <div class="auth-links"><span>${L('have')}</span><a href="connexion.html">${L('signin')}</a></div>${social(true)}`);
  if (kind === 'mot-de-passe-oublie') {
    const reset = new URLSearchParams(location.search).get('mode') === 'reset';
    return reset
      ? shell(L('newpwd'), '', `<form id="auth-form" novalidate>${pw('password', L('newpwd'), 'new-password')}<small class="auth-hint">${L('pwd_hint')}</small>${pw('password2', L('pwd2'), 'new-password')}<button class="btn auth-submit" type="submit">${L('save_pwd')}</button></form><div class="auth-links"><a href="connexion.html">${L('back')}</a></div>`)
      : shell(L('forgot_title'), L('forgot_sub'), `<form id="auth-form" novalidate><div class="field"><label for="email">${L('email')}</label><input id="email" name="email" type="email" autocomplete="username" required maxlength="254"></div><button class="btn auth-submit" type="submit">${L('send_link')}</button></form><div class="auth-links"><a href="connexion.html">${L('back')}</a><a href="inscription.html">${L('create')}</a></div>`);
  }
  // completer-profil
  return shell(L('complete'), L('complete_sub'),
    `<form id="auth-form" novalidate><div class="auth-row"><div class="field"><label for="first_name">${L('first')}</label><input id="first_name" name="first_name" autocomplete="given-name" required maxlength="60"></div><div class="field"><label for="last_name">${L('last')}</label><input id="last_name" name="last_name" autocomplete="family-name" required maxlength="60"></div></div>
     <div class="field"><label for="birth_date">${L('dob')}</label><input id="birth_date" name="birth_date" type="date" autocomplete="bday" required min="1900-01-01" max="${adultCutoff()}"><small id="dob-hint">${L('dob_hint')}</small></div>
     <div class="field"><label for="phone">${L('phone')}</label><input id="phone" name="phone" type="tel" autocomplete="tel" required maxlength="20" placeholder="+509 …"></div>
     <button class="btn auth-submit" type="submit">${L('save_profile')}</button></form>`);
}

async function setupCaptcha(ctx, say) {
  const L = (k) => tr(ctx.lang, k);
  const cs = (text, type = 'info') => { const el = document.getElementById('captcha-msg'); if (!el) { say(text, type); return; } el.textContent = text || ''; el.className = `auth-hint ${type}`; };
  if (!ctx.supabase) return { demo: true, getToken: () => null, reset() {} };
  let token = null, widget = null, used = false;
  const api = {
    getToken() {
      if (!ctx.turnstileSiteKey || widget === null) throw new Error(L('captcha_nocfg'));
      if (!token) throw new Error(L('captcha_wait'));
      const t = token; token = null; used = true; return t;   // a token is single-use
    },
    // Only ask for a fresh check when the previous token was actually consumed (not on simple form-validation errors).
    reset() { if (!used) return; used = false; token = null; if (window.turnstile && widget !== null) { try { window.turnstile.reset(widget); } catch (_) { /* recreated on next visit */ } } }
  };
  if (!ctx.turnstileSiteKey) { cs(L('captcha_nocfg'), 'error'); return api; }
  try {
    if (!window.turnstile) {
      await new Promise((resolve, reject) => {
        let s = document.getElementById('cloudflare-turnstile-script');
        if (!s) { s = document.createElement('script'); s.id = 'cloudflare-turnstile-script'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.defer = true; document.head.appendChild(s); }
        s.addEventListener('load', resolve, { once: true }); s.addEventListener('error', () => reject(new Error(L('captcha_fail'))), { once: true });
        if (window.turnstile) resolve();
      });
    }
    widget = window.turnstile.render('#turnstile-widget', { sitekey: ctx.turnstileSiteKey, theme: 'auto', size: 'flexible',
      callback: (t) => { token = t; cs(L('captcha_ok'), 'info'); }, 'expired-callback': () => { token = null; cs(L('captcha_wait'), 'error'); }, 'error-callback': () => { token = null; cs(L('captcha_fail'), 'error'); } });
  } catch (e) { cs(e.message || L('captcha_fail'), 'error'); }
  return api;
}

export async function bindAuthPage(kind, ctx) {
  const { supabase, lang } = ctx;
  const L = (k) => tr(lang, k);
  const $ = (id) => document.getElementById(id);
  const form = $('auth-form'), msgBox = $('auth-msg');
  const say = (text, type = 'info') => { msgBox.hidden = !text; msgBox.textContent = text || ''; msgBox.className = `auth-msg ${type}`; };
  const search = location.search || '';
  const go = (url) => { location.href = url; };
  const first = form.querySelector('input'); if (first) first.focus({ preventScroll: true });
  document.querySelectorAll('[data-pw-toggle]').forEach((b) => b.addEventListener('click', () => {
    const show = form.querySelector('.pw').type === 'password';
    form.querySelectorAll('.pw').forEach((i) => { i.type = show ? 'text' : 'password'; });
    document.querySelectorAll('[data-pw-toggle]').forEach((x) => { x.textContent = L(show ? 'hide' : 'show'); x.setAttribute('aria-label', L(show ? 'hide' : 'show')); });
  }));
  const wa = $('wa-help'); if (wa) wa.href = `https://wa.me/${ctx.phoneMain}?text=${encodeURIComponent(L('wa_hello'))}`;
  const captcha = await setupCaptcha(ctx, say);
  const notConfigured = () => { say(L('nocfg'), 'info'); };
  const submitGuard = async (fn) => {
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true; say('');
    try { await fn(); } catch (err) { say(err?.message && err.userFacing ? err.message : (err?.message || L('e_generic')), 'error'); }
    finally { captcha.reset(); btn.disabled = false; }
  };
  const fail = (key) => { const e = new Error(L(key)); e.userFacing = true; throw e; };
  const val = (n) => String(new FormData(form).get(n) ?? '').trim();

  // Social sign-in (Google, Facebook, X) — anti-bot check verified server-side first.
  document.querySelectorAll('[data-oauth]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!supabase) { notConfigured(); return; }
    btn.disabled = true; say('');
    try {
      if (kind === 'inscription' && !$('terms').checked) fail('e_terms');
      const token = captcha.getToken();
      const { data, error } = await supabase.functions.invoke('verify-turnstile', { body: { token } });
      if (error || !data?.ok) fail('captcha_fail');
      if (kind === 'inscription') sessionStorage.setItem('imagie-oauth-community-consent', '1');
      const { error: oerr } = await supabase.auth.signInWithOAuth({ provider: btn.dataset.oauth, options: { redirectTo: `${location.origin}/compte.html${search}` } });
      if (oerr) { sessionStorage.removeItem('imagie-oauth-community-consent'); throw oerr; }
    } catch (err) { say(err.userFacing ? err.message : L('e_generic'), 'error'); }
    finally { captcha.reset(); btn.disabled = false; }
  }));

  form.addEventListener('submit', (e) => { e.preventDefault(); submitGuard(async () => {
    if (kind === 'connexion') {
      const email = val('email'), password = String(new FormData(form).get('password') || '');
      if (!email || !password) fail('e_required'); if (!emailOk(email)) fail('e_email');
      if (!supabase) return notConfigured();
      const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captcha.getToken() } });
      if (error) fail('e_cred');
      return go(`compte.html${search}`);
    }
    if (kind === 'inscription' || kind === 'completer-profil') {
      const f = { first_name: val('first_name'), last_name: val('last_name'), birth_date: val('birth_date'), phone: val('phone') };
      if (!f.first_name || !f.last_name || !f.birth_date || !f.phone) fail('e_required');
      const dob = dobStatus(f.birth_date); if (dob === 'invalid') fail('e_dob'); if (dob === 'minor') fail('e_adult');
      if (!phoneOk(f.phone)) fail('e_phone');
      if (kind === 'completer-profil') {
        if (!supabase) return notConfigured();
        const { error } = await supabase.rpc('complete_member_profile', { p_first_name: f.first_name, p_last_name: f.last_name, p_birth_date: f.birth_date, p_phone: f.phone });
        if (error) fail(String(error.message || '').includes('ADULT_REQUIRED') ? 'e_adult' : 'e_generic');
        return go(`compte.html${search}`);
      }
      const email = val('email'), password = String(new FormData(form).get('password') || ''), password2 = String(new FormData(form).get('password2') || '');
      if (!email) fail('e_required'); if (!emailOk(email)) fail('e_email');
      if (password.length < 10) fail('e_pwlen'); if (password !== password2) fail('e_pwmatch');
      if (!$('terms').checked) fail('e_terms');
      if (!supabase) return notConfigured();
      const { data, error } = await supabase.auth.signUp({ email, password, options: { captchaToken: captcha.getToken(),
        data: { first_name: f.first_name, last_name: f.last_name, full_name: `${f.first_name} ${f.last_name}`, birth_date: f.birth_date, phone: f.phone, preferred_language: lang },
        emailRedirectTo: `${location.origin}/compte.html${search}` } });
      if (error) { if (String(error.message || '').toLowerCase().includes('database error')) fail('e_adult'); throw error; }
      if (data?.session) {
        // Supabase must require email confirmation; otherwise the project is configured to auto-confirm users.
        await supabase.auth.signOut();
        throw new Error('La confirmation par e-mail est désactivée dans Supabase. Activez-la pour rendre le code obligatoire.');
      }
      if (!data?.user) throw new Error('Supabase n’a pas retourné de compte. Vérifiez la configuration Auth.');
      form.hidden = true;
      document.querySelectorAll('.auth-links,.auth-sep,.auth-note,.auth-social,#turnstile-widget,#captcha-msg').forEach((el) => { el.hidden = true; });
      const otpPanel = document.createElement('section');
      otpPanel.className = 'otp-panel';
      otpPanel.innerHTML = `<h2>Vérifiez votre adresse e-mail</h2><p>Un code de validation vient d’être envoyé à votre adresse. Saisissez les 6 chiffres pour activer votre compte Imagie Community.</p><form id="signup-otp-form" novalidate><div class="field"><label for="signup-otp">Code de validation</label><input id="signup-otp" name="token" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" minlength="6" required></div><button class="btn auth-submit" type="submit">Vérifier et activer mon compte</button></form><button class="btn small secondary" type="button" id="resend-signup-otp">Renvoyer le code</button><p id="signup-otp-status" class="auth-hint" role="status" aria-live="polite"></p>`;
      form.insertAdjacentElement('afterend', otpPanel);
      const otpForm = otpPanel.querySelector('#signup-otp-form');
      const otpInput = otpPanel.querySelector('#signup-otp');
      const otpStatus = otpPanel.querySelector('#signup-otp-status');
      const otpEmail = email.toLowerCase();
      const otpSay = (text, bad=false) => { otpStatus.textContent = text; otpStatus.className = bad ? 'auth-hint error' : 'auth-hint'; };
      otpInput.focus();
      otpForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const token = otpInput.value.replace(/\D/g, '');
        if (!/^\d{6}$/.test(token)) { otpSay('Entrez le code à 6 chiffres reçu par e-mail.', true); return; }
        const verifyButton = otpForm.querySelector('button[type="submit"]');
        verifyButton.disabled = true; otpSay('Vérification du code…');
        try {
          const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({ email: otpEmail, token, type: 'signup' });
          if (verifyError || !verified?.session) throw verifyError || new Error('Le code n’a pas pu activer la session.');
          const { error: consentError } = await supabase.rpc('accept_community_terms', { p_version: ctx.termsVersion });
          if (consentError) throw new Error('E-mail vérifié. Connectez-vous pour terminer votre adhésion à la communauté.');
          otpSay('Adresse vérifiée. Votre compte est activé.');
          go(`compte.html${search}`);
        } catch (verifyError) {
          otpSay(verifyError?.message || 'Code incorrect ou expiré. Demandez un nouveau code.', true);
        } finally { verifyButton.disabled = false; }
      });
      otpPanel.querySelector('#resend-signup-otp').addEventListener('click', async (event) => {
        const button = event.currentTarget; button.disabled = true; otpSay('Envoi du nouveau code…');
        try {
          const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: otpEmail });
          if (resendError) throw resendError;
          otpSay('Un nouveau code vient d’être envoyé. Vérifiez aussi vos courriers indésirables.');
        } catch (resendError) { otpSay(resendError?.message || 'Impossible de renvoyer le code pour le moment.', true); }
        finally { button.disabled = false; }
      });
      say('Votre inscription est presque terminée. Vérifiez votre boîte e-mail pour récupérer le code.', 'info');
      return;
    }
    // mot-de-passe-oublie
    if (new URLSearchParams(location.search).get('mode') === 'reset') {
      const password = String(new FormData(form).get('password') || ''), password2 = String(new FormData(form).get('password2') || '');
      if (password.length < 10) fail('e_pwlen'); if (password !== password2) fail('e_pwmatch');
      if (!supabase) return notConfigured();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) fail('link_invalid');
      form.hidden = true; say(L('pwd_changed'), 'info'); return;
    }
    const email = val('email'); if (!email) fail('e_required'); if (!emailOk(email)) fail('e_email');
    if (!supabase) return notConfigured();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/mot-de-passe-oublie.html?mode=reset`, captchaToken: captcha.getToken() });
    say(L('sent'), 'info'); // same answer whether or not the account exists
  }); });

  if (kind === 'completer-profil') {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return go(`connexion.html${search}`);
    const { data: p } = await supabase.from('profiles').select('first_name,last_name,full_name,phone,birth_date').eq('id', session.user.id).maybeSingle();
    const m = session.user.user_metadata || {};
    const full = (p?.full_name || m.full_name || m.name || '').trim();
    $('first_name').value = p?.first_name || m.first_name || full.split(' ')[0] || '';
    $('last_name').value = p?.last_name || m.last_name || full.split(' ').slice(1).join(' ') || '';
    $('phone').value = p?.phone || m.phone || '';
    if (p?.birth_date) { $('birth_date').value = p.birth_date; $('birth_date').readOnly = true; $('dob-hint').textContent = L('locked'); }
  }
}
