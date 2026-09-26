# Maintenance scheduling product

Three engineers maintain a server-rendered application and one relational database. Two hundred businesses use it to schedule roughly 5,000 appointments a day. The team has four weeks to add recurring appointments, reminder emails, and an audit history of appointment changes. Monthly infrastructure spend must stay under $500. Business hours availability is sufficient. The current application has customer, appointment, and billing modules deployed together. A managed queue is available within the budget, but nobody on the team operates Kubernetes. The team wants independent code ownership for reminders without adding a separate deployment unless there is a demonstrated need.

Email delivery can take up to ten minutes. Recurrences must respect the business's local timezone, including daylight-saving changes. Staff may cancel one occurrence without deleting the whole series. The new feature must be released behind a per-business flag.
