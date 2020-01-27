const walkAst = require('./walkAst.js');
const astToMdx = require('./astToMdx.js');
const HString = require('./HString.js');

function findStoryMeta(astNode) {
  const match = astNode.value && astNode.value.match(/<Story .*name="(.*)".*>/);
  if (match) {
    return { name: match[1] };
  }
  return null;
}

function createDocNode(newValue, startOffset) {
  return {
    type: 'doc::raw-mdx-output',
    value: newValue,
    // This hacky workaround is needed for astToMdx, because prevNode reads the offset of this one
    position: {
      start: startOffset,
    },
  };
}

function adjustHeading(lionAstNode, parentNode, headingToAdjust, mdxSource) {
  const siblings = parentNode.children;
  const nodeIdx = siblings.indexOf(lionAstNode);

  /**
   * 1. Lookahead
   * Find all siblings of the heading. Stop when we find the next h1, h2, or h3, or a story
   */
  const headingScopedSiblings = [lionAstNode]; // Keeps track of all siblings found after current
  const succeedingSiblings = siblings.slice(nodeIdx + 1);
  let spliceOffset = 1;
  succeedingSiblings.some((node, i) => {
    if ((node.type === 'heading' && node.depth < 4) || findStoryMeta(node)) {
      // Delete nodes from lionAst, so that we don't write them again
      spliceOffset += i;
      return true;
    }
    headingScopedSiblings.push(node);
    return false;
  });

  /**
   * 2. Put the result back in the original lion AST
   */
  // Now insert the replaced, raw mdx node
  let newValue = '\n';
  if (headingToAdjust.replaceFn) {
    const ast = { children: headingScopedSiblings };
    const src = new HString(astToMdx(ast, mdxSource));
    const heading = new HString(
      `${'#'.repeat(lionAstNode.depth)} ${lionAstNode.children[0].value}`,
    );
    const body = new HString(src.replace(heading, ''));
    newValue = `${headingToAdjust.replaceFn({ src, heading, body }, { ast })}\n`;
  }
  siblings.splice(nodeIdx, spliceOffset, createDocNode(newValue, siblings[nodeIdx].position.start));
}

function adjustStory(lionAstNode, parentNode, storyToAdjust, mdxSource) {
  const siblings = parentNode.children;
  const nodeIdx = siblings.indexOf(lionAstNode);

  /**
   * 1. Lookahead
   * Find all siblings of the heading. Stop when we find the next h1, h2, or h3, or a story
   */
  const storyScopedSiblings = [lionAstNode]; // Keeps track of all siblings found after current
  let spliceOffset = 1;
  const nextSibling = siblings[nodeIdx + 1];
  if (nextSibling && nextSibling.type === 'code') {
    storyScopedSiblings.push(nextSibling);
    spliceOffset += 1;
  }

  let newValue = '\n';
  if (storyToAdjust.replaceFn) {
    const ast = { children: storyScopedSiblings };
    const src = new HString(astToMdx(ast, mdxSource));
    newValue = `${storyToAdjust.replaceFn({ src }, { ast })}\n`;
  }
  siblings.splice(nodeIdx, spliceOffset, createDocNode(newValue, siblings[nodeIdx].position.start));
}

function adjustLionAst(overrideMap, mdxSource) {
  overrideMap.forEach(({ lionAstNode, parentNode, type, override }) => {
    if (type === 'heading') {
      adjustHeading(lionAstNode, parentNode, override, mdxSource);
    } else if (type === 'story') {
      adjustStory(lionAstNode, parentNode, override, mdxSource);
    }
  });
}

function appendToLionAst(ast, additions, mdxExtendSource) {
  const insertionPointNodeBottom = ast.children[ast.children.length - 1];
  const insertionPointNodeTop = ast.children[0];

  // let prevNode = null;
  // walkAst(ast, (curNode, parentNode) => {
  //   if (curNode.type !== 'import') {
  //     insertionPointNodeTop = prevNode;
  //     return true; // tells walkAst we're done walking
  //   }
  //   prevNode = curNode;
  // });

  additions.forEach(additionNode => {
    const value = `
${astToMdx({ children: [additionNode] }, mdxExtendSource)}
`;
    // Either we add imports to the top, or add everything else to the bottom
    if (additionNode.type === 'import') {
      ast.children.unshift(
        additionNode,
        createDocNode(value, insertionPointNodeTop.position.start),
      );
    } else {
      const offset =
        insertionPointNodeBottom.position.start.offset + insertionPointNodeBottom.value.length;
      ast.children.push(additionNode, createDocNode(value, { offset }));
    }
  });
}

/**
 * @desc Alters the original AST from @lion/{package}/stories so that it reflects the changes found
 * in {extension-repo}/{package}/stories
 * @param {object} ast @lion AST, for instance @lion/input/stories/index.stories.mdx
 * @param {object} overrides
 */
function createExtendedAst(ast, { overrides, additions }, mdxSource, mdxExtendSource) {
  const overrideMap = [];

  // Fill overrideMap
  walkAst(ast, (lionAstNode, parentNode) => {
    if (!parentNode) {
      return;
    }

    // We only hook into headings and stories
    if (lionAstNode.type === 'heading') {
      /**
       * See if we need to adjust heading in current lionAstNode
       * (e.g. there is a match in overrides)
       */
      const headingToAdjust = overrides.find(override => {
        // eslint-disable-next-line no-unused-vars
        const [_, depth, value] = override.target.match(/(#*)\s+(.*)/) || [];
        return (
          override.type === 'replace-heading' &&
          depth &&
          depth.length === lionAstNode.depth &&
          value === lionAstNode.children[0].value
        );
      });

      if (headingToAdjust) {
        overrideMap.push({ lionAstNode, parentNode, override: headingToAdjust, type: 'heading' });
      }
    } else if (lionAstNode.type === 'jsx') {
      // Try to convert to stpry meta
      const lionStoryMeta = findStoryMeta(lionAstNode);
      if (lionStoryMeta) {
        const override = overrides.find(
          o => o.type === 'replace-story' && o.target === lionStoryMeta.name,
        );
        if (override) {
          overrideMap.push({ lionAstNode, parentNode, override, type: 'story' });
        }
      }
    }
  });

  adjustLionAst(overrideMap, mdxSource);
  appendToLionAst(ast, additions, mdxExtendSource);
  return ast;
}

module.exports = createExtendedAst;
