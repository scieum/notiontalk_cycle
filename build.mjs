// 노션톡 챌린지 아카이브 빌드 스크립트
// content/ 폴더의 회차·실험 자료를 읽어 dist/에 정적 HTML을 만들어요.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { PHASES, kst, statusOf, timeText } from "./src/phase.js";
import { DEMOS } from "./src/demos.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, "content");
const DIST = path.join(ROOT, "dist");
const VERSION = Date.now().toString(36);

// 주차 안내 비밀번호: 저장소에 넣지 않고 .env(로컬, git 제외) 또는 Vercel 환경변수 LOCK_PASSWORD로 받아요
const ENV_FILE = path.join(ROOT, ".env");
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const LOCK_PASSWORD = process.env.LOCK_PASSWORD;

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
  "❤": "heart", "✅": "check", "✔": "check", "📝": "note", "🎬": "film", "🔒": "lock",
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
for (const c of cycles) {
  for (const w of c.weeks || []) {
    if (!LOCK_PASSWORD) throw new Error(`${c.slug}: 주차 안내를 잠그려면 LOCK_PASSWORD가 필요해요 (.env 또는 Vercel 환경변수)`);
    w.slug = `week-${w.no}`;
    w.body = fs.readFileSync(path.join(c.folder, "weeks", w.file), "utf8");
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
  `data-schedule='${esc(JSON.stringify({ announce: s.announce, live: s.live, end: s.end, review: s.review || null, done: !!s.done }))}'`;

function avatar(op, cls = "") {
  // 프로필 사진(site.json의 photo, notiontalk.com 운영진 사진)이 있으면 사진, 없으면 이름 첫 글자
  if (op.photo) return `<img class="avatar avatar-${esc(op.id)} ${cls}" src="${esc(op.photo)}" alt="" aria-hidden="true">`;
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
      if (lang === "file") {
        const name = rest.join(" ") || "CLAUDE.md";
        return `<div class="mini-prompt file-block is-folded" data-fold><h3>${ic("file")}${esc(name)}</h3><pre><code>${esc(code)}</code></pre><button type="button" class="fold-toggle" data-fold-toggle aria-expanded="false"><span class="fold-more">전체 보기</span><span class="fold-less">접기</span></button><div class="file-actions"><a class="btn btn-sm" href="data:text/plain;charset=utf-8,${encodeURIComponent(code)}" download="${esc(name)}">${ic("download")}${esc(name)} 받기</a><button type="button" class="btn btn-secondary btn-sm" data-copy><span class="copy-idle">${ic("copy")}내용 복사</span><span class="copy-done">${ic("check")}복사됐어요</span></button></div></div>`;
      }
      if (lang === "gallery") return galleryHtml(code, rest);
      if (lang === "bookmarks") return bookmarksHtml(code, rest.join(" "));
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
      // 팁·주의 상자 안에서는 문장이 끝나면("요." 다음) 줄을 바꿔요
      const body = (m ? quote.replace(m[0], "<p>") : quote).replace(/([요다]\.)\s+(?=[^<\s])/g, "$1<br>");
      return `<div class="note-box${name === "alert" ? " note-box--warn" : ""}">${ic(name, "note-ic")}<div>${body}</div></div>`;
    },
    heading(text, level) {
      // "### 방법·주제·단계 N · 이름"은 구역을 나누는 머리띠가 돼요 (2-1 같은 하위 단계는 그대로)
      const m = level === 3 && text.match(/^(방법|주제|단계|예시)\s*(\d+)\s*·\s*(.+)$/);
      if (m) return `<div class="method-head"><span class="method-no">${m[1]} ${m[2]}</span><h3>${m[3]}</h3></div>`;
      // "### 비교 · 이름"은 노란 비교 머리띠
      const cmp = level === 3 && text.match(/^비교\s*·\s*(.+)$/);
      if (cmp) return `<div class="method-head method-head--cmp"><span class="method-no">비교</span><h3>${cmp[1]}</h3></div>`;
      return `<h${level}>${text}</h${level}>`;
    },
    table(header, body) {
      return `<div class="table-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    },
  },
});

// ```gallery 블록: 한 줄에 "파일명 | 제목 | 설명". 파일은 지금 그리는 회차·실험 폴더 안에서 찾아요.
// 영상 미리보기는 2초 장면(#t=2) — 흰 화면으로 시작하는 영상이 비어 보이지 않게.
// 아직 없는 파일은 "준비 중" 칸으로 그리고 빌드에 경고를 띄워요
let mediaCtx = null;
const YT_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;
// 옵션: "3"은 한 줄에 3개, "fold"는 처음 두 줄만 보이고 전체 보기/접기 버튼
function galleryHtml(code, opts = []) {
  const cols = opts.includes("3") ? "3" : "";
  const items = code.trim().split("\n").map((line) => line.split("|").map((x) => x.trim())).filter(([f]) => f);
  const grid = `<div class="gallery${cols === "3" ? " gallery--3" : ""}">${items.map(([file, title = "", caption = ""]) => {
    const yt = file.match(YT_RE);
    // "demo:이름"은 src/demos.mjs의 스타일 예시 애니메이션
    if (file.startsWith("demo:")) {
      const name = file.slice(5);
      if (!DEMOS[name]) console.warn(`  ! 없는 데모 "${name}" — src/demos.mjs에 추가하세요`);
      return `<figure class="gallery-item"><div class="demo d-${esc(name)}" role="img" aria-label="${esc(title)} 예시">${DEMOS[name] || ""}</div><figcaption>${title ? `<strong>${esc(title)}</strong>` : ""}${caption ? `<span>${esc(caption)}</span>` : ""}</figcaption></figure>`;
    }
    const ext = /^https?:/.test(file);
    const ready = ext || (mediaCtx && fs.existsSync(path.join(mediaCtx.folder, file)));
    if (!ready) console.warn(`  ! 갤러리 파일 없음 "${file}" — ${mediaCtx?.folder || ""}에 넣어 주세요`);
    const src = ext ? file : `${mediaCtx?.base || ""}${file}`;
    // 유튜브는 썸네일만 먼저 보여주고, 누르면 그 자리에서 재생해요(app.js)
    const media = yt
      ? `<button type="button" class="yt" data-yt="${yt[1]}" aria-label="${esc(title)} 영상 재생"><img src="https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg" alt="" loading="lazy"><span class="yt-play">${ic("play")}</span></button>`
      : !ready
        ? `<div class="gallery-ph">${ic("play")}<span>영상 준비 중</span></div>`
        : /\.(mp4|webm|mov)$/i.test(file)
          ? `<video src="${esc(src)}#t=2" controls muted loop playsinline preload="metadata" aria-label="${esc(title)}"></video>`
          : `<img src="${esc(src)}" alt="${esc(title)}" loading="lazy">`;
    const link = yt ? `<a class="yt-link" href="https://www.youtube.com/watch?v=${yt[1]}" target="_blank" rel="noopener">유튜브에서 보기${ic("external")}</a>` : "";
    return `<figure class="gallery-item">${media}${title || caption ? `<figcaption>${title ? `<strong>${esc(title)}</strong>` : ""}${caption ? `<span>${esc(caption)}</span>` : ""}${link}</figcaption>` : ""}</figure>`;
  }).join("")}</div>`;
  if (!opts.includes("fold") || items.length <= 6) return grid;
  return `<div class="gallery-fold is-folded" data-fold>${grid}<button type="button" class="btn btn-secondary btn-sm fold-toggle" data-fold-toggle aria-expanded="false"><span class="fold-more">전체 보기 (${items.length}개)</span><span class="fold-less">접기</span></button></div>`;
}

// ```bookmarks 블록: 한 줄에 "이름 | 주소 | 설명". 파트마다 필요한 사이트를 북마크 카드로
// 블록 첫 줄 뒤에 제목을 쓰면(```bookmarks 레퍼런스 참고 사이트) 그 제목으로 나와요
function bookmarksHtml(code, label) {
  const items = code.trim().split("\n").map((line) => line.split("|").map((x) => x.trim())).filter(([n, u]) => n && u);
  return `<div class="bookmarks"><p class="bm-label">${ic("link")}${esc(label || "필요한 사이트")}</p><ul>${items.map(([name, url, note = ""]) => {
    let host = url;
    try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
    return `<li><a class="card bookmark" href="${esc(url)}" target="_blank" rel="noopener"><span class="res-main"><span class="card-title">${esc(name)}</span>${note ? `<span class="card-desc">${esc(note)}</span>` : ""}<span class="bm-host">${esc(host)}</span></span><span class="go">${ic("external")}</span></a></li>`;
  }).join("")}</ul></div>`;
}

// "## 파트 N · 이름" 섹션은 연수 흐름 목록 + 클릭하면 그 파트만 보이는 화면이 돼요
const PART_RE = /^파트\s*(\d+)\s*[·:.\-]?\s*/;
function partOf(s) {
  const m = plain(s.title).match(PART_RE);
  return m ? { no: m[1], name: plain(s.title).slice(m[0].length) } : null;
}
function partsHtml(parts) {
  const nav = `<section class="section" id="parts" aria-labelledby="parts-t">
    ${sectionTitle("parts-t", "map", "연수 흐름")}
    <ol class="steps part-nav">${parts.map(({ s, p }) => `<li><a href="#part-${p.no}"><span><strong>파트 ${esc(p.no)}</strong> · ${esc(p.name)}</span><span class="go">${ic("arrow-right")}</span></a></li>`).join("")}</ol>
  </section>`;
  const panels = parts.map(({ s, p }, i) => {
    const [icon] = splitIcon(s.title);
    const prev = parts[i - 1], next = parts[i + 1];
    // 첫 파트의 "이전", 마지막 파트의 "다음" 자리는 연수 흐름(홈)으로 돌아가는 버튼
    const link = (x, dir) => x ? `<a class="part-pg part-pg--${dir}" href="#part-${x.p.no}">${dir === "prev" ? ic("arrow-left") : ""}<span><small>${dir === "prev" ? "이전" : "다음"} 파트</small>파트 ${esc(x.p.no)} · ${esc(x.p.name)}</span>${dir === "next" ? ic("arrow-right") : ""}</a>` : `<a class="part-pg part-pg--${dir} part-pg--home" href="#parts">${dir === "prev" ? ic("home") : ""}<span><small>처음 화면</small>홈으로 · 연수 흐름</span>${dir === "next" ? ic("home") : ""}</a>`;
    return `<section class="section part-panel" id="part-${p.no}" data-part aria-labelledby="part-${p.no}-t">
    <a class="part-back" href="#parts">${ic("arrow-left")}연수 흐름</a>
    <p class="part-kicker">파트 ${esc(p.no)} / ${parts.length}</p>
    ${sectionTitle(`part-${p.no}-t`, icon, p.name)}
    ${md(s.body)}
    <nav class="part-pager" aria-label="파트 이동">${link(prev, "prev")}${link(next, "next")}</nav>
  </section>`;
  }).join("");
  return nav + panels;
}

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

// 파트 섹션은 처음 나온 자리에 연수 흐름 + 파트 화면으로 모아 그려요
function bodySections(list) {
  const parts = list.map((s) => ({ s, p: partOf(s) })).filter((x) => x.p);
  let placed = false;
  return list.map((s) => {
    if (!partOf(s)) return sectionHtml(s);
    if (placed) return "";
    placed = true;
    return partsHtml(parts);
  }).join("");
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
    <rect width="240" height="300" fill="${vibe ? "#F6ECE2" : "#E2EEED"}"/>
    <text x="22" y="44" class="t-label" fill="${vibe ? "#96613A" : "#1F5D5C"}">${esc(TRACKS[c.track]?.label || "")}</text>
    <text x="16" y="196" class="t-num">${pad2(c.no)}</text>
    ${blocks(22, 222, vibe ? "#96613A" : "#1F5D5C")}
  </svg>`;
}

function labThumb(l) {
  const n = (l.code.match(/\d+/) || ["0"])[0].replace(/^0+(?=\d)/, "");
  return `<svg class="thumb-svg" viewBox="0 0 240 300" role="img" aria-label="${esc(l.code)}">
    <rect width="240" height="300" fill="#FBEFC0"/>
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

// 주차 안내도 목록에 따로 한 칸씩 (비밀번호로 열어요)
function weekCard(c, w) {
  return `<a class="card row-card" href="/cycles/${c.slug}/${w.slug}/">
    <span class="thumb">${thumb(c, "cycles")}</span>
    <span class="exp">CYCLE-${pad2(c.no)}(${w.no}주차)</span>
    <span class="row-body">
      <span class="card-title">${esc(w.title)} <span class="pill status-lock">${ic("lock")}비밀번호</span></span>
      <span class="card-desc">${esc(w.summary || `${c.title} ${w.no}주차 안내예요. 참여 선생님께 알려드린 비밀번호로 열어요.`)}</span>
      <span class="card-meta">${fmtShort(w.start)} ~ ${fmtShort(w.end)}</span>
    </span>
    <span class="go">열기 ${ic("arrow-right")}</span>
  </a>`;
}

// 회차마다 주차 카드(최신 주차 먼저) 뒤에 회차 카드
const cycleCards = () => cycles.flatMap((c) => [cycleCard(c), ...(c.weeks || []).map((w) => weekCard(c, w))]);

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

// 노션 로고(Simple Icons) — 글자색을 따라가요
const LOGO = `<img class="logo-mark" src="/logo.png" alt="" width="22" height="22"><span class="logo-word">notiontalk</span><span class="logo-sub">challenge</span>`;

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
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#f4f4f4">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/assets/styles.css?v=${VERSION}">
<link rel="stylesheet" href="/assets/demos.css?v=${VERSION}">
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

// 오디씨처럼 짧은 영어 소문자 키워드 + 로고 블록 마크 구분자
const MARQUEE = ["notion", "vibe coding", "two weeks, one topic", "learn together"];
const MQ_MARK = `<svg class="mq-mark" viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="5.5"/><path d="M7 9.5h10M7 14.5h10"/></svg>`;

function homePage() {
  const letters = [..."notiontalk"].map((ch, i) => `<span class="lt" data-i="${i}">${ch}</span>`).join("");
  const mq = MARQUEE.map((t) => `<span>${esc(t)}</span>${MQ_MARK}`).join("");
  return layout({
    title: "",
    path: "/",
    bodyClass: "is-home",
    body: `
<section class="hero" id="hero" aria-labelledby="hero-title">
  <h1 id="hero-title" class="sr-only">${esc(site.name)}: 노션톡 라이브 챌린지 자료실</h1>
  <div class="wordmark" id="wordmark" role="img" aria-label="notiontalk">${letters}</div>
</section>

<div class="marquee" role="note" aria-label="${esc(MARQUEE.join(", "))}">
  <div class="marquee-track" aria-hidden="true"><div class="marquee-group">${mq}</div></div>
</div>

<section class="preview">
  <div class="row" id="cycle">
    ${rowHead("cycle", "회차별 자료", "/cycles/")}
    ${cycleCards().slice(0, 3).join("") || empty("첫 회차를 준비하고 있어요.")}
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
  if (!items.length) return `<div class="note-box">${ic("bulb", "note-ic")}<div><p>다시보기, 발표 자료, 따라 할 프롬프트를 정리해서 여기에 올려요.</p></div></div>`;
  return `<ul class="resources">${items.map((r) => {
    const ext = /^https?:/.test(r.url);
    const [tIcon, tLabel] = RESOURCE_TYPES[r.type] || ["file", r.type];
    return `<li><a class="card res" href="${esc(r.url)}"${ext ? ' target="_blank" rel="noopener"' : " download"}>
      <span class="res-type">${ic(tIcon)}${esc(tLabel)}</span>
      <span class="res-main"><span class="card-title">${esc(r.title)}</span>${r.note ? `<span class="card-desc">${esc(r.note)}</span>` : ""}</span>
      <span class="go">${ic(ext ? "external" : "download")}</span></a></li>`;
  }).join("")}</ul>`;
}

// 오디씨의 "받은 이미지 → 결과"처럼 전/후를 나란히 (meta.showcase, 회차 폴더 안 파일)
function showcase(c) {
  const s = c.showcase;
  if (!s?.before?.file || !s?.after?.file) return "";
  const media = (m) => {
    const src = `/cycles/${c.slug}/${m.file}`;
    return /\.(mp4|webm|mov)$/i.test(m.file)
      ? `<video src="${esc(src)}" autoplay muted loop playsinline></video>`
      : `<img src="${esc(src)}" alt="${esc(m.caption || "")}" loading="lazy">`;
  };
  const fig = (m) => `<figure>${media(m)}${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
  return `<div class="showcase">${fig(s.before)}<span class="showcase-arrow">${ic("arrow-right")}</span>${fig(s.after)}</div>`;
}

// 회차 페이지는 오디씨 레시피처럼: 한 줄 요약 → 전/후 → 준비물 → 사용법 → 지침 파일 → 프롬프트 → 자주 묻는 질문 → 받아가기
function cyclePage(c) {
  const related = labs.filter((l) => l.cycle === c.slug || (c.lab || []).includes(l.slug));
  const hosts = (c.hosts || []).map((id) => operators[id]).filter(Boolean);
  const hostNames = hosts.length ? hosts.map((h) => esc(h.name)).join(", ") : "노션톡 운영진";
  const { intro, list } = sections(c.body);
  mediaCtx = { base: `/cycles/${c.slug}/`, folder: c.folder };
  const resources = [...(c.resources || [])];
  if (c.links?.replay && !resources.some((r) => r.type === "replay")) resources.unshift({ type: "replay", title: "라이브 다시보기", url: c.links.replay });
  const actions = c.links?.replay ? `<a class="btn" href="${esc(c.links.replay)}" target="_blank" rel="noopener">${ic("play")}다시보기${ic("external", "ic-sm")}</a>` : "";

  return layout({
    title: `${c.no}회차 · ${c.title}`,
    description: c.summary,
    path: `/cycles/${c.slug}/`,
    active: "cycles",
    back: ["/cycles/", "회차 목록"],
    body: `<div class="wrap">
<section class="recipe-hero">
  <p class="kicker">${ic("package")}${c.no}회차 자료 · ${esc(TRACKS[c.track]?.label || c.track)}</p>
  <h1>${esc(c.title)}</h1>
  ${c.lead ? `<p class="lead"><strong>${esc(c.lead)}</strong>${c.leadSub ? `<br>${esc(c.leadSub)}` : ""}</p>` : ""}
  ${showcase(c)}
  ${actions ? `<div class="file-actions">${actions}</div>` : ""}
</section>
${intro ? `<section class="section">${md(intro)}</section>` : ""}
${bodySections(list)}
${resources.length ? `<section class="section" id="files" aria-labelledby="files-t">
  ${sectionTitle("files-t", "download", "받아가기")}
  ${resourceBlock(resources)}
</section>` : ""}
${related.length ? `<section class="section" id="notes" aria-labelledby="notes-t">${sectionTitle("notes-t", "flask", "이 회차 실험 노트")}${related.map(labCard).join("")}</section>` : ""}
<aside class="maker" aria-label="진행">
  ${hosts.length ? hosts.map((h) => avatar(h, "avatar-lg")).join("") : `<span class="avatar avatar-lg avatar-team" aria-hidden="true">N</span>`}
  <div>
    <p>진행: <strong>${hostNames}</strong></p>
    <p class="ask">이번 회차에서 만든 결과물, 디스코드에 올려주시면 구경 갈게요 ${ic("heart", "ic-inline ic-heart")}</p>
  </div>
</aside>
<p class="back-link"><a href="/cycles/">${ic("arrow-left")}다른 회차 자료 보러 가기</a></p>
</div>`,
  });
}

/* ── 주차 안내 (비밀번호 잠금) ───────────── */

// 본문 HTML을 비밀번호로 암호화해요 (PBKDF2 → AES-GCM). 페이지 소스에는 암호문만 남아요.
const LOCK_ITER = 250000;
const b64 = (buf) => Buffer.from(buf).toString("base64");
async function encrypt(html, password) {
  const { subtle } = globalThis.crypto;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await subtle.deriveKey({ name: "PBKDF2", salt, iterations: LOCK_ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const data = await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(html));
  return { salt: b64(salt), iv: b64(iv), iter: LOCK_ITER, data: b64(data) };
}

function weekPage(c, w, locked) {
  return layout({
    title: `${c.no}회차 ${w.no}주차 안내`,
    description: `${c.no}회차 ${w.no}주차 안내 (비밀번호가 필요해요)`,
    path: `/cycles/${c.slug}/${w.slug}/`,
    active: "cycles",
    back: [`/cycles/${c.slug}/`, `${c.no}회차로 돌아가기`],
    body: `<div class="wrap">
<section class="recipe-hero">
  <p class="kicker">${ic("calendar")}${c.no}회차 · ${w.no}주차</p>
  <h1>${esc(w.title)}</h1>
  <p class="lead"><strong>${fmtShort(w.start)} ~ ${fmtShort(w.end)}</strong></p>
</section>
<form class="card lock" data-lock="${esc(c.slug)}" novalidate>
  <span class="lock-ic">${ic("lock")}</span>
  <h2>비밀번호를 넣어주세요</h2>
  <p class="card-desc">참여 선생님께 알려드린 비밀번호로 이번 주 안내가 열려요.</p>
  <div class="lock-row">
    <label class="sr-only" for="lock-pw">비밀번호</label>
    <input id="lock-pw" class="lock-input" type="password" inputmode="numeric" autocomplete="off" required>
    <button class="btn" type="submit">${ic("unlock")}열기</button>
  </div>
  <p class="lock-msg" role="alert"></p>
</form>
<div class="locked-body" hidden></div>
<script type="application/json" id="locked-data">${JSON.stringify(locked)}</script>
<script type="module" src="/assets/lock.js?v=${VERSION}"></script>
<p class="back-link"><a href="/cycles/${c.slug}/">${ic("arrow-left")}${c.no}회차 페이지로</a></p>
</div>`,
  });
}

function weekBody(w) {
  const { intro, list } = sections(w.body);
  return `${jumpNav(list.map((s) => [s.id, plain(s.title)]))}
${intro ? `<section class="section">${md(intro)}</section>` : ""}
${list.map(sectionHtml).join("")}`;
}

/* ── 실험 노트 상세 ────────────────────── */

function labPage(l) {
  const op = operators[l.author];
  const cycle = cycles.find((c) => c.slug === l.cycle);
  const { intro, list } = sections(l.body);
  mediaCtx = { base: `/lab/${l.slug}/`, folder: l.folder };
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
    // OneDrive "클라우드에만" 파일은 읽다가 멈춰요. 내용이 없으면(blocks 0) 건너뛰고 알려줘요
    const st = fs.statSync(src);
    if (st.size > 0 && st.blocks === 0) {
      console.warn(`  ! 클라우드에만 있는 파일이라 건너뜀: ${path.relative(ROOT, src)} — OneDrive에서 "항상 이 장치에 유지"로 바꿔 주세요`);
      return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 회차·실험 폴더 안의 첨부 파일(meta.json, index.md 제외)을 같은 주소로 복사해요
function copyAttachments(entry, base) {
  for (const name of fs.readdirSync(entry.folder)) {
    if (name === "meta.json" || name === "index.md" || name === "weeks") continue; // weeks/는 암호화해서만 내보내요
    copy(path.join(entry.folder, name), path.join(DIST, base, entry.slug, name));
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
for (const f of ["styles.css", "demos.css", "app.js", "phase.js", "hero.js", "lock.js"]) fs.copyFileSync(path.join(ROOT, "src", f), path.join(DIST, "assets", f));
copy(ICON_DIR, path.join(DIST, "assets", "icons"));
if (fs.existsSync(path.join(ROOT, "public"))) copy(path.join(ROOT, "public"), DIST);

write("index.html", homePage());
write("cycles/index.html", listPage({
  title: "cycle", sub: "회차별 자료", path: "/cycles/", active: "cycles",
  lead: "2주마다 한 주제. 라이브 다시보기와 발표 자료, 따라 할 프롬프트를 회차별로 모았어요.",
  items: cycleCards().join("") || empty("첫 회차를 준비하고 있어요."),
}));
for (const c of cycles) {
  write(`cycles/${c.slug}/index.html`, cyclePage(c));
  copyAttachments(c, "cycles");
  for (const w of c.weeks || []) write(`cycles/${c.slug}/${w.slug}/index.html`, weekPage(c, w, await encrypt(weekBody(w), LOCK_PASSWORD)));
}
write("lab/index.html", listPage({
  title: "lab", sub: "운영진 실험 노트", path: "/lab/", active: "lab",
  lead: "챌린지 주제를 먼저 해보면서 막혔던 곳, 통했던 프롬프트, 만든 결과물을 그대로 남겨요.",
  items: labs.map(labCard).join("") || empty("첫 실험 노트를 쓰고 있어요."),
}));
for (const l of labs) { write(`lab/${l.slug}/index.html`, labPage(l)); copyAttachments(l, "lab"); }
for (const w of works) copyAttachments(w, "work");
write("404.html", notFoundPage());

console.log(`빌드 완료: 회차 ${cycles.length}개, 실험 노트 ${labs.length}개, 결과물 ${works.length}개 → dist/`);
