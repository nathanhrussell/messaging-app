// scripts/todo_to_issues.mjs
// Usage:
//   node scripts/todo_to_issues.mjs [TODO.md] [--dry]
// Requires: GitHub CLI (`gh auth login`), Node 18+ (ESM)

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const file = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "TODO.md";
const DRY = process.argv.includes("--dry");

const md = readFileSync(file, "utf8");

// Simple parser tailored to your TODO.md structure:
// # Section N — Name
// ## N.M Subsection
// - [ ] tasks...
// **Milestones**
// - [ ] acceptance criteria...
const lines = md.split(/\r?\n/);

function sh(cmd, args) {
  if (DRY) {
    console.log("[dry-run] gh", cmd, ...(args || []));
    return { status: 0 };
  }
  const res = spawnSync("gh", [cmd, ...(args || [])], { stdio: "inherit" });
  return res;
}

const areaMap = new Map([
  [1, "area:tooling"],
  [2, "area:db"],
  [3, "area:auth"],
  [4, "area:users"],
  [5, "area:conversations"],
  [6, "area:messages"],
  [7, "area:realtime"],
  [8, "area:client"],
  [9, "area:security"],
  [10, "area:testing"],
  [11, "area:devops"],
]);

function ensureLabel(name, color = "808080", desc = "") {
  if (!name) return;
  sh("label", [
    "create",
    name,
    "--force",
    "--color",
    color,
    ...(desc ? ["--description", desc] : []),
  ]);
}

function ensureMilestone(title) {
  // idempotent-ish: create if missing
  // gh api doesn’t have a simple “ensure”, so we try create and ignore duplicate error.
  sh("api", [
    "repos/:owner/:repo/milestones",
    "-f",
    `title=${title}`,
    "-f",
    "state=open",
    "-X",
    "POST",
  ]);
}

function parse() {
  const sections = [];
  let currentSection = null;
  let currentSub = null;
  let inMilestones = false;

  const H1 = /^\s*#\s+Section\s+(\d+)\s+—\s+(.*)\s*$/;
  const H2 = /^\s*##\s+(\d+\.\d+)\s+(.*)\s*$/;
  const TASK_UNCHECKED = /^\s*[-*]\s+\[\s\]\s+(.+?)\s*$/;
  const TASK_CHECKED = /^\s*[-*]\s+\[x\]\s+(.+?)\s*$/i;
  const MILESTONES_HDR = /^\s*\*\*Milestones\*\*\s*$/i;

  for (const raw of lines) {
    const line = raw.trimRight();

    const h1 = line.match(H1);
    if (h1) {
      currentSection = {
        num: Number(h1[1]),
        title: h1[2].trim(),
        subs: [],
      };
      sections.push(currentSection);
      currentSub = null;
      inMilestones = false;
      continue;
    }

    const h2 = line.match(H2);
    if (h2 && currentSection) {
      currentSub = {
        key: h2[1],
        title: h2[2].trim(),
        tasks: [],
        milestones: [],
      };
      currentSection.subs.push(currentSub);
      inMilestones = false;
      continue;
    }

    if (MILESTONES_HDR.test(line)) {
      inMilestones = true;
      continue;
    }

    const mUnchecked = line.match(TASK_UNCHECKED);
    const mChecked = line.match(TASK_CHECKED);

    if ((mUnchecked || mChecked) && currentSub) {
      const text = (mUnchecked ? mUnchecked[1] : mChecked[1]).trim();
      const isChecked = Boolean(mChecked);
      if (inMilestones) {
        currentSub.milestones.push({ text, done: isChecked });
      } else {
        currentSub.tasks.push({ text, done: isChecked });
      }
    }
  }

  return sections;
}

const sections = parse();

// Labels you’ll get:
// - section:{N} (e.g., section:5)
// - area:* (derived from section number)
// - subsection:{N.M} (e.g., subsection:5.2)
for (const sec of sections) {
  ensureLabel(`section:${sec.num}`, "0e8a16", `Tasks for Section ${sec.num} — ${sec.title}`);
  const area = areaMap.get(sec.num);
  if (area) ensureLabel(area, "1d76db");
  for (const sub of sec.subs) {
    ensureLabel(`subsection:${sub.key}`, "5319e7", `Subsection ${sub.key} — ${sub.title}`);
  }
}

// Create milestones per subsection
for (const sec of sections) {
  for (const sub of sec.subs) {
    const milestoneTitle = `${sub.key} ${sub.title}`;
    ensureMilestone(milestoneTitle);
  }
}

// Create issues for unchecked tasks, attaching labels + milestone
let created = 0;
for (const sec of sections) {
  const area = areaMap.get(sec.num);
  for (const sub of sec.subs) {
    const milestoneTitle = `${sub.key} ${sub.title}`;
    const defnOfDone = sub.milestones.map((m) => `- [ ] ${m.text}`).join("\n");

    for (const t of sub.tasks.filter((x) => !x.done)) {
      const body = `**Section:** ${sec.num} — ${sec.title}
**Subsection:** ${sub.key} — ${sub.title}

### Task
- ${t.text}

### Definition of done (from TODO.md Milestones)
${defnOfDone || "- (none listed)"}

### Notes
- Follow repo house style (ESLint/Prettier/Airbnb; double quotes; semicolons; British English, no Oxford comma).
- Add or update tests where applicable.
`;

      const args = [
        "issue",
        "create",
        "--title",
        t.text,
        "--body",
        body,
        "--label",
        `section:${sec.num}`,
        "--label",
        `subsection:${sub.key}`,
      ];
      if (area) args.push("--label", area);
      args.push("--milestone", milestoneTitle);

      const res = sh(args[0], args.slice(1));
      if (res.status === 0) created++;
    }
  }
}

console.log(DRY ? "[dry-run] Complete." : `Created ${created} issues.`);
