const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Boot sequence — a brief terminal-style intro, shown once per session.
const boot = document.querySelector("#boot");
if (boot) {
  const bootCmdEl = boot.querySelector(".boot-cmd");
  let bootSeen = false;
  try {
    bootSeen = sessionStorage.getItem("boot-seen") === "1";
  } catch {
    bootSeen = false;
  }
  if (reduceMotion || bootSeen) {
    boot.remove();
  } else {
    const bootText = "mount lakehouse --bronze --silver --gold";
    let charIndex = 0;
    const typeBoot = () => {
      bootCmdEl.textContent = bootText.slice(0, charIndex);
      charIndex += 1;
      if (charIndex <= bootText.length) {
        window.setTimeout(typeBoot, 18);
      }
    };
    typeBoot();
    window.setTimeout(() => {
      boot.classList.add("hide");
      try {
        sessionStorage.setItem("boot-seen", "1");
      } catch {
        /* storage unavailable, ignore */
      }
      window.setTimeout(() => boot.remove(), 550);
    }, 1150);
  }
}

const progressBar = document.querySelector(".scroll-progress span");
const cursorGlow = document.querySelector(".cursor-glow");
const cursorRing = document.querySelector(".cursor-ring");

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
    pointerX = event.clientX;
    pointerY = event.clientY;
  }, { passive: true });

  if (cursorRing && !reduceMotion) {
    let ringX = pointerX;
    let ringY = pointerY;
    const trailRing = () => {
      ringX += (pointerX - ringX) * 0.2;
      ringY += (pointerY - ringY) * 0.2;
      cursorRing.style.transform = `translate(${ringX - 17}px, ${ringY - 17}px)`;
      requestAnimationFrame(trailRing);
    };
    requestAnimationFrame(trailRing);
  }

  const magneticEls = document.querySelectorAll(".button, .nav-mail, .copy-button, .identity-mark");
  magneticEls.forEach((el) => {
    el.addEventListener("pointerenter", () => cursorRing && cursorRing.classList.add("active"));
    el.addEventListener("pointerleave", () => {
      cursorRing && cursorRing.classList.remove("active");
      if (!reduceMotion) el.style.transform = "";
    });
    if (!reduceMotion) {
      el.addEventListener("pointermove", (event) => {
        const bounds = el.getBoundingClientRect();
        const relX = event.clientX - (bounds.left + bounds.width / 2);
        const relY = event.clientY - (bounds.top + bounds.height / 2);
        el.style.transform = `translate(${relX * 0.22}px, ${relY * 0.3}px)`;
      });
    }
  });

  document.querySelectorAll("a, button").forEach((el) => {
    if (el.matches(".button, .nav-mail, .copy-button, .identity-mark")) return;
    el.addEventListener("pointerenter", () => cursorRing && cursorRing.classList.add("active"));
    el.addEventListener("pointerleave", () => cursorRing && cursorRing.classList.remove("active"));
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -35px" });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const words = ["reliable.", "scalable.", "governed.", "valuable."];
const rotatingWord = document.querySelector("#rotating-word");
let wordIndex = 0;
const scrambleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%";

function scrambleTo(el, target) {
  const chars = target.split("");
  const steps = 12;
  let step = 0;
  const timer = window.setInterval(() => {
    el.textContent = chars
      .map((char, index) => {
        if (char === " " || char === ".") return char;
        const revealed = index < (step / steps) * chars.length;
        return revealed ? char : scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      })
      .join("");
    step += 1;
    if (step > steps) {
      window.clearInterval(timer);
      el.textContent = target;
    }
  }, 26);
}

if (!reduceMotion && rotatingWord) {
  window.setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    scrambleTo(rotatingWord, words[wordIndex]);
  }, 2700);
}

const pipelineCommands = [
  "run incremental_pipeline --validate",
  "merge silver.customer --deduplicate",
  "publish gold.analytics --quality-gate",
  "monitor pipeline_health --live",
];
const pipelineCommand = document.querySelector("#pipeline-command");
let commandIndex = 0;

