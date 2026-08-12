"""
Remove all due-date / overdue logic from frontend files.
Run from project root: python patch_frontend_due_dates.py
"""
import re, os

BASE = r'c:\Users\DITEL\Desktop\Sandeep\Project\laptop-rental-sales-system\src\components'

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

def write(p, txt):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(txt)
    print(f"  [OK] {os.path.basename(p)}")

# ── 1. rentals/CreateRental.tsx ───────────────────────────────────────────
p = os.path.join(BASE, 'rentals', 'CreateRental.tsx')
t = read(p)
t = t.replace(
    "        expected_return_date: new Date(Date.now() + 30 * 86_400_000).toISOString().split(\"T\")[0],\n",
    ""
)
write(p, t)

# ── 2. rentals/RentalAlerts.tsx — replace with placeholder ────────────────
p = os.path.join(BASE, 'rentals', 'RentalAlerts.tsx')
write(p, '''import React from "react";
import { C } from "./ui";

export function RentalAlerts({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0, marginBottom: "8px" }}>
        Rental Alerts
      </h1>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "24px" }}>
        Due-date tracking has been disabled.
      </p>
      <div
        style={{
          textAlign: "center", padding: "80px",
          background: "#fff", border: "1px solid #ebebeb",
          borderRadius: "14px", color: C.teal.text,
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
        <div style={{ fontWeight: 500, fontSize: "14px" }}>No alerts configured</div>
        <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
          Return dates are no longer tracked in this system.
        </div>
      </div>
    </div>
  );
}
''')

# ── 3. rentals/RentalDashboard.tsx ───────────────────────────────────────
p = os.path.join(BASE, 'rentals', 'RentalDashboard.tsx')
t = read(p)

# Remove overdue import
t = t.replace('  AlertTriangle, Clock,\n', '  Clock,\n')

# Remove overdue state
t = t.replace('  const [overdue,  setOverdue]  = useState([]);\n', '')

# Remove overdue computation block
t = re.sub(
    r'\n\s*const overdueList = ongoing\.filter\(\(r\)[^\n]*\{[^}]*\}\);',
    '',
    t
)
# Also handle multiline version
t = re.sub(
    r'\s*const overdueList = ongoing\.filter\(\(r\) =>\s*\{.*?return due < today;\s*\}\);',
    '',
    t,
    flags=re.DOTALL
)

# Remove setOverdue call
t = t.replace('      setOverdue(overdueList.slice(0, 3));\n', '')

# Remove overdue from stats
t = re.sub(r'\s*overdue:\s*overdueList\.length,\n', '\n', t)

# Clean KpiCard sub prop
t = t.replace(
    '          sub={`${stats.overdue} overdue`}\n          subColor={stats.overdue > 0 ? "down" : "up"}',
    '          sub="Active"\n          subColor="neutral"'
)

# Remove overdue alert bar block
t = re.sub(
    r'\s*\{/\* Overdue alert bar \*/\}\n\s*\{stats\.overdue > 0 &&.*?\}\s*\)\}\n',
    '\n',
    t,
    flags=re.DOTALL
)

# Remove overdue quick view block
t = re.sub(
    r'\s*\{/\* Overdue quick view \*/\}\n\s*\{overdue\.length > 0 &&.*?\}\s*\)\}\n',
    '\n',
    t,
    flags=re.DOTALL
)

write(p, t)

# ── 4. rentals/RentalDetail.tsx ──────────────────────────────────────────
p = os.path.join(BASE, 'rentals', 'RentalDetail.tsx')
t = read(p)

# Remove daysDiff from import
t = t.replace('  statusBadge, fmtDate, fmtINR, daysDiff, C,\n', '  statusBadge, fmtDate, fmtINR, C,\n')

# Remove dueIn / isOverdue vars
t = t.replace(
    '  const dueIn  = daysDiff(rental.expected_return_date);\n'
    '  const isOngoing  = rental.status === "ONGOING";\n'
    '  const isOverdue  = isOngoing && dueIn !== null && dueIn < 0;\n',
    '  const isOngoing  = rental.status === "ONGOING";\n'
)

# Replace status badges header (overdue/due-in logic)
t = t.replace(
    '            {isOverdue ? <Badge color="red">Overdue by {Math.abs(dueIn)}d</Badge> : statusBadge(rental.status)}\n'
    '            {isOngoing && !isOverdue && dueIn !== null && dueIn <= 7 && (\n'
    '              <Badge color="amber">Due in {dueIn}d</Badge>\n'
    '            )}',
    '            {statusBadge(rental.status)}'
)

