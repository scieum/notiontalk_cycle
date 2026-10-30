// 노션톡 챌린지 아카이브 빌드 스크립트
// content/ 폴더의 회차·실험 자료를 읽어 dist/에 정적 HTML을 만들어요.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { PHASES, kst, statusOf, timeText } from "./src/phase.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, "content");
const DIST = path.join(ROOT, "dist");
const VERSION = Date.now().toString(36);

const site = readJson(path.join(CONTENT, "site.json"));
const operators = Object.fromEntries(site.operators.map((o) => [o.id, o]));
const TRACKS = {
  notion: { label: "노션 챌린지", short: "노션" },
  vibe: { label: "바이브코딩 챌린지", short: "바이브코딩" },
};
const RESOURCE_TYPES = {
  replay: ["play", "다시보기"], slides: ["slides", "발표 자료"], template: ["template", "템플릿"], prompt: ["prompt", "프롬프트"],
  file: ["file", "파일"], link: ["link", "링크"], skill: ["wrench", "스킬"],
};

/* ── 아이콘: src/icons/*.svg (선 아이콘)를 HTML에 그대로 넣어요 ── */

const ICON_DIR = path.join(ROOT, "src", "icons");
const ICONS = Object.fromEntries(fs.readdirSync(ICON_DIR).filter((n) => n.endsWith(".svg"))
  .map((n) => [n.slice(0, -4), fs.readFileSync(path.join(ICON_DIR, n), "utf8").trim()]));
function ic(name, cls = "") {
  const svg = ICONS[name];
  if (!svg) throw new Error(`아이콘 "${name}"이 src/icons에 없어요`);
  return svg.replace("<svg ", `<svg class="ic${cls ? " " + cls : ""}" aria-hidden="true" focusable="false" `);
}
// 본문(마크다운)에 쓴 이모지 → 선 아이콘
const EMOJI_ICONS = {
  "🙋": "user-check", "🧰": "briefcase", "🚀": "rocket", "🔍": "search", "🔎": "search", "⚠": "alert",
  "🎯": "target", "💡": "bulb", "📋": "prompt", "📦": "package", "🧪": "flask", "🗺": "map", "📅": "calendar",
  "▶": "play", "📑": "slides", "🧩": "template", "📄": "file", "🔗": "link", "🛠": "wrench", "🔧": "wrench",
  "⬇": "download", "💬": "chat", "✉": "mail", "📡": "radio", "🏠": "home", "✨": "sparkles", "💛": "heart",
  "❤": "heart", "✅": "check", "✔": "check",
};
const EMOJI_RE = /(\p{Extended_Pictographic})\uFE0F?/gu;
// 제목 앞 이모지를 떼고 아이콘 이름을 돌려줘요
function splitIcon(title) {
  const m = title.match(/^\s*(\p{Extended_Pictographic})\uFE0F?\s*/u);
  if (!m) return [null, title.trim()];
  const name = EMOJI_ICONS[m[1]];
  if (!name) console.warn(`  ! 아이콘 없는 이모지 "${m[1]}" — EMOJI_ICONS에 추가하세요: ${title}`);
  return [name || null, title.slice(m[0].length).trim()];
}
// 본문 HTML 속 남은 이모지도 아이콘으로 (모르는 이모지는 지움). 복사할 프롬프트·코드(<pre>) 안은 그대로 둬요
const iconizeHtml = (html) => html.split(/(<pre[\s\S]*?<\/pre>)/).map((part) => part.startsWith("<pre")
  ? part : part.replace(EMOJI_RE, (_, e) => (EMOJI_ICONS[e] ? ic(EMOJI_ICONS[e], "ic-inline") : ""))).join("");

/* ── 읽기 ─────────────────────────────── */

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readEntries(kind) {
  const dir = path.join(CONTENT, kind);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => {
      const folder = path.join(dir, d.name);
      const meta = readJson(path.join(folder, "meta.json"));
      const mdFile = path.join(folder, "index.md");
      const body = fs.existsSync(mdFile) ? fs.readFileSync(mdFile, "utf8") : "";
      return { slug: d.name, folder, ...meta, body };
    })
    .filter((e) => !e.draft);
}

