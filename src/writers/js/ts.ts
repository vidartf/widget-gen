
import * as path from 'path';

import {
  JSES6Writer
} from './js-es6';

import {
  TemplateWriter
} from '../template';

import {
  IWidget
} from '../../core';



/**
 * Write typescript code.
 *
 * Extends the ES6 writer as TS is a superset of ES6.
 */
export
class TSWriter extends JSES6Writer {
  constructor(output: string, options: Partial<TemplateWriter.IOptions> = {}) {
    if (!options.template) {
      options.template = path.resolve(__dirname, '../../../templates/ts.hbs');
    }
    super(output, options);
  }

  filenameForWidget(widget: IWidget): string {
    return path.join(this.output, `${widget.name}.ts`);
  }

  filenameForIndex(): string {
    return path.join(this.output, `index.ts`);
  }
}
