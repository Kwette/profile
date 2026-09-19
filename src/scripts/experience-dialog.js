import { createDialogCarousel, initializeDialogCarousel } from "./dialog-carousel.js";
import { initializeDemoGallery } from "./demo-gallery.js";

export function initializeExperienceDialog(item) {
  const trigger = item.querySelector(".experience-summary");
  const panel = item.querySelector(".app-details");
  const section = item.closest(".professional-experience");
  if (!trigger || !panel || !section) return;

  const role = trigger.querySelector(".experience-role")?.textContent.trim() || "";
  const meta = trigger.querySelector(".experience-meta")?.textContent.trim() || "";
  const logo = trigger.querySelector(".experience-logo")?.cloneNode(true);
  const chevron = trigger.querySelector(".experience-chevron i");
  const labels = JSON.parse(item.dataset.dialogTabs);
  const keys = JSON.parse(item.dataset.dialogTabKeys);
  if (keys.length !== labels.length || new Set(keys).size !== keys.length) {
    throw new Error(`Invalid experience tab keys for ${panel.id}.`);
  }

  const groups = labels.map(() => []);
  Array.from(panel.children).forEach((node) => {
    const groupIndex = keys.indexOf(node.dataset.dialogView);
    if (groupIndex === -1) {
      throw new Error(`Unknown experience view "${node.dataset.dialogView}" in ${panel.id}.`);
    }
    groups[groupIndex].push(node);
  });
  const demoGallery = initializeDemoGallery(panel);


  const parts = createDialogCarousel({
    id: panel.id, logo, title: role, meta, labels, groups,
    closeLabel: section.dataset.dialogCloseLabel,
    sectionsLabel: section.dataset.dialogSectionsLabel,
    previousLabel: section.dataset.dialogPreviousLabel,
    nextLabel: section.dataset.dialogNextLabel,
    panelClass: "experience-dialog-slide"
  });
  panel.remove();
  initializeDialogCarousel(parts, trigger, {
    onChange() {
      demoGallery.stop();
    },
    onOpen() {
      item.classList.add("is-open");
      chevron?.classList.replace("fa-chevron-down", "fa-chevron-up");
    },
    onClose() {
      demoGallery.stop();
      item.classList.remove("is-open");
      chevron?.classList.replace("fa-chevron-up", "fa-chevron-down");
    }
  });
}
