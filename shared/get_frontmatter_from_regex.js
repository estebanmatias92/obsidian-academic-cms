/**
 * Retrieves frontmatter from a file using a regex path and filename.
 * @param {object} tp - Templater instance providing user methods.
 * @param {string} regexPath - Regex pattern to match the target directory path.
 * @param {string} filename - Name of the target file (e.g., "_course.md").
 * @returns {object|null} Frontmatter object parsed from the file, or null if the file or frontmatter is missing.
 * @example
 * // Returns frontmatter from "/path/to/_course.md" if regex matches "/path/to"
 * getFrontmatterFromRegex(tp, "/path/to", "_course.md");
 */
const getFrontmatterFromRegex = (tp, regexPath, filename) => {
  // Get the directory from the regex
  const filepath = `${tp.user.get_matched_path(regexPath)}/${filename}`;

  return tp.user.get_frontmatter_from_file(tp, filepath);
};

module.exports = getFrontmatterFromRegex;
