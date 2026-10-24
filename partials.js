/* Shared chrome (header, footer, cart drawer, age gate) injected into every page. Logos are the brand's own marks from redneckriviera.com. */
(function () {
  var CART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5.2 4l.4 2H21l-2.3 8.2a2 2 0 0 1-1.9 1.5H8.3a2 2 0 0 1-2-1.6L4.2 2H1V0h4.8z"/></svg>';
  var header =
    '<div class="topbar"><div class="in"><a href="index.html#tonight">Find us</a><span>United States</span></div></div>' +
    '<div class="promo-bar">Work Hard. Play Hard. Proudly supporting Folds of Honor.</div>' +
    '<header class="site"><div class="hdr">' +
      '<a class="brand" href="index.html" aria-label="Redneck Riviera Whiskey home"><img class="logo" src="assets/logo.svg" alt="Redneck Riviera" style="height:34px"></a>' +
      '<nav class="main"><a href="index.html#shop">Whiskey</a><a href="index.html#story">State of Mind</a><a href="index.html#tonight">Store Locator</a><a href="index.html#story">Recipes</a></nav>' +
      '<button class="burger" id="burger" aria-label="Menu">&#9776;</button>' +
      '<div class="hdr-actions">' +
        '<a class="zip-pill" href="index.html#tonight"><span>&#9906;</span><span data-zip-label>Set ZIP</span></a>' +
        '<button class="cart-pill" data-cart-toggle>' + CART + '<span class="lbl">Cart</span><span class="count" data-cart-count hidden>0</span></button>' +
      '</div>' +
    '</div></header>';
  var footer =
    '<footer class="site"><div class="ft">' +
      '<div><img src="assets/slogan.png" alt="America\'s Work Hard Play Hard brand" style="max-width:260px"></div><div><h4>Whiskey</h4><ul><li><a href="product.html?sku=american-blended">American Blended</a></li><li><a href="product.html?sku=honey-apple">Honey Apple</a></li><li><a href="product.html?sku=granny-rich">Granny Rich Reserve</a></li></ul></div><div><h4>Gifts</h4><ul><li><a href="product.html?sku=signed-bottle">Hand-Signed Bottle</a></li><li><a href="product.html?sku=good-times-kit">Good Times Kit</a></li><li><a href="product.html?sku=patriotic-pack">Patriotic Pack</a></li></ul></div><div><h4>Info</h4><ul><li><a href="index.html#tonight">Find our whiskey</a></li><li><a href="index.html#how">How this works</a></li></ul></div>' +
    '</div>' +
    '<div class="legal-row">Private sales demo by AccelPay. Not affiliated with or endorsed by Redneck Riviera; its marks belong to their owner. Gopuff, DoorDash, Shopify and ReserveBar marks belong to their owners. No real orders are placed. Please drink responsibly. 21+ only.' +
      '<br><span class="powered">Cart and checkout by AccelPay · Orders fulfilled by licensed retailers</span></div>' +
    '</footer>';
  var HOW = "<h3>How this works</h3><p class=\"hw-lede\">AccelPay&#x27;s white-label cart runs on Redneck Riviera&#x27;s own site and handles the parts that make alcohol hard to sell online.</p><ol class=\"hw-list\"><li><strong>Your site, your checkout.</strong> The AccelPay cart and checkout run on redneckriviera.com in your branding, in place of the current buy button, so shoppers never leave your site. It loads through a script tag and a CNAME record.</li><li><strong>Payments, taxes and retailer routing by AccelPay.</strong> AccelPay handles payments and taxes, and routes each order to a licensed retailer in the buyer&#x27;s state, picked by ZIP code.</li><li><strong>You own the customer.</strong> Redneck Riviera owns the customer data from every order.</li><li><strong>Reach.</strong> 3,500+ licensed retail locations across 40+ states, plus instant delivery in about 30 minutes through Gopuff where it stocks the brand, and DoorDash from local retailers. Launch in about one week.</li><li><strong>Reordering.</strong> Reordering is built in. We track depletions at each retailer and flag reorders with suggested POs when stock runs low. For brands distributed by Southern Glazer&#x27;s, we&#x27;re setting up a pilot to send those reorders straight into Proof.</li><li><strong>ReserveBar.com.</strong> Every brand gets a ReserveBar.com listing. Brands that switch their white-label store to our plugins (the AccelPay or LiquidCommerce cart, or our native Shopify integration) automatically receive advertising credit on ReserveBar.com and Minibar.</li></ol>";
  window.HOW_HTML = HOW;
  var drawer =
    '<div class="scrim" id="scrim"></div>' +
    '<aside class="drawer" id="drawer" aria-label="Shopping cart"><header><h2>Your cart</h2><button class="x" id="drawer-close" aria-label="Close cart">&times;</button></header>' +
    '<div class="items" id="drawer-items"></div><div class="foot" id="drawer-foot"></div></aside>' +
    '<div class="toast" id="toast" role="status"></div>' +
    '<div class="ribbon">Demo · AccelPay cart <button id="how-open">How this works</button></div>' +
    '<div class="how-scrim" id="how-scrim"></div><aside class="how-panel" id="how-panel" aria-label="How this works"><button class="x" id="how-close" aria-label="Close">&times;</button>' + HOW + '</aside>';
  var gate = '<div id="agegate" hidden><div class="ag-card"><div class="ic"><img src="assets/logo-star.webp" alt="Redneck Riviera Whiskey" style="height:150px;margin:0 auto"></div><h2>Redneck Riviera</h2><p class="ag-q">Are you 21 or older?</p><div class="ag-btns"><button class="btn sm" id="age-yes">Yes</button><button class="btn ghost sm" id="age-no">No</button></div><p class="ag-sip" style="font-size:.7rem;letter-spacing:.06em">Private sales demo by AccelPay</p></div></div>';
  var h = document.getElementById('site-header'); if (h) h.outerHTML = header;
  var f = document.getElementById('site-footer'); if (f) f.outerHTML = footer;
  document.body.insertAdjacentHTML('beforeend', drawer + (document.body.hasAttribute('data-no-gate') ? '' : gate));
})();
