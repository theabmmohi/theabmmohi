import { Octokit } from "@octokit/rest";
import { readFileSync, writeFileSync } from "fs";
const USERNAME = "theabmmohi";
const README_PATH = "./README.md";
const MIN_BYTES = 500;
const BADGE_MAP = {
  "JavaScript":   { label: "JavaScript",     color: "F7DF1E", logo: "javascript",  logoColor: "black" },
  "TypeScript":   { label: "TypeScript",     color: "3178C6", logo: "typescript",  logoColor: "white" },
  "Python":       { label: "Python",         color: "3776AB", logo: "python",      logoColor: "fff"   },
  "PHP":          { label: "PHP",            color: "777BB4", logo: "php",         logoColor: "white" },
  "HTML":         { label: "HTML5",          color: "E34F26", logo: "html5",       logoColor: "white" },
  "CSS":          { label: "CSS3",           color: "1572B6", logo: "css3",        logoColor: "white" },
  "Shell":        { label: "Shell",          color: "4EAA25", logo: "gnubash",     logoColor: "white" },
  "Java":         { label: "Java",           color: "ED8B00", logo: "openjdk",     logoColor: "white" },
  "C#":           { label: "C%23",           color: "239120", logo: "csharp",      logoColor: "white" },
  "C++":          { label: "C%2B%2B",        color: "00599C", logo: "cplusplus",   logoColor: "white" },
  "C":            { label: "C",              color: "A8B9CC", logo: "c",           logoColor: "black" },
  "Ruby":         { label: "Ruby",           color: "CC342D", logo: "ruby",        logoColor: "white" },
  "Go":           { label: "Go",             color: "00ADD8", logo: "go",          logoColor: "white" },
  "Rust":         { label: "Rust",           color: "000000", logo: "rust",        logoColor: "white" },
  "Kotlin":       { label: "Kotlin",         color: "7F52FF", logo: "kotlin",      logoColor: "white" },
  "Swift":        { label: "Swift",          color: "F05138", logo: "swift",       logoColor: "white" },
  "Dart":         { label: "Dart",           color: "0175C2", logo: "dart",        logoColor: "white" },
  "Dockerfile":   { label: "Docker",         color: "2496ED", logo: "docker",      logoColor: "white" },
  "Vue":          { label: "Vue.js",         color: "4FC08D", logo: "vuedotjs",    logoColor: "white" },
  "Vue.js":       { label: "Vue.js",         color: "4FC08D", logo: "vuedotjs",    logoColor: "white" },
  "Laravel":      { label: "Laravel",        color: "FF2D20", logo: "laravel",     logoColor: "white" },
  "React":        { label: "React",          color: "61DAFB", logo: "react",       logoColor: "black" },
  "Node.js":      { label: "Node.js",        color: "339933", logo: "nodedotjs",   logoColor: "white" },
  "Tailwind CSS": { label: "Tailwind CSS",   color: "06B6D4", logo: "tailwindcss", logoColor: "white" },
  "MySQL":        { label: "MySQL",          color: "4479A1", logo: "mysql",       logoColor: "white" },
  "MongoDB":      { label: "MongoDB",        color: "47A248", logo: "mongodb",     logoColor: "white" },
  "Firebase":     { label: "Firebase",       color: "FFCA28", logo: "firebase",    logoColor: "black" },
  "Flutter":      { label: "Flutter",        color: "02569B", logo: "flutter",     logoColor: "white" },
  "Express.js":   { label: "Express.js",     color: "000000", logo: "express",     logoColor: "white" },
  "PostgreSQL":   { label: "PostgreSQL",     color: "4169E1", logo: "postgresql",  logoColor: "white" },
  "Redis":        { label: "Redis",          color: "DC382D", logo: "redis",       logoColor: "white" },
};
function inferTechs(repo) {
  const text = [repo.name, repo.description || "", ...(repo.topics || [])].join(" ").toLowerCase();
  return [
    ["vue",      "Vue.js"],
    ["laravel",  "Laravel"],
    ["react",    "React"],
    ["node",     "Node.js"],
    ["tailwind", "Tailwind CSS"],
    ["mysql",    "MySQL"],
    ["mongo",    "MongoDB"],
    ["firebase", "Firebase"],
    ["flutter",  "Flutter"],
    ["express",  "Express.js"],
    ["postgres", "PostgreSQL"],
    ["redis",    "Redis"],
  ].filter(([kw]) => text.includes(kw)).map(([, tech]) => tech);
}
function buildBadges(techSet) {
  return [...techSet].map((tech) => {
    const cfg = BADGE_MAP[tech];
    if (!cfg) return null;
    const label = cfg.label.replace(/ /g, "%20");
    const url = `https://img.shields.io/badge/${label}-${cfg.color}?style=for-the-badge&logo=${cfg.logo}&logoColor=${cfg.logoColor}`;
    return `![${tech}](${url})`;
  }).filter(Boolean).join("\n");
}
function injectBadges(readme, badges) {
  const START = "<!-- TECH-STACK:START -->";
  const END   = "<!-- TECH-STACK:END -->";
  const block = `${START}\n<div align="center">\n\n${badges}\n\n</div>\n${END}`;
  if (readme.includes(START) && readme.includes(END)) {
    return readme.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  }
  throw new Error("TECH-STACK markers not found in README.md");
}
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
console.log(`🔍 Fetching repos for @${USERNAME}...`);
const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
  username: USERNAME,
  per_page: 100,
  sort: "updated",
});
console.log(`📦 Found ${repos.length} repos`);
const techSet = new Set();
for (const repo of repos) {
  try {
    const { data: langs } = await octokit.rest.repos.listLanguages({
      owner: USERNAME,
      repo: repo.name,
    });
    for (const [lang, bytes] of Object.entries(langs)) {
      if (BADGE_MAP[lang] && bytes >= MIN_BYTES) techSet.add(lang);
    }
  } catch {}
  for (const t of inferTechs(repo)) techSet.add(t);
}
console.log(`🛠️  Detected: ${[...techSet].join(", ")}`);
const badges  = buildBadges(techSet);
const current = readFileSync(README_PATH, "utf8");
const updated = injectBadges(current, badges);
writeFileSync(README_PATH, updated, "utf8");
console.log("✅ README.md updated!");