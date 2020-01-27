/**
 *
 * @param {ASTNode} curNode Node to start from. Will loop over its children
 * @param {function} processOrFindFn Will be executed for every node
 * @param {ASTNode} [parentNode] parent of curNode
 */
// eslint-disable-next-line consistent-return
function walkAst(curNode, processFn, parentNode = null) {
  let done = processFn(curNode, parentNode);
  if (done) return true;

  if (curNode.children) {
    // eslint-disable-next-line
    curNode.children.some(childNode => {
      done = walkAst(childNode, processFn, curNode);
      if (done) return true;
    });
  }
}

module.exports = walkAst;
