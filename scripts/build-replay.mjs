/* One-off: turns the lab's real evidence file into assets/replay.json for the terminal replay.
   Usage: node scripts/build-replay.mjs <path to wazuh-alerts.json> */
import { readFile, writeFile } from 'node:fs/promises';

const rows = (await readFile(process.argv[2], 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

const alerts = rows.map((a) => ({
  t: a.timestamp.slice(11, 19),
  rule: a.rule.id,
  level: a.rule.level,
  desc: a.rule.description.replace(/^Identity Lab( Alert)?:\s*/, ''),
  mitre: a.rule.mitre?.id?.join(', ') ?? '',
  log: a.full_log?.startsWith('{') ? '' : a.full_log ?? '', // CloudTrail rows are huge JSON; event and user carry the point
  event: a.data?.aws?.eventName ?? '',
  user: a.data?.aws?.userIdentity?.userName ?? a.data?.aws?.requestParameters?.userName ?? '',
}));

await writeFile('assets/replay.json', JSON.stringify(alerts) + '\n');
console.log(alerts.length, 'alerts');
