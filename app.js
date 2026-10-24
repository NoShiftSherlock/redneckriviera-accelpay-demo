/* AccelPay checkout demo engine (static sales demo).
 *
 * What this simulates
 *   The brand's own site with AccelPay handling payments, taxes and routing each
 *   order to a licensed retailer in the buyer's state, picked by ZIP code.
 *   BRAND.shopify = false: the AccelPay white-label cart drawer and one-page
 *     checkout run on the brand's own (non-Shopify) site, in place of the old
 *     buy button. Card payments only.
 *   BRAND.shopify = true: the brand's Shopify cart and Shopify one-page checkout
 *     stay in place, with the AccelPay Shopify app installed. Express checkout
 *     (Shop Pay, Apple Pay, Google Pay) shows in the cart and at the top of checkout.
 *
 * What is real vs illustrative: see README.md and data.js.
 *   Real: products, copy, images and site prices (brand site, 2026-10-24); which
 *         network retailers stock which product, where, and at what price.
 *   Illustrative: "Licensed retailer in <state>" routes where no network retailer
 *         stocks the product yet (priced at the brand's current site price),
 *         shipping fee, tax estimate, shipping times, card form, confirmation.
 */
(function () {
  'use strict';

  const B = window.BRAND;
  const CATALOG = window.CATALOG || {};
  const DATA = window.DATA || { retailers: {}, variants: {}, zipPrefixState: {} };

  const SHIP_FEE = B.shipFee || 1499;   // illustrative
  const TAX_RATE = 0.08;                // illustrative estimate
  const MAX_QTY = 12;
  // States the illustrative route skips (no retailer-to-consumer shipping assumed).
  const NO_ROUTE = { AL: 1, AR: 1, DE: 1, MS: 1, OK: 1, SD: 1, UT: 1, PR: 1 };
  const STATE_NAMES = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',PR:'Puerto Rico' };

  // ---------------------------------------------------------------- state
  const LS = B.key + '-accelpay-cart-v1';
  const state = load() || { zip: null, st: null, items: [], method: null };
  function load() { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }

  const money = c => '$' + (c / 100).toFixed(2);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const stateName = st => STATE_NAMES[st] || st;
  const unit = p => p.unit || 'bottle';

  // ---------------------------------------------------------------- availability
  // Real network retailers in the buyer's state first; if none stocks the product,
  // an illustrative in-state route at the brand's current site price.
  function shipOpts(sku) {
    if (!state.zip) return [];
    const p = CATALOG[sku]; if (!p || p.soon) return [];
    const real = (DATA.variants[sku] || [])
      .filter(v => DATA.retailers[v.r] && DATA.retailers[v.r].state === state.st)
      .map(v => { const r = DATA.retailers[v.r]; return { id: v.r, real: true, name: r.name, city: r.city, st: r.state, price: v.price, stock: v.stock }; })
      .sort((a, b) => a.price - b.price);
    if (real.length) return real;
    if (NO_ROUTE[state.st]) return [];
    return [{ id: 'lic-' + state.st, real: false, name: 'Licensed ' + stateName(state.st) + ' retailer', city: 'Assigned at launch', st: state.st, price: p.sitePrice }];
  }
  function realStates(sku) {
    const s = {}; (DATA.variants[sku] || []).forEach(v => { const r = DATA.retailers[v.r]; if (r) s[r.state] = 1; });
    return Object.keys(s).sort();
  }
  function bestPrice(sku) { const o = shipOpts(sku); return o.length ? Math.min.apply(null, o.map(x => x.price)) : null; }
  function stateForZip(zip) { return DATA.zipPrefixState[String(zip).slice(0, 3)] || null; }

  // Delivery methods for the whole cart: every in-state route that covers every item.
  function methods() {
    if (!state.zip || !state.items.length) return [];
    const per = state.items.map(i => shipOpts(i.sku));
    if (per.some(l => !l.length)) return [];
    const out = [];
    const ids = per[0].map(o => o.id).filter(id => per.every(list => list.some(o => o.id === id)));
    ids.forEach(function (id) {
      const o = per[0].filter(x => x.id === id)[0];
      out.push({ id: id, real: o.real, name: o.name, city: o.city, st: o.st, fee: SHIP_FEE,
        prices: Object.fromEntries(state.items.map((i, k) => [i.sku, per[k].filter(x => x.id === id)[0].price])) });
    });
    // No single real retailer covers the whole cart: fall back to the in-state route.
    if (!out.length && !NO_ROUTE[state.st]) {
      out.push({ id: 'lic-' + state.st, real: false, name: 'Licensed ' + stateName(state.st) + ' retailer', city: 'Assigned at launch', st: state.st, fee: SHIP_FEE,
        prices: Object.fromEntries(state.items.map(i => [i.sku, CATALOG[i.sku].sitePrice])) });
    }
    const cost = m => state.items.reduce((s, i) => s + m.prices[i.sku] * i.qty, 0);
    return out.sort((a, b) => cost(a) - cost(b));
  }
  function currentMethod() { const ms = methods(); return ms.filter(m => m.id === state.method)[0] || ms[0] || null; }
  function linePrice(sku) {
    const m = currentMethod();
    if (m && m.prices[sku] != null) return m.prices[sku];
    return bestPrice(sku) || CATALOG[sku].sitePrice;
  }
  function freeShip(count) { return B.freeShipAt && count >= B.freeShipAt; }
  function totals() {
    const m = currentMethod();
    let subtotal = 0, count = 0;
    state.items.forEach(i => { subtotal += linePrice(i.sku) * i.qty; count += i.qty; });
    let shipping = m ? (freeShip(count) ? 0 : m.fee) : null;
    const tax = Math.round(subtotal * TAX_RATE);
    return { subtotal, count, shipping, tax, total: subtotal + (shipping || 0) + tax, method: m };
  }

  // ---------------------------------------------------------------- ZIP
  function setZip(raw) {
    const zip = String(raw || '').replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) { toast('Enter a 5-digit ZIP code'); return false; }
    const st = stateForZip(zip);
    if (!st) { toast('ZIP code not recognised'); return false; }
    state.zip = zip; state.st = st; state.method = null; save(); renderAll(); return true;
  }
  function clearZip() { state.zip = null; state.st = null; state.method = null; save(); renderAll(); }

  // ---------------------------------------------------------------- cart
  function addToCart(sku, qty) {
    if (!CATALOG[sku] || CATALOG[sku].soon) return;
    const ex = state.items.filter(i => i.sku === sku)[0];
    if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + qty); else state.items.push({ sku: sku, qty: qty });
    state.method = null; save(); renderAll(); openDrawer();
  }
  function setQty(sku, d) {
    const it = state.items.filter(i => i.sku === sku)[0]; if (!it) return;
    it.qty = Math.min(MAX_QTY, it.qty + d);
    if (it.qty < 1) state.items = state.items.filter(i => i.sku !== sku);
    state.method = null; save(); renderAll();
  }
  function removeItem(sku) { state.items = state.items.filter(i => i.sku !== sku); state.method = null; save(); renderAll(); }
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2600);
  }

  // ---------------------------------------------------------------- product page
  const ps = { qty: 1 };
  function renderProduct() {
    const host = $('#product-form'); if (!host) return;
    const sku = host.getAttribute('data-sku'); const p = CATALOG[sku]; if (!p) return;
    const bp = state.zip ? bestPrice(sku) : null;
    const price = p.soon ? '<span class="per">Coming soon</span>'
      : bp ? money(bp) + '<span class="per"> / ' + esc(unit(p)) + '</span>'
      : !state.zip ? money(p.sitePrice) + '<span class="per"> / ' + esc(unit(p)) + '</span>'
      : '<span class="per">Not available in ' + esc(stateName(state.st)) + ' yet</span>';
    const off = p.soon || (state.zip && !bp);
    host.innerHTML =
      '<div class="pf-field"><span class="pf-label">Size</span><div class="pf-variants"><span class="pf-variant" aria-checked="true">' + esc(p.size) + '</span></div></div>' +
      '<div class="pf-price">' + price + '</div>' +
      '<div class="pf-buy"><div class="qty"><button data-q="-1" aria-label="Decrease quantity">-</button><span>' + ps.qty + '</span><button data-q="1" aria-label="Increase quantity">+</button></div>' +
        '<button class="btn" id="addbtn"' + (off ? ' disabled' : '') + '>' + (p.soon ? 'Coming soon' : off ? 'Unavailable here' : 'Add to cart') + '</button></div>' +
      (B.shopify ? '<button class="xpb shoppay pf-xp" data-buy-now aria-label="Buy with Shop Pay"' + (off ? ' disabled' : '') + '><span>Buy with</span><span class="sp-shop">shop</span><span class="sp-pay">Pay</span></button>' : '') +
      deliveryBlock(sku);
    $$('[data-q]', host).forEach(b => b.addEventListener('click', () => { ps.qty = Math.max(1, Math.min(MAX_QTY, ps.qty + parseInt(b.getAttribute('data-q'), 10))); renderProduct(); }));
    const add = $('#addbtn', host); if (add) add.addEventListener('click', () => addToCart(sku, ps.qty));
    const bn = $('[data-buy-now]', host); if (bn) bn.addEventListener('click', () => { addToCart(sku, ps.qty); location.href = 'checkout.html'; });
    wireZip(host);
  }

  // AccelPay delivery block: who can deliver to this ZIP.
  function deliveryBlock(sku) {
    const p = CATALOG[sku];
    let body;
    if (!state.zip) {
      body = '<div class="zrow"><input class="zin" inputmode="numeric" maxlength="5" placeholder="Enter ZIP code" aria-label="ZIP code"><button class="btn ghost sm" data-zip-set>Check</button></div>' +
        '<div class="quick">Try: ' + B.quickZips.map(z => '<button data-zip-quick="' + z[0] + '">' + z[1] + '</button>').join('') + '</div>';
    } else {
      const sh = shipOpts(sku), real = sh.filter(o => o.real);
      body = '<div class="zset">Delivering to <strong>' + esc(state.zip) + '</strong> · ' + esc(stateName(state.st)) + ' <button class="chg" data-zip-change>Change</button></div><ul class="avail">' +
        (real.length ? '<li><span class="pin">' + esc(state.st) + '</span><span><strong>In stock at ' + real.length + ' licensed ' + esc(stateName(state.st)) + ' retailer' + (real.length === 1 ? '' : 's') + '</strong><br>' +
            real.slice(0, 3).map(o => esc(o.name) + ' (' + esc(o.city) + ') ' + money(o.price)).join(' · ') + '</span></li>' : '') +
        (!real.length && sh.length ? '<li><span class="pin">' + esc(state.st) + '</span><span><strong>Ships from a licensed ' + esc(stateName(state.st)) + ' retailer</strong><br>Retailer assigned at launch from the AccelPay network' +
            (realStates(sku).length ? '. In stock today in ' + realStates(sku).map(stateName).join(', ') : '') + '.</span></li>' : '') +
        (!sh.length ? '<li class="none">' + (p.soon ? 'Coming soon.' : 'Shipping to ' + esc(stateName(state.st)) + ' is not available.') + '</li>' : '') +
        '<li class="gp-none"><img src="assets/gopuff-icon.png" alt=""><span>Instant delivery in about 30 minutes switches on where Gopuff stocks ' + esc(B.name) + '.</span></li>' +
        '</ul><p class="fine">You pick delivery at checkout. Sold and fulfilled by a licensed retailer. 21+ only.</p>';
    }
    return '<div class="ap-block"><div class="ap-h"><span>Delivery near you</span><span class="ap-tag">' + (B.shopify ? 'AccelPay app' : 'AccelPay') + '</span></div>' + body + '</div>';
  }

  function wireZip(root) {
    $$('[data-zip-set]', root).forEach(b => b.addEventListener('click', () => { const i = b.parentElement.querySelector('input'); setZip(i && i.value); }));
    $$('.zin, .zipform input', root).forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); setZip(i.value); } }));
    $$('[data-zip-quick]', root).forEach(b => b.addEventListener('click', () => setZip(b.getAttribute('data-zip-quick'))));
    $$('[data-zip-change]', root).forEach(b => b.addEventListener('click', clearZip));
  }

  // ---------------------------------------------------------------- home: delivery band + cards
  function renderBand() {
    const box = $('#band-result'); if (!box) return;
    if (!state.zip) { box.innerHTML = ''; return; }
    const skus = Object.keys(CATALOG).filter(k => !CATALOG[k].soon);
    const n = {}; skus.forEach(k => shipOpts(k).filter(o => o.real).forEach(o => { n[o.id] = DATA.retailers[o.id]; }));
    const nr = Object.keys(n).length, routed = skus.filter(k => shipOpts(k).length).length;
    box.innerHTML = '<div class="band-res">' +
      '<div class="br-row"><span class="pin">' + esc(state.st) + '</span><div><strong>' +
        (nr ? nr + ' licensed ' + esc(stateName(state.st)) + ' retailer' + (nr === 1 ? '' : 's') + ' stock ' + esc(B.name) + ' today'
            : routed ? 'Ships from a licensed ' + esc(stateName(state.st)) + ' retailer' : 'Shipping to ' + esc(stateName(state.st)) + ' is not available') + '</strong><br><span>' +
        (nr ? Object.keys(n).map(id => esc(n[id].name) + ' (' + esc(n[id].city) + ')').join(' · ')
            : routed ? 'AccelPay assigns an in-state retailer from its network of 3,500+ licensed locations.' : 'Orders route to licensed retailers across 40+ states.') + '</span></div></div>' +
      '<div class="br-row"><img src="assets/gopuff-icon.png" alt="Gopuff"><div><strong>Instant delivery: not on Gopuff yet</strong><br><span>Once Gopuff stocks ' + esc(B.name) + ', delivery in about 30 minutes appears here automatically.</span></div></div>' +
      '<button class="chg" data-zip-change>Change ZIP</button></div>';
    wireZip(box);
  }
  function renderCards() {
    $$('[data-card-sku]').forEach(function (el) {
      const sku = el.getAttribute('data-card-sku'), p = CATALOG[sku];
      const bp = bestPrice(sku);
      const pr = el.querySelector('.price');
      if (pr) pr.innerHTML = p.soon ? '<span class="na">Coming soon</span>' : state.zip ? (bp ? money(bp) : '<span class="na">Not available in ' + esc(state.st) + '</span>') : money(p.sitePrice);
      const tag = el.querySelector('.tag');
      if (tag) { const real = state.zip && shipOpts(sku).some(o => o.real); tag.hidden = !real; }
      const b = el.querySelector('[data-add-sku]'); if (b) b.disabled = p.soon || (!!state.zip && !bp);
    });
  }

  // ---------------------------------------------------------------- cart drawer
  const XP_LINKS = '<div class="xp-row cd-xp"><a class="xpb shoppay" href="checkout.html" aria-label="Shop Pay"><span class="sp-shop">shop</span><span class="sp-pay">Pay</span></a>' +
    '<a class="xpb applepay" href="checkout.html" aria-label="Apple Pay"><span class="apl">&#63743;</span><span>Pay</span></a>' +
    '<a class="xpb gpay" href="checkout.html" aria-label="Google Pay"><span class="g"><b style="color:#4285f4">G</b></span><span>Pay</span></a></div>';
  function openDrawer() { const d = $('#drawer'); if (!d) return; d.classList.add('on'); $('#scrim').classList.add('on'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { const d = $('#drawer'); if (!d) return; d.classList.remove('on'); $('#scrim').classList.remove('on'); document.body.style.overflow = ''; }
  function renderDrawer() {
    const box = $('#drawer-items'); if (!box) return;
    box.innerHTML = state.items.length ? state.items.map(function (i) {
      const p = CATALOG[i.sku], u = linePrice(i.sku);
      return '<div class="line"><a class="thumb" href="product.html?sku=' + i.sku + '"><img src="' + (p.thumb || p.img) + '" alt=""></a><div class="info">' +
        '<span class="nm">' + esc(p.name) + '</span><span class="sz">' + esc(p.size) + '</span><span class="sz">' + money(u) + '</span>' +
        '<div class="lfoot"><div class="qty"><button data-cq="-1" data-k="' + i.sku + '">-</button><span>' + i.qty + '</span><button data-cq="1" data-k="' + i.sku + '">+</button></div>' +
        '<button class="rm" data-rm="' + i.sku + '">Remove</button></div></div><span class="amt">' + money(u * i.qty) + '</span></div>';
    }).join('') : '<div class="empty"><p>Your cart is empty</p><a class="btn" href="index.html#shop">Continue shopping</a></div>';
    const t = totals(), foot = $('#drawer-foot');
    if (foot) foot.innerHTML = state.items.length
      ? (B.freeShipAt ? '<div class="ship-meter">' + (freeShip(t.count) ? 'You unlocked free shipping.' : 'Add ' + (B.freeShipAt - t.count) + ' more for free shipping (buy ' + B.freeShipAt + ', ship free).') + '</div>' : '') +
        '<div class="totals"><div class="r big"><span>Estimated total</span><span class="v">' + money(t.subtotal) + ' USD</span></div></div>' +
        '<p class="secure">Taxes and shipping calculated at checkout. ' + (B.shopify ? 'Shopify checkout with the AccelPay app.' : 'Secure checkout by AccelPay.') + '</p>' +
        '<a class="btn block" href="checkout.html">Check out</a>' + (B.shopify ? XP_LINKS : '') +
        (B.onReserveBar ? '<div class="rb-note"><img src="assets/gift.svg" alt=""><span>Also on <strong>ReserveBar.com</strong>, for gifting.</span></div>' : '')
      : '';
    $$('[data-cq]', box).forEach(b => b.addEventListener('click', () => setQty(b.getAttribute('data-k'), parseInt(b.getAttribute('data-cq'), 10))));
    $$('[data-rm]', box).forEach(b => b.addEventListener('click', () => removeItem(b.getAttribute('data-rm'))));
  }
  function renderHeader() {
    const t = totals();
    $$('[data-cart-count]').forEach(el => { el.textContent = t.count; el.hidden = t.count === 0; });
    $$('[data-zip-label]').forEach(el => { el.textContent = state.zip ? state.zip + ' · ' + state.st : 'Set ZIP'; });
  }

  // ---------------------------------------------------------------- checkout
  function renderCheckout() {
    const side = $('#os'); if (!side) return;
    const t = totals(), m = t.method;
    side.innerHTML = state.items.map(function (i) {
      const p = CATALOG[i.sku];
      return '<div class="os-item"><div class="im"><img src="' + (p.thumb || p.img) + '" alt=""><span class="q">' + i.qty + '</span></div>' +
        '<div class="nm"><div class="t">' + esc(p.name) + '</div><div class="s">' + esc(p.size) + '</div></div><div class="pr">' + money(linePrice(i.sku) * i.qty) + '</div></div>';
    }).join('') || '<p class="muted">Your cart is empty.</p>';
    $('#os-sub').textContent = money(t.subtotal);
    $('#os-ship').textContent = !state.zip ? 'Enter ZIP' : (t.shipping == null ? '-' : (t.shipping ? money(t.shipping) : 'Free'));
    $('#os-tax').textContent = money(t.tax);
    $('#os-total').textContent = money(t.total);
    const fr = $('#os-from');
    if (fr) fr.innerHTML = m ? '<span class="pin">' + esc(m.st) + '</span> ' + (m.real ? 'Sold and shipped by ' + esc(m.name) + ', a licensed ' + esc(stateName(m.st)) + ' retailer'
      : 'Sold and shipped by a licensed ' + esc(stateName(m.st)) + ' retailer, assigned by AccelPay') : '';

    const box = $('#methods');
    if (box) {
      const ms = methods();
      if (!state.zip) box.innerHTML = '<div class="co-empty">Enter your shipping address to view available shipping methods.</div>';
      else if (!ms.length) box.innerHTML = '<div class="co-empty">' + (state.items.length ? 'Shipping to ' + esc(stateName(state.st)) + ' is not available for this cart.' : 'Your cart is empty.') + '</div>';
      else box.innerHTML = ms.slice(0, 5).map(function (o) {
        const sel = m && o.id === m.id;
        const cost = state.items.reduce((s, i) => s + o.prices[i.sku] * i.qty, 0);
        const fee = freeShip(t.count) ? 0 : o.fee;
        return '<label class="co-opt' + (sel ? ' selected' : '') + '" data-method="' + o.id + '"><span class="radio"></span>' +
          '<span class="ret"><span class="pin">' + esc(o.st) + '</span></span>' +
          '<span class="body"><span class="n">' + (o.real ? 'Ships from ' + esc(o.name) : 'Ships from a licensed ' + esc(stateName(o.st)) + ' retailer') + '</span>' +
          '<span class="d">' + (o.real ? esc(o.city) + ', ' + esc(o.st) + ' · in stock · 2 to 4 business days' : 'Assigned by AccelPay · 3 to 5 business days') + ' · items ' + money(cost) + '</span></span>' +
          '<span class="amt' + (fee ? '' : ' free') + '">' + (fee ? money(fee) : 'FREE') + '</span></label>';
      }).join('') + (ms.length > 5 ? '<div class="co-more">+ ' + (ms.length - 5) + ' more licensed retailers</div>' : '');
      $$('[data-method]', box).forEach(l => l.addEventListener('click', () => { state.method = l.getAttribute('data-method'); save(); renderAll(); }));
    }
    const z = $('#co-zip'); if (z && state.zip && document.activeElement !== z) z.value = state.zip;
    const st = $('#co-state'); if (st) st.value = state.st ? stateName(state.st) : '';
    const pay = $('#pay'); if (pay) pay.disabled = !state.items.length || !m;
  }

  function placeOrder(name) {
    const t = totals(); if (!t.method) return;
    const m = t.method;
    try { sessionStorage.setItem(B.key + '-order', JSON.stringify({ num: '#' + B.orderPrefix + String(Math.floor(1000 + Math.random() * 8999)), total: t.total, name: name || 'friend',
      m: { real: m.real, name: m.name, city: m.city, st: m.st, stName: stateName(m.st) } })); } catch (err) {}
    state.items = []; state.method = null; save();
    location.href = 'checkout.html?confirmed=1';
  }
  function wireCheckout() {
    const form = $('#co-form'); if (!form) return;
    const z = $('#co-zip');
    if (z) z.addEventListener('change', () => setZip(z.value));
    // Express buttons (Shopify mode): fill a sample contact and address, then continue.
    $$('[data-express]').forEach(b => b.addEventListener('click', function () {
      if (!state.zip) setZip(B.quickZips[0][0]);
      const f = form.elements;
      if (f.email && !f.email.value) f.email.value = 'demo@example.com';
      if (f.firstName && !f.firstName.value) f.firstName.value = 'Sam';
      if (f.lastName && !f.lastName.value) f.lastName.value = 'Rivera';
      if (f.address1 && !f.address1.value) f.address1.value = '100 Main St';
      if (f.city && !f.city.value) f.city.value = 'Demo City';
      toast('Express checkout filled your contact and address. Check the shipping method, then pay.');
      const mt = $('#methods'); if (mt) mt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    form.addEventListener('submit', function (e) { e.preventDefault(); placeOrder(form.firstName.value); });
  }

  // ---------------------------------------------------------------- boot
  function renderAll() { renderHeader(); renderProduct(); renderBand(); renderCards(); renderDrawer(); renderCheckout(); }
  function ageGate() {
    const g = $('#agegate'); if (!g) return;
    let ok = false; try { ok = sessionStorage.getItem(B.key + '-age') === '1'; } catch (e) {}
    if (ok) { g.remove(); return; }
    g.hidden = false; document.body.style.overflow = 'hidden';
    $('#age-yes').addEventListener('click', () => { try { sessionStorage.setItem(B.key + '-age', '1'); } catch (e) {} g.remove(); document.body.style.overflow = ''; });
    $('#age-no').addEventListener('click', () => { g.querySelector('.ag-q').textContent = 'Come back when you are of legal drinking age.'; });
  }
  function howPanel() {
    const open = () => { $('#how-panel').classList.add('on'); $('#how-scrim').classList.add('on'); };
    const close = () => { $('#how-panel').classList.remove('on'); $('#how-scrim').classList.remove('on'); };
    $$('#how-open, [data-how-open]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(); }));
    const c = $('#how-close'); if (c) c.addEventListener('click', close);
    const s = $('#how-scrim'); if (s) s.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    const hs = $('#how-section'); if (hs && window.HOW_HTML) hs.innerHTML = window.HOW_HTML;
  }
  function boot() {
    ageGate(); howPanel();
    $$('[data-cart-toggle]').forEach(b => b.addEventListener('click', () => { const d = $('#drawer'); d && d.classList.contains('on') ? closeDrawer() : openDrawer(); }));
    const x = $('#drawer-close'); if (x) x.addEventListener('click', closeDrawer);
    const s = $('#scrim'); if (s) s.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
    const burger = $('#burger'); if (burger) burger.addEventListener('click', () => $('nav.main').classList.toggle('open'));
    $$('[data-add-sku]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); addToCart(b.getAttribute('data-add-sku'), 1); }));
    wireZip(document.querySelector('.dband') || document.createElement('div'));
    wireCheckout();
    renderAll();
  }
  window.APDemo = { catalog: CATALOG, data: DATA, setZip: setZip, addToCart: addToCart, methods: methods, totals: totals };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
