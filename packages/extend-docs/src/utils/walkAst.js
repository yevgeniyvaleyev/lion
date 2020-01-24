/**
 *
 * @param {ASTNode} curNode Node to start from. Will loop over its children
 * @param {function} processOrFindFn Will be executed for every node
 * @param {ASTNode} [parentNode] parent of curNode
 */
// eslint-disable-next-line consistent-return
function walkAst(curNode, processFn, parentNode = null) {
  processFn(curNode, parentNode);
  if (curNode.children) {
    curNode.children.forEach(childNode => {
      walkAst(childNode, processFn, curNode);
    });
  }
}

module.exports = walkAst;
