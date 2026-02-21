import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./style.css";


gsap.registerPlugin(ScrollTrigger);



/**
 * Inline external SVG files so we can animate strokes.
 * Usage: <span class="svg-icon" data-svg="/icons/icon.svg"></span>
 */
async function inlineSvgs() {
  const nodes = Array.from(document.querySelectorAll("[data-svg]"));

  await Promise.all(nodes.map(async (node) => {
    const url = node.getAttribute("data-svg");
    if (!url) return;

    const res = await fetch(url);
    const svgText = await res.text();

    node.innerHTML = svgText;

    const svg = node.querySelector("svg");
    if (!svg) return;

    // accessibility: if you want, set aria-hidden on decorative icons
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    // Normalize stroke color via CSS variable (optional)
    // svg.style.setProperty("--icon-stroke", "#0d2b4d");
  }));
}

/**
 * Prepare + animate strokes
 */
function animateIconStrokes() {
  const icons = gsap.utils.toArray(".svg-icon svg");

  icons.forEach((svg) => {
    const strokes = svg.querySelectorAll("path, line, polyline, polygon, circle, rect, ellipse");
    if (!strokes.length) return;

    // Set initial stroke-dash for "draw" effect
    strokes.forEach((el) => {
      const len = typeof el.getTotalLength === "function" ? el.getTotalLength() : 120;
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      el.style.opacity = "1";
    });

    // Animate on scroll
    gsap.to(strokes, {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: "power2.out",
      stagger: 0.03,
      scrollTrigger: {
        trigger: svg,
        start: "top 85%",
        toggleActions: "play none none none",
      }
    });
  });
}

// Run
(async () => {
  await inlineSvgs();
  animateIconStrokes();
})();
/* ---------------------------
   Mobile Nav
--------------------------- */
const toggle = document.querySelector("[data-nav-toggle]");
const links = document.querySelector("[data-nav-links]");

if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // close on click
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}


/* ---------------------------
   Carousel (your existing)
--------------------------- */
function initCarousel(root) {
  const track = root.querySelector("[data-track]");
  const slides = Array.from(root.querySelectorAll("[data-slide]"));
  const dotsWrap = root.querySelector("[data-dots]");
  const btnPrev = root.querySelector("[data-prev]");
  const btnNext = root.querySelector("[data-next]");

  let index = 0;
  let autoplayId = null;
  const autoplayMs = 4500;

  function slidesPerView() {
    const w = window.innerWidth;
    if (w >= 1040) return 3;
    if (w >= 760) return 2;
    return 1;
  }

  function maxIndex() {
    return Math.max(0, slides.length - slidesPerView());
  }

  function clampIndex(i) {
    return Math.min(Math.max(i, 0), maxIndex());
  }

  function slideWidthPlusGap() {
    const first = slides[0];
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "0");
    return first.getBoundingClientRect().width + gap;
  }

  function renderDots() {
    dotsWrap.innerHTML = "";
    const count = maxIndex() + 1;
    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.className = "dot";
      b.type = "button";
      b.setAttribute("aria-label", `Zu Bewertung ${i + 1}`);
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
    }
  }

  function updateDots() {
    const dots = Array.from(dotsWrap.children);
    dots.forEach((d, i) => d.setAttribute("aria-current", i === index ? "true" : "false"));
  }

  function updateButtons() {
    if (!btnPrev || !btnNext) return;
    btnPrev.disabled = index <= 0;
    btnNext.disabled = index >= maxIndex();
    btnPrev.style.opacity = btnPrev.disabled ? "0.4" : "1";
    btnNext.style.opacity = btnNext.disabled ? "0.4" : "1";
  }

  function goTo(i) {
    index = clampIndex(i);
    const x = slideWidthPlusGap() * index;
    track.style.transform = `translateX(${-x}px)`;
    updateDots();
    updateButtons();
  }

  function next() {
    goTo(index + 1);
  }
  function prev() {
    goTo(index - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayId = setInterval(() => {
      if (index >= maxIndex()) goTo(0);
      else next();
    }, autoplayMs);
  }

  function stopAutoplay() {
    if (autoplayId) clearInterval(autoplayId);
    autoplayId = null;
  }

  btnNext?.addEventListener("click", () => {
    next();
    startAutoplay();
  });
  btnPrev?.addEventListener("click", () => {
    prev();
    startAutoplay();
  });

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", startAutoplay);

  // touch
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  root.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      startX = e.touches[0].clientX;
      currentX = startX;
      stopAutoplay();
    },
    { passive: true }
  );

  root.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      currentX = e.touches[0].clientX;
    },
    { passive: true }
  );

  root.addEventListener("touchend", () => {
    if (!dragging) return;
    dragging = false;
    const delta = currentX - startX;
    const threshold = 40;
    if (delta > threshold) prev();
    if (delta < -threshold) next();
    startAutoplay();
  });

  window.addEventListener("resize", () => {
    renderDots();
    goTo(clampIndex(index));
  });

  renderDots();
  goTo(0);
  startAutoplay();
}

document.querySelectorAll("[data-carousel]").forEach(initCarousel);

/* Footer year */
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

/* ---------------------------
   GSAP Reveal Animations
--------------------------- */

// helper: mark elements to reveal
const revealTargets = [
  ".hero__text > *",
  "#leistungen .section__head > *",
  "#leistungen .card",
  ".location__info > *",
  ".location__map",
  ".reviews__head > *",
  ".review",
  "#kontakt .contact__left > *",
  "#kontakt .contact-card",
  "#kontakt .contact__form"
];

revealTargets.forEach((sel) => {
  document.querySelectorAll(sel).forEach((el) => el.classList.add("reveal"));
});

// hero intro (no scroll)
gsap.to(".hero__text > .reveal", {
  opacity: 1,
  y: 0,
  duration: 0.8,
  stagger: 0.08,
  ease: "power2.out"
});

// sections on scroll
function revealOnScroll(selector, options = {}) {
  const els = gsap.utils.toArray(selector);
  els.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none"
      },
      ...options
    });
  });
}

revealOnScroll("#leistungen .reveal");
revealOnScroll(".location .reveal");
revealOnScroll(".reviews .reveal");
revealOnScroll("#kontakt .reveal");

// stagger cards a bit
gsap.to("#leistungen .card.reveal", {
  opacity: 1,
  y: 0,
  duration: 0.65,
  ease: "power2.out",
  stagger: 0.08,
  scrollTrigger: {
    trigger: "#leistungen .cards",
    start: "top 80%"
  }
});



