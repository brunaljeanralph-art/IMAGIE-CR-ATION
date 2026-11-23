// Accessible product detail dialog. Variant selection is carried through cart and checkout.
const L = {
  fr: { code: 'Code', variants: 'Choisissez une variante', vnote: 'Le stock et le supplément de prix de la variante sont vérifiés avant la commande.', close: 'Fermer', photo: 'Les photos et détails seront complétés avant publication.', no: 'Ce produit n’est pas encore commandable : prix, stock ou configuration à valider par Imagie.', choose: 'Sélectionner une option', gallery: 'Galerie du produit', related: 'Vous pourriez aussi aimer', add: 'Ajouter au panier', required: 'Veuillez choisir une variante.' },
  ht: { code: 'Kòd', variants: 'Chwazi yon varyant', vnote: 'N ap verifye stòk ak pri siplemantè varyant lan anvan kòmand lan.', close: 'Fèmen', photo: 'Foto ak detay yo ap konplete anvan piblikasyon.', no: 'Pwodwi sa a poko ka kòmande: Imagie dwe valide pri a, stòk la oswa konfigirasyon an.', choose: 'Chwazi yon opsyon', gallery: 'Galri pwodwi a', related: 'Men kèk lòt pwodwi ou ka renmen', add: 'Ajoute nan panye', required: 'Tanpri chwazi yon varyant.' },
  en: { code: 'Code', variants: 'Choose a variant', vnote: 'The selected variant price adjustment and stock are checked before checkout.', close: 'Close', photo: 'Photos and details will be completed before publication.', no: 'This product cannot be ordered yet: price, stock or setup must be validated by Imagie.', choose: 'Choose an option', gallery: 'Product gallery', related: 'You may also like', add: 'Add to cart', required: 'Please choose a variant.' },
  es: { code: 'Código', variants: 'Elige una variante', vnote: 'El stock y el ajuste de precio se verifican antes de realizar el pedido.', close: 'Cerrar', photo: 'Las fotos y detalles se completarán antes de publicar.', no: 'Este producto aún no se puede pedir: Imagie debe validar precio, stock o configuración.', choose: 'Elige una opción', gallery: 'Galería del producto', related: 'También te puede gustar', add: 'Añadir al carrito', required: 'Selecciona una variante.' },
  pt: { code: 'Código', variants: 'Escolha uma variante', vnote: 'O estoque e o ajuste de preço da variante são verificados antes do pedido.', close: 'Fechar', photo: 'Fotos e detalhes serão completados antes da publicação.', no: 'Este produto ainda não pode ser pedido: preço, estoque ou configuração a validar pela Imagie.', choose: 'Escolha uma opção', gallery: 'Galeria do produto', related: 'Você também pode gostar', add: 'Adicionar ao carrinho', required: 'Selecione uma variante.' },
  de: { code: 'Code', variants: 'Variante auswählen', vnote: 'Bestand und Preisaufschlag werden vor der Bestellung geprüft.', close: 'Schließen', photo: 'Fotos und Details werden vor der Veröffentlichung ergänzt.', no: 'Dieses Produkt ist noch nicht bestellbar: Preis, Bestand oder Einrichtung müssen bestätigt werden.', choose: 'Option wählen', gallery: 'Produktgalerie', related: 'Das könnte Ihnen auch gefallen', add: 'In den Warenkorb', required: 'Bitte eine Variante auswählen.' },
  it: { code: 'Codice', variants: 'Scegli una variante', vnote: 'Disponibilità e supplemento di prezzo saranno verificati prima dell’ordine.', close: 'Chiudi', photo: 'Foto e dettagli saranno completati prima della pubblicazione.', no: 'Questo prodotto non è ancora ordinabile: prezzo, scorte o configurazione da confermare.', choose: 'Scegli un’opzione', gallery: 'Galleria prodotto', related: 'Potrebbe piacerti anche', add: 'Aggiungi al carrello', required: 'Seleziona una variante.' },
  ar: { code: 'الرمز', variants: 'اختر خيارًا', vnote: 'يتم التحقق من المخزون وتعديل السعر قبل الطلب.', close: 'إغلاق', photo: 'ستُستكمل الصور والتفاصيل قبل النشر.', no: 'لا يمكن طلب هذا المنتج بعد: يجب تأكيد السعر أو المخزون أو الإعداد.', choose: 'اختر خيارًا', gallery: 'معرض المنتج', related: 'قد يعجبك أيضًا', add: 'أضف إلى السلة', required: 'يرجى اختيار خيار.' },
  zh: { code: '编号', variants: '选择规格', vnote: '下单前会核实所选规格的库存和价格调整。', close: '关闭', photo: '发布前将补充照片和详情。', no: '该商品暂不可订购：价格、库存或配置需由 Imagie 确认。', choose: '选择选项', gallery: '产品图库', related: '你可能还喜欢', add: '加入购物车', required: '请选择一个规格。' }
};
let open = false;

