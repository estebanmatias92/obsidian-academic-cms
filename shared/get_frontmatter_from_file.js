/**
 * Retrieves frontmatter from a file at the specified path using Obsidian's metadata cache.
 * @param {object} tp - Templater instance providing file utilities.
 * @param {string} filePath - Full path to the target file (e.g., "path/to/_course.md").
 * @returns {object} Frontmatter object parsed from the file, or empty object if the file or frontmatter is missing.
 * @example
 * // Returns frontmatter from "path/to/_course.md" or {} if not found
 * getFrontmatterFromFile(tp, "path/to/_course.md");
 */
const getFrontmatterFromFile = (tp, filePath) => {
  return (
    app.metadataCache.getFileCache(tp.file.find_tfile(filePath))?.frontmatter ||
    {}
  );
};

module.exports = getFrontmatterFromFile;
