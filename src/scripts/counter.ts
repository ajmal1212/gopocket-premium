/**
 * Authentic Multi-Roll Slot-Machine Ribbon Odometer
 * Rolls through dozens of numbers (multiple 0-9 full spins) with cubic-bezier deceleration
 */

export function createOdometerDigit(targetDigit: number, digitIndex: number): HTMLElement {
  const digitSpan = document.createElement("span");
  digitSpan.className = "odometer-digit";

  const spacer = document.createElement("span");
  spacer.className = "odometer-digit-spacer";
  spacer.textContent = "8";

  const inner = document.createElement("span");
  inner.className = "odometer-digit-inner";

  const ribbon = document.createElement("span");
  ribbon.className = "odometer-ribbon";

  const ribbonInner = document.createElement("span");
  ribbonInner.className = "odometer-ribbon-inner";
  ribbonInner.style.display = "block";

  // Stagger transition duration based on digit column position
  const duration = 1.2 + digitIndex * 0.25;
  ribbonInner.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.8, 0.32, 1)`;
  ribbonInner.style.willChange = "transform";

  // Build multi-cycle digit stack (3 to 5 full 0-9 rotations = 30-50 digits)
  const cycles = 3 + digitIndex;
  const stack: number[] = [];

  for (let c = 0; c < cycles; c++) {
    for (let d = 0; d <= 9; d++) {
      stack.push(d);
    }
  }
  stack.push(targetDigit);

  const totalItems = stack.length;
  const targetIndex = stack.length - 1;

  for (let i = 0; i < totalItems; i++) {
    const val = document.createElement("span");
    val.className = "odometer-value";
    val.textContent = String(stack[i]);
    ribbonInner.appendChild(val);
  }

  ribbon.appendChild(ribbonInner);
  inner.appendChild(ribbon);
  digitSpan.appendChild(spacer);
  digitSpan.appendChild(inner);

  // Initial state: Start at top (0%)
  ribbonInner.style.transform = "translateY(0%)";

  // Trigger hardware-accelerated multi-roll spin
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const percentage = (targetIndex / totalItems) * 100;
      ribbonInner.style.transform = `translateY(-${percentage}%)`;
    });
  });

  return digitSpan;
}

export function animateNumber(element: HTMLElement, target: number) {
  const isFloat = target % 1 !== 0;
  const formattedStr = isFloat ? target.toFixed(1) : Math.round(target).toLocaleString("en-US");

  element.classList.add("odometer", "odometer-auto-theme");
  element.innerHTML = "";

  const inside = document.createElement("div");
  inside.className = "odometer-inside";
  element.appendChild(inside);

  const digitsCount = formattedStr.replace(/\D/g, "").length;
  let digitCounter = 0;

  for (let i = 0; i < formattedStr.length; i++) {
    const char = formattedStr[i];
    if (/\d/.test(char)) {
      const digitNum = parseInt(char, 10);
      const posFromRight = digitsCount - 1 - digitCounter;
      digitCounter++;
      inside.appendChild(createOdometerDigit(digitNum, posFromRight));
    } else {
      const mark = document.createElement("span");
      mark.className = char === "." ? "odometer-radix-mark" : "odometer-formatting-mark";
      mark.textContent = char;
      inside.appendChild(mark);
    }
  }
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
