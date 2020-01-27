// const walkAst = require('./walkAst.js');
const safeEval = require('./safeEval.js');

function getDocCommentNode(node) {
  const match = node.value && node.value.match(/\[doc::(.*?)\s+"(.*)"\]((.|\n)*)/);
  if (match) {
    return { type: match[1], target: match[2], replaceFn: safeEval(match[3]) };
  }
  return null;
}

/**
 * @desc Based on AST of {extension}/{pkg}/stories/*.stories.override.mdx, creates an extension object to
 * be applied on @lion/stories/{pkg}/*.stories.mdx
 * @param {object} ast
 */
function createExtendConfig(ast) {
  const overrides = [];
  const additions = [];
  ast.children.forEach(topLvlNode => {
    const docCommentNode = getDocCommentNode(topLvlNode);
    if (docCommentNode) {
      overrides.push(docCommentNode);
    } else {
      additions.push(topLvlNode);
    }
  });
  return { overrides, additions };
}

module.exports = createExtendConfig;
