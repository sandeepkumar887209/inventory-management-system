"""Patch all due-date references that couldn't be fixed via the editor (exact-match issues)."""
import re

# ── 1. rentals/serializers.py ──────────────────────────────────────────────
path = r'c:\Users\DITEL\Desktop\Sandeep\Project\config\apps\rentals\serializers.py'
with open(path, encoding='utf-8') as f:
    txt = f.read()
txt = txt.replace(
    '            "rental_id", "rental_status", "rental_date",\n            "expected_return_date", "actual_return_date",',
    '            "rental_id", "rental_status", "rental_date",\n            "actual_return_date",'
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(txt)
print("rentals/serializers.py patched")

# ── 2. demo/serializers.py ─────────────────────────────────────────────────
path = r'c:\Users\DITEL\Desktop\Sandeep\Project\config\apps\demo\serializers.py'
with open(path, encoding='utf-8') as f:
    txt = f.read()
txt = txt.replace(
    '            "demo_id", "demo_status", "assigned_date", "expected_return_date", "actual_return_date",',
    '            "demo_id", "demo_status", "assigned_date", "actual_return_date",'
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(txt)
print("demo/serializers.py patched")

# ── 3. customers/signals.py — remove expected_return_date from snapshots + notes ──
path = r'c:\Users\DITEL\Desktop\Sandeep\Project\config\apps\customers\signals.py'
with open(path, encoding='utf-8') as f:
    txt = f.read()
# Remove the snapshot_data lines with expected_return_date
txt = re.sub(r'\s*"expected_return_date":\s*_s\([^)]+\),\n', '\n', txt)
# Clean up note that says " · Due: {rental.expected_return_date}"
txt = txt.replace(
    '" + (f" · Due: {rental.expected_return_date}" if rental.expected_return_date else "")',
    '"'
)
txt = txt.replace(
    '" + (f" · Due: {demo.expected_return_date}" if demo.expected_return_date else "")',
    '"'
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(txt)
print("customers/signals.py patched")

# ── 4. backfill_customer_history.py ───────────────────────────────────────
path = r'c:\Users\DITEL\Desktop\Sandeep\Project\config\apps\customers\management\commands\backfill_customer_history.py'
with open(path, encoding='utf-8') as f:
    txt = f.read()
txt = txt.replace(
    'note=f"Rented: {rental_date}" + (f" \u00b7 Due: {rental.expected_return_date}" if rental.expected_return_date else "")',
    'note=f"Rented: {rental_date}"'
)
txt = txt.replace(
    'note=f"Assigned: {out_date}" + (f" \u00b7 Due: {demo.expected_return_date}" if demo.expected_return_date else "")',
    'note=f"Assigned: {out_date}"'
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(txt)
print("backfill_customer_history.py patched")

print("\nAll backend patches done.")
