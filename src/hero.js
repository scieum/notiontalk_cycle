/* 노션톡 챌린지 아카이브 · 히어로 워드마크
 * 거대한 "notiontalk" 글자를 커서(모바일은 가로로 쓸기)가 보이지 않는 원처럼 건드려요.
 * - 천천히 스치면 글자가 살짝 밀렸다가 제자리로 흔들리며 돌아와요.
 * - 빠르게 휘두르면 글자가 넘어져 바닥(띠 위)에 흩어져요. 정리 안 된 기록처럼요.
 * - 2.5초 동안 아무도 안 건드리면 글자가 하나씩 노션 블록처럼 착착 제자리로 돌아가요.
 * - 모션 줄이기 설정이면 아무것도 움직이지 않아요.
 */
(() => {
  "use strict";

  const CFG = {
    matter: "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js",
    cursorR: 28,      // 보이지 않는 원의 반지름(px)
    knockSpeed: 13,   // 이 속도(px/프레임)보다 빠르게 치면 넘어져요
    idleMs: 2500,     // 흩어진 뒤 이만큼 조용하면 정리 시작
    returnMs: 680,    // 글자 하나가 돌아가는 시간
    stagger: 55,      // 글자마다 출발 간격(ms)
  };

  const hero = document.getElementById("hero");
  const wm = document.getElementById("wordmark");
  if (!hero || !wm) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const letters = [...wm.querySelectorAll(".lt")].map((el) => ({
    el, home: null, state: "pinned", body: null,
    wob: { x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0 }, ret: null,
  }));

  let M = null, engine = null, cursorBody = null, ground = null, walls = [];
  let W = 0, H = 0;
  const cur = { x: -999, y: -999, px: -999, py: -999, vx: 0, vy: 0, active: false };
  let lastTouch = 0, raf = 0, lastT = 0, acc = 0, quietSince = 0;

  /* ── 크기 맞추기·위치 재기 ─────────────── */
  function fit() {
    wm.style.fontSize = "";
    letters.forEach((l) => (l.el.style.transform = ""));
    const avail = hero.clientWidth * 0.94;
    const now = parseFloat(getComputedStyle(wm).fontSize);
    const first = letters[0].el.getBoundingClientRect(), last = letters[letters.length - 1].el.getBoundingClientRect();
    const size = Math.min(now * avail / (last.right - first.left), hero.clientHeight * 0.62, 260);
    wm.style.fontSize = size + "px";
  }

  function measure() {
    const hr = hero.getBoundingClientRect();
    W = hr.width; H = hr.height;
    letters.forEach((l) => {
      const r = l.el.getBoundingClientRect();
      l.home = { x: r.left - hr.left + r.width / 2, y: r.top - hr.top + r.height / 2, w: r.width, h: r.height };
    });
    if (engine) buildBounds();
  }

  function buildBounds() {
    const { Bodies, Composite } = M;
    if (ground) Composite.remove(engine.world, [ground, ...walls]);
    ground = Bodies.rectangle(W / 2, H + 40, W * 3, 80, { isStatic: true, friction: 0.8 });
    walls = [
      Bodies.rectangle(-40, H / 2 - 400, 80, H + 1200, { isStatic: true }),
      Bodies.rectangle(W + 40, H / 2 - 400, 80, H + 1200, { isStatic: true }),
    ];
    Composite.add(engine.world, [ground, ...walls]);
  }

  /* ── 물리 엔진(필요할 때 불러와요) ─────── */
  function loadMatter() {
    if (window.Matter) return Promise.resolve(window.Matter);
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CFG.matter; s.async = true;
      s.onload = () => resolve(window.Matter);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initEngine() {
    const { Engine, Bodies, Composite } = M;
    engine = Engine.create({ enableSleeping: false });
    engine.gravity.y = 1.1;
    cursorBody = Bodies.circle(-999, -999, CFG.cursorR, { isStatic: true, restitution: 0.4 });
    Composite.add(engine.world, cursorBody);
    buildBounds();
  }

  /* ── 상호작용 ─────────────────────────── */
  function hits(l) {
    const cx = l.home.x + l.wob.x, cy = l.home.y + l.wob.y;
    const hw = l.home.w * 0.42, hh = l.home.h * 0.36;
    const dx = Math.max(Math.abs(cur.x - cx) - hw, 0);
    const dy = Math.max(Math.abs(cur.y - cy) - hh, 0);
    return dx * dx + dy * dy < CFG.cursorR * CFG.cursorR;
  }

  function knock(l) {
    const { Bodies, Body, Composite } = M;
    const b = Bodies.rectangle(l.home.x + l.wob.x, l.home.y + l.wob.y, l.home.w * 0.84, l.home.h * 0.7, {
      chamfer: { radius: Math.min(10, l.home.w * 0.12) }, friction: 0.45, frictionAir: 0.012, restitution: 0.32, density: 0.0018,
    });
    Body.setAngle(b, l.wob.a);
    // 너무 세게 치면 바닥을 뚫고 나가서 속도를 제한해요
    const clampV = (v) => Math.max(-22, Math.min(22, v));
    Body.setVelocity(b, { x: clampV(cur.vx * 0.55), y: Math.min(clampV(cur.vy * 0.55), -2) });
    Body.setAngularVelocity(b, (cur.vx > 0 ? 1 : -1) * (0.05 + Math.random() * 0.12));
    Composite.add(engine.world, b);
    l.body = b; l.state = "free";
    l.wob = { x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0 };
  }

  function touchLetters(speed) {
    for (const l of letters) {
      if (l.state !== "pinned" || !hits(l)) continue;
      lastTouch = performance.now();
      if (speed > CFG.knockSpeed && engine) knock(l);
      else {
        const k = Math.min(speed, CFG.knockSpeed) / CFG.knockSpeed;
        l.wob.vx += cur.vx * 0.25;
        l.wob.vy += cur.vy * 0.15;
        l.wob.va += (cur.vx > 0 ? 1 : -1) * 0.02 * (0.4 + k);
      }
    }
  }

  /* ── 정리하기 ─────────────────────────── */
  function startTidy() {
    const now = performance.now();
    const free = letters.filter((l) => l.state === "free");
    free.sort((a, b) => a.home.x - b.home.x).forEach((l, i) => {
      const p = l.body.position;
      let a = l.body.angle % (Math.PI * 2);
      if (a > Math.PI) a -= Math.PI * 2;
      if (a < -Math.PI) a += Math.PI * 2;
      M.Composite.remove(engine.world, l.body);
      l.body = null; l.state = "return";
      l.ret = { t0: now + i * CFG.stagger, x: p.x - l.home.x, y: p.y - l.home.y, a };
    });
  }

  const easeOutBack = (t) => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  /* ── 프레임 ───────────────────────────── */
  function frame(t) {
    raf = 0;
    const dt = Math.min(t - (lastT || t), 50);
    lastT = t;

    // 커서 속도(px/프레임)
    if (cur.active && cur.px > -900) {
      const f = dt > 0 ? 16.67 / dt : 1;
      cur.vx = cur.vx * 0.4 + (cur.x - cur.px) * f * 0.6;
      cur.vy = cur.vy * 0.4 + (cur.y - cur.py) * f * 0.6;
    } else { cur.vx = cur.vy = 0; }
    cur.px = cur.x; cur.py = cur.y;
    const speed = Math.hypot(cur.vx, cur.vy);
    if (cur.active) touchLetters(speed);

    // 물리
    if (engine) {
      M.Body.setPosition(cursorBody, cur.active ? { x: cur.x, y: cur.y } : { x: -999, y: -999 });
      M.Body.setVelocity(cursorBody, { x: cur.vx, y: cur.vy });
      acc += dt;
      while (acc >= 16.67) { M.Engine.update(engine, 16.67); acc -= 16.67; }
      if (cur.active && letters.some((l) => l.state === "free" && M.Collision.collides(cursorBody, l.body))) lastTouch = performance.now();
    }

    let busy = cur.active;
    const now = performance.now();
    for (const l of letters) {
      if (l.state === "pinned") {
        const w = l.wob;
        w.vx += -0.14 * w.x - 0.2 * w.vx; w.vy += -0.14 * w.y - 0.2 * w.vy; w.va += -0.14 * w.a - 0.2 * w.va;
        w.x += w.vx; w.y += w.vy; w.a += w.va;
        const moving = Math.abs(w.x) + Math.abs(w.y) + Math.abs(w.a) * 50 + Math.abs(w.vx) + Math.abs(w.vy) > 0.05;
        if (!moving) { w.x = w.y = w.a = w.vx = w.vy = w.va = 0; }
        busy = busy || moving;
        l.el.style.transform = moving ? `translate(${w.x.toFixed(2)}px,${w.y.toFixed(2)}px) rotate(${w.a.toFixed(4)}rad)` : "";
      } else if (l.state === "free") {
        busy = true;
        const p = l.body.position;
        l.el.style.transform = `translate(${(p.x - l.home.x).toFixed(2)}px,${(p.y - l.home.y).toFixed(2)}px) rotate(${l.body.angle.toFixed(4)}rad)`;
      } else if (l.state === "return") {
        busy = true;
        const r = l.ret;
        const k = Math.min(Math.max((now - r.t0) / CFG.returnMs, 0), 1);
        const e = easeOutBack(k), inv = 1 - e;
        l.el.style.transform = `translate(${(r.x * inv).toFixed(2)}px,${(r.y * inv).toFixed(2)}px) rotate(${(r.a * inv).toFixed(4)}rad)`;
        if (k >= 1) {
          l.state = "pinned"; l.ret = null; l.el.style.transform = "";
          l.el.classList.remove("is-snap"); void l.el.offsetWidth; l.el.classList.add("is-snap");
        }
      }
    }

    // 흩어진 글자가 있고 한동안 조용하면 정리
    // 화면 밖으로 나간 글자는 멈춘 것으로 봐요. 멈추지 않아도 조금 더 기다리면 정리해요.
    const free = letters.filter((l) => l.state === "free");
    if (free.length) {
      const out = (b) => b.position.y > H + 150 || b.position.y < -600 || b.position.x < -150 || b.position.x > W + 150;
      const resting = free.every((l) => out(l.body) || (l.body.speed < 0.6 && Math.abs(l.body.angularSpeed) < 0.05));
      if (resting && !quietSince) quietSince = now;
      if (!resting) quietSince = 0;
      const idle = now - lastTouch;
      if (idle > CFG.idleMs && ((quietSince && now - quietSince > 300) || idle > CFG.idleMs + 2000)) { startTidy(); quietSince = 0; }
    }

    if (busy) wake(); else lastT = 0;
  }

  function wake() { if (!raf) raf = requestAnimationFrame(frame); }

  /* ── 입력 ─────────────────────────────── */
  function setCursor(clientX, clientY) {
    const r = hero.getBoundingClientRect();
    const x = clientX - r.left, y = clientY - r.top;
    const inside = x > -40 && x < r.width + 40 && y > -40 && y < r.height + 20;
    if (inside && !cur.active) { cur.px = x; cur.py = y; }
    cur.x = x; cur.y = y; cur.active = inside;
    if (inside) wake();
  }

  window.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") setCursor(e.clientX, e.clientY); }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { cur.active = false; });
  window.addEventListener("blur", () => { cur.active = false; });
  hero.addEventListener("touchstart", (e) => { const t = e.touches[0]; cur.active = false; setCursor(t.clientX, t.clientY); }, { passive: true });
  hero.addEventListener("touchmove", (e) => { const t = e.touches[0]; setCursor(t.clientX, t.clientY); }, { passive: true });
  const endTouch = () => { cur.active = false; cur.px = -999; };
  hero.addEventListener("touchend", endTouch, { passive: true });
  hero.addEventListener("touchcancel", endTouch, { passive: true });

  let resizeTimer = 0, lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW) return; // 모바일 주소창 높이 변화는 무시
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      letters.forEach((l) => {
        if (l.body) M.Composite.remove(engine.world, l.body);
        l.body = null; l.state = "pinned"; l.ret = null;
        l.wob = { x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0 };
      });
      fit(); measure();
    }, 180);
  });

  /* ── 시작 ─────────────────────────────── */
  const start = () => {
    fit(); measure();
    loadMatter().then((m) => { M = m; initEngine(); }).catch(() => { /* 물리 없이 흔들기만 */ });
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
})();
