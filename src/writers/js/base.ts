
import * as path from 'path';

import {
  TemplateWriter, TemplateState
} from '../template';

import {
  hasWidgetRef, Attributes
} from '../../core';

import {
  getDefaultValue
} from './utils';


/**
 * Javascript ES6 code writer.
 */
export
class BaseJSWriter extends TemplateWriter {
  constructor(output: string, options: BaseJSWriter.IOptions) {
    super(output, {
      fileExt: 'js',
      ...options,
    });
  }

  transformState(data: TemplateState): TemplateState {
    data = super.transformState(data);
    data.widgets = data.widgets.map((widget) => {
      let {inherits, properties} = widget;
      if (inherits.length > 1) {
        console.warn(`Cannot use multiple inheritance for ${name} with JS.` +
          `Dropping ancestors: ${inherits.slice(1)}`);
      }
      const serializers: {[key: string]: string} = {};
      if (properties) {
        for (let key of Object.keys(properties)) {
          if (Attributes.isDataUnion(properties[key])) {
            serializers[key] = 'data_union_serialization';
          } else if (Attributes.isNDArray(properties[key])) {
            serializers[key] = 'array_serialization';
          } else if (hasWidgetRef(properties[key])) {
            serializers[key] = '{ deserialize: unpack_models }';
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
        serializers,
      };
    });
    return data;
  }

  filenameForIndex(): string {
    return path.join(this.output, `index.${this.fileExt}`);
  }
}


export
namespace BaseJSWriter {

  export
  interface IOptions extends Partial<TemplateWriter.IOptions> {
    template: string;
  }
}
