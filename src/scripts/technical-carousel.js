export function initializeTechnicalCarousel(carousel) {
  const viewport = carousel.querySelector(".technical-carousel-viewport");
  const track = carousel.querySelector(".technical-focus-grid");
  const slides = Array.from(carousel.querySelectorAll(".technical-focus-item"));
  const controls = carousel.querySelector(".technical-carousel-controls");
  const previousButton = carousel.querySelector("[data-carousel-previous]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const announcement = carousel.querySelector("[data-carousel-announcement]");
  const indicatorsContainer = carousel.querySelector("[data-carousel-indicators]");
  const topicLabel = carousel.dataset.topicLabel;
  const positionSeparator = carousel.dataset.positionSeparator;
  const slideRoleDescription = carousel.dataset.slideRoleDescription;
  const directLabel = carousel.dataset.directLabel;
  let currentIndex = 0;
  let swipeStartX = null;

  if (slides.length < 2) return;

  const section = carousel.closest(".technical-focus-card");
  const sectionLabel = section.getAttribute("aria-labelledby");
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-roledescription", "carousel");
  carousel.setAttribute("aria-labelledby", sectionLabel);

  const indicators = slides.map((slide, index) => {
    const title = slide.querySelector("h3").textContent.trim();
    const position = `${topicLabel} ${index + 1} ${positionSeparator} ${slides.length}`;

    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", slideRoleDescription);
    slide.setAttribute("aria-label", `${position}: ${title}`);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "technical-carousel-indicator";
    button.textContent = slide.dataset.carouselLabel || String(index + 1).padStart(2, "0");
    button.setAttribute("aria-label", `${directLabel} ${index + 1}: ${title}`);
    button.addEventListener("click", () => update(index));
    indicatorsContainer.appendChild(button);
    return button;
  });

  const update = (nextIndex, shouldAnnounce = true) => {
    currentIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));
    track.style.removeProperty("transform");
    indicatorsContainer.style.setProperty("--active-index", currentIndex);
    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === slides.length - 1;

    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle("is-active", isActive);
      slide.toggleAttribute("inert", !isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      indicators[index].setAttribute("aria-current", String(isActive));
    });

    if (shouldAnnounce) {
      announcement.textContent = `${topicLabel} ${currentIndex + 1} ${positionSeparator} ${slides.length}`;
    }
  };

  previousButton.addEventListener("click", () => update(currentIndex - 1));
  nextButton.addEventListener("click", () => update(currentIndex + 1));

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      update(currentIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      update(currentIndex + 1);
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") swipeStartX = event.clientX;
  });
  viewport.addEventListener("pointerup", (event) => {
    if (swipeStartX === null || event.pointerType !== "touch") return;
    const distance = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(distance) < 50) return;
    update(distance < 0 ? currentIndex + 1 : currentIndex - 1);
  });
  viewport.addEventListener("pointercancel", () => {
    swipeStartX = null;
  });

  carousel.classList.add("is-carousel-ready");
  controls.hidden = false;
  update(0, false);
}
