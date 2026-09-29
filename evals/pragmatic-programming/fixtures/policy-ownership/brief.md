# Upcoming policy changes

The commerce team is extending the retail return window from 30 to 45 days.
The rule appears in the returns API, the shop's displayed policy, and a support
export. These three outputs must agree on the active retail policy. The commerce
team owns all three; publishing new copy with the API release is possible.

Human Resources separately owns an employee expense submission window, currently
30 days. HR is considering reducing it to 14 days next quarter. Retail returns
and employee reimbursement have different approvals and release schedules.

The current API rules are in policies.py. The shop template says "Returns within
30 days of delivery." A support-export job writes the literal 30 in its
return_window_days column. Neither is generated from policies.py today.

A reviewer proposed a shared generic function is_within_policy_window(age_days)
and a single POLICY_WINDOW_DAYS constant for both business processes because
their code currently matches. They also proposed manually changing the template
and export each time. We can add a small generated artifact or existing API field
if useful; adding a service or policy-engine dependency would delay this release.

This is a design review, not permission to change policy or deploy code. We need
the smallest correction to the proposed ownership and update path, plus a way to
show that later retail and HR changes stay independent.
