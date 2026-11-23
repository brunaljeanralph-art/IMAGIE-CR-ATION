// Accessible product detail dialog (replaces the former alert()).
// Variants are shown for information: choosing a variant is NOT yet persisted in the
// member cart / checkout RPC (requires a schema change, see docs/CHANGELOG_SITE_PASS.md).
const L = {
  fr: { code: 'Code', variants: 'Variantes disponibles', vnote: 'Le choix de la variante est confirmé avec Imagie lors de la commande.', close: 'Fermer', photo: 'Les photos et détails seront complétés avant publication.', no: 'Ce produit n’est pas encore commandable : prix, stock ou configuration à valider par Imagie.' },
  ht: { code: 'Kòd', variants: 'Varyant ki disponib', vnote: 'Chwa varyant lan konfime ak Imagie lè w kòmande.', close: 'Fèmen', photo: 'Foto ak detay yo ap konplete anvan piblikasyon.', no: 'Pwodwi sa a poko ka kòmande: Imagie dwe valide pri a, stòk la oswa konfigirasyon an.' },
  en: { code: 'Code', variants: 'Available variants', vnote: 'The variant choice is confirmed with Imagie when you order.', close: 'Close', photo: 'Photos and details will be completed before publication.', no: 'This product cannot be ordered yet: price, stock or setup must be validated by Imagie.' },
  es: { code: 'Código', variants: 'Variantes disponibles', vnote: 'La variante se confirma con Imagie al hacer el pedido.', close: 'Cerrar', photo: 'Las fotos y detalles se completarán antes de publicar.', no: 'Este producto aún no se puede pedir: Imagie debe validar precio, stock o configuración.' },
  pt: { code: 'Código', variants: 'Variantes disponíveis', vnote: 'A escolha da variante é confirmada com a Imagie no pedido.', close: 'Fechar', photo: 'Fotos e detalhes serão completados antes da publicação.', no: 'Este produto ainda não pode ser pedido: preço, estoque ou configuração a validar pela Imagie.' },
  de: { code: 'Code', variants: 'Verfügbare Varianten', vnote: 'Die Variante wird bei der Bestellung mit Imagie bestätigt.', close: 'Schließen', photo: 'Fotos und Details werden vor der Veröffentlichung ergänzt.', no: 'Dieses Produkt ist noch nicht bestellbar: Preis, Bestand oder Konfiguration müssen von Imagie bestätigt werden.' },
  it: { code: 'Codice', variants: 'Varianti disponibili', vnote: 'La variante viene confermata con Imagie al momento dell’ordine.', close: 'Chiudi', photo: 'Foto e dettagli saranno completati prima della pubblicazione.', no: 'Questo prodotto non è ancora ordinabile: prezzo, scorte o configurazione da validare da Imagie.' },
  ar: { code: 'الرمز', variants: 'الخيارات المتاحة', vnote: 'يتم تأكيد الخيار مع Imagie عند الطلب.', close: 'إغلاق', photo: 'ستُستكمل الصور والتفاصيل قبل النشر.', no: 'لا يمكن طلب هذا المنتج بعد: يجب أن تؤكد Imagie السعر أو المخزون أو الإعداد.' },
  zh: { code: '编号', variants: '可选规格', vnote: '下单时与 Imagie 确认所选规格。', close: '关闭', photo: '照片和详情将在发布前补充完整。', no: '该商品暂不可订购:价格、库存或配置需由 Imagie 确认。' }
};
let open = false;
export function openProductModal(p, { t, money, escapeHtml, lang, canOrder, onAdd }) {
  if (open) return;
  open = true;
  const d = L[lang] || L.fr;
  const esc = escapeHtml;
  const name = p['name_' + lang] || p.name_fr;
  const prev = document.activeElement;
  const variants = (p.variants || []).map((v) => `<div class="pm-var"><b>${esc(v.name)}</b><ul>${(v.options || []).map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>`).join('');
  const root = document.createElement('div');
  root.className = 'pm-backdrop';
  root.innerHTML = `<div class="pm" role="dialog" aria-modal="true" aria-labelledby="pm-title" tabindex="-1">
    <button type="button" class="pm-x" data-pm-close aria-label="${esc(d.close)}">×</button>
    ${p.image_url ? `<img class="pm-img" src="${esc(p.image_url)}" alt="${esc(name)}">` : ''}
    <span class="sku">${esc(d.code)}: ${esc(p.sku)}</span>
    <h2 id="pm-title">${esc(name)}</h2>
    <p class="pm-price">${esc(money(p.price))}</p>
    ${p.description_fr ? `<p>${esc(p.description_fr)}</p>` : ''}
    ${variants ? `<h3>${esc(d.variants)}</h3>${variants}<p class="pm-note">${esc(d.vnote)}</p>` : ''}
    <p class="pm-note">${esc(d.photo)}</p>
    ${canOrder ? `<button type="button" class="btn" data-pm-add>${esc(t('add'))}</button>` : `<p class="pm-note pm-warn" role="status">${esc(d.no)}</p>`}
  </div>`;
  document.body.appendChild(root);
  document.body.classList.add('pm-open');
  const dlg = root.querySelector('.pm');
  const focusables = () => [...dlg.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((e) => !e.disabled);
  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    root.remove();
    document.body.classList.remove('pm-open');
    open = false;
    if (prev && prev.focus) prev.focus();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) { e.preventDefault(); dlg.focus(); return; }
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dlg)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  root.addEventListener('click', async (e) => {
    if (e.target === root || e.target.closest('[data-pm-close]')) { close(); return; }
    const add = e.target.closest('[data-pm-add]');
    if (add) { add.disabled = true; let ok = false; try { ok = await onAdd(); } finally { add.disabled = false; } if (ok) close(); }
  });
  (focusables()[0] || dlg).focus();
}
