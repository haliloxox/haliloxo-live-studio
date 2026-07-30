"use strict";

const releaseEndpoint =
  "https://api.github.com/repos/haliloxox/haliloxostudio/releases/latest";
const fallbackDownload =
  "https://github.com/haliloxox/haliloxostudio/releases/download/v1.0.12/Haliloxo-Live-Studio-Setup-1.0.12.exe";

const formatMegabytes = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;

async function hydrateLatestRelease() {
  try {
    const response = await fetch(releaseEndpoint, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const release = await response.json();
    const installer = (release.assets || []).find(
      (asset) =>
        /\.exe$/i.test(asset.name || "") &&
        !/\.blockmap$/i.test(asset.name || ""),
    );
    if (!installer?.browser_download_url) return;

    const version = String(release.tag_name || "v1.0.12");
    document.querySelectorAll("[data-download-link]").forEach((link) => {
      link.href = installer.browser_download_url;
    });
    document.querySelectorAll("[data-version]").forEach((node) => {
      node.textContent = version;
    });
    document.querySelectorAll("[data-file-size]").forEach((node) => {
      node.textContent = formatMegabytes(installer.size);
    });
  } catch (_) {
    document.querySelectorAll("[data-download-link]").forEach((link) => {
      if (!link.href) link.href = fallbackDownload;
    });
  }
}

function setupNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) close();
  });
}

function setupHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;
  const sync = () => header.classList.toggle("is-scrolled", scrollY > 12);
  sync();
  addEventListener("scroll", sync, { passive: true });
}

function setupReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!nodes.length) return;
  if (
    !("IntersectionObserver" in window) ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    nodes.forEach((node) => node.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -30px" },
  );
  nodes.forEach((node) => observer.observe(node));
}

function setupCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "";
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const original = button.textContent;
        button.textContent = "Kopyalandı";
        setTimeout(() => {
          button.textContent = original;
        }, 1800);
      } catch (_) {}
    });
  });
}

function setupContentProtection() {
  document.querySelectorAll("img").forEach((image) => {
    image.draggable = false;
    image.setAttribute("draggable", "false");
  });

  const blockEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  document.addEventListener("contextmenu", blockEvent, { capture: true });
  document.addEventListener("dragstart", (event) => {
    if (event.target instanceof HTMLImageElement) blockEvent(event);
  }, { capture: true });
  document.addEventListener("selectstart", blockEvent, { capture: true });
  document.addEventListener("copy", blockEvent, { capture: true });
  document.addEventListener("cut", blockEvent, { capture: true });

  document.addEventListener("keydown", (event) => {
    const key = String(event.key || "").toLowerCase();
    const developerShortcut =
      event.key === "F12" ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey &&
        ["i", "j", "c", "k"].includes(key)) ||
      ((event.ctrlKey || event.metaKey) && ["u", "s"].includes(key));

    if (developerShortcut) blockEvent(event);
  }, { capture: true });
}

function setupLowerDemoSpectrum() {
  const records = [...document.querySelectorAll(".hlx-record--rhythm")];

  records.forEach((record) => {
    record.querySelectorAll(":scope > i").forEach((bar) => bar.remove());

    for (let index = 0; index < 48; index += 1) {
      const bar = document.createElement("i");
      const position = index / 47;
      const hue =
        position < 0.28
          ? 8 + (position / 0.28) * 54
          : position < 0.68
            ? 118 + ((position - 0.28) / 0.4) * 100
            : 238 + ((position - 0.68) / 0.32) * 94;
      const scale = 0.55 + ((index * 17) % 11) / 10;

      bar.className = "hlx-spectrum-bar";
      bar.style.setProperty("--rhythm-index", String(index));
      bar.style.setProperty("--rhythm-hue", hue.toFixed(1));
      bar.style.setProperty("--rhythm-scale", scale.toFixed(2));
      bar.style.setProperty("--rhythm-delay", `${-((index * 73) % 1100)}ms`);
      record.appendChild(bar);
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            "hlx-spectrum-active",
            entry.isIntersecting,
          );
        });
      },
      { rootMargin: "160px 0px" },
    );
    records.forEach((record) => observer.observe(record));
  } else {
    records.forEach((record) => record.classList.add("hlx-spectrum-active"));
  }
}