const cycles = readEntries("cycles").sort((a, b) => b.no - a.no);
const labs = readEntries("lab").sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.code.localeCompare(a.code));
const works = readEntries("work").sort((a, b) => (b.date || "").localeCompare(a.date || ""));

for (const c of cycles) {
  for (const key of ["announce", "live", "end"]) {
    if (!c.schedule?.[key]) throw new Error(`${c.slug}: schedule.${key}가 필요해요`);
  }
}
for (const l of labs) {
  if (!operators[l.author]) throw new Error(`${l.slug}: author "${l.author}"가 site.json operators에 없어요`);
}

/* ── 도우미 ───────────────────────────── */

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad2 = (n) => String(n).padStart(2, "0");

const fmt = (opts) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", ...opts });
const parts = (v, opts) => Object.fromEntries(fmt(opts).formatToParts(kst(v)).map((x) => [x.type, x.value]));
const fmtDate = (v) => { const p = parts(v, { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }); return `${p.year}.${p.month}.${p.day}(${p.weekday})`; };
const fmtShort = (v) => { const p = parts(v, { month: "numeric", day: "numeric", weekday: "short" }); return `${p.month}.${p.day}(${p.weekday})`; };
const fmtTime = (v) => timeText(kst(v));

const scheduleAttr = (s) =>
  `data-schedule='${esc(JSON.stringify({ announce: s.announce, live: s.live, end: s.end, review: s.review || null }))}'`;

function avatar(op, cls = "") {
  return `<span class="avatar avatar-${esc(op.id)} ${cls}" aria-hidden="true">${esc([...op.name][0])}</span>`;
}

const plain = (title) => title.replace(/^[^\p{L}\p{N}]+/u, "").replace(/\p{Extended_Pictographic}\uFE0F?/gu, "").trim();

/* ── 마크다운: 오디씨식 레시피 블록 ───────── */

