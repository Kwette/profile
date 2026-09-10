import { closeAnimatedDialog, trapDialogFocus } from "./dialog.js";
import { initializeExperienceDialog } from "./experience-dialog.js";
import { reducedMotion } from "./motion.js";
import { initializeTechnicalCarousel } from "./technical-carousel.js";

function toggleProjectArchive(button) {
  const archive = document.getElementById(button.getAttribute("aria-controls"));
  const isOpening = button.getAttribute("aria-expanded") !== "true";
  const projects = Array.from(archive.querySelectorAll(".archive-project"));
  const action = button.querySelector(".project-archive-action");
  const isFrench = document.documentElement.lang === "fr";
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

document.addEventListener("DOMContentLoaded", () => {
  const isFrench = document.documentElement.lang === "fr";

  document.querySelectorAll("[data-current-year]").forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-technical-carousel]").forEach(initializeTechnicalCarousel);
  document.querySelectorAll(".professional-experience .experience-item").forEach((item) => initializeExperienceDialog(item, isFrench));
  document.querySelectorAll(".project-archive-toggle").forEach((button) => {
    button.addEventListener("click", () => toggleProjectArchive(button));
  });

  document.querySelectorAll(".project-archive-items .archive-project, .project-archive-items .community-item").forEach((item, index) => {
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
    const makeElement = (tag, className, text) => {
      const element = document.createElement(tag);
      element.className = className;
      if (text) element.textContent = text;
      return element;
    };
    const formatLink = (link) => {
      const href = link.getAttribute("href");
      const isCode = href.includes("github.com");
      const isCapture = href.includes("behance.net");
      const label = isCode ? "Code" : isCapture ? (isFrench ? "Captures" : "Screenshots") : "Site";
      const icon = makeElement("i", isCode ? "fab fa-github" : isCapture ? "fab fa-behance" : "fas fa-globe");
      icon.setAttribute("aria-hidden", "true");
      link.className = "archive-action";
      link.setAttribute("aria-label", `${label} · ${name}`);
      link.replaceChildren(icon, document.createTextNode(label));
      return link;
    };
    const logo = item.querySelector(".card-right-side img");
    if (logo) {
      logo.alt = "";
      logo.className = "archive-mini-logo";
    }
    const content = makeElement("div", "archive-mini-content");
    const heading = makeElement("h3", "archive-mini-title", name);
    content.append(heading, makeElement("p", "archive-mini-meta", date ? `${type} · ${date}` : `${type} · ${metadata}`));
    if (item.classList.contains("archive-project")) {
      const primary = technologies.filter((tech) => /rails|react|vue|javascript|postgresql|html|css/i.test(tech));
      content.append(makeElement("p", "archive-mini-stack", (primary.length ? primary : technologies).slice(0, 3).join(" · ")));
    }
    const actions = makeElement("div", "archive-mini-actions");
    const links = makeElement("div", "archive-dialog-links");
    if (summaryLink && !item.classList.contains("archive-project")) {
      links.append(formatLink(summaryLink));
    }
    panel.querySelectorAll(".app-links a").forEach((link) => links.append(formatLink(link)));
    panel.querySelectorAll(".app-links").forEach((group) => group.remove());
    if (stack) {
      stack.className = "archive-dialog-stack";
      stack.textContent = technologies.join(" · ");
    }

    // Preserve the original descriptions as DOM nodes inside the native modal.
    const hasDetail = Array.from(panel.querySelectorAll("p, ul, ol")).some((node) => node.textContent.trim());
    if (hasDetail) {
      const dialog = makeElement("dialog", "app-dialog archive-dialog");
      dialog.id = `archive-dialog-${isFrench ? "fr" : "en"}-${index + 1}`;
      const dialogHeader = makeElement("header", "app-dialog__header archive-dialog-header");
      const dialogTitle = makeElement("h3", "archive-dialog-title", name);
      dialogTitle.id = `${dialog.id}-title`;
      dialog.setAttribute("aria-labelledby", dialogTitle.id);
      const dialogIntro = makeElement("div", "archive-dialog-intro");
      dialogIntro.append(dialogTitle, makeElement("p", "archive-dialog-meta", `${type} · ${metadata}`));
      const close = makeElement("button", "app-dialog__close archive-dialog-close");
      close.type = "button";
      close.autofocus = true;
      close.setAttribute("aria-label", isFrench ? "Fermer" : "Close");
      const closeIcon = makeElement("i", "fas fa-times");
      closeIcon.setAttribute("aria-hidden", "true");
      close.append(closeIcon);
      if (logo) dialogHeader.append(logo.cloneNode(true));
      dialogHeader.append(dialogIntro, close);
      panel.className = "app-dialog__content archive-dialog-body";
      dialog.append(dialogHeader, panel, links);
      document.body.append(dialog);

      const trigger = makeElement("button", "archive-action", isFrench ? "Détails" : "Details");
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
      const closeDialog = () => {
        closeAnimatedDialog(dialog);
      };
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
      dialog.addEventListener("keydown", (event) => {
        trapDialogFocus(dialog, event);
      });
      actions.append(trigger);
    } else {
      // Entries containing only metadata and links do not need an empty dialog.
      content.append(makeElement("p", "archive-mini-meta", metadata));
      if (stack) content.append(stack);
      actions.append(...links.children);
    }
    item.replaceChildren();
    if (logo) item.append(logo);
    item.append(content, actions);
    item.classList.add("archive-mini");
    item.parentElement.classList.add("has-mini-cards");
  });

  document.querySelectorAll(".project-archive-items.has-mini-cards").forEach((archive) => {
    const projects = Array.from(archive.querySelectorAll(".archive-project"));
    const heading = archive.querySelector(".community-heading");
    const contributions = Array.from(archive.querySelectorAll(".community-item"));
    archive.append(...projects, heading, ...contributions);
  });

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
        .then(() => card.classList.toggle("is-expanded", isOpening))
        .catch(() => {})
        .finally(() => {
          card.style.removeProperty("overflow");
          button.disabled = false;
        });
    });
  });

  const navToggle = document.querySelector(".site-nav-toggle");
  const navLinks = document.querySelector(".site-nav-links");
  if (navToggle && navLinks) {
    const closeMenu = () => {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", isFrench ? "Ouvrir le menu" : "Open menu");
      navToggle.querySelector("i").className = "fa-solid fa-bars";
      navLinks.classList.remove("is-open");
    };

    navToggle.addEventListener("click", () => {
      const isOpening = navToggle.getAttribute("aria-expanded") !== "true";
      navToggle.setAttribute("aria-expanded", String(isOpening));
      navToggle.setAttribute("aria-label", isOpening ? (isFrench ? "Fermer le menu" : "Close menu") : (isFrench ? "Ouvrir le menu" : "Open menu"));
      navToggle.querySelector("i").className = isOpening ? "fa-solid fa-xmark" : "fa-solid fa-bars";
      navLinks.classList.toggle("is-open", isOpening);
    });
    navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  const observedNavLinks = Array.from(document.querySelectorAll(".site-nav-links a[href^='#']"));
  const observedSections = observedNavLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window && observedSections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      const activeEntry = entries.find((entry) => entry.isIntersecting);
      if (!activeEntry) return;
      observedNavLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${activeEntry.target.id}`;
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
    observedSections.forEach((section) => navObserver.observe(section));
  }

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const revealSelector = [
      ".container > .card:not(.hero-card)",
      ".personal-projects-list > .personal-project-card",
      ".professional-experience > .experience-item"
    ].join(",");
    const revealItems = Array.from(document.querySelectorAll(revealSelector));
    revealItems.forEach((item) => {
      const staggerSelector = item.matches(".personal-project-card") ? ".personal-project-card" : ".experience-item";
      const shouldStagger = item.matches(".personal-project-card, .experience-item");
      const siblings = shouldStagger ? Array.from(item.parentElement.children).filter((sibling) => sibling.matches(staggerSelector)) : [];
      const delay = shouldStagger ? siblings.indexOf(item) * 60 : 0;
      item.style.setProperty("--reveal-delay", `${delay}ms`);
      item.classList.add("reveal-item");
    });
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio >= 0.16) {
          entry.target.classList.add("is-revealed");
        } else if (entry.intersectionRatio <= 0.08) {
          entry.target.classList.remove("is-revealed");
        }
      });
    }, { rootMargin: "0px 0px -5%", threshold: [0.08, 0.16] });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    const updateBackToTop = () => {
      const isVisible = window.scrollY >= 700;
      backToTop.classList.toggle("is-visible", isVisible);
      backToTop.setAttribute("aria-hidden", String(!isVisible));
      backToTop.tabIndex = isVisible ? 0 : -1;
    };
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" }));
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
  }

  const mobileResume = window.matchMedia("(max-width: 768px)");
  const syncResumeAvailability = () => {
    document.querySelectorAll(".resume-toggle").forEach((button) => {
      const card = button.closest(".resume-card");
      const label = button.querySelector("[data-resume-label]");
      if (mobileResume.matches) {
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
});
