import { Octokit } from "@octokit/rest"
import { readFileSync, writeFileSync } from "fs"
const USERNAME = "theabmmohi"
const readme_PATH = "./readme.md"
const MIN_BYTES = 500
const BADGE_MAP = {
  "JavaScript":   { label: "JavaScript",     color: "F7DF1E" },
  "TypeScript":   { label: "TypeScript",     color: "3178C6" },
  "Python":       { label: "Python",         color: "3776AB" },
  "PHP":          { label: "PHP",            color: "777BB4" },
  "HTML":         { label: "HTML5",          color: "E34F26" },
  "CSS":          { label: "CSS3",           color: "1572B6" },
  "Shell":        { label: "Shell",          color: "4EAA25" },
  "Java":         { label: "Java",           color: "ED8B00" },
  "C#":           { label: "C%23",           color: "239120" },
  "C++":          { label: "C%2B%2B",        color: "00599C" },
  "C":            { label: "C",              color: "A8B9CC" },
  "Ruby":         { label: "Ruby",           color: "CC342D" },
  "Go":           { label: "Go",             color: "00ADD8" },
  "Rust":         { label: "Rust",           color: "000000" },
  "Kotlin":       { label: "Kotlin",         color: "7F52FF" },
  "Swift":        { label: "Swift",          color: "F05138" },
  "Dart":         { label: "Dart",           color: "0175C2" },
  "Dockerfile":   { label: "Docker",         color: "2496ED" },
  "Vue":          { label: "Vue.js",         color: "4FC08D" },
  "Vue.js":       { label: "Vue.js",         color: "4FC08D" },
  "Laravel":      { label: "Laravel",        color: "FF2D20" },
  "React":        { label: "React",          color: "61DAFB" },
  "Node.js":      { label: "Node.js",        color: "339933" },
  "Tailwind CSS": { label: "Tailwind CSS",   color: "06B6D4" },
  "MySQL":        { label: "MySQL",          color: "4479A1" },
  "MongoDB":      { label: "MongoDB",        color: "47A248" },
  "Firebase":     { label: "Firebase",       color: "FFCA28" },
  "Flutter":      { label: "Flutter",        color: "02569B" },
  "Express.js":   { label: "Express.js",     color: "000000" },
  "PostgreSQL":   { label: "PostgreSQL",     color: "4169E1" },
  "Redis":        { label: "Redis",          color: "DC382D" },
}
function inferTechs(repo) {
  const text = [repo.name, repo.description || "", ...(repo.topics || [])].join(" ").toLowerCase()
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
  ].filter(([kw]) => text.includes(kw)).map(([, tech]) => tech)
}
function buildBadges(techSet) {
  return [...techSet].map((tech) => {
    const cfg = BADGE_MAP[tech]
    if (!cfg) return null
    const label = cfg.label.replace(/ /g, "%20")
    const url = `https://img.shields.io/badge/${label}-${cfg.color}?style=for-the-badge`
    return `<img src="${url}" alt="${tech}"/>`
  }).filter(Boolean).join("\n")
}
function injectBadges(readme, badges) {
  const START = "<!-- TECH-STACK:START -->"
  const END   = "<!-- TECH-STACK:END -->"
  const block = `${START}\n<div align="center">\n\n${badges}\n\n</div>\n${END}`
  if (readme.includes(START) && readme.includes(END)) {
    return readme.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block)
  }
  throw new Error("TECH-STACK markers not found in readme.md")
}
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
console.log(`🔍 Fetching repos for @${USERNAME}...`)
const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
  username: USERNAME,
  per_page: 100,
  sort: "updated",
})
console.log(`📦 Found ${repos.length} repos`)
const techSet = new Set()
for (const repo of repos) {
  try {
    const { data: langs } = await octokit.rest.repos.listLanguages({
      owner: USERNAME,
      repo: repo.name,
    })
    for (const [lang, bytes] of Object.entries(langs)) {
      if (BADGE_MAP[lang] && bytes >= MIN_BYTES) techSet.add(lang)
    }
  } catch {}
  for (const t of inferTechs(repo)) techSet.add(t)
}
console.log(`🛠️  Detected: ${[...techSet].join(", ")}`)
const badges  = buildBadges(techSet)
const current = readFileSync(readme_PATH, "utf8")
const updated = injectBadges(current, badges)
writeFileSync(readme_PATH, updated, "utf8")
console.log("✅ readme.md updated!")