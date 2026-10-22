// survival/app.js — 선택형 텍스트 RPG 엔진 (표지 → 장면·선택 → 결과 → 결말 기록 PNG)
(() => {
  // 기록(편) 목록 · 2편 결말은 1편의 등급·색·확률·추천 괴담을 물려받고 글만 바꿈
  const EPS = [];   // 10/22 자기야: 1편(지하 4층)은 빼고 2편(인외 · 00호)만 공개 · 1편 데이터는 결말 등급·색 틀로만 씀
  if (window.STORY2) {
    const e2 = window.STORY2, en = {};
    Object.keys(window.STORY.endings).forEach((k) => { en[k] = { ...window.STORY.endings[k], ...(e2.endings[k] || {}) }; });
    EPS.push({ ...e2, endings: en });
  }
  let S = EPS[0];
  const $ = (id) => document.getElementById(id);
  let name = "", photo = null, photoUrl = "", i = 0, step = 0, endKey = null, st = {}, ax = {}, path = [];
  // 갈래 길(10/22): 장면에 id, 선택지에 go(다음 장면 id) · end(결말 키, "solo" = 동행 점수로 안전/관찰) · 없으면 다음 칸
  const sceneAt = (id) => S.scenes.findIndex((x) => x.id === id);
  const caseNo = String(Math.floor(1000 + Math.random() * 9000));

  // 받침에 맞는 조사
  const batchim = (w) => { const c = String(w).trim().slice(-1).charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : /[lmnr]$/i.test(w); };
  // 00호 성별 (10/22): {그} = 그/그녀 · {{남|여}} 묘사 갈림 · 그림은 여성판(fimg·fcover)으로
  let gender = "m";
  const gtxt = (t) => String(t).replace(/\{그\}/g, gender === "f" ? "그녀" : "그").replace(/\{\{([^|{}]*)\|([^{}]*)\}\}/g, (m, a, b) => (gender === "f" ? b : a));
  const coverKey = () => (gender === "f" && S.fcover) || S.cover || "cover";
  const imgKey = (sc) => (gender === "f" && S.fimg ? S.fimg[sc.id] || null : sc.img);
  const fill = (t) => { const b = batchim(name); return gtxt(t).replace(/\{N\}\{은\}/g, name + (b ? "은" : "는")).replace(/\{N\}\{이\}/g, name + (b ? "이" : "가")).replace(/\{N\}\{을\}/g, name + (b ? "을" : "를")).replace(/\{N\}\{와\}/g, name + (b ? "과" : "와")).replace(/\{N\}\{아\}/g, name + (b ? "아" : "야")).replace(/\{N\}/g, name); };

  // 이야기 줄나눔 (10/22 자기야): 따로 선 대사 "…" 는 앞뒤 서술과 줄을 나눔 · "…"라는/하고 처럼 붙은 대사는 그대로
  function brk(t) {
    let out = "", open = false;
    const s = Array.from(t);
    s.forEach((ch, k) => {
      if (ch === '"') {
        if (!open) { if (k > 0 && s[k - 1] === " " && /[.!?…]/.test(s[k - 2] || "")) out = out.replace(/ $/, "\n"); open = true; }
        else { open = false; out += ch; if (s[k + 1] === " ") { out += "\n"; s[k + 1] = ""; } return; }
      }
      out += ch;
    });
    return out;
  }

  // 그림: img/<key>.webp|jpg|png 가 있으면 그걸, 없으면 안개 배경
  function setArt(imgEl, key) {
    imgEl.classList.add("hide");
    const tries = ["webp", "jpg", "png"].map((x) => `img/${key}.${x}`);
    const next = () => { const u = tries.shift(); if (!u) return; const im = new Image(); im.onload = () => { imgEl.src = u; imgEl.classList.remove("hide"); }; im.onerror = next; im.src = u; };
    next();
  }
  // ── 표지: 기록 고르기 (1편·2편) ──
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 표지: 00호 고르기 (그 / 그녀) — 편에 여성판(fcover)이 있을 때만
  function drawGender() {
    const box = $("gender"); if (!box) return;
    if (!S.fcover) { box.classList.add("hide"); return; }
    box.classList.remove("hide");
    box.innerHTML = `<p class="label">유리 너머의 00호</p><div class="gsel">${[["m", "그", S.cover], ["f", "그녀", S.fcover]].map(([k, t, im]) => `<button type="button" class="gbtn" data-g="${k}" aria-pressed="${gender === k}"><span class="gimg" style="background-image:url(img/${im}.webp)"></span><b>${t}</b></button>`).join("")}</div>`;
    box.querySelectorAll(".gbtn").forEach((b) => b.addEventListener("click", () => { gender = b.dataset.g; $("coverLead").textContent = gtxt(S.lead); setArt($("coverImg"), coverKey()); drawGender(); }));
  }
  function pickEp(n) {
    S = EPS[n];
    document.querySelectorAll(".ep").forEach((b, k) => b.setAttribute("aria-selected", String(k === n)));
    $("coverArt").className = `art ${S.mood || ""}`;
    $("coverChips").innerHTML = `<span class="chip horror">괴담</span>` + S.chips.map((c, k) => `<span class="chip${k === 0 ? " mono" : ""}">${esc(c)}</span>`).join("");
    $("coverKicker").textContent = `DOPA 기록보관소 · 기록 ${String(n + 1).padStart(2, "0")}`;
    $("coverTitle").textContent = S.title;
    $("coverLead").textContent = gtxt(S.lead);
    drawGender();
    $("coverRules").innerHTML = S.rules.map((r, k) => `<li><b>0${k + 1}</b><span>${esc(r).replace(/, /g, ",<br>")}</span></li>`).join("");
    $("start").textContent = S.id === "ep2" ? "관측 시작" : "순찰 시작";
    $("again").textContent = S.id === "ep2" ? "다른 캐릭터로 다시 관측" : "다른 캐릭터로 다시 순찰";
    setArt($("coverImg"), coverKey());
  }
  $("eps").innerHTML = EPS.map((e, k) => `<button type="button" class="ep" role="tab" aria-selected="false"><b>기록 ${String(k + 1).padStart(2, "0")} · ${esc(e.code)}${k === EPS.length - 1 && k > 0 ? '<i class="new">NEW</i>' : ""}</b><span>${esc(e.title)}</span></button>`).join("");
  document.querySelectorAll(".ep").forEach((b, k) => b.addEventListener("click", () => pickEp(k)));
  if (!EPS.length) EPS.push(window.STORY);
  if (EPS.length < 2) $("eps").classList.add("hide");
  pickEp(0);

  // ── 표지 ──
  $("name").addEventListener("input", (e) => { name = e.target.value.trim(); $("start").disabled = !name; });
  $("pick").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { photo = im; photoUrl = r.result; $("thumb").style.backgroundImage = `url(${r.result})`; }; im.src = r.result; }; r.readAsDataURL(f);
  });
  $("start").addEventListener("click", () => {
    if (!name) return;
    i = 0; step = 0; endKey = null; st = { ...S.start }; ax = { rule: 0, caution: 0, curious: 0, bond: 0, mirror: 0 }; path = [];
    $("log").innerHTML = "";
    $("cover").classList.add("hide"); $("end").classList.add("hide"); $("topbar").classList.add("hide"); $("play").classList.remove("hide");
    window.scrollTo({ top: 0 }); scene();
  });

  // ── 위쪽 상태 줄 (도파 플레이 화면처럼: 시간 + 알약 칩) ──
  const ICON = {
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    hp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>',
    san: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    bat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3"/></svg>',
    lock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',   /* 결정 잠김 */
  };
  const LABEL = { hp: "체력", san: "정신", bat: "배터리" };
  const MAX = { hp: 3, san: 5, bat: 3 };
  function drawStats(hit = []) {
    const sc = S.scenes[i] || {}; const when = String(sc.tag || "").split("·")[0].trim();
    $("playbar").innerHTML = (photoUrl ? `<span class="me" style="background-image:url(${photoUrl})" title="${esc(name)}"></span>` : "") + `<span class="when">${ICON.moon}${when}</span>` + ["hp", "san", "bat"].map((k) => `<span class="pchip${hit.includes(k) ? " hit" : ""}${st[k] <= 1 ? " low" : ""}" aria-label="${LABEL[k]} ${st[k]}">${ICON[k]}${LABEL[k]} ${st[k]}</span>`).join("");
  }

  // ── 이야기 기록 (위로 계속 쌓임) ──
  const log = () => $("log");
  function reveal(ps) { ps.forEach((p, n) => setTimeout(() => p.classList.add("in"), 120 + n * 380)); }
  // 장면 머리: 그림 대신 분위기 띠 (조명 색 + 안개 + 숨 쉬듯 일렁임 · 10/22 자기야 "그림은 분위기만") · img/<key>.* 가 있으면 어둡게 깔아 줌
  const LIGHT = { red: "240,24,94", cold: "125,211,252", gas: "94,234,212", green: "52,211,153", amber: "251,191,36" };
  function lightOf(sc) {
    const t = sc.tag || "";
    if (/비상|금이|05:15/.test(t)) return "red";
    if (/03:00/.test(t)) return "gas";
    if (/05:59|최종/.test(t)) return "green";
    if (/의무|녹음|감시|회선|무전/.test(t)) return "amber";
    return S.mood || "red";
  }
  function addMood(sc) {
    const [when, ...rest] = String(sc.tag || "").split("·").map((x) => x.trim());
    const c = LIGHT[lightOf(sc)], x = 20 + ((step * 37) % 60), y = 30 + ((step * 23) % 40);
    const box = document.createElement("div"); box.className = "mood";
    box.style.setProperty("--mbg", `radial-gradient(ellipse 45% 70% at ${x}% ${y}%, rgba(${c},.62), transparent 72%), radial-gradient(ellipse 90% 60% at ${100 - x}% 115%, rgba(${c},.26), transparent 70%), linear-gradient(90deg, transparent, rgba(${c},.10) ${x}%, transparent), linear-gradient(160deg, #1d1e22, #0b0c0e)`);
    box.style.setProperty("--mline", `rgb(${c})`);
    box.innerHTML = `<div class="mt">${esc(when)} · ${sc.mark || `기록 ${String(step).padStart(2, "0")}`}</div><div class="mp">${esc(rest.join(" · ") || S.title)}</div>`;
    log().appendChild(box);
    const ik = sc.mark ? sc.img : imgKey(sc);
    if (ik) { const tries = ["webp", "jpg", "png"].map((e) => `img/${ik}.${e}`); const next = () => { const u = tries.shift(); if (!u) return; const t = new Image(); t.onload = () => { const im = document.createElement("img"); im.alt = ""; im.src = u; const cr = S.crop && S.crop[ik]; if (cr) { im.style.transform = `scale(${cr[0]})`; im.style.transformOrigin = `${cr[1]}% ${cr[2]}%`; } const sh = document.createElement("div"); sh.className = "cgshade"; box.prepend(sh); box.prepend(im); box.classList.add("cg"); }; t.onerror = next; t.src = u; }; next(); }
    return box;
  }
  // 아래: 선택지 카드 (입력창처럼 보이면 직접 쓸 수 있는 줄 알아서 · 10/22 자기야) · 고른 뒤엔 '계속' 버튼
  function setDock(choices, next) {
    const sg = $("sugg"); sg.innerHTML = "";
    $("pnum").textContent = `기록 ${String(step).padStart(2, "0")}`;
    if (choices) {
      const hint = document.createElement("div"); hint.className = "hint"; hint.textContent = "어떻게 할까?"; sg.appendChild(hint);
      choices.forEach((c, n) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "opt";
        b.innerHTML = `<span class="n">${n + 1}</span><span></span>`; b.querySelectorAll("span")[1].textContent = fill(c.t);
        if (c.need === "bat") { const k = document.createElement("i"); k.className = "cost"; k.textContent = "배터리 −1"; b.querySelectorAll("span")[1].appendChild(k); }
        if (c.need === "bat" && st.bat <= 0) { b.disabled = true; const sm = document.createElement("small"); sm.textContent = "배터리가 없다"; b.querySelectorAll("span")[1].appendChild(sm); }
        b.addEventListener("click", () => choose(c)); sg.appendChild(b);
      });
    } else if (next) {
      const nb = document.createElement("button"); nb.type = "button"; nb.className = "btn main"; nb.textContent = next.label; nb.addEventListener("click", next.go); sg.appendChild(nb);
    }
  }
  function scene() {
    const sc = S.scenes[i]; step++;
    drawStats(); const mood = addMood(sc); requestAnimationFrame(() => mood.classList.add("in"));
    const ps = sc.text.map((t) => { const p = document.createElement("p"); p.textContent = brk(fill(t)); log().appendChild(p); return p; });
    reveal(ps); setDock(sc.choices);
    if (step > 1) setTimeout(() => mood.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
  function choose(c) {
    path.push(c.t);
    const hit = []; const deltas = [];
    Object.entries(c.fx || {}).forEach(([k, v]) => {
      if (k in st) { st[k] = Math.max(0, Math.min(MAX[k] + 1, st[k] + v)); hit.push(k); deltas.push([k, v]); }
      else ax[k] = (ax[k] || 0) + v;
    });
    drawStats(hit.filter((k) => (c.fx[k] || 0) < 0));
    const mine = document.createElement("p"); mine.className = "mine"; log().appendChild(mine);
    if (photoUrl) {   /* 내 선택 줄 = 채팅처럼 큰 캐릭터 사진 + 이름 + 고른 행동 (10/22 "너무 찌깐하다") */
      mine.classList.add("has-av");
      const av = document.createElement("span"); av.className = "av"; av.style.backgroundImage = `url(${photoUrl})`; mine.appendChild(av);
      const box = document.createElement("span"); box.className = "say"; const nm = document.createElement("b"); nm.textContent = name; box.appendChild(nm); box.appendChild(document.createTextNode(fill(c.t))); mine.appendChild(box);
    } else mine.textContent = fill(c.t);
    const meta = document.createElement("div"); meta.className = "meta"; meta.innerHTML = `<span>${ICON.lock}이미 내린 결정은 되돌릴 수 없다</span><span>${path.length}턴</span>`; log().appendChild(meta);
    const p = document.createElement("p"); p.textContent = brk(fill(c.r)); log().appendChild(p);
    const add = [mine, p];
    if (deltas.length) { const d = document.createElement("div"); d.className = "deltas"; d.innerHTML = deltas.map(([k, v]) => `<span class="delta${v > 0 ? " up" : ""}">${LABEL[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}</span>`).join(""); log().appendChild(d); }
    const dead = st.hp <= 0 ? "hp" : st.san <= 0 ? "san" : null;
    if (dead && S.deathImg && gender === "m") { const cg = addMood({ tag: `${String(S.scenes[i].tag).split("·")[0].trim()} · 기록 중단`, img: S.deathImg, mark: "중단" }); requestAnimationFrame(() => cg.classList.add("in")); }   /* 체력·정신 0 CG (2편) */
    if (dead) { const q = document.createElement("p"); q.textContent = brk(fill(S.deaths[dead])); log().appendChild(q); add.push(q); }
    reveal(add); setTimeout(() => mine.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    if (dead) setDock(null, { label: "기록 열람 ▸", go: () => finish(dead === "hp" ? "lost" : "redacted") });
    else if (c.end) setDock(null, { label: "06:00 · 결말 ▸", go: () => epilogue(c.end) });
    else {
      const nx = c.go ? sceneAt(c.go) : i + 1;
      if (nx >= 0 && nx < S.scenes.length) setDock(null, { label: "계속 ▸", go: () => { i = nx; scene(); } });
      else setDock(null, { label: "06:00 · 결말 ▸", go: () => epilogue() });
    }
  }

  // ── 판정 ──
  function judge(forced) {
    const s = ax.rule + ax.caution - ax.curious * 1.2;
    let key = forced;
    if (!key) {
      if (s >= 7) key = ax.bond >= 4 ? "bond" : "safe";
      else if (s >= 2) key = ax.bond >= 4 ? "bond" : "watch";
      else if (s >= -2) key = ax.mirror ? "redacted" : "contain";
      else key = ax.mirror ? "redacted" : "lost";
    }
    const e = S.endings[key];
    let prob = null;
    if (e.prob) { const [lo, hi] = e.prob; const t = Math.max(0, Math.min(1, (s + 6) / 18)); prob = Math.round(lo + (hi - lo) * t); }
    return { key, e, prob };
  }
  // 결말 후일담 (있는 편만) → 기록 열람
  function epilogue(key) {
    endKey = key === "solo" ? (ax.bond >= 4 ? "watch" : "safe") : key || null;
    const res = judge(endKey);
    endKey = res.key;
    if (!res.e.epi) return finish(endKey);
    const cg = addMood({ tag: `06:00 · ${res.e.title}`, img: gender === "m" ? res.e.img : (S.fend && S.fend[res.key]) || null, mark: "결말" }); requestAnimationFrame(() => cg.classList.add("in"));
    const add = res.e.epi.map((t) => { const p = document.createElement("p"); p.className = "epi"; p.textContent = brk(fill(t)); log().appendChild(p); return p; });
    const m = document.createElement("p"); m.className = "endmark"; m.textContent = `— ${res.e.title} —`; log().appendChild(m); add.push(m);
    reveal(add); setTimeout(() => cg.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    setDock(null, { label: "기록 열람 ▸", go: () => finish(endKey) });
  }
  async function finish(forced) {
    const res = judge(forced);
    $("play").classList.add("hide"); $("topbar").classList.remove("hide"); $("end").classList.remove("hide"); window.scrollTo({ top: 0 });
    await drawCard(res);
    $("save").onclick = () => { const a = document.createElement("a"); a.download = `dopa-${S.code}-${caseNo}.png`; a.href = $("card").toDataURL("image/png"); a.click(); };
    $("copy").onclick = async () => {
      const t = `[DOPA 기록보관소 · ${S.title}]\n요원 ${name} — ${res.e.title}${res.prob != null ? ` (생존 확률 ${res.prob}%)` : " (측정 불가)"}\n"${fill(res.e.last)}"\n\n#도파생존기록 #${S.title.replace(/\s/g, "")} #캐릭터`;
      try { await navigator.clipboard.writeText(t); $("toast").textContent = "복사했어요. 기록 이미지와 같이 올려 보세요."; } catch (e) { $("toast").textContent = t; }
    };
  }
  $("again").addEventListener("click", () => { $("end").classList.add("hide"); $("cover").classList.remove("hide"); $("toast").textContent = ""; window.scrollTo({ top: 0 }); });

  // ── 결말 기록 (1080×1350) ──
  const loadImg = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  async function firstImg(key) { for (const x of ["webp", "jpg", "png"]) { try { return await loadImg(`img/${key}.${x}`); } catch (e) {} } return null; }
  // 카드 글 줄바꿈: 띄어쓰기 단위(단어 안 끊김 · 10/22 자기야) · 한 단어가 한 줄보다 길 때만 글자 단위
  function wrap(ctx, text, maxW) {
    const out = []; let line = "";
    for (const w of String(text).split(" ")) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width <= maxW) { line = t; continue; }
      if (line) out.push(line);
      if (ctx.measureText(w).width <= maxW) { line = w; continue; }
      line = ""; for (const ch of Array.from(w)) { if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
    }
    if (line) out.push(line); return out;
  }
  function cover(ctx, im, x, y, w, h) { const r = Math.max(w / im.width, h / im.height); const sw = w / r, sh = h / r; ctx.drawImage(im, (im.width - sw) / 2, im.height > im.width * 1.1 ? Math.min(im.height * 0.03, im.height - sh) : (im.height - sh) / 2, sw, sh, x, y, w, h); }   /* 세로 그림은 위(얼굴) 기준 */
  function fog(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#3a3b3f"); g.addColorStop(0.6, "#232427"); g.addColorStop(1, "#121314"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);   // 화면 안개와 같은 어두운 톤
    const r = ctx.createRadialGradient(x + w / 2, y + h * 0.62, 0, x + w / 2, y + h * 0.62, w * 0.5); r.addColorStop(0, "rgba(255,255,255,.22)"); r.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = r; ctx.fillRect(x, y, w, h);
    for (let n = 0; n < 9000; n++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1.5, 1.5); }
  }
  async function drawCard({ e, prob }) {
    const c = $("card"), ctx = c.getContext("2d"), W = 1080, H = 1350, AH = 620;
    try { await Promise.all([document.fonts.load("800 60px 'Gowun Batang'"), document.fonts.load("400 30px 'Gowun Batang'"), document.fonts.load("600 24px 'IBM Plex Mono'"), document.fonts.load("700 28px 'Pretendard Variable'")]); } catch (err) {}
    const SERIF = "'Gowun Batang', serif", MONO = "'IBM Plex Mono', monospace", SANS = "'Pretendard Variable', Pretendard, sans-serif";
    ctx.fillStyle = "#121314"; ctx.fillRect(0, 0, W, H);   // 도파 나이트 바탕
    // 위: 그림 (결말 그림 → 없으면 안개) + 캐릭터 사진(흑백 폴라로이드)
    const ek = gender === "m" ? e.img : S.fend && S.fend[Object.keys(S.endings).find((k) => S.endings[k] === e)];
    const ei = (ek && (await firstImg(ek))) || await firstImg(coverKey());   // 결말 CG 없으면 그 편의 인장
    ctx.save(); if (S.id === "ep1") ctx.filter = "grayscale(1) contrast(1.05)"; if (ei) cover(ctx, ei, 0, 0, W, AH); else fog(ctx, 0, 0, W, AH); ctx.restore();   /* 2편 CG 는 색 그대로 */
    const vg = ctx.createLinearGradient(0, AH * 0.45, 0, AH); vg.addColorStop(0, "rgba(18,19,20,0)"); vg.addColorStop(1, "rgba(18,19,20,1)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, AH);
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(60, 56, 470, 50); ctx.fillStyle = "#fff"; ctx.font = `600 22px ${MONO}`; ctx.fillText(`DOPA 기록보관소 · No. D-${S.code.slice(1)}-${caseNo}`, 78, 89);
    if (photo) {
      const pw = 250, ph = 300, px = W - 60 - pw, py = 330;
      ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(0.05); ctx.translate(-(px + pw / 2), -(py + ph / 2));
      ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = "#faf8f3"; ctx.fillRect(px - 14, py - 14, pw + 28, ph + 64); ctx.shadowColor = "transparent";
      ctx.filter = "grayscale(1) contrast(1.1)"; cover(ctx, photo, px, py, pw, ph); ctx.filter = "none";
      ctx.fillStyle = "#3b3833"; ctx.font = `400 26px ${SERIF}`; ctx.textAlign = "center"; ctx.fillText(name, px + pw / 2, py + ph + 38); ctx.textAlign = "left";
      ctx.restore();
    }
    // 아래: 기록
    let y = AH + 20;
    ctx.fillStyle = "#9A9DA2"; ctx.font = `600 24px ${MONO}`; ctx.fillText("요원", 70, y); y += 70;
    ctx.fillStyle = "#F2F2F0"; ctx.font = `800 62px ${SERIF}`; ctx.fillText(wrap(ctx, name, 600)[0], 70, y);
    // 판정 도장
    ctx.save(); ctx.translate(W - 250, AH + 70); ctx.rotate(-0.16); ctx.strokeStyle = e.color; ctx.fillStyle = e.color; ctx.lineWidth = 6; ctx.globalAlpha = 0.88;
    ctx.font = `600 40px ${MONO}`; const sw = ctx.measureText(e.cls).width + 56; ctx.strokeRect(-sw / 2, -42, sw, 84); ctx.lineWidth = 2; ctx.strokeRect(-sw / 2 + 9, -33, sw - 18, 66); ctx.textAlign = "center"; ctx.fillText(e.cls, 0, 14); ctx.restore(); ctx.textAlign = "left";
    y += 84; ctx.fillStyle = e.color; ctx.font = `800 54px ${SERIF}`; ctx.fillText(e.title, 70, y);
    ctx.fillStyle = "#F2F2F0"; ctx.font = `700 32px ${SANS}`; ctx.textAlign = "right"; ctx.fillText(prob != null ? `생존 확률 ${prob}%` : "생존 확률 측정 불가", W - 70, y); ctx.textAlign = "left";
    y += 38; ctx.fillStyle = "#F0185E"; ctx.fillRect(70, y, 80, 4); ctx.fillStyle = "#2A2C2F"; ctx.fillRect(150, y, W - 220, 4); y += 64;
    ctx.font = `400 36px ${SERIF}`; ctx.fillStyle = "#E8E6E2";
    wrap(ctx, `“${fill(e.last)}”`, W - 140).slice(0, 4).forEach((l) => { ctx.fillText(l, 70, y); y += 60; });
    y += 6; ctx.font = `400 25px ${SANS}`; ctx.fillStyle = "#9A9DA2";
    const lim = H - 214;   // '남은 상태' 줄 위까지만
    e.notes.slice(0, 2).forEach((n) => wrap(ctx, `· ${fill(n)}`, W - 140).forEach((ln, k) => { if (y > lim) return; let cx = k ? 92 : 70; ln.split(/(█+)/).forEach((part) => { if (!part) return; const w = ctx.measureText(part).width; if (/^█+$/.test(part)) { ctx.fillStyle = "#F2F2F0"; ctx.fillRect(cx, y - 22, w, 28); ctx.fillStyle = "#9A9DA2"; } else ctx.fillText(part, cx, y); cx += w; }); y += 36; }));
    // 남은 상태 (바닥 바로 위)
    ctx.fillStyle = "#D9FF3F"; ctx.font = `600 24px ${SANS}`; ctx.fillText(`남은 상태  체력 ${st.hp} · 정신 ${st.san} · 배터리 ${st.bat}  ·  선택 ${path.length}번`, 70, H - 170);
    // 바닥
    ctx.fillStyle = "#1B1C1E"; ctx.fillRect(0, H - 130, W, 130); ctx.fillStyle = "#F0185E"; ctx.fillRect(0, H - 130, W, 4);
    // 바닥 띠 (10/22 정리): 왼쪽 = 제목·한 줄 / 오른쪽 = @아이디 + 로고, 띠 세로 가운데에 맞춤 · 왼쪽 글은 오른쪽 묶음 앞에서 끊김
    const BY = H - 130, CY = BY + 65, LW = 52, lx = W - 70 - LW;
    ctx.textAlign = "right"; ctx.font = `600 22px ${MONO}`; ctx.fillStyle = "#f1eee7"; ctx.textBaseline = "middle"; ctx.fillText("@DOPA_studio", lx - 16, CY); const hw = ctx.measureText("@DOPA_studio").width; ctx.textAlign = "left";
    try { const logo = await loadImg("logo.svg"); ctx.save(); ctx.beginPath(); ctx.roundRect(lx, CY - LW / 2, LW, LW, 12); ctx.clip(); ctx.drawImage(logo, lx, CY - LW / 2, LW, LW); ctx.restore(); } catch (err) {}
    const maxL = lx - 16 - hw - 40 - 70;
    const fit = (t) => { let u = t; while (ctx.measureText(u).width > maxL && u.length > 1) u = u.slice(0, -1); return u === t ? t : u.trimEnd() + "…"; };
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f1eee7"; ctx.font = `700 28px ${SANS}`; ctx.fillText(fit(`${S.title} · 내 캐릭터로 해 보기`), 70, CY - 8);
    ctx.font = `400 21px ${SANS}`; ctx.fillStyle = "#9A9DA2"; ctx.fillText(fit("설정을 잊지 않는 AI 인터랙티브 스토리 · 11/5 텀블벅 오픈"), 70, CY + 28);
  }
})();
