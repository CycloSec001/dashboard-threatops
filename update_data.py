import os
import re

mock_data_path = r'c:\Users\pooji\OneDrive\Desktop\DC\htb-react-dashboard\src\utils\mockData.js'

with open(mock_data_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r"export function getThreatSources\(timeRange\) \{\n  const count =.*?\n  return IPS_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    lastSeen: minutesAgo\(i \* 7 \+ 2\),\n  \}\)\)\n\}",
     "export function getThreatSources(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...IPS_POOL[i % IPS_POOL.length],\n    lastSeen: minutesAgo(i * 7 + 2),\n  }))\n}"),
     
    (r"  const limit = Math\.min\(entries\.length, timeRange === 'Last 24 Hours' \? 4 : entries\.length\)\n  return entries\.slice\(0, limit\)",
     "  return Array.from({ length: 100 }, (_, i) => ({\n    ...entries[i % entries.length],\n    id: i + 1,\n    time: minutesAgo(i * 2 + 1),\n  }))"),
     
    (r"export function getVulnerableAssets\(timeRange\) \{\n  const count =.*?\n  return VULN_ASSETS_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    lastScanned: minutesAgo\(i \* 12 \+ 5\),\n  \}\)\)\n\}",
     "export function getVulnerableAssets(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...VULN_ASSETS_POOL[i % VULN_ASSETS_POOL.length],\n    lastScanned: minutesAgo(i * 12 + 5),\n  }))\n}"),
     
    (r"  const limit = Math\.min\(entries\.length, timeRange === 'Last 24 Hours' \? 3 : entries\.length\)\n  return entries\.slice\(0, limit\)",
     "  return Array.from({ length: 100 }, (_, i) => ({\n    ...entries[i % entries.length],\n    id: i + 1,\n  }))"),
     
    (r"export function getAssetsList\(timeRange\) \{\n  const count =.*?\n  return ASSETS_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    lastSeen: minutesAgo\(i \* 15 \+ 3\),\n  \}\)\)\n\}",
     "export function getAssetsList(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...ASSETS_POOL[i % ASSETS_POOL.length],\n    name: `${ASSETS_POOL[i % ASSETS_POOL.length].name}-${i}`,\n    lastSeen: minutesAgo(i * 15 + 3),\n  }))\n}"),
     
    (r"export function getComplianceIssues\(timeRange\) \{\n  const count =.*?\n  return COMPLIANCE_ISSUES_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    discovered: minutesAgo\(i \* 120 \+ 45\),\n  \}\)\)\n\}",
     "export function getComplianceIssues(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...COMPLIANCE_ISSUES_POOL[i % COMPLIANCE_ISSUES_POOL.length],\n    id: `ISS-${1000 + i}`,\n    discovered: minutesAgo(i * 120 + 45),\n  }))\n}"),
     
    (r"export function getRecentReports\(timeRange\) \{\n  const count =.*?\n  return RECENT_REPORTS_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    generatedAt: minutesAgo\(i \* 45 \+ 10\),\n  \}\)\)\n\}",
     "export function getRecentReports(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...RECENT_REPORTS_POOL[i % RECENT_REPORTS_POOL.length],\n    id: `REP-${1024 + i}`,\n    generatedAt: minutesAgo(i * 45 + 10),\n  }))\n}"),
     
    (r"export function getCloudEventsTable\(timeRange\) \{\n  const count =.*?\n  return CLOUD_EVENTS_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    time: minutesAgo\(i \* 35 \+ 10\),\n  \}\)\)\n\}",
     "export function getCloudEventsTable(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...CLOUD_EVENTS_POOL[i % CLOUD_EVENTS_POOL.length],\n    eventId: `EVT-${900 + i}`,\n    time: minutesAgo(i * 35 + 10),\n  }))\n}"),
     
    (r"export function getEndpointEventsTable\(timeRange\) \{\n  const count =.*?\n  return ENDPOINT_EVENTS_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    time: minutesAgo\(i \* 22 \+ 5\),\n  \}\)\)\n\}",
     "export function getEndpointEventsTable(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...ENDPOINT_EVENTS_POOL[i % ENDPOINT_EVENTS_POOL.length],\n    eventId: `EVT-${1000 + i}`,\n    time: minutesAgo(i * 22 + 5),\n  }))\n}"),
     
    (r"export function getNetworkEventsTable\(timeRange\) \{\n  const count =.*?\n  return NETWORK_EVENTS_POOL\.slice\(0, count\)\.map\(\(row, i\) => \(\{\n    \.\.\.row,\n    time: minutesAgo\(i \* 18 \+ 8\),\n  \}\)\)\n\}",
     "export function getNetworkEventsTable(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    ...NETWORK_EVENTS_POOL[i % NETWORK_EVENTS_POOL.length],\n    eventId: `NET-${5000 + i}`,\n    time: minutesAgo(i * 18 + 8),\n  }))\n}")
]

for old, new in replacements:
    content = re.sub(old, new, content, flags=re.DOTALL)

with open(mock_data_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("mockData.js updated")

# alertsData.js
alerts_path = r'c:\Users\pooji\OneDrive\Desktop\DC\htb-react-dashboard\src\utils\alertsData.js'
with open(alerts_path, 'r', encoding='utf-8') as f:
    acontent = f.read()

acontent = re.sub(
    r"export function getAlertsList\(timeRange\) \{\n  const count =.*?\n  return Array\.from\(\{ length: count \}, \(_, i\) => \(\{\n    id: `ALT-\$\{1000 \+ i\}`,\n    rule:     RULE_NAMES\[i % RULE_NAMES\.length\],(.*?)\}\)\)\n\}",
    r"export function getAlertsList(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    id: `ALT-${1000 + i}`,\n    rule:     RULE_NAMES[i % RULE_NAMES.length],\1}))\n}",
    acontent, flags=re.DOTALL
)

with open(alerts_path, 'w', encoding='utf-8') as f:
    f.write(acontent)
print("alertsData.js updated")

# incidentsData.js
incidents_path = r'c:\Users\pooji\OneDrive\Desktop\DC\htb-react-dashboard\src\utils\incidentsData.js'
with open(incidents_path, 'r', encoding='utf-8') as f:
    icontent = f.read()

icontent = re.sub(
    r"export function getIncidentsList\(timeRange\) \{\n  const count =.*?\n  return Array\.from\(\{ length: count \}, \(_, i\) => \(\{\n    id:             `EVT-\$\{3000 \+ i\}`,\n    eventTypeName:  EVENT_TYPES\[i % EVENT_TYPES\.length\],(.*?)\}\)\)\n\}",
    r"export function getIncidentsList(timeRange) {\n  return Array.from({ length: 100 }, (_, i) => ({\n    id:             `EVT-${3000 + i}`,\n    eventTypeName:  EVENT_TYPES[i % EVENT_TYPES.length],\1}))\n}",
    icontent, flags=re.DOTALL
)

with open(incidents_path, 'w', encoding='utf-8') as f:
    f.write(icontent)
print("incidentsData.js updated")
