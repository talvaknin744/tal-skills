# Netflix r03 new route counter scope

The generated new grounded feed route counter counts newly discovered routes that remain unattempted. Its query excludes a URL after a request begins, so that field does not establish cumulative discovery after those routes are fetched.

The companion JSON preserves the exact filter and a separately derived cumulative count from unique discovery event URLs. Final coverage should derive cumulative discovery from those preserved events, keep the generated historical values visible and label their actual scope. The running collector source remains unchanged.
