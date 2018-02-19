

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  Writer
} from '../base';

import {
  Parser
} from '../../parsers';

import {
  INamedWidget, hasWidgetRef
} from '../../core';

import {
  getDefaultValue
} from './utils';


//  The common header to put at the top of each generated file
const HEADER = `
import {
  WidgetModel, DOMWidgetModel,
  WidgetView, DOMWidgetView,
  unpack_models
} from '@jupyter-widgets/base';
`;

//  The indentation to use
export
const INDENT = '  ';



/**
 * Javascript ES6 code writer.
 */
export
class JSES6Writer extends Writer {
  constructor(output: string) {
    super(output);
    if (!this.outputMultiple) {
      // Clear the file
      fs.writeFileSync(this.output, '');
    }
  }

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
  genLines(sender: Parser, data: INamedWidget, header?: string): string[] {
    if (header === undefined) {
      header = HEADER;
    }
    const lines: string[] = [];
    let {name, inherits, properties} = data;

    if (this.outputMultiple || this.firstWidget) {
      this.firstWidget = false;
      lines.push(...header.split('\n'));
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
        ...this.genSerializers(inherits, serializers),
      );
    }
    lines.push('}');
    lines.push('')  // add an empty line at end
    return lines;
  }

  /**
   * Generate lines for a static serializers attribute
   * @param inherits The ancestors of the widget
   * @param serializers Map of serializers to use
   */
  protected genSerializers(inherits: string[], serializers: {[key: string]: string}): string[] {
    return [
      `${INDENT}serializers = {`,
      `${INDENT}${INDENT}...${inherits[0]}Model.serializers,`,
      ...Object.keys(serializers).map((key) => {
        return `${INDENT}${INDENT}${key}: ${serializers[key]},`;
      }),
      `${INDENT}}`,
    ];
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
