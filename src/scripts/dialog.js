import { reducedMotion } from "./motion.js";

export function closeAnimatedDialog(dialog) {
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

export function trapDialogFocus(dialog, event) {
  if (event.key !== "Tab") return;

  const focusable = Array.from(
    dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
