const tabButtons = document.querySelectorAll(".tab");
const contentSections = {
  tickets: document.getElementById("tickets-content"),
  extras: document.getElementById("extras-content"),
};
const orderNumberLabel = document.getElementById("order-number");

function randomDigits(length) {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += Math.floor(Math.random() * 10);
  }
  return output;
}

function randomLetters(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

function setRandomOrderNumber() {
  const storageKey = "ticketmasterMockOrderNumber";
  let orderNumber = localStorage.getItem(storageKey);
  if (!orderNumber) {
    orderNumber = `Order #${randomDigits(2)}-${randomDigits(6)}/${randomLetters(2)}`;
    localStorage.setItem(storageKey, orderNumber);
  }
  if (orderNumberLabel) {
    orderNumberLabel.textContent = orderNumber;
  }
}

setRandomOrderNumber();

tabButtons.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selectedTab = tab.dataset.tab;

    tabButtons.forEach((button) => button.classList.remove("active"));
    tab.classList.add("active");

    Object.entries(contentSections).forEach(([key, section]) => {
      section.classList.toggle("active", key === selectedTab);
    });
  });
});

const ticketCards = document.querySelectorAll(".ticket-card");
const modalSeats = document.getElementById("modal-seats"); 
const sCount = document.getElementById("s-count");
const transferOverlay = document.getElementById("transfer-overlay");
const transferBtn = document.getElementById("transfer-btn");
const transferToBtn = document.getElementById("transfer-to-btn");
const transferModalClose = document.getElementById("transfer-modal-close");

ticketCards.forEach((card) => {
  card.addEventListener("click", () => {
    ticketCards.forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
  });
});

function populateModalSeats() {
  if (!modalSeats) return;
  modalSeats.innerHTML = "";
  ticketCards.forEach((card) => {
    const seatValue = card.querySelector(".value:last-child").textContent;
    const seat = document.createElement("div");
    seat.className = "modal-seat";
    seat.dataset.seat = card.dataset.type;
    seat.innerHTML = `
      <div class="seat-label">SEAT</div>
      <div class="seat-number">${seatValue}</div>
      <div class="seat-check">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="24" height="24">
          <path fill="#fff" d="M20,38.5C9.8,38.5,1.5,30.2,1.5,20S9.8,1.5,20,1.5S38.5,9.8,38.5,20S30.2,38.5,20,38.5z"/>
          <path fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="3" d="M11.2,20.1l5.8,5.8l13.2-13.2"/>
        </svg>
      </div>
    `;
    seat.addEventListener("click", () => {
      seat.classList.toggle("selected");
      const selected = document.querySelectorAll(".modal-seat.selected");
      sCount.textContent = selected.length;
    });
    modalSeats.appendChild(seat);
  });
}

function clearModal() {
  if (transferOverlay) {
    transferOverlay.classList.remove("active");
    document.querySelectorAll(".modal-seat.selected").forEach((s) => s.classList.remove("selected"));
    sCount.textContent = "0";
  }
}

if (transferBtn) {
  transferBtn.addEventListener("click", () => {
    populateModalSeats();
    if (transferOverlay) {
      transferOverlay.classList.add("active");
    }
  });
}

if (transferOverlay) {
  transferOverlay.addEventListener("click", (e) => {
    if (e.target === transferOverlay) {
      clearModal();
    }
  });
}

if (transferModalClose) {
  transferModalClose.addEventListener("click", () => {
    clearModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") {
    return;
  }
  if (transferOverlay && transferOverlay.classList.contains("active")) {
    clearModal();
  }
});

if (transferToBtn) {
  transferToBtn.addEventListener("click", () => {
    clearModal();
  });
}

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

function isAppleDevice() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const touchPoints = navigator.maxTouchPoints || 0;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMacTouch = /Mac/i.test(platform) && touchPoints > 1;
  const isMacSafari = /Mac/i.test(platform) && /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg/i.test(ua);
  return isIOS || isMacTouch || isMacSafari;
}

function configureMapEmbed() {
  const mapFrame = document.getElementById("concert-map");
  if (!mapFrame) {
    return;
  }

  const providerStorageKey = "ticketmasterMockMapProvider_v2";
  const legacyProviderKey = "ticketmasterMockMapProvider";
  localStorage.removeItem(legacyProviderKey);
  localStorage.removeItem(providerStorageKey);

  const mapQuery = "Soldier%20Field%2C%20Chicago%2C%20Illinois";
  const appleMapUrl = `https://maps.apple.com/?q=${mapQuery}&z=14`;
  const googleMapUrl = `https://www.google.com/maps?q=${mapQuery}&z=14&output=embed`;
  const googleFallbackUrl = `https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`;

  const onApple = isAppleDevice();
  // Apple Maps is not a reliable iframe provider across iOS browsers.
  // Keep iframe on Google for guaranteed display, and offer Apple Maps via link.
  const primaryMapUrl = googleMapUrl;
  const fallbackMapUrl = googleFallbackUrl;

  let didFallback = false;
  let loadHandled = false;

  function switchToFallback() {
    if (didFallback) {
      return;
    }
    didFallback = true;
    mapFrame.src = fallbackMapUrl;
  }

  const fallbackTimeout = window.setTimeout(() => {
    if (!loadHandled) {
      switchToFallback();
    }
  }, 5000);

  mapFrame.addEventListener("load", () => {
    loadHandled = true;
    window.clearTimeout(fallbackTimeout);
  });

  mapFrame.addEventListener("error", () => {
    window.clearTimeout(fallbackTimeout);
    switchToFallback();
  });

  mapFrame.src = primaryMapUrl;

  const mapWrap = mapFrame.closest(".map-wrap");
  if (mapWrap) {
    const existingLink = mapWrap.querySelector(".map-open-link");
    if (existingLink) {
      existingLink.remove();
    }
    const openLink = document.createElement("a");
    openLink.className = "map-open-link";
    openLink.href = onApple ? appleMapUrl : googleMapUrl.replace("&output=embed", "");
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = onApple ? "Open in Apple Maps" : "Open in Google Maps";
    mapWrap.appendChild(openLink);
  }
}

configureMapEmbed();
