document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const themeToggle = document.getElementById("themeToggle");
  const backToTop = document.getElementById("backToTop");
  const searchInput = document.getElementById("ruleSearch");
  const rulesContent = document.getElementById("rulesContent");
  const toc = document.getElementById("toc");

  // Mobile menu
  menuToggle?.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });

  // Dark mode with saved preference
  const savedTheme = localStorage.getItem("monopolyTheme");
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    themeToggle.textContent = "☀️ Light";
  }

  themeToggle?.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const dark = body.classList.contains("dark-mode");
    themeToggle.textContent = dark ? "☀️ Light" : "🌙 Dark";
    localStorage.setItem("monopolyTheme", dark ? "dark" : "light");
  });

  // Create readable section cards from each h2 section
  const headings = Array.from(rulesContent.querySelectorAll("h2"));
  headings.forEach((heading) => {
    const id = createSlug(heading.textContent);
    heading.id = id;

    const wrapper = document.createElement("section");
    wrapper.className = "rule-section";
    wrapper.dataset.title = heading.textContent.toLowerCase();

    heading.parentNode.insertBefore(wrapper, heading);
    wrapper.appendChild(heading);

    let next = wrapper.nextSibling;
    while (next && !(next.nodeType === 1 && next.tagName.toLowerCase() === "h2")) {
      const current = next;
      next = next.nextSibling;
      wrapper.appendChild(current);
    }
  });

  // Build table of contents
  document.querySelectorAll("#rulesContent h2").forEach((heading) => {
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    toc.appendChild(link);
  });

  // Highlight active TOC link while scrolling
  const tocLinks = Array.from(toc.querySelectorAll("a"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tocLinks.forEach((link) => link.classList.remove("active"));
          const activeLink = toc.querySelector(`a[href="#${entry.target.id}"]`);
          activeLink?.classList.add("active");
        }
      });
    },
    { rootMargin: "-25% 0px -65% 0px" }
  );

  document.querySelectorAll("#rulesContent h2").forEach((heading) => observer.observe(heading));

  // Back to top button
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("show", window.scrollY > 500);
  });

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Search sections and highlight matching text
  const sections = Array.from(document.querySelectorAll(".rule-section"));
  const originalHTML = new Map(sections.map((section) => [section, section.innerHTML]));
  const noResults = document.createElement("div");
  noResults.className = "no-results";
  noResults.textContent = "No matching Monopoly rule found. Try another word like rent, jail, bank, house, or mortgage.";

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    let matches = 0;

    noResults.remove();

    sections.forEach((section) => {
      section.innerHTML = originalHTML.get(section);
      const text = section.textContent.toLowerCase();
      const isMatch = !query || text.includes(query);
      section.classList.toggle("hidden-by-search", !isMatch);

      if (isMatch) {
        matches++;
        if (query) highlightText(section, query);
      }
    });

    if (query && matches === 0) {
      rulesContent.prepend(noResults);
    }
  });
});

function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function highlightText(root, query) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.toLowerCase().includes(query)) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "MARK"].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const text = node.nodeValue;
    const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi");
    const span = document.createElement("span");
    span.innerHTML = text.replace(pattern, "<mark>$1</mark>");
    node.parentNode.replaceChild(span, node);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
