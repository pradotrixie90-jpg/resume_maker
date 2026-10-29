// Resume Maker: live preview, repeatable sections, autosave.
(function () {
  const STORAGE_KEY = "resume-maker-data";
  const COLORS = ["#1f6f78", "#2b4c9b", "#7a3b8f", "#b5472f", "#2f7d4f", "#333b45"];
  const BLANK = { name: "", title: "", summary: "", email: "", phone: "", address: "", skills: "", accent: COLORS[0], education: [], experience: [] };

  let data = load();

  const $ = (id) => document.getElementById(id);
  const form = $("resume-form");
  const resume = $("resume");

  function load() {
    try { return Object.assign({}, BLANK, JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch (e) { return Object.assign({}, BLANK); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  }

  /* ---- tiny helper to build elements safely (no innerHTML with user text) ---- */
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  /* ---- repeatable sections ---- */
  function addEntry(type, values) {
    const tpl = $(type + "-tpl").content.cloneNode(true);
    const entry = tpl.querySelector(".entry");
    const obj = values || {};
    if (!values) data[type].push(obj);
    entry._obj = obj;
    entry.querySelectorAll("[data-key]").forEach((input) => {
      input.value = obj[input.dataset.key] || "";
      input.addEventListener("input", () => { obj[input.dataset.key] = input.value; update(); });
    });
    entry.querySelector("[data-remove]").addEventListener("click", () => {
      data[type] = data[type].filter((o) => o !== obj);
      entry.remove();
      update();
    });
    $(type + "-list").appendChild(entry);
    if (!values) update();
  }

  /* ---- build the resume ---- */
  function section(title) {
    const wrap = document.createDocumentFragment();
    wrap.appendChild(el("h3", "", title));
    return wrap;
  }
  function item(left, right, sub, extra) {
    const box = el("div", "item");
    const head = el("div", "item-head");
    head.append(el("span", "", left), el("span", "", right));
    box.appendChild(head);
    if (sub) box.appendChild(el("p", "", sub));
    if (extra) box.appendChild(el("p", "", extra));
    return box;
  }

  function render() {
    resume.style.setProperty("--accent", data.accent);
    resume.replaceChildren();

    const hasAnything = data.name || data.title || data.summary || data.email || data.phone || data.address ||
      data.skills || data.education.length || data.experience.length;
    if (!hasAnything) {
      resume.appendChild(el("p", "empty", "Start typing on the left. Your resume appears here as you type."));
      return;
    }

    resume.appendChild(el("h2", "", data.name || "Your name"));
    if (data.title) resume.appendChild(el("p", "role", data.title));

    const contact = el("ul", "contact");
    [data.email, data.phone, data.address].filter(Boolean).forEach((c) => contact.appendChild(el("li", "", c)));
    if (contact.children.length) resume.appendChild(contact);

    if (data.summary) {
      resume.appendChild(section("Summary"));
      resume.appendChild(el("p", "", data.summary));
    }

    const edu = data.education.filter((e) => e.school || e.degree || e.years);
    if (edu.length) {
      resume.appendChild(section("Education"));
      edu.forEach((e) => resume.appendChild(item(e.school || "", e.years || "", e.degree)));
    }

    const exp = data.experience.filter((e) => e.role || e.company || e.years || e.details);
    if (exp.length) {
      resume.appendChild(section("Experience"));
      exp.forEach((e) => resume.appendChild(item(e.role || "", e.years || "", e.company, e.details)));
    }

    const skills = data.skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skills.length) {
      resume.appendChild(section("Skills"));
      const list = el("ul", "tags");
      skills.forEach((s) => list.appendChild(el("li", "", s)));
      resume.appendChild(list);
    }
  }

  function update() { render(); save(); }

  /* ---- simple fields ---- */
  ["name", "title", "summary", "email", "phone", "address", "skills"].forEach((key) => {
    const input = $(key);
    input.value = data[key];
    input.addEventListener("input", () => { data[key] = input.value; update(); });
  });

  /* ---- color swatches ---- */
  function drawSwatches() {
    const box = $("swatches");
    box.replaceChildren();
    COLORS.forEach((color) => {
      const b = el("button", "swatch");
      b.type = "button";
      b.style.background = color;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-label", "Color " + color);
      b.setAttribute("aria-checked", String(color === data.accent));
      b.addEventListener("click", () => { data.accent = color; drawSwatches(); update(); });
      box.appendChild(b);
    });
  }

  /* ---- buttons ---- */
  document.querySelectorAll("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => addEntry(btn.dataset.add)));
  $("print-btn").addEventListener("click", () => window.print());
  $("clear-btn").addEventListener("click", () => {
    if (!confirm("Clear everything you typed? This cannot be undone.")) return;
    data = Object.assign({}, BLANK, { education: [], experience: [] });
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    form.reset();
    $("education-list").replaceChildren();
    $("experience-list").replaceChildren();
    drawSwatches();
    render();
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  /* ---- start ---- */
  data.education.forEach((e) => addEntry("education", e));
  data.experience.forEach((e) => addEntry("experience", e));
  if (!data.education.length) addEntry("education");
  if (!data.experience.length) addEntry("experience");
  drawSwatches();
  render();
})();
