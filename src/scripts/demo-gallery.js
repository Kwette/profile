import { reducedMotion } from "./motion.js";

export function initializeDemoGallery(root) {
  const gallery = root.querySelector("[data-demo-gallery]");
  if (!gallery) return { stop() {} };

  const player = gallery.querySelector("[data-demo-player]");
  const video = gallery.querySelector("[data-demo-video]");
  const close = gallery.querySelector("[data-demo-close]");
  const actions = Array.from(gallery.querySelectorAll("[data-demo-source]"));
  const scrollContainer = gallery.closest(".dialog-carousel-content");
  let activeThumbnail = null;

  const scrollToElement = (element) => {
    if (!scrollContainer) return;
    const top = scrollContainer.scrollTop
      + element.getBoundingClientRect().top
      - scrollContainer.getBoundingClientRect().top
      - 12;
    scrollContainer.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
  };

  const stop = ({ hide = true } = {}) => {
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // Removing the source below still releases media that is not seekable yet.
    }
    video.removeAttribute("src");
    video.removeAttribute("poster");
    video.removeAttribute("aria-label");
    video.load();
    player.hidden = hide;
    actions.forEach(action => action.setAttribute("aria-pressed", "false"));
    if (hide) activeThumbnail = null;
  };

  actions.forEach(action => {
    action.setAttribute("aria-pressed", "false");
    action.addEventListener("click", () => {
      stop({ hide: false });
      activeThumbnail = action.closest(".experience-demo-card")
        ?.querySelector(".experience-demo-card__media") || action;
      video.src = action.dataset.demoSource;
      video.poster = action.dataset.demoPoster;
      video.setAttribute("aria-label", action.dataset.demoLabel);
      actions
        .filter(candidate => candidate.dataset.demoSource === action.dataset.demoSource)
        .forEach(candidate => candidate.setAttribute("aria-pressed", "true"));
      player.hidden = false;
      video.load();
      video.focus({ preventScroll: true });
      video.play()?.catch(() => {});
      scrollToElement(player);
    });
  });

  close.addEventListener("click", () => {
    const returnTarget = activeThumbnail;
    stop();
    if (!returnTarget) return;
    returnTarget.focus({ preventScroll: true });
    scrollToElement(returnTarget);
  });

  video.addEventListener("play", () => {
    document.querySelectorAll("video").forEach(otherVideo => {
      if (otherVideo !== video) otherVideo.pause();
    });
  });

  return { stop };
}
