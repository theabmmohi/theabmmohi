import { Octokit } from "@octokit/rest"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"


const USERNAME     = "theabmmohi"
const OS_LINE      = "And 16"
const BIRTH_EPOCH  = 1246579200
const readme_PATH  = "./readme.md"
const SVG_PATHS    = ["./dark_mode.svg", "./light_mode.svg"]
const CACHE_PATH   = "./cache/commits.json"
const MIN_BYTES    = 500
const TOP_LANG_N   = 3


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
    ["vue", "Vue.js"], ["laravel", "Laravel"], ["react", "React"], ["node", "Node.js"],
    ["tailwind", "Tailwind CSS"], ["mysql", "MySQL"], ["mongo", "MongoDB"],
    ["firebase", "Firebase"], ["flutter", "Flutter"], ["express", "Express.js"],
    ["postgres", "PostgreSQL"], ["redis", "Redis"],
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

function formatUptime(sinceDate) {
  const now = new Date()
  let years  = now.getFullYear() - sinceDate.getFullYear()
  let months = now.getMonth() - sinceDate.getMonth()
  let days   = now.getDate() - sinceDate.getDate()
  if (days < 0) {
    months -= 1
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) { years -= 1; months += 12 }
  const y = years  === 1 ? "1 year"   : `${years} years`
  const m = months === 1 ? "1 month"  : `${months} months`
  const d = days   === 1 ? "1 day"    : `${days} days`
  return `${y}, ${m}, ${d}`
}

function formatNumber(n) {
  return n.toLocaleString("en-US")
}

function replaceStatValue(svg, label, newValue) {
  const re = new RegExp(
    `(<tspan fill="#[0-9a-fA-F]{6}">\\. ${label}: </tspan><tspan fill="#[0-9a-fA-F]{6}">)(\\.+)(</tspan><tspan fill="#[0-9a-fA-F]{6}">) ([^<]*)(</tspan>)`
  )
  const match = svg.match(re)
  if (!match) {
    console.warn(`⚠️  Could not find "${label}" line in SVG, skipping`)
    return svg
  }
  const [, prefix, dots, mid, oldValue, suffix] = match
  const targetWidth = dots.length + oldValue.length
  const newDotsLen  = Math.max(3, targetWidth - newValue.length)
  const newDots     = ".".repeat(newDotsLen)
  return svg.replace(re, `${prefix}${newDots}${mid} ${newValue}${suffix}`)
}

function updateSvg(svg, stats) {
  svg = replaceStatValue(svg, "OS",        stats.os)
  svg = replaceStatValue(svg, "Uptime",    stats.uptime)
  svg = replaceStatValue(svg, "Languages", stats.languages)
  svg = replaceStatValue(svg, "Repos",     String(stats.repos))
  svg = replaceStatValue(svg, "Stars",     String(stats.stars))
  svg = replaceStatValue(svg, "Commits",   formatNumber(stats.commits))
  svg = replaceStatValue(svg, "Followers", String(stats.followers))
  return svg
}

async function getTotalCommits(octokit, username, createdAt) {
  let cache = {}
  if (existsSync(CACHE_PATH)) {
    try { cache = JSON.parse(readFileSync(CACHE_PATH, "utf8")) } catch { cache = {} }
  }
  const startYear = createdAt.getFullYear()
  const thisYear  = new Date().getFullYear()
  let total = 0
  for (let year = startYear; year <= thisYear; year++) {
    if (year !== thisYear && cache[year] !== undefined) {
      total += cache[year]
      continue
    }
    const from = new Date(Date.UTC(year, 0, 1)).toISOString()
    const to   = new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()
    try {
      const result = await octokit.graphql(
        `query($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              totalCommitContributions
              restrictedContributionsCount
            }
          }
        }`,
        { login: username, from, to }
      )
      const c = result.user.contributionsCollection
      const yearCommits = c.totalCommitContributions + c.restrictedContributionsCount
      cache[year] = yearCommits
      total += yearCommits
    } catch (err) {
      console.warn(`⚠️  Failed to fetch commits for ${year}:`, err.message)
    }
  }
  mkdirSync("./cache", { recursive: true })
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
  return total
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

console.log(`🔍 Fetching profile for @${USERNAME}...`)
const { data: user } = await octokit.rest.users.getByUsername({ username: USERNAME })
const createdAt = new Date(user.created_at)

console.log(`🔍 Fetching repos for @${USERNAME}...`)
const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
  username: USERNAME,
  per_page: 100,
  sort: "updated",
})
console.log(`📦 Found ${repos.length} repos`)

const ownRepos = repos.filter((r) => !r.fork)
const totalStars = ownRepos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

const techSet   = new Set()
const langBytes = {}
for (const repo of repos) {
  try {
    const { data: langs } = await octokit.rest.repos.listLanguages({
      owner: USERNAME,
      repo: repo.name,
    })
    for (const [lang, bytes] of Object.entries(langs)) {
      langBytes[lang] = (langBytes[lang] || 0) + bytes
      if (BADGE_MAP[lang] && bytes >= MIN_BYTES) techSet.add(lang)
    }
  } catch {}
  for (const t of inferTechs(repo)) techSet.add(t)
}
console.log(`🛠️  Detected: ${[...techSet].join(", ")}`)

const topLanguages = Object.entries(langBytes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, TOP_LANG_N)
  .map(([lang]) => (BADGE_MAP[lang]?.label ?? lang))
  .join(", ")

console.log(`🔢 Counting commits (this can take a bit the first run)...`)
const totalCommits = await getTotalCommits(octokit, USERNAME, createdAt)

const stats = {
  os:        OS_LINE,
  uptime:    formatUptime(new Date(BIRTH_EPOCH * 1000)),
  languages: topLanguages,
  repos:     ownRepos.length,
  stars:     totalStars,
  commits:   totalCommits,
  followers: user.followers,
}
console.log("📊 Stats:", stats)

const badges  = buildBadges(techSet)
const current = readFileSync(readme_PATH, "utf8")
writeFileSync(readme_PATH, injectBadges(current, badges), "utf8")
console.log("✅ readme.md updated!")

for (const path of SVG_PATHS) {
  const svg = readFileSync(path, "utf8")
  writeFileSync(path, updateSvg(svg, stats), "utf8")
  console.log(`✅ ${path} updated!`)
}