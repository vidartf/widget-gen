

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  TemplateWriter, TemplateState
} from '../template';

import {
  IWidget, hasWidgetRef, Attributes
} from '../../core';

import {
  getDefaultValue
} from './utils';


/**
 * Javascript ES6 code writer.
 */
export
class JSES6Writer extends TemplateWriter {
  constructor(output: string, options: Partial<TemplateWriter.IOptions> = {}) {
    if (!options.template) {
      options.template = path.resolve(__dirname, '../../../templates/js-es6.hbs');
    }
    super(output, options);
  }

  transformState(data: TemplateState): TemplateState {
    data.serializers = [];
    data.widgets = data.widgets.map((widget) => {
      let {inherits, properties} = widget;
      if (inherits.length > 1) {
        console.warn(`Cannot use multiple inheritance for ${name} with JS.` +
          `Dropping ancestors: ${inherits.slice(1)}`);
      }
      if (properties) {
        for (let key of Object.keys(properties)) {
          if (Attributes.isDataUnion(properties[key])) {
            data.serializers[key] = 'data_union_serialization';
          } else if (Attributes.isNDArray(properties[key])) {
            data.serializers[key] = 'array_serialization';
          } else if (hasWidgetRef(properties[key])) {
            data.serializers[key] = '{ deserialize: unpack_models }';
          }
        }
      }
      return {
        ...widget,
        properties: properties ? Object.keys(properties).reduce((res, key) => {
          let attr = properties![key];
          res[key] = {
            ...attr,
            default: getDefaultValue(attr),
          }
          return res;
        }, {} as TemplateState) : properties,
        inherits: inherits.slice(0, 1),
      };
    });
    return data;
  }

  filenameForWidget(widget: IWidget): string {
    return path.join(this.output, `${widget.name}.js`);
  }

  filenameForIndex(): string {
    return path.join(this.output, `index.js`);
  }

  /**
   * Called when all widgets are parsed. Writes index.js if appropriate.
   */
  finalize(): Promise<void> {
    return Promise.all([super.finalize(), Promise.resolve().then(() =>{
      if (this.outputMultiple) {
        // Write init file for directory output
        let fname = this.filenameForIndex();
        let lines = this.modules.map((name) => {
          return `export { ${name}Model } from './${name}';`;
        });
        lines.push('');  // add an empty line at end
        return fs.writeFile(fname, lines.join('\n'));
      }
    })]).then(() => {});
  }
}
