/* =========================================================
   main.js — data-driven renderer + window manager
   Semua konten dibaca dari data/*.json, urut:
     site.json        → navbar, hero, dropdown, kontak singkat, footer, dim
     profile.json     → window About (termasuk EXPERIENCE)
     projects.json    → window Projects
     publications.json→ window Publications (DOI + sertifikasi)
     contact.json     → window Contact
   ========================================================= */
"use strict";

const DATA_FILES = ["site", "profile", "projects", "publications", "contact"];
const DATA = {};

/* ---------- util ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
function anchor(href, cls, html, external) {
  const ext = external ? ' target="_blank" rel="noreferrer noopener"' : "";
  return `<a ${href ? `href="${esc(href)}"${ext}` : ""} class="${cls}">${html}</a>`;
}

/* ---------- load data ---------- */
async function loadData() {
  const results = await Promise.all(
    DATA_FILES.map(async (name) => {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`${name}.json → HTTP ${res.status}`);
      return res.json();
    })
  );
  DATA_FILES.forEach((name, i) => (DATA[name] = results[i]));
}

/* ---------- render: site ---------- */
function renderSite() {
  const s = DATA.site;
  document.documentElement.style.setProperty("--backdrop", `rgba(26,26,26,${s.backdropOpacity})`);
  $("#brand").textContent = s.brand;
  $("#badge-text").textContent = s.badge;

  $("#nav-links").innerHTML = s.navbar
    .map((n) => `<button data-win="${esc(n.id)}">${esc(n.label)}</button>`)
    .join("");
  $$("#nav-links button").forEach((b) => (b.onclick = () => openWindow(b.dataset.win)));

  $("#headline").textContent = "MESSY DATA IN.\nWORKING SYSTEMS OUT.";

  $("#intro").textContent = s.heroIntro;

  $("#hero-stats").innerHTML = s.stats
    .map((st) => `<div class="stat"><div class="stat__num">${esc(st.value)}</div><div class="stat__label">${esc(st.label)}</div></div>`)
    .join("");

  // tombol utama (dropdown)
  const pri = s.buttons.primary;
  $("#btn-menu span[data-bind]").textContent = pri.label;

  // tombol CV
  const cv = s.buttons.secondary;
  const cvEl = $("#btn-cv");
  cvEl.textContent = cv.label;
  cvEl.href = cv.href;
  if (cv.external) {
    cvEl.target = "_blank";
    cvEl.rel = "noreferrer noopener";
  }

  // dropdown menu
  $("#menu-title").textContent = s.dropdownMenu.title;
  $("#menu-items").innerHTML = s.dropdownMenu.items
    .map((it) => `<li>${anchor(it.href, "", esc(it.label), it.external)}</li>`)
    .join("");
  $("#menu-items").querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => closeMenu());
  });

  // contact row di hero
  $("#hero-contact").innerHTML = s.contactRow
    .map((c) => (c.href ? anchor(c.href, "", esc(c.label), c.external) : `<span>${esc(c.label)}</span>`))
    .join("");

  // footer global
  const oldFooter = document.querySelector("footer.footer");
  if (oldFooter) oldFooter.remove();
  const f = document.createElement("footer");
  f.className = "global-footer";
  f.innerHTML = `<span>${esc(s.footer.left)}</span><span class="right">${esc(s.footer.right)}</span>`;
  document.body.appendChild(f);
}

/* ---------- window chrome ---------- */
function windowChrome(win, treew, data) {
  win.innerHTML = `
    <div class="window__bar">
      <span class="window__title">${esc(treew.title)}</span>
      <span class="window__controls">
        <button class="w-ctl--close" title="close" aria-label="Close window">✕</button>
      </span>
    </div>
    <div class="window__body"></div>
    <div class="w-scroll">
      <button class="js-prev" aria-label="scroll up">▲</button>
      <button class="js-next" aria-label="scroll down">▼</button>
    </div>`;
  $(".w-ctl--close", win).onclick = () => {
    win.classList.remove("open");
    win.hidden = true;
    if (currentWin === win) { currentWin = null; document.body.classList.remove("dim"); }
    closeMenu();
  };
  const body = $(".window__body", win);
  $(".js-prev", win).onclick = () => body.scrollBy({ top: -320, behavior: "smooth" });
  $(".js-next", win).onclick = () => body.scrollBy({ top: 320, behavior: "smooth" });
  win.dataset.title = treew.title;
}

