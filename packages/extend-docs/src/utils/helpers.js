/**
 * @param {string} str
 * @param {string|RegExp} from
 * @param {string} to
 */
function gReplace(str, from, to) {
  const escapedFrom = ['$', '{', '}', '(', ')', '<', '>'].reduce(
    (acc, cur) => acc.replace(new RegExp(`\\${cur}`, 'g'), `\\${cur}`),
    from,
  );
  return str.replace(new RegExp(escapedFrom, 'g'), to);
}

function replaceTag(src, fromTag, toTag) {
  return src.replace(new RegExp(`(</?)(${fromTag})( |>)`, 'g'), `$1${toTag}$3`);
}

/**
 * Helpers making it easier to adjust stories without having to write verbose and unreadable
 * expressions inside mdx files. Handles predictable tasks like:
 * - global replace
 * - tag replacement
 */
module.exports = {
  gReplace,
  replaceTag,
};
