"use strict";

(() => {
  const root = document.querySelector("[data-studio-demo]");
  if (!root) return;

  const usernameInput = root.querySelector("[data-demo-username]");
  const connectButton = root.querySelector("[data-demo-connect]");
  const connectLabel = root.querySelector("[data-demo-connect-label]");
  const connectionTitle = root.querySelector("[data-demo-connection-title]");
  const connectionCopy = root.querySelector("[data-demo-connection-copy]");
  const panelTitle = root.querySelector("[data-demo-panel-title]");
  const publisherName = root.querySelector("[data-demo-publisher-name]");
  const trackName = root.querySelector("[data-demo-track-name]");
  const messagesNode = root.querySelector("[data-demo-messages]");
  const viewerCount = root.querySelector("[data-demo-viewer-count]");
  const statusNode = root.querySelector("[data-demo-status]");
  const giftUser = root.querySelector("[data-demo-gift-user]");
  const musicLevel = root.querySelector("[data-demo-music-level]");
  const ttsLevel = root.querySelector("[data-demo-tts-level]");
  const musicButton = root.querySelector("[data-demo-music-toggle]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const panelNames = {
    connection: "TikTok Canlı Bağlantısı",
    gifts: "Hediyeler",
    music: "Müzik",
    tts: "TTS Sesli Okuma",
  };

  const fakeMessages = [
    {
      name: "Deniz",
      text: "Yayın çok güzel olmuş ✨",
      role: "TAKİP",
      profileX: "0%",
      profileY: "0%",
    },
    {
      name: "Mert",
      text: "Müzik ve görüntü efsane!",
      role: "MOD",
      profileX: "66.666%",
      profileY: "0%",
    },
    {
      name: "Efe",
      text: "Herkese iyi yayınlar 👋",
      role: "",
      profileX: "100%",
      profileY: "0%",
    },
  ];

  const state = {
    connection: "offline",
    panel: "connection",
    chat: "closed",
    music: "stopped",
    voice: "idle",
    gift: "idle",
    orientation: "vertical",
    giftEnabled: true,
    duckingEnabled: true,
    ttsEnabled: true,
    mode: reducedMotion.matches ? "reduced" : "automatic",
    username: "",
    visible: true,
  };

  let autoTimer = 0;
  let statusTimer = 0;
  let connectionTimer = 0;
  let voiceTimer = 0;
  let autoStep = 0;
  let typingIndex = 0;
  let messageIndex = 0;

  const nowLabel = () =>
    new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

  function clearTimer(timer) {
    if (timer) clearTimeout(timer);
  }

  function clearTransientTimers() {
    clearTimer(autoTimer);
    clearTimer(connectionTimer);
    clearTimer(voiceTimer);
    autoTimer = 0;
    connectionTimer = 0;
    voiceTimer = 0;
  }

  function showStatus(message, duration = 2800) {
    if (!statusNode) return;
    clearTimer(statusTimer);
    statusNode.textContent = message;
    statusNode.classList.add("is-visible");
    statusTimer = window.setTimeout(() => {
      statusNode.classList.remove("is-visible");
      statusTimer = 0;
    }, duration);
  }

  function render() {
    root.dataset.connection = state.connection;
    root.dataset.panel = state.panel;
    root.dataset.chat = state.chat;
    root.dataset.music = state.music;
    root.dataset.voice = state.voice;
    root.dataset.gift = state.gift;
    root.dataset.orientation = state.orientation;
    root.dataset.demoMode = state.mode;

    if (panelTitle) {
      panelTitle.textContent =
        panelNames[state.panel] || "Haliloxo Live Studio";
    }

    root.querySelectorAll("[data-demo-panel]").forEach((button) => {
      const active = button.dataset.demoPanel === state.panel;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    root.querySelectorAll("[data-demo-chat-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(state.chat === "open"));
    });

    root.querySelectorAll("[data-demo-orientation]").forEach((button) => {
      const active = button.dataset.demoOrientation === state.orientation;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const giftEnabledButton = root.querySelector("[data-demo-gift-enabled]");
    const duckingEnabledButton = root.querySelector("[data-demo-ducking-enabled]");
    const ttsEnabledButton = root.querySelector("[data-demo-tts-enabled]");
    const ttsQuickButton = root.querySelector("[data-demo-tts-quick]");

    [
      [giftEnabledButton, state.giftEnabled],
      [duckingEnabledButton, state.duckingEnabled],
      [ttsEnabledButton, state.ttsEnabled],
    ].forEach(([button, enabled]) => {
      button?.classList.toggle("is-on", enabled);
      button?.setAttribute("aria-pressed", String(enabled));
    });

    if (ttsQuickButton) {
      ttsQuickButton.classList.toggle("is-on", state.ttsEnabled);
      ttsQuickButton.setAttribute("aria-pressed", String(state.ttsEnabled));
      ttsQuickButton.setAttribute(
        "aria-label",
        state.ttsEnabled ? "TTS açık" : "TTS kapalı",
      );
    }

    if (connectLabel) {
      connectLabel.textContent =
        state.connection === "connecting"
          ? "Bağlanıyor"
          : state.connection === "live"
            ? "Bağlantıyı kes"
            : "Bağlan";
    }

    if (connectButton) {
      connectButton.disabled = state.connection === "connecting";
      connectButton.setAttribute(
        "aria-busy",
        String(state.connection === "connecting"),
      );
    }

    if (connectionTitle && connectionCopy) {
      if (state.connection === "connecting") {
        connectionTitle.textContent = "Canlı yayın aranıyor";
        connectionCopy.textContent = `@${state.username || "haliloxo"} için güvenli bağlantı kuruluyor.`;
      } else if (state.connection === "live") {
        connectionTitle.textContent = "Canlı veriler bağlı";
        connectionCopy.textContent = "Sohbet, hediyeler ve izleyiciler gerçek zamanlı geliyor.";
      } else {
        connectionTitle.textContent = "Bağlantı bekleniyor";
        connectionCopy.textContent = "Kullanıcı adını girerek canlı verileri bağla.";
      }
    }

    if (publisherName) {
      publisherName.textContent =
        state.connection === "live"
          ? state.username || "haliloxo"
          : "Haliloxo Live Studio";
    }

    if (trackName) {
      trackName.textContent =
        state.music === "playing"
          ? "Gece Işıkları — Lina Nova"
          : state.connection === "live"
            ? "Çevrim içi"
            : "Çevrim dışı";
    }

    if (viewerCount) {
      viewerCount.textContent =
        state.connection === "live" ? "6 kişi" : "0 kişi";
    }

    if (musicButton) {
      musicButton.textContent = state.music === "playing" ? "❚❚" : "▶";
      musicButton.setAttribute(
        "aria-label",
        state.music === "playing" ? "Müziği duraklat" : "Müziği oynat",
      );
    }

    if (musicLevel) {
      musicLevel.textContent = state.voice === "speaking" ? "%18" : "%70";
    }
    if (ttsLevel) {
      ttsLevel.textContent = state.voice === "speaking" ? "%12" : "%60";
    }
  }

  function resetMessages() {
    if (!messagesNode) return;
    messagesNode.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "studio-demo__chat-empty";

    const icon = document.createElement("span");
    icon.textContent = "▤";
    const title = document.createElement("strong");
    title.textContent = "Sohbet hazır";
    const copy = document.createElement("small");
    copy.textContent = "Bağlandıktan sonra yeni mesajlar burada görünür.";

    empty.append(icon, title, copy);
    messagesNode.append(empty);
  }

  function createAvatar(profileX, profileY) {
    const avatar = document.createElement("span");
    avatar.className = "studio-demo__message-avatar";
    avatar.style.setProperty("--profile-x", profileX || "0%");
    avatar.style.setProperty("--profile-y", profileY || "0%");
    avatar.setAttribute("aria-hidden", "true");
    return avatar;
  }

  function trimMessages() {
    if (!messagesNode) return;
    const messages = [...messagesNode.querySelectorAll(".studio-demo__message")];
    while (messages.length > 5) {
      messages.shift()?.remove();
    }
  }

  function addChatMessage(data) {
    if (!messagesNode) return;
    messagesNode.querySelector(".studio-demo__chat-empty")?.remove();

    const item = document.createElement("article");
    item.className = "studio-demo__message";
    const avatar = createAvatar(data.profileX, data.profileY);
    const body = document.createElement("div");
    body.className = "studio-demo__message-body";

    const name = document.createElement("strong");
    name.textContent = data.name;
    const text = document.createElement("p");
    text.textContent = data.text;
    const time = document.createElement("time");
    time.textContent = nowLabel();

    body.append(name, text, time);
    if (data.role) {
      const role = document.createElement("em");
      role.className = "studio-demo__role";
      role.textContent = data.role;
      body.append(role);
    }

    item.append(avatar, body);
    messagesNode.append(item);
    trimMessages();
  }

  function addGiftMessage(name = "Selin", amount = 1000) {
    if (!messagesNode) return;
    messagesNode.querySelector(".studio-demo__chat-empty")?.remove();

    const item = document.createElement("article");
    item.className = "studio-demo__message studio-demo__message--gift";
    const avatar = createAvatar("33.333%", "0%");
    const body = document.createElement("div");
    body.className = "studio-demo__message-body";
    const visual = document.createElement("div");
    visual.className = "studio-demo__gift-visual";
    visual.textContent = "♥";
    const value = document.createElement("small");
    value.textContent = `${amount.toLocaleString("tr-TR")} jeton`;
    visual.append(value);

    const details = document.createElement("div");
    const sender = document.createElement("strong");
    sender.textContent = name;
    const gift = document.createElement("b");
    gift.textContent = "Kalbim Seninle ×1";
    const total = document.createElement("span");
    total.textContent = `${amount.toLocaleString("tr-TR")} jeton değerinde hediye`;
    details.append(sender, gift, total);

    body.append(visual, details);
    item.append(avatar, body);
    messagesNode.append(item);
    trimMessages();
  }

  function triggerGift(name = "Selin", amount = 1000, addToChat = true) {
    if (addToChat) addGiftMessage(name, amount);
    if (giftUser) {
      giftUser.textContent = `${name}'den ${amount.toLocaleString("tr-TR")} jeton`;
    }
    state.gift = "idle";
    render();
    requestAnimationFrame(() => {
      state.gift = "playing";
      render();
    });
  }

  function setManual(message) {
    if (state.mode !== "manual") {
      const finishConnecting = state.connection === "connecting";
      const stopTransientVoice = state.voice === "speaking";
      state.mode = "manual";
      clearTransientTimers();
      if (finishConnecting) completeConnection();
      if (stopTransientVoice) state.voice = "idle";
    }
    render();
    if (message) showStatus(message);
  }

  function completeConnection({ manual = false } = {}) {
    state.connection = "live";
    state.chat = "open";
    state.username =
      String(usernameInput?.value || state.username || "haliloxo")
        .trim()
        .replace(/^@+/, "") || "haliloxo";
    if (usernameInput) usernameInput.value = state.username;
    render();
    if (manual) {
      showStatus(`@${state.username} bağlandı. Sohbet ve hediyeler hazır.`);
      connectionTimer = window.setTimeout(() => {
        addChatMessage(fakeMessages[0]);
        connectionTimer = 0;
      }, 700);
    }
  }

  function beginConnection({ manual = false } = {}) {
    const entered = String(usernameInput?.value || state.username || "haliloxo")
      .trim()
      .replace(/^@+/, "");
    state.username = entered || "haliloxo";
    if (usernameInput) usernameInput.value = state.username;
    state.connection = "connecting";
    render();

    if (manual) {
      clearTimer(connectionTimer);
      connectionTimer = window.setTimeout(() => {
        completeConnection({ manual: true });
        connectionTimer = 0;
      }, 950);
    }
  }

  function setMusic(next) {
    state.music = next;
    render();
    showStatus(
      next === "playing"
        ? "Müzik başladı. Profil artık plak ve ses ritmi olarak çalışıyor."
        : "Müzik duraklatıldı.",
    );
  }

  function testVoice() {
    clearTimer(voiceTimer);
    state.voice = "speaking";
    render();
    showStatus("Yayıncı konuşuyor: müzik ve TTS seviyeleri otomatik kısıldı.");
    voiceTimer = window.setTimeout(() => {
      state.voice = "idle";
      render();
      showStatus("Konuşma bitti: sesler yumuşakça normal seviyesine döndü.");
      voiceTimer = 0;
    }, 2600);
  }

  function resetDemo({ staticView = false } = {}) {
    clearTransientTimers();
    autoStep = 0;
    typingIndex = 0;
    messageIndex = 0;
    state.connection = staticView ? "live" : "offline";
    state.panel = staticView ? "gifts" : "connection";
    state.chat = staticView ? "open" : "closed";
    state.music = staticView ? "paused" : "stopped";
    state.voice = "idle";
    state.gift = "idle";
    state.orientation = "vertical";
    state.giftEnabled = true;
    state.duckingEnabled = true;
    state.ttsEnabled = true;
    state.username = staticView ? "haliloxo" : "";
    if (usernameInput) usernameInput.value = state.username;
    resetMessages();
    if (staticView) {
      addChatMessage(fakeMessages[0]);
      addGiftMessage("Selin", 1000);
      addChatMessage(fakeMessages[1]);
    }
    render();
  }

  function shouldRunAutomatically() {
    return (
      state.mode === "automatic" &&
      state.visible &&
      document.visibilityState === "visible" &&
      !reducedMotion.matches
    );
  }

  function scheduleAuto(delay) {
    clearTimer(autoTimer);
    autoTimer = 0;
    if (!shouldRunAutomatically()) return;
    autoTimer = window.setTimeout(() => {
      autoTimer = 0;
      runAutoStep();
    }, delay);
  }

  function runAutoStep() {
    if (!shouldRunAutomatically()) return;

    switch (autoStep) {
      case 0:
        resetDemo();
        state.mode = "automatic";
        render();
        showStatus("Canlı tanıtım başlıyor: kullanıcı adı giriliyor.");
        autoStep = 1;
        scheduleAuto(850);
        break;
      case 1: {
        const target = "haliloxo";
        typingIndex += 1;
        state.username = target.slice(0, typingIndex);
        if (usernameInput) usernameInput.value = state.username;
        if (typingIndex < target.length) {
          scheduleAuto(95);
        } else {
          autoStep = 2;
          scheduleAuto(430);
        }
        break;
      }
      case 2:
        beginConnection();
        showStatus("@haliloxo canlı yayınına bağlanılıyor.");
        autoStep = 3;
        scheduleAuto(1200);
        break;
      case 3:
        completeConnection();
        showStatus("Bağlantı kuruldu. Sohbet ve aktif izleyiciler açıldı.");
        autoStep = 4;
        scheduleAuto(1100);
        break;
      case 4:
        addChatMessage(fakeMessages[messageIndex]);
        messageIndex += 1;
        autoStep = 5;
        scheduleAuto(1100);
        break;
      case 5:
        addChatMessage(fakeMessages[messageIndex]);
        messageIndex += 1;
        autoStep = 6;
        scheduleAuto(1150);
        break;
      case 6:
        triggerGift("Selin", 1000);
        showStatus("1.000 jetonluk hediye özel animasyonu tetikledi.");
        autoStep = 7;
        scheduleAuto(4700);
        break;
      case 7:
        state.panel = "gifts";
        render();
        showStatus("Hediye kuralı ve animasyonu canlı ayarlardan yönetiliyor.");
        autoStep = 8;
        scheduleAuto(1900);
        break;
      case 8:
        state.panel = "music";
        state.music = "playing";
        render();
        showStatus("Müzik başladı; kapak plak oldu ve ritim görünür.");
        autoStep = 9;
        scheduleAuto(2300);
        break;
      case 9:
        state.voice = "speaking";
        render();
        showStatus("Yayıncı konuşunca müzik ve TTS otomatik kısıldı.");
        autoStep = 10;
        scheduleAuto(2500);
        break;
      case 10:
        state.voice = "idle";
        state.panel = "tts";
        render();
        addChatMessage(fakeMessages[2]);
        showStatus("Konuşma bitti; sesler yumuşakça geri geldi.");
        autoStep = 11;
        scheduleAuto(5200);
        break;
      default:
        autoStep = 0;
        typingIndex = 0;
        scheduleAuto(100);
        break;
    }
  }

  root.querySelectorAll("[data-demo-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.demoPanel;
      const closing = state.panel === selected;
      setManual(
        closing
          ? "Ayar paneli kapatıldı."
          : `${panelNames[selected]} ayarları açıldı.`,
      );
      state.panel = closing ? "none" : selected;
      render();
    });
  });

  root.querySelectorAll("[data-demo-chat-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      setManual();
      state.chat = state.chat === "open" ? "closed" : "open";
      render();
      showStatus(
        state.chat === "open"
          ? "Sohbet, aktif izleyiciler ve hızlı kontroller açıldı."
          : "Sohbet kapatıldı.",
      );
    });
  });

  root.querySelectorAll(".studio-demo__switch").forEach((button) => {
    button.addEventListener("click", () => {
      setManual();
      if (button.hasAttribute("data-demo-gift-enabled")) {
        state.giftEnabled = !state.giftEnabled;
      } else if (button.hasAttribute("data-demo-ducking-enabled")) {
        state.duckingEnabled = !state.duckingEnabled;
      } else if (button.hasAttribute("data-demo-tts-enabled")) {
        state.ttsEnabled = !state.ttsEnabled;
      } else {
        button.classList.toggle("is-on");
        button.setAttribute(
          "aria-pressed",
          String(button.classList.contains("is-on")),
        );
      }
      render();
    });
  });

  root.querySelectorAll("[data-demo-orientation]").forEach((button) => {
    button.addEventListener("click", () => {
      setManual();
      state.orientation = button.dataset.demoOrientation || "vertical";
      render();
      showStatus(
        state.orientation === "horizontal"
          ? "Yayın yüzeyi yatay görünüme geçti."
          : "Yayın yüzeyi dikey görünüme geçti.",
      );
    });
  });

  root
    .querySelector("[data-demo-close-panel]")
    ?.addEventListener("click", () => {
      setManual("Ayar paneli kapatıldı.");
      state.panel = "none";
      render();
    });

  connectButton?.addEventListener("click", () => {
    setManual();
    if (state.connection === "live") {
      state.connection = "offline";
      state.chat = "closed";
      state.music = "stopped";
      resetMessages();
      render();
      showStatus("Demo bağlantısı kapatıldı.");
      return;
    }
    beginConnection({ manual: true });
  });

  usernameInput?.addEventListener("input", () => {
    setManual();
    state.username = usernameInput.value;
  });

  usernameInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    connectButton?.click();
  });

  root.querySelector("[data-demo-gift-test]")?.addEventListener("click", () => {
    setManual();
    if (!state.giftEnabled) {
      showStatus("Özel hediye animasyonu kapalı. Önce anahtarı aç.");
      return;
    }
    if (state.connection !== "live") {
      state.username =
        String(usernameInput?.value || "haliloxo").trim().replace(/^@+/, "") ||
        "haliloxo";
      completeConnection();
    }
    state.chat = "open";
    triggerGift("Selin", Number(root.querySelector("[data-demo-gift-threshold]")?.value) || 1000);
    render();
    showStatus("Özel hediye animasyonu test edildi.");
  });

  musicButton?.addEventListener("click", () => {
    setManual();
    setMusic(state.music === "playing" ? "paused" : "playing");
  });

  root.querySelector("[data-demo-voice-test]")?.addEventListener("click", () => {
    setManual();
    if (!state.duckingEnabled) {
      showStatus("Konuşurken otomatik ses kısma kapalı.");
      return;
    }
    if (state.music !== "playing") state.music = "playing";
    testVoice();
  });

  root.querySelector("[data-demo-tts-quick]")?.addEventListener("click", () => {
    setManual();
    state.ttsEnabled = !state.ttsEnabled;
    render();
    showStatus(state.ttsEnabled ? "TTS açıldı." : "TTS anında kapatıldı.");
  });

  root.querySelector("[data-demo-replay]")?.addEventListener("click", () => {
    state.mode = reducedMotion.matches ? "reduced" : "automatic";
    resetDemo({ staticView: reducedMotion.matches });
    if (!reducedMotion.matches) {
      showStatus("Canlı tanıtım yeniden başlatıldı.");
      scheduleAuto(450);
    }
  });

  root.querySelector(".studio-demo__gift-effect")?.addEventListener(
    "animationend",
    (event) => {
      if (event.animationName !== "studio-gift-show") return;
      state.gift = "idle";
      render();
    },
  );

  const syncActivity = () => {
    const active =
      state.visible &&
      document.visibilityState === "visible" &&
      !reducedMotion.matches;
    root.dataset.demoPaused = String(!active);
    if (active && state.mode === "automatic") {
      scheduleAuto(350);
    } else {
      clearTimer(autoTimer);
      autoTimer = 0;
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        state.visible = Boolean(entry?.isIntersecting);
        syncActivity();
      },
      { threshold: 0.12 },
    );
    observer.observe(root);
  }

  document.addEventListener("visibilitychange", syncActivity);
  addEventListener("pagehide", () => {
    clearTransientTimers();
    clearTimer(statusTimer);
  });

  const onReducedMotionChange = () => {
    if (reducedMotion.matches) {
      state.mode = "reduced";
      resetDemo({ staticView: true });
      root.dataset.demoPaused = "true";
    } else {
      state.mode = "automatic";
      resetDemo();
      root.dataset.demoPaused = "false";
      scheduleAuto(450);
    }
  };

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onReducedMotionChange);
  } else {
    reducedMotion.addListener(onReducedMotionChange);
  }

  resetDemo({ staticView: reducedMotion.matches });
  root.dataset.demoPaused = String(reducedMotion.matches);
  if (!reducedMotion.matches) scheduleAuto(450);
})();
