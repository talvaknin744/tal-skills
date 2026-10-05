import csv


def export_accounts(connection, output):
    rows = connection.execute(
        "SELECT id, name, status FROM accounts WHERE status = 'active' ORDER BY id"
    )
    writer = csv.writer(output)
    writer.writerow(["id", "name", "status"])
    writer.writerows(rows)
