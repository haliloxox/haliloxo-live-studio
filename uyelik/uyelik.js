import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, onValue, ref } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase web configuration is intentionally public. Database Rules and the
// server-side license service, not this identifier, protect membership data.
const firebaseConfig = {
  apiKey: "AIzaSyC8sCt6D7w-h5XbBlgmP_c-lpAN2SR8Yn0",
  authDomain: "haliloxo-uye-kontrol.firebaseapp.com",
  databaseURL: "https://haliloxo-uye-kontrol-default-rtdb.firebaseio.com",
  projectId: "haliloxo-uye-kontrol",
  appId: "1:81738250642:web:5c9216cb08c6e18a1b294b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const elements = {
  status: document.querySelector("[data-status]"),
  error: document.querySelector("[data-error]"),
  signedOut: document.querySelector("[data-signed-out]"),
  signedIn: document.querySelector("[data-signed-in]"),
  signIn: document.querySelector("[data-sign-in]"),
  signOut: document.querySelector("[data-sign-out]"),
  avatar: document.querySelector("[data-avatar]"),
  name: document.querySelector("[data-name]"),
  email: document.querySelector("[data-email]"),
  plan: document.querySelector("[data-plan]"),
  planBadge: document.querySelector("[data-plan-badge]"),
  licenseStatus: document.querySelector("[data-license-status]"),
  licenseEnd: document.querySelector("[data-license-end]"),
  tiktok: document.querySelector("[data-tiktok]"),
  note: document.querySelector("[data-membership-note]"),
};

let stopMembershipListener = () => {};

const setStatus = (message, state = "idle") => {
  elements.status.textContent = message;
  elements.status.dataset.state = state;
};

const showError = (message = "") => {
  elements.error.hidden = !message;
  elements.error.textContent = message;
};

const formatDate = (value) => {
  const timestamp = Number(value || 0);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const membershipIsActive = (member) => {
  const endsAt = Number(member?.lisansBitis || 0);
  return member?.lisansAktif === true && endsAt > Date.now();
};

const resetMembership = () => {
  elements.plan.textContent = "Ücretsiz";
  elements.planBadge.textContent = "FREE";
  elements.planBadge.dataset.tier = "free";
  elements.licenseStatus.textContent = "Lisans bulunamadı";
  elements.licenseEnd.textContent = "—";
  elements.tiktok.textContent = "—";
  elements.note.innerHTML = "<strong>Üyelik kaydın henüz hazır değil.</strong><span>Programda bu Google hesabıyla oturum açtıktan sonra üyelik kaydın burada görünür.</span>";
};

const renderMembership = (member) => {
  if (!member || typeof member !== "object") {
    resetMembership();
    return;
  }

  const active = membershipIsActive(member);
  const planName = active ? "Oyun erişimi" : "Ücretsiz";
  elements.plan.textContent = planName;
  elements.planBadge.textContent = active ? "ETKİN" : "FREE";
  elements.planBadge.dataset.tier = active ? "premium" : "free";
  elements.licenseStatus.textContent = active ? "Etkin" : "Etkin değil";
  elements.licenseStatus.dataset.active = String(active);
  elements.licenseEnd.textContent = active ? formatDate(member.lisansBitis) : "—";
  elements.tiktok.textContent = member.tiktokKullaniciAdi
    ? `@${String(member.tiktokKullaniciAdi).replace(/^@+/, "")}`
    : "Bağlanmadı";
  elements.note.innerHTML = active
    ? "<strong>Oyun erişimin etkin.</strong><span>Lisans ve paket değişiklikleri güvenli sunucu işlemleriyle korunur.</span>"
    : "<strong>Ücretsiz kullanım etkin.</strong><span>Satın alma sistemi açıldığında paket bilgisi bu alanda otomatik güncellenir.</span>";
};

const watchMembership = (user) => {
  stopMembershipListener();
  setStatus("Üyelik bilgilerin güvenle yükleniyor", "loading");
  stopMembershipListener = onValue(
    ref(database, `kullanicilar/${user.uid}`),
    (snapshot) => {
      renderMembership(snapshot.val());
      setStatus("Güvenli bağlantı etkin", "ready");
    },
    () => {
      resetMembership();
      setStatus("Üyelik bilgisi alınamadı", "error");
      showError("Üyelik bilgine şu an ulaşılamadı. Lütfen daha sonra tekrar dene.");
    },
  );
};

const renderUser = (user) => {
  const name = user.displayName || "Haliloxo kullanıcısı";
  elements.name.textContent = name;
  elements.email.textContent = user.email || "";
  elements.avatar.src = user.photoURL || "/assets/oxo-logo-192.png";
  elements.avatar.alt = `${name} profil resmi`;
};

const humanizeAuthError = (error) => {
  if (error?.code === "auth/popup-closed-by-user") return "Giriş penceresi kapatıldı.";
  if (error?.code === "auth/popup-blocked") return "Giriş penceresi engellendi. Tarayıcında açılır pencereye izin verip tekrar dene.";
  if (error?.code === "auth/unauthorized-domain") return "Bu alan adı güvenli giriş için henüz yetkilendirilmemiş. Yönetici ayarından haliloxo.com eklenmelidir.";
  if (error?.code === "auth/network-request-failed") return "Ağ bağlantısı kurulamadı. İnternetini kontrol edip tekrar dene.";
  return "Google oturumu açılamadı. Lütfen tekrar dene.";
};

elements.signIn.addEventListener("click", async () => {
  showError();
  elements.signIn.disabled = true;
  setStatus("Google hesabınla güvenli bağlantı kuruluyor", "loading");
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    setStatus("Giriş yapılamadı", "error");
    showError(humanizeAuthError(error));
  } finally {
    elements.signIn.disabled = false;
  }
});

elements.signOut.addEventListener("click", async () => {
  elements.signOut.disabled = true;
  try {
    await signOut(auth);
  } finally {
    elements.signOut.disabled = false;
  }
});

void setPersistence(auth, browserLocalPersistence).catch(() => {});
onAuthStateChanged(auth, (user) => {
  showError();
  stopMembershipListener();
  stopMembershipListener = () => {};
  const signedIn = Boolean(user);
  elements.signedOut.hidden = signedIn;
  elements.signedIn.hidden = !signedIn;

  if (!user) {
    setStatus("Güvenli bağlantı hazır", "ready");
    return;
  }
  renderUser(user);
  watchMembership(user);
});
