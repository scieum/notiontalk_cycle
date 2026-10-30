// 챌린지 단계 계산. 빌드(Node)와 브라우저가 같은 코드를 써요.
// 날짜는 모두 한국 시간 기준이에요. "2026-11-15"는 그날 0시(KST)로 읽어요.

export const PHASES = [
  { key: "vote", label: "주제 투표", desc: "노션·바이브코딩 주제를 한 번의 투표로 함께 정해요" },
  { key: "announce", label: "주제 공개", desc: "이번 회차 주제와 무료 라이브 신청을 알려요" },
  { key: "live", label: "무료 라이브", desc: "주제에 맞춘 무료 라이브를 누구나 함께 들어요" },
  { key: "apply", label: "적용 · 공유", desc: "2주 동안 내 수업과 업무에 적용하고 디스코드에 올려요" },
  { key: "review", label: "추천 · 댓글", desc: "다른 선생님의 결과물에 추천과 댓글을 남겨요" },
];

const DAY = 86400000;

export function kst(value) {
  if (!value) return null;
  return new Date(/T/.test(value) ? value : value + "T00:00:00+09:00");
}

function kstDayStart(date) {
  const shifted = new Date(date.getTime() + 9 * 3600000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 9 * 3600000);
}

// 단계 번호(0~4)와 완료(5)를 돌려줘요.
export function phaseOf(schedule, now = new Date()) {
  const announce = kst(schedule.announce);
  const live = kst(schedule.live);
  const end = kst(schedule.end);
  const endExclusive = new Date(end.getTime() + DAY);
  const review = schedule.review ? kst(schedule.review) : new Date(end.getTime() - 2 * DAY);
  const liveDay = kstDayStart(live);
  const liveDayEnd = new Date(liveDay.getTime() + DAY);

  if (now >= endExclusive) return 5;
  if (now >= review) return 4;
  if (now >= liveDayEnd) return 3;
  if (now >= liveDay) return 2;
  if (announce && now >= announce) return 1;
  return 0;
}

export function statusOf(schedule, now = new Date()) {
  const phase = phaseOf(schedule, now);
  const live = kst(schedule.live);
  const end = kst(schedule.end);
  const days = (target) => Math.ceil((kstDayStart(target) - kstDayStart(now)) / DAY);

  switch (phase) {
    case 0: return { phase, tone: "soon", badge: "준비 중", count: "주제 투표 중" };
    case 1: return { phase, tone: "open", badge: "라이브 신청 중", count: `라이브 D-${days(live)}` };
    case 2: return { phase, tone: "live", badge: "오늘 라이브", count: `오늘 ${timeText(live)}` };
    case 3: return { phase, tone: "active", badge: "적용 · 공유 중", count: `마감 D-${days(end)}` };
    case 4: return { phase, tone: "active", badge: "추천 · 댓글 중", count: days(end) === 0 ? "오늘 마감" : `마감 D-${days(end)}` };
    default: return { phase, tone: "done", badge: "완료", count: "자료 보관 중" };
  }
}

// "오후 8시", "오전 10시 30분". 환경마다 Intl 결과가 달라(PM 8:00 등) 직접 만들어요.
export function timeText(date) {
  const k = new Date(date.getTime() + 9 * 3600000);
  const h = k.getUTCHours(), m = k.getUTCMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? "오전" : "오후"} ${h12}시${m ? ` ${m}분` : ""}`;
}
