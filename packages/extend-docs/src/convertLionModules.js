const path = require('path');
const mdxToAst = require('./utils/mdxToAst.js');
const astToMdx = require('./utils/astToMdx.js');
const createExtendedAst = require('./utils/createExtendedAst.js');
const createExtendConfig = require('./utils/createExtendConfig.js');

const { convertModule } = require('./convertModule.js');

const defaultComponentNames = [
  'button',
  'calendar',
  'checkbox',
  'checkbox-group',
  'dialog',
  'fieldset',
  'form',
  'icon',
  'input',
  'input-amount',
  'input-date',
  'input-datepicker',
  'input-email',
  'input-iban',
  'input-range',
  'option',
  'radio',
  'radio-group',
  'select',
  'select-rich',
  'options',
  'select-invoker',
  'steps',
  'step',
  'switch',
  'tabs',
  'textarea',
  'tooltip',
  'tooltip-arrow',
];

const onlyProcess = ['form-system', 'overlays'];
const processPackages = [...defaultComponentNames, ...onlyProcess];

// const defaultClassNames = ['ajax', 'localize'];

/**
 * @desc Retrieve package name from an extension layer path.
 * Hard requirement: a package name always contains its stories folder on 1st level (as a direct
 * descendant)
 * @param {string} extPath a path inside your extension layer
 */
function pkgNameExtLayer(extPath) {
  const match = extPath.match(/.*\/(.*)\/stories.*/);
  return match && match[1];
}

/**
 * @desc Retrieve package name from lion layer path.
 * @param {string} lionPath a path inside lion layer
 */
function pkgNameLionLayer(lionPath) {
  const match = lionPath.match(/.*@lion\/(.*?)\//);
  return match && match[1];
}

function findOverrideMdx(overridePaths, url) {
  const overrideMdx = overridePaths.find(({ filePath }) => {
    if (pkgNameLionLayer(url) !== pkgNameExtLayer(filePath)) {
      return false;
    }
    const localPathLion = url.match(/.*\/stories\/(.*)/)[1];
    const normalizedLocalPathExt = filePath
      .match(/.*\/stories\/(.*)/)[1]
      .replace('stories.override.mdx', 'stories.mdx');
    return localPathLion === normalizedLocalPathExt;
  });
  return overrideMdx;
}

// let globalOverrideConfig; // cached ast
// function getGlobalOverrideConfig(globalOverrideMdxSource) {
//   if (globalOverrideConfig === undefined) {
//     if (!globalOverrideMdxSource) {
//       globalOverrideConfig = null;
//       return;
//     }
//     const globalOverrideAst = mdxToAst(globalOverrideMdxSource);
//     globalOverrideConfig = createExtendConfig(globalOverrideAst);
//   }
//   return globalOverrideConfig;
// }

/**
 * @desc Merges the overrides for current mdx found in extension
 * @param {string} mdxSource
 * @param {string} overrideMdxSource
 */
function processOverrideMdx(mdxSource, mdxExtendSource) {
  let ast;
  try {
    ast = mdxToAst(mdxSource);
  } catch (e) {
    // We probably used meta.import in our file
    return mdxSource;
  }
  const overrideAst = mdxToAst(mdxExtendSource);
  const overrideConfig = createExtendConfig(overrideAst);
  const replacementAst = createExtendedAst(ast, overrideConfig, mdxSource, mdxExtendSource);
  // Get the result .mdx with all extension overrides
  return astToMdx(replacementAst, mdxSource);
}

function getConvertFileSpecificConfig(configs, url) {
  return configs
    .filter(
      ({ filePath }) =>
        pkgNameLionLayer(url) === pkgNameExtLayer(filePath) ||
        filePath === 'stories/extend-docs.config.js',
    )
    .map(({ config }) => config)
    .reduce((acc, curr) => acc.concat(curr), []);
}

const convertFileSpecifics = (code, cfg, isRollup) => {
  let newCode = code;
  cfg.forEach(replacer => {
    let replacement = replacer.replace;
    if (isRollup && replacer.replace.indexOf("'/") !== -1) {
      replacement = replacer.replace.replace("'/", `'${process.cwd()}/`);
    }
    newCode = newCode.replace(new RegExp(replacer.find, 'g'), replacement);
  });
  return newCode;
};

function convertLionModules(
  code,
  {
    outPrefix,
    currentPackage,
    inPrefix = 'lion',
    componentNames = defaultComponentNames,
    // classNames = defaultClassNames,
    getClassImportPath,
    getTagImportPath,
    getIndexClassImportPath,
    shouldReplaceTagGlobally = () => true,
    shouldReplaceClassGlobally = () => true,
    // rootDir,
    isRollup = false,
    url,
    configs,
    overrideMdxFiles,
    globalOverrideMdxSource,
  },
) {
  // do nothing for packages we don't wanna handle
  if (!processPackages.includes(currentPackage)) {
    return code;
  }

  if (typeof outPrefix !== 'string') {
    throw new Error('You need to provide an outPrefix as a string like "ing"');
  }
  if (typeof currentPackage !== 'string') {
    throw new Error('You need to provide a currentPackage as a string like "input"');
  }

  const settings = {
    currentPackage,
    shouldReplaceTagGlobally,
    shouldReplaceClassGlobally,
    isRollup,
  };
  if (getClassImportPath) {
    settings.getClassImportPath = getClassImportPath;
  }
  if (getTagImportPath) {
    settings.getTagImportPath = getTagImportPath;
  }
  if (getIndexClassImportPath) {
    settings.getIndexClassImportPath = getIndexClassImportPath;
  }

  let outCode = code;

  if (globalOverrideMdxSource) {
    outCode = processOverrideMdx(outCode, globalOverrideMdxSource);
  }
  const overrideMdx = findOverrideMdx(overrideMdxFiles, url);
  if (overrideMdx) {
    outCode = processOverrideMdx(outCode, overrideMdx.source);
  }

  const convertFileSpecificConfig = getConvertFileSpecificConfig(configs, url);
  outCode = convertFileSpecifics(outCode, convertFileSpecificConfig, isRollup);

  componentNames.forEach(componentName => {
    outCode = convertModule(outCode, {
      ...settings,
      inTagName: `${inPrefix}-${componentName}`,
      outTagName: `${outPrefix}-${componentName}`,
    });
  });

  // after all module imports are replaced we can do more generic things
  componentNames.forEach(componentName => {
    const inTagName = `${inPrefix}-${componentName}`;
    const outTagName = `${outPrefix}-${componentName}`;
    // if (shouldReplaceTagGlobally({ outPackageName: currentPackage })) {
    outCode = outCode.replace(new RegExp(inTagName, 'g'), outTagName);
    // }
  });

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const cfg = require(path.resolve(process.cwd(), '.storybook/extend-docs.config.js'));
  cfg.forEach(replacer => {
    outCode = outCode.replace(new RegExp(replacer.find, 'g'), replacer.replace);
  });

  // if (shouldReplaceTagGlobally({ outPackageName: currentPackage })) {
  //   // replace all remaining tags
  //   outCode = outCode.replace(new RegExp(inTagName, 'g'), outTagName);
  // }

  // if (shouldReplaceClassGlobally({ outPackageName: currentPackage })) {
  //   // replace all remaining Classes
  //   outCode = outCode.replace(new RegExp(inClassName, 'g'), outClassName);
  // }

  // // TODO: This hasn't been tested yet.. non-components may require some other settings..
  // classNames.forEach(className => {
  //   outCode = convertModule(outCode, {
  //     ...settings,
  //     inTagName: `${inPrefix}-${className}`,
  //     outTagName: `${outPrefix}-${className}`,
  //   });
  // });

  // // Make sure all local <.* src="(.*)" are resolved to a path inside @lion
  // outCode = outCode.replace(new RegExp('<.* src="(.*)"', 'g'), ($0, $1) => {
  //   // const lionRoot = path.resolve(rootDir, 'node_modules/@lion');
  //   const lionRoot = path.resolve(__dirname, '../../../');

  //   const diff = path.relative(rootDir, lionRoot);
  //   // When serving as @lion as dependency, we don't have 'packages/' ...
  //   const withoutPackagesFolder = $1.replace('packages/', '');
  //   const replaced = $0.replace($1, path.join(diff, withoutPackagesFolder));
  //   return replaced;
  // });

  return outCode;
}

module.exports = {
  convertLionModules,
};
