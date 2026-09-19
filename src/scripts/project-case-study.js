import { createDialogCarousel, initializeDialogCarousel } from "./dialog-carousel.js";

export function initializeProjectCaseStudies() {
  document.querySelectorAll("[data-case-study-trigger]").forEach(trigger => {
    const source = document.getElementById(trigger.getAttribute("aria-controls"));
    if (!source) return;
    const data = source.dataset;
    const logo = data.logoSrc ? document.createElement("span") : null;
    if (logo) {
      logo.className = "experience-logo" + (data.logoClass ? " " + data.logoClass : "");
      const image = document.createElement("img");
      image.src = data.logoSrc;
      image.alt = data.logoAlt;
      logo.append(image);
    }
    const groups = Array.from(source.children).map(panel =>
      Array.from(panel.querySelector(".dialog-content-rail").children));
    const video = source.querySelector("video");
    const videoSource = video?.getAttribute?.("src") || "";
    const loadVideo = () => {
      if (!video || !videoSource || video.getAttribute("src") === videoSource) return;
      video.src = videoSource;
      video.load();
    };
    const releaseVideo = () => {
      if (!video) return;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Removing the source below still releases media that is not seekable yet.
      }
      video.removeAttribute?.("src");
      video.load?.();
    };
    if (videoSource) releaseVideo();
    const parts = createDialogCarousel({
      id: source.id, logo, label: data.label, title: data.title, meta: data.meta,
      labels: JSON.parse(data.tabs), groups,
      closeLabel: data.closeLabel, sectionsLabel: data.sectionsLabel,
      previousLabel: data.previousLabel, nextLabel: data.nextLabel,
      panelClass: "project-case-study-panel"
    });
    source.remove();
    initializeDialogCarousel(parts, trigger, {
      additionalTriggers: Array.from(document.querySelectorAll(`[data-case-study-open="${parts.dialog.id}"]`)),
      onOpen: loadVideo,
      onChange: () => video?.pause(),
      onClose: releaseVideo
    });
  });
}
