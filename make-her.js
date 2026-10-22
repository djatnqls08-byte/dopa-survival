// make-her.js — index.html 을 바탕으로 여성판(그녀) 링크 페이지 her.html 을 만든다 (배포 대상 아님)
//  · 링크 미리보기(OG)만 og-f.png · 여성판 제목/설명으로 바꾸고, 시작 성별을 그녀로 둔다
//  · index.html 을 고친 뒤에는 node make-her.js 로 다시 만들 것
const fs = require("fs");
let s = fs.readFileSync(__dirname + "/index.html", "utf8");
const TITLE = "특수 격리실 00호 · 그녀 · DOPA";
const DESC = "유리 너머의 그녀는 너무 다정하고, 수칙은 서로 부딪쳐요. 내 캐릭터는 지하 5층의 밤을 버틸 수 있을까?";
s = s.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
  .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"/g, `$1${TITLE}"`)
  .replace(/(<meta (?:name="description"|name="twitter:description") content=")[^"]*"/g, `$1${DESC}"`)
  .replace(/(<meta property="og:description" content=")[^"]*"/, `$1대답하지 말 것. 다가가지 말 것. 그래도 그녀는 네 이름을 안다."`)
  .replace(/og\.png\?v=\d+/g, "og-f.png?v=1")
  .replace(/(<meta property="og:url" content=")[^"]*"/, `$1https://dopa-survival.vercel.app/her"`)
  .replace('<script src="data.js"></script>', '<script>window.PRESET_GENDER = "f";</script>\n<script src="data.js"></script>');
fs.writeFileSync(__dirname + "/her.html", s);
console.log("her.html 만듦");
