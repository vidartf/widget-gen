'use strict';

const path = require('path');
const fse = require('fs-extra');

const scriptDir = __dirname;
const baseDir = path.resolve(scriptDir, '..');
const srcDir = path.resolve(baseDir, 'src');
const buildDir = path.resolve(baseDir, 'lib');

function copyParserHelpers() {
  return fse
    .copy(
      path.resolve(srcDir, 'parsers', 'python_parser.py'),
      path.resolve(buildDir, 'parsers', 'python_parser.py')
    )
    .then(function () {
      console.log('Copied python parser helper to lib folder');
    });
}

if (require.main === module) {
  // This script copies files after a build
  Promise.all([copyParserHelpers()]);
}
