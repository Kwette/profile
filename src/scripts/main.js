const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function closeAnimatedDialog(dialog) {
  if (!dialog.open || dialog.classList.contains("is-closing")) return;
  if (reducedMotion.matches) {
    dialog.close();
    return;
  }

  dialog.classList.add("is-closing");
  const animation = dialog.animate(
    [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.985)" }],
    { duration: 180, easing: "ease-in" }
  );
  animation.finished.catch(() => {}).finally(() => {
    if (dialog.open) dialog.close();
    dialog.classList.remove("is-closing");
  });
}

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

function initializeTechnicalCarousel(carousel) {
  const viewport = carousel.querySelector(".technical-carousel-viewport");
  const track = carousel.querySelector(".technical-focus-grid");
  const slides = Array.from(carousel.querySelectorAll(".technical-focus-item"));
  const controls = carousel.querySelector(".technical-carousel-controls");
  const previousButton = carousel.querySelector("[data-carousel-previous]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const announcement = carousel.querySelector("[data-carousel-announcement]");
  const indicatorsContainer = carousel.querySelector("[data-carousel-indicators]");
  const topicLabel = carousel.dataset.topicLabel;
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
    const position = `${topicLabel} ${index + 1} ${document.documentElement.lang === "fr" ? "sur" : "of"} ${slides.length}`;

    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", document.documentElement.lang === "fr" ? "sujet" : "topic");
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
      announcement.textContent = `${topicLabel} ${currentIndex + 1} ${document.documentElement.lang === "fr" ? "sur" : "of"} ${slides.length}`;
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

function initializeExperienceDialog(item, index, isFrench) {
  const trigger = item.querySelector(".experience-summary");
  const panel = item.querySelector(".app-details");
  if (!trigger || !panel) return;

  const isDrime = panel.id.includes("drime");
  const role = trigger.querySelector(".experience-role")?.textContent.trim() || "";
  const meta = trigger.querySelector(".experience-meta")?.textContent.trim() || "";
  const logo = trigger.querySelector(".experience-logo")?.cloneNode(true);
  const chevron = trigger.querySelector(".experience-chevron i");
  const labels = isFrench
    ? (isDrime
        ? ["Vue d’ensemble", "Stack technique", "Player DRIME", "Éditeur vidéo", "Résultats"]
        : ["Vue d’ensemble", "Stack technique", "Parcours utilisateur", "Contributions", "Résultats"])
    : (isDrime
        ? ["Overview", "Technical stack", "DRIME Player", "Video editor", "Results"]
        : ["Overview", "Technical stack", "User journeys", "Contributions", "Results"]);

  const groups = labels.map(() => []);
  let activeGroup = 0;
  let detailGroup = 2;
  Array.from(panel.children).forEach((node) => {
    if (node.classList.contains("experience-overview")) activeGroup = 0;
    else if (node.classList.contains("experience-stack")) activeGroup = 1;
    else if (node.classList.contains("experience-results")) activeGroup = labels.length - 1;
    else if (node.classList.contains("experience-detail-section")) activeGroup = Math.min(detailGroup++, labels.length - 2);
    groups[activeGroup].push(node);
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
  close.setAttribute("aria-label", isFrench ? "Fermer l’expérience" : "Close experience");
  close.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
  if (logo) header.append(logo);
  header.append(heading, close);

  const tabs = document.createElement("div");
  tabs.className = "experience-dialog-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", isFrench ? "Sections de l’expérience" : "Experience sections");
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
  previous.innerHTML = `<i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>${isFrench ? "Précédent" : "Previous"}</span>`;
  const progress = document.createElement("span");
  progress.className = "experience-dialog-progress";
  progress.setAttribute("aria-live", "polite");
  const next = document.createElement("button");
  next.type = "button";
  next.className = "experience-dialog-step";
  next.innerHTML = `<span>${isFrench ? "Suivant" : "Next"}</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
  footer.append(previous, progress, next);
  shell.append(header, tabs, content, footer);
  dialog.append(shell);
  document.body.append(dialog);

  panel.remove();
  trigger.removeAttribute("onclick");
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
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  update(0);
}

document.addEventListener("DOMContentLoaded", () => {
  const isFrench = document.documentElement.lang === "fr";

  document.querySelectorAll("[data-current-year]").forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-technical-carousel]").forEach(initializeTechnicalCarousel);
  document.querySelectorAll(".professional-experience .experience-item").forEach((item, index) => initializeExperienceDialog(item, index, isFrench));
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
        if (event.key !== "Tab") return;
        const focusable = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
