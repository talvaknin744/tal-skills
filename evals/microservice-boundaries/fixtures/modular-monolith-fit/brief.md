# Appointment product

Four engineers own one scheduling application. It serves 70 clinics, peaks at 18 requests per second, and deploys twice a week with a ten-minute pipeline. A booking transaction checks a clinician's availability, creates the appointment, and reserves a room in one PostgreSQL database. Clinics require appointments never to overlap. Billing exports run once nightly and may lag by a day. There is no measured contention or independently constrained deployment cadence.

The application has separate scheduling and billing modules, but both share a utility package. A proposal creates Appointment, Availability, Room, Patient, and Billing services, each with its own database. The stated benefit is that smaller services are easier to maintain; the four engineers would remain one on-call team. The next deliverable is recurring appointments in four weeks. No budget exists for a platform team or extra on-call rotation.
