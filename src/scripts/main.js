import { initializeExperienceDialog } from "./experience-dialog.js";
import { reducedMotion } from "./motion.js";
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
  initializeProjectArchive(isFrench);
  initializeResume();

  const navToggle = document.querySelector(".site-nav-toggle");
  const navLinks = document.querySelector(".site-nav-links");
  if (navToggle && navLinks) {
    const closeMenu = () => {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", isFrench ? "Ouvrir le menu" : "Open menu");
      navToggle.querySelector("i").className = "fa-solid fa-bars";
      navLinks.classList.remove("is-open");
    };

    navToggle.addEventListener("click", () => {
      const isOpening = navToggle.getAttribute("aria-expanded") !== "true";
      navToggle.setAttribute("aria-expanded", String(isOpening));
      navToggle.setAttribute("aria-label", isOpening ? (isFrench ? "Fermer le menu" : "Close menu") : (isFrench ? "Ouvrir le menu" : "Open menu"));
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

  const observedNavLinks = Array.from(document.querySelectorAll(".site-nav-links a[href^='#']"));
  const observedSections = observedNavLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window && observedSections.length) {
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
