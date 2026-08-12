"""
Final patch for Dashboardmodule.tsx to completely remove 'alerts' logic.
"""
import re, os

BASE = r'c:\Users\DITEL\Desktop\Sandeep\Project\laptop-rental-sales-system\src\components'
p = os.path.join(BASE, 'dashboard', 'Dashboardmodule.tsx')

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()
def write(p, txt):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(txt)

t = read(p)

# 1. Remove AlertsTab component
t = re.sub(r'/\* ─+ \*/\s*/\* ALERTS TAB \*/\s*/\* ─+ \*/\nfunction AlertsTab\(\{ data, loading, onNavigate \}: any\) \{.*?\}\n', '', t, flags=re.DOTALL|re.IGNORECASE)

# 2. In TABS config, remove the alerts tab definition
t = re.sub(r'\s*\{\s*id:\s*"alerts",\s*label:\s*"Alerts",\s*icon:\s*AlertTriangle\s*\},?', '', t, flags=re.DOTALL)

# 3. Inside DashboardModule `alerts` array block
t = re.sub(r'\s*// Rental alerts\n\s*const today = new Date\(\);.*?\n\s*const alerts = rentals\n.*?\.sort\(\(a, b\) => a\.days - b\.days\);\n', '\n  const alerts: any[] = [];\n', t, flags=re.DOTALL)

# 4. Remove OverviewTab alert rendering (the whole <Card> for Rental Alerts)
t = re.sub(r'\s*\{/\* Rental alerts \*/\}\s*<Card>\s*<CardHeader title="Rental Alerts".*?</Card>\s*', '\n', t, flags=re.DOTALL)

# 5. DashboardModule - rendering the active tab
t = re.sub(r'\s*\{activeTab === "alerts" && <AlertsTab[^>]+/>\}', '', t, flags=re.DOTALL)

write(p, t)
print("  [OK] Dashboardmodule.tsx cleaned of alerts logic.")
