# Fulfillment decomposition

Catalog, Pricing, and Checkout are separately deployed applications maintained by three teams. Catalog owns product descriptions. Pricing sets regional offers. Checkout accepts a quoted total and creates the order. All three directly write product_offer rows in one database. Changing the meaning of discount_rate requires simultaneous updates to all three applications, and the deployment runbook always releases Catalog, then Pricing, then Checkout within a two-minute maintenance window.

Checkout synchronously calls Catalog, then Pricing, then Catalog again for each order. A Catalog timeout fails checkout even when the buyer already holds a valid, unexpired quote. The quote contains product identifiers, quantities, price, currency, and expiry. The product requirement says a valid quote must be honored; description updates need not block checkout. Teams would like independent releases, but have not agreed which team owns the quote or product_offer writes.
