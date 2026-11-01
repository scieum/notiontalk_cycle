## 🧰 준비물 (한 번만)

1. **클로드 또는 코덱스 유료 계정**
2. **로고 이미지** — 작아도 괜찮아요. 클로드가 벡터로 다시 그려 고화질로 만들어요
3. **참고할 홈페이지 주소** — 문구와 색을 가져올 곳
4. **스틸컷 레퍼런스** 몇 장, 쓰고 싶은 **강조 글꼴** 웹폰트 코드 (파트 2에서 써요)

> 💡 작업 환경에 따라 클로드가 홈페이지나 웹폰트 주소에 접속하지 못할 수 있어요. 이번에도 첨부한 로고 이미지를 기준으로 하고, 글꼴은 원본 저장소에서 받아 쓰는 식으로 클로드가 알아서 돌아갔어요.

## 💡 파트 1 · 모션 그래픽 기본 지식

영상을 만들기 전에, 클로드에게 말할 **스타일 이름**부터 알아 둬요.\
이름을 알면 "**Bauhaus 스타일로**"처럼 한 단어로 분위기를 정할 수 있어요.

### 주제 1 · 디자인 스타일 32가지

두 가지 스타일 목록(모션 효과 20가지, 디자인 스타일 20가지)에서 겹치는 것을 합쳤어요.\
카드마다 그 스타일이 실제로 움직이는 짧은 예시가 나와요.

```gallery 3 fold
demo:minimalism | Minimalism · 미니멀리즘 | 여백을 넓게, 요소는 최소로
demo:swiss | Swiss Style · 스위스 스타일 | 격자와 산세리프로 반듯하게
demo:editorial | Editorial · 에디토리얼 | 잡지처럼 큰 제목과 글 배치
demo:bento | Bento Grid · 벤토 그리드 | 도시락처럼 칸을 나눈 카드 배치
demo:kinetic | Kinetic Typography · 키네틱 타이포그래피 | 글자가 움직이며 말하는 영상
demo:scramble | Text Scramble · 텍스트 스크램블 | 글자가 뒤섞이다 제자리를 찾는 효과
demo:line | Line Animation · 라인 애니메이션 | 선이 그려지며 모양을 만드는 효과
demo:morph | Shape Morph · 셰이프 모프 | 도형이 다른 도형으로 바뀌는 효과
demo:squash | Squash and Stretch · 스쿼시 앤 스트레치 | 찌그러졌다 늘어나며 탄력 있게
demo:liquid | Liquid Motion · 리퀴드 모션 | 물처럼 흐르고 녹아드는 움직임
demo:zoom | Infinite Zoom · 인피니트 줌 | 끝없이 안으로 들어가는 확대
demo:glitch | Glitch · 글리치 | 화면이 깨지고 지직거리는 효과
demo:bauhaus | Bauhaus · 바우하우스 | 원·삼각형·사각형과 원색
demo:memphis | Memphis Design · 멤피스 | 알록달록한 도형과 패턴
demo:brutal | Neo Brutalism · 네오 브루탈리즘 | 굵은 테두리, 강한 색, 거친 그림자
demo:maximal | Maximalism · 맥시멀리즘 | 색과 요소를 꽉 채우는 화려함
demo:popart | Pop Art · 팝 아트 | 만화 같은 망점과 원색
demo:halftone | Halftone · 하프톤 | 인쇄물 같은 점(망점) 질감
demo:riso | Risograph · 리소그래프 | 어긋난 색판과 거친 인쇄 질감
demo:collage | Collage · 콜라주 | 사진·종이를 오려 붙인 느낌
demo:paper | Paper Cutout · 페이퍼 컷아웃 | 종이를 오려 겹친 입체감
demo:clay | Claymorphism · 클레이모피즘 | 말랑한 점토 같은 3D
demo:glass | Glassmorphism · 글래스모피즘 | 반투명 유리처럼 흐린 배경
demo:grain | Grainy Gradient · 그레이니 그라디언트 | 거친 입자가 섞인 그라디언트
demo:holo | Holographic · 홀로그래픽 | 무지갯빛으로 바뀌는 표면
demo:chrome | Y2K Chrome · Y2K 크롬 | 2000년대풍 반짝이는 금속 글자
demo:vapor | Vaporwave · 베이퍼웨이브 | 80~90년대 네온과 보라·분홍
demo:cyber | Cyberpunk · 사이버펑크 | 어두운 도시와 네온 빛
demo:pixel | Pixel Art · 픽셀 아트 | 레트로 게임 같은 도트 그림
demo:lowpoly | Low Poly · 로우 폴리 | 적은 면으로 각지게 만든 3D
demo:iso | Isometric · 아이소메트릭 | 비스듬히 내려다본 입체 도식
demo:deco | Art Deco · 아르데코 | 금빛 선과 대칭 장식
```

