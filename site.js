"use strict";

const releaseEndpoint =
  "https://api.github.com/repos/haliloxox/haliloxostudio/releases/latest";
const installerAssetPattern =
  /^(?:Haliloxo-Kurulum-Baslaticisi|Haliloxo-Live-Studio-Setup-[\w.-]+)\.exe$/i;
const mobileCaptureDownloadUrl =
  "https://github.com/haliloxox/haliloxostudio/releases/download/mobile-capture-v1.4.0/Haliloxo-Mobile-Capture-1.4.0.apk";
let resolvedInstallerUrl = "";
let installerReady = null;

const formatMegabytes = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;

async function hydrateLatestRelease() {
  try {
    const response = await fetch(releaseEndpoint, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);

    const release = await response.json();
    const installer = (release.assets || []).find((asset) =>
      installerAssetPattern.test(asset.name || ""),
    );
    if (!installer?.browser_download_url) {
      throw new Error("Yayınlanan sürümde Windows kurulum dosyası bulunamadı.");
    }

    resolvedInstallerUrl = installer.browser_download_url;
    const version = String(release.tag_name || "Güncel sürüm");

    document.querySelectorAll("[data-version]").forEach((node) => {
      node.textContent = version;
    });
    document.querySelectorAll("[data-file-size]").forEach((node) => {
      node.textContent = formatMegabytes(installer.size);
    });
    return resolvedInstallerUrl;
  } catch (_) {
    // İndirme düğmesi başarısız bir eski dosya adına yönlenmesin.
    return "";
  }
}

function setupInstallerDownload() {
  document.querySelectorAll("[data-installer-download]").forEach((trigger) => {
    let busy = false;

    trigger.addEventListener("click", async (event) => {
      event.preventDefault();
      if (busy) return;

      busy = true;
      trigger.setAttribute("aria-busy", "true");

      await installerReady;
      if (!resolvedInstallerUrl) {
        // /indir kendi alan adımızdaki güvenli yedek indirme yönlendirmesidir.
        location.assign("/indir");
        return;
      }

      const downloadFrame = document.createElement("iframe");
      downloadFrame.hidden = true;
      downloadFrame.setAttribute("aria-hidden", "true");
      downloadFrame.referrerPolicy = "no-referrer";
      downloadFrame.title = "Haliloxo Live Studio kurulum indirmesi";
      downloadFrame.src = resolvedInstallerUrl;
      document.body.append(downloadFrame);

      setTimeout(() => downloadFrame.remove(), 60_000);
      setTimeout(() => {
        busy = false;
        trigger.removeAttribute("aria-busy");
      }, 1_200);
    });
  });
}

function setupMobileCaptureDownload() {
  document.querySelectorAll("[data-mobile-capture-download]").forEach((trigger) => {
    let busy = false;

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (busy) return;
      busy = true;
      trigger.setAttribute("aria-busy", "true");

      // Cross-origin download attributes are ignored by browsers. A hidden
      // frame keeps haliloxo.com visible while the APK response starts download.
      const downloadFrame = document.createElement("iframe");
      downloadFrame.hidden = true;
      downloadFrame.setAttribute("aria-hidden", "true");
      downloadFrame.referrerPolicy = "no-referrer";
      downloadFrame.title = "Haliloxo Mobile Capture APK indirmesi";
      downloadFrame.src = mobileCaptureDownloadUrl;
      document.body.append(downloadFrame);
      window.setTimeout(() => downloadFrame.remove(), 60_000);

      window.setTimeout(() => {
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
    if (
      event.target instanceof Element &&
      event.target.closest("input, textarea, select, [contenteditable], [data-allow-select]")
    ) {
      return;
    }
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

installerReady = hydrateLatestRelease();
setupInstallerDownload();
setupMobileCaptureDownload();
setupNavigation();
setupHeader();
setupReveal();
setupContentProtection();