if (!reduceMotion && pipelineCommand) {
  window.setInterval(() => {
    pipelineCommand.animate(
      [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-8px)" }],
      { duration: 180, fill: "forwards" },
    ).finished.then(() => {
      commandIndex = (commandIndex + 1) % pipelineCommands.length;
      pipelineCommand.textContent = pipelineCommands[commandIndex];
      pipelineCommand.animate(
        [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 240, fill: "forwards" },
      );
    });
  }, 2600);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix ?? "";
    if (reduceMotion) {
      element.textContent = `${target}${suffix}`;
    } else {
      const start = performance.now();
      const duration = 900;
      const tick = (now) => {
        const ratio = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - ratio, 3);
        element.textContent = `${Math.round(target * eased)}${suffix}`;
        if (ratio < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    countObserver.unobserve(element);
  });
}, { threshold: 0.7 });

document.querySelectorAll("[data-count]").forEach((counter) => countObserver.observe(counter));

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".site-header nav a")];
const siteHeader = document.querySelector("#site-header");
const pipelineNav = document.querySelector(".pipeline-nav");
const navPacket = document.querySelector(".nav-packet");

function movePacketTo(link) {
  if (!navPacket || !pipelineNav || !link) return;
  const navBounds = pipelineNav.getBoundingClientRect();
  const linkBounds = link.getBoundingClientRect();
  const centre = linkBounds.left - navBounds.left + linkBounds.width / 2;
  navPacket.style.left = `${centre}px`;
  pipelineNav.classList.add("tracking");
}

function syncActiveSection() {
  const line = window.innerHeight * 0.34;
  let current = null;
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= line && rect.bottom > line) current = section;
  });
  if (!current) {
    const first = sections[0];
    if (first && first.getBoundingClientRect().top > line) {
      navLinks.forEach((link) => link.classList.remove("active"));
      if (pipelineNav) pipelineNav.classList.remove("tracking");
      return;
    }
    return;
  }
  let activeLink = null;
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${current.id}`;
    link.classList.toggle("active", isActive);
    if (isActive) activeLink = link;
  });
  if (activeLink) movePacketTo(activeLink);
  else if (pipelineNav) pipelineNav.classList.remove("tracking");
}

window.addEventListener("scroll", syncActiveSection, { passive: true });
syncActiveSection();

if (siteHeader) {
  const syncHeader = () => siteHeader.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();
}

window.addEventListener("resize", () => {
  const current = navLinks.find((link) => link.classList.contains("active"));
  if (current) movePacketTo(current);
}, { passive: true });

navLinks.forEach((link) => {
  link.addEventListener("pointerenter", () => movePacketTo(link));
});
pipelineNav && pipelineNav.addEventListener("pointerleave", () => {
  const current = navLinks.find((item) => item.classList.contains("active"));
  if (current) movePacketTo(current);
});

if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg) translateY(-5px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

const copyButton = document.querySelector(".copy-button");
const copyStatus = document.querySelector(".copy-status");

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyButton.dataset.email);
    copyButton.textContent = "Email copied";
    copyStatus.textContent = "Copied to clipboard.";
  } catch {
    copyStatus.textContent = "Copy unavailable. Select the email above.";
  }
  window.setTimeout(() => {
    copyButton.textContent = "Copy email";
    copyStatus.textContent = "";
  }, 2200);
});

const canvas = document.querySelector("#network");
const context = canvas.getContext("2d");
let width = 0;
let height = 0;
let particles = [];
let animationFrame = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const particleCount = Math.min(65, Math.max(28, Math.floor(width / 24)));
  particles = Array.from({ length: particleCount }, () => {
    const depth = Math.random() * 0.7 + 0.3;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18 * depth,
      vy: (Math.random() - 0.5) * 0.18 * depth,
      radius: (Math.random() * 1.4 + 0.5) * depth,
      depth,
    };
  });
}

const pointerFine = window.matchMedia("(pointer: fine)").matches;

function drawNetwork() {
  context.clearRect(0, 0, width, height);
  particles.forEach((particle, index) => {
    if (pointerFine) {
      const dx = particle.x - pointerX;
      const dy = particle.y - pointerY;
      const distance = Math.hypot(dx, dy);
      if (distance < 130 && distance > 0.01) {
        const force = ((130 - distance) / 130) * 0.6;
        particle.vx += (dx / distance) * force * 0.05;
        particle.vy += (dy / distance) * force * 0.05;
      }
    }
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.x < -10) particle.x = width + 10;
    if (particle.x > width + 10) particle.x = -10;
    if (particle.y < -10) particle.y = height + 10;
    if (particle.y > height + 10) particle.y = -10;

    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(91, 184, 255, ${0.25 + particle.depth * 0.35})`;
    context.fill();

    for (let next = index + 1; next < particles.length; next += 1) {
      const other = particles[next];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 125) {
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.strokeStyle = `rgba(66, 164, 255, ${0.09 * (1 - distance / 125)})`;
        context.lineWidth = 0.7;
        context.stroke();
      }
    }
  });
  animationFrame = requestAnimationFrame(drawNetwork);
}

