const path = require('path');
const mdxToAst = require('./utils/mdxToAst.js');
const astToMdx = require('./utils/astToMdx.js');
const safeEval = require('./utils/safeEval.js');

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

// /**
//  * @desc Normalizes complete path
//  * @param {string} lionPath a path inside lion layer
//  */
// function normalizedPathLionLayer(lionPath) {
//   return lionPath.replace(/.*@lion\/(.*?)\//g, '$1');
// }

// /**
//  * @desc Normalizes complete path
//  * Hard requirement: a package name always contains its stories folder on 1st level
//  * @param {string} extPath a path inside your extension layer
//  */
// function normalizedPathExtLayer(extPath) {
//   return extPath.replace(/.*(\/.*\/stories)(.*)/g, '$1');
// }

function getOverrideMDX(overridePaths, url) {
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
 *
 * @param {ASTNode} curNode Node to start from. Will loop over its children
 * @param {function} processOrFindFn Will be executed for every node
 * @param {ASTNode} [parentNode] parent of curNode
 */
// eslint-disable-next-line consistent-return
function walkAst(curNode, processOrFindFn, parentNode = null) {
  processOrFindFn(curNode, parentNode);
  if (curNode.children) {
    curNode.children.forEach(childNode => {
      walkAst(childNode, processOrFindFn, curNode);
    });
  }
}

/**
 * @desc Alters the original AST from @lion/{package}/stories so that it reflects the changes found
 * in {extension-repo}/{package}/stories
 * @param {object} ast @lion AST, for instance @lion/input/stories/index.stories.mdx
 * @param {object} overrideAst override AST {extension}/input/stories/index.stories.override.mdx
 */
function generateReplacementAst(ast, overrideConfig, overrideMdxSource) {
  console.log('generateReplacementAst...');

  function replaceWithOverrides(lionAstNode, parentNode) {
    function getStoryMeta(astNode) {
      const match = astNode.value && astNode.value.match(/<Story .*name="(.*)".*>/);
      if (match) {
        return { name: match[1] };
      }
      return null;
    }

    if (!parentNode) {
      return;
    }
    // console.log('parentNode', parentNode);
    const siblings = parentNode.children;
    if (!siblings) {
      console.log('No siblings, check later......');
      return;
    }
    const nodeIdx = siblings.indexOf(lionAstNode);

    // We only hook into headings and stories
    if (lionAstNode.type === 'heading') {
      /**
       * 1. See if we need to ajust heading in current lionAstNode
       */
      const overrideHeading = overrideConfig.find(override => {
        // eslint-disable-next-line no-unused-vars
        const [_, depth, value] = override.target.match(/(#*)\s+(.*)/) || [];
        console.log(value, lionAstNode.children[0].value);
        return (
          override.type === 'replace-heading' &&
          depth &&
          depth.length === lionAstNode.depth &&
          value === lionAstNode.children[0].value
        );
      });

      if (!overrideHeading) {
        return;
      }
      console.log('overrideHeading', overrideHeading);

      /**
       * 2. Find all siblings of the heading. Stop when
       * find the next h1, h2, or h3, or a story
       */
      const headingScopedSiblings = []; // Keeps track of all siblings found after current
      siblings.slice(nodeIdx + 1).some((node, i) => {
        console.log(i);
        if ((node.type === 'heading' && node.depth < 4) || getStoryMeta(node)) {
          console.log('heading', i);

          // Delete nodes from lionAst, so that we don't write them again
          siblings.splice(nodeIdx, i);
          return true;
        }
        headingScopedSiblings.push(node);
        return false;
      });
      // console.log('headingScopedSiblings', headingScopedSiblings);

      /**
       * 3. Put the result back in the original lion AST
       */
      // Now insert the replaced, raw, mdx node
      // eslint-disable-next-line no-param-reassign
      siblings.splice(nodeIdx, 0, {
        type: 'doc::raw-mdx-output',
        position: {
          // This is needed for astToMdx
          start: siblings[nodeIdx].position.start,
        },
        value: overrideHeading.replaceFn(
          astToMdx({ children: headingScopedSiblings }, overrideMdxSource),
        ),
      });

      // console.log('siblings', siblings);
      // Add our change in lionAst
      // eslint-disable-next-line no-param-reassign
      parentNode.children = siblings;
    } else if (lionAstNode.type === 'jsx') {
      // Try to convert to stpry meta
      const storyMeta = getStoryMeta(lionAstNode);
      if (storyMeta) {
        const overrideStory = overrideConfig.find(
          ({ type, name }) => type === 'story' && name === storyMeta.name,
        );
        if (overrideStory) {
          // parse script, run and attach
          // eslint-disable-next-line no-param-reassign
          siblings.splice(nodeIdx, 2, {
            type: 'doc::raw-mdx-output',
            value: overrideStory.replaceFn(lionAstNode.value),
            // This is needed for astToMdx
            position: {
              start: siblings[nodeIdx].position.start,
            },
          });
        }
      }
    }
  }
  walkAst(ast, replaceWithOverrides);
  return ast;
}

function _createOverrideConfigFromAst(ast) {
  const docCommentNodes = [];
  walkAst(ast, node => {
    if (node.type === 'comment') {
      const match = node.value.match(/\[doc::(.*?)\s+"(.*)"\]((.|\n)*)/);
      if (match) {
        // This will get the replacement script tag
        // const nextSibling = parentNode.children[parentNode.children.indexOf(node) + 1];
        // const fnMatch = nextSibling.value.match(/<script>(.*)<\/script>/);
        // if (!fnMatch) {
        //   // TODO: possibly. later we can allow a syntax for replace/prepend/append/delete
        //   // eslint-disable-next-line no-console
        //   console.warn('Please provide a replacement script');
        //   return;
        // }
        docCommentNodes.push({ type: match[1], target: match[2], replaceFn: safeEval(match[3]) });
      }
    }
  });
  return docCommentNodes;
}

function processOverrideMdx(mdxSource, overrideMdxSource) {
  const [ast, overrideAst] = [mdxToAst(mdxSource), mdxToAst(overrideMdxSource)];
  // Adjust the original @lion AST, so that extension overrides are reflected in ASTNode._newSource
  const overrideConfig = _createOverrideConfigFromAst(overrideAst);
  const replacementAst = generateReplacementAst(ast, overrideConfig, overrideMdxSource);
  // console.log('replacementAst', replacementAst);
  // Get the result .mdx with all extension overrides
  return astToMdx(replacementAst, overrideMdxSource);
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
    overrideMDXFiles,
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

  const overrideMDX = getOverrideMDX(overrideMDXFiles, url);
  if (overrideMDX) {
    outCode = processOverrideMdx(outCode, overrideMDX.mdx);
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
