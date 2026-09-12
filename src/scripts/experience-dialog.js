import { closeAnimatedDialog, trapDialogFocus } from "./dialog.js";

function createIcon(className) {
  const icon = document.createElement("i");
  icon.className = className;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

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

  const dialog = document.createElement("dialog");
  dialog.className = "app-dialog experience-dialog";
  dialog.id = panel.id;
  const dialogTitleId = `${dialog.id}-title`;
  dialog.setAttribute("aria-labelledby", dialogTitleId);

  const shell = document.createElement("div");
  shell.className = "app-dialog__shell experience-dialog-shell";
  const header = document.createElement("header");
  header.className = "app-dialog__header experience-dialog-header";
  const heading = document.createElement("div");
  heading.className = "experience-dialog-heading";
  const title = document.createElement("h2");
  title.id = dialogTitleId;
  title.textContent = role;
  const metaLine = document.createElement("p");
  metaLine.className = "experience-dialog-meta";
  metaLine.textContent = meta;
  heading.append(title, metaLine);

  const close = document.createElement("button");
  close.className = "app-dialog__close experience-dialog-close";
  close.type = "button";
  close.setAttribute("aria-label", section.dataset.dialogCloseLabel);
  close.append(createIcon("fa-solid fa-xmark"));
  if (logo) header.append(logo);
  header.append(heading, close);

  const tabs = document.createElement("div");
  tabs.className = "experience-dialog-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", section.dataset.dialogSectionsLabel);
  const content = document.createElement("div");
  content.className = "app-dialog__content experience-dialog-content";

  const tabButtons = [];
  const slides = [];
  labels.forEach((label, slideIndex) => {
    const tab = document.createElement("button");
    tab.className = "experience-dialog-tab";
    tab.type = "button";
    tab.id = `${dialog.id}-tab-${slideIndex + 1}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `${dialog.id}-panel-${slideIndex + 1}`);
    tab.textContent = label;

    const slide = document.createElement("section");
    slide.className = "experience-dialog-slide";
    slide.id = `${dialog.id}-panel-${slideIndex + 1}`;
    slide.setAttribute("role", "tabpanel");
    slide.setAttribute("aria-labelledby", tab.id);
    groups[slideIndex].forEach((node) => slide.append(node));
    tabs.append(tab);
    content.append(slide);
    tabButtons.push(tab);
    slides.push(slide);
  });

  const footer = document.createElement("footer");
  footer.className = "experience-dialog-controls";
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "experience-dialog-step";
  const previousLabel = document.createElement("span");
  previousLabel.textContent = section.dataset.dialogPreviousLabel;
  previous.append(createIcon("fa-solid fa-arrow-left"), previousLabel);
  const progress = document.createElement("span");
  progress.className = "experience-dialog-progress";
  progress.setAttribute("aria-live", "polite");
  const next = document.createElement("button");
  next.type = "button";
  next.className = "experience-dialog-step";
  const nextLabel = document.createElement("span");
  nextLabel.textContent = section.dataset.dialogNextLabel;
  next.append(nextLabel, createIcon("fa-solid fa-arrow-right"));
  footer.append(previous, progress, next);
  shell.append(header, tabs, content, footer);
  dialog.append(shell);
  document.body.append(dialog);

  panel.remove();
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", dialog.id);

  let currentIndex = 0;
  let previousOverflow = "";
  const update = (nextIndex, focusTab = false) => {
    currentIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === currentIndex;
      slide.hidden = !active;
      slide.classList.toggle("is-active", active);
      tabButtons[slideIndex].setAttribute("aria-selected", String(active));
      tabButtons[slideIndex].tabIndex = active ? 0 : -1;
    });
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === slides.length - 1;
    progress.textContent = `${currentIndex + 1} / ${slides.length}`;
    content.scrollTop = 0;
    slides[currentIndex].scrollTop = 0;
    if (focusTab) tabButtons[currentIndex].focus();
  };
  const closeDialog = () => closeAnimatedDialog(dialog);

  tabButtons.forEach((tab, tabIndex) => {
    tab.addEventListener("click", () => update(tabIndex));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      update(event.key === "ArrowRight" ? currentIndex + 1 : currentIndex - 1, true);
    });
  });
  previous.addEventListener("click", () => update(currentIndex - 1));
  next.addEventListener("click", () => update(currentIndex + 1));
  close.addEventListener("click", closeDialog);
  trigger.addEventListener("click", () => {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    trigger.setAttribute("aria-expanded", "true");
    item.classList.add("is-open");
    chevron?.classList.replace("fa-chevron-down", "fa-chevron-up");
    update(0);
    dialog.showModal();
    close.focus({ preventScroll: true });
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.style.overflow = previousOverflow;
    trigger.setAttribute("aria-expanded", "false");
    item.classList.remove("is-open");
    chevron?.classList.replace("fa-chevron-up", "fa-chevron-down");
    trigger.focus({ preventScroll: true });
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") update(currentIndex - 1);
    if (event.key === "ArrowRight") update(currentIndex + 1);
    trapDialogFocus(dialog, event);
  });

  update(0);
}
