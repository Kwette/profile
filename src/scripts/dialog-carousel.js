import { closeAnimatedDialog } from "./dialog.js";
import { initializeDialogNavigation } from "./dialog-navigation.js";

function createIcon(className) {
  const icon = document.createElement("i");
  icon.className = className;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

export function createDialogCarousel({
  id, logo, label = "", title: titleText, meta, labels, groups,
  closeLabel, sectionsLabel, previousLabel: previousText, nextLabel: nextText, panelClass = ""
}) {
  if (!labels.length || labels.length !== groups.length) {
    throw new Error(`Invalid dialog content groups for ${id}.`);
  }
  const dialog = document.createElement("dialog");
  dialog.className = "app-dialog dialog-carousel";
  dialog.id = id;
  const dialogTitleId = `${dialog.id}-title`;
  dialog.setAttribute("aria-labelledby", dialogTitleId);

  const shell = document.createElement("div");
  shell.className = "app-dialog__shell dialog-carousel-shell";
  const header = document.createElement("header");
  header.className = "app-dialog__header dialog-brand-header";
  const heading = document.createElement("div");
  heading.className = "dialog-brand-heading";
  const title = document.createElement("h2");
  title.id = dialogTitleId;
  title.textContent = titleText;
  const metaLine = document.createElement("p");
  metaLine.className = "dialog-brand-meta";
  metaLine.textContent = meta;
  if (label) {
    const eyebrow = document.createElement("p");
    eyebrow.className = "dialog-brand-label";
    eyebrow.textContent = label;
    heading.append(eyebrow);
  }
  heading.append(title, metaLine);

  const close = document.createElement("button");
  close.className = "app-dialog__close dialog-carousel-close";
  close.type = "button";
  close.setAttribute("aria-label", closeLabel);
  close.append(createIcon("fa-solid fa-xmark"));
  if (logo) header.append(logo);
  header.append(heading, close);

  const tabs = document.createElement("div");
  tabs.className = "dialog-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", sectionsLabel);
  const content = document.createElement("div");
  content.className = "app-dialog__content dialog-carousel-content";

  const tabButtons = [];
  const slides = [];
  labels.forEach((label, slideIndex) => {
    const tab = document.createElement("button");
    tab.className = "dialog-tab";
    tab.type = "button";
    tab.id = `${dialog.id}-tab-${slideIndex + 1}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `${dialog.id}-panel-${slideIndex + 1}`);
    tab.textContent = label;

    const slide = document.createElement("section");
    slide.className = `dialog-panel ${panelClass}`.trim();
    slide.id = `${dialog.id}-panel-${slideIndex + 1}`;
    slide.setAttribute("role", "tabpanel");
    slide.setAttribute("aria-labelledby", tab.id);
    const rail = document.createElement("div");
    rail.className = "dialog-content-rail";
    groups[slideIndex].forEach((node) => rail.append(node));
    slide.append(rail);
    tabs.append(tab);
    content.append(slide);
    tabButtons.push(tab);
    slides.push(slide);
  });

  const footer = document.createElement("footer");
  footer.className = "dialog-controls";
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "dialog-step";
  const previousLabel = document.createElement("span");
  previousLabel.textContent = previousText;
  previous.append(createIcon("fa-solid fa-arrow-left"), previousLabel);
  const progress = document.createElement("span");
  progress.className = "dialog-progress";
  progress.setAttribute("aria-live", "polite");
  const next = document.createElement("button");
  next.type = "button";
  next.className = "dialog-step";
  const nextLabel = document.createElement("span");
  nextLabel.textContent = nextText;
  next.append(nextLabel, createIcon("fa-solid fa-arrow-right"));
  footer.append(previous, progress, next);
  shell.append(header, tabs, content, footer);
  dialog.append(shell);
  document.body.append(dialog);

  return { dialog, close, tabs: tabButtons, panels: slides, content, previous, next, progress };
}

export function initializeDialogCarousel(parts, trigger, {
  onOpen = () => {}, onChange = () => {}, onClose = () => {}, additionalTriggers = []
} = {}) {
  const { dialog, close } = parts;
  const navigation = initializeDialogNavigation({ ...parts, onChange });
  let previousOverflow = null;
  let closeHookCalled = false;
  let activeTrigger = trigger;
  const closeDialog = () => {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    closeHookCalled = true;
    onClose();
    closeAnimatedDialog(dialog);
  };
  const openDialog = (opener = trigger) => {
    if (dialog.open) return;
    activeTrigger = opener;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    activeTrigger.setAttribute("aria-expanded", "true");
    navigation.reset(Number.parseInt(opener.dataset?.caseStudyTab || "0", 10));
    dialog.showModal();
    onOpen();
    close.focus({ preventScroll: true });
  };
  for (const opener of [trigger, ...additionalTriggers]) {
    opener.setAttribute("aria-haspopup", "dialog");
    opener.setAttribute("aria-controls", dialog.id);
    opener.addEventListener("click", event => {
      if (opener.dataset?.caseStudyOpen) event.preventDefault();
      openDialog(opener);
    });
    if (opener.tagName !== "BUTTON") {
      opener.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat) openDialog(opener);
    });
    }
  }
  close.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeDialog();
  });
  // Native modal focus containment also includes the browser's video controls.
  dialog.addEventListener("close", () => {
    if (previousOverflow === null) return;
    if (!closeHookCalled) onClose();
    closeHookCalled = false;
    document.documentElement.style.overflow = previousOverflow;
    previousOverflow = null;
    activeTrigger.setAttribute("aria-expanded", "false");
    activeTrigger.focus({ preventScroll: true });
  });
  return { open: openDialog, close: closeDialog };
}
