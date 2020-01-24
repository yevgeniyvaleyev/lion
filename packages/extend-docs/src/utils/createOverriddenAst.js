const walkAst = require('./walkAst.js');
const astToMdx = require('./astToMdx.js');

function findStoryMeta(astNode) {
  const match = astNode.value && astNode.value.match(/<Story .*name="(.*)".*>/);
  if (match) {
    return { name: match[1] };
  }
  return null;
}

function adjustHeading(lionAstNode, parentNode, overrideHeading, mdxSource) {
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
  // eslint-disable-next-line no-param-reassign
  const ast = { children: headingScopedSiblings };
  const headingScopeTxt = astToMdx(ast, mdxSource);
  const heading = `${'#'.repeat(lionAstNode.depth)} ${lionAstNode.children[0].value}`;
  const body = headingScopeTxt.replace(heading, '');

  // eslint-disable-next-line prefer-template
  const value = overrideHeading.replaceFn({ src: headingScopeTxt, heading, body }, { ast }) + '\n';

  siblings.splice(nodeIdx, spliceOffset, {
    type: 'doc::raw-mdx-output',
    value, // This is needed for astToMdx
    position: {
      start: siblings[nodeIdx].position.start,
    },
  });
}

function adjustStory(lionAstNode, parentNode, overrideStory, mdxSource) {
  console.log('adjustStory...');
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

  const ast = { children: storyScopedSiblings };
  const storyScopeText = astToMdx(ast, mdxSource);
  // eslint-disable-next-line prefer-template
  const value = overrideStory.replaceFn({ src: storyScopeText }, { ast }) + '\n';
  console.log('value story\n\n', overrideStory.replaceFn, value);

  siblings.splice(nodeIdx, spliceOffset, {
    type: 'doc::raw-mdx-output',
    value,
    // This is needed for astToMdx
    position: {
      start: siblings[nodeIdx].position.start,
    },
  });
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

/**
 * @desc Alters the original AST from @lion/{package}/stories so that it reflects the changes found
 * in {extension-repo}/{package}/stories
 * @param {object} ast @lion AST, for instance @lion/input/stories/index.stories.mdx
 * @param {object} overrideConfig
 */
function createOverriddenAst(ast, overrideConfig, mdxSource) {
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
       * (e.g. there is a match in overrideConfig)
       */
      const overrideHeading = overrideConfig.find(override => {
        // eslint-disable-next-line no-unused-vars
        const [_, depth, value] = override.target.match(/(#*)\s+(.*)/) || [];
        return (
          override.type === 'replace-heading' &&
          depth &&
          depth.length === lionAstNode.depth &&
          value === lionAstNode.children[0].value
        );
      });

      if (overrideHeading) {
        overrideMap.push({ lionAstNode, parentNode, override: overrideHeading, type: 'heading' });
      }
    } else if (lionAstNode.type === 'jsx') {
      // Try to convert to stpry meta
      const lionStoryMeta = findStoryMeta(lionAstNode);
      if (lionStoryMeta) {
        const override = overrideConfig.find(
          o => o.type === 'replace-story' && o.target === lionStoryMeta.name,
        );
        // console.log('override', override, lionStoryMeta);
        if (override) {
          overrideMap.push({ lionAstNode, parentNode, override, type: 'story' });
        }
      }
    }
  });

  adjustLionAst(overrideMap, mdxSource);
  return ast;
}

module.exports = createOverriddenAst;
