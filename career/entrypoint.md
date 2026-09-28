<%*
// Path matching logic (unchanged from your requirements)
const cfg = tp.user.career_config();
const basePath = cfg.CAREER_DIR_PATTERN;
const coursePath = cfg.COURSE_PATH_PATTERN;

// Unified configuration - combines paths and templates
// All templates referenced by filename only — tp.file.find_tfile() searches the entire vault
// NOTE: assignments/exams are owned by the Academic CMS plugin
// (right-click → New Assignment, or Ctrl+P → Create Assignment).
// They have no Templater route on purpose: a blank note created inside
// 30-assignments/ or 40-exams/ intentionally matches nothing and fails
// closed with "No matching template found".
const PATH_CONFIG = {
    lecture: {
      pattern: `${coursePath}/*lectures/`,
      template: `lecture.md`
    },
    topic: {
      pattern: `${coursePath}/*topics/`,
      template: `topic.md`
    },
    course: {
      pattern: coursePath,
      template: `_course-metadata.md`
    },
    career: {
      pattern: basePath,
      template: `_career-meta.md`
    }
};

// Default priority order (most specific to least specific)
/*const order = priorityOrder || [
    'lecture', 
    'topic', 
    'assignment', 
    'course', 
    'career'
  ];*/

// Find matching template
const match = tp.user.get_template_for_path(tp, PATH_CONFIG);
if (!match) {
    await tp.system.clipboard("No matching template found");
    // Immediately close this temporary file
    throw new Error("Template execution cancelled - no file created");
}

// Next step is to create the file by including the template
-%><% tp.file.include(tp.file.find_tfile(match.template)) %>