// eslint-disable-next-line import/no-unresolved
const mdx = require('@mdx-js/mdx');

function mdxToAst(src) {
  let mdast = {};
  try {
    mdx.sync(src, {
      skipExport: true,
      remarkPlugins: [
        () => ast => {
          mdast = ast;
          return ast;
        },
      ],
    });
  } catch (error) {
    throw new Error('parsing failed');
    // return { error };
  }

  // console.log('mdast', mdast);
  return mdast;
}

module.exports = mdxToAst;
