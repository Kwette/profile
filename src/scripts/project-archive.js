import { closeAnimatedDialog, trapDialogFocus } from "./dialog.js";
import { reducedMotion } from "./motion.js";

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

function formatArchiveLink(link, name, isFrench) {
  const href = link.getAttribute("href");
  const isCode = href.includes("github.com");
  const isCapture = href.includes("behance.net");
  const label = isCode ? "Code" : isCapture ? (isFrench ? "Captures" : "Screenshots") : "Site";
  const icon = createElement("i", isCode ? "fab fa-github" : isCapture ? "fab fa-behance" : "fas fa-globe");

  icon.setAttribute("aria-hidden", "true");
  link.className = "archive-action";
  link.setAttribute("aria-label", `${label} · ${name}`);
  link.replaceChildren(icon, document.createTextNode(label));
  return link;
}

function toggleProjectArchive(button, isFrench) {
  const archive = document.getElementById(button.getAttribute("aria-controls"));
  const isOpening = button.getAttribute("aria-expanded") !== "true";
  const projects = Array.from(archive.querySelectorAll(".archive-project"));
  const action = button.querySelector(".project-archive-action");
  const animationId = String(Date.now());

  button.setAttribute("aria-expanded", String(isOpening));
  action.textContent = isOpening
    ? (isFrench ? "Masquer les 6 projets" : "Hide 6 projects")
    : (isFrench ? "Voir les 6 projets antérieurs" : "View 6 projects");
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

function initializeArchiveItem(item, index, isFrench) {
  const title = item.querySelector(".project-name");
  const panel = item.querySelector(".app-details");
  const stack = panel.querySelector(".purple-bg");
  const summary = item.querySelector(".shadow-box .card-left-side");
  const summaryLink = summary.querySelector("a");
  const titleNode = Array.from(title.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  const [type, projectName] = titleNode.textContent.split("|").map((part) => part.trim());
  const name = projectName || type;
  const metadata = summary.querySelector("h4").textContent.trim();
  const date = metadata.match(/\(([^)]+\d{4}[^)]*)\)/)?.[1];
  const technologies = stack ? stack.textContent.trim().replace(/\.$/, "").split(/,\s*/) : [];
  const logo = item.querySelector(".card-right-side img");

  if (logo) {
    logo.alt = "";
    logo.className = "archive-mini-logo";
  }

  const content = createElement("div", "archive-mini-content");
  const heading = createElement("h3", "archive-mini-title", name);
  content.append(heading, createElement("p", "archive-mini-meta", date ? `${type} · ${date}` : `${type} · ${metadata}`));
  if (item.classList.contains("archive-project")) {
    const primary = technologies.filter((tech) => /rails|react|vue|javascript|postgresql|html|css/i.test(tech));
    content.append(createElement("p", "archive-mini-stack", (primary.length ? primary : technologies).slice(0, 3).join(" · ")));
  }

  const actions = createElement("div", "archive-mini-actions");
  const links = createElement("div", "archive-dialog-links");
  if (summaryLink && !item.classList.contains("archive-project")) {
    links.append(formatArchiveLink(summaryLink, name, isFrench));
  }
  panel.querySelectorAll(".app-links a").forEach((link) => links.append(formatArchiveLink(link, name, isFrench)));
  panel.querySelectorAll(".app-links").forEach((group) => group.remove());
  if (stack) {
    stack.className = "archive-dialog-stack";
    stack.textContent = technologies.join(" · ");
  }

  // Preserve the original descriptions as DOM nodes inside the native modal.
  const hasDetail = Array.from(panel.querySelectorAll("p, ul, ol")).some((node) => node.textContent.trim());
  if (hasDetail) {
    const dialog = createElement("dialog", "app-dialog archive-dialog");
    dialog.id = `archive-dialog-${isFrench ? "fr" : "en"}-${index + 1}`;
    const dialogHeader = createElement("header", "app-dialog__header archive-dialog-header");
    const dialogTitle = createElement("h3", "archive-dialog-title", name);
    dialogTitle.id = `${dialog.id}-title`;
    dialog.setAttribute("aria-labelledby", dialogTitle.id);
    const dialogIntro = createElement("div", "archive-dialog-intro");
    dialogIntro.append(dialogTitle, createElement("p", "archive-dialog-meta", `${type} · ${metadata}`));
    const close = createElement("button", "app-dialog__close archive-dialog-close");
    close.type = "button";
    close.autofocus = true;
    close.setAttribute("aria-label", isFrench ? "Fermer" : "Close");
    const closeIcon = createElement("i", "fas fa-times");
    closeIcon.setAttribute("aria-hidden", "true");
    close.append(closeIcon);
    if (logo) dialogHeader.append(logo.cloneNode(true));
    dialogHeader.append(dialogIntro, close);
    panel.className = "app-dialog__content archive-dialog-body";
    dialog.append(dialogHeader, panel, links);
    document.body.append(dialog);

    const trigger = createElement("button", "archive-action", isFrench ? "Détails" : "Details");
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", dialog.id);
    trigger.setAttribute("aria-label", `${isFrench ? "Détails" : "Details"} · ${name}`);
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

export function initializeProjectArchive(isFrench) {
  document.querySelectorAll(".project-archive-toggle").forEach((button) => {
    button.addEventListener("click", () => toggleProjectArchive(button, isFrench));
  });

  document.querySelectorAll(".project-archive-items .archive-project, .project-archive-items .community-item").forEach((item, index) => {
    initializeArchiveItem(item, index, isFrench);
  });

  document.querySelectorAll(".project-archive-items.has-mini-cards").forEach((archive) => {
    const projects = Array.from(archive.querySelectorAll(".archive-project"));
    const heading = archive.querySelector(".community-heading");
    const contributions = Array.from(archive.querySelectorAll(".community-item"));
    archive.append(...projects, heading, ...contributions);
  });
}
