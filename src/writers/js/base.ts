
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
  constructor(output: string, options: Partial<TemplateWriter.IOptions> = {}) {
    options = {
      fileExt: 'js',
      ...options,
    };
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

  filenameForIndex(): string {
    return path.join(this.output, `index.${this.fileExt}`);
  }
}
