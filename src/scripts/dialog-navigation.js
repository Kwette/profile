export function initializeDialogNavigation({ dialog, tabs, panels, content, previous, next, progress, onChange = () => {} }) {
  if (!tabs.length || tabs.length !== panels.length) {
    throw new Error(`Invalid dialog navigation for ${dialog.id}.`);
  }
  let currentIndex = 0;
  const update = (index, focusTab = false) => {
    const oldIndex = currentIndex;
    currentIndex = Math.max(0, Math.min(index, panels.length - 1));
    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === currentIndex;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
      tabs[panelIndex].setAttribute("aria-selected", String(active));
      tabs[panelIndex].tabIndex = active ? 0 : -1;
    });
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === panels.length - 1;
    progress.textContent = `${currentIndex + 1} / ${panels.length}`;
    content.scrollTop = 0;
    panels[currentIndex].scrollTop = 0;
    if (dialog.open) tabs[currentIndex].scrollIntoView({ block: "nearest", inline: "nearest" });
    if (focusTab) tabs[currentIndex].focus();
    if (oldIndex !== currentIndex) onChange(currentIndex, oldIndex);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => update(index));
    tab.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      update(currentIndex + (event.key === "ArrowRight" ? 1 : -1), true);
    });
  });
  previous.addEventListener("click", () => update(currentIndex - 1));
  next.addEventListener("click", () => update(currentIndex + 1));
  dialog.addEventListener("keydown", event => {
    if (event.target.closest("video, input, textarea, select, [contenteditable]")) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    update(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
  });
  update(0);
  return { reset: () => update(0) };
}