---

### 주제 2 · 모션 효과 기본

스타일이 "**어떻게 생겼는지**"라면, 모션 효과는 "**어떻게 움직이는지**"예요.\
효과 이름을 알면 클로드에게 움직임을 정확하게 주문할 수 있어요.

**① 속도 곡선 (이징)** — 같은 거리를 같은 시간 동안 움직여도, 속도를 어떻게 바꾸느냐에 따라 느낌이 달라요.

```gallery 3
demo:ease-linear | Linear · 리니어 | 처음부터 끝까지 같은 속도, 기계적인 느낌
demo:ease-ease-in | Ease In · 이즈 인 | 천천히 출발해 점점 빨라짐, 퇴장에 어울림
demo:ease-ease-out | Ease Out · 이즈 아웃 | 빠르게 들어와 부드럽게 멈춤, 등장에 어울림
demo:ease-ease-in-out | Ease In-Out · 이즈 인아웃 | 천천히 출발해 천천히 멈춤, 가장 자연스러움
demo:ease-back | Back (Overshoot) · 오버슈트 | 목표를 살짝 지나쳤다 돌아옴, 통통 튀는 느낌
demo:ease-bounce | Bounce · 바운스 | 끝에서 몇 번 튕기다 멈춤
demo:ease-elastic | Elastic · 일래스틱 | 고무줄처럼 앞뒤로 출렁이다 멈춤
demo:ease-steps | Steps · 스텝 | 부드럽지 않고 칸칸이 끊어서 이동
demo:ease-anticipation | Anticipation · 예비 동작 | 반대쪽으로 살짝 물러났다가 출발
```

<div class="more-fold is-folded" data-fold>
<div class="more-body">

**② 나타나기 · 사라지기** — 요소가 화면에 들어오고 나가는 방법이에요.

```gallery 3
demo:fade-in | Fade In · 페이드 인 | 투명했다가 서서히 나타남
demo:fade-out | Fade Out · 페이드 아웃 | 서서히 투명해지며 사라짐
demo:slide-in | Slide In · 슬라이드 인 | 화면 밖에서 미끄러져 들어옴
demo:scale-in | Scale In (Pop) · 스케일 인 | 작은 점에서 커지며 톡 나타남
demo:blur-in | Blur In · 블러 인 | 흐릿했다가 또렷해짐
demo:wipe | Wipe (Mask Reveal) · 와이프 | 가려진 막이 걷히듯 드러남
demo:flip-in | Flip In · 플립 인 | 카드를 뒤집듯 회전하며 나타남
demo:drop-in | Drop In · 드롭 인 | 위에서 떨어져 살짝 튕기며 자리 잡음
demo:letter-rise | Letter Rise · 글자 올라오기 | 글자가 한 자씩 아래에서 솟아오름
```

**③ 움직임 연출** — 여러 요소나 반복 움직임으로 리듬을 만드는 방법이에요.

