from gateway import CarrierAudit


class ShippingQuote:
    def __init__(self):
        self.audit = CarrierAudit()

    def quote(self, subtotal_cents, member=False):
        fee = 399
        if subtotal_cents >= 5000:
            fee = 0
        elif member:
            fee = 199

        result = {
            "subtotal_cents": subtotal_cents,
            "shipping_cents": fee,
            "total_cents": subtotal_cents + fee,
        }
        self.audit.record(f"{subtotal_cents}|{int(member)}|{fee}")
        return result