const headBlock = (h, endLabel) => `
  <div class="win-label-row"><span>${esc(h.label ?? "")}</span>${endLabel ? `<span class="end">${esc(endLabel)}</span>` : ""}</div>
  <div class="win-rule"></div>
  <h2 class="win-heading">${nl2br(h.heading)}</h2>
  <div class="win-rule win-rule--after-heading"></div>`;

/* ---------- render: about ---------- */
function renderAbout() {
  const d = DATA.profile;
  const win = $("#win-about");
  windowChrome(win, d.window);
  const body = $(".window__body", win);
  const ex = d.experience
    .map(
      (x) => `<div class="exp-row">
        <div class="exp-period">${esc(x.period)}</div>
        <h3>${esc(x.role)}</h3>
        <div class="exp-org">${esc(x.org)}</div>
        ${x.note ? `<div class="row-note">${esc(x.note)}</div>` : ""}
      </div>`
    )
    .join("");
  body.innerHTML = `
    <div class="about-grid">
      <div class="about-col">
        ${headBlock({ label: "02 — ABOUT", heading: d.heading }, "PROFILE.SYS")}
        ${d.paragraphs.map((p) => `<p class="par">${esc(p)}</p>`).join("")}
        <div class="research-line">${esc(d.researchFocus)}</div>
        <div class="section-mini">EDUCATION ⟶</div>
        ${d.education
          .map((e) => `<div class="edu-row"><h3>${esc(e.title)}</h3><div class="row-note">${esc(e.note)}</div></div>`)
          .join("")}
        <div class="section-mini">EXPERIENCE ⟶</div>
        ${ex}
      </div>
      <aside class="currently">
        <div class="currently__title">${esc(d.currently.title)}</div>
        <div class="currently__sq"></div>
        ${d.currently.rows
          .map(
            (r) => `<div class="c-row">
              <div class="c-label">${esc(r.label)}</div>
              <div class="c-value ${r.gold ? "c-value--gold" : ""}">${esc(r.value)}</div>
            </div>`
          )
          .join("")}
        ${d.currently.mail
          ? `<div class="currently__mail">
              <div class="c-label">${esc(d.currently.mailLabel)}</div>
              ${anchor(`mailto:${esc(d.currently.mail)}`, "", esc(d.currently.mail), false)}
            </div>`
          : ""}
      </aside>
    </div>`;
}

/* ---------- render: projects ---------- */
function renderProjects() {
  const d = DATA.projects;
  const win = $("#win-projects");
  windowChrome(win, d.window);
  const body = $(".window__body", win);
  body.innerHTML = `
    <div class="win-label-row"><span>03 — PROJECTS</span><span class="end">SELECTED_WORK.TXT</span></div>
    <div class="win-rule"></div>
    <h2 class="win-heading">${esc(d.heading)}</h2>
    <div class="win-rule win-rule--after-heading"></div>
    ${d.items
      .map(
        (p) => `<article class="p-row">
          <div class="p-row__num">${esc(p.num)}</div>
          <div class="p-row__year">${esc(p.year)}</div>
          <h3 class="p-row__title">${esc(p.title)}</h3>
          <p class="p-row__desc">${esc(p.desc)}</p>
          <div class="p-row__tags">${esc(p.tags)}</div>
        </article>`
      )
      .join("")}
    ${anchor(d.moreLink.href, "more-link", esc(d.moreLink.label), d.moreLink.external)}`;
}