```gallery 3
demo:stagger | Stagger · 스태거 | 여러 요소가 차례차례 시간차로 등장
demo:typewriter | Typewriter · 타자기 | 글자가 한 자씩 입력되듯 나타남
demo:spin | Rotate (Spin) · 회전 | 제자리에서 한 바퀴 돌기
demo:parallax | Parallax · 패럴랙스 | 가까운 것은 빠르게, 먼 것은 느리게 움직여 깊이감
demo:pulse | Pulse · 펄스 | 커졌다 작아지기를 반복하며 강조
demo:path | Motion Path · 모션 패스 | 정해 둔 곡선 경로를 따라 이동
demo:shake | Shake · 셰이크 | 좌우로 흔들어 경고·오답을 표현
demo:countup | Count Up · 카운트 업 | 숫자가 0부터 목표값까지 올라감
demo:orbit | Orbit · 궤도 | 중심을 두고 빙글빙글 도는 움직임
```

**④ 화면 전환 (트랜지션)** — 한 장면에서 다음 장면으로 넘어가는 방법이에요.

```gallery 3
demo:tr-crossfade | Crossfade (Dissolve) · 디졸브 | 앞 장면이 녹아들며 다음 장면으로
demo:tr-push | Push · 밀어내기 | 다음 장면이 앞 장면을 밀어내며 등장
demo:tr-iris | Iris · 원형 와이프 | 가운데 원이 커지며 다음 장면이 열림
demo:tr-zoom-through | Zoom Through · 줌 관통 | 앞 장면 속으로 뚫고 들어가듯 전환
demo:tr-split | Split · 화면 가르기 | 앞 장면이 반으로 갈라지며 열림
demo:tr-cover | Cover (Slide Over) · 덮기 | 다음 장면이 옆에서 미끄러져 덮음
```

> 💡 클로드에게 말할 때는 "제목은 **ease-out**으로 0.6초 동안 **slide in**, 키워드는 0.1초 간격 **stagger**"처럼 효과 이름과 시간을 함께 적으면 원하는 움직임에 가까워져요.

</div>
<button type="button" class="btn btn-secondary btn-sm fold-toggle" data-fold-toggle aria-expanded="false"><span class="fold-more">전체 보기 (모션 효과 33가지)</span><span class="fold-less">접기</span></button>
</div>

---

### 주제 3 · 효과음

클로드가 모션 그래픽은 잘 만들어도, 효과음까지 어울리게 넣기는 쉽지 않아요.\
효과음을 **찾고, 넣고, 만드는** 데 쓰는 무료 도구 세 가지예요.

**① Openverse API — 효과음 찾기**

```bookmarks
Openverse | https://openverse.org | 자유 이용 오디오 검색 (API: api.openverse.org)
```

워드프레스(WordPress.org)가 운영하는 자유 이용 미디어 검색이에요. 오디오가 약 522만 개 모여 있고(2026-11-01 통계), 효과음은 주로 Freesound에서 와요.\
계정이나 키 없이 주소만으로 검색할 수 있어서, 클로드에게 그대로 맡기면 돼요.

```prompt Openverse로 효과음 찾기
Openverse API(https://api.openverse.org/v1/audio/?q=whoosh&license=cc0)로
영상에 쓸 whoosh 효과음을 3개 찾아서 내려받아 줘.
각 파일의 출처와 라이선스(attribution)는 credits.txt에 적어 줘.
```

- ✔ 검색어는 영어로: whoosh(휙), pop(톡), click(딸깍), swoosh(쉭) 등
- ✔ `license=cc0`를 붙이면 출처 표시 없이 쓸 수 있는 소리만 나와요. 상업적 이용까지 하려면 `license_type=commercial`
- ✔ 결과마다 `license`(라이선스)와 `attribution`(출처 표시 문구)이 함께 와요

> ⚠️ 파일마다 라이선스가 달라요. `by`는 출처 표시가 필요하고, `nc`가 붙은 것은 비상업적으로만 쓸 수 있어요. 키 없이 쓰면 1분에 20번, 하루 200번까지 검색할 수 있어요.

**② Real SFX — 필요한 순간에 효과음 넣기**

```bookmarks
Real SFX | https://clipwing.pro/skills/real-sfx | 영상 속 필요한 순간에 효과음을 넣어 주는 클로드 스킬
```

Clipwing이 만든 클로드 코드 스킬이에요. 영상을 살펴서 소리가 필요한 순간을 찾고, **내가 가진 효과음 파일**을 그 자리에 넣어 줘요. 소리를 새로 만들지는 않아요.

