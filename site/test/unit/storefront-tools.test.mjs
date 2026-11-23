import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortProducts, isAvailable, getRecommendations, matchesCategory } from '../../assets/services/storefront-tools.js';

const products = [
  { sku: 'MUG-1', name_fr: 'Tasse personnalisée', category: 'sublimation', price: 10, price_status: 'active', backend_ready: true, track_inventory: true, stock_quantity: 5, is_featured: true },
  { sku: 'TSHIRT-1', name_fr: 'T-shirt imprimé', category: 'textile', price: 18, price_status: 'active', backend_ready: true, track_inventory: false, stock_quantity: 0 },
  { sku: 'MUG-2', name_fr: 'Mug magique', category: 'sublimation', price: null, price_status: 'to_be_set', backend_ready: true, track_inventory: true, stock_quantity: 4 },
  { sku: 'PRESS-1', name_fr: 'Presse à chaud', category: 'equipment', price: 150, price_status: 'active', backend_ready: false, track_inventory: true, stock_quantity: 2 }
];

test('recherche textuelle trouve SKU et nom', () => {
  assert.deepEqual(filterAndSortProducts(products, { query: 'mug' }).map(p => p.sku), ['MUG-1', 'MUG-2']);
  assert.deepEqual(filterAndSortProducts(products, { query: 'PRESS-1' }).map(p => p.sku), ['PRESS-1']);
});

test('filtre catégorie et intervalle de prix', () => {
  assert.deepEqual(filterAndSortProducts(products, { category: 'textile' }).map(p => p.sku), ['TSHIRT-1']);
  assert.deepEqual(filterAndSortProducts(products, { min: '9', max: '20' }).map(p => p.sku), ['MUG-1', 'TSHIRT-1']);
});

test('tri prix croissant et nom', () => {
  assert.deepEqual(filterAndSortProducts(products, { sort: 'price-asc' }).map(p => p.sku), ['MUG-1', 'TSHIRT-1', 'PRESS-1', 'MUG-2']);
  assert.deepEqual(filterAndSortProducts(products, { sort: 'name' }).map(p => p.sku), ['MUG-2', 'PRESS-1', 'TSHIRT-1', 'MUG-1']);
});

test('disponibilité exige prix actif, origine sécurisée et stock si suivi', () => {
  assert.equal(isAvailable(products[0]), true);
  assert.equal(isAvailable(products[1]), true);
  assert.equal(isAvailable(products[2]), false);
  assert.equal(isAvailable(products[3]), false);
  assert.deepEqual(filterAndSortProducts(products, { available: true }).map(p => p.sku), ['MUG-1', 'TSHIRT-1']);
});

test('un produit avec variantes disponibles suit le stock des variantes', () => {
  const p = { price: 20, price_status: 'active', backend_ready: true, track_inventory: true, stock_quantity: 0, variants: [{ active: true, stock_quantity: 0 }, { active: true, stock_quantity: 3 }] };
  assert.equal(isAvailable(p), true);
  p.variants[1].stock_quantity = 0;
  assert.equal(isAvailable(p), false);
});

test('catégories sémantiques et recommandations', () => {
  assert.equal(matchesCategory(products[0], 'cups'), true);
  assert.equal(matchesCategory(products[1], 'textile'), true);
  const recommended = getRecommendations(products[0], products, 2);
  assert.equal(recommended.length, 2);
  assert.ok(recommended.every(p => p.sku !== products[0].sku));
});
