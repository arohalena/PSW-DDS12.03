import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getVisibleFocusables(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null && !el.hasAttribute("aria-hidden")
  );
}

export function useModalShortcuts({ isOpen = true, onClose, onSubmit } = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement;

    // Auto-focus inicial
    const focusables = getVisibleFocusables(container);
    const preferred = container?.querySelector("[autofocus]");
    const target = preferred || focusables[0];

    if (target) {
      requestAnimationFrame(() => target.focus());
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && onClose) {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        if (onSubmit) {
          event.preventDefault();
          onSubmit();
        }
        return;
      }

      if (event.key === "Tab" && container) {
        const items = getVisibleFocusables(container);
        if (items.length === 0) return;

        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;

        // Si el foco no está dentro del modal devolvérselo
        if (!container.contains(active)) {
          event.preventDefault();
          first.focus();
          return;
        }

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose, onSubmit]);

  return containerRef;
}