function setupShowcaseMusicDemo() {
  const showcase = document.querySelector(".studio-showcase");
  const ring = showcase?.querySelector(".showcase-rhythm-ring");
  const title = showcase?.querySelector(".showcase-publisher-copy strong");
  const pause = showcase?.querySelector(".showcase-music-pause");
  const stop = showcase?.querySelector(".showcase-music-stop");
  const previous = showcase?.querySelector(".showcase-music-previous");
  const next = showcase?.querySelector(".showcase-music-next");
  const chatToggle = showcase?.querySelector("[data-showcase-chat-toggle]");
  const ttsToggle = showcase?.querySelector("[data-showcase-tts-toggle]");
  const activeViewers = showcase?.querySelector(".showcase-active-viewers");
  if (!showcase || !ring || !title) return;

  const tracks = [
    { title: "Gece Akışı", artist: "Nova", hue: 188 },
    { title: "Düşler Rotası", artist: "Atlas", hue: 278 },
    { title: "Neon Yağmuru", artist: "Mira", hue: 334 },
  ];
  let trackIndex = 0;
  const rhythmBars = [];
  let showcaseVisible = true;
  let lastSpectrumFrame = 0;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  for (let index = 0; index < 48; index += 1) {
    const bar = document.createElement("i");
    const frequencyPosition = index / 47;
    const hue =
      frequencyPosition < 0.28
        ? 8 + (frequencyPosition / 0.28) * 54
        : frequencyPosition < 0.68
          ? 118 + ((frequencyPosition - 0.28) / 0.4) * 100
          : 238 + ((frequencyPosition - 0.68) / 0.32) * 94;
    bar.style.setProperty("--rhythm-index", String(index));
    bar.style.setProperty("--rhythm-hue", hue.toFixed(1));
    bar.style.setProperty(
      "--rhythm-beat",
      String((0.52 + ((index * 17) % 11) / 10).toFixed(2)),
    );
    bar.style.setProperty(
      "--rhythm-delay",
      `${-((index * 73) % 1100)}ms`,
    );
    ring.appendChild(bar);
    rhythmBars.push(bar);
  }

  const updateSpectrum = (time) => {
    if (
      showcaseVisible &&
      !reduceMotion &&
      showcase.classList.contains("showcase-music-playing") &&
      !showcase.classList.contains("showcase-music-stopped") &&
      time - lastSpectrumFrame >= 45
    ) {
      const seconds = time / 1000;
      const bass = .38 + Math.abs(Math.sin(seconds * 2.15)) * .82;
      const mid = .3 + Math.abs(Math.sin(seconds * 3.7 + .8)) * .68;
      const treble = .22 + Math.abs(Math.sin(seconds * 5.3 + 1.9)) * .54;

      rhythmBars.forEach((bar, index) => {
        const position = index / 47;
        const group = position < .28 ? bass : position < .68 ? mid : treble;
        const wave =
          Math.sin(seconds * (4.4 + position * 3.2) + index * .64) * .16 +
          Math.sin(seconds * 2.1 + index * .23) * .1;
        const scale = Math.max(.28, Math.min(1.48, group + wave));
        bar.style.setProperty("--rhythm-scale", scale.toFixed(2));
        bar.style.opacity = String(Math.max(.58, Math.min(1, .7 + scale * .22)));
      });
      lastSpectrumFrame = time;
    }
    requestAnimationFrame(updateSpectrum);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        showcaseVisible = Boolean(entry?.isIntersecting);
      },
      { rootMargin: "180px 0px" },
    );
    observer.observe(showcase);
  }
  requestAnimationFrame(updateSpectrum);

  const renderTrack = () => {
    const track = tracks[trackIndex];
    const label = `${track.title}\u00a0 • \u00a0${track.artist}`;
    title.replaceChildren();
    [0, 1].forEach(() => {
      const copy = document.createElement("i");
      copy.textContent = label;
      title.appendChild(copy);
    });
    showcase.style.setProperty("--showcase-track-hue", String(track.hue));
    showcase.classList.add("showcase-music-playing");
    showcase.classList.remove("showcase-music-stopped");
    if (pause) pause.textContent = "Ⅱ";
  };

  const changeTrack = (direction) => {
    trackIndex = (trackIndex + direction + tracks.length) % tracks.length;
    renderTrack();
  };

  previous?.addEventListener("click", () => changeTrack(-1));
  next?.addEventListener("click", () => changeTrack(1));
  pause?.addEventListener("click", () => {
    const playing = showcase.classList.toggle("showcase-music-playing");
    showcase.classList.remove("showcase-music-stopped");
    pause.textContent = playing ? "Ⅱ" : "▶";
  });
  stop?.addEventListener("click", () => {
    showcase.classList.remove("showcase-music-playing");
    showcase.classList.add("showcase-music-stopped");
    title.replaceChildren();
    const copy = document.createElement("i");
    copy.textContent = "NOVA REX";
    title.appendChild(copy);
    if (pause) pause.textContent = "▶";
  });

  chatToggle?.setAttribute("aria-pressed", "true");
  chatToggle?.addEventListener("click", () => {
    const active = chatToggle.classList.toggle("active");
    showcase.classList.toggle("showcase-chat-hidden", !active);
    chatToggle.setAttribute("aria-pressed", String(active));
  });

  ttsToggle?.setAttribute("aria-pressed", "true");
  ttsToggle?.addEventListener("click", () => {
    const active = ttsToggle.classList.toggle("active");
    ttsToggle.setAttribute("aria-pressed", String(active));
  });

  activeViewers?.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    activeViewers.scrollLeft += event.deltaY;
  }, { passive: false });

  renderTrack();
}