if (!reduceMotion) {
  resizeCanvas();
  drawNetwork();
  window.addEventListener("resize", resizeCanvas);
} else {
  canvas.remove();
}

document.addEventListener("visibilitychange", () => {
  if (reduceMotion) return;
  if (document.hidden) cancelAnimationFrame(animationFrame);
  else drawNetwork();
});

const heroSystem = document.querySelector(".hero-system");
const heroSection = document.querySelector(".hero");

if (heroSystem && heroSection && !reduceMotion) {
  const updateHeroTilt = () => {
    const rect = heroSection.getBoundingClientRect();
    const travel = rect.height + window.innerHeight;
    const progress = Math.min(Math.max(1 - (rect.bottom / travel), 0), 1);
    const rotate = (progress - 0.5) * 14;
    const lift = progress * -24;
    heroSystem.style.transform = `perspective(1200px) rotateX(${rotate}deg) translateY(${lift}px)`;
  };
  window.addEventListener("scroll", updateHeroTilt, { passive: true });
  window.addEventListener("resize", updateHeroTilt, { passive: true });
  updateHeroTilt();
}

/* ── Command palette (⌘K / Ctrl+K) ─────────────────────────────────────── */
(() => {
  const root = document.querySelector("#cmdk");
  const input = document.querySelector("#cmdk-input");
  const list = document.querySelector("#cmdk-list");
  if (!root || !input || !list) return;

  const email = "mubashirr.data@gmail.com";
  const commands = [
    { group: "Navigate", icon: "01", title: "Expertise", sub: "Engineering capabilities across the data lifecycle", run: () => goTo("#expertise") },
    { group: "Navigate", icon: "02", title: "Projects", sub: "Four production data systems", run: () => goTo("#projects") },
    { group: "Navigate", icon: "03", title: "Live pipeline run", sub: "Interactive DAG — watch an incremental load recover", run: () => goTo("#pipeline") },
    { group: "Navigate", icon: "04", title: "Experience", sub: "Epsilon · Dreamcare Developers", run: () => goTo("#experience") },
    { group: "Navigate", icon: "05", title: "Credentials", sub: "Fabric · Databricks · SnowPro", run: () => goTo("#credentials") },
    { group: "Navigate", icon: "→", title: "Contact", sub: "Get in touch", run: () => goTo("#contact") },

    { group: "Projects", icon: "AZ", title: "Metadata-Driven Incremental Data Platform", sub: "Case study — ADF · watermark ingestion framework", run: () => { window.location.href = "case-azure.html"; } },
    { group: "Projects", icon: "DB", title: "Medallion Lakehouse & Dimensional Serving", sub: "Case study — Databricks · Delta MERGE · Unity Catalog", run: () => { window.location.href = "case-databricks.html"; } },
    { group: "Projects", icon: "FB", title: "Unified Retail Analytics Lakehouse", sub: "Case study — Fabric · OneLake · Direct Lake", run: () => { window.location.href = "case-fabric.html"; } },
    { group: "Projects", icon: "SF", title: "Azure-to-Snowflake Processing Platform", sub: "Case study — Snowpipe · Streams & Tasks · Time Travel", run: () => { window.location.href = "case-snowflake.html"; } },

    { group: "Credentials", kind: "cert", icon: "DP", title: "Microsoft Fabric Data Engineer Associate", sub: "Verify credential on Microsoft Learn", run: () => open("https://learn.microsoft.com/en-us/users/naqshabandisyedmubashiruddinlaeequ-3862/credentials/b01b3e2f0067073f") },
    { group: "Credentials", kind: "cert", icon: "PRO", title: "Databricks Certified Data Engineer Professional", sub: "Verify credential on Databricks", run: () => open("https://credentials.databricks.com/cf3c2d31-658e-4b5c-8b49-272cedec5c6d") },
    { group: "Credentials", kind: "cert", icon: "CO", title: "SnowPro Core Certification", sub: "Verify credential on Snowflake", run: () => open("https://achieve.snowflake.com/68e382fc-021b-465d-8d12-8744e63a7e2b") },

    { group: "Actions", kind: "action", icon: "@", title: "Send an email", sub: email, run: () => { window.location.href = `mailto:${email}`; } },
    { group: "Actions", kind: "action", icon: "⧉", title: "Copy email address", sub: email, run: copyEmail },
    { group: "Actions", kind: "action", icon: "in", title: "Open LinkedIn profile", sub: "linkedin.com/in/mubashir-syed-data-engineer", run: () => open("https://www.linkedin.com/in/mubashir-syed-data-engineer") },
    { group: "Actions", kind: "action", icon: "▶", title: "Run the pipeline demo", sub: "Trigger a simulated incremental load", run: () => { goTo("#pipeline"); window.setTimeout(() => { const b = document.querySelector("#lab-play"); if (b && !b.disabled) b.click(); }, 900); } },
    { group: "Actions", kind: "action", icon: "↑", title: "Back to top", sub: "Return to the hero", run: () => goTo("#top") },
  ];

  let results = [];
  let cursor = 0;
  let lastFocus = null;

  function open(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function goTo(hash) {
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      /* clipboard blocked — the mailto action still works */
    }
  }

  // Subsequence match: "mfab" finds "Microsoft Fabric".
  function score(query, text) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (!q) return { hit: true, ranges: [] };
    const direct = t.indexOf(q);
    if (direct > -1) return { hit: true, ranges: [[direct, direct + q.length]], weight: 100 - direct };
    let qi = 0;
    const ranges = [];
    for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
      if (t[ti] === q[qi]) {
        ranges.push([ti, ti + 1]);
        qi += 1;
      }
    }
    return qi === q.length ? { hit: true, ranges, weight: 10 } : { hit: false };
  }

  function highlight(text, ranges) {
    if (!ranges || !ranges.length) return escapeHtml(text);
    let out = "";
    let at = 0;
    ranges.forEach(([start, end]) => {
      out += `${escapeHtml(text.slice(at, start))}<mark>${escapeHtml(text.slice(start, end))}</mark>`;
      at = end;
    });
    return out + escapeHtml(text.slice(at));
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function render(query) {
    results = [];
    commands.forEach((cmd) => {
      const onTitle = score(query, cmd.title);
      const onSub = score(query, `${cmd.sub} ${cmd.group}`);
      if (onTitle.hit) results.push({ cmd, ranges: onTitle.ranges, weight: (onTitle.weight || 0) + 50 });
      else if (onSub.hit) results.push({ cmd, ranges: [], weight: onSub.weight || 0 });
    });
    results.sort((a, b) => b.weight - a.weight);

    if (!results.length) {
      list.innerHTML = `<div class="cmdk-empty"><b>No matches</b>Try “lakehouse”, “snowflake” or “email”.</div>`;
      return;
    }

    let html = "";
    let group = "";
    results.forEach((result, index) => {
      if (result.cmd.group !== group) {
        group = result.cmd.group;
        html += `<div class="cmdk-group">${escapeHtml(group.toUpperCase())}</div>`;
      }
      html += `<button class="cmdk-item" type="button" role="option" data-index="${index}" data-kind="${result.cmd.kind || "nav"}" aria-selected="${index === cursor}">
        <span class="cmdk-item-ico" aria-hidden="true">${escapeHtml(result.cmd.icon)}</span>
        <span class="cmdk-item-body">
          <span class="cmdk-item-title">${highlight(result.cmd.title, result.ranges)}</span>
          <span class="cmdk-item-sub">${escapeHtml(result.cmd.sub)}</span>
        </span>
        <span class="cmdk-item-go" aria-hidden="true">↵</span>
      </button>`;
    });
    list.innerHTML = html;
  }

  function moveCursor(delta) {
    if (!results.length) return;
    cursor = (cursor + delta + results.length) % results.length;
    [...list.querySelectorAll(".cmdk-item")].forEach((item) => {
      const selected = Number(item.dataset.index) === cursor;
      item.setAttribute("aria-selected", selected ? "true" : "false");
      if (selected) item.scrollIntoView({ block: "nearest" });
    });
  }

  function runAt(index) {
    const chosen = results[index];
    if (!chosen) return;
    closePalette();
    window.setTimeout(() => chosen.cmd.run(), 60);
  }

  function openPalette() {
    if (!root.hidden) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("cmdk-open");
    input.value = "";
    cursor = 0;
    render("");
    input.focus();
  }

  function closePalette() {
    if (root.hidden) return;
    root.hidden = true;
    document.body.classList.remove("cmdk-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.querySelectorAll("[data-cmdk-open]").forEach((el) => el.addEventListener("click", openPalette));
  document.querySelectorAll("[data-cmdk-close]").forEach((el) => el.addEventListener("click", closePalette));

  input.addEventListener("input", () => {
    cursor = 0;
    render(input.value.trim());
  });

  list.addEventListener("click", (event) => {
    const item = event.target.closest(".cmdk-item");
    if (item) runAt(Number(item.dataset.index));
  });

  list.addEventListener("pointermove", (event) => {
    const item = event.target.closest(".cmdk-item");
    if (!item) return;
    const index = Number(item.dataset.index);
    if (index === cursor) return;
    cursor = index;
    [...list.querySelectorAll(".cmdk-item")].forEach((el) => {
      el.setAttribute("aria-selected", Number(el.dataset.index) === cursor ? "true" : "false");
    });
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "k" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      root.hidden ? openPalette() : closePalette();
      return;
    }
    if (root.hidden) {
      // "/" opens too, unless the visitor is typing in a field.
      const typing = /^(input|textarea|select)$/i.test(document.activeElement.tagName);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        openPalette();
      }
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); closePalette(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); moveCursor(1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); moveCursor(-1); }
    else if (event.key === "Enter") { event.preventDefault(); runAt(cursor); }
    else if (event.key === "Tab") { event.preventDefault(); moveCursor(event.shiftKey ? -1 : 1); }
  });
})();