function variantLabel(variant) {
  const values = Object.values(variant.option_values || {}).flatMap((value) => Array.isArray(value) ? value : (typeof value === 'string' ? [value] : []));
  return [variant.display_name, ...values].filter(Boolean).join(' · ') || variant.sku || 'Option';
}

export function openProductModal(p, { t, money, escapeHtml, lang, canOrder, onAdd, relatedProducts = [], onRelated }) {
  if (open) return;
  open = true;
  const d = L[lang] || L.fr;
  const esc = escapeHtml;
  const name = p['name_' + lang] || p.name_fr || p.sku;
  const previousFocus = document.activeElement;
  const images = (Array.isArray(p.images) && p.images.length ? p.images : (p.image_url ? [{ url: p.image_url, alt: name }] : []))
    .filter((image) => image && image.url);
  const purchasableVariants = (p.variants || []).filter((variant) => variant.id && variant.active !== false && Number(p.price ?? 0) + Number(variant.price_adjustment || 0) >= 0);
  const variantSelect = purchasableVariants.length ? `<div class="pm-variant-field"><label for="pm-variant">${esc(d.variants)}</label><select id="pm-variant" required><option value="">${esc(d.choose)}</option>${purchasableVariants.map((variant) => { const outOfStock = p.track_inventory !== false && Number(variant.stock_quantity || 0) < 1; return `<option value="${esc(variant.id)}" data-adjustment="${Number(variant.price_adjustment || 0)}" data-stock="${Number(variant.stock_quantity || 0)}" ${outOfStock ? 'disabled' : ''}>${esc(variantLabel(variant))}${Number(variant.price_adjustment || 0) ? ` (${Number(variant.price_adjustment) > 0 ? '+' : ''}${esc(money(Number(variant.price_adjustment)))})` : ''}${outOfStock ? ' — indisponible' : ''}</option>`; }).join('')}</select><small>${esc(d.vnote)}</small></div>` : '';
  const informationalVariants = !purchasableVariants.length && (p.variants || []).length
    ? `<div class="pm-note">${(p.variants || []).map((variant) => `<p><b>${esc(variant.name || 'Options')}</b> · ${esc((variant.options || []).join(', '))}</p>`).join('')}</div>` : '';
  const thumbs = images.length > 1 ? `<div class="pm-thumbs" aria-label="${esc(d.gallery)}">${images.map((image, index) => `<button type="button" data-pm-image="${index}" class="${index === 0 ? 'active' : ''}" aria-label="Photo ${index + 1}"><img src="${esc(image.url)}" alt=""></button>`).join('')}</div>` : '';
  const related = relatedProducts.length ? `<section class="pm-related"><h3>${esc(d.related)}</h3><div class="pm-related-grid">${relatedProducts.map((item) => `<button type="button" data-pm-related="${esc(item.sku)}"><span>${esc(item.name_fr || item.sku)}</span><small>${esc(money(item.price))}</small></button>`).join('')}</div></section>` : '';

  const root = document.createElement('div');
  root.className = 'pm-backdrop';
  root.innerHTML = `<div class="pm" role="dialog" aria-modal="true" aria-labelledby="pm-title" tabindex="-1">
    <button type="button" class="pm-x" data-pm-close aria-label="${esc(d.close)}">×</button>
    ${images.length ? `<img class="pm-img" id="pm-main-image" src="${esc(images[0].url)}" alt="${esc(images[0].alt || name)}">` : ''}
    ${thumbs}
    <span class="sku">${esc(d.code)}: ${esc(p.sku)}</span>
    <h2 id="pm-title">${esc(name)}</h2>
    <p class="pm-price" id="pm-price">${esc(money(p.price))}</p>
    ${p.description_fr ? `<p>${esc(p.description_fr)}</p>` : ''}
    ${variantSelect}${informationalVariants}
    <p class="pm-note">${esc(d.photo)}</p>
    ${canOrder ? `<button type="button" class="btn" data-pm-add>${esc(d.add)}</button><p class="pm-feedback" role="status" aria-live="polite"></p>` : `<p class="pm-note pm-warn" role="status">${esc(d.no)}</p>`}
    ${related}
  </div>`;
  document.body.appendChild(root);
  document.body.classList.add('pm-open');
  const dialog = root.querySelector('.pm');
  const focusables = () => [...dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((element) => !element.disabled);
  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    root.remove();
    document.body.classList.remove('pm-open');
    open = false;
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  };
  const onKey = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const elements = focusables();
    if (!elements.length) { event.preventDefault(); dialog.focus(); return; }
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  const variantSelectElement = root.querySelector('#pm-variant');
  if (variantSelectElement) {
    variantSelectElement.addEventListener('change', () => {
      const chosen = purchasableVariants.find((variant) => variant.id === variantSelectElement.value);
      const priceElement = root.querySelector('#pm-price');
      if (priceElement) priceElement.textContent = money(chosen ? Number(p.price) + Number(chosen.price_adjustment || 0) : p.price);
    });
  }
  root.addEventListener('click', async (event) => {
    if (event.target === root || event.target.closest('[data-pm-close]')) { close(); return; }
    const imageButton = event.target.closest('[data-pm-image]');
    if (imageButton) {
      const index = Number(imageButton.dataset.pmImage);
      const image = images[index];
      const main = root.querySelector('#pm-main-image');
      if (image && main) { main.src = image.url; main.alt = image.alt || name; }
      root.querySelectorAll('[data-pm-image]').forEach((button) => button.classList.toggle('active', button === imageButton));
      return;
    }
    const relatedButton = event.target.closest('[data-pm-related]');
    if (relatedButton && onRelated) { const sku = relatedButton.dataset.pmRelated; close(); onRelated(sku); return; }
    const add = event.target.closest('[data-pm-add]');
    if (add) {
      const select = root.querySelector('#pm-variant');
      const feedback = root.querySelector('.pm-feedback');
      let selection = null;
      if (select) {
        const variant = purchasableVariants.find((item) => item.id === select.value);
        if (!variant) { feedback.textContent = d.required; select.focus(); return; }
        if (Number(variant.stock_quantity) < 1 && p.track_inventory !== false) { feedback.textContent = 'Cette variante est indisponible.'; return; }
        selection = { variantId: variant.id, variantLabel: variantLabel(variant), priceAdjustment: Number(variant.price_adjustment || 0), stockQuantity: Number(variant.stock_quantity || 0) };
      }
      add.disabled = true;
      try { const ok = await onAdd(selection); if (ok) close(); }
      finally { if (add.isConnected) add.disabled = false; }
    }
  });
  (focusables()[0] || dialog).focus();
}
