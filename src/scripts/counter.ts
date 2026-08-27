/**
 * Smooth Animated Number Counter for Pricing & Stats
 */

export function animateNumber(element: HTMLElement, target: number, duration = 1000) {
  const startTime = performance.now();
  const isFloat = target % 1 !== 0;

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = target * easeProgress;

    element.textContent = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString("en-IN");

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = isFloat ? target.toFixed(1) : target.toLocaleString("en-IN");
    }
  }

  requestAnimationFrame(update);
}

export function initAnimatedNumbers() {
  const elements = document.querySelectorAll<HTMLElement>("[data-count]");
  if (elements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const countAttr = el.getAttribute("data-count");
          if (countAttr && !el.dataset.animated) {
            el.dataset.animated = "true";
            const target = parseFloat(countAttr);
            if (!isNaN(target)) {
              animateNumber(el, target);
            }
          }
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => {
    observer.observe(el);
  });
}
