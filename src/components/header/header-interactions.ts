  function initHeader() {
    const header = document.querySelector(".sticky-header");
    if (header) {
      let lastScrollY = window.scrollY;
      let ticking = false;
      if (lastScrollY > 0) header.classList.add("scroll-up");
      const updateHeader = () => {
        const scrollY = Math.max(0, window.scrollY);
        if (scrollY === lastScrollY) {
          ticking = false;
          return;
        }
        if (scrollY === 0) {
          header.classList.remove("scroll-up", "scroll-down");
        } else if (lastScrollY > scrollY) {
          header.classList.remove("scroll-down");
          header.classList.add("scroll-up");
        } else if (lastScrollY < scrollY) {
          header.classList.remove("scroll-up");
          header.classList.add("scroll-down");
        }
        lastScrollY = scrollY;
        ticking = false;
      };
      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
          }
        },
        { passive: true },
      );
    }

    const toggler = document.querySelector(".nav-toggler");
    const navContainer = toggler ? toggler.closest("nav.hs-dropdown") : null;
    const navMenu = document.getElementById("nav-menu");
    if (toggler) {
      toggler.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = toggler.classList.toggle("open");
        if (navContainer) navContainer.classList.toggle("open", isOpen);
        if (navMenu) {
          navMenu.classList.toggle("open", isOpen);
          navMenu.classList.toggle("expanded", isOpen);
        }
        toggler.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    const dropdownToggles = document.querySelectorAll(".hs-dropdown-toggle:not(.nav-toggler)");
    dropdownToggles.forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        const parentDropdown = toggle.closest(
          "li.hs-dropdown, .language-switcher.hs-dropdown, .nav-dropdown-item.hs-dropdown",
        );
        event.preventDefault();
        event.stopPropagation();
        if (!parentDropdown) return;
        const isOpen = parentDropdown.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

        const parentContainer = parentDropdown.parentElement;
        if (parentContainer) {
          parentContainer.querySelectorAll(":scope > .hs-dropdown").forEach((sibling) => {
            if (sibling !== parentDropdown) {
              sibling.classList.remove("open");
              const siblingToggle = sibling.querySelector(".hs-dropdown-toggle");
              if (siblingToggle) siblingToggle.setAttribute("aria-expanded", "false");
            }
          });
        }
      });
    });

    const closeHeaderMenus = () => {
      document
        .querySelectorAll("li.hs-dropdown.open, nav.hs-dropdown.open, .language-switcher.hs-dropdown.open")
        .forEach((dropdown) => dropdown.classList.remove("open"));
      if (navMenu) navMenu.classList.remove("open", "expanded");
      if (toggler) {
        toggler.classList.remove("open");
        toggler.setAttribute("aria-expanded", "false");
      }
    };

    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && !target.closest(".header")) closeHeaderMenus();

      const tooltipEl = target ? target.closest("[data-header-tooltip]") : null;
      if (tooltipEl) {
        tooltipEl.setAttribute("data-tooltip-clicked", "true");
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeHeaderMenus();
    });

    document.addEventListener("mouseout", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const tooltipEl = target ? target.closest("[data-header-tooltip]") : null;
      const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (tooltipEl && (!relatedTarget || !tooltipEl.contains(relatedTarget))) {
        tooltipEl.removeAttribute("data-tooltip-clicked");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader);
  } else {
    initHeader();
  }