function loadGiftSpecialAnimationRuntime() {
  if (window.StudioGiftSpecialAnimation?.create) {
    return Promise.resolve(window.StudioGiftSpecialAnimation);
  }

  if (window.__giftSpecialAnimationRuntimePromise) {
    return window.__giftSpecialAnimationRuntimePromise;
  }

  window.__giftSpecialAnimationRuntimePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/assets/gift-special-animation.js";
    script.async = true;
    script.dataset.giftSpecialRuntime = "true";
    script.addEventListener("load", () => {
      if (window.StudioGiftSpecialAnimation?.create) {
        resolve(window.StudioGiftSpecialAnimation);
        return;
      }
      reject(new Error("Özel hediye animasyonu yüklenemedi."));
    }, { once: true });
    script.addEventListener("error", () => {
      reject(new Error("Özel hediye animasyonu dosyası alınamadı."));
    }, { once: true });
    document.head.appendChild(script);
  });

  return window.__giftSpecialAnimationRuntimePromise;
}

function setupGiftSpecialAnimationDemo() {
  const section = document.querySelector("[data-gift-special-demo]");
  const app = section?.querySelector(".hlx-app--gift-special");
  const host = section?.querySelector("[data-gift-special-host]");
  const cursor = section?.querySelector("[data-gift-demo-cursor]");
  const preset = section?.querySelector("[data-gift-demo-preset]");
  const threshold = section?.querySelector("[data-gift-demo-threshold]");
  const thresholdRow = threshold?.closest(".gift-special-row");
  const addButton = section?.querySelector("[data-gift-demo-add]");
  const status = section?.querySelector("[data-gift-demo-status]");
  const testButton = addButton?.nextElementSibling;
  if (!section || !app || !host || !cursor || !preset || !threshold || !addButton || !status) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const timers = new Set();
  let controller = null;
  let visible = false;
  let runId = 0;

  const clearTimers = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  };

  const later = (callback, delay, expectedRun = runId) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!visible || expectedRun !== runId) return;
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  };

  const setStatus = (text) => {
    status.textContent = text;
  };

  const moveCursor = (target, duration = 780) => {
    if (!target) return;
    const appRect = app.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const x = targetRect.left - appRect.left + targetRect.width * .56;
    const y = targetRect.top - appRect.top + targetRect.height * .5;
    cursor.style.transitionDuration = `${duration}ms, 220ms`;
    cursor.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    cursor.classList.add("is-visible");
  };

  const clickCursor = () => {
    cursor.classList.remove("is-clicking");
    void cursor.offsetWidth;
    cursor.classList.add("is-clicking");
  };

  const resetVisuals = ({ keepThreshold = false } = {}) => {
    controller?.stop?.();
    app.classList.remove("has-widget", "has-gift", "is-playing", "is-complete");
    addButton.classList.remove("is-pressed");
    thresholdRow?.classList.remove("is-focused");
    cursor.classList.remove("is-clicking");
    cursor.classList.toggle("is-visible", !reduceMotion);
    if (!keepThreshold) threshold.value = "";
    setStatus("Hediye ayarı hazırlanıyor");
  };

  const playAnimation = async (expectedRun = runId) => {
    if (!visible || expectedRun !== runId) return;
    try {
      const runtime = await loadGiftSpecialAnimationRuntime();
      if (!visible || expectedRun !== runId) return;
      if (!controller) controller = runtime.create(host);
      if (!controller) throw new Error("WebGL yüzeyi oluşturulamadı.");

      controller.onComplete = () => {
        if (!visible || expectedRun !== runId) return;
        app.classList.remove("is-playing");
        app.classList.add("is-complete");
        setStatus("Animasyon tamamlandı · sıradaki hediye bekleniyor");
        later(() => runCycle(), 1900, expectedRun);
      };

      app.classList.add("is-playing");
      cursor.classList.remove("is-visible");
      setStatus("1.000 jeton eşiği aşıldı · animasyon oynuyor");
      controller.play({
        avatar: "/assets/fictional-publisher.webp",
        displayName: "Lina",
        total: 1000,
        duration: 12000,
        thankYouText: "Teşekkürler!",
        cardFlightDuration: 6500,
        style: "pixel-galaxy-heart",
        speed: 1,
      });
    } catch (_) {
      host.classList.add("is-fallback");
      setStatus("Özel animasyon önizlemesi");
      later(() => runCycle(), 4500, expectedRun);
    }
  };

  const runCycle = () => {
    runId += 1;
    const currentRun = runId;
    clearTimers();
    resetVisuals();
    host.classList.remove("is-fallback");

    if (reduceMotion) {
      threshold.value = "1000";
      app.classList.add("has-widget", "has-gift");
      setStatus("1.000 jeton · özel animasyon hazır");
      return;
    }

    moveCursor(preset, 0);
    later(() => {
      moveCursor(preset);
      setStatus("Piksel Kalp Galaksisi seçiliyor");
    }, 450, currentRun);
    later(() => {
      clickCursor();
      preset.classList.add("active");
    }, 1320, currentRun);
    later(() => {
      moveCursor(threshold);
      setStatus("Jeton eşiği giriliyor");
    }, 1900, currentRun);
    later(() => {
      clickCursor();
      thresholdRow?.classList.add("is-focused");
      threshold.value = "1";
    }, 2800, currentRun);
    later(() => { threshold.value = "10"; }, 3030, currentRun);
    later(() => { threshold.value = "100"; }, 3260, currentRun);
    later(() => { threshold.value = "1000"; }, 3490, currentRun);
    later(() => {
      thresholdRow?.classList.remove("is-focused");
      moveCursor(addButton);
      setStatus("Özel animasyon widget'ı ekleniyor");
    }, 4000, currentRun);
    later(() => {
      clickCursor();
      addButton.classList.add("is-pressed");
    }, 4850, currentRun);
    later(() => {
      addButton.classList.remove("is-pressed");
      app.classList.add("has-widget");
      setStatus("Widget hazır · sohbetten hediye bekleniyor");
    }, 5080, currentRun);
    later(() => {
      cursor.classList.remove("is-visible");
      app.classList.add("has-gift");
      setStatus("Lina, Disko Topu ×1 gönderdi");
    }, 6750, currentRun);
    later(() => playAnimation(currentRun), 7350, currentRun);
  };

  addButton.addEventListener("click", () => {
    if (!visible) return;
    clearTimers();
    runId += 1;
    const currentRun = runId;
    threshold.value = "1000";
    addButton.classList.add("is-pressed");
    app.classList.add("has-widget");
    setStatus("Widget hazır · sohbetten hediye bekleniyor");
    later(() => {
      addButton.classList.remove("is-pressed");
      app.classList.add("has-gift");
      setStatus("Lina, Disko Topu ×1 gönderdi");
    }, 1100, currentRun);
    later(() => playAnimation(currentRun), 1650, currentRun);
  });

  testButton?.addEventListener("click", () => {
    if (!visible) return;
    clearTimers();
    runId += 1;
    threshold.value = "1000";
    app.classList.add("has-widget", "has-gift");
    playAnimation(runId);
  });

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      const nextVisible = Boolean(entry?.isIntersecting);
      if (nextVisible === visible) return;
      visible = nextVisible;
      if (visible) {
        loadGiftSpecialAnimationRuntime().catch(() => {});
        runCycle();
      } else {
        runId += 1;
        clearTimers();
        controller?.stop?.();
        cursor.classList.remove("is-visible");
      }
    },
    { threshold: .14 },
  );
  visibilityObserver.observe(section);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      runId += 1;
      clearTimers();
      controller?.stop?.();
      return;
    }
    if (visible) runCycle();
  });
}

