class FakeDB:
    def commit(self):
        return "committed"

def apply(db, debit):
    debit()
    return db.commit()