# Remove "Expected return" row from summary
t = t.replace(
    '              ["Expected return\", fmtDate(rental.expected_return_date)],\n',
    ''
)
# Also try without escaping
t = t.replace(
    '              ["Expected return", fmtDate(rental.expected_return_date)],\n',
    ''
)

write(p, t)

# ── 5. rentals/RentalList.tsx ────────────────────────────────────────────
p = os.path.join(BASE, 'rentals', 'RentalList.tsx')
t = read(p)

# Remove daysDiff from import
t = t.replace('  statusBadge, Badge, Spinner, fmtDate, fmtINR, daysDiff, C,\n',
              '  statusBadge, Spinner, fmtDate, fmtINR,\n')

# Remove withOverdue block
t = re.sub(
    r'\s*/\* Overdue detection \*/\n\s*const withOverdue = rentals\.map\(\(r\) =>\s*\{.*?\}\);\n',
    '\n',
    t,
    flags=re.DOTALL
)

# Replace reference to withOverdue in filtered
t = t.replace('const filtered = withOverdue.filter', 'const filtered = rentals.filter')

# Remove _overdue override in filter
t = re.sub(r'\n\s*if \(filter === "ONGOING" && r\._overdue\) matchStatus = true;\n', '\n', t)

# Remove the "due" column definition
t = re.sub(
    r'\s*\{\n\s*key:\s*"due",\n.*?"Expected return",\n.*?\},\n\s*\},'
    ,
    ',',
    t,
    flags=re.DOTALL
)
# Also try single-quote version / alternative
t = re.sub(
    r',\s*\{\n\s*key:\s*"due",[^}]+\},\n\s*\},',
    ',',
    t,
    flags=re.DOTALL
)

# In status column remove _overdue badge
t = t.replace(
    "      render: (r) =>\n        r._overdue ? <Badge color=\"red\">Overdue</Badge> : statusBadge(r.status),",
    "      render: (r) => statusBadge(r.status),"
)

write(p, t)

# ── 6. rentals/ui.tsx — remove daysUntil, clean daysDiff, remove OVERDUE ─
p = os.path.join(BASE, 'rentals', 'ui.tsx')
t = read(p)

# Remove OVERDUE from statusBadge
t = t.replace('    OVERDUE:  { label: "Overdue",  color: "red"   },\n', '')

# Remove daysUntil helper entirely
t = re.sub(
    r'\nexport const daysUntil\s*=.*?\};\n',
    '\n',
    t,
    flags=re.DOTALL
)

write(p, t)

# ── 7. demo/CreateNewDemo.tsx ────────────────────────────────────────────
p = os.path.join(BASE, 'demo', 'CreateNewDemo.tsx')
t = read(p)

# Remove expected_return_date and duration_days form fields — find and remove
# Field: expected_return_date
for pat in [
    # label + input block for expected_return_date
    r'[^\n]*expected_return_date[^\n]*\n',
    r'[^\n]*Expected return date[^\n]*\n',
    r'[^\n]*Return by[^\n]*\n',
    r'[^\n]*duration_days[^\n]*\n',
    r'[^\n]*Duration[^\n]*\n',
]:
    t = re.sub(pat, '', t)

# Remove from API payload
t = re.sub(r'\s*expected_return_date:[^\n]+\n', '', t)
t = re.sub(r'\s*duration_days:[^\n]+\n', '', t)

write(p, t)

# ── 8. demo/DemoAlerts.tsx — replace with placeholder ────────────────────
p = os.path.join(BASE, 'demo', 'DemoAlerts.tsx')
write(p, '''import React from "react";
import { C } from "./ui";

export function DemoAlerts({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0, marginBottom: "8px" }}>
        Demo Alerts
      </h1>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "24px" }}>
        Due-date tracking has been disabled.
      </p>
      <div
        style={{
          textAlign: "center", padding: "80px",
          background: "#fff", border: "1px solid #ebebeb",
          borderRadius: "14px", color: C.teal.text,
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
        <div style={{ fontWeight: 500, fontSize: "14px" }}>No alerts configured</div>
        <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
          Return dates are no longer tracked in this system.
        </div>
      </div>
    </div>
  );
}
''')

# ── 9. demo/DemoDashboard.tsx ────────────────────────────────────────────
p = os.path.join(BASE, 'demo', 'DemoDashboard.tsx')
t = read(p)

# Remove daysDiff from import
t = t.replace(', daysDiff,', ',')

# Remove overdue state
t = t.replace('  const [overdue,  setOverdue]  = useState<any[]>([]);\n', '')

# Remove overdueList computation block
t = re.sub(
    r'\s*const overdueList = ongoing\.filter\(\(d: any\) =>\s*\{.*?return due < today;\s*\}\);\n',
    '\n',
    t,
    flags=re.DOTALL
)

