import os
import subprocess
import sys
from policies import sales_window_days, support_window_days
assert sales_window_days() == 30
assert support_window_days() == 30
child = subprocess.run([sys.executable, '-B', 'demo.py'], env={**os.environ, 'TOOL_API_MODE': 'local'}, capture_output=True, text=True, check=True)
assert child.stdout.strip() == 'sales=30 support=30'
print('PASS public policy outputs and local demo execution; documentation clarity and independent ownership require separate review')
