import os
from policies import sales_window_days, support_window_days
if os.environ.get("TOOL_API_MODE") != "local":
    raise RuntimeError("set local mode; remote adapters are disabled in this fixture")
print(f"sales={sales_window_days()} support={support_window_days()}")
