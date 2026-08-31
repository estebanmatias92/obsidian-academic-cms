<%*
// 1. Obtener metadata de carrera y curso
const cfg = tp.user.career_config();
const TOPIC_ROOT_PATH  = tp.file.find_tfile(`topic`).parent.path;
const career = tp.user.get_frontmatter_from_regex(tp, cfg.CAREER_DIR_PATTERN, `_career.md`);
const course = tp.user.get_frontmatter_from_regex(tp, cfg.COURSE_DIR_PATTERN, `_course.md`);

// 2. Recoger todas las respuestas primero
const responses = {
  title: await tp.system.prompt('Título del tema:', 'Tema sin título'),
  unit: await tp.system.prompt('Unidad:', '01'),
  topicType: await tp.system.suggester(
    ['Teórico', 'Práctico', 'Mixto'],
    ['teorico', 'practico', 'mixto'],
    false,
    'Selecciona el tipo de tema:'
  ),
  difficulty: await tp.system.suggester(
    ['Básico', 'Intermedio', 'Avanzado'],
    ['basico', 'intermedio', 'avanzado'],
    false,
    "Selecciona la dificultad:"
  ),
  resourceLink: await tp.system.prompt('Enlace a recursos:', 'https://classroom.google.com/'),
  concepts: await tp.system.prompt('Lista 3 conceptos clave (separados por coma):', 'Ejemplo 1, Ejemplo 2, etc'),
  // Añadir más prompts según necesidad
};

// 3. Configurar metadatos basado en respuestas
const TOPIC_TYPES = {
  teorico: {
    template: `theory.md`,
    metadata: {
      icon: '📚',
      tags: ['concepto', 'teoria', 'investigacion']
    }
  },
  practico: {
    template: `practice.md`,
    metadata: {
      icon: '🛠️',
      tags: ['ejercicio', 'codigo', 'experimento']
    }
  },
  mixto: {
    template: `mixed.md`,
    metadata: {
      icon: '🔄',
      tags: ['integracion', 'caso-estudio', 'aplicacion']
    }
  }
};

const currentConfig = TOPIC_TYPES[responses.topicType];

// 4. Generar filename antes que nada
//const filename = `${tp.user.slugify(course.course)}-${tp.user.slugify(responses.title)}`;
const filename = `${tp.user.slugify(responses.title)}`;

// 5. Generación de metadatos
const frontmatter = `---
title: "${responses.title}"
type: "${responses.topicType}"
course: "${course.course}"
unit: "${responses.unit}"
date: "${tp.date.now('YYYY-MM-DD')}"
difficulty: "${responses.difficulty}"
status: "en_progreso"
tags: ${currentConfig.metadata.tags.join(', ')}
icon: ${currentConfig.metadata.icon}
---\n`;
// Output the complete frontmatter
tR = frontmatter +tR;

// Get template path
const tFileTemplate = tp.file.find_tfile(`${TOPIC_ROOT_PATH}/${currentConfig.template}`);
// Throw error in case the tFile is null
if (!tFileTemplate) {
    await tp.system.clipboard("No matching template found");
    // Immediately close this temporary file
    throw new Error("Template execution cancelled - no file created");
}

// Rename the file
await tp.file.rename(filename);

// Next step is to create the file by including the template
-%>
<% tp.file.include(tFileTemplate) %>


## Recursos

- <%* tR += responses.resourceLink;%>