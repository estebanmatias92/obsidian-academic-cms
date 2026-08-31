<%*
// ==============================================================================
// 1. DOMAIN CONFIGURATION & DEPENDENCIES
// ==============================================================================
const cfg = tp.user.career_config();
const career = tp.user.get_frontmatter_from_regex(tp, cfg.CAREER_DIR_PATTERN, `_career.md`) || { institution: "" };
const currentYear = tp.date.now("YYYY");
const today = tp.date.now("YYYY-MM-DD");

// ==============================================================================
// 2. DATA STRUCTURES (UI Prompts Definition)
// ==============================================================================
const textPrompts = [
    // Identity & Context
    { key: "course", prompt: "Materia:", default: "Algoritmos y Estructuras de Datos I" },
    { key: "professor", prompt: "Profesor:", default: "José Luis Oemig" },
    { key: "standardized_hours", prompt: "Carga Horaria (horas):", default: "64" },
    { key: "year", prompt: "Ciclo Lectivo:", default: currentYear },
    { key: "school", prompt: "Institución Educativa:", default: career.institution },
    
    // Logistics
    { key: "section", prompt: "Comisión (ej. 1-1era):", default: "1-1era" },
    { key: "group", prompt: "Grupo (ej. A o dejar vacío):", default: "" },
    { key: "classroom_link", prompt: "Enlace a Classroom/Campus:", default: "" },
    { key: "video_call_link", prompt: "Enlace a Meet/Zoom:", default: "" },
    { key: "start_date", prompt: "Fecha de Inicio (YYYY-MM-DD):", default: today },
    { key: "end_date", prompt: "Fecha de Finalización (YYYY-MM-DD):", default: tp.date.now("YYYY-MM-DD", 270) },
    
    // Evaluations (Dates)
    { key: "midterm_1_date", prompt: "Fecha Primer Parcial (YYYY-MM-DD o vacío):", default: "" },
    { key: "midterm_2_date", prompt: "Fecha Segundo Parcial (YYYY-MM-DD o vacío):", default: "" },
    { key: "final_exam_date", prompt: "Fecha Examen Final (YYYY-MM-DD o vacío):", default: "" },
    
    // Passing Conditions (Metrics)
    { key: "min_attendance_pct", prompt: "% Mínimo de Asistencia:", default: "70" },
    { key: "min_assignment_pct", prompt: "% Mínimo de Trabajos Aprobados:", default: "100" },
    { key: "midterm_1_min_score", prompt: "Nota Mínima 1er Parcial:", default: "4" },
    { key: "midterm_2_min_score", prompt: "Nota Mínima 2do Parcial:", default: "4" }
];

const suggesters = [
    {
        key: "field_of_study",
        prompt: "Campo de Estudio:",
        displayOptions: ["Campo General", "Campo del Fundamento", "Campo Técnico Específico", "Campo de la Práctica"],
        values: ["campo-general", "campo-del-fundamento", "campo-tecnico-especifico", "campo-de-la-practica"]
    },
    {
        key: "instruction_format",
        prompt: "Modalidad:",
        displayOptions: ["Presencialidad Plena (PP)", "Propuestas Pedagógicas Combinadas (PPC)"],
        values: ["presencialidad-plena", "propuestas-pedagogicas-combinadas"]
    },
    {
        key: "status",
        prompt: "Estado de la cursada:",
        displayOptions: ["No Iniciada", "En Progreso", "Completada"],
        values: ["not-started", "in-progress", "completed"]
    },
    {
        key: "enrollment_type",
        prompt: "Tipo de inscripción:",
        displayOptions: ["Regular", "Libre", "Oyente", "Itinerante"],
        values: ["regular", "libre", "oyente", "itinerante"]
    },
    {
        key: "promotion_policy",
        prompt: "Política de promoción:",
        displayOptions: ["Examen Final (EF)", "Promoción Directa (PD)", "Libre"],
        values: ["examen-final", "promocion-directa", "libre"]
    },
    {
        key: "is_averagable",
        prompt: "¿Las notas son promediables?:",
        displayOptions: ["Sí (Promediables)", "No (Notas independientes)"],
        values: [true, false] // Injected as native boolean
    }
];

// ==============================================================================
// 3. INPUT GATHERING (Execution)
// ==============================================================================
const responses = {};

for (const item of textPrompts) {
    responses[item.key] = await tp.system.prompt(item.prompt, item.default);
}

for (const suggester of suggesters) {
    responses[suggester.key] = await tp.system.suggester(
        suggester.displayOptions,
        suggester.values,
        false, 
        suggester.prompt
    );
}

// ==============================================================================
// 4. DATA PARSING & DOMAIN MAPPING
// ==============================================================================
// Utility to ensure numbers are stored as native integers/floats in YAML
// allowing Dataview queries like `WHERE passing_conditions.min_attendance_pct > 60`
const parseNumber = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
};

// ==============================================================================
// 5. VIEW GENERATION (YAML Output)
// ==============================================================================
const frontmatter = `---
course: "${responses.course}"
professor: "${responses.professor}"
field_of_study: "${responses.field_of_study}"
standardized_hours: ${parseNumber(responses.standardized_hours) || 0}
year: ${parseNumber(responses.year) || currentYear}
school: "${responses.school}"

status:
  - ${responses.status}
enrollment_type:
  - ${responses.enrollment_type}
instruction_format: "${responses.instruction_format}"
promotion_policy: "${responses.promotion_policy}"

start_date: "${responses.start_date}"
end_date: "${responses.end_date}"
section: "${responses.section}"
group: "${responses.group}"
classroom_link: "${responses.classroom_link}"
video_call_link: "${responses.video_call_link}"

passing_conditions:
  min_attendance_pct: ${parseNumber(responses.min_attendance_pct)}
  min_assignment_pct: ${parseNumber(responses.min_assignment_pct)}
  is_averagable: ${responses.is_averagable}

evaluations:
  midterm_1:
    name: "Primer Parcial"
    date: "${responses.midterm_1_date}"
    min_score: ${parseNumber(responses.midterm_1_min_score)}
  midterm_2:
    name: "Segundo Parcial"
    date: "${responses.midterm_2_date}"
    min_score: ${parseNumber(responses.midterm_2_min_score)}
  final_exam:
    name: "Examen Final"
    date: "${responses.final_exam_date}"
    min_score: 4
---`;

// ==============================================================================
// 6. OUTPUT & FILE OPERATIONS
// ==============================================================================
tR += frontmatter;

// Rename the file dynamically based on the inputted course name
// Sanitizing invalid characters for Windows/Unix file systems
// const sanitizedTitle = responses.course.replace(/[:\\/?*|"<>]/g, "").trim();
// await tp.file.rename(sanitizedTitle || "_course");  
// Disable this option for now, due to the system using "_course" literal string to find the document and extract the metadata (imposible otherwise)
await tp.file.rename("_course");
%>
