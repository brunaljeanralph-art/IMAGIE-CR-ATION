const COMPARE_KEY = 'imagie-compare:v1';

export function filterAndSortProducts(products, filters = {}) {
  const query = String(filters.query || '').trim().toLocaleLowerCase();
  const min = filters.min === '' || filters.min == null ? null : Number(filters.min);
  const max = filters.max === '' || filters.max == null ? null : Number(filters.max);
  const rows = (Array.isArray(products) ? products : []).filter((product) => {
    const searchable = [product.name_fr, product.name_ht, product.name_en, product.name_es, product.sku, product.category]
      .filter(Boolean).join(' ').toLocaleLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filters.category && filters.category !== 'all' && !matchesCategory(product, filters.category)) return false;
    if (filters.available && !isAvailable(product)) return false;
    if (min !== null && Number.isFinite(min) && (product.price == null || Number(product.price) < min)) return false;
    if (max !== null && Number.isFinite(max) && (product.price == null || Number(product.price) > max)) return false;
    return true;
  });

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  switch (filters.sort) {
    case 'price-asc': rows.sort((a, b) => priceValue(a) - priceValue(b)); break;
    case 'price-desc': rows.sort((a, b) => priceValue(b) - priceValue(a)); break;
    case 'name': rows.sort((a, b) => collator.compare(a.name_fr || a.sku, b.name_fr || b.sku)); break;
    case 'featured': rows.sort((a, b) => Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured))); break;
    case 'newest': rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
    default: break;
  }
  return rows;
}

export function isAvailable(product) {
  if (!product || product.price == null || product.price_status !== 'active' || product.backend_ready !== true) return false;
  if (product.track_inventory === false) return true;
  const variants = Array.isArray(product.variants) ? product.variants.filter((v) => v.active !== false) : [];
  if (variants.length) return variants.some((v) => Number(v.stock_quantity) > 0);
  return Number(product.stock_quantity) > 0;
}

export function matchesCategory(product, category) {
  if (category === 'all' || !category) return true;
  const name = String(product.name_fr || '').toLowerCase();
  if (category === 'cups') return /tasse|tas |mug/.test(name);
  if (category === 'tumblers') return /tumbler|thermos|gourde|bidon|gobelet/.test(name);
  if (category === 'banner') return /banni|bâche|banner|roll-up|x-banner/.test(name);
  return product.category === category;
}

export function getRecommendations(currentProduct, products, limit = 4) {
  const candidates = (Array.isArray(products) ? products : []).filter((p) => p && p.sku !== currentProduct?.sku);
  if (!currentProduct) return candidates.filter((p) => p.is_featured || isAvailable(p)).slice(0, limit);
  return candidates
    .map((p) => ({ product: p, score: (p.category === currentProduct.category ? 3 : 0) + (p.is_featured ? 1 : 0) + (isAvailable(p) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.product);
}

function priceValue(product) {
  return product.price == null ? Number.POSITIVE_INFINITY : Number(product.price);
}

export function createCompareTools({ getProducts, escapeHtml, money, toast }) {
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
      return Array.isArray(value) ? value.filter((x) => typeof x === 'string').slice(0, 3) : [];
    } catch (_) { return []; }
  };
  const write = (items) => {
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(items.slice(0, 3))); }
    catch (_) { toast('La liste de comparaison ne peut pas être enregistrée sur cet appareil.'); }
  };
  const selected = () => read();
  const isSelected = (sku) => read().includes(sku);

  function toggle(sku) {
    const items = read();
    const index = items.indexOf(sku);
    if (index >= 0) items.splice(index, 1);
    else {
      if (items.length >= 3) { toast('Vous pouvez comparer au maximum 3 produits à la fois.'); return false; }
      if (!(getProducts() || []).some((p) => p.sku === sku)) return false;
      items.push(sku);
    }
    write(items);
    refresh();
    toast(index >= 0 ? 'Produit retiré de la comparaison.' : 'Produit ajouté à la comparaison.');
    return true;
  }

  function refresh() {
    const items = read();
    const count = document.getElementById('compare-count');
    const open = document.getElementById('compare-open');
    const clear = document.getElementById('compare-clear');
    if (count) count.textContent = `${items.length}/3 produit(s)`;
    if (open) open.disabled = items.length < 2;
    if (clear) clear.disabled = items.length === 0;
    document.querySelectorAll('[data-compare]').forEach((button) => {
      const active = items.includes(button.dataset.compare);
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? '✓ Comparé' : '⇄ Comparer';
    });
  }

  function open() {
    const products = getProducts() || [];
    const chosen = read().map((sku) => products.find((p) => p.sku === sku)).filter(Boolean);
    if (chosen.length < 2) { toast('Choisissez au moins deux produits pour les comparer.'); return; }
    const backdrop = document.createElement('div');
    backdrop.className = 'compare-backdrop';
    backdrop.setAttribute('role', 'presentation');
    const dialog = document.createElement('section');
    dialog.className = 'compare-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'compare-title');
    const title = document.createElement('h2');
    title.id = 'compare-title'; title.textContent = 'Comparer les produits';
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'icon-btn compare-close'; close.textContent = '×'; close.setAttribute('aria-label', 'Fermer');
    const table = document.createElement('div'); table.className = 'compare-table-wrap';
    const grid = document.createElement('table'); grid.className = 'compare-table';
    const rows = [
      ['Produit', (p) => p.name_fr || p.sku],
      ['Code', (p) => p.sku],
      ['Catégorie', (p) => p.category || '—'],
      ['Prix affiché', (p) => money(p.price)],
      ['Disponibilité', (p) => isAvailable(p) ? 'Disponible' : 'Prix / stock / configuration à confirmer'],
      ['Variantes', (p) => (p.variants || []).map((v) => v.display_name || v.name || v.sku).filter(Boolean).join(', ') || 'Selon la fiche produit'],
      ['Description', (p) => p.description_fr || '—']
    ];
    const tbody = document.createElement('tbody');
    rows.forEach(([label, getValue]) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = label; tr.appendChild(th);
      chosen.forEach((product) => { const td = document.createElement('td'); td.textContent = String(getValue(product) ?? '—'); tr.appendChild(td); });
      tbody.appendChild(tr);
    });
    grid.appendChild(tbody); table.appendChild(grid);
    const note = document.createElement('p'); note.className = 'smallprint';
    note.textContent = 'Les prix, stocks et variantes définitifs sont confirmés depuis le catalogue sécurisé au moment de la commande.';
    const head = document.createElement('div'); head.className = 'compare-dialog-head'; head.append(title, close);
    dialog.append(head, table, note); backdrop.appendChild(dialog); document.body.appendChild(backdrop);
    const dismiss = () => { backdrop.remove(); document.removeEventListener('keydown', keyHandler); };
    const keyHandler = (event) => { if (event.key === 'Escape') dismiss(); };
    close.addEventListener('click', dismiss);
    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) dismiss(); });
    document.addEventListener('keydown', keyHandler);
    close.focus();
  }

  function bind() {
    document.querySelectorAll('[data-compare]').forEach((button) => {
      button.onclick = () => toggle(button.dataset.compare);
    });
    const openButton = document.getElementById('compare-open');
    const clearButton = document.getElementById('compare-clear');
    if (openButton) openButton.onclick = open;
    if (clearButton) clearButton.onclick = () => { write([]); refresh(); toast('Liste de comparaison vidée.'); };
    refresh();
  }

  return { selected, isSelected, toggle, refresh, open, bind };
}
