"""
Patch missed due-date / overdue logic in the frontend.
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

# ── 1. demo/DemoDashboard.tsx ────────────────────────────────────────────
p = os.path.join(BASE, 'demo', 'DemoDashboard.tsx')
t = read(p)

t = re.sub(r'sub=\{`\$\{stats\.overdue\} overdue`\} subColor=\{stats\.overdue > 0 \? "down" : "up"\}', 'sub="Active" subColor="neutral"', t)

# Overdue quick view
t = re.sub(r'\s*\{stats\.overdue > 0 && \([^)]*\)\}\s*', '\n', t, flags=re.DOTALL)
# Quick view table block
t = re.sub(r'\s*\{\/\*(.*?)\*\/\}\s*', '\n', t)
t = re.sub(r'right=\{overdue\.length > 0 \? .*?\}\s*\)\}', '\n', t, flags=re.DOTALL)
t = re.sub(r'\{overdue\.length === 0 \? \([^)]*\) : overdue\.map[^\n]+\n', '\n', t, flags=re.DOTALL)
t = re.sub(r'\s*<CardHeader[^>]*title="Overdue demos"[^/]*/>\s*', '\n', t, flags=re.DOTALL)
t = re.sub(r'\s*\{overdue\.length > 0 && \(\s*<Card>\s*<CardHeader[^>]*title="Overdue demos"[^>]*>\s*<div[^>]*>.*?</div>\s*</Card>\s*\)\}', '', t, flags=re.DOTALL)
# Let's just do a simpler targeted removal for DemoDashboard if needed, but actually the entire card for Overdue demos is easier replaced.
# Better to use string replacement:
t = t.replace('sub={`${stats.overdue} overdue`} subColor={stats.overdue > 0 ? "down" : "up"}', 'sub="Active" subColor="neutral"')

write(p, t)

# ── 2. customers/CustomerDetail.tsx ──────────────────────────────────────
p = os.path.join(BASE, 'customers', 'CustomerDetail.tsx')
t = read(p)

# isOverdue chip logic
t = t.replace('  const isOverdue = diff !== null && diff < 0;\n', '')
t = t.replace('  const label = isOverdue ? `${Math.abs(diff)}d overdue` : diff === 0 ? "Due today" : `${diff}d left`;\n', '  const label = "";\n')
t = t.replace('      <Badge color={isOverdue ? "red" : diff !== null && diff <= 2 ? "amber" : "gray"}>{label}</Badge>\n', '')

# overdue count logic
t = re.sub(r'\s*const overdueCount = laptops\.filter\(l => \{[^}]+\}\)\.length;\n', '\n', t, flags=re.DOTALL)
t = t.replace('sub={`${overdueCount} overdue`}', 'sub="Active"')
t = t.replace('subColor={overdueCount > 0 ? "down" : "up"}', 'subColor="neutral"')

write(p, t)

# ── 3. customers/CustomerAlerts.tsx ──────────────────────────────────────
p = os.path.join(BASE, 'customers', 'CustomerAlerts.tsx')
t = read(p)

t = t.replace('  const [overdueRentals,  setOverdueRentals]  = useState<any[]>([]);\n', '')
t = re.sub(r'\s*const odList: any\[\] = \[\];\s*', '\n', t)
t = re.sub(r'\s*rentals\.forEach\(\(.*?\)\);\s*', '\n', t, flags=re.DOTALL)
t = t.replace('setOverdueRentals(odList);', '')

t = t.replace('const total = overdueRentals.length + unpaidInvoices.length;', 'const total = unpaidInvoices.length;')

t = re.sub(r'\s*\{overdueRentals\.length > 0 && \([^)]*\)\}\s*', '\n', t, flags=re.DOTALL)
# Fallback replace
t = re.sub(r'\s*\{overdueRentals\.length > 0 &&.*?</Card>\s*\)\}', '', t, flags=re.DOTALL)

write(p, t)

# ── 4. dashboard/Dashboardmodule.tsx ─────────────────────────────────────
p = os.path.join(BASE, 'dashboard', 'Dashboardmodule.tsx')
t = read(p)

# State
t = t.replace('overdue: 0,', '')
t = re.sub(r'\s*overdue:\s*ongoing\.filter\(.*\)\.length,\s*', '\n', t, flags=re.DOTALL)
t = re.sub(r'\s*overdue:\s*0,\s*', '\n', t)
t = re.sub(r'\s*const overdue = ongoing\.filter[^\n]+\n(?:[^\n]+\n)*?\s*\};\s*\)\);\s*', '\n', t)
t = re.sub(r'\s*const overdue = ongoing\.filter\(.*?return due < today;\s*\}\);\s*', '\n', t, flags=re.DOTALL)
t = re.sub(r'\s*const overdueCount = kpis\.overdue;\s*', '\n', t)
t = t.replace('const overdueCount = kpis.overdue || 0;', '')

t = t.replace('sub={kpis.overdue > 0 ? `${kpis.overdue} overdue` : "On track"} subUp={kpis.overdue === 0}', 'sub="On track" subUp={true}')
t = re.sub(r'\s*\{kpis\.overdue > 0 && \(.*?\)\}\s*', '\n', t, flags=re.DOTALL)

# Alert tabs
t = t.replace('{ label: "Overdue",          value: overdue.length, icon: AlertTriangle,color: "red"   },', '')
t = t.replace('{overdue.length > 0 && (', '{false && (')

t = re.sub(r'\s*const overdue\s*=\s*ongoing\.filter[^\n]+\n(?:[^\n]+\n)*?\s*\};\s*\)\);\s*', '\n', t)

# Simply replace 'overdueCount +' or set it to 0
t = t.replace('(overdueCount + alertCount)', '(alertCount)')

write(p, t)

print("\n[DONE] Secondary patches applied.")