marked.use({
  gfm: true,
  renderer: {
    code(code, info) {
      const [lang, ...rest] = (info || "").trim().split(/\s+/);
      if (lang === "prompt") {
        const label = rest.join(" ") || "프롬프트";
        return `<div class="mini-prompt"><h3>${ic("prompt")}${esc(label)}</h3><pre><code>${esc(code)}</code></pre><button type="button" class="btn btn-secondary btn-sm" data-copy><span class="copy-idle">${ic("copy")}복사</span><span class="copy-done">${ic("check")}복사됐어요</span></button></div>`;
      }
      if (lang === "tree") return `<pre class="tree">${esc(code)}</pre>`;
      return `<pre class="code"><code>${esc(code)}</code></pre>`;
    },
    list(body, ordered, start) {
      if (ordered) return `<ol class="steps"${start && start !== 1 ? ` start="${start}"` : ""}>${body}</ol>`;
      // 모든 항목이 ✔로 시작하면 점 없는 체크리스트로
      const items = body.match(/<li>/g) || [];
      const checks = body.match(/<li>(<p>)?\s*✔\uFE0F?/g) || [];
      if (!items.length || items.length !== checks.length) return `<ul>${body}</ul>`;
      return `<ul class="checks">${body.replace(/(<li>(?:<p>)?)\s*✔\uFE0F?\s*/g, `$1${ic("check", "ic-check")}`)}</ul>`;
    },
    blockquote(quote) {
      // "> 💡 …"는 팁, "> ⚠️ …"는 주의. 앞 이모지는 왼쪽 아이콘이 돼요
      const m = quote.match(/^\s*<p>\s*(\p{Extended_Pictographic})\uFE0F?\s*/u);
      const name = (m && EMOJI_ICONS[m[1]]) || "bulb";
      const body = m ? quote.replace(m[0], "<p>") : quote;
      return `<div class="note-box${name === "alert" ? " note-box--warn" : ""}">${ic(name, "note-ic")}<div>${body}</div></div>`;
    },
    table(header, body) {
      return `<div class="table-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    },
  },
});

// "## " 제목마다 섹션으로 나눠요. "자주 묻는" 섹션은 ### 질문을 아코디언으로 바꿔요.
function sections(md) {
  const chunks = md.split(/^## /m);
  const intro = chunks.shift().trim();
  const list = chunks.map((chunk, i) => {
    const nl = chunk.indexOf("\n");
    const title = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
    const body = nl < 0 ? "" : chunk.slice(nl + 1).trim();
    return { id: `s${i + 1}`, title, body };
  });
  return { intro, list };
}

function faqHtml(body) {
  const qs = body.split(/^### /m);
  const before = qs.shift().trim();
  return (before ? md(before) : "") + `<div class="faq">${qs.map((q) => {
    const nl = q.indexOf("\n");
    const summary = (nl < 0 ? q : q.slice(0, nl)).trim();
    const answer = nl < 0 ? "" : q.slice(nl + 1).trim();
    return `<details><summary>${esc(summary)}</summary><div class="answer">${md(answer)}</div></details>`;
  }).join("")}</div>`;
}

const md = (src) => iconizeHtml(marked.parse(src));

function sectionTitle(id, icon, text) {
  return `<h2 class="section-title" id="${id}">${icon ? `<span class="st-ic">${ic(icon)}</span>` : ""}${esc(text)}</h2>`;
}

function sectionHtml(s) {
  const isFaq = /자주 묻는|FAQ/i.test(s.title);
  const [icon, text] = splitIcon(s.title);
  return `<section class="section" id="${s.id}" aria-labelledby="${s.id}-t">
    ${sectionTitle(`${s.id}-t`, isFaq ? "help" : icon, text)}
    ${isFaq ? faqHtml(s.body) : md(s.body)}
  </section>`;
}

function jumpNav(items) {
  if (items.length < 2) return "";
  return `<nav class="jump" aria-label="바로 가기">${items.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join("")}</nav>`;
}

/* ── 썸네일 (4:5 SVG) ──────────────────── */

function blocks(x, y, color) {
  return [0, 1, 2].map((i) => `<rect x="${x}" y="${y + i * 26}" width="${[120, 92, 108][i]}" height="16" rx="4" fill="${color}" opacity="${[0.9, 0.55, 0.3][i]}"/>`).join("");
}

function cycleThumb(c) {
  const vibe = c.track === "vibe";
  return `<svg class="thumb-svg" viewBox="0 0 240 300" role="img" aria-label="${c.no}회차 ${esc(TRACKS[c.track]?.short || "")}">
    <rect width="240" height="300" fill="${vibe ? "#F9E4D2" : "#DCE8F8"}"/>
    <text x="22" y="44" class="t-label" fill="${vibe ? "#B4501A" : "#1F5BB8"}">${esc(TRACKS[c.track]?.label || "")}</text>
    <text x="16" y="196" class="t-num">${pad2(c.no)}</text>
    ${blocks(22, 222, vibe ? "#B4501A" : "#1F5BB8")}
  </svg>`;
}

function labThumb(l) {
  const n = (l.code.match(/\d+/) || ["0"])[0].replace(/^0+(?=\d)/, "");
  return `<svg class="thumb-svg" viewBox="0 0 240 300" role="img" aria-label="${esc(l.code)}">
    <rect width="240" height="300" fill="#FBF0C4"/>
    <text x="22" y="44" class="t-label" fill="#7A5A00">LAB NOTE</text>
    <text x="16" y="196" class="t-num">${esc(pad2(n))}</text>
    ${blocks(22, 222, "#7A5A00")}
  </svg>`;
}

const thumb = (e, kind) => e.thumb
  ? `<img class="thumb-img" src="/${kind}/${e.slug}/${esc(e.thumb)}" width="480" height="600" alt="" loading="lazy">`
  : kind === "cycles" ? cycleThumb(e) : labThumb(e);

/* ── 조각 ─────────────────────────────── */

function statusPill(schedule) {
  const st = statusOf(schedule);
  return `<span class="pill status-${st.tone}" data-status ${scheduleAttr(schedule)}>${esc(st.badge)}</span>`;
}

function cycleCard(c) {
  return `<a class="card row-card" href="/cycles/${c.slug}/">
    <span class="thumb">${thumb(c, "cycles")}</span>
    <span class="exp">CYCLE-${pad2(c.no)}</span>
    <span class="row-body">
      <span class="card-title">${esc(c.title)} ${statusPill(c.schedule)}</span>
      <span class="card-desc">${esc(c.summary)}</span>
      <span class="card-meta">라이브 ${fmtShort(c.schedule.live)} ${fmtTime(c.schedule.live)}</span>
    </span>
    <span class="go">자료 보기 ${ic("arrow-right")}</span>
  </a>`;
}

function labCard(l) {
  const op = operators[l.author];
  return `<a class="card row-card" href="/lab/${l.slug}/">
    <span class="thumb">${thumb(l, "lab")}</span>
    <span class="exp">${esc(l.code)}</span>
    <span class="row-body">
      <span class="card-title">${esc(l.title)}</span>
      <span class="card-desc">${esc(l.summary)}</span>
      <span class="card-meta">${avatar(op, "avatar-xs")}${esc(op.name)} · ${fmtDate(l.date)}</span>
    </span>
    <span class="go">노트 보기 ${ic("arrow-right")}</span>
  </a>`;
}

function workGrid() {
  const items = works.map((w) => `<li class="card work-card">
      ${w.video ? `<video class="work-media" src="/work/${w.slug}/${esc(w.video)}" ${w.poster ? `poster="/work/${w.slug}/${esc(w.poster)}"` : ""} autoplay muted loop playsinline controls preload="metadata" aria-label="${esc(w.title)}"></video>`
        : w.image ? `<img class="work-media" src="/work/${w.slug}/${esc(w.image)}" alt="${esc(w.title)}" loading="lazy">` : ""}
      <div class="work-text"><span class="card-title">${esc(w.title)}</span><span class="card-desc">${esc(w.summary || "")}</span>${w.by ? `<span class="card-meta">${esc(w.by)}</span>` : ""}</div>
    </li>`);
  while (items.length < 3) {
    items.push(`<li class="card work-card work-card--soon"><span class="work-media work-ph" aria-hidden="true">${ic("plus")}</span><div class="work-text"><span class="card-title">결과물 자리 <span class="soon">곧 공개</span></span><span class="card-desc">챌린지에 참여한 선생님의 결과물이 여기에 올라와요</span></div></li>`);
  }
  return `<ul class="work-grid">${items.join("")}</ul>`;
}

function familyGrid() {
  const fam = [
    ["home", "노션톡", "현직 선생님이 만드는 교사 생산성 가이드", site.links.notiontalk],
    ["radio", "라이브 챌린지", "회차별 주제 소개와 무료 라이브 신청", site.links.liveChallenges],
    ["mail", "뉴스레터", "새 챌린지 소식을 메일로 받아요", site.links.newsletter],
    ["chat", "커뮤니티", "1,600명이 넘는 선생님이 함께하는 공간", site.links.kakao],
  ];
  return `<div class="family-grid">${fam.map(([icon, title, desc, href]) => `<a class="card family-card" href="${esc(href)}" target="_blank" rel="noopener">
      <span class="fam-icon">${ic(icon)}</span>
      <span class="card-title">${esc(title)}</span>
      <span class="card-desc">${esc(desc)}</span>
      <span class="go">사이트 보기 ${ic("external")}</span>
    </a>`).join("")}</div>`;
}

function rowHead(title, sub, more) {
  return `<div class="row-head"><h2>${esc(title)}</h2><p>${esc(sub)}</p>${more ? `<a class="more" href="${more}">전체보기 ${ic("arrow-right")}</a>` : ""}</div>`;
}

function empty(text) {
  return `<div class="card empty">${esc(text)}</div>`;
}

/* ── 레이아웃 ─────────────────────────── */

const LOGO = `<span class="logo-mark" aria-hidden="true"></span><span class="logo-word">notiontalk</span><span class="logo-sub">challenge</span>`;

function layout({ title, description, body, path: pagePath, active, back, bodyClass = "" }) {
  const fullTitle = title ? `${title} | ${site.name}` : site.name;
  const desc = description || site.description;
  const nav = [["/cycles/", "cycle", "cycles"], ["/lab/", "lab", "lab"]]
    .map(([href, label, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`)
    .join('<span aria-hidden="true">·</span>');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(site.url + pagePath)}">
<meta property="og:locale" content="ko_KR">
<link rel="canonical" href="${esc(site.url + pagePath)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#faf8f3">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/assets/styles.css?v=${VERSION}">
<script type="module" src="/assets/app.js?v=${VERSION}"></script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="top">
  <a class="top-logo" href="/" aria-label="${esc(site.name)} 홈">${LOGO}</a>
  ${back ? `<a class="top-back" href="${back[0]}">${ic("arrow-left")}${esc(back[1])}</a>` : `<nav class="top-nav" aria-label="메뉴">${nav}</nav>`}
  <a class="top-ig" href="${esc(site.links.instagram)}" target="_blank" rel="noopener">${esc(site.links.instagramHandle)}</a>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <p class="foot-family"><a href="${esc(site.links.notiontalk)}" target="_blank" rel="noopener">노션톡 ${ic("external", "ic-sm")}</a> · <a href="${esc(site.links.liveChallenges)}" target="_blank" rel="noopener">라이브 챌린지 ${ic("external", "ic-sm")}</a> · <a href="${esc(site.links.kakao)}" target="_blank" rel="noopener">커뮤니티 ${ic("external", "ic-sm")}</a>${site.links.discord ? ` · <a href="${esc(site.links.discord)}" target="_blank" rel="noopener">디스코드 ${ic("external", "ic-sm")}</a>` : ""}</p>
  <p><strong>${esc(site.name)}</strong>배우고, 나누고, 함께 자라요.</p>
  <p class="foot-small">© ${new Date().getFullYear()} 노션톡</p>
</footer>
<div class="toast" role="status" aria-live="polite"></div>
</body>
</html>`;
}

/* ── 홈 ───────────────────────────────── */

const MARQUEE = ["노션 챌린지", "바이브코딩 챌린지", "2주에 한 주제", "배우고 나누고 함께 자라요"];

function homePage() {
  const letters = [..."notiontalk"].map((ch, i) => `<span class="lt" data-i="${i}">${ch}</span>`).join("");
  const mq = MARQUEE.map((t, i) => `<span>${esc(t)}</span><i class="mq-dot ${i % 2 ? "is-vibe" : "is-notion"}"></i>`).join("");
  return layout({
    title: "",
    path: "/",
    bodyClass: "is-home",
    body: `
<section class="hero" id="hero" aria-labelledby="hero-title">
  <h1 id="hero-title" class="sr-only">${esc(site.name)}: 노션톡 라이브 챌린지 자료실</h1>
  <div class="wordmark" id="wordmark" role="img" aria-label="notiontalk">${letters}</div>
  <p class="hero-hint" id="hint" aria-hidden="true"><span class="hint-text">커서로 글자를 휘저어 보세요</span>${ic("sparkles", "hint-ic")}</p>
</section>

<div class="marquee" role="note" aria-label="${esc(MARQUEE.join(", "))}">
  <div class="marquee-track" aria-hidden="true"><div class="marquee-group">${mq}</div></div>
</div>

<section class="preview">
  <div class="row" id="cycle">
    ${rowHead("cycle", "회차별 자료", "/cycles/")}
    ${cycles.slice(0, 3).map(cycleCard).join("") || empty("첫 회차를 준비하고 있어요.")}
  </div>
  <div class="row" id="lab">
    ${rowHead("lab", "운영진 실험 노트", "/lab/")}
    ${labs.slice(0, 3).map(labCard).join("") || empty("첫 실험 노트를 쓰고 있어요.")}
  </div>
  <div class="row" id="work">
    ${rowHead("work", "챌린지에서 나온 결과물")}
    ${workGrid()}
  </div>
  <div class="row" id="family">
    ${rowHead("notiontalk family", "노션톡에서 더 보기")}
    ${familyGrid()}
  </div>
</section>
<script src="/assets/hero.js?v=${VERSION}" defer></script>`,
  });
}

/* ── 목록 ─────────────────────────────── */

function listPage({ title, sub, lead, path: p, active, items }) {
  return layout({
    title, description: lead, path: p, active,
    body: `<section class="preview list-page"><div class="row">
      <div class="row-head row-head--page"><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
      <p class="list-lead">${esc(lead)}</p>
      ${items}
    </div></section>`,
  });
}

/* ── 회차 상세 ─────────────────────────── */

function flowList(c) {
  const st = statusOf(c.schedule);
  const s = c.schedule;
  const dates = [s.vote ? fmtShort(s.vote) : "", fmtShort(s.announce), `${fmtShort(s.live)} ${fmtTime(s.live)}`, `${fmtShort(s.live)} ~`, `~ ${fmtShort(s.end)}`];
  return `<ol class="flow" data-flow ${scheduleAttr(s)}>${PHASES.map((ph, i) => `
    <li class="flow-step${st.phase === i ? " is-now" : st.phase > i ? " is-past" : ""}" data-step="${i}">
      <span class="flow-num">${i + 1}</span>
      <span class="flow-text"><strong>${esc(ph.label)}</strong><span>${esc(ph.desc)}</span></span>
      <span class="flow-when">${esc(dates[i])}<em class="flow-now">지금</em></span>
    </li>`).join("")}
  </ol>`;
}

function resourceBlock(items) {
  if (!items.length) return `<div class="note-box">${ic("bulb", "note-ic")}<div><p>라이브가 끝나면 다시보기, 발표 자료, 따라 할 프롬프트를 여기에 올려요.</p></div></div>`;
  return `<ul class="resources">${items.map((r) => {
    const ext = /^https?:/.test(r.url);
    const [tIcon, tLabel] = RESOURCE_TYPES[r.type] || ["file", r.type];
    return `<li><a class="card res" href="${esc(r.url)}"${ext ? ' target="_blank" rel="noopener"' : " download"}>
      <span class="res-type">${ic(tIcon)}${esc(tLabel)}</span>
      <span class="res-main"><span class="card-title">${esc(r.title)}</span>${r.note ? `<span class="card-desc">${esc(r.note)}</span>` : ""}</span>
      <span class="go">${ic(ext ? "external" : "download")}</span></a></li>`;
  }).join("")}</ul>`;
}

function cyclePage(c) {
  const st = statusOf(c.schedule);
  const related = labs.filter((l) => l.cycle === c.slug || (c.lab || []).includes(l.slug));
  const hosts = (c.hosts || []).map((id) => operators[id]).filter(Boolean);
  const { intro, list } = sections(c.body);
  const resources = [...(c.resources || [])];
  if (c.links?.replay && !resources.some((r) => r.type === "replay")) resources.unshift({ type: "replay", title: "라이브 다시보기", url: c.links.replay });
  const discord = c.links?.discord || site.links.discord;

  const actions = [
    c.links?.apply && st.phase < 3 ? `<a class="btn" href="${esc(c.links.apply)}" target="_blank" rel="noopener">${ic("radio")}무료 라이브 신청${ic("external", "ic-sm")}</a>` : "",
    c.links?.replay ? `<a class="btn" href="${esc(c.links.replay)}" target="_blank" rel="noopener">${ic("play")}다시보기${ic("external", "ic-sm")}</a>` : "",
    discord ? `<a class="btn btn-secondary" href="${esc(discord)}" target="_blank" rel="noopener">${ic("chat")}디스코드에 결과 올리기${ic("external", "ic-sm")}</a>` : "",
  ].join("");

  const jump = [["flow", "흐름"], ...list.map((s) => [s.id, plain(s.title)]), ["files", "자료"], ...(related.length ? [["notes", "실험 노트"]] : [])];

  return layout({
    title: `${c.no}회차 · ${c.title}`,
    description: c.summary,
    path: `/cycles/${c.slug}/`,
    active: "cycles",
    back: ["/cycles/", "회차 목록"],
    body: `<div class="wrap">
<section class="recipe-hero">
  <p class="kicker">${ic("calendar")}${c.no}회차 · ${esc(TRACKS[c.track]?.label || c.track)} ${statusPill(c.schedule)}</p>
  <h1>${esc(c.title)}</h1>
  <p class="lead"><strong>${esc(c.lead || c.summary)}</strong></p>
  <dl class="facts">
    <div><dt>무료 라이브</dt><dd>${fmtDate(c.schedule.live)} ${fmtTime(c.schedule.live)}</dd></div>
    <div><dt>적용 · 공유</dt><dd>${fmtShort(c.schedule.live)} ~ ${fmtShort(c.schedule.end)}</dd></div>
    <div><dt>지금</dt><dd data-count ${scheduleAttr(c.schedule)}>${esc(st.count)}</dd></div>
  </dl>
  ${actions ? `<div class="file-actions">${actions}</div>` : ""}
  ${jumpNav(jump)}
</section>
${intro ? `<section class="section">${md(intro)}</section>` : ""}
<section class="section" id="flow" aria-labelledby="flow-t">
  ${sectionTitle("flow-t", "map", "챌린지 흐름 한눈에")}
  ${flowList(c)}
</section>
${list.map(sectionHtml).join("")}
<section class="section" id="files" aria-labelledby="files-t">
  ${sectionTitle("files-t", "package", "회차 자료")}
  ${resourceBlock(resources)}
</section>
${related.length ? `<section class="section" id="notes" aria-labelledby="notes-t">${sectionTitle("notes-t", "flask", "이 회차 실험 노트")}${related.map(labCard).join("")}</section>` : ""}
<aside class="maker" aria-label="진행">
  ${hosts.length ? hosts.map((h) => avatar(h, "avatar-lg")).join("") : `<span class="avatar avatar-lg avatar-team" aria-hidden="true">N</span>`}
  <div>
    <p>진행: <strong>${hosts.length ? hosts.map((h) => esc(h.name)).join(", ") : "노션톡 운영진"}</strong></p>
    <p class="ask">이번 회차에서 만든 결과물, 디스코드에 올려주시면 구경 갈게요 ${ic("heart", "ic-inline ic-heart")}</p>
  </div>
</aside>
</div>`,
  });
}

/* ── 실험 노트 상세 ────────────────────── */

function labPage(l) {
  const op = operators[l.author];
  const cycle = cycles.find((c) => c.slug === l.cycle);
  const { intro, list } = sections(l.body);
  const files = (l.files || []).map((f) => ({ type: f.type || "file", ...f }));
  const jump = [...list.map((s) => [s.id, plain(s.title)]), ...(files.length ? [["files", "받아가기"]] : [])];
  return layout({
    title: `${l.code} · ${l.title}`,
    description: l.summary,
    path: `/lab/${l.slug}/`,
    active: "lab",
    back: ["/lab/", "실험 노트 목록"],
    body: `<div class="wrap">
<section class="recipe-hero">
  <p class="kicker">${ic("flask")}${esc(l.code)} · 실험 노트</p>
  <h1>${esc(l.title)}</h1>
  <p class="lead"><strong>${esc(l.lead || l.summary)}</strong>${l.leadSub ? `<br>${esc(l.leadSub)}` : ""}</p>
  <p class="byline">정리 ${esc(op.name)} · ${fmtDate(l.date)}${cycle ? ` · <a href="/cycles/${cycle.slug}/">${cycle.no}회차 ${esc(cycle.title)}</a>` : ""}</p>
  ${(l.tags || []).length ? `<p class="tags">${l.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}</p>` : ""}
  ${jumpNav(jump)}
</section>
${intro ? `<section class="section">${md(intro)}</section>` : ""}
${list.map(sectionHtml).join("")}
${files.length ? `<section class="section" id="files" aria-labelledby="files-t">${sectionTitle("files-t", "download", "받아가기")}${resourceBlock(files)}</section>` : ""}
<aside class="maker" aria-label="정리한 사람">
  ${avatar(op, "avatar-lg")}
  <div>
    <p>정리한 사람: <strong>${esc(op.name)}</strong> · 노션톡 ${esc(op.role)}</p>
    <p class="ask">따라 해보셨다면 결과를 커뮤니티에 나눠주세요 ${ic("heart", "ic-inline ic-heart")}</p>
  </div>
</aside>
<p class="back-link"><a href="/lab/">${ic("arrow-left")}다른 실험 노트 보러 가기</a></p>
</div>`,
  });
}

function notFoundPage() {
  return layout({
    title: "페이지를 찾을 수 없어요",
    path: "/404",
    body: `<div class="wrap"><section class="recipe-hero"><p class="kicker">${ic("compass")}404</p><h1>페이지를 찾을 수 없어요</h1><p class="lead">주소가 바뀌었거나 아직 올라오지 않은 자료예요.</p><div class="file-actions"><a class="btn" href="/">처음으로</a><a class="btn btn-secondary" href="/cycles/">회차 보기</a></div></section></div>`,
  });
}

/* ── 쓰기 ─────────────────────────────── */

function write(rel, html) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// fs.cpSync는 Windows에서 한글 경로일 때 Node가 멈춰서 직접 복사해요
function copy(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) copy(path.join(src, name), path.join(dest, name));
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 회차·실험 폴더 안의 첨부 파일(meta.json, index.md 제외)을 같은 주소로 복사해요
function copyAttachments(entry, base) {
  for (const name of fs.readdirSync(entry.folder)) {
    if (name === "meta.json" || name === "index.md") continue;
    copy(path.join(entry.folder, name), path.join(DIST, base, entry.slug, name));
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
for (const f of ["styles.css", "app.js", "phase.js", "hero.js"]) fs.copyFileSync(path.join(ROOT, "src", f), path.join(DIST, "assets", f));
copy(ICON_DIR, path.join(DIST, "assets", "icons"));
if (fs.existsSync(path.join(ROOT, "public"))) copy(path.join(ROOT, "public"), DIST);

write("index.html", homePage());
write("cycles/index.html", listPage({
  title: "cycle", sub: "회차별 자료", path: "/cycles/", active: "cycles",
  lead: "2주마다 한 주제. 라이브 다시보기와 발표 자료, 따라 할 프롬프트를 회차별로 모았어요.",
  items: cycles.map(cycleCard).join("") || empty("첫 회차를 준비하고 있어요."),
}));
for (const c of cycles) { write(`cycles/${c.slug}/index.html`, cyclePage(c)); copyAttachments(c, "cycles"); }
write("lab/index.html", listPage({
  title: "lab", sub: "운영진 실험 노트", path: "/lab/", active: "lab",
  lead: "챌린지 주제를 먼저 해보면서 막혔던 곳, 통했던 프롬프트, 만든 결과물을 그대로 남겨요.",
  items: labs.map(labCard).join("") || empty("첫 실험 노트를 쓰고 있어요."),
}));
for (const l of labs) { write(`lab/${l.slug}/index.html`, labPage(l)); copyAttachments(l, "lab"); }
for (const w of works) copyAttachments(w, "work");
write("404.html", notFoundPage());

console.log(`빌드 완료: 회차 ${cycles.length}개, 실험 노트 ${labs.length}개, 결과물 ${works.length}개 → dist/`);