/* ── Live pipeline lab: simulated incremental run with rerun recovery ──── */
(() => {
  const svg = document.querySelector(".dag");
  const logEl = document.querySelector("#lab-log");
  const playBtn = document.querySelector("#lab-play");
  const resetBtn = document.querySelector("#lab-reset");
  const stateEl = document.querySelector("#lab-state");
  if (!svg || !logEl || !playBtn) return;

  const rowsEl = document.querySelector("#lab-rows");
  const durEl = document.querySelector("#lab-dur");
  const wmEl = document.querySelector("#lab-wm");
  const modeEl = document.querySelector("#lab-mode");

  const node = (id) => svg.querySelector(`.n[data-node="${id}"]`);
  const edgesTo = (id) => [...svg.querySelectorAll(`.e[data-edge="${id}"]`)];

  // Waves run in order; tasks inside a wave run together.
  const WAVES = [
    ["src", "wm"],
    ["copy"],
    ["bronze"],
    ["silver"],
    ["dim", "fact"],
    ["gold"],
  ];

  const TASKS = {
    src: { dur: 620, start: ["Resolving 12 parameterised source tables"], end: ["ok", "Source metadata resolved"] },
    wm: { dur: 620, start: ["Reading watermark control table"], end: ["ok", "Last successful load: 2026-08-27 23:00"] },
    copy: { dur: 780, start: ["Copy activity — filtering rows above watermark"], end: ["ok", "1,284 changed rows staged"] },
    bronze: { dur: 640, start: ["Writing raw partition to ADLS Gen2"], end: ["ok", "Bronze partition committed"] },
    silver: { dur: 820, start: ["PySpark — schema standardisation and dedupe"], end: ["ok", "1,284 rows cleaned to Silver"] },
    dim: { dur: 760, start: ["Delta MERGE — dim_customer (SCD Type 1)"], end: ["ok", "312 upserts applied"] },
    fact: { dur: 760, start: ["Loading fact_orders with surrogate keys"], end: ["ok", "972 rows loaded"] },
    gold: { dur: 640, start: ["Publishing Gold serving layer"], end: ["ok", "Gold model refreshed"] },
  };

  const ALL = Object.keys(TASKS);
  let clock = 0;
  let running = false;
  let attempt = 0;
  let timers = [];
  let done = new Set();

  const wait = (ms) => new Promise((resolve) => {
    const id = window.setTimeout(resolve, reduceMotion ? Math.min(ms, 90) : ms);
    timers.push(id);
  });

  function stamp() {
    clock += 1;
    const base = 8 * 3600 + 14 * 60 + 3 + clock * 2;
    const h = String(Math.floor(base / 3600) % 24).padStart(2, "0");
    const m = String(Math.floor(base / 60) % 60).padStart(2, "0");
    const s = String(base % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function log(level, message) {
    const hint = logEl.querySelector(".log-hint");
    if (hint) hint.remove();
    const li = document.createElement("li");
    li.className = `lvl-${level}`;
    const ts = document.createElement("span");
    ts.className = "log-ts";
    ts.textContent = stamp();
    const msg = document.createElement("span");
    msg.className = "log-msg";
    msg.textContent = message;
    li.append(ts, msg);
    logEl.append(li);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setNode(id, cls) {
    const el = node(id);
    if (!el) return;
    el.classList.remove("is-running", "is-done", "is-failed", "is-blocked", "is-skipped");
    if (cls) el.classList.add(cls);
  }

  function setEdges(id, cls) {
    edgesTo(id).forEach((edge) => {
      edge.classList.remove("is-flow", "is-done", "is-dead");
      if (cls) edge.classList.add(cls);
    });
  }

  function setState(state, label) {
    stateEl.dataset.state = state;
    stateEl.textContent = label;
  }

  function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  }

  function reset(full = true) {
    clearTimers();
    running = false;
    ALL.forEach((id) => { setNode(id, null); setEdges(id, null); });
    setEdges("commit", null);
    if (full) {
      attempt = 0;
      clock = 0;
      done = new Set();
      logEl.innerHTML = '<li class="log-hint">Press <b>Run pipeline</b> to execute a load.</li>';
      rowsEl.textContent = "—";
      durEl.textContent = "—";
      wmEl.textContent = "2026-08-27";
      modeEl.textContent = "Incremental";
      setState("idle", "IDLE");
      playBtn.textContent = "Run pipeline";
    }
    playBtn.disabled = false;
  }

  async function runTask(id, willFail) {
    setEdges(id, "is-flow");
    setNode(id, "is-running");
    log("info", `${id} — ${TASKS[id].start[0]}`);
    await wait(TASKS[id].dur);
    if (willFail) {
      setNode(id, "is-failed");
      setEdges(id, "is-dead");
      return false;
    }
    setNode(id, "is-done");
    setEdges(id, "is-done");
    done.add(id);
    const [level, text] = TASKS[id].end;
    log(level, `${id} — ${text}`);
    return true;
  }

  async function run() {
    if (running) return;
    running = true;
    attempt += 1;
    playBtn.disabled = true;
    resetBtn.disabled = false;
    setState("running", "RUNNING");

    const first = attempt === 1;
    const started = performance.now();

    log("head", first ? "▸ Triggered run #1 — incremental" : "▸ Triggered run #2 — resuming from failure");
    if (!first) {
      log("info", "Watermark unchanged since run #1 — no data was skipped");
    }

    for (const wave of WAVES) {
      const pending = wave.filter((id) => !done.has(id));
      pending.forEach((id) => {
        if (!done.has(id)) setNode(id, null);
      });

      wave.filter((id) => done.has(id)).forEach((id) => {
        setNode(id, "is-skipped");
        log("info", `${id} — already succeeded, skipped on rerun`);
      });

      if (!pending.length) continue;

      const results = await Promise.all(pending.map((id) => runTask(id, first && id === "fact")));

      if (results.includes(false)) {
        log("err", "fact — schema drift: column 'order_channel' not found in Silver");
        log("warn", "Downstream tasks blocked — gold not published");
        log("warn", "Watermark NOT advanced — the next run resumes from 2026-08-27");
        setNode("gold", "is-blocked");
        setEdges("gold", "is-dead");
        setEdges("commit", "is-dead");
        setState("failed", "FAILED");
        rowsEl.textContent = "1,284";
        durEl.textContent = `${((performance.now() - started) / 1000).toFixed(1)}s`;
        modeEl.textContent = "Halted";
        playBtn.textContent = "Rerun failed tasks";
        playBtn.disabled = false;
        running = false;
        return;
      }
    }

    setEdges("commit", "is-flow");
    await wait(500);
    setEdges("commit", "is-done");
    setNode("wm", "is-done");
    log("ok", "Watermark advanced to 2026-08-28 23:00");
    log("head", "▸ Run succeeded — 1,284 rows processed, 0 duplicated");

    wmEl.textContent = "2026-08-28";
    rowsEl.textContent = "1,284";
    durEl.textContent = `${((performance.now() - started) / 1000).toFixed(1)}s`;
    modeEl.textContent = "Incremental";
    setState("succeeded", "SUCCEEDED");
    playBtn.textContent = "Run again";
    playBtn.disabled = false;
    running = false;
    attempt = 0;
    done = new Set();
  }

  playBtn.addEventListener("click", () => {
    if (stateEl.dataset.state === "succeeded") reset(true);
    run();
  });
  resetBtn.addEventListener("click", () => reset(true));
})();
