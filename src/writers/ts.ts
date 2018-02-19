

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  JSES6Writer
} from './js-es6';

import {
  Parser
} from '../parsers';

import {
  INamedWidget
} from '../core';



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
  onWidget(sender: Parser, data: INamedWidget): void {
    const lines = this.genLines(sender, data);
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