function setupRiotFlowDemo() {
  const section = document.querySelector("[data-riot-demo]");
  const stepList = section?.querySelector(".riot-flow-steps");
  const steps = [...(section?.querySelectorAll("[data-riot-step]") || [])];
  const panels = [...(section?.querySelectorAll("[data-riot-panel]") || [])];
  if (!section || !stepList || !steps.length || steps.length !== panels.length) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let activeIndex = 0;
  let timer = null;
  let visible = false;
  let paused = false;

  const clearTimer = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const activate = (nextIndex) => {
    activeIndex = (Number(nextIndex) + steps.length) % steps.length;
    stepList.style.setProperty("--riot-step", String(activeIndex));
    steps.forEach((step, index) => {
      const active = index === activeIndex;
      step.classList.toggle("is-active", active);
      step.querySelector("button")?.setAttribute("aria-current", active ? "step" : "false");
    });
    panels.forEach((panel, index) => {
      panel.classList.toggle("is-active", index === activeIndex);
      panel.setAttribute("aria-hidden", String(index !== activeIndex));
    });
  };

  const schedule = () => {
    clearTimer();
    if (!visible || paused || reduceMotion || document.hidden) return;
    timer = setTimeout(() => {
      activate(activeIndex + 1);
      schedule();
    }, 3400);
  };

  steps.forEach((step, index) => {
    step.querySelector("button")?.addEventListener("click", () => {
      activate(index);
      schedule();
    });
  });

  section.addEventListener("pointerenter", () => {
    paused = true;
    clearTimer();
  });
  section.addEventListener("pointerleave", () => {
    paused = false;
    schedule();
  });
  section.addEventListener("focusin", () => {
    paused = true;
    clearTimer();
  });
  section.addEventListener("focusout", (event) => {
    if (section.contains(event.relatedTarget)) return;
    paused = false;
    schedule();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        schedule();
      },
      { threshold: .12, rootMargin: "120px 0px" },
    );
    observer.observe(section);
  } else {
    visible = true;
  }

  document.addEventListener("visibilitychange", schedule);
  activate(0);
  schedule();
}

hydrateLatestRelease();
setupNavigation();
setupHeader();
setupReveal();
setupCopyButtons();
setupContentProtection();
setupLowerDemoSpectrum();
setupShowcaseMusicDemo();
setupGiftSpecialAnimationDemo();
setupRiotFlowDemo();
