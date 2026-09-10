import { initializeExperienceDialog } from "./experience-dialog.js";
import { initializeNavigation } from "./navigation.js";
import { initializeProjectArchive } from "./project-archive.js";
import { initializeResume } from "./resume.js";
import { initializeScrollEffects } from "./scroll-effects.js";
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
  initializeScrollEffects();
});