# Remove overdue from convRate
t = t.replace('        { name: "Overdue",  value: overdueList.length },\n', '')

# Remove overdue from setStats call
t = re.sub(r' overdue: overdueList\.length,', '', t)

# Remove setOverdue call
t = t.replace('      setOverdue(overdueList.slice(0, 3));\n', '')

# Remove unused today var if only used for overdue
# (keep if still used elsewhere for trend)
# Remove overdue KpiCard
t = re.sub(r'\s*<KpiCard\s*\n[^>]*overdue[^/]*/>\s*\n', '\n', t, flags=re.DOTALL)
t = re.sub(r'\s*<KpiCard[^>]*label="Overdue"[^/]*/>\n', '\n', t)

# Remove overdue alert bar block
t = re.sub(
    r'\s*\{/\* Overdue[^*]+\*/\}?\n?\s*\{[^\n]*overdue[^\n]*\n[^}]+\}\s*\)\}\n',
    '\n',
    t,
    flags=re.DOTALL
)

write(p, t)

# ── 10. demo/DemoDetail.tsx ───────────────────────────────────────────────
p = os.path.join(BASE, 'demo', 'DemoDetail.tsx')
t = read(p)

# Remove daysDiff from import
t = t.replace(', daysDiff,', ',')
t = t.replace(' daysDiff,', '')

# Remove dueIn / isOverdue
t = t.replace(
    '  const dueIn     = daysDiff(demo.expected_return_date);\n'
    '  const isOngoing = demo.status === "ONGOING";\n'
    '  const isOverdue = isOngoing && dueIn !== null && dueIn < 0;\n',
    '  const isOngoing = demo.status === "ONGOING";\n'
)

# Replace overdue header badges
t = t.replace(
    '            {isOverdue ? <Badge color="red">Overdue by {Math.abs(dueIn!)}d</Badge> : statusBadge(demo.status)}\n'
    '            {isOngoing && !isOverdue && dueIn !== null && dueIn <= 3 && <Badge color="amber">Due in {dueIn}d</Badge>}\n',
    '            {statusBadge(demo.status)}\n'
)

# Remove expected_return_date rows in summary (search multiple patterns)
t = re.sub(r'\s*\["(Expected return|Return by|Due date)",[^\]]+\],\n', '', t)
t = re.sub(r'\s*\["Expected return date",[^\]]+\],\n', '', t)
t = re.sub(r'[^\n]*expected_return_date[^\n]*\n', '', t)

write(p, t)

# ── 11. demo/DemoList.tsx ────────────────────────────────────────────────
p = os.path.join(BASE, 'demo', 'DemoList.tsx')
t = read(p)

# Remove daysDiff, C from import
t = t.replace(', daysDiff, C,', ',')
t = t.replace(' daysDiff, C,', '')
t = t.replace(', daysDiff,', ',')

# Remove withOverdue block
t = re.sub(
    r'\s*const withOverdue = demos\.map\(\(d\) =>\s*\{.*?\}\);\n',
    '\n',
    t,
    flags=re.DOTALL
)

# Replace reference to withOverdue in filtered
t = t.replace('const filtered = withOverdue.filter', 'const filtered = demos.filter')

# Remove "due" column definition
t = re.sub(
    r'\s*\{\s*\n\s*key: "due", label: "Return due",\n.*?\},\s*\n',
    '\n',
    t,
    flags=re.DOTALL
)

# Status column — remove _overdue badge
t = t.replace(
    '      render: (d: any) => d._overdue ? <Badge color="red">Overdue</Badge> : statusBadge(d.status),',
    '      render: (d: any) => statusBadge(d.status),'
)

write(p, t)

# ── 12. demo/ui.tsx ──────────────────────────────────────────────────────
p = os.path.join(BASE, 'demo', 'ui.tsx')
t = read(p)
# Remove OVERDUE from statusBadge
t = t.replace('    OVERDUE:           { label: "Overdue",            color: "red"    },\n', '')
# Remove daysUntil/daysDiff helpers if present
t = re.sub(r'\nexport const daysUntil[^;]+;\n', '\n', t, flags=re.DOTALL)
write(p, t)

# ── 13. customers/CustomerDetail.tsx — snapshot chip removal ─────────────
p = os.path.join(BASE, 'customers', 'CustomerDetail.tsx')
t = read(p)

# Remove expected_return_date chip from snapshot strip
t = t.replace(
    "                      if (sd.expected_return_date)\n"
    "                        chips.push({ label: \"Due\",     value: fmtDate(sd.expected_return_date) });\n",
    ""
)

write(p, t)

print("\n[DONE] All frontend patches applied.")
