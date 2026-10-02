import csv
import sys


def summarize(filename):
    with open(filename, newline="", encoding="utf-8") as source:
        rows = list(csv.DictReader(source))
    completed = sum(row["status"] == "done" for row in rows)
    failed = sum(row["status"] == "failed" for row in rows)
    return f"Completed exports: {completed}\nFailed exports: {failed}"


if __name__ == "__main__":
    print(summarize(sys.argv[1]))
