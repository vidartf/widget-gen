

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  Writer
} from './base';

import {
  Parser
} from '../parsers';

import {
  INamedWidget, AttributeDef, isUnionAttribute, hasWidgetRef
} from '../core';


//  The common header to put at the top of each generated file
const HEADER = `
import {
  WidgetModel, DOMWidgetModel,
  WidgetView, DOMWidgetView,
  unpack_models
} from '@jupyter-widgets/base';
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
 * Javascript ES6 code writer.
 */
export
class JSES6Writer extends Writer {

  /**
   * Process the widget definition
   */
  onWidget(sender: Parser, data: INamedWidget): void {
    const lines = this.genLines(sender, data);

    if (this.outputMultiple) {
        let fname = path.join(this.output, `${name}.js`);
        this.modules.push(name);
        fs.writeFileSync(fname, lines.join('\n'));
      } else {
        fs.appendFileSync(this.output, lines.join('\n'));
      }
  }

  /**
   * Convert the widget definition into code lines.
   */
  genLines(sender: Parser, data: INamedWidget): string[] {
    const lines: string[] = [];
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
        lines.push(`import { ${ref}Model } from './${ref}';`);
      });
    }
    lines.push(
      '', '', // add some empty lines
      'export',
      `class ${name}Model extends ${inherits[0]}Model {`,
      '',
    )
    let serializers: {[key: string]: string} = {};
    lines.push(
      `${INDENT}defaults() {`,
      `${INDENT}${INDENT}return {...super.defaults(), ...{`,
    );
    if (properties) {
      for (let key of Object.keys(properties)) {
        lines.push(
          `${INDENT}${INDENT}${INDENT}${key}: ${getDefaultValue(properties[key])},`);
        if (hasWidgetRef(properties[key])) {
          serializers[key] = '{ deserialize: unpack_models }';
        }
      }
    }
    lines.push(
      `${INDENT}${INDENT}}}`,
      `${INDENT}}`,
      ``,
    );

    if (Object.keys(serializers).length) {
      lines.push(
        `${INDENT}serializers = {`,
        `${INDENT}${INDENT}...${inherits[0]}Model.serializers,`,
        ...Object.keys(serializers).map((key) => {
          return `${INDENT}${INDENT}${key}: ${serializers[key]},`;
        }),
        `${INDENT}}`
      );
    }
    lines.push('}');
    lines.push('')  // add an empty line at end
    return lines;
  }

  /**
   * Called when all widgets are parsed. Writes index.js if appropriate.
   */
  finalize(): Promise<void> {
    if (this.outputMultiple) {
      // Write init file for directory output
      let fname = path.join(this.output, `index.js`);
      let lines = this.modules.map((name) => {
        return `export { ${name}Model } from './${name}';`;
      });
      lines.push('');  // add an empty line at end
      return fs.writeFile(fname, lines.join('\n'));
    }
    return Promise.resolve();
  }

  /**
   * An array of all the module names written to disk if multi-output.
   */
  modules: string[] = [];
}
