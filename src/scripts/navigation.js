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
  const observedSections = new Map();
  observedNavLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) observedSections.set(target, link.getAttribute("href"));
  });
  document.querySelectorAll("[data-navigation-target]").forEach((section) => {
    const navigationTarget = section.dataset.navigationTarget;
    if (observedNavLinks.some((link) => link.getAttribute("href") === navigationTarget)) {
      observedSections.set(section, navigationTarget);
    }
  });
  if (!("IntersectionObserver" in window) || !observedSections.size) return;

  const navObserver = new IntersectionObserver((entries) => {
    const activeEntry = entries.find((entry) => entry.isIntersecting);
    if (!activeEntry) return;
    const activeTarget = observedSections.get(activeEntry.target);
    observedNavLinks.forEach((link) => {
      const isCurrent = link.getAttribute("href") === activeTarget;
      if (isCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
  observedSections.forEach((navigationTarget, section) => navObserver.observe(section));
}

export function initializeNavigation() {
  initializeMobileMenu();
  initializeActiveSection();
}
