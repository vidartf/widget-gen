

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  JSES6Writer, INDENT, HEADER as ES6_HEADER
} from './js-es6';

import {
  Parser
} from '../../parsers';

import {
  IWidget
} from '../../core';



const HEADER = `${ES6_HEADER}
import {
  ManagerBase
} from '@jupyter-widgets/base';


/**
 * Type declaration for general widget serializers.
 *
 * Declared in lieu of proper interface in jupyter-widgets.
 */
export interface ISerializers {
  [key: string]: {
      deserialize?: (value?: any, manager?: ManagerBase<any>) => any;
      serialize?: (value?: any, widget?: WidgetModel) => any;
  };
}
`;


/**
 * Write typescript code.
 *
 * Extends the ES6 writer as TS is a superset of ES6.
 */
export
class TSWriter extends JSES6Writer {

  /**
   * Process the widget definition
   */
  onWidget(sender: Parser, data: IWidget): void {
    const lines = this.genLines(sender, data, HEADER);
    let {name} = data;

    if (this.outputMultiple) {
        let fname = path.join(this.output, `${name}.ts`);
        this.modules.push(name);
        fs.writeFileSync(fname, lines.join('\n'));
      } else {
        fs.appendFileSync(this.output, lines.join('\n'));
      }
  }

  /**
   * Generate lines for a static serializers attribute
   * @param inherits The ancestors of the widget
   * @param serializers Map of serializers to use
   */
  protected genSerializers(inherits: string[], serializers: {[key: string]: string}): string[] {
    return [
      `${INDENT}static serializers = {`,
      `${INDENT}${INDENT}...${inherits[0]}Model.serializers,`,
      ...Object.keys(serializers).map((key) => {
        return `${INDENT}${INDENT}${key}: ${serializers[key]},`;
      }),
      `${INDENT}};`,
    ];
  }

  /**
   * Called when all widgets are parsed. Writes index.ts if appropriate.
   */
  finalize(): Promise<void> {
    if (this.outputMultiple) {
      // Write init file for directory output
      let fname = path.join(this.output, `index.ts`);
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
