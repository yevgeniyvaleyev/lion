// eslint-disable-next-line import/no-extraneous-dependencies
const MagicString = require('magic-string');
const storiesPatternsToFiles = require('@open-wc/demoing-storybook/src/shared/storiesPatternsToFiles.js');

const { convertLionModules } = require('./convertLionModules.js');
const { configs, overrideMdxFiles } = require('./common.js');

const convertLionModulesPlugin = userOptions => {
  let storyFilesCache;

  return {
    async transform(code, id) {
      storyFilesCache =
        storyFilesCache ||
        (await storiesPatternsToFiles(userOptions.stories, userOptions.mainJsDir));
      const storyFiles = storyFilesCache;

      const findPackageRegex = new RegExp(
        userOptions.findPackageRegex || '/node_modules/@lion/(.*?)/.*',
      );
      const matches = id.match(findPackageRegex);
      const lionPackageName = matches && matches[1];

      if (lionPackageName && storyFiles.includes(id)) {
        const options = {
          ...userOptions,
          url: id,
          configs,
          overrideMdxFiles,
          currentPackage: lionPackageName,
        };
        const html = convertLionModules(code, options);

        const ms = new MagicString(html);
        return {
          code: ms.toString(),
          map: ms.generateMap({ hires: true }),
        };
      }
      return undefined;
    },
  };
};

module.exports = {
  convertLionModulesPlugin,
};
