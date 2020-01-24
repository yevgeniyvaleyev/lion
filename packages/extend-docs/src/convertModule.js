function defaultGetClassName(tagName) {
  return tagName
    .split('-')
    .reduce((previous, part) => previous + part.charAt(0).toUpperCase() + part.slice(1), '');
}

function defaultGetPackageName({ inTagName }) {
  const parts = inTagName.split('-');
  parts.splice(0, 1);
  return parts.join('-');
}

function defaultGetClassImportPath({ outPackageName, outClassName }) {
  return `../../../../packages/${outPackageName}/src/${outClassName}.js`;
}

function defaultGetIndexClassImportPath({ outPackageName }) {
  return `../../../../packages/${outPackageName}/index.js`;
}

function defaultGetTagImportPath({ outPackageName, outTagName }) {
  return `../../../../packages/${outPackageName}/${outTagName}.js`;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function postProcessPath(path, { isRollup }) {
  let newPath = path;
  if (isRollup && newPath[0] === '/') {
    newPath = `${process.cwd()}${newPath}`;
  }
  return newPath;
}

function replaceIndexJsImports(code, { outPackageName, getIndexClassImportPath, isRollup }) {
  const findRegex = new RegExp(escapeRegExp(`from '../index.js';`), 'g');
  const newPath = getIndexClassImportPath({ outPackageName });
  const finalPath = postProcessPath(newPath, { isRollup });
  return code.replace(findRegex, `from '${finalPath}';`);
}

function replaceSrcJsImports(
  code,
  { inClassName, outClassName, outPackageName, getClassImportPath, isRollup },
) {
  const findRegex = new RegExp(`from '(.*)/${inClassName}.js';`, 'g');
  const newPath = getClassImportPath({ inClassName, outClassName, outPackageName });
  const finalPath = postProcessPath(newPath, { isRollup });
  return code.replace(findRegex, `from '${finalPath}';`);
}

function replaceLocalTagImports(
  code,
  { inTagName, outTagName, outPackageName, getTagImportPath, isRollup },
) {
  const originalPath = `../${inTagName}.js`;
  const findRegex = new RegExp(escapeRegExp(`'${originalPath}';`), 'g');
  const newPath = getTagImportPath({ outTagName, outPackageName, originalPath });
  const finalPath = postProcessPath(newPath, { isRollup });
  return code.replace(findRegex, `'${finalPath}';`);
}

function replaceLionTagImports(
  code,
  { inTagName, outTagName, inPackageName, outPackageName, getTagImportPath, isRollup },
) {
  const originalPath = `@lion/${inPackageName}/${inTagName}.js`;
  const findRegex = new RegExp(`import '${originalPath}';`, 'g');
  const newPath = getTagImportPath({ outTagName, outPackageName, originalPath });
  const finalPath = postProcessPath(newPath, { isRollup });
  return code.replace(findRegex, `import '${finalPath}';`);
}

function replaceLionClassImports(
  code,
  { inPackageName, outPackageName, getIndexClassImportPath, isRollup },
) {
  const findRegex = new RegExp(`'@lion/${inPackageName}';`, 'g');
  const newPath = getIndexClassImportPath({ outPackageName });
  const finalPath = postProcessPath(newPath, { isRollup });
  return code.replace(findRegex, `'${finalPath}';`);
}

function convertModule(
  code,
  {
    inTagName,
    outTagName,
    currentPackage,
    getClassName = defaultGetClassName,
    getClassImportPath = defaultGetClassImportPath,
    getIndexClassImportPath = defaultGetIndexClassImportPath,
    getPackageName = defaultGetPackageName,
    getTagImportPath = defaultGetTagImportPath,
    isRollup,
  },
) {
  if (typeof inTagName !== 'string') {
    throw new Error('You need to provide "inTagName" as a string like "lion-foo-bar"');
  }
  if (typeof outTagName !== 'string') {
    throw new Error('You need to provide "outTagName" as a string like "ing-foo-bar"');
  }
  if (typeof currentPackage !== 'string') {
    throw new Error('You need to provide "currentPackage" as a string like "foo-bar"');
  }

  let outCode = code;
  const inClassName = getClassName(inTagName);
  const outClassName = getClassName(outTagName);
  const inPackageName = getPackageName({ inTagName });
  const outPackageName = inPackageName;

  // const isCurrentPackage = currentPackage === inPackageName;

  const allData = {
    inTagName,
    inClassName,
    inPackageName,
    outTagName,
    outClassName,
    outPackageName,
    getClassImportPath,
    getIndexClassImportPath,
    getTagImportPath,
    isRollup,
  };

  // if (isCurrentPackage) {
  outCode = replaceSrcJsImports(outCode, allData);
  outCode = replaceIndexJsImports(outCode, allData);
  outCode = replaceLocalTagImports(outCode, allData);
  // }
  outCode = replaceLionTagImports(outCode, allData);
  outCode = replaceLionClassImports(outCode, allData);

  return outCode;
}

module.exports = {
  convertModule,
};