1. Python 3.9 이상과 FFmpeg를 설치해요 (맥은 `brew install ffmpeg-full`)
2. 스킬을 내려받아 클로드 스킬 폴더에 복사하고 클로드 코드를 다시 시작해요
3. 효과음 폴더를 연결해요. 효과음이 없으면 `--uisfx`로 기본 UI 효과음 78개(CC0)를 쓸 수 있어요
4. 클로드에게 "**add sound design to this render**"라고 요청해요
5. 효과음이 들어간 `_sfx.mp4`와 효과음만 담긴 `_sfx_track.wav`가 나와요. 클로드는 소리를 듣지 못하니 꼭 직접 들어 봐요

```prompt 스킬 설치 (맥 터미널)
git clone https://github.com/Clipwing/skills.git clipwing-skills
mkdir -p ~/.claude/skills
cp -R clipwing-skills/skills/real-sfx ~/.claude/skills/
```

**③ earshot — 효과음 만들기**

```bookmarks
earshot | https://github.com/Leonxlnx/earshot | 코드로 효과음을 만들고 영상용 사운드 키트를 설계하는 오픈소스(MIT)
```

맞는 효과음을 끝내 못 찾았을 때, 코드로 새 효과음을 만들고 영상 전체에 맞는 사운드 키트를 설계해요. MIT 오픈소스이고 그래픽카드 없이 돌아가요.\
클로드 코드에 MCP 서버로 연결해서 써요. 처음 쓸 때 모델을 약 1.1GB 내려받아요.

```prompt earshot 효과음 만들기 예시 (설치 후)
earshot sfx list --kind whoosh
earshot sfx render whoosh_fast/crisp -o w.wav --dur 0.8 --apex 0.32
earshot kit init --preset calm -o audio/kit.json
earshot kit render audio/kit.json --out audio/kit
```

> 💡 설치가 Python 가상환경·torch·ffmpeg까지 필요해서 셋 중 가장 어려워요. 처음이라면 ① Openverse로 찾아 보고, 부족할 때 ③을 써 보세요. 설치 방법은 earshot 저장소의 README를 클로드에게 읽히고 "이대로 설치해 줘"라고 맡기면 편해요.

## 🚀 파트 2 · 프롬프트 한 줄로 바로 시작해보기

같은 요청("흰 화면에 노션톡 홍보 타이포그래피 영상 15초")을 두 가지 방법으로 맡기고 결과를 비교해요.

### 방법 1 · 바로 제작하기

먼저 아무 준비 없이 한 줄로 맡겨 봐요. 로고 이미지를 함께 첨부해요.

```gallery 3
logo.png | 실험 자료 · 노션톡 로고 | 방법 1·2 모두 이 로고 이미지를 첨부했어요
```

```prompt ① 바로 만들기
흰 화면에 NotionTalk을 홍보하는 타이포그래피 영상을 15초짜리로 제작해봐.
notiontalk.com 홈페이지에 들어가고, 다음 로고 이미지를 고화질로 해서 키컬러 뽑고 만들어줘.
화면 전환 효과도 3번 정도 넣어줄래?
```

- ✔ 한 번 주고받는 것으로 15초 MP4 완성본이 나왔어요
- ✔ 로고에서 키컬러 `#1D5453`을 뽑고, 글꼴은 Pretendard 하나를 썼어요
- ✔ 전환은 원형 와이프 · 세로 밀어내기 · 줌 관통, 소리는 없었어요

> 💡 빠르게 감만 잡기에는 충분해요. 결과를 보고 "내 생각과 다른 부분"을 적어 두면 아래 방법 2로 넘어갈 때 훨씬 수월해요.

---

### 방법 2 · 기획 문서부터 꼼꼼하게

같은 요청을 이번에는 문서부터 만들고, 단계마다 점검하면서 영상을 완성해요.

### 방법 2-1 · 기획 문서 먼저

같은 요청 끝에 문서를 먼저 만들자는 한 줄만 붙여요. 영상은 아직 만들지 않아요.

