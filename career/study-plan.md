---
<%*
// Define a list of objects for the prompts
const prompts = [
    { key: "professor", prompt: "Profesor: ", default: "Dr. John Doe" },
    { key: "field_of_study", prompt: "Campo de Estudio: ", default: "Computer Science" },
    { key: "subject", prompt: "Materia: ", default: "Advanced Algorithms" },
    { key: "standardized_hours", prompt: "Carga Horaria: ", default: 64 },
    { key: "year", prompt: "Ciclo Lectivo: ", default: tp.date.now("YYYY") },
    { key: "school", prompt: "Institución Educativa: ", default: "University of Example" },
    { key: "start_date", prompt: "Fecha de Inicio (YYYY-MM-DD): ", default: tp.date.now("YYYY-MM-DD") },
    { key: "end_date", prompt: "Fecha de Finalizacion (YYYY-MM-DD): ", default: tp.date.now("YYYY-MM-DD", 270) }
];

// Initialize an object to store the responses
const responses = {};

// Loop through the prompts and get user input
for (const item of prompts) {
    responses[item.key] = await tp.system.prompt(item.prompt, item.default);
}

// Handle the status suggester separately
const statusOptions = ["Not Started", "In Progress", "Completed"];
responses["status"] = await tp.system.suggester(statusOptions, statusOptions);

let standardized_hours = parseInt(responses.standardized_hours, 10) || 0; // Default to 0 if invalid

// Store the subject value for later use
const subject = responses.subject;

// Generate YAML frontmatter using a template string
const frontmatter = `
professor: "${responses.professor}"
field_of_study: "${responses.field_of_study}"
subject: "${responses.subject}"
standardized_hours: ${parseInt(responses.standardized_hours, 10) || 0}
year: ${parseInt(responses.year, 10) || 0}
school: "${responses.school}"
status: "${responses.status}"
start_date: "${responses.start_date}"
end_date: "${responses.end_date}"
`;

// Output the complete frontmatter
tR += frontmatter;

// Use the subject value to rename the file
const new_title = `Diseño Curricular - ${responses.subject}`;
await tp.file.rename(new_title);
%>
---

# <% tp.file.title %>

## Basic Information

- **Professor**: `= this.professor`
- **Field of Study**: `= this.field_of_study`
- **Subject**: `= this.subject`
- **Standardized Hours**: `= this.standardized_hours`
- **Year**: `= this.year`
- **School**: `= this.school`
- **Status**: `= this.status`
- **Start Date**: `= this.start_date`
- **End Date**: `= this.end_date`

---

## Concepts to Study

Below is a list of concepts related to `= this.subject`. Add new concepts as you progress through the course.

### Concepts List

<%*
let concepts = [];
while (true) {
    let concept = await tp.system.prompt("Enter a concept (or leave blank to finish): ");
    if (!concept) break;
    concepts.push(`- [ ] ${concept}`);
}
tR += concepts.join("\n");
%>

---

## Notes

Use this space to add detailed notes, explanations, or resources for each concept.

<%*
for (let concept of concepts) {
    let conceptName = concept.replace("- [ ] ", "");
    tR += `### ${conceptName}\n- Notes: \n- Resources: \n\n`;
}
%>

---

## Progress Tracking
- **Last Reviewed**: YYYY-MM-DD
- **Next Review**: YYYY-MM-DD