const glob = require('glob');
const path = require('path');
const fs = require('fs');

const configPaths = glob.sync('./packages/**/extend-docs.config.js', { dot: true });
const configs = configPaths.map(p => ({
  filePath: p,
  // eslint-disable-next-line global-require, import/no-dynamic-require
  config: require(path.resolve(process.cwd(), p)),
}));

const overrideMdxPaths = glob.sync('./packages/**/stories/*.stories.override.mdx');
const overrideMdxFiles = overrideMdxPaths.map(p => ({
  filePath: p,
  source: fs.readFileSync(path.resolve(process.cwd(), p), 'utf8'),
}));
const globalOverrideMdxPath = path.resolve(process.cwd(), './.storybook/*.stories.override.mdx');
const globalOverrideMdxSource = fs.readFileSync(globalOverrideMdxPath, 'utf8');

module.exports = {
  configs,
  overrideMdxFiles,
  globalOverrideMdxSource,
};