```prompt ② 기획 문서 먼저
흰 화면에 NotionTalk을 홍보하는 타이포그래피 영상을 15초짜리로 제작해봐.
notiontalk.com 홈페이지에 들어가고, 다음 로고 이미지를 고화질로 해서 키컬러 뽑고 만들어줘.
화면 전환 효과도 3번 정도 넣고 싶은데
먼저 story-line.md, motion.md, design.md를 생성해보자.
```

- ✔ 첫 결과물은 영상이 아니라 기획 문서 3개예요
- ✔ 클로드가 "**제가 임의로 정한 부분이라 확인해 주세요**"라며 화면 비율, 소리, 마지막 버튼 문구를 먼저 물어봤어요

> 💡 문서를 읽으면서 클로드가 정한 것을 영상이 나오기 전에 고칠 수 있어요. 이게 바로 제작하기와의 가장 큰 차이예요.

### 방법 2-2 · 스틸컷 분석

마음에 드는 장면 캡처(스틸컷)를 몇 장 첨부해서 분석을 받아요.

```bookmarks
핀터레스트 | https://www.pinterest.com/ | 스틸컷 레퍼런스 찾기
```

```prompt ③ 스틸컷 분석
스틸컷 레퍼런스를 다음과 같이 첨부할게.
스틸컷을 분석한 뒤, Still-Cut.md 로 문서를 정리해줘.
```

1. 클로드가 **Still-Cut.md**에 분석과 제안을 번호로 정리해 줘요
2. 영상에 반영할 제안 번호를 골라 말해요
3. 이번에는 스틸컷 3장에서 원통 타이포, 키워드 궤도 연출을 가져왔어요

### 방법 2-3 · 하이라이트 5초

15초 전체를 만들기 전에 가장 중요한 5초만 먼저 받아 방향을 확인해요.

```prompt ④ 하이라이트 미리보기
다음 문서들을 모두 참고해서 15초짜리 영상을 제작해보기 전에 하이라이트 부분 5초만 미리 만들어봐.
```

> 💡 방향이 다르면 여기서 고치는 게 전체를 다시 만드는 것보다 훨씬 빨라요.

### 방법 2-4 · 글꼴 지정

본문용과 강조용 글꼴을 나눠서 지정해요. 웹폰트 코드를 그대로 붙여 넣으면 돼요.

```bookmarks
눈누 | https://noonnu.cc/ | 무료 한글 글꼴 찾기 · 웹폰트 코드 복사
```

```prompt ⑤ 글꼴 지정
일반적인 텍스트는 프리텐다드로 가주고, 강조하는 폰트의 경우에는 다음 리아체를 활용해보자.

@font-face {
    font-family: 'Ria';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2410-1@1.0/RiaSans-ExtraBold.woff2') format('woff2');
    font-weight: normal;
    font-display: swap;
}
```

- ✔ 강조 글꼴을 바꾸자 숫자 폭, 자간, 로고와 겹침 문제를 클로드가 스스로 찾아 고쳤어요
- ✔ 굵기가 하나뿐인 리아체로는 "굵기가 얇아지는" 연출이 안 돼서, 클로드가 A안·B안을 내고 고르게 했어요

### 방법 2-5 · 한 번에 피드백

전체 영상을 보고 고칠 점을 **몇 초쯤, 무엇이, 왜** 마음에 안 드는지 번호를 붙여 한 번에 말해요.

```prompt ⑥ 한 번에 피드백
1. 4~5초 사이에 굳이 의미없게 가볍게 폰트가 바뀌는 것 같은데.
2. 한 번 정도는 노션톡의 초록색 키컬러가 배경 색이 되는 구간이 있으면 좋을 것 같아.
3. 12초 쯤부터 나오는 노션톡은 리아체를 쓰지 말고, 노션톡 로고 이미지를 활용해줘. 첨부할게 현재는 흰색글씨라서 검정색으로만 변환해줘.
4. 효과음과 배경음악도 어울리게 넣어볼래?
```

- ✔ 번호를 붙이면 하나씩 빠짐없이 고쳐줘요
- ✔ 외부 음원 없이 코드로 배경음악과 효과음을 만들어 넣었어요
- ✔ 최종 전환은 정리 스냅 · 세로 밀기 · 말풍선 아이리스가 됐어요

