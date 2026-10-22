// survival/app.js — 괴담 생존 적합성 평가 (화면 흐름 + 판정서 PNG)
(() => {
  const D = window.SURVIVAL;
  const $ = (id) => document.getElementById(id);
  let name = "", photo = null, idx = 0, score = { rule: 0, caution: 0, curious: 0, bond: 0, mirror: 0 };
  const caseNo = String(Math.floor(1000 + Math.random() * 9000));
  $("caseNo").textContent = `No. D-4-${caseNo}`;

  // 받침에 맞는 조사 ({은} {이} {을} {와})
  const hasBatchim = (w) => { const c = String(w).trim().slice(-1).charCodeAt(0); if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 !== 0; return /[lmnr]$/i.test(w) ? true : false; };
  const fill = (t) => { const b = hasBatchim(name); return t.replace(/\{N\}\{은\}/g, name + (b ? "은" : "는")).replace(/\{N\}\{이\}/g, name + (b ? "이" : "가")).replace(/\{N\}\{을\}/g, name + (b ? "을" : "를")).replace(/\{N\}\{와\}/g, name + (b ? "과" : "와")).replace(/\{N\}/g, name); };

  // ── 1. 표지 ──
  $("name").addEventListener("input", (e) => { name = e.target.value.trim(); $("start").disabled = !name; });
  $("pick").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { photo = img; $("thumb").style.backgroundImage = `url(${r.result})`; }; img.src = r.result; }; r.readAsDataURL(f);
  });
  $("start").addEventListener("click", () => { if (!name) return; $("intro").classList.add("hide"); $("quiz").classList.remove("hide"); show(); });

  // ── 2. 질문 ──
  function show() {
    const q = D.questions[idx];
    $("prog").style.width = `${(idx / D.questions.length) * 100}%`;
    $("qNo").textContent = `기록 ${String(idx + 1).padStart(2, "0")} / ${D.questions.length}`;
    $("qSite").textContent = `▸ ${q.site}`;
    $("qText").textContent = q.text;
    const box = $("qChoices"); box.innerHTML = "";
    q.choices.forEach(([label, eff], i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "choice";
      b.innerHTML = `<i>${"ABC"[i]}</i><span></span>`; b.querySelector("span").textContent = label;
      b.addEventListener("click", () => { Object.entries(eff).forEach(([k, v]) => { score[k] = (score[k] || 0) + v; }); idx++; if (idx < D.questions.length) show(); else finish(); });
      box.appendChild(b);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── 3. 판정 ──
  function judge() {
    const s = score.rule + score.caution - score.curious * 1.2;
    let key;
    if (s >= 7) key = score.bond >= 4 ? "bond" : "safe";
    else if (s >= 2) key = score.bond >= 4 ? "bond" : "watch";
    else if (s >= -2) key = "contain";
    else key = score.mirror ? "redacted" : "lost";
    if (key !== "redacted" && score.mirror && s < 2) key = "redacted";   // 거울을 본 위험형은 [편집됨]
    const r = D.results[key];
    let prob = null;
    if (r.prob) { const [lo, hi] = r.prob; const t = Math.max(0, Math.min(1, (s + 6) / 18)); prob = Math.round(lo + (hi - lo) * t); }
    return { key, r, prob, s };
  }

  async function finish() {
    $("prog").style.width = "100%";
    const res = judge();
    $("quiz").classList.add("hide"); $("result").classList.remove("hide");
    await drawCard(res);
    $("copy").onclick = async () => {
      const t = `[DOPA 기록보관소 · 생존 적합성 평가]\n피험자 ${name} — ${res.r.title}${res.prob != null ? ` (생존 확률 ${res.prob}%)` : " (측정 불가)"}\n"${fill(res.r.last)}"\n\n#도파생존테스트 #괴담생존테스트 #자캐`;
      try { await navigator.clipboard.writeText(t); $("copied").textContent = "복사했어요. 판정서 이미지와 같이 올려 보세요."; } catch (e) { $("copied").textContent = t; }
    };
    $("save").onclick = () => { const a = document.createElement("a"); a.download = `dopa-survival-${caseNo}.png`; a.href = $("card").toDataURL("image/png"); a.click(); };
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("again").addEventListener("click", () => { idx = 0; score = { rule: 0, caution: 0, curious: 0, bond: 0, mirror: 0 }; $("result").classList.add("hide"); $("intro").classList.remove("hide"); window.scrollTo({ top: 0 }); });

  // ── 판정서 그리기 (1080×1350) ──
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  function wrap(ctx, text, maxW) {
    const out = []; let line = "";
    for (const ch of Array.from(text)) { const t = line + ch; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = ch.trim() ? ch : ""; } else line = t; }
    if (line) out.push(line); return out;
  }
  function redactLine(ctx, text, x, y) {   // ████ 부분은 검은 막대로
    let cx = x;
    text.split(/(█+)/).forEach((part) => {
      if (!part) return;
      const w = ctx.measureText(part).width;
      if (/^█+$/.test(part)) { ctx.fillRect(cx, y - 26, w, 32); } else ctx.fillText(part, cx, y);
      cx += w;
    });
  }
  async function drawCard({ r, prob }) {
    const c = $("card"), ctx = c.getContext("2d"), W = 1080, H = 1350;
    try { await Promise.all([document.fonts.load("800 60px 'Nanum Myeongjo'"), document.fonts.load("400 30px 'Nanum Myeongjo'"), document.fonts.load("600 26px 'IBM Plex Mono'"), document.fonts.load("700 30px 'Pretendard Variable'")]); } catch (e) {}
    const MONO = "'IBM Plex Mono', monospace", SERIF = "'Nanum Myeongjo', serif", SANS = "'Pretendard Variable', Pretendard, sans-serif";
    // 종이
    ctx.fillStyle = "#ebe5d6"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.03)"; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    for (let i = 0; i < 1800; i++) { ctx.fillStyle = `rgba(60,50,30,${Math.random() * 0.05})`; ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    // 머리말
    ctx.fillStyle = "#1b1a1d"; ctx.font = `600 26px ${MONO}`; ctx.textBaseline = "alphabetic";
    ctx.fillText("DOPA 이상현상 기록보관소", 70, 92); ctx.font = `400 22px ${MONO}`; ctx.fillText("생존 적합성 평가서 · 양식 D-4", 70, 126);
    ctx.textAlign = "right"; ctx.fillStyle = "#b3122b"; ctx.font = `600 24px ${MONO}`; ctx.fillText("열람 등급 1", W - 70, 92); ctx.fillText(`No. D-4-${caseNo}`, W - 70, 126); ctx.textAlign = "left";
    ctx.fillStyle = "#1b1a1d"; ctx.fillRect(70, 150, W - 140, 4);
    // 사진 (있으면 · 흑백 + 클립)
    const px = W - 70 - 300, py = 200, pw = 300, ph = 360;
    ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(0.035); ctx.translate(-(px + pw / 2), -(py + ph / 2));
    ctx.fillStyle = "#f6f2e8"; ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.fillRect(px - 14, py - 14, pw + 28, ph + 28); ctx.shadowColor = "transparent";
    if (photo) {
      const rr = Math.max(pw / photo.width, ph / photo.height); const sw = pw / rr, sh = ph / rr;
      ctx.filter = "grayscale(1) contrast(1.15)"; ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, px, py, pw, ph); ctx.filter = "none";
    } else {
      ctx.fillStyle = "#d8d0bc"; ctx.fillRect(px, py, pw, ph); ctx.fillStyle = "#8a8170"; ctx.font = `600 22px ${MONO}`; ctx.textAlign = "center"; ctx.fillText("사진 없음", px + pw / 2, py + ph / 2); ctx.textAlign = "left";
    }
    ctx.restore();
    ctx.strokeStyle = "#7a7a80"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px + 60, py - 40); ctx.lineTo(px + 60, py + 40); ctx.arc(px + 75, py + 40, 15, Math.PI, 0, true); ctx.lineTo(px + 90, py - 20); ctx.stroke();
    // 피험자 정보
    ctx.fillStyle = "#6f6758"; ctx.font = `600 24px ${MONO}`; ctx.fillText("피험자", 70, 230);
    ctx.fillStyle = "#1b1a1d"; ctx.font = `800 64px ${SERIF}`; const nm = wrap(ctx, name, 560); nm.slice(0, 2).forEach((l, i) => ctx.fillText(l, 70, 300 + i * 72));
    const yy = 300 + (Math.min(2, nm.length) - 1) * 72;
    ctx.fillStyle = "#6f6758"; ctx.font = `600 24px ${MONO}`; ctx.fillText("판정", 70, yy + 80);
    ctx.fillStyle = r.color; ctx.font = `800 52px ${SERIF}`; ctx.fillText(r.title, 70, yy + 142);
    ctx.fillStyle = "#6f6758"; ctx.font = `600 24px ${MONO}`; ctx.fillText("생존 확률", 70, yy + 210);
    ctx.fillStyle = "#1b1a1d"; ctx.font = prob != null ? `800 46px ${MONO}` : `800 44px ${SERIF}`; ctx.fillText(prob != null ? `${prob}%` : "측정 불가", 70, yy + 266);   // 한글은 고정폭 글꼴에 없어 명조로
    // 도장
    ctx.save(); ctx.translate(780, 640); ctx.rotate(-0.2); ctx.strokeStyle = r.color; ctx.fillStyle = r.color; ctx.globalAlpha = 0.85; ctx.lineWidth = 7;
    ctx.font = `700 46px ${MONO}`; const sw2 = ctx.measureText(r.cls).width + 60; ctx.strokeRect(-sw2 / 2, -46, sw2, 92); ctx.lineWidth = 2; ctx.strokeRect(-sw2 / 2 + 10, -36, sw2 - 20, 72);
    ctx.textAlign = "center"; ctx.fillText(r.cls, 0, 16); ctx.restore(); ctx.textAlign = "left"; ctx.globalAlpha = 1;
    // 특이사항
    let y = 760; ctx.fillStyle = "#1b1a1d"; ctx.fillRect(70, y - 30, W - 140, 2);
    ctx.font = `600 24px ${MONO}`; ctx.fillStyle = "#b3122b"; ctx.fillText("▌ 특이사항", 70, y + 14); y += 62;
    ctx.fillStyle = "#1b1a1d"; ctx.font = `400 30px ${SANS}`;
    r.notes.forEach((n) => { redactLine(ctx, `· ${fill(n)}`, 70, y); y += 48; });
    // 마지막 기록
    y += 24; ctx.font = `600 24px ${MONO}`; ctx.fillStyle = "#b3122b"; ctx.fillText("▌ 마지막 기록", 70, y); y += 56;
    ctx.fillStyle = "#1b1a1d"; ctx.font = `400 34px ${SERIF}`;
    wrap(ctx, fill(r.last), W - 140).slice(0, 4).forEach((l) => { ctx.fillText(l, 70, y); y += 54; });
    // 바닥
    ctx.fillStyle = "#1b1a1d"; ctx.fillRect(70, H - 150, W - 140, 2);
    ctx.font = `400 24px ${SANS}`; ctx.fillStyle = "#6f6758"; ctx.fillText(`이 피험자에게 맞는 괴담: 〈${r.rec}〉`, 70, H - 104);
    ctx.fillText("설정을 잊지 않는 AI 인터랙티브 스토리 · 11/5 텀블벅 오픈", 70, H - 66);
    try { const logo = await loadImg("logo.svg"); ctx.drawImage(logo, W - 70 - 64, H - 128, 64, 64); } catch (e) {}
    ctx.textAlign = "right"; ctx.font = `600 22px ${MONO}`; ctx.fillStyle = "#1b1a1d"; ctx.fillText("@DOPA_studio", W - 150, H - 86); ctx.textAlign = "left";
  }
})();
