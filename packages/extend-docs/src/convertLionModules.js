const path = require('path');
const mdxToAst = require('./utils/mdxToAst.js');
const astToMdx = require('./utils/astToMdx.js');
const createOverriddenAst = require('./utils/createOverriddenAst.js');
const createOverrideConfigFromAst = require('./utils/createOverrideConfigFromAst.js');

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

const onlyProcess = ['form-system'];

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

/**
 * @desc Merges the overrides for current mdx found in extension into current mdx
 * @param {string} mdxSource
 * @param {string} overrideMdxSource
 */
function processOverrideMdx(mdxSource, overrideMdxSource) {
  const [ast, overrideAst] = [mdxToAst(mdxSource), mdxToAst(overrideMdxSource)];
  // Adjust the original Lion AST, so that it can be converted back into .mdx with overrides
  const replacementAst = createOverriddenAst(
    ast,
    createOverrideConfigFromAst(overrideAst),
    mdxSource,
  );
  // Get the result .mdx with all extension overrides
  return astToMdx(replacementAst, mdxSource);
}

function getConvertFileSpecificConfig(configs, url) {
  return configs
    .filter(
      ({ filePath }) =>
        pkgNameLionLayer(url) === pkgNameExtLayer(filePath) ||
        filePath === 'stories/convert-modules.config.js',
    )
    .map(({ config }) => config)
    .reduce((acc, curr) => acc.concat(curr), []);
}

const convertFileSpecifics = (code, cfg) => {
  let newCode = code;
  cfg.forEach(replacer => {
    newCode = newCode.replace(new RegExp(replacer.find, 'g'), replacer.replace);
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
    replaceClassGlobally,
    shouldReplaceTagGlobally = () => true,
    shouldReplaceClassGlobally = () => true,
    rootDir,
    isRollup = false,
    url,
    configs,
    overrideMdxFiles,
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

  const convertFileSpecificConfig = getConvertFileSpecificConfig(configs, url);
  outCode = convertFileSpecifics(code, convertFileSpecificConfig);

  const overrideMdx = findOverrideMdx(overrideMdxFiles, url);
  if (overrideMdx) {
    outCode = processOverrideMdx(outCode, overrideMdx.raw);
    console.log('outCode', outCode);
  }

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

  replaceClassGlobally.forEach(klass => {
    outCode = outCode.replace(
      `Lion${klass}`,
      `${outPrefix.charAt(0).toUpperCase() + outPrefix.substring(1)}${klass}`,
    );
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

  // Make sure all local <.* src="(.*)" are resolved to a path inside @lion
  outCode = outCode.replace(new RegExp('<.* src="(.*)"', 'g'), ($0, $1) => {
    // const lionRoot = path.resolve(rootDir, 'node_modules/@lion');
    const lionRoot = path.resolve(__dirname, '../../../');

    const diff = path.relative(rootDir, lionRoot);
    // When serving as @lion as dependency, we don't have 'packages/' ...
    const withoutPackagesFolder = $1.replace('packages/', '');
    const replaced = $0.replace($1, path.join(diff, withoutPackagesFolder));
    return replaced;
  });

  return outCode;
}

module.exports = {
  convertLionModules,
};
