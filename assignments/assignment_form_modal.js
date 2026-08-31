/**
 * assignment_form_modal.js
 *
 * Opens a single modal with all form fields for creating an assignment.
 * Replaces sequential tp.system.prompt() + tp.system.suggester() calls.
 *
 * @param {object} tp - Templater instance
 * @returns {Promise<object|null>} - Form data with all assignment fields, or null if canceled
 */
module.exports = async (tp, context = {}) => {
  // Centralized assignment type catalog — single source of truth (Phase 1)
  // `practico` is canonical for "Trabajo Práctico"; aliases are read-only for scan compat.
  let _at = tp.user.assignment_types;
  if (typeof _at === 'function') _at = _at();
  if (!_at || !_at.typeDisplayNames) {
    try { _at = require('./assignment_types.js'); if (typeof _at === 'function') _at = _at(); } catch(e) {}
  }
  const { typeDisplayNames, typeOptions, canonicalTypes, aliasMap, codeTypes, typeAliases, getDisplayName, resolveType } = _at;

  // Pure domain helpers — 1:1 title/filename/scaffold logic (Phase 2)
  let _domain = tp.user.assignment_domain;
  if (typeof _domain === 'function') _domain = _domain();
  if (!_domain || !_domain.buildTitle) {
    try { _domain = require('./assignment_domain.js'); if (typeof _domain === 'function') _domain = _domain(); } catch(e) {}
  }
  const extensionMap = {
    "word-document": ".docx",
    PDF: ".pdf",
    "source-code": ".cpp",
    presentation: ".pptx",
    video: ".mp4",
    handwritten: "",
  };

  const fieldGroups = [
    {
      title: "Actividad",
      fields: [
        {
          key: "type",
          label: "Tipo",
          type: "select",
          options: typeOptions,
          default: "practico",
        },
        { key: "topic", label: "Tema", type: "text", default: "Introduccion" },
        {
          key: "unit",
          label: "Unidad",
          type: "text",
          inputType: "number",
          default: "01",
        },
      ],
    },
    {
      title: "Fechas",
      fields: [
        {
          key: "date",
          label: "Fecha de asignación",
          type: "text",
          inputType: "date",
          default: tp.date.now("YYYY-MM-DD"),
        },
        {
          key: "due_date",
          label: "Fecha de entrega",
          type: "text",
          inputType: "date",
          default: tp.date.now("YYYY-MM-DD", 7),
        },
      ],
    },
    {
      title: "Atributos",
      fields: [
        {
          key: "difficulty",
          label: "Dificultad",
          type: "select",
          options: {
            "very-easy": "Muy Facil",
            easy: "Facil",
            medium: "Media",
            hard: "Dificil",
            "very-hard": "Muy Dificil",
          },
          default: "medium",
        },
        {
          key: "priority",
          label: "Prioridad",
          type: "select",
          options: {
            low: "Baja",
            medium: "Media",
            high: "Alta",
            urgent: "Urgente",
          },
          default: "medium",
        },
      ],
    },
    {
      title: "Entrega",
      fields: [
        {
          key: "submission_type",
          label: "Formato",
          type: "select",
          options: {
            "word-document": "Documento Word",
            PDF: "PDF",
            "source-code": "Codigo Fuente",
            presentation: "Presentacion",
            video: "Video",
            handwritten: "Manuscrito",
          },
          default: "PDF",
        },
        {
          key: "submission_platform",
          label: "Plataforma",
          type: "select",
          options: {
            Google_Classroom: "Google Classroom",
            Moodle: "Moodle",
            Email: "Email",
            GitHub: "GitHub",
            in_person: "Entrega Fisica",
            "no-submit": "Sin Entrega",
          },
          default: "Google_Classroom",
        },
        {
          key: "submission_link",
          label: "Enlace de entrega",
          type: "text",
          inputType: "url",
          default: "",
          placeholder: "https://classroom.google.com/c/...",
        },
      ],
    },
    {
      title: "Enlaces",
      fields: [
        {
          key: "instructions_link",
          label: "Instrucciones",
          type: "text",
          inputType: "url",
          default: "",
          placeholder: "https://drive.google.com/...",
        },
        {
          key: "ai_chat_links",
          label: "Chats IA",
          type: "textarea",
          default: "",
          placeholder:
            "https://chat.deepseek.com/.../\nhttps://notebooklm.google.com/.../",
        },
      ],
    },
  ];

  // --- Scan helpers for auto-fill ---
  async function scanLastOfType(type, ctx) {
    const dirPath = `${ctx.coursePath}/${ctx.assignDir}`;
    const folder = tp.app.vault.getAbstractFileByPath(dirPath);
    if (!folder || !folder.children) return null;
    const aliases = typeAliases[type] || [type];
    const candidates = folder.children
      .filter((child) => child.children)
      .filter((child) => {
        const m = child.name.match(/^\d{4}-\d{2}-\d{2}-(.+?)-/);
        return m && aliases.includes(m[1]);
      })
      .sort((a, b) => b.name.localeCompare(a.name));
    if (candidates.length === 0) return null;
    for (const candidate of candidates) {
      const note = candidate.children?.find(
        (c) => c.name.endsWith(".md") && !c.name.startsWith("_"),
      );
      if (!note) continue;
      const content = await tp.app.vault.read(note);
      const fm = parseFrontmatter(content);
      if (fm) return fm;
    }
    return null;
  }

  async function scanLastOverall(ctx) {
    const dirPath = `${ctx.coursePath}/${ctx.assignDir}`;
    const folder = tp.app.vault.getAbstractFileByPath(dirPath);
    if (!folder || !folder.children) return null;
    const candidates = folder.children
      .filter((child) => child.children)
      .filter((child) => /^\d{4}-\d{2}-\d{2}-/.test(child.name))
      .sort((a, b) => b.name.localeCompare(a.name));
    if (candidates.length === 0) return null;
    for (const candidate of candidates) {
      const note = candidate.children?.find(
        (c) => c.name.endsWith(".md") && !c.name.startsWith("_"),
      );
      if (!note) continue;
      const content = await tp.app.vault.read(note);
      const fm = parseFrontmatter(content);
      if (fm) return fm;
    }
    return null;
  }

  function parseFrontmatter(content) {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;
    const fm = fmMatch[1];
    const get = (key) => {
      const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, "m"));
      return m ? m[1].trim() : null;
    };
    const unit = get("unit");
    const assignment_number = get("assignment_number");
    if (!unit && !assignment_number) return null;
    return { unit, assignment_number };
  }

  return new Promise((resolve) => {
    const data = {};
    const inputEls = [];

    // --- Create overlay ---
    const overlay = document.createElement("div");
    overlay.style.cssText = [
      "position: fixed; inset: 0; z-index: 10000;",
      "background: rgba(0,0,0,0.5);",
      "display: flex; align-items: center; justify-content: center;",
    ].join(" ");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cancel();
    });

    // --- Create container ---
    const container = document.createElement("div");
    container.style.cssText = [
      "background: var(--background-primary);",
      "color: var(--text-normal);",
      "border-radius: var(--radius-l, 12px);",
      "padding: 0;",
      "width: 540px;",
      "max-width: 95vw;",
      "max-height: 90vh;",
      "display: flex; flex-direction: column;",
      "box-shadow: 0 8px 48px rgba(0,0,0,0.4);",
      "font-family: var(--font-ui);",
      "font-size: var(--font-ui-size, 14px);",
    ].join(" ");

    // Hide native calendar indicator on date inputs
    const style = document.createElement("style");
    style.textContent = `input[type="date"]::-webkit-calendar-picker-indicator { display: none !important; }`;
    container.appendChild(style);

    // --- Title ---
    const titleBar = document.createElement("div");
    titleBar.style.cssText = [
      "padding: 20px 24px 0;",
      "font-size: 18px; font-weight: 600;",
      "padding-bottom: 16px;",
      "border-bottom: 1px solid var(--background-modifier-border);",
    ].join(" ");
    titleBar.textContent = "Nueva Actividad";
    container.appendChild(titleBar);

    // --- Body (scrollable) ---
    const body = document.createElement("div");
    body.style.cssText = [
      "padding: 4px 24px 12px;",
      "overflow-y: auto; flex: 1;",
    ].join(" ");

    const preview = document.createElement("div");
    preview.style.cssText = [
      "margin: 10px 0 4px;",
      "padding: 10px 12px;",
      "background: var(--background-secondary);",
      "border-radius: var(--input-radius, 4px);",
      "color: var(--text-muted);",
      "font-size: 12px;",
      "line-height: 1.5;",
      "white-space: pre-wrap;",
      "word-break: break-all;",
    ].join(" ");
    const previewTitle = document.createElement("div");
    const previewFile = document.createElement("div");
    previewFile.style.cssText = "margin-top: 4px;";
    preview.appendChild(previewTitle);
    preview.appendChild(previewFile);
    body.appendChild(preview);

    for (const group of fieldGroups) {
      const groupTitle = document.createElement("div");
      groupTitle.style.cssText = [
        "font-size: 11px; font-weight: 600;",
        "text-transform: uppercase; letter-spacing: 0.5px;",
        "color: var(--text-muted);",
        "margin: 14px 0 6px;",
        "padding-bottom: 4px;",
        "border-bottom: 1px solid var(--background-modifier-border);",
      ].join(" ");
      groupTitle.textContent = group.title;
      body.appendChild(groupTitle);

      for (const field of group.fields) {
        const row = document.createElement("div");
        row.style.cssText = [
          "display: flex; align-items: center;",
          "padding: 5px 0; gap: 12px;",
        ].join(" ");

        const label = document.createElement("div");
        label.style.cssText = [
          "width: 130px; flex-shrink: 0;",
          "font-size: var(--font-ui-size, 14px);",
          "color: var(--text-normal);",
        ].join(" ");
        label.textContent = field.label;
        row.appendChild(label);

        const wrapper = document.createElement("div");
        wrapper.style.cssText =
          field.inputType === "date"
            ? "flex: 1; position: relative;"
            : "flex: 1;";

        let el;
        if (field.type === "select") {
          el = document.createElement("select");
          el.style.cssText = [
            "width: 100%; padding: 5px 8px;",
            "background: var(--background-secondary);",
            "color: var(--text-normal);",
            "border: 1px solid var(--background-modifier-border);",
            "border-radius: var(--input-radius, 4px);",
            "font-size: var(--font-ui-size, 14px); cursor: pointer;",
          ].join(" ");
          for (const [val, text] of Object.entries(field.options)) {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = text;
            if (val === field.default) opt.selected = true;
            el.appendChild(opt);
          }
          data[field.key] = field.default;
          el.addEventListener("change", () => {
            data[field.key] = el.value;
            if (field.key === "type") {
              refreshTypeDerived();
            } else if (field.key === "submission_type") {
              data.submission_file_format = extensionMap[el.value] || "";
            }
            updatePreview();
          });
        } else if (field.type === "textarea") {
          el = document.createElement("textarea");
          el.value = field.default || "";
          el.placeholder = field.placeholder || "";
          el.rows = 3;
          el.style.cssText = [
            "width: 100%; padding: 5px 8px;",
            "background: var(--background-secondary);",
            "color: var(--text-normal);",
            "border: 1px solid var(--background-modifier-border);",
            "border-radius: var(--input-radius, 4px);",
            "font-size: var(--font-ui-size, 14px);",
            "resize: vertical;",
          ].join(" ");
          data[field.key] = field.default || "";
          el.addEventListener("input", () => {
            data[field.key] = el.value;
          });
        } else if (field.type === "checkbox") {
          el = document.createElement("input");
          el.type = "checkbox";
          el.id = `field_${field.key}`;
          el.checked = field.default !== false;
          data[field.key] = el.checked;
          el.style.cssText =
            "margin: 4px 0; cursor: pointer; width: auto; appearance: auto; -webkit-appearance: checkbox;";
          el.addEventListener("change", () => {
            data[field.key] = el.checked;
          });
        } else {
          el = document.createElement("input");
          el.type = field.inputType || "text";
          el.value = field.default || "";
          el.id = `field_${field.key}`;
          el.placeholder = field.placeholder || "";
          el.style.cssText = [
            "width: 100%; padding: 5px 8px;",
            field.inputType === "date" ? "padding-left: 28px;" : "",
            "background: var(--background-secondary);",
            "color: var(--text-normal);",
            "border: 1px solid var(--background-modifier-border);",
            "border-radius: var(--input-radius, 4px);",
            "font-size: var(--font-ui-size, 14px);",
          ]
            .filter(Boolean)
            .join(" ");
          data[field.key] = field.default || "";
          el.addEventListener("input", () => {
            data[field.key] = el.value;
            updatePreview();
          });
        }

        wrapper.appendChild(el);

        if (field.inputType === "date") {
          const pickerBtn = document.createElement("button");
          pickerBtn.textContent = "📅";
          pickerBtn.type = "button";
          pickerBtn.style.cssText = [
            "position: absolute; left: 4px; top: 50%;",
            "transform: translateY(-50%);",
            "border: none; background: none;",
            "cursor: pointer; padding: 2px 4px;",
            "font-size: 14px; line-height: 1;",
          ].join(" ");
          pickerBtn.addEventListener("click", () => el.showPicker());
          wrapper.appendChild(pickerBtn);
        }
        row.appendChild(wrapper);
        body.appendChild(row);
        inputEls.push(el);
      }
    }

    container.appendChild(body);

    // --- Footer buttons ---
    const footer = document.createElement("div");
    footer.style.cssText = [
      "padding: 12px 24px;",
      "display: flex; justify-content: flex-end; gap: 8px;",
      "border-top: 1px solid var(--background-modifier-border);",
    ].join(" ");

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancelar";
    cancelBtn.style.cssText = [
      "padding: 6px 16px;",
      "background: var(--background-secondary);",
      "color: var(--text-normal);",
      "border: 1px solid var(--background-modifier-border);",
      "border-radius: var(--input-radius, 4px);",
      "cursor: pointer; font-size: var(--font-ui-size, 14px);",
    ].join(" ");
    cancelBtn.addEventListener("click", cancel);
    footer.appendChild(cancelBtn);

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Crear Actividad";
    submitBtn.style.cssText = [
      "padding: 6px 16px;",
      "background: var(--interactive-accent);",
      "color: var(--text-on-accent, #fff);",
      "border: none;",
      "border-radius: var(--input-radius, 4px);",
      "cursor: pointer; font-size: var(--font-ui-size, 14px);",
      "font-weight: 500;",
    ].join(" ");
    submitBtn.addEventListener("click", submit);
    footer.appendChild(submitBtn);

    container.appendChild(footer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    setTimeout(() => inputEls[0]?.focus(), 50);

    // --- Live preview (1:1 with assignment.md title + filename) ---
    const slugifyFn =
      tp.user.slugify ||
      ((text) =>
        text
          .normalize("NFKD")
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/[\s-]+/g, "-"));
    let cachedCourseName =
      context.course?.course || context.course?.name || "";
    let cachedCourseSlug = context.course
      ? slugifyFn(
          context.course.code && context.course.code !== "" && context.course.code !== "undefined"
            ? context.course.code
            : context.course.course || context.course.name || "",
        )
      : "";
    let cachedStudentSlug = context.career?.student
      ? slugifyFn(context.career.student)
      : "";

    function updatePreview() {
      // Prefer pure domain (1:1 with assignment.md) — fallback to inline for vault without new module
      if (_domain && _domain.buildTitle && _domain.buildFilename) {
        const dateStr = data.date || tp.date.now("YYYY-MM-DD");
        const rawStudent = context.career?.student || '';
        const rawCourseName = cachedCourseName || context.course?.course || context.course?.name || '';
        const rawCourseCode = context.course?.code || '';
        const title = _domain.buildTitle({
          courseName: rawCourseName || undefined,
          unit: data.unit || "01",
          type: data.type || "practico",
          assignmentNumber: data.assignment_number || "01",
          topic: data.topic || "Introduccion",
        });
        const filenameBase = _domain.buildFilename({
          date: dateStr,
          student: rawStudent || cachedStudentSlug || 'estudiante',
          courseCode: rawCourseCode,
          courseName: rawCourseName,
          type: data.type || "practico",
          assignmentNumber: data.assignment_number || "01",
          topic: data.topic || "Introduccion",
        });
        const filename = `${filenameBase}.md`;
        previewTitle.textContent = `Título: ${title}`;
        previewFile.innerHTML = `Archivo: <code style="color: var(--text-normal);">${filename}</code>`;
        return;
      }
      const typeName = (getDisplayName && getDisplayName(data.type)) || typeDisplayNames[data.type] || data.type;
      const unitPadded = String(data.unit || "01").padStart(2, "0");
      const numPadded = String(data.assignment_number || "01").padStart(2, "0");
      const topic = data.topic || "Introduccion";
      const typeSlug = slugifyFn(data.type || "practico");
      const topicSlug = slugifyFn(topic);
      const dateStr = data.date || tp.date.now("YYYY-MM-DD");
      const title = cachedCourseName
        ? `${cachedCourseName} - Unidad ${unitPadded} - ${typeName} ${numPadded} - ${topic}`
        : `Unidad ${unitPadded} - ${typeName} ${numPadded} - ${topic}`;
      const filenameBase = cachedStudentSlug
        ? `${dateStr}-${cachedStudentSlug}-${cachedCourseSlug || slugifyFn(cachedCourseName || "curso")}-${typeSlug}-${numPadded}-${topicSlug}`
        : `${dateStr}-${slugifyFn(cachedCourseName || "curso")}-${typeSlug}-${numPadded}-${topicSlug}`;
      const filename = `${filenameBase}.md`;
      previewTitle.textContent = `Título: ${title}`;
      previewFile.innerHTML = `Archivo: <code style="color: var(--text-normal);">${filename}</code>`;
    }

    // --- Recompute derived fields from the selected type ---
    async function refreshTypeDerived() {
      // resolve alias → canonical before checking codeTypes (alias never written, but scan must resolve)
      const _canonical = (resolveType && resolveType(data.type)) || data.type;
      data.include_code = codeTypes.includes(_canonical);
      data.assignment_number = "01";
      const lastOfType = await scanLastOfType(data.type, context);
      if (lastOfType && lastOfType.assignment_number) {
        data.assignment_number = String(
          parseInt(lastOfType.assignment_number, 10) + 1,
        ).padStart(2, "0");
      }
      updatePreview();
    }

    // --- Auto-fill on open ---
    (async () => {
      try {
        data.submission_file_format = extensionMap[data.submission_type] || "";

        // Load course/student for accurate title/filename preview (1:1 with assignment.md)
        if (!cachedCourseName || !cachedCourseSlug || !cachedStudentSlug) {
          try {
            const cfg = tp.user.career_config?.();
            if (cfg) {
              if ((!cachedCourseName || !cachedCourseSlug) && tp.user.get_frontmatter_from_regex) {
                const courseFm = tp.user.get_frontmatter_from_regex(
                  tp,
                  cfg.COURSE_DIR_PATTERN,
                  "_course.md",
                );
                if (courseFm) {
                  if (!cachedCourseName && courseFm.course) cachedCourseName = courseFm.course;
                  const rawCourse = courseFm.code && courseFm.code !== "" && courseFm.code !== "undefined" ? courseFm.code : courseFm.course || "";
                  if (!cachedCourseSlug && rawCourse) cachedCourseSlug = slugifyFn(rawCourse);
                }
              }
              if (!cachedStudentSlug && tp.user.get_frontmatter_from_regex) {
                const careerFm = tp.user.get_frontmatter_from_regex(
                  tp,
                  cfg.CAREER_DIR_PATTERN,
                  "_career.md",
                );
                if (careerFm?.student)
                  cachedStudentSlug = slugifyFn(careerFm.student);
              }
            }
          } catch (_) {
            // preview fallback already handles missing data
          }
        }

        if (context.coursePath && context.assignDir) {
          const overall = await scanLastOverall(context);
          if (overall && overall.unit) {
            data.unit = String(overall.unit).padStart(2, "0");
            const unitEl = document.getElementById("field_unit");
            if (unitEl) unitEl.value = data.unit;
          }
        }

        await refreshTypeDerived();
        // Ensure preview rendered even if refreshTypeDerived fails early
        updatePreview();
      } catch (e) {
        console.error("Auto-fill scan failed:", e);
        updatePreview();
      }
    })();

    // --- Keyboard ---
    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      } else if (e.key === "Enter" && e.target.tagName !== "SELECT") {
        e.preventDefault();
        submit();
      }
    }
    document.addEventListener("keydown", onKeydown);

    function cleanup() {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
    }

    function cancel() {
      cleanup();
      resolve(null);
    }

    function submit() {
      cleanup();
      resolve(data);
    }
  });
};
