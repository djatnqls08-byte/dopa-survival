// survival/app.js — 선택형 텍스트 RPG 엔진 (표지 → 장면·선택 → 결과 → 결말 기록 PNG)
(() => {
  const S = window.STORY;
  const $ = (id) => document.getElementById(id);
  let name = "", photo = null, photoUrl = "", i = 0, st = {}, ax = {}, path = [];
  const caseNo = String(Math.floor(1000 + Math.random() * 9000));

  // 받침에 맞는 조사
  const batchim = (w) => { const c = String(w).trim().slice(-1).charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : /[lmnr]$/i.test(w); };
  const fill = (t) => { const b = batchim(name); return String(t).replace(/\{N\}\{은\}/g, name + (b ? "은" : "는")).replace(/\{N\}\{이\}/g, name + (b ? "이" : "가")).replace(/\{N\}\{을\}/g, name + (b ? "을" : "를")).replace(/\{N\}\{와\}/g, name + (b ? "과" : "와")).replace(/\{N\}\{아\}/g, name + (b ? "아" : "야")).replace(/\{N\}/g, name); };

  // 그림: img/<key>.webp|jpg|png 가 있으면 그걸, 없으면 안개 배경
  function setArt(imgEl, key) {
    imgEl.classList.add("hide");
    const tries = ["webp", "jpg", "png"].map((x) => `img/${key}.${x}`);
    const next = () => { const u = tries.shift(); if (!u) return; const im = new Image(); im.onload = () => { imgEl.src = u; imgEl.classList.remove("hide"); }; im.onerror = next; im.src = u; };
    next();
  }
  setArt($("coverImg"), "cover");

  // ── 표지 ──
  $("name").addEventListener("input", (e) => { name = e.target.value.trim(); $("start").disabled = !name; });
  $("pick").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { photo = im; photoUrl = r.result; $("thumb").style.backgroundImage = `url(${r.result})`; }; im.src = r.result; }; r.readAsDataURL(f);
  });
  $("start").addEventListener("click", () => {
    if (!name) return;
    i = 0; st = { ...S.start }; ax = { rule: 0, caution: 0, curious: 0, bond: 0, mirror: 0 }; path = [];
    $("cover").classList.add("hide"); $("end").classList.add("hide"); $("play").classList.remove("hide");
    scene();
  });

  // ── 상태 바 ──
  const ICON = {
    hp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>',
    san: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    bat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3"/></svg>',
  };
  const LABEL = { hp: "체력", san: "정신", bat: "배터리" };
  const MAX = { hp: 3, san: 5, bat: 3 };
  function drawStats(hit = []) {
    $("stats").innerHTML = ["hp", "san", "bat"].map((k) => `<div class="stat${hit.includes(k) ? " hit" : ""}" style="color:${st[k] <= 1 ? "var(--red)" : "inherit"}">${ICON[k]}<div class="pips">${Array.from({ length: Math.max(MAX[k], st[k]) }, (_, n) => `<span class="pip${n < st[k] ? " on" : ""}"></span>`).join("")}</div>${LABEL[k]}</div>`).join("");
  }

  // ── 장면 ──
  function reveal(ps) { ps.forEach((p, n) => setTimeout(() => p.classList.add("in"), 120 + n * 420)); }
  function scene() {
    const sc = S.scenes[i];
    drawStats(); setArt($("sceneImg"), sc.img); $("tag").textContent = sc.tag;
    const story = $("story"); story.innerHTML = ""; story.scrollTop = 0;
    const ps = sc.text.map((t) => { const p = document.createElement("p"); p.textContent = fill(t); story.appendChild(p); return p; });
    reveal(ps);
    const sheet = $("sheet"); sheet.innerHTML = '<div class="hint">어떻게 할까</div>';
    sc.choices.forEach((c, n) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "opt";
      const noBat = c.need === "bat" && st.bat <= 0;
      b.innerHTML = `<b>${n + 1}</b><span></span>`; b.querySelector("span").textContent = fill(c.t);
      if (noBat) { b.disabled = true; const sm = document.createElement("small"); sm.textContent = "배터리가 없다"; b.querySelector("span").appendChild(sm); }
      b.addEventListener("click", () => choose(c));
      sheet.appendChild(b);
    });
  }
  function choose(c) {
    path.push(c.t);
    const hit = []; const deltas = [];
    Object.entries(c.fx || {}).forEach(([k, v]) => {
      if (k in st) { st[k] = Math.max(0, Math.min(MAX[k] + 1, st[k] + v)); hit.push(k); deltas.push([k, v]); }
      else ax[k] = (ax[k] || 0) + v;
    });
    drawStats(hit.filter((k) => (c.fx[k] || 0) < 0));
    const story = $("story");
    const p = document.createElement("p"); p.className = "result"; p.textContent = fill(c.r); story.appendChild(p);
    if (deltas.length) { const d = document.createElement("div"); d.className = "deltas"; d.innerHTML = deltas.map(([k, v]) => `<span class="delta${v > 0 ? " up" : ""}">${LABEL[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}</span>`).join(""); story.appendChild(d); }
    reveal([p]); setTimeout(() => { story.scrollTo({ top: story.scrollHeight, behavior: "smooth" }); }, 200);
    const dead = st.hp <= 0 ? "hp" : st.san <= 0 ? "san" : null;
    const sheet = $("sheet"); sheet.innerHTML = "";
    const nb = document.createElement("button"); nb.type = "button"; nb.className = "next";
    if (dead) {
      const q = document.createElement("p"); q.textContent = fill(S.deaths[dead]); story.appendChild(q); setTimeout(() => q.classList.add("in"), 700);
      nb.textContent = "기록 열람 ▸"; nb.onclick = () => finish(dead === "hp" ? "lost" : "redacted");
    } else if (i + 1 < S.scenes.length) { nb.textContent = "계속 ▸"; nb.onclick = () => { i++; scene(); }; }
    else { nb.textContent = "기록 열람 ▸"; nb.onclick = () => finish(); }
    sheet.appendChild(nb);
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
  async function finish(forced) {
    const res = judge(forced);
    $("play").classList.add("hide"); $("end").classList.remove("hide"); window.scrollTo({ top: 0 });
    await drawCard(res);
    $("save").onclick = () => { const a = document.createElement("a"); a.download = `dopa-B4-${caseNo}.png`; a.href = $("card").toDataURL("image/png"); a.click(); };
    $("copy").onclick = async () => {
      const t = `[DOPA 기록보관소 · 지하 4층 야간 순찰]\n요원 ${name} — ${res.e.title}${res.prob != null ? ` (생존 확률 ${res.prob}%)` : " (측정 불가)"}\n"${fill(res.e.last)}"\n\n#도파생존기록 #지하4층 #캐릭터`;
      try { await navigator.clipboard.writeText(t); $("toast").textContent = "복사했어요. 기록 이미지와 같이 올려 보세요."; } catch (e) { $("toast").textContent = t; }
    };
  }
  $("again").addEventListener("click", () => { $("end").classList.add("hide"); $("cover").classList.remove("hide"); $("toast").textContent = ""; window.scrollTo({ top: 0 }); });

  // ── 결말 기록 (1080×1350) ──
  const loadImg = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
  async function firstImg(key) { for (const x of ["webp", "jpg", "png"]) { try { return await loadImg(`img/${key}.${x}`); } catch (e) {} } return null; }
  function wrap(ctx, text, maxW) { const out = []; let line = ""; for (const ch of Array.from(text)) { const t = line + ch; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = ch.trim() ? ch : ""; } else line = t; } if (line) out.push(line); return out; }
  function cover(ctx, im, x, y, w, h) { const r = Math.max(w / im.width, h / im.height); const sw = w / r, sh = h / r; ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); }
  function fog(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#e6e2da"); g.addColorStop(0.7, "#a9a399"); g.addColorStop(1, "#6f6a62"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const r = ctx.createRadialGradient(x + w / 2, y + h * 0.62, 0, x + w / 2, y + h * 0.62, w * 0.5); r.addColorStop(0, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = r; ctx.fillRect(x, y, w, h);
    for (let n = 0; n < 9000; n++) { ctx.fillStyle = `rgba(30,28,25,${Math.random() * 0.12})`; ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1.5, 1.5); }
  }
  async function drawCard({ e, prob }) {
    const c = $("card"), ctx = c.getContext("2d"), W = 1080, H = 1350, AH = 620;
    try { await Promise.all([document.fonts.load("800 60px 'Nanum Myeongjo'"), document.fonts.load("400 30px 'Nanum Myeongjo'"), document.fonts.load("600 24px 'IBM Plex Mono'"), document.fonts.load("700 28px 'Pretendard Variable'")]); } catch (err) {}
    const SERIF = "'Nanum Myeongjo', serif", MONO = "'IBM Plex Mono', monospace", SANS = "'Pretendard Variable', Pretendard, sans-serif";
    ctx.fillStyle = "#f1eee7"; ctx.fillRect(0, 0, W, H);
    // 위: 그림 (결말 그림 → 없으면 안개) + 캐릭터 사진(흑백 폴라로이드)
    const ei = await firstImg(e.img);
    ctx.save(); ctx.filter = "grayscale(1) contrast(1.05)"; if (ei) cover(ctx, ei, 0, 0, W, AH); else fog(ctx, 0, 0, W, AH); ctx.restore();
    const vg = ctx.createLinearGradient(0, AH * 0.55, 0, AH); vg.addColorStop(0, "rgba(241,238,231,0)"); vg.addColorStop(1, "rgba(241,238,231,1)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, AH);
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(60, 56, 470, 50); ctx.fillStyle = "#fff"; ctx.font = `600 22px ${MONO}`; ctx.fillText(`DOPA 기록보관소 · No. D-4-${caseNo}`, 78, 89);
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
    ctx.fillStyle = "#7a746a"; ctx.font = `600 24px ${MONO}`; ctx.fillText("요원", 70, y); y += 70;
    ctx.fillStyle = "#1c1b1e"; ctx.font = `800 62px ${SERIF}`; ctx.fillText(wrap(ctx, name, 600)[0], 70, y);
    // 판정 도장
    ctx.save(); ctx.translate(W - 250, AH + 70); ctx.rotate(-0.16); ctx.strokeStyle = e.color; ctx.fillStyle = e.color; ctx.lineWidth = 6; ctx.globalAlpha = 0.88;
    ctx.font = `600 40px ${MONO}`; const sw = ctx.measureText(e.cls).width + 56; ctx.strokeRect(-sw / 2, -42, sw, 84); ctx.lineWidth = 2; ctx.strokeRect(-sw / 2 + 9, -33, sw - 18, 66); ctx.textAlign = "center"; ctx.fillText(e.cls, 0, 14); ctx.restore(); ctx.textAlign = "left";
    y += 84; ctx.fillStyle = e.color; ctx.font = `800 54px ${SERIF}`; ctx.fillText(e.title, 70, y);
    ctx.fillStyle = "#1c1b1e"; ctx.font = `700 32px ${SANS}`; ctx.textAlign = "right"; ctx.fillText(prob != null ? `생존 확률 ${prob}%` : "생존 확률 측정 불가", W - 70, y); ctx.textAlign = "left";
    y += 38; ctx.fillStyle = "#1c1b1e"; ctx.fillRect(70, y, W - 140, 2); y += 64;
    ctx.font = `400 36px ${SERIF}`; ctx.fillStyle = "#2a2826";
    wrap(ctx, `“${fill(e.last)}”`, W - 140).slice(0, 4).forEach((l) => { ctx.fillText(l, 70, y); y += 60; });
    y += 6; ctx.font = `400 25px ${SANS}`; ctx.fillStyle = "#7a746a";
    e.notes.slice(0, 2).forEach((n) => { let cx = 70; `· ${fill(n)}`.split(/(█+)/).forEach((part) => { if (!part) return; const w = ctx.measureText(part).width; if (/^█+$/.test(part)) { ctx.fillStyle = "#1c1b1e"; ctx.fillRect(cx, y - 22, w, 28); ctx.fillStyle = "#7a746a"; } else ctx.fillText(part, cx, y); cx += w; }); y += 40; });
    // 남은 상태 (바닥 바로 위)
    ctx.fillStyle = "#1c1b1e"; ctx.font = `600 24px ${SANS}`; ctx.fillText(`남은 상태  체력 ${st.hp} · 정신 ${st.san} · 배터리 ${st.bat}  ·  선택 ${path.length}번`, 70, H - 170);
    // 바닥
    ctx.fillStyle = "#1c1b1e"; ctx.fillRect(0, H - 130, W, 130);
    ctx.fillStyle = "#f1eee7"; ctx.font = `700 28px ${SANS}`; ctx.fillText("지하 4층 야간 순찰 · 내 캐릭터로 해 보기", 70, H - 74);
    ctx.font = `400 22px ${SANS}`; ctx.fillStyle = "#a9a399"; ctx.fillText(`설정을 잊지 않는 AI 인터랙티브 스토리 · 11/5 텀블벅 오픈 · 추천 괴담 〈${e.rec}〉`, 70, H - 38);
    try { const logo = await loadImg("logo.svg"); ctx.drawImage(logo, W - 70 - 56, H - 102, 56, 56); } catch (err) {}
    ctx.textAlign = "right"; ctx.font = `600 22px ${MONO}`; ctx.fillStyle = "#f1eee7"; ctx.fillText("@DOPA_studio", W - 140, H - 66); ctx.textAlign = "left";
  }
})();
