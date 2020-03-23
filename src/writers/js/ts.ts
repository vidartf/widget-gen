import * as path from 'path';

import { JSES6Writer } from './js-es6';

import { BaseJSWriter } from './base';

/**
 * Write typescript code.
 *
 * Extends the ES6 writer as TS is a superset of ES6.
 */
export class TSWriter extends JSES6Writer {
  constructor(output: string, options: Partial<BaseJSWriter.IOptions> = {}) {
    super(output, {
      template: path.resolve(__dirname, '../../../templates/ts.njk'),
      fileExt: 'ts',
      ...options,
    });
  }
}
