

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  Writer
} from './base';

import {
  INamedWidget, Parser, AttributeDef, isUnionAttribute, hasWidgetRef
} from '../core';


const HEADER = `
import {
  WidgetModel, DOMWidgetModel,
  WidgetView, DOMWidgetView,
  unpack_models
} from '@jupyter-widgets/base';
`;

const INDENT = '  ';


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



export
class JSES6Writer extends Writer {
  /**
   *
   */
  constructor(output: string) {
    super(output);
  }

  onWidget(sender: Parser, data: INamedWidget): void {
    let lines: string[] = [];
    let {name, inherits, properties} = data;

    if (this.outputMultiple || this.firstOutput) {
      this.firstOutput = false;
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
        lines.push(`import { ${ref} } from './${ref}';`);
      });
    }
    lines.push(
      '', '', // add some empty lines
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
          serializers[key] = '{ deserialize: widgets.unpack_models }';
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
        `${INDENT}${INDENT}...${inherits[0]}.serializers,`,
        ...Object.keys(serializers).map((key) => {
          return `${INDENT}${INDENT}${key}: ${serializers[key]},`;
        }),
        `${INDENT}}`
      );
    }
    lines.push('}');
    lines.push('')  // add an empty line at end

    if (this.outputMultiple) {
        let fname = path.join(this.output, `${name}.js`);
        this.modules.push(name);
        fs.writeFileSync(fname, lines.join('\n'));
      } else {
        fs.appendFileSync(this.output, lines.join('\n'));
      }
  }

  finalize(): Promise<void> {
    if (this.outputMultiple) {
      // Write init file for directory output
      let fname = path.join(this.output, `index.js`);
      let lines = this.modules.map((name) => {
        return `export { ${name} } from './${name}';`;
      });
      lines.push('');  // add an empty line at end
      return fs.writeFile(fname, lines.join('\n'));
    }
    return Promise.resolve();
  }

  modules: string[] = [];
}
