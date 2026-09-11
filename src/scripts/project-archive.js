import { closeAnimatedDialog, trapDialogFocus } from "./dialog.js";
import { reducedMotion } from "./motion.js";

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

function formatArchiveLink(link, name, labels) {
  const kind = link.dataset.archiveLinkKind || "site";
  const iconClasses = {
    code: "fab fa-github",
    captures: "fab fa-behance",
    site: "fas fa-globe"
  };
  const label = labels[kind] || labels.site;
  const icon = createElement("i", iconClasses[kind] || iconClasses.site);

  icon.setAttribute("aria-hidden", "true");
  link.className = "archive-action";
  link.setAttribute("aria-label", `${label} · ${name}`);
  link.replaceChildren(icon, document.createTextNode(label));
  return link;
}

function toggleProjectArchive(button) {
  const archive = document.getElementById(button.getAttribute("aria-controls"));
  const isOpening = button.getAttribute("aria-expanded") !== "true";
  const projects = Array.from(archive.querySelectorAll(".archive-project"));
  const action = button.querySelector(".project-archive-action");
  const animationId = String(Date.now());

  button.setAttribute("aria-expanded", String(isOpening));
  action.textContent = isOpening ? button.dataset.closeLabel : button.dataset.openLabel;
  archive.dataset.animationId = animationId;
  projects.forEach((project) => {
    project.getAnimations().forEach((animation) => animation.cancel());
  });

  if (reducedMotion.matches) {
    archive.classList.toggle("is-open", isOpening);
    return;
  }

  if (isOpening) archive.classList.add("is-open");

  const animations = projects.map((project, index) =>
    project.animate(
      isOpening
        ? [
            { opacity: 0, transform: "translateY(-8px)" },
            { opacity: 1, transform: "translateY(0)" }
          ]
        : [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-8px)" }
          ],
      {
        duration: isOpening ? 260 : 200,
        delay: isOpening ? index * 25 : 0,
        easing: "ease-out"
      }
    )
  );

  if (!isOpening) {
    Promise.all(animations.map((animation) => animation.finished.catch(() => {}))).then(() => {
      if (archive.dataset.animationId === animationId) archive.classList.remove("is-open");
    });
  }
}

function initializeArchiveItem(item, index, archive) {
  const panel = item.querySelector(".app-details");
  const stack = panel.querySelector(".purple-bg");
  const summary = item.querySelector(".shadow-box .card-left-side");
  const summaryLink = summary.querySelector("a");
  const { projectType: type, projectName: name, projectMetadata: metadata, projectDate: date } = item.dataset;
  const displayMetadata = date ? `${metadata} (${date})` : metadata;
  const technologies = item.dataset.projectStack.replace(/\.$/, "").split(/,\s*/);
  const logo = item.querySelector(".card-right-side img");
  const labels = {
    code: archive.dataset.codeLabel,
    captures: archive.dataset.capturesLabel,
    site: archive.dataset.siteLabel
  };

  if (logo) {
    logo.alt = "";
    logo.className = "archive-mini-logo";
  }

  const content = createElement("div", "archive-mini-content");
  const heading = createElement("h3", "archive-mini-title", name);
  content.append(heading, createElement("p", "archive-mini-meta", date ? `${type} · ${date}` : `${type} · ${metadata}`));
  if (item.classList.contains("archive-project")) {
    content.append(createElement("p", "archive-mini-stack", item.dataset.projectSummaryStack));
  }

  const actions = createElement("div", "archive-mini-actions");
  const links = createElement("div", "archive-dialog-links");
  if (summaryLink && !item.classList.contains("archive-project")) {
    links.append(formatArchiveLink(summaryLink, name, labels));
  }
  panel.querySelectorAll(".app-links a").forEach((link) => links.append(formatArchiveLink(link, name, labels)));
  panel.querySelectorAll(".app-links").forEach((group) => group.remove());
  if (stack) {
    stack.className = "archive-dialog-stack";
    stack.textContent = technologies.join(" · ");
  }

  // Preserve the original descriptions as DOM nodes inside the native modal.
  const hasDetail = Array.from(panel.querySelectorAll("p, ul, ol")).some((node) => node.textContent.trim());
  if (hasDetail) {
    const dialog = createElement("dialog", "app-dialog archive-dialog");
    dialog.id = `archive-dialog-${archive.id}-${index + 1}`;
    const dialogHeader = createElement("header", "app-dialog__header archive-dialog-header");
    const dialogTitle = createElement("h3", "archive-dialog-title", name);
    dialogTitle.id = `${dialog.id}-title`;
    dialog.setAttribute("aria-labelledby", dialogTitle.id);
    const dialogIntro = createElement("div", "archive-dialog-intro");
    dialogIntro.append(dialogTitle, createElement("p", "archive-dialog-meta", `${type} · ${displayMetadata}`));
    const close = createElement("button", "app-dialog__close archive-dialog-close");
    close.type = "button";
    close.autofocus = true;
    close.setAttribute("aria-label", archive.dataset.dialogCloseLabel);
    const closeIcon = createElement("i", "fas fa-times");
    closeIcon.setAttribute("aria-hidden", "true");
    close.append(closeIcon);
    if (logo) dialogHeader.append(logo.cloneNode(true));
    dialogHeader.append(dialogIntro, close);
    panel.className = "app-dialog__content archive-dialog-body";
    dialog.append(dialogHeader, panel, links);
    document.body.append(dialog);

    const trigger = createElement("button", "archive-action", archive.dataset.detailsLabel);
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", dialog.id);
    trigger.setAttribute("aria-label", `${archive.dataset.detailsLabel} · ${name}`);
    let previousOverflow = null;
    const restorePage = () => {
      if (previousOverflow === null) return;
      document.documentElement.style.overflow = previousOverflow;
      previousOverflow = null;
      trigger.focus({ preventScroll: true });
    };
    const closeDialog = () => closeAnimatedDialog(dialog);

    trigger.addEventListener("click", () => {
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      dialog.showModal();
      dialog.scrollTop = 0;
      close.focus({ preventScroll: true });
    });
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });
    dialog.addEventListener("close", restorePage);
    dialog.addEventListener("keydown", (event) => trapDialogFocus(dialog, event));
    actions.append(trigger);
  } else {
    // Entries containing only metadata and links do not need an empty dialog.
    content.append(createElement("p", "archive-mini-meta", metadata));
    if (stack) content.append(stack);
    actions.append(...links.children);
  }

  item.replaceChildren();
  if (logo) item.append(logo);
  item.append(content, actions);
  item.classList.add("archive-mini");
  item.parentElement.classList.add("has-mini-cards");
}

export function initializeProjectArchive() {
  document.querySelectorAll(".project-archive-toggle").forEach((button) => {
    button.addEventListener("click", () => toggleProjectArchive(button));
  });

  document.querySelectorAll(".project-archive-items").forEach((archive) => {
    archive.querySelectorAll(".archive-project, .community-item").forEach((item, index) => {
      initializeArchiveItem(item, index, archive);
    });
  });

  document.querySelectorAll(".project-archive-items.has-mini-cards").forEach((archive) => {
    const projects = Array.from(archive.querySelectorAll(".archive-project"));
    const heading = archive.querySelector(".community-heading");
    const contributions = Array.from(archive.querySelectorAll(".community-item"));
    archive.append(...projects, heading, ...contributions);
  });
}
