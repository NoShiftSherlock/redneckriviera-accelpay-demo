# Redneck Riviera Whiskey x AccelPay checkout (private sales demo)

**Private sales demo built by AccelPay for a conversation with Redneck Riviera Whiskey. It uses Redneck Riviera Whiskey's name, marks,
product photography and copy (from redneckriviera.com) to show their site with the AccelPay Shopify app.
It is not affiliated with or endorsed by Redneck Riviera Whiskey. Gopuff, DoorDash, Shopify and ReserveBar marks belong to their owners.
Please keep the link unlisted. No real orders are placed and no cards are charged.**

Live: https://noshiftsherlock.github.io/redneckriviera-accelpay-demo/

## Platform (checked 2026-10-24)

redneckriviera.com is WordPress (WPBakery, Slider Revolution). The whiskey page embeds the Bottle Nexus buy button; apparel is sold on a separate Shopify store (shop.redneckriviera.com) that has no whiskey.

## The pitch it shows

The AccelPay white-label cart runs on redneckriviera.com in place of the Bottle Nexus buy button. It handles payments, taxes and routing each order to a licensed retailer in the buyer's state, picked by ZIP. Redneck Riviera owns the customer data.

A "How this works" panel (ribbon, bottom left) and a home-page section carry the talking points, including:

> Reordering is built in. We track depletions at each retailer and flag reorders with suggested POs when stock runs low. For brands distributed by Southern Glazer's, we're setting up a pilot to send those reorders straight into Proof.

| Page | What it shows |
| --- | --- |
| `index.html` | Home, product range, ZIP check, How this works |
| `product.html?sku=<id>` | Product page with a "Delivery near you" ZIP block |
| cart drawer | Cart on every page with Shop Pay, Apple Pay and Google Pay buttons |
| `checkout.html` | Shopify one-page checkout: express checkout on top, shipping by licensed retailer per state, card payment, AccelPay callouts |

Try ZIP 91901 (Alpine CA: Liquor Geeks), 92126 (San Diego: Main Street Liquor), 37203 (Nashville: illustrative in-state route).

## What is real

- Products, copy, images and site prices: redneckriviera.com `/whiskey/` and its buy-button catalog on 2026-10-24.
- Retailers with Redneck Riviera in stock (see `data.js`), from their own inventory sheets: Liquor Geeks, Alpine CA (American Blended 16 at $21.99,
  Honey Apple 6 at $24.99) and Main Street Liquor, San Diego (Redneck Riviera Whiskey 3, Granny Rich Reserve 13).

Gopuff: checked live on gopuff.com on 2026-10-24 (per-location brand facet, 227 spirits-licensed locations, with a control brand in every
request). No Gopuff location lists Redneck Riviera Whiskey today, so the demo shows no instant-delivery option and says it switches on once Gopuff stocks the brand.

## Illustrative (not real)

- Main Street Liquor's sheet has no price, so its rows show the redneckriviera.com price.
- Shipping fee ($14.99), tax (8% estimate), shipping times, the card form and the thank-you page.
- Where no network retailer stocks a product in the buyer's state, the order routes to "a licensed <state> retailer", priced at redneckriviera.com's
  current price. A handful of states get no route in the demo.

## Deploying

GitHub Pages serves `main` at the repo root, so a push to `main` is a deploy. Asset URLs carry a `?v=` stamp; bump it when CSS or JS changes.
`app.js` is the shared demo engine; brand settings are in `brand.js`, products in `catalog.js`, retailer data in `data.js`.
