import { reducedMotion } from "./motion.js";

function initializeRevealAnimations() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const revealSelector = [
    ".container > .card:not(.hero-card)",
    ".personal-projects-list > .personal-project-card",
    ".professional-experience > .experience-item"
  ].join(",");
  const revealItems = Array.from(document.querySelectorAll(revealSelector));

  revealItems.forEach((item) => {
    const staggerSelector = item.matches(".personal-project-card") ? ".personal-project-card" : ".experience-item";
    const shouldStagger = item.matches(".personal-project-card, .experience-item");
    const siblings = shouldStagger
      ? Array.from(item.parentElement.children).filter((sibling) => sibling.matches(staggerSelector))
      : [];
    const delay = shouldStagger ? siblings.indexOf(item) * 60 : 0;
    item.style.setProperty("--reveal-delay", `${delay}ms`);
    item.classList.add("reveal-item");
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
      }
    });
  }, { rootMargin: "-24px 0px -24px", threshold: 0 });

  const exitObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        entry.target.classList.remove("is-revealed");
      }
    });
  }, { threshold: 0 });
  revealItems.forEach((item) => {
    revealObserver.observe(item);
    exitObserver.observe(item);
  });
}

function initializeBackToTop() {
  const backToTop = document.querySelector("[data-back-to-top]");
  if (!backToTop) return;

  const updateBackToTop = () => {
    const isVisible = window.scrollY >= 700;
    backToTop.classList.toggle("is-visible", isVisible);
    backToTop.setAttribute("aria-hidden", String(!isVisible));
    backToTop.tabIndex = isVisible ? 0 : -1;
  };

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();
}

export function initializeScrollEffects() {
  initializeRevealAnimations();
  initializeBackToTop();
}
