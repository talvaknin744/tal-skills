# Carrier quote integration

The checkout client currently accepts a `QuoteProvider` with this contract:

```python
quote(parcel) -> Quote(total_cents: int, currency: str)
```

`parcel.weight_grams` is an integer. An unsupported route raises
`RouteUnavailable`; a provider timeout raises `QuoteTimeout`. Checkout uses
these two exceptions differently: an unsupported route hides the shipping
option, while a timeout shows a retry action. A successful quote contains the
full charge including surcharges. Quoting does not buy a shipping label.

The existing Atlas implementation honors this contract. A new Boreal SDK offers:

```python
fetch_price(weight_kg, destination) -> Price(base_cents, surcharge_cents, currency)
```

Boreal expects a decimal number of kilograms. Its documented `NoRoute` and
`Timeout` exceptions have the meanings above. Every SDK instance binds one
account and a signing key at construction and can safely serve concurrent
requests for that account. Each checkout request carries an account identity.

Both SDKs are currently constructed in several checkout code paths. A proposed
`BorealDecorator` renames `fetch_price` to `quote`, passes `weight_grams` unchanged,
returns `base_cents` as the total, and catches both exceptions as `RouteUnavailable`.

The same proposal adds `UniversalProviderFactory`, containing one process-wide
provider whose mutable `account` and `signing_key` fields are overwritten before
each quote. The author calls this an Abstract Factory because it creates provider
objects and wants to add subclasses for every account. Only quote providers are
required; there are no related product families or existing creator hierarchy.
Traffic for different accounts can overlap. SDK construction choices should be
centralized, but credentials and the public quote contract must be preserved.

This is a design proposal with no implementation or benchmark results yet.
