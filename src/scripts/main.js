import { initializeExperienceDialog } from "./experience-dialog.js";
import { reducedMotion } from "./motion.js";
import { initializeNavigation } from "./navigation.js";
import { initializeProjectArchive } from "./project-archive.js";
import { initializeResume } from "./resume.js";
import { initializeTechnicalCarousel } from "./technical-carousel.js";

document.addEventListener("DOMContentLoaded", () => {
  const isFrench = document.documentElement.lang === "fr";

  document.querySelectorAll("[data-current-year]").forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-technical-carousel]").forEach(initializeTechnicalCarousel);
  document.querySelectorAll(".professional-experience .experience-item").forEach((item) => initializeExperienceDialog(item, isFrench));
  initializeNavigation(isFrench);
  initializeProjectArchive(isFrench);
  initializeResume();

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const revealSelector = [
      ".container > .card:not(.hero-card)",
      ".personal-projects-list > .personal-project-card",
      ".professional-experience > .experience-item"
    ].join(",");
    const revealItems = Array.from(document.querySelectorAll(revealSelector));
    revealItems.forEach((item) => {
      const staggerSelector = item.matches(".personal-project-card") ? ".personal-project-card" : ".experience-item";
      const shouldStagger = item.matches(".personal-project-card, .experience-item");
      const siblings = shouldStagger ? Array.from(item.parentElement.children).filter((sibling) => sibling.matches(staggerSelector)) : [];
      const delay = shouldStagger ? siblings.indexOf(item) * 60 : 0;
      item.style.setProperty("--reveal-delay", `${delay}ms`);
      item.classList.add("reveal-item");
    });
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio >= 0.16) {
          entry.target.classList.add("is-revealed");
        } else if (entry.intersectionRatio <= 0.08) {
          entry.target.classList.remove("is-revealed");
        }
      });
    }, { rootMargin: "0px 0px -5%", threshold: [0.08, 0.16] });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    const updateBackToTop = () => {
      const isVisible = window.scrollY >= 700;
      backToTop.classList.toggle("is-visible", isVisible);
      backToTop.setAttribute("aria-hidden", String(!isVisible));
      backToTop.tabIndex = isVisible ? 0 : -1;
    };
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" }));
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
  }

});
