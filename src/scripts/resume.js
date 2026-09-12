import { reducedMotion } from "./motion.js";

export function initializeResume() {
  const mobileResume = window.matchMedia("(max-width: 768px)");
  document.querySelectorAll(".resume-toggle").forEach((button) => {
    const card = button.closest(".resume-card");
    const label = button.querySelector("[data-resume-label]");
    const content = Array.from(card.querySelectorAll(".resume-body, .skills"));

    const setControlState = (isExpanded) => {
      button.setAttribute("aria-expanded", String(isExpanded));
      label.textContent = isExpanded ? label.dataset.closeLabel : label.dataset.openLabel;
    };

    button.addEventListener("click", () => {
      const isOpening = button.getAttribute("aria-expanded") !== "true";
      const startHeight = card.getBoundingClientRect().height;
      card.getAnimations().forEach((animation) => animation.cancel());
      content.forEach((node) => node.getAnimations().forEach((animation) => animation.cancel()));

      if (isOpening) {
        card.classList.add("is-expanded");
      } else {
        card.classList.remove("is-expanded");
      }
      const endHeight = card.getBoundingClientRect().height;
      if (!isOpening) card.classList.add("is-expanded");
      setControlState(isOpening);

      if (reducedMotion.matches) {
        card.classList.toggle("is-expanded", isOpening);
        return;
      }

      button.disabled = true;
      card.style.overflow = "hidden";
      const cardAnimation = card.animate(
        [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
        { duration: 620, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
      );
      content.forEach((node) => node.animate(
        isOpening
          ? [
              { opacity: 0, offset: 0 },
              { opacity: 0, offset: 0.16 },
              { opacity: 1, offset: 1 }
            ]
          : [
              { opacity: 1, offset: 0 },
              { opacity: 1, offset: 0.58 },
              { opacity: 0, offset: 1 }
            ],
        { duration: 620, easing: "ease-in-out" }
      ));

      cardAnimation.finished
        .then(() => card.classList.toggle("is-expanded", isOpening && !mobileResume.matches))
        .catch(() => {})
        .finally(() => {
          card.style.removeProperty("overflow");
          button.disabled = mobileResume.matches;
        });
    });
  });

  const syncResumeAvailability = () => {
    document.querySelectorAll(".resume-toggle").forEach((button) => {
      const card = button.closest(".resume-card");
      const label = button.querySelector("[data-resume-label]");
      if (mobileResume.matches) {
        card.getAnimations().forEach(animation => animation.cancel());
        card.querySelectorAll(".resume-body, .skills").forEach(node =>
          node.getAnimations().forEach(animation => animation.cancel()));
        button.disabled = true;
        button.setAttribute("aria-expanded", "false");
        label.textContent = label.dataset.openLabel;
        card.classList.remove("is-expanded");
        card.style.removeProperty("height");
        card.style.removeProperty("overflow");
      } else {
        button.disabled = false;
      }
    });
  };

  mobileResume.addEventListener("change", syncResumeAvailability);
  syncResumeAvailability();
}
