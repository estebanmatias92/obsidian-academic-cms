/**
 * Matches a path pattern against the active file's path and returns the matched segment.
 * @param {string} pathPattern - Pattern with wildcards (e.g., "Career/Courses/*").
 * @returns {string|false} - Full matched path segment, or false if no match.
 */
const getMatchedPath = (pathPattern) => {
  const activeFile = app.workspace.getActiveFile();
  if (!activeFile?.path) return false; // Early exit: No file or path

  // Convert wildcard pattern to regex (handles leading/trailing slashes)
  const normalizedPattern = pathPattern.replace(/^\/|\/$/g, ""); // Trim slashes
  const regexParts = normalizedPattern
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment === "*" ? "[^/]+" : segment.replace(/\*/g, "[^/]*")
    );

  const pathRegex = new RegExp(`^${regexParts.join("\\/")}(\\/|$)`, "i"); // Match full segments
  if (!pathRegex.test(activeFile.path)) return false;

  // Extract the matched part of the path
  const pathSegments = activeFile.path.split("/").filter(Boolean);
  const matchedDepth = regexParts.length;
  return pathSegments.slice(0, matchedDepth).join("/") || false;
};

module.exports = getMatchedPath;