/* ---------- render: publications ---------- */
function renderPublications() {
  const d = DATA.publications;
  const win = $("#win-publications");
  windowChrome(win, d.window);
  const body = $(".window__body", win);
  body.innerHTML = `
    <div class="win-label-row"><span>04 — PUBLICATIONS</span><span class="end">DOI.VERIFIED</span></div>
    <div class="win-rule"></div>
    <h2 class="win-heading">${esc(d.heading)}</h2>
    <div class="win-rule win-rule--after-heading"></div>
    ${d.items
      .map(
        (p) => `<article class="p-row">
          <div class="p-row__num">${esc(p.num)}</div>
          <h3 class="p-row__title">${esc(p.title)}</h3>
          <div class="pub-authors">${esc(p.authors)}</div>
          ${anchor(p.doiHref, "pub-doi", esc(p.doi), true)}
          <div class="pub-venue">${esc(p.venue)}</div>
        </article>`
      )
      .join("")}
    <div class="cert-strip">
      <span class="cert-text">${esc(d.certsLabel)}</span>
      ${d.certs
        .map((c) => `<span class="cert-chip cert-chip--${c.gold ? "gold" : "plain"}">${esc(c.label)}</span>`)
        .join("")}
    </div>`;
}

/* ---------- render: contact ---------- */
function renderContact() {
  const d = DATA.contact;
  const win = $("#win-contact");
  windowChrome(win, d.window);
  const body = $(".window__body", win);
  body.innerHTML = `
    <div class="win-label-row"><span>05 — CONTACT</span><span class="end">SAY.HI</span></div>
    <div class="win-rule"></div>
    <h2 class="win-heading contact-heading">${nl2br(d.heading)}</h2>
    <p class="contact-intro">${esc(d.intro)}</p>
    ${anchor(d.cta.href, "contact-btn", esc(d.cta.label), false)}
    <div class="contact-rows">
      ${d.rows.map((r) => (r.href ? anchor(r.href, "", esc(r.label), r.external) : `<span>${esc(r.label)}</span>`)).join("")}
    </div>
    <div class="footer-bar">
      <span>${esc(d.footer.left)}</span>
      <span class="right">${esc(d.footer.right)}</span>
    </div>`;
}

/* ---------- window manager ---------- */
let currentWin = null;
const WIN_IDS = { about: "win-about", projects: "win-projects", publications: "win-publications", contact: "win-contact" };

function openWindow(id) {
  closeCurrent(); closeMenu();
  const win = $("#" + WIN_IDS[id]);
  // efek cascade pecahan kecil per index (desktop)
  const i = +win.dataset.index;
  win.style.setProperty("--jx", `${i * 14}px`);
  win.style.setProperty("--jy", `${i * 10}px`);
  win.hidden = false;
  win.classList.add("open");
  document.body.classList.add("dim");
  currentWin = win;
  const syncScroll = () => {
    const body = $(".window__body", win);
    const btns = $(".w-scroll", win);
    if (body && btns) btns.style.display = body.scrollHeight > body.clientHeight + 4 ? "flex" : "none";
  };
  requestAnimationFrame(() => { syncScroll(); setTimeout(syncScroll, 120); });
}
function closeCurrent() {
  if (!currentWin) return;
  currentWin.classList.remove("open");
  currentWin.hidden = true;
  currentWin = null;
  document.body.classList.remove("dim");
}

/* ---------- dropdown menu ---------- */
const menu = () => $("#menu");
function toggleMenu() {
  menu().hidden = !menu().hidden;
  // dropdown TIDAK menggelapkan halaman (hanya window yang memakai dim)
}
function closeMenu() { menu().hidden = true; }

/* ---------- boot ---------- */
async function boot() {
  try {
    await loadData();
  } catch (err) {
    const tip = document.createElement("div");
    tip.className = "data-error";
    tip.innerHTML = `<b>Gagal memuat data JSON</b> — ${esc(err.message)}<br>Jalankan dari HTTP server lokal:<br><code>cd landing-page && python3 -m http.server 8000</code> lalu buka <code>http://localhost:8000</code>`;
    document.body.appendChild(tip);
    return;
  }
  windowChrome._noop = windowChrome._noop || null;
  renderSite();
  renderAbout();
  renderProjects();
  renderPublications();
  renderContact();

  $("#btn-menu").onclick = (e) => { e.stopPropagation(); toggleMenu(); };
  $("#btn-cv").addEventListener("click", closeMenu);
  $("#backdrop").addEventListener("click", () => { closeCurrent(); closeMenu(); });
  // klik di luar dropdown menutup menu (tanpa dim)
  document.addEventListener("click", (e) => {
    if (!menu().hidden && !e.target.closest(".dropdown-anchor")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeCurrent(); closeMenu(); }
  });
}

boot();
