

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  Writer
} from './base';

import {
  Parser
} from '../parsers';

import {
  INamedWidget, AttributeDef, isWidgetRef, isUnionAttribute
} from '../core';


//  The common header to put at the top of each generated file
const HEADER = `
var _ = require('underscore');
var widgets = require('@jupyter-widgets/base');
var WidgetModel = widgets.WidgetModel;
var DOMWidgetModel = widgets.DOMWidgetModel;
var WidgetView = widgets.WidgetView;
var DOMWidgetView = widgets.DOMWidgetView;
`;

//  The indentation to use
const INDENT = '  ';


/**
 * Get the default value formatted for JavaScript
 *
 * @param data The attribute whose default value to use
 */
function getDefaultValue(data: AttributeDef): any {
  if (data === null || data === undefined ||
      typeof data === 'number' || typeof data === 'boolean') {
    return data;
  } else if (typeof data === 'string' ) {
    return `'${data}'`;
  } else if (isUnionAttribute(data)) {
    return getDefaultValue(data.oneOf[0]);
  }
  // JSON object
  return data.default;
}



/**
 * Javascript ES5 code writer.
 *
 * Will generate ES5 code, but will have a dependency on underscore
 * for utility functions.
 */
export
class JSES5Writer extends Writer {

  /**
   * Process the widget definition
   */
  onWidget(sender: Parser, data: INamedWidget): void {
    let lines: string[] = [];
    let {name, inherits, properties} = data;

    if (this.outputMultiple || this.firstWidget) {
      this.firstWidget = false;
      lines.push(...HEADER.split('\n'));
    }

    inherits = inherits || ['Widget'];
    if (inherits.length > 1) {
      console.warn(`Cannot use multiple inheritance for ${name} with JS.` +
        `Dropping ancestors: ${inherits.slice(1)}`);
    }
    if (this.outputMultiple && inherits) {
      let refs = sender.widgetNames.intersection(inherits);
      console.debug(`${name} depends on: ${refs}`);
      refs.forEach((ref) => {
        lines.push(`var ${ref}Model = require('./${ref}').${ref}Model;`);
      });
    }
    lines.push(
      '', '', // add some empty lines
      `var ${name}Model = ${inherits[0]}Model.extend({`,
      '',
    )
    let serializers: {[key: string]: string} = {};
    lines.push(
      `${INDENT}defaults: function() {`,
      `${INDENT}${INDENT}return _.extend(${inherits[0]}.prototype.defaults, {`,
    );
    if (properties) {
      for (let key of Object.keys(properties)) {
        lines.push(
          `${INDENT}${INDENT}${INDENT}${key}: ${getDefaultValue(properties[key])},`);
        if (isWidgetRef(properties[key])) {
          serializers[key] = '{ deserialize: widgets.unpack_models }';
        }
      }
    }
    lines.push(
      `${INDENT}${INDENT}});`,
      `${INDENT}},`,
      ``,
    );

    if (Object.keys(serializers).length) {
      lines.push(
        '}, {',
        `${INDENT}serializers: _.extend({},`,
        `${INDENT}${INDENT}${inherits[0]}Model.serializers,`,
        `${INDENT}${INDENT}{`,
        ...Object.keys(serializers).map((key) => {
          return `${INDENT}${INDENT}${INDENT}${key}: ${serializers[key]}`;
        }),
        `${INDENT}${INDENT}}`,
        `${INDENT})`,
      );
    }
    lines.push('});');
    lines.push('')  // add an empty line at end

    if (this.outputMultiple) {
        lines.push(...makeExports([`${name}Model`]));
        let fname = path.join(this.output, `${name}.js`);
        this.modules.push(name);
        fs.writeFileSync(fname, lines.join('\n'));
      } else {
        lines.push(...makeExports(this.modules.map(name => `${name}Model`)));
        fs.appendFileSync(this.output, lines.join('\n'));
      }
  }

  /**
   * Called when all widgets are parsed. Writes index.js if appropriate.
   */
  finalize(): Promise<void> {
    if (this.outputMultiple) {
      // Write init file for directory output
      let fname = path.join(this.output, `index.js`);
      const lines = [
        'var loadedModules = [',
        ...this.modules.map((name) => {
          return `${INDENT}require('./${name}'),`;
        }),
        '];',
        '',
        '// Re-export all symbols from modules:',
        'for (var i in loadedModules) {',
        `${INDENT}if (loadedModules.hasOwnProperty(i)) {`,
        `${INDENT}${INDENT}var loadedModule = loadedModules[i];`,
        `${INDENT}${INDENT}for (var target_name in loadedModule) {`,
        `${INDENT}${INDENT}${INDENT}if (loadedModule.hasOwnProperty(target_name)) {`,
        `${INDENT}${INDENT}${INDENT}${INDENT}module.exports[target_name] = loadedModule[target_name];`,
        `${INDENT}${INDENT}${INDENT}}`,
        `${INDENT}${INDENT}}`,
        `${INDENT}}`,
        '}',
        '',
      ];
      return fs.writeFile(fname, lines.join('\n'));
    }
    return Promise.resolve();
  }

  /**
   * An array of all the module names written to disk if multi-output.
   */
  modules: string[] = [];
}


/**
 * Utility method for creating a module.exports statement
 *
 * @param {string[]} names The names to export
 * @returns {string[]} Output lines as an array
 */
function makeExports(names: string[]): string[] {
  const lines = [];
  lines.push(
    '',
    'module.exports = {',
    ...names.map((name) => {
      return `${INDENT}${name}: ${name},`;
    }),
    '}',
    '',
  );
  return lines;
}
