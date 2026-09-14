import { closeAnimatedDialog } from "./dialog.js";
import { initializeDialogNavigation } from "./dialog-navigation.js";

export function initializeProjectCaseStudies() {
  document.querySelectorAll("[data-case-study-trigger]").forEach(trigger => {
    const dialog = document.getElementById(trigger.getAttribute("aria-controls"));
    if (!dialog) return;
    const close = dialog.querySelector("[data-case-study-close]");
    const content = dialog.querySelector(".project-case-study-body");
    const video = dialog.querySelector("video");
    const navigation = initializeDialogNavigation({
      dialog,
      tabs: Array.from(dialog.querySelectorAll(".dialog-tab")),
      panels: Array.from(dialog.querySelectorAll(".project-case-study-panel")),
      content,
      previous: dialog.querySelector("[data-case-study-previous]"),
      next: dialog.querySelector("[data-case-study-next]"),
      progress: dialog.querySelector(".dialog-progress"),
      onChange: () => video?.pause()
    });
    let previousOverflow = null;

    const resetVideo = () => {
      if (!video) return;
      video.pause();
      if (video.readyState > 0) video.currentTime = 0;
    };
    const closeDialog = () => {
      resetVideo();
      closeAnimatedDialog(dialog);
    };

    const openDialog = () => {
      if (dialog.open) return;
      dialog.showModal();
      navigation.reset();
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      content.scrollTop = 0;
      close.focus({ preventScroll: true });
    };
    trigger.addEventListener("click", openDialog);
    trigger.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat) openDialog();
    });
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      closeDialog();
    });
    // Native showModal contains keyboard focus, including native video controls.
    dialog.addEventListener("close", () => {
      resetVideo();
      if (previousOverflow === null) return;
      document.documentElement.style.overflow = previousOverflow;
      previousOverflow = null;
      trigger.focus({ preventScroll: true });
    });
  });
}
