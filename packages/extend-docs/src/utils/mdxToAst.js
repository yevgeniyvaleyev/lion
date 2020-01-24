// eslint-disable-next-line import/no-extraneous-dependencies
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
    return { error };
  }

  return mdast;
}

module.exports = mdxToAst;
