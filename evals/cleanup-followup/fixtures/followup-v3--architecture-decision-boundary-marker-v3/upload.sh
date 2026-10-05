#!/bin/sh
set -eu
python -m export_cli > /tmp/accounts.csv
upload_file /tmp/accounts.csv exports/accounts.csv
record_upload_time exports/accounts.csv