---

### 결과 비교

```gallery
direct.mp4 | 방법 1 · 바로 제작하기 | 한 줄 요청, 한 번에 나온 15초 영상
docs-first.mp4 | 방법 2 · 기획 문서부터 꼼꼼하게 | 문서·레퍼런스·글꼴·피드백을 거친 최종본
```

| | 바로 제작하기 | 기획 문서부터 꼼꼼하게 |
|---|---|---|
| 주고받은 횟수 | 1번 | 6번 |
| 첫 결과물 | 15초 MP4 완성본 | 기획 문서 3개 (영상은 아직) |
| 글꼴 | Pretendard 하나 | 본문 Pretendard + 강조 리아체 |
| 전환 효과 | 원형 와이프 · 세로 밀어내기 · 줌 관통 | 정리 스냅 · 세로 밀기 · 말풍선 아이리스 |
| 레퍼런스 | 없음 | 스틸컷 3장 → 원통 타이포, 키워드 궤도 |
| 소리 | 무음 | 코드로 만든 배경음악 + 효과음 |
| 남는 것 | 영상, 로고 파일 | 영상 + 문서 4개 (다음 영상에 재사용) |

> 💡 바로 제작하기는 **빠르게 한 번에**, 기획 문서부터 가기는 **내 생각대로 고쳐 가기**에 좋아요. 키컬러는 두 방식 모두 로고에서 뽑은 `#1D5453`으로 같았어요.

## 🔍 파트 3 · 레퍼런스 영상 분석을 통한 영상 제작하기

```bookmarks
Remotion | https://www.remotion.dev/ | React 코드로 영상을 만들고 MP4로 렌더링하는 도구
Skillry · Opus 5.5 영상 모음 | https://skillry.dev/ai-videos/opus-5-5 | Claude Opus 5.5로 만든 화제의 영상과 다시 만든 결과, 실제 쓴 프롬프트
Motion Prompt | https://showheyohtaki.github.io/motion-prompt/ | AI에게 부탁할 때 쓰는 효과 "이름" 사전 · 움직이는 견본과 요청 예시 (MIT)
snapcn 컴포넌트 | https://snapcn.dev/docs/components | Remotion용 글자 애니메이션·자막·로고·장면 컴포넌트 모음
```

> 💡 이 파트 자료는 정리하고 있어요. 곧 채워 둘게요.

## ✨ 파트 4 · 다양한 스타일의 영상 제작

> 💡 이 파트 자료는 정리하고 있어요. 곧 채워 둘게요.

## 💬 파트 5 · 내 영상에 내레이션 첨가하기

> 💡 이 파트 자료는 정리하고 있어요. 곧 채워 둘게요.

## 🛠 파트 6 · 외부 툴을 활용한 고감도 영상 제작

> 💡 이 파트 자료는 정리하고 있어요. 곧 채워 둘게요.

## ⚠️ 자주 묻는 질문

### 어떤 방식으로 시작하는 게 좋아요?

처음이라면 방법 1처럼 프롬프트 한 줄로 감을 잡아 보세요. 여러 번 고칠 영상이거나 결과가 마음에 들지 않으면 방법 2처럼 문서부터 만드는 게 좋아요. 문서는 다음 영상을 만들 때도 그대로 다시 쓸 수 있어요.

### 강조 글꼴은 아무거나 써도 돼요?

글꼴마다 쓸 수 있는 범위가 달라요. 리아체는 롯데GRS 저작권 글꼴이라, 영상을 공개하기 전에 눈누 배포 페이지에서 영상·상업적 사용 범위를 꼭 확인해요.

### 배경음악도 만들어줘요?

네. 이번에는 외부 음원 없이 코드로 배경음악과 효과음을 만들었어요. 다만 클로드는 소리를 직접 듣지 못하고 파형과 타이밍으로만 확인하니, 꼭 들어 보고 어색한 부분을 알려 주세요. 소리만 다시 만들면 돼서 영상은 다시 렌더하지 않아도 돼요.
