import * as fs from 'fs-extra';

import * as path from 'path';

import { BaseJSWriter } from './base';

const INDENT = '  ';

/**
 * Javascript ES5 code writer.
 *
 * Will generate ES5 code, but will have a dependency on underscore
 * for utility functions.
 */
export class JSES5Writer extends BaseJSWriter {
  constructor(output: string, options: Partial<BaseJSWriter.IOptions> = {}) {
    super(output, {
      template: path.resolve(__dirname, '../../../templates/js-es5.njk'),
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
    });
  }
}
