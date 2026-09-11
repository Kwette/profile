function initializeMobileMenu() {
  const navToggle = document.querySelector(".site-nav-toggle");
  const navLinks = document.querySelector(".site-nav-links");
  if (!navToggle || !navLinks) return;

  const closeMenu = () => {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", navToggle.dataset.openLabel);
    navToggle.querySelector("i").className = "fa-solid fa-bars";
    navLinks.classList.remove("is-open");
  };

  navToggle.addEventListener("click", () => {
    const isOpening = navToggle.getAttribute("aria-expanded") !== "true";
    navToggle.setAttribute("aria-expanded", String(isOpening));
    navToggle.setAttribute("aria-label", isOpening ? navToggle.dataset.closeLabel : navToggle.dataset.openLabel);
    navToggle.querySelector("i").className = isOpening ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    navLinks.classList.toggle("is-open", isOpening);
  });
  navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
      closeMenu();
      navToggle.focus();
    }
  });
}

function initializeActiveSection() {
  const observedNavLinks = Array.from(document.querySelectorAll(".site-nav-links a[href^='#']"));
  const observedSections = observedNavLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!("IntersectionObserver" in window) || !observedSections.length) return;

  const navObserver = new IntersectionObserver((entries) => {
    const activeEntry = entries.find((entry) => entry.isIntersecting);
    if (!activeEntry) return;
    observedNavLinks.forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${activeEntry.target.id}`;
      if (isCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
  observedSections.forEach((section) => navObserver.observe(section));
}

export function initializeNavigation() {
  initializeMobileMenu();
  initializeActiveSection();
}
