<%*
// Define a list of objects for the text prompts
const textPrompts = [
    { key: "institution", prompt: "Institución Educativa: ", default: "ISFT 151" },
    { key: "career_name", prompt: "Nombre de la Carrera: ", default: "" },
    { key: "career_code", prompt: "Código de la Carrera (ej. Resolución): ", default: "" },
    { key: "degree", prompt: "Título Otorgado: ", default: "" },
    { key: "resolution_name", prompt: "Nombre de Resolución Ministerial: ", default: "" },
    { key: "resolution_link", prompt: "Enlace de Resolución Ministerial: ", default: "http://www.google.com/" },
    { key: "year", prompt: "Año Académico: ", default: tp.date.now("YYYY") },
    { key: "duration_years", prompt: "Duración (años): ", default: "3" },
    { key: "total_hours", prompt: "Carga Horaria Total: ", default: "1856" },
    { key: "preceptor", prompt: "Preceptor/a: ", default: "" },
    { key: "professional_licenses", prompt: "Matrículas Profesionales (separar por comas): ", default: "" },
    { key: "key_competencies", prompt: "Competencias clave (describir brevemente): ", default: "Análisis de problemas, Desarrollo de soluciones algorítmicas..." },
    { key: "fields_of_work", prompt: "Campos laborales (separar por comas): ", default: "Desarrollo de software, Análisis de datos, Consultoría IT" },
    { key: "postgraduate_options", prompt: "Opciones de posgrado relacionadas: ", default: "Maestría en Ciencias de la Computación, Especialización en IA" }

];

// Define a list of objects for the suggesters
const suggesters = [
    {
        key: "instruction_format",  
        prompt: "Modalidad Principal: ",  
        displayOptions: ["Presencial", "Híbrido", "Virtual", "Dual"],
        values: ["presencial", "hibrido", "virtual", "dual"]
    },
    {
        key: "accreditation_status",
        prompt: "Estado de Acreditación:",
        displayOptions: ["Acreditado", "En Proceso", "No Acreditado", "Reconocido"],
        values: ["acreditado", "en-proceso", "no-acreditado", "reconocido"]
    },
    {
        key: "degree_type",
        prompt: "Tipo de Título:",
        displayOptions: ["Técnico Superior", "Licenciatura", "Ingeniería", "Profesorado"],
        values: ["tecnico-superior", "licenciatura", "ingenieria", "profesorado"]
    }
];

// Initialize an object to store the responses
const responses = {};

// Process text prompts
for (const item of textPrompts) {
    responses[item.key] = await tp.system.prompt(item.prompt, item.default);
}

// Process suggesters
for (const suggester of suggesters) {
    responses[suggester.key] = await tp.system.suggester(
        suggester.displayOptions,
        suggester.values,
        false,
        suggester.prompt
    );
}

// Generate YAML frontmatter
const frontmatter = `---
institution: "${responses.institution}"
career:
  name: "${responses.career_name}"
  code: "${responses.career_code}"
degree: "${responses.degree}"
degree_type: "${responses.degree_type}"
resolution: 
  name: "${responses.resolution_name}"
  link: "${responses.resolution_link}"
year: ${responses.year}
duration_years: ${responses.duration_years}
total_hours: ${responses.total_hours}
preceptor: "${responses.preceptor}"
professional_licenses: 
  - ${responses.professional_licenses.split(',').map(item => item.trim()).join('\n  - ')}
instruction_format: "${responses.instruction_format}"
accreditation_status: "${responses.accreditation_status}"
department: "Departamento de Informática"  # Example, can be made dynamic
curriculum_version: "2023"  # Important for tracking updates
key_competencies: 
  - ${responses.key_competencies.split(',').map(item => item.trim()).join('\n  - ')}
fields_of_work: 
  - ${responses.fields_of_work.split(',').map(item => item.trim()).join('\n  - ')}
postgraduate_options: 
  - ${responses.postgraduate_options.split(',').map(item => item.trim()).join('\n  - ')}
---`;

// Output the complete frontmatter
tR += frontmatter;

// Rename the file
const new_title = `_career`;
await tp.file.rename(new_title);
%>
