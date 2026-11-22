/**
 * Abhijith Saji — Interactive 3D Resume & Portfolio Controller
 * Handles dynamic data rendering, bespoke SVG project mockups, 3D portrait stage,
 * 3D tilt physics, project deep-dive modal, CV Mode, Live Editor & Print PDF.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "portfolio_3d_resume_abhijith_v4";
  let resumeData = loadData();
  let activeCategory = "All";

  /* -------------------------------------------------------------------------- */
  /* Data Persistence & Safe Escaping                                           */
  /* -------------------------------------------------------------------------- */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadData() {
    const base = deepClone(window.DEFAULT_RESUME_DATA);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return base;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.profile) {
        base.profile = Object.assign({}, base.profile, parsed.profile);
      }
      if (parsed && Array.isArray(parsed.orbitSkills) && parsed.orbitSkills.length) {
        base.orbitSkills = parsed.orbitSkills;
      }
      return base;
    } catch (_) {
      return base;
    }
  }

  function saveData() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile: resumeData.profile,
          orbitSkills: resumeData.orbitSkills
        })
      );
    } catch (_) {
      // Ignore private browsing quota errors
    }
  }

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(msg) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.transition = "all 0.25s ease";
      setTimeout(() => el.remove(), 260);
    }, 2600);
  }

  /* -------------------------------------------------------------------------- */
  /* Bespoke Inline SVG UI Mockups Tailored to Abhijith's Real Projects         */
  /* -------------------------------------------------------------------------- */
  function renderMockupSVG(type) {
    if (type === "mydr-healthcare") {
      return `
        <svg class="mockup-svg" viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="8" y="8" width="404" height="184" rx="14" fill="#140907" stroke="rgba(255,107,26,0.44)" stroke-width="1.2"/>
          <!-- Browser Topbar -->
          <circle cx="26" cy="24" r="3.5" fill="#FF6B1A"/>
          <circle cx="38" cy="24" r="3.5" fill="#FFD166"/>
          <circle cx="50" cy="24" r="3.5" fill="#E11D48"/>
          <rect x="74" y="17" width="166" height="14" rx="7" fill="rgba(255,168,102,0.08)"/>
          <text x="86" y="27" fill="#D7C3B8" font-family="monospace" font-size="8">MY DR · KERALA HEALTHCARE</text>
          <rect x="320" y="17" width="76" height="14" rx="7" fill="rgba(255,184,64,0.18)" stroke="rgba(255,184,64,0.5)"/>
          <text x="330" y="27" fill="#FFD166" font-family="monospace" font-size="7.5" font-weight="700">VERCEL LIVE</text>
          <line x1="8" y1="38" x2="412" y2="38" stroke="rgba(255,152,92,0.16)"/>
          <!-- Search & District Filter Bar -->
          <rect x="22" y="50" width="230" height="26" rx="8" fill="rgba(30,14,10,0.92)" stroke="rgba(255,107,26,0.4)"/>
          <text x="34" y="66" fill="#FFF4EC" font-family="sans-serif" font-size="9">Search Kerala Specialists · Kottayam</text>
          <rect x="260" y="50" width="64" height="26" rx="8" fill="rgba(255,107,26,0.18)" stroke="#FF6B1A"/>
          <text x="272" y="66" fill="#FFB347" font-family="monospace" font-size="8" font-weight="700">DISTRICT</text>
          <rect x="332" y="50" width="66" height="26" rx="8" fill="url(#mydrFlameBtn)"/>
          <text x="344" y="66" fill="#160703" font-family="sans-serif" font-size="8.5" font-weight="700">BOOK NOW</text>
          <!-- Specialist Directory Cards -->
          <rect x="22" y="88" width="182" height="90" rx="10" fill="rgba(30,14,10,0.9)" stroke="rgba(255,107,26,0.32)"/>
          <circle cx="44" cy="112" r="12" fill="rgba(255,107,26,0.22)" stroke="#FF6B1A"/>
          <path d="M44 107V117M39 112H49" stroke="#FFD166" stroke-width="2" stroke-linecap="round"/>
          <text x="64" y="110" fill="#FFF8F3" font-family="sans-serif" font-size="10" font-weight="700">Cardiology Dept.</text>
          <text x="64" y="123" fill="#B89B8E" font-family="monospace" font-size="7.5">Kottayam · Real-Time Slots</text>
          <rect x="34" y="140" width="72" height="22" rx="6" fill="rgba(255,209,102,0.16)" stroke="rgba(255,209,102,0.5)"/>
          <text x="45" y="154" fill="#FFD166" font-family="monospace" font-size="8">10:30 AM ✓</text>
          <rect x="114" y="140" width="76" height="22" rx="6" fill="rgba(255,107,26,0.2)" stroke="#FF6B1A"/>
          <text x="126" y="154" fill="#FFB347" font-family="monospace" font-size="8">CONFIRM</text>
          <!-- Right Live Queue / Supabase Card -->
          <rect x="216" y="88" width="182" height="90" rx="10" fill="rgba(30,14,10,0.9)" stroke="rgba(255,152,92,0.2)"/>
          <text x="230" y="108" fill="#FFB347" font-family="monospace" font-size="8" font-weight="700">SUPABASE · POSTGRESQL</text>
          <rect x="230" y="118" width="154" height="10" rx="5" fill="rgba(255,184,120,0.12)"/>
          <rect x="230" y="118" width="122" height="10" rx="5" fill="url(#mydrGrad)"/>
          <text x="230" y="145" fill="#EBD8CE" font-family="monospace" font-size="7.8">• Instant Appointment Sync</text>
          <text x="230" y="160" fill="#B89B8E" font-family="monospace" font-size="7.8">• Client + Server Validation</text>
          <defs>
            <linearGradient id="mydrGrad" x1="230" y1="0" x2="352" y2="0" gradientUnits="userSpaceOnUse">
              <stop stop-color="#E11D48"/><stop offset="0.55" stop-color="#FF5E1A"/><stop offset="1" stop-color="#FFD166"/>
            </linearGradient>
            <linearGradient id="mydrFlameBtn" x1="332" y1="50" x2="398" y2="76" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFD166"/><stop offset="1" stop-color="#FF5E1A"/>
            </linearGradient>
          </defs>
        </svg>`;
    }

    if (type === "contro-android") {
      return `
        <svg class="mockup-svg" viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Left Architecture Card -->
          <rect x="16" y="22" width="218" height="156" rx="14" fill="#140907" stroke="rgba(255,152,92,0.24)"/>
          <text x="32" y="44" fill="#FFB347" font-family="monospace" font-size="8.5" font-weight="700">JETPACK COMPOSE · KOTLIN</text>
          <text x="32" y="66" fill="#FFF8F3" font-family="sans-serif" font-size="16" font-weight="700">Contro Dark UI</text>
          <text x="32" y="82" fill="#B89B8E" font-family="monospace" font-size="7.5">UNIDIRECTIONAL DATA FLOW (UDF)</text>
          <!-- Token Palette Chips -->
          <rect x="32" y="96" width="38" height="22" rx="6" fill="#0B0605" stroke="rgba(255,200,150,0.28)"/>
          <rect x="78" y="96" width="38" height="22" rx="6" fill="#FF5E1A"/>
          <rect x="124" y="96" width="38" height="22" rx="6" fill="#E11D48"/>
          <rect x="170" y="96" width="46" height="22" rx="6" fill="#FFD166"/>
          <!-- UDF Flow Bar -->
          <rect x="32" y="132" width="54" height="26" rx="7" fill="rgba(255,107,26,0.18)" stroke="#FF6B1A"/>
          <text x="43" y="148" fill="#FFB347" font-family="monospace" font-size="8">STATE</text>
          <path d="M90 145H108" stroke="#FF6B1A" stroke-width="1.6"/>
          <rect x="110" y="132" width="54" height="26" rx="7" fill="rgba(225,29,72,0.2)" stroke="#FB7185"/>
          <text x="128" y="148" fill="#FFE4E6" font-family="monospace" font-size="8">UI</text>
          <path d="M168 145H182" stroke="#FFD166" stroke-width="1.6"/>
          <rect x="184" y="132" width="36" height="26" rx="7" fill="rgba(255,209,102,0.18)" stroke="#FFD166"/>
          <text x="192" y="148" fill="#FFD166" font-family="monospace" font-size="7.5">NAV</text>
          <!-- Right Native Android Device Frame -->
          <rect x="256" y="10" width="138" height="180" rx="22" fill="#1C0C08" stroke="#FF6B1A" stroke-width="1.5"/>
          <rect x="304" y="18" width="42" height="5" rx="2.5" fill="rgba(255,208,160,0.25)"/>
          <text x="272" y="42" fill="#FFB347" font-family="monospace" font-size="8" font-weight="700">CONTRO · ANDROID</text>
          <rect x="272" y="52" width="106" height="44" rx="10" fill="rgba(255,107,26,0.12)" stroke="rgba(255,107,26,0.4)"/>
          <rect x="282" y="63" width="60" height="6" rx="3" fill="#FF6B1A"/>
          <rect x="282" y="76" width="84" height="6" rx="3" fill="rgba(255,214,170,0.25)"/>
          <rect x="272" y="106" width="48" height="36" rx="9" fill="rgba(255,160,96,0.06)" stroke="rgba(255,152,92,0.22)"/>
          <rect x="330" y="106" width="48" height="36" rx="9" fill="rgba(225,29,72,0.2)" stroke="rgba(251,113,133,0.45)"/>
          <rect x="272" y="152" width="106" height="24" rx="12" fill="url(#controFlame)"/>
          <text x="291" y="167" fill="#160703" font-family="sans-serif" font-size="8.5" font-weight="700">COMPOSE NAV</text>
          <defs>
            <linearGradient id="controFlame" x1="272" y1="152" x2="378" y2="176" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFD166"/><stop offset="1" stop-color="#FF5E1A"/>
            </linearGradient>
          </defs>
        </svg>`;
    }

    if (type === "ai-classroom") {
      return `
        <svg class="mockup-svg" viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="10" y="10" width="400" height="180" rx="14" fill="#140907" stroke="rgba(255,107,26,0.4)" stroke-width="1.2"/>
          <!-- RBAC Multi-Portal Header Tabs -->
          <text x="26" y="32" fill="#FFB347" font-family="monospace" font-size="8.5" font-weight="700">MULTI-PORTAL RBAC · EDTECH AI</text>
          <rect x="220" y="19" width="54" height="18" rx="9" fill="#FF6B1A"/>
          <text x="229" y="31" fill="#160703" font-family="monospace" font-size="7.5" font-weight="700">TEACHER</text>
          <rect x="280" y="19" width="54" height="18" rx="9" fill="rgba(255,168,102,0.08)" stroke="rgba(255,152,92,0.25)"/>
          <text x="289" y="31" fill="#EBD8CE" font-family="monospace" font-size="7.5">STUDENT</text>
          <rect x="340" y="19" width="58" height="18" rx="9" fill="rgba(225,29,72,0.22)" stroke="rgba(251,113,133,0.48)"/>
          <text x="346" y="31" fill="#FECDD3" font-family="monospace" font-size="7.2">PRINCIPAL</text>
          <line x1="10" y1="45" x2="410" y2="45" stroke="rgba(255,152,92,0.16)"/>
          <!-- Left: AI Lesson Preparation Workflow -->
          <rect x="24" y="58" width="210" height="118" rx="10" fill="rgba(30,14,10,0.92)" stroke="rgba(255,107,26,0.34)"/>
          <text x="36" y="76" fill="#FFB347" font-family="monospace" font-size="8">AI LESSON STUDIO · SYLLABUS SYNC</text>
          <rect x="36" y="86" width="184" height="24" rx="7" fill="rgba(255,107,26,0.14)" stroke="rgba(255,107,26,0.38)"/>
          <text x="46" y="101" fill="#FFF4EC" font-family="sans-serif" font-size="8.5">Unit 04 · Structured Lesson Plan Ready</text>
          <rect x="36" y="119" width="184" height="8" rx="4" fill="rgba(255,184,120,0.1)"/>
          <rect x="36" y="119" width="144" height="8" rx="4" fill="url(#classFlame)"/>
          <text x="36" y="142" fill="#B89B8E" font-family="monospace" font-size="7.8">Syllabus Progress: 78% Tracked</text>
          <text x="36" y="158" fill="#FFD166" font-family="monospace" font-size="7.8">Attendance &amp; Assignments Linked</text>
          <!-- Right: RBAC Access Shield -->
          <rect x="248" y="58" width="148" height="118" rx="10" fill="rgba(30,14,10,0.92)" stroke="rgba(225,29,72,0.4)"/>
          <text x="260" y="76" fill="#FDA4AF" font-family="monospace" font-size="8">RBAC PERMISSIONS</text>
          <rect x="260" y="88" width="124" height="20" rx="6" fill="rgba(255,209,102,0.16)"/>
          <text x="270" y="101" fill="#FFD166" font-family="monospace" font-size="7.5">✓ Academic Records Lock</text>
          <rect x="260" y="114" width="124" height="20" rx="6" fill="rgba(255,107,26,0.16)"/>
          <text x="270" y="127" fill="#FFB347" font-family="monospace" font-size="7.5">✓ Principal Analytics</text>
          <rect x="260" y="140" width="124" height="20" rx="6" fill="rgba(225,29,72,0.2)"/>
          <text x="270" y="153" fill="#FECDD3" font-family="monospace" font-size="7.5">✓ Data Privacy Flows</text>
          <defs>
            <linearGradient id="classFlame" x1="36" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
              <stop stop-color="#E11D48"/><stop offset="0.55" stop-color="#FF5E1A"/><stop offset="1" stop-color="#FFD166"/>
            </linearGradient>
          </defs>
        </svg>`;
    }

    // C & C++ Core Algorithms & Logic Suite
    return `
      <svg class="mockup-svg" viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="10" y="10" width="400" height="180" rx="14" fill="#140907" stroke="rgba(255,138,43,0.42)" stroke-width="1.2"/>
        <!-- CLI Header -->
        <circle cx="28" cy="26" r="3.5" fill="#FF6B1A"/>
        <circle cx="40" cy="26" r="3.5" fill="#E11D48"/>
        <circle cx="52" cy="26" r="3.5" fill="#FFD166"/>
        <text x="72" y="29" fill="#D7C3B8" font-family="monospace" font-size="8.5">gcc -Wall -O2 algorithms.cpp &amp;&amp; ./a.out</text>
        <line x1="10" y1="40" x2="410" y2="40" stroke="rgba(255,152,92,0.16)"/>
        <!-- Left Code & Trace Table -->
        <rect x="24" y="52" width="194" height="124" rx="10" fill="rgba(28,12,9,0.92)" stroke="rgba(255,152,92,0.22)"/>
        <text x="36" y="70" fill="#FFB347" font-family="monospace" font-size="8.5">class MatrixEngine {</text>
        <text x="44" y="86" fill="#F4E3D9" font-family="monospace" font-size="8">void inPlaceSort(int* a);</text>
        <text x="44" y="101" fill="#F4E3D9" font-family="monospace" font-size="8">void mergeArrays(int n);</text>
        <text x="44" y="116" fill="#F4E3D9" font-family="monospace" font-size="8">int freqCount(int key);</text>
        <text x="36" y="131" fill="#FFB347" font-family="monospace" font-size="8.5">};</text>
        <rect x="36" y="143" width="168" height="22" rx="6" fill="rgba(255,209,102,0.16)" stroke="rgba(255,209,102,0.45)"/>
        <text x="46" y="157" fill="#FFD166" font-family="monospace" font-size="8">✓ TRACE TABLE · 0 LEAKS</text>
        <!-- Right Array / Pattern Matrix Visualizer -->
        <rect x="230" y="52" width="166" height="124" rx="10" fill="rgba(28,12,9,0.92)" stroke="rgba(255,107,26,0.34)"/>
        <text x="244" y="70" fill="#FDA4AF" font-family="monospace" font-size="8">2D ARRAY &amp; PATTERN MATRIX</text>
        <!-- Matrix Cells -->
        <rect x="244" y="82" width="28" height="22" rx="5" fill="rgba(255,107,26,0.26)" stroke="#FF6B1A"/>
        <text x="254" y="96" fill="#FFF8F3" font-family="monospace" font-size="9">01</text>
        <rect x="278" y="82" width="28" height="22" rx="5" fill="rgba(225,29,72,0.22)" stroke="#FB7185"/>
        <text x="288" y="96" fill="#FFE4E6" font-family="monospace" font-size="9">04</text>
        <rect x="312" y="82" width="28" height="22" rx="5" fill="rgba(255,160,56,0.2)" stroke="#FFB347"/>
        <text x="322" y="96" fill="#FFF8F3" font-family="monospace" font-size="9">09</text>
        <rect x="346" y="82" width="28" height="22" rx="5" fill="rgba(255,209,102,0.24)" stroke="#FFD166"/>
        <text x="356" y="96" fill="#FFD166" font-family="monospace" font-size="9">16</text>

        <rect x="244" y="112" width="28" height="22" rx="5" fill="rgba(225,29,72,0.22)" stroke="#FB7185"/>
        <text x="254" y="126" fill="#FFE4E6" font-family="monospace" font-size="9">25</text>
        <rect x="278" y="112" width="28" height="22" rx="5" fill="rgba(255,107,26,0.28)" stroke="#FF6B1A"/>
        <text x="288" y="126" fill="#FFF8F3" font-family="monospace" font-size="9">36</text>
        <rect x="312" y="112" width="28" height="22" rx="5" fill="rgba(255,209,102,0.24)" stroke="#FFD166"/>
        <text x="322" y="126" fill="#FFD166" font-family="monospace" font-size="9">49</text>
        <rect x="346" y="112" width="28" height="22" rx="5" fill="rgba(255,160,56,0.2)" stroke="#FFB347"/>
        <text x="356" y="126" fill="#FFF8F3" font-family="monospace" font-size="9">64</text>

        <text x="244" y="156" fill="#B89B8E" font-family="monospace" font-size="7.5">OOP · Encapsulation · Edge QA</text>
      </svg>`;
  }

  function renderSkillIcon(name) {
    const icons = {
      compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
      layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
      mobile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
      database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
      code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
    };
    return icons[name] || icons.layers;
  }

  /* -------------------------------------------------------------------------- */
  /* Render All Sections                                                        */
  /* -------------------------------------------------------------------------- */
  function renderProfile() {
    const p = resumeData.profile;
    document.title = `${p.name} — ${p.role} · Interactive 3D Resume`;

    const navAvatar = document.getElementById("nav-avatar");
    if (navAvatar) {
      if (p.photo) {
        navAvatar.innerHTML = `<img src="${esc(p.photo)}" alt="${esc(p.name)}" />`;
        const img = navAvatar.querySelector("img");
        img.onerror = () => {
          navAvatar.textContent = p.initials || p.name.slice(0, 2).toUpperCase();
        };
      } else {
        navAvatar.textContent = p.initials || p.name.slice(0, 2).toUpperCase();
      }
    }

    const heroPortraitImg = document.getElementById("hero-portrait-img");
    const cvPortraitImg = document.getElementById("cv-portrait-img");
    if (heroPortraitImg && p.photo) heroPortraitImg.src = p.photo;
    if (cvPortraitImg && p.photo) cvPortraitImg.src = p.photo;

    document.getElementById("nav-name").textContent = p.name;
    document.getElementById("hero-availability").textContent = p.availability;
    document.getElementById("hero-name").textContent = p.name;
    document.getElementById("hero-role").textContent = p.role;
    document.getElementById("hero-tagline").textContent = p.tagline;
    document.getElementById("hero-summary").textContent = p.summary;
    document.getElementById("footer-name").textContent = p.name;
    document.getElementById("footer-year").textContent = new Date().getFullYear();

    const captionName = document.getElementById("portrait-caption-name");
    const captionSub = document.getElementById("portrait-caption-sub");
    if (captionName) captionName.textContent = p.name;
    if (captionSub) captionSub.textContent = `${p.location.toUpperCase()}`;

    const langEl = document.getElementById("profile-languages");
    if (langEl && p.languages) langEl.textContent = p.languages;

    const prefEl = document.getElementById("profile-preferences");
    if (prefEl) prefEl.textContent = p.availability;

    const contactMailto = document.getElementById("contact-mailto");
    if (contactMailto) contactMailto.href = `mailto:${p.email}`;

    const contactTel = document.getElementById("contact-tel");
    if (contactTel) {
      contactTel.href = `tel:${p.phone.replace(/\s+/g, "")}`;
      contactTel.textContent = `Call ${p.phone}`;
    }

    const websiteHref = p.websiteUrl || (p.website.startsWith("http") ? p.website : `https://${p.website}`);

    const contactWebsite = document.getElementById("contact-website");
    if (contactWebsite) {
      contactWebsite.href = websiteHref;
      contactWebsite.textContent = `${p.website} ↗`;
    }

    // Meta Strip
    const metaStrip = document.getElementById("hero-meta-strip");
    metaStrip.innerHTML = `
      <span class="meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${esc(p.location)}
      </span>
      <span class="meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        ${esc(p.experienceYears)}
      </span>
      <a class="meta-item meta-link" href="mailto:${esc(p.email)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        ${esc(p.email)}
      </a>
      <a class="meta-item meta-link" href="tel:${esc(p.phone.replace(/\s+/g, ""))}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        ${esc(p.phone)}
      </a>
      <a class="meta-item meta-link" href="${esc(websiteHref)}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        ${esc(p.website)}
      </a>
    `;

    // Social Chips
    const socialRow = document.getElementById("hero-social-row");
    socialRow.innerHTML = p.links
      .map(
        (l) => `
        <a class="social-chip" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
          <strong>${esc(l.label)}</strong> · ${esc(l.handle)}
        </a>`
      )
      .join("");
  }

  function renderMetrics() {
    const el = document.getElementById("hero-metrics");
    el.innerHTML = resumeData.metrics
      .map(
        (m, i) => `
        <div class="glass-card metric-card tilt-3d" data-tilt-max="7">
          <div class="metric-value" data-count-target="${esc(m.value)}" data-prefix="${esc(m.prefix)}" data-suffix="${esc(m.suffix)}" id="metric-val-${i}">
            ${esc(m.prefix)}${esc(m.value)}${esc(m.suffix)}
          </div>
          <div class="metric-label">${esc(m.label)}</div>
          <div class="metric-sub">${esc(m.sublabel)}</div>
        </div>`
      )
      .join("");
  }

  function animateCounters() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll("[data-count-target]").forEach((el) => {
      const target = parseFloat(el.dataset.countTarget);
      if (Number.isNaN(target)) return;
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const isDecimal = String(target).includes(".");
      const duration = 900;
      const start = performance.now();

      function step(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = target * eased;
        el.textContent = `${prefix}${isDecimal ? val.toFixed(1) : Math.round(val)}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function renderExperience() {
    const list = document.getElementById("experience-list");
    list.innerHTML = resumeData.experience
      .map(
        (exp) => `
        <article class="exp-item reveal">
          <span class="exp-node" aria-hidden="true"></span>
          <div class="glass-card exp-card">
            <div class="exp-top">
              <div>
                <h3 class="exp-role">${esc(exp.role)}</h3>
                <div class="exp-company-row">
                  <span class="exp-company">${esc(exp.company)}</span>
                  <span class="exp-company-type">· ${esc(exp.companyType)}</span>
                </div>
              </div>
              <div class="exp-meta-right">
                <span class="exp-period">${esc(exp.period)}</span>
                <span class="exp-location">${esc(exp.location)}</span>
              </div>
            </div>

            <div class="exp-impact-row">
              ${exp.impactMetrics.map((m) => `<span class="impact-pill">${esc(m)}</span>`).join("")}
              ${
                exp.liveUrl
                  ? `<a class="social-chip" href="${esc(exp.liveUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--cyan); border-color: var(--border-cyan);">Visit Live Platform ↗</a>`
                  : ""
              }
            </div>

            <p class="exp-summary">${esc(exp.summary)}</p>

            <ul class="exp-highlights">
              ${exp.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}
            </ul>

            <div class="tool-tags">
              ${exp.tools.map((t) => `<span class="tool-tag">${esc(t)}</span>`).join("")}
            </div>
          </div>
        </article>`
      )
      .join("");
  }

  function renderCaseFilters() {
    const categories = ["All", ...new Set(resumeData.caseStudies.map((c) => c.category))];
    const bar = document.getElementById("case-filters");
    bar.innerHTML = categories
      .map(
        (cat) => `
        <button
          type="button"
          class="filter-pill ${cat === activeCategory ? "active" : ""}"
          role="tab"
          aria-selected="${cat === activeCategory}"
          data-category="${esc(cat)}"
        >
          ${esc(cat)}
        </button>`
      )
      .join("");

    bar.querySelectorAll(".filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.category;
        renderCaseFilters();
        renderCases();
        bindTiltAndSpotlight();
      });
    });
  }

  function renderCases() {
    const grid = document.getElementById("case-grid");
    const items =
      activeCategory === "All"
        ? resumeData.caseStudies
        : resumeData.caseStudies.filter((c) => c.category === activeCategory);

    grid.innerHTML = items
      .map(
        (c) => `
        <article
          class="glass-card case-card tilt-3d"
          data-tilt-max="8"
          data-case-id="${esc(c.id)}"
          tabindex="0"
          role="button"
          aria-label="Open project details: ${esc(c.title)}"
        >
          <div class="case-visual">
            <span class="case-category-badge">${esc(c.category)}</span>
            <div class="case-metric-badge tilt-lift">
              <strong>${esc(c.heroMetric)}</strong>
              <span>${esc(c.heroMetricLabel)}</span>
            </div>
            ${renderMockupSVG(c.mockupType)}
          </div>
          <div class="case-body">
            <div class="case-meta">
              <span>${esc(c.client)} · ${esc(c.role)}</span>
              <span>${esc(c.year)}</span>
            </div>
            <h3 class="case-title">${esc(c.title)}</h3>
            <p class="case-summary">${esc(c.summary)}</p>
            <div class="tool-tags">
              ${c.tags.map((t) => `<span class="tool-tag">${esc(t)}</span>`).join("")}
            </div>
            <div class="case-footer">
              <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${esc(c.duration)}</span>
              <span class="case-cta">
                Inspect Architecture
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            </div>
          </div>
        </article>`
      )
      .join("");

    grid.querySelectorAll(".case-card").forEach((card) => {
      const open = () => openCaseModal(card.dataset.caseId);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function renderSkills() {
    const grid = document.getElementById("skills-grid");
    grid.innerHTML = resumeData.skillGroups
      .map(
        (group) => `
        <div class="glass-card skill-group-card ${group.spanFull ? "span-full" : ""} reveal">
          <div class="skill-group-head">
            <span class="skill-icon" aria-hidden="true">${renderSkillIcon(group.icon)}</span>
            <h3 class="skill-group-title">${esc(group.category)}</h3>
          </div>
          <div class="skill-list">
            ${group.items
              .map(
                (item) => `
                <div>
                  <div class="skill-row-head">
                    <span class="skill-name">${esc(item.name)}</span>
                    <span class="skill-tag">${esc(item.tag)} · ${esc(item.level)}%</span>
                  </div>
                  <div class="skill-track" role="progressbar" aria-valuenow="${esc(item.level)}" aria-valuemin="0" aria-valuemax="100">
                    <div class="skill-fill" style="--lvl: ${esc(item.level)}%;"></div>
                  </div>
                </div>`
              )
              .join("")}
          </div>
        </div>`
      )
      .join("");
  }

  function renderProcess() {
    const grid = document.getElementById("process-grid");
    grid.innerHTML = resumeData.process
      .map(
        (p) => `
        <div class="glass-card process-card tilt-3d reveal" data-tilt-max="6">
          <span class="process-step">FOCUS ${esc(p.step)}</span>
          <h3 class="process-title">${esc(p.title)}</h3>
          <p class="process-desc">${esc(p.description)}</p>
          <div class="tool-tags">
            ${p.artifacts.map((a) => `<span class="tool-tag">${esc(a)}</span>`).join("")}
          </div>
        </div>`
      )
      .join("");

    const practicesEl = document.getElementById("practices-grid");
    if (practicesEl && Array.isArray(resumeData.engineeringPractices)) {
      practicesEl.innerHTML = resumeData.engineeringPractices
        .map(
          (item) => `
          <div class="practice-item">
            <strong>${esc(item.title)}</strong>
            <p>${esc(item.detail)}</p>
          </div>`
        )
        .join("");
    }
  }

  function renderCredentials() {
    document.getElementById("education-list").innerHTML = resumeData.education
      .map(
        (e) => `
        <div>
          <div class="cred-item-title">${esc(e.degree)}</div>
          <div class="cred-item-sub">${esc(e.institution)}</div>
          <div class="cred-item-meta">${esc(e.period)} · ${esc(e.details)}</div>
        </div>`
      )
      .join("");

    document.getElementById("certifications-list").innerHTML = resumeData.certifications
      .map(
        (c) => `
        <div>
          <div class="cred-item-title">${esc(c.title)}</div>
          <div class="cred-item-sub">${esc(c.issuer)}</div>
          <div class="cred-item-meta">${esc(c.year)}</div>
        </div>`
      )
      .join("");

    document.getElementById("awards-list").innerHTML = resumeData.awards
      .map(
        (a) => `
        <div>
          <div class="cred-item-title">${esc(a.title)}</div>
          <div class="cred-item-sub">${esc(a.organization)} · ${esc(a.year)}</div>
          <div class="cred-item-meta">${esc(a.project)}</div>
        </div>`
      )
      .join("");
  }

  /* -------------------------------------------------------------------------- */
  /* Project Deep-Dive Modal                                                    */
  /* -------------------------------------------------------------------------- */
  const caseModal = document.getElementById("case-modal");
  const caseModalClose = document.getElementById("case-modal-close");

  function openCaseModal(id) {
    const c = resumeData.caseStudies.find((item) => item.id === id);
    if (!c) return;

    document.getElementById("case-modal-eyebrow").textContent = `${c.category} · ${c.client} · ${c.year}`;
    document.getElementById("case-modal-title").textContent = c.title;
    document.getElementById("case-modal-content").innerHTML = `
      <div class="case-visual" style="border-radius: 14px; border: 1px solid var(--border-subtle); height: 220px;">
        <div class="case-metric-badge">
          <strong>${esc(c.heroMetric)}</strong>
          <span>${esc(c.heroMetricLabel)}</span>
        </div>
        ${renderMockupSVG(c.mockupType)}
      </div>

      <div class="modal-outcomes-grid">
        ${c.outcomes
          .map(
            (o) => `
            <div class="outcome-box">
              <strong>${esc(o.value)}</strong>
              <span>${esc(o.label)}</span>
            </div>`
          )
          .join("")}
      </div>

      <div class="modal-story-grid">
        <div class="story-block">
          <h4>01 · Challenge</h4>
          <p>${esc(c.problem)}</p>
        </div>
        <div class="story-block">
          <h4>02 · UX &amp; Discovery</h4>
          <p>${esc(c.research)}</p>
        </div>
        <div class="story-block">
          <h4>03 · Architecture &amp; Build</h4>
          <p>${esc(c.solution)}</p>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div>
          <p style="font-family: var(--font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--cyan); margin-bottom: 10px;">
            Key Deliverables (${esc(c.role)} · ${esc(c.duration)})
          </p>
          <div class="tool-tags">
            ${c.deliverables.map((d) => `<span class="impact-pill">${esc(d)}</span>`).join("")}
          </div>
        </div>
        ${
          c.liveUrl
            ? `<a class="btn btn-primary" href="${esc(c.liveUrl)}" target="_blank" rel="noopener noreferrer">Launch Live Platform ↗</a>`
            : ""
        }
      </div>
    `;

    caseModal.hidden = false;
    void caseModal.offsetWidth;
    caseModal.classList.add("open");
    document.body.style.overflow = "hidden";
    caseModalClose.focus();
  }

  function closeCaseModal() {
    if (!caseModal.classList.contains("open")) return;
    caseModal.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
      caseModal.hidden = true;
    }, 240);
  }

  caseModalClose.addEventListener("click", closeCaseModal);
  caseModal.addEventListener("click", (e) => {
    if (e.target === caseModal) closeCaseModal();
  });

  /* -------------------------------------------------------------------------- */
  /* Live Customize Resume Drawer                                               */
  /* -------------------------------------------------------------------------- */
  const drawer = document.getElementById("customize-drawer");
  const drawerOverlay = document.getElementById("customize-overlay");
  const customizeForm = document.getElementById("customize-form");

  function syncDrawerInputs() {
    const p = resumeData.profile;
    document.getElementById("edit-name").value = p.name;
    document.getElementById("edit-initials").value = p.initials;
    document.getElementById("edit-role").value = p.role;
    document.getElementById("edit-availability").value = p.availability;
    document.getElementById("edit-location").value = p.location;
    document.getElementById("edit-years").value = p.experienceYears;
    document.getElementById("edit-email").value = p.email;
    document.getElementById("edit-phone").value = p.phone;
    document.getElementById("edit-website").value = p.website;
    document.getElementById("edit-languages").value = p.languages || "";
    document.getElementById("edit-tagline").value = p.tagline;
    document.getElementById("edit-summary").value = p.summary;
    document.getElementById("edit-orbit-skills").value = resumeData.orbitSkills.join(", ");
  }

  function openCustomize() {
    syncDrawerInputs();
    drawer.classList.add("open");
    drawerOverlay.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.getElementById("edit-name").focus();
  }

  function closeCustomize() {
    drawer.classList.remove("open");
    drawerOverlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }

  customizeForm.addEventListener("input", () => {
    const p = resumeData.profile;
    p.name = document.getElementById("edit-name").value.trim() || "Abhijith Saji";
    p.initials = document.getElementById("edit-initials").value.trim() || p.name.slice(0, 2).toUpperCase();
    p.role = document.getElementById("edit-role").value.trim();
    p.availability = document.getElementById("edit-availability").value.trim();
    p.location = document.getElementById("edit-location").value.trim();
    p.experienceYears = document.getElementById("edit-years").value.trim();
    p.email = document.getElementById("edit-email").value.trim();
    p.phone = document.getElementById("edit-phone").value.trim();
    p.website = document.getElementById("edit-website").value.trim();
    p.websiteUrl = p.website.startsWith("http") ? p.website : `https://${p.website}`;
    p.languages = document.getElementById("edit-languages").value.trim();
    p.tagline = document.getElementById("edit-tagline").value.trim();
    p.summary = document.getElementById("edit-summary").value.trim();

    const skillsRaw = document.getElementById("edit-orbit-skills").value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillsRaw.length >= 3) {
      resumeData.orbitSkills = skillsRaw;
      if (window.Portfolio3D) window.Portfolio3D.setSkills(skillsRaw);
    }

    renderProfile();
    saveData();
  });

  document.getElementById("customize-reset").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    resumeData = deepClone(window.DEFAULT_RESUME_DATA);
    renderProfile();
    syncDrawerInputs();
    if (window.Portfolio3D) window.Portfolio3D.setSkills(resumeData.orbitSkills);
    showToast("Restored Abhijith Saji's default CV data.");
  });

  document.getElementById("customize-export").addEventListener("click", () => {
    const fileContent =
      `/**\n * Abhijith Saji — Customized Interactive 3D Resume Data\n */\nwindow.DEFAULT_RESUME_DATA = ${JSON.stringify(
        resumeData,
        null,
        2
      )};\n`;
    const blob = new Blob([fileContent], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-data.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Downloaded resume-data.js — replace the file in your folder to save permanently!");
  });

  document.getElementById("btn-customize").addEventListener("click", openCustomize);
  document.getElementById("customize-close").addEventListener("click", closeCustomize);
  drawerOverlay.addEventListener("click", closeCustomize);

  /* -------------------------------------------------------------------------- */
  /* 3D Perspective Card Tilt + Cursor Spotlight Illumination                   */
  /* -------------------------------------------------------------------------- */
  function bindTiltAndSpotlight() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll(".glass-card").forEach((card) => {
      if (card.dataset.spotlightBound) return;
      card.dataset.spotlightBound = "1";

      card.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" || document.body.classList.contains("cv-mode")) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);

        if (!reduced && card.classList.contains("tilt-3d")) {
          const max = parseFloat(card.dataset.tiltMax || "7");
          const normX = (x / rect.width - 0.5) * 2;
          const normY = (y / rect.height - 0.5) * 2;
          const rotY = normX * max;
          const rotX = -normY * max;
          card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-3px)`;
        }
      });

      card.addEventListener("pointerleave", () => {
        if (card.classList.contains("tilt-3d")) {
          card.style.transform = "";
        }
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Global Controls, Copy Email, CV View, Motion Pause & Scroll Choreography   */
  /* -------------------------------------------------------------------------- */
  function triggerPrint() {
    window.print();
  }

  function copyEmail() {
    const email = resumeData.profile.email;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(email)
        .then(() => showToast(`Copied ${email} to clipboard`))
        .catch(() => showToast(`Email: ${email}`));
    } else {
      showToast(`Email: ${email}`);
    }
  }

  function toggleCvMode() {
    const active = document.body.classList.toggle("cv-mode");
    const btn = document.getElementById("btn-cv-mode");
    btn.classList.toggle("is-active", active);
    showToast(active ? "Switched to Clean ATS CV View" : "Switched to Interactive 3D Showcase");
  }

  function toggleMotion() {
    if (!window.Portfolio3D) return;
    const paused = window.Portfolio3D.togglePause();
    const btn = document.getElementById("btn-motion-toggle");
    btn.classList.toggle("is-active", paused);
    btn.innerHTML = paused
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    showToast(paused ? "3D Motion Paused" : "3D Motion Resumed");
  }

  document.getElementById("btn-print-pdf").addEventListener("click", triggerPrint);
  document.getElementById("hero-print-btn").addEventListener("click", triggerPrint);
  document.getElementById("contact-print-btn").addEventListener("click", triggerPrint);
  document.getElementById("hero-copy-email").addEventListener("click", copyEmail);
  document.getElementById("contact-copy-email").addEventListener("click", copyEmail);
  document.getElementById("btn-cv-mode").addEventListener("click", toggleCvMode);
  document.getElementById("btn-motion-toggle").addEventListener("click", toggleMotion);

  // 3D Hero Stage Mode Switcher ('portrait' | 'core' | 'grid' | 'torus')
  const portraitLayer = document.getElementById("hero-portrait-layer");
  document.querySelectorAll("#hero-3d-shape-btns .shape-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#hero-3d-shape-btns .shape-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const shape = btn.dataset.shape;
      if (portraitLayer) {
        portraitLayer.classList.toggle("is-hidden", shape !== "portrait");
      }
      if (window.Portfolio3D) window.Portfolio3D.setHeroShape(shape);
    });
  });

  // Scroll Progress, Spatial Depth Coordinate & Active Nav Scroll-Spy
  function setupScrollBehaviors() {
    const progressEl = document.getElementById("scroll-progress");
    const depthEl = document.getElementById("depth-readout");
    const navLinks = Array.from(document.querySelectorAll("#nav-links .nav-link"));
    const dockLinks = Array.from(document.querySelectorAll("#mobile-dock .dock-item"));
    const sectionIds = navLinks.map((l) => l.dataset.section);

    function onScroll() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
      progressEl.style.width = `${pct.toFixed(1)}%`;

      if (depthEl) {
        const zCoord = String(Math.round(pct * 24)).padStart(4, "0");
        depthEl.textContent = `Z · ${zCoord}`;
      }

      let current = sectionIds[0];
      const offset = window.scrollY + 180;
      sectionIds.forEach((id) => {
        const sec = document.getElementById(id);
        if (sec && sec.offsetTop <= offset) current = id;
      });
      navLinks.forEach((l) => l.classList.toggle("active", l.dataset.section === current));
      dockLinks.forEach((l) => l.classList.toggle("active", l.dataset.section === current));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -10px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    const inField = tag === "INPUT" || tag === "TEXTAREA";

    if (e.key === "Escape") {
      closeCaseModal();
      closeCustomize();
      return;
    }
    if (inField || e.ctrlKey || e.metaKey || e.altKey) return;

    const k = e.key.toLowerCase();
    if (k === "p") {
      e.preventDefault();
      triggerPrint();
    } else if (k === "c") {
      toggleCvMode();
    } else if (k === "e") {
      e.preventDefault();
      openCustomize();
    }
  });

  /* -------------------------------------------------------------------------- */
  /* Bootstrap                                                                  */
  /* -------------------------------------------------------------------------- */
  function init() {
    renderProfile();
    renderMetrics();
    renderExperience();
    renderCaseFilters();
    renderCases();
    renderSkills();
    renderProcess();
    renderCredentials();
    bindTiltAndSpotlight();
    setupScrollBehaviors();
    animateCounters();

    if (window.Portfolio3D) {
      window.Portfolio3D.init(resumeData.orbitSkills);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
