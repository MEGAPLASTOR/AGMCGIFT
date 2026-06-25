export function scrollToSection(element, topGap = 0) {
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: Math.max(0, top - topGap),
    behavior: "smooth",
  });
}
