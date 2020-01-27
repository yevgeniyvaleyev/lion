// TODO: Remove this ignore once moved to lion monorepo
// eslint-disable-next-line import/no-extraneous-dependencies
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const storiesPatternsToFiles = require('@open-wc/demoing-storybook/src/shared/storiesPatternsToFiles.js');

const { convertLionModules } = require('./convertLionModules.js');

const configPaths = glob.sync('**/extend-docs.config.js', { dot: true });
const configs = configPaths.map(p => ({
  filePath: p,
  // eslint-disable-next-line global-require, import/no-dynamic-require
  config: require(path.resolve(process.cwd(), p)),
}));

const overrideMdxPaths = glob.sync('**/stories/*.stories.override.mdx');
const overrideMdxFiles = overrideMdxPaths.map(p => ({
  filePath: p,
  raw: fs.readFileSync(path.resolve(process.cwd(), p), 'utf8'),
}));

function createConvertLionModulesMiddleware(userOptions) {
  let storyFilesCache;

  // eslint-disable-next-line no-unused-vars
  return async function convertLionModulesMiddleware({ url, status, contentType, body }) {
    storyFilesCache =
      storyFilesCache || (await storiesPatternsToFiles(userOptions.stories, userOptions.mainJsDir));
    const storyFiles = storyFilesCache;
    const storyUrlsForServer = storyFiles.map(file => file.replace(userOptions.rootDir, ''));

    const findPackageRegex = new RegExp(
      userOptions.findPackageRegex || '/node_modules/@lion/(.*?)/.*',
    );
    const matches = url.match(findPackageRegex);
    const lionPackageName = matches && matches[1];

    if (lionPackageName && storyUrlsForServer.includes(url)) {
      const options = {
        ...userOptions,
        url,
        configs,
        overrideMdxFiles,
        currentPackage: lionPackageName,
      };
      const html = convertLionModules(body, options);
      return {
        body: html,
        contentType: 'text/html',
      };
    }
    return undefined;
  };
}

module.exports = {
  createConvertLionModulesMiddleware,
};
