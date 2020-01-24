const walkAst = require('./walkAst.js');
const safeEval = require('./safeEval.js');

function createOverrideConfigFromAst(ast) {
  const docCommentNodes = [];
  walkAst(ast, node => {
    if (node.type !== 'comment') {
      return;
    }
    const match = node.value.match(/\[doc::(.*?)\s+"(.*)"\]((.|\n)*)/);
    if (match) {
      docCommentNodes.push({ type: match[1], target: match[2], replaceFn: safeEval(match[3]) });
    }
  });
  return docCommentNodes;
}

module.exports = createOverrideConfigFromAst;
