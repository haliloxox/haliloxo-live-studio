"use strict";

const releaseEndpoint =
  "https://api.github.com/repos/haliloxox/haliloxostudio/releases/latest";
const fallbackDownload =
  "https://github.com/haliloxox/haliloxostudio/releases/download/v1.0.12/Haliloxo-Live-Studio-Setup-1.0.12.exe";
let resolvedInstallerUrl = fallbackDownload;

const formatMegabytes = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;

async function hydrateLatestRelease() {
  try {
    const response = await fetch(releaseEndpoint, {
      cache: "no-store",
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

    resolvedInstallerUrl = installer.browser_download_url;
    const version = String(release.tag_name || "v1.0.12");

    document.querySelectorAll("[data-version]").forEach((node) => {
      node.textContent = version;
    });
    document.querySelectorAll("[data-file-size]").forEach((node) => {
      node.textContent = formatMegabytes(installer.size);
    });
  } catch (_) {
    // GitHub API geçici olarak kullanılamazsa bilinen son kurulum dosyası kullanılır.
  }
}

function setupInstallerDownload() {
  document.querySelectorAll("[data-installer-download]").forEach((trigger) => {
    let busy = false;

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (busy) return;

      busy = true;
      trigger.setAttribute("aria-busy", "true");

      const downloadFrame = document.createElement("iframe");
      downloadFrame.hidden = true;
      downloadFrame.setAttribute("aria-hidden", "true");
      downloadFrame.referrerPolicy = "no-referrer";
      downloadFrame.title = "Haliloxo Live Studio kurulum indirmesi";
      downloadFrame.src = resolvedInstallerUrl || fallbackDownload;
      document.body.append(downloadFrame);

      setTimeout(() => downloadFrame.remove(), 60_000);
      setTimeout(() => {
        busy = false;
        trigger.removeAttribute("aria-busy");
      }, 1_200);
    });
  });
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
    if (event.target.closest("a, button")) close();
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
  document.addEventListener(
    "dragstart",
    (event) => {
      if (event.target instanceof HTMLImageElement) blockEvent(event);
    },
    { capture: true },
  );
  document.addEventListener("selectstart", blockEvent, { capture: true });
  document.addEventListener("copy", blockEvent, { capture: true });
  document.addEventListener("cut", blockEvent, { capture: true });

  document.addEventListener(
    "keydown",
    (event) => {
      const key = String(event.key || "").toLowerCase();
      const developerShortcut =
        event.key === "F12" ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          ["i", "j", "c", "k"].includes(key)) ||
        ((event.ctrlKey || event.metaKey) && ["u", "s"].includes(key));

      if (developerShortcut) blockEvent(event);
    },
    { capture: true },
  );
}

function setupProductFilm() {
  const videos = [
    ...document.querySelectorAll("video[data-product-film]"),
  ];
  if (!videos.length) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const visibility = new Map(videos.map((video) => [video, false]));

  const canPlay = (video) =>
    Boolean(visibility.get(video)) &&
    document.visibilityState === "visible" &&
    !reducedMotion.matches;

  const syncVideo = (video) => {
    video.muted = true;
    video.playsInline = true;

    if (!canPlay(video)) {
      video.pause();
      video.dataset.playbackState = reducedMotion.matches ? "reduced" : "paused";
      return;
    }

    video.dataset.playbackState = "playing";
    const playback = video.play();
    if (playback?.catch) {
      playback.catch(() => {
        video.dataset.playbackState = "blocked";
      });
    }
  };

  const syncAll = () => videos.forEach(syncVideo);

  videos.forEach((video) => {
    const filmShell = video.closest("[data-film-shell]");
    const markReady = () => {
      filmShell?.classList.add("is-ready");
      filmShell?.classList.remove("is-error");
    };

    video.preload = "metadata";
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", () => {
      markReady();
      syncVideo(video);
    });
    video.addEventListener("error", () => {
      video.dataset.playbackState = "error";
      filmShell?.classList.remove("is-ready");
      filmShell?.classList.add("is-error");
    });

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target, entry.isIntersecting);
          syncVideo(entry.target);
        });
      },
      { threshold: 0.15 },
    );
    videos.forEach((video) => observer.observe(video));
  } else {
    videos.forEach((video) => visibility.set(video, true));
  }

  const onMotionChange = () => {
    videos.forEach((video) => {
      if (reducedMotion.matches) video.removeAttribute("autoplay");
      else video.setAttribute("autoplay", "");
    });
    syncAll();
  };

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onMotionChange);
  } else {
    reducedMotion.addListener(onMotionChange);
  }

  document.addEventListener("visibilitychange", syncAll);
  addEventListener("pageshow", syncAll);
  addEventListener("pagehide", () => videos.forEach((video) => video.pause()));

  onMotionChange();
}

hydrateLatestRelease();
setupInstallerDownload();
setupNavigation();
setupHeader();
setupReveal();
setupContentProtection();
setupProductFilm();
