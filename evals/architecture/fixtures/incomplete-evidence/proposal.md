# Pricing service proposal

Move pricing calculations into a dedicated service. The document estimates faster checkout and easier scaling but supplies no measurements. Traffic volume, current latency percentiles, dependency topology, database query profiles, operational staffing, and service-level objectives have not yet been collected. The proposal names synchronous HTTP between checkout and pricing, with a 500 ms timeout. No fallback behavior is specified. No source code or load-test results accompany this document.
