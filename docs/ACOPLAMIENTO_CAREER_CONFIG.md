# Acoplamiento de `00-meta/academic-cms/` a la estructura del vault

Estado al: 2026-07-25

## Problema

Los templates Templater en `00-meta/academic-cms/` necesitan ubicar dos archivos
clave para funcionar:

- `_career.md` — metadata de la carrera (en la raíz del proyecto)
- `_course.md` — metadata de la materia (dentro de cada `subjects/<materia>/`)

Originalmente lo hacían con patrones wildcard hardcodeados que combinaban el
nombre del proyecto (`prj-tecnicatura-superior-sistemas`) y la estructura de
directorios (`year/01/<materia>/`). El refactor de `year/NN/` → `subjects/` rompió
estos patrones.

## Primera iteración (ejecutada)

Se creó `00-meta/academic-cms/career_config.js` como fuente única de patrones:

```js
// career_config.js (versión actual)
module.exports = function () {
  return {
    CAREER_DIR_PATTERN:  '/*projects/*systems*/',
    COURSE_DIR_PATTERN:  '/*projects/*systems*/subjects/*/',
    COURSE_PATH_PATTERN:  '*/*systems*/subjects/*/',
  };
};
```

Los 4 templates lo consumen con `tp.user.career_config()`.

**Problema remanente:** el wildcard `*systems*` sigue acoplado al nombre del
proyecto (`prj-systems-analyst`). Si se renombra, vuelve a romperse.

## Segunda iteración (propuesta, no ejecutada)

Eliminar por completo los patrones wildcard usando la API nativa de Obsidian.

### Reemplazo de `CAREER_DIR_PATTERN`

```js
// Antes:
const career = tp.user.get_frontmatter_from_regex(tp, cfg.CAREER_DIR_PATTERN, '_career.md');

// Después:
const careerFile = app.vault.getFiles().find(f => f.name === '_career.md');
if (!careerFile) throw new Error('No se encontró _career.md en el vault');
const careerContent = await app.vault.read(careerFile);
const career = parseFrontmatter(careerContent);  // get_frontmatter_from_file existe
```

**Fundamento:** `_career.md` es un archivo único en todo el vault (su nombre es
único por diseño — el template `_career-meta.md` siempre renombra a `_career`).
No necesita patrones.

### Reemplazo de `COURSE_DIR_PATTERN` y `COURSE_PATH_PATTERN`

```js
// Antes:
const course = tp.user.get_frontmatter_from_regex(tp, cfg.COURSE_DIR_PATTERN, '_course.md');
const coursePath = tp.user.get_matched_path(cfg.COURSE_PATH_PATTERN);

// Después:
const activePath = tp.file.folder(true);
const segments = activePath.split('/');
const idx = segments.indexOf('subjects');
if (idx === -1) throw new Error('No estás dentro de una materia');
const courseDir  = segments.slice(0, idx + 2).join('/');
const coursePath = courseDir;
// leer _course.md de courseDir y parsear frontmatter
```

**Fundamento:** desde el archivo activo se navega hacia arriba hasta `subjects/`
y se obtiene el directorio de la materia actual. Solo asume que el directorio se
llame `subjects/`.

### Archivos afectados

| Archivo | Patrones a eliminar |
|---|---|
| `career_config.js` | Archivo completo (se elimina) |
| `assignments/assignment.md` | 3 referencias a `cfg.*` |
| `topics/topic.md` | 2 referencias a `cfg.*` |
| `career/entrypoint.md` | 2 referencias a `cfg.*` |
| `career/_course-metadata.md` | 1 referencia a `cfg.*` |

### Beneficios

- Cero configuración de paths
- Inmune a renombres del proyecto, del directorio `04-projects/`, etc.
- Inmune a cambios de estructura mientras las materias estén en `subjects/<name>/`
- Usa solo API nativa de Obsidian (sin dependencias de plugins)

### Riesgos/consideraciones

1. **Unicidad de `_course.md`**: si hay dos archivos con ese nombre, `find()`
   agarraría el primero. El template `_course-metadata.md` ya renombra a `_course`
   justamente para garantizar unicidad — el diseño lo contempla.
2. **Directorio `subjects/`**: es la única suposición que queda. Para eliminarla
   se podría buscar hacia arriba por `_course.md` en lugar de por nombre de
   directorio, pero agrega complejidad innecesaria.
3. **Archivos fuera de `subjects/`**: si se ejecuta el template desde la raíz
   del proyecto, falla con "No estás dentro de una materia" (comportamiento
   correcto).
4. **Nota sobre Dataview**: se evaluó usar `tp.app.plugins.plugins.dataview.api`
   pero no aporta ventajas sobre `app.vault.getFiles()` para este caso.

### Próximos pasos

1. Implementar los 3 reemplazos en los 4 templates
2. Eliminar `career_config.js`
3. Probar cada template desde Obsidian ejecutándolo en una nota dentro de
   `subjects/<materia>/`
