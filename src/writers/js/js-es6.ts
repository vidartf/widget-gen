import * as fs from 'fs-extra';

import * as path from 'path';

import { BaseJSWriter } from './base';

/**
 * Javascript ES6 code writer.
 */
export class JSES6Writer extends BaseJSWriter {
  constructor(output: string, options: Partial<BaseJSWriter.IOptions> = {}) {
    super(output, {
      template: path.resolve(__dirname, '../../../templates/js-es6.njk'),
      ...options,
    });
  }

  /**
   * Called when all widgets are parsed. Writes index.js if appropriate.
   */
  finalize(): Promise<void> {
    return super.finalize().then(() => {
      if (this.outputMultiple) {
        // Write init file for directory output
        let fname = this.filenameForIndex();
        let lines = this.modules.map((name) => {
          return `export { ${name}Model } from './${name}';`;
        });
        lines.push(''); // add an empty line at end
        return fs.writeFile(fname, lines.join('\n'));
      }
    });
  }
}
