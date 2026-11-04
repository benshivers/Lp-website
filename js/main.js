(() => {
  const works = window.WORKS || [];
  const grid = document.getElementById("grid");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Nav ---------- */
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", open);
    nav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  document.querySelectorAll("#nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.style.overflow = "";
    })
  );

  /* ---------- Grid ---------- */
  const media = (w, large) => {
    if (w.video) {
      return `<video src="assets/video/${w.file}.mp4" poster="assets/video/${w.file}.jpg"
        muted loop playsinline preload="none" ${large ? "autoplay controls" : ""}></video>`;
    }
    const dir = large ? "full" : "thumb";
    return `<img src="assets/img/${dir}/${w.file}.jpg" alt="${w.title} — ${w.role}" ${large ? "" : 'loading="lazy" decoding="async"'}>`;
  };

  grid.innerHTML = works
    .map(
      (w, i) => `
      <button class="tile" data-i="${i}" data-cat="${w.cat}" style="--ar:${w.w}/${w.h}" aria-label="Open ${w.title}">
        ${media(w, false)}
        ${w.video ? '<span class="tile-badge">Live</span>' : ""}
        <span class="tile-cap"><strong>${w.title}</strong><span>${w.role}</span></span>
      </button>`
    )
    .join("");
  const tiles = [...grid.querySelectorAll(".tile")];

  // Play clips only while on screen.
  const vidObs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting && !reduceMotion) {
          v.preload = "auto";
          v.play().catch(() => {});
        } else v.pause();
      }),
    { threshold: 0.35 }
  );
  grid.querySelectorAll("video").forEach((v) => vidObs.observe(v));

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealObs.unobserve(e.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal, .tile, .plot").forEach((el) => revealObs.observe(el));

  /* ---------- Filters ---------- */
  document.querySelectorAll(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      const f = chip.dataset.filter;
      tiles.forEach((t) => t.classList.toggle("is-hidden", f !== "all" && t.dataset.cat !== f));
    })
  );

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbMedia = lb.querySelector(".lb-media");
  const lbCap = lb.querySelector(".lb-cap");
  let current = 0;
  let lastFocus = null;

  const visible = () => tiles.filter((t) => !t.classList.contains("is-hidden")).map((t) => +t.dataset.i);
  const show = (i) => {
    current = i;
    const w = works[i];
    lbMedia.innerHTML = media(w, true);
    lbCap.innerHTML = `<strong>${w.title}</strong><span>${w.role}</span>`;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.classList.add("lb-open");
    lb.querySelector(".lb-close").focus();
  };
  const close = () => {
    lb.hidden = true;
    lbMedia.innerHTML = "";
    document.body.classList.remove("lb-open");
    lastFocus && lastFocus.focus();
  };
  const step = (d) => {
    const list = visible();
    const pos = list.indexOf(current);
    show(list[(pos + d + list.length) % list.length]);
  };

  grid.addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (t) open(+t.dataset.i);
  });
  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", () => step(-1));
  lb.querySelector(".lb-next").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* ---------- Cursor glow (desktop only) ---------- */
  if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
    const glow = document.querySelector(".glow");
    const colors = { orange: "#f05133", blue: "#4a67b0" };
    let x = innerWidth / 2, y = innerHeight / 2, gx = x, gy = y;
    document.body.classList.add("has-pointer");
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const tick = () => {
      gx += (x - gx) * 0.12;
      gy += (y - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(tick);
    };
    tick();
    const secObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) glow.style.setProperty("--glow", colors[e.target.dataset.accent] || colors.orange);
        }),
      { threshold: 0.4 }
    );
    document.querySelectorAll("[data-accent]").forEach((s) => secObs.observe(s));
  }
})();
