// 갤러리 "demo:이름" 카드에 들어가는 스타일 예시 애니메이션 (모양은 src/demos.css)
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");

export const DEMOS = {
  minimalism: `<span class="dot"></span><span class="line"></span><span class="word">less</span>`,
  swiss: `<span class="bar b1"></span><span class="bar b2"></span><span class="bar b3"></span><span class="word">Swiss<br>Style</span><span class="num">01</span>`,
  editorial: `<span class="big">Edit</span><span class="rule"></span><span class="cols">${range(2, () => `<span>${range(6, () => "<i></i>")}</span>`)}</span><span class="tag">ISSUE 01</span>`,
  bento: `<div class="grid">${range(5, (i) => `<span class="t t${i}"></span>`)}</div>`,
  kinetic: `<span class="w w1">MOVE</span><span class="w w2">your</span><span class="w w3">WORDS</span>`,
  scramble: `<span class="word" data-scramble="NOTIONTALK">NOTIONTALK</span>`,
  line: `<svg viewBox="0 0 160 90"><path d="M10 60 C 40 10, 60 10, 80 45 S 120 80, 150 30"/><circle cx="80" cy="45" r="18"/></svg>`,
  morph: `<span class="shape"></span>`,
  squash: `<span class="floor"></span><span class="ball"></span>`,
  liquid: `<svg class="defs" aria-hidden="true"><filter id="d-goo"><feGaussianBlur stdDeviation="8"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9"/></filter></svg><div class="goo">${range(4, (i) => `<span class="b b${i}"></span>`)}</div>`,
  zoom: range(6, (i) => `<span class="sq" style="animation-delay:${-i * 0.6}s"></span>`),
  glitch: `<span class="word" data-text="GLITCH">GLITCH</span>`,
  bauhaus: `<span class="circ"></span><span class="tri"></span><span class="rect"></span><span class="half"></span>`,
  memphis: `<span class="sq1"></span><span class="tri"></span><span class="circ"></span><svg viewBox="0 0 100 20"><path d="M0 10 Q 6.25 0 12.5 10 T 25 10 T 37.5 10 T 50 10 T 62.5 10 T 75 10 T 87.5 10 T 100 10"/></svg><span class="dots"></span>`,
  brutal: `<span class="btn">CLICK ME</span><span class="tag">NEW!</span>`,
  maximal: range(10, (i) => `<span class="m m${i}"></span>`) + `<span class="word">MORE!</span>`,
  popart: `<span class="burst"></span><span class="word">POW!</span>`,
  halftone: `<span class="dots"></span>`,
  riso: `<span class="a"></span><span class="b"></span><span class="word">RISO</span>`,
  collage: range(4, (i) => `<span class="p p${i}"></span>`) + `<span class="word">cut &amp; paste</span>`,
  paper: range(4, (i) => `<span class="layer l${i}"></span>`),
  clay: `<span class="blob"></span><span class="pill"></span>`,
  glass: `<span class="o o1"></span><span class="o o2"></span><span class="card"><i></i><i></i><i></i></span>`,
  grain: `<span class="g g1"></span><span class="g g2"></span><span class="noise"></span>`,
  holo: `<span class="word">HOLO</span>`,
  chrome: `<span class="word">Y2K</span><span class="star s1"></span><span class="star s2"></span>`,
  vapor: `<span class="sun"></span><span class="floor"></span>`,
  cyber: `<span class="word" data-text="NEON CITY">NEON CITY</span><span class="scan"></span>`,
  pixel: `<span class="ground"></span><span class="hero"></span><span class="coin"></span>`,
  lowpoly: `<svg viewBox="0 0 160 90" preserveAspectRatio="none"><polygon points="0,90 30,40 55,90" style="--c:#3b6e8f"/><polygon points="30,40 70,15 55,90" style="--c:#5a8fb0"/><polygon points="70,15 100,50 55,90" style="--c:#2c5672"/><polygon points="70,15 120,25 100,50" style="--c:#7fb0cf"/><polygon points="100,50 120,25 160,60" style="--c:#4a7fa0"/><polygon points="100,50 160,60 160,90" style="--c:#2c5672"/><polygon points="55,90 100,50 160,90" style="--c:#3b6e8f"/></svg>`,
  iso: `<div class="plane">${range(4, (i) => `<span class="cube c${i}"><i></i><i></i><i></i></span>`)}</div>`,
  deco: `<span class="fan"></span><span class="arch"></span><span class="word">DECO</span>`,

  // 모션 효과 기본: 속도 곡선(이징)
  ...Object.fromEntries(["linear", "ease-in", "ease-out", "ease-in-out", "back", "bounce", "elastic", "steps", "anticipation"].map((k) => [`ease-${k}`, `<span class="track"></span><span class="ball"></span><span class="label">${k}</span>`])),
  // 나타나기·사라지기
  "fade-in": `<span class="box"></span>`,
  "fade-out": `<span class="box"></span>`,
  "slide-in": `<span class="box"></span>`,
  "scale-in": `<span class="box"></span>`,
  "blur-in": `<span class="word">BLUR</span>`,
  wipe: `<span class="word">REVEAL</span>`,
  // 움직임 연출
  stagger: range(5, (i) => `<span class="bar" style="--i:${i}"></span>`),
  typewriter: `<span class="word">${[..."Hello, 노션톡"].map((c, i) => `<i style="--i:${i}">${c}</i>`).join("")}</span>`,
  spin: `<span class="box"></span>`,
  parallax: `<span class="far"></span><span class="mid"></span><span class="near"></span>`,
  pulse: `<span class="heart"></span>`,
  path: `<svg viewBox="0 0 160 90"><path d="M15 70 C 45 0, 75 0, 80 45 S 120 90, 145 20"/><circle r="6"><animateMotion dur="2.4s" repeatCount="indefinite" path="M15 70 C 45 0, 75 0, 80 45 S 120 90, 145 20"/></circle></svg>`,
  "flip-in": `<span class="box"></span>`,
  "drop-in": `<span class="floor"></span><span class="box"></span>`,
  "letter-rise": `<span class="word">${[..."MOTION"].map((c, i) => `<i style="--i:${i}">${c}</i>`).join("")}</span>`,
  shake: `<span class="box">!</span>`,
  countup: `<span class="num"><span class="strip">${range(11, (i) => `<b>${i * 10}</b>`)}</span></span><span class="unit">%</span>`,
  orbit: `<span class="core"></span>${range(3, (i) => `<span class="ring" style="--i:${i}"><span class="sat"></span></span>`)}`,
  // 화면 전환: A 장면 → B 장면
  ...Object.fromEntries(["crossfade", "push", "iris", "zoom-through", "split", "cover"].map((k) => [`tr-${k}`, k === "split"
    ? `<span class="scene b">B</span><span class="scene a half l">A</span><span class="scene a half r">A</span>`
    : `<span class="scene a">A</span><span class="scene b">B</span>`])),
};
