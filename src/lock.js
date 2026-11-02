// 주차 안내 잠금: 빌드가 암호화한 본문을 비밀번호로 풀어서 보여줘요.
// 맞힌 비밀번호는 이 탭이 열려 있는 동안만 기억해요 (sessionStorage).
const form = document.querySelector("[data-lock]");
const box = document.querySelector(".locked-body");
const payload = JSON.parse(document.getElementById("locked-data").textContent);
const input = form.querySelector("input");
const msg = form.querySelector(".lock-msg");
const KEY = `lock:${form.dataset.lock}`;

const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function unlock(password) {
  const { subtle } = crypto;
  const base = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await subtle.deriveKey({ name: "PBKDF2", salt: bytes(payload.salt), iterations: payload.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plain = await subtle.decrypt({ name: "AES-GCM", iv: bytes(payload.iv) }, key, bytes(payload.data));
  return new TextDecoder().decode(plain);
}

async function open(password, remembered) {
  try {
    box.innerHTML = await unlock(password);
  } catch {
    if (remembered) { try { sessionStorage.removeItem(KEY); } catch {} return; }
    msg.textContent = "비밀번호가 달라요. 다시 확인해주세요.";
    input.select();
    return;
  }
  try { sessionStorage.setItem(KEY, password); } catch {}
  form.hidden = true;
  box.hidden = false;
}

if (!crypto.subtle) {
  msg.textContent = "이 브라우저에서는 열 수 없어요. 최신 크롬·사파리·엣지로 열어주세요.";
} else {
  let saved = null;
  try { saved = sessionStorage.getItem(KEY); } catch {}
  if (saved) open(saved, true);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";
    if (input.value.trim()) open(input.value.trim(), false);
  });
  input.focus();
}
