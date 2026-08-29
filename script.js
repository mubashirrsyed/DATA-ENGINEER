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
const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01#$";

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

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  });
}, { threshold: 0.22, rootMargin: "-25% 0px -55%" });

sections.forEach((section) => sectionObserver.observe(section));

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
