// 노션톡 챌린지 아카이브: 복사 버튼, 단계 표시 갱신, 흐르는 띠
import { statusOf } from "./phase.js";

const toast = document.querySelector(".toast");
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2200);
}

/* ── 프롬프트 복사 ─────────────────────── */
function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  ta.remove();
  return ok;
}

document.querySelectorAll("[data-copy]").forEach((btn) => {
  let doneTimer;
  btn.addEventListener("click", async () => {
    const code = btn.closest(".mini-prompt").querySelector("code");
    const text = code.textContent;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; }
    } catch { ok = false; }
    if (!ok) ok = legacyCopy(text);
    if (ok) {
      btn.classList.add("is-done");
      clearTimeout(doneTimer);
      doneTimer = setTimeout(() => btn.classList.remove("is-done"), 1600);
      showToast("복사됐어요!");
    } else {
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      showToast("자동 복사가 안 돼서 전체를 선택해뒀어요. 길게 눌러 복사해주세요!");
    }
  });
});

/* ── 단계 표시: 빌드 시점이 아니라 지금 기준으로 다시 계산 ── */
const read = (el) => { try { return JSON.parse(el.dataset.schedule); } catch { return null; } };

document.querySelectorAll("[data-status]").forEach((el) => {
  const s = read(el);
  if (!s) return;
  const st = statusOf(s);
  el.textContent = st.badge;
  el.className = el.className.replace(/status-\w+/, `status-${st.tone}`);
});
document.querySelectorAll("[data-count]").forEach((el) => {
  const s = read(el);
  if (s) el.textContent = statusOf(s).count;
});
document.querySelectorAll("[data-flow]").forEach((list) => {
  const s = read(list);
  if (!s) return;
  const now = statusOf(s).phase;
  list.querySelectorAll("[data-step]").forEach((li) => {
    const i = Number(li.dataset.step);
    li.classList.toggle("is-past", now > i);
    li.classList.toggle("is-now", now === i);
  });
});

/* ── 지침 파일 접기/펼치기 ─────────────── */
document.querySelectorAll("[data-fold-toggle]").forEach((btn) => {
  const box = btn.closest("[data-fold]");
  const pre = box.querySelector("pre");
  // 짧은 파일은 접을 필요가 없어요
  if (pre && pre.scrollHeight <= pre.clientHeight + 4) { box.classList.remove("is-folded"); btn.hidden = true; return; }
  btn.addEventListener("click", () => {
    const folded = box.classList.toggle("is-folded");
    btn.setAttribute("aria-expanded", String(!folded));
    // 갤러리를 접으면 갤러리 첫머리로 돌아가요
    if (folded && !pre && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: "start" });
  });
});

/* ── 흐르는 띠: 화면 폭만큼 복제 ─────────── */
const track = document.querySelector(".marquee-track");
if (track) {
  const group = track.querySelector(".marquee-group");
  const unit = [...group.children];
  while (group.scrollWidth < window.innerWidth * 1.1 && group.children.length < 64) {
    unit.forEach((n) => group.appendChild(n.cloneNode(true)));
  }
  const clone = group.cloneNode(true);
  track.appendChild(clone);
  // 화면 폭과 상관없이 같은 빠르기(초당 px)로 흐르게
  track.style.animationDuration = group.scrollWidth / (window.innerWidth < 640 ? 70 : 110) + "s";
}

/* ── 회차 파트: 연수 흐름에서 파트를 누르면 그 파트만 보여요 (#part-N) ── */
const partPanels = [...document.querySelectorAll("[data-part]")];
if (partPanels.length) {
  document.body.classList.add("has-parts");
  const showPart = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const open = partPanels.find((p) => p.id === id);
    partPanels.forEach((p) => p.classList.toggle("is-open", p === open));
    document.body.classList.toggle("part-open", !!open);
    if (open) window.scrollTo(0, 0);
    else if (id) document.getElementById(id)?.scrollIntoView();
  };
  addEventListener("hashchange", showPart);
  showPart();
}

/* ── 갤러리 유튜브: 누르면 그 자리에서 재생 ── */
document.querySelectorAll("[data-yt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
    f.title = btn.getAttribute("aria-label") || "유튜브 영상";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    btn.replaceWith(f);
  });
});

/* ── 텍스트 스크램블 데모: 글자가 뒤섞이다 제자리로 ── */
document.querySelectorAll("[data-scramble]").forEach((el) => {
  const target = el.dataset.scramble;
  const chars = "!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let frame = 0;
  setInterval(() => {
    frame = (frame + 1) % 60;
    const settled = Math.max(0, frame - 10) / 2;
    el.textContent = [...target].map((c, i) => (i < settled ? c : chars[Math.floor(Math.random() * chars.length)])).join("");
  }, 60);
});
