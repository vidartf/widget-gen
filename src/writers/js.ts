

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  Writer
} from './base';

import {
  INamedWidget, Parser, AttributeDef, IWidgetRefAttributeJSON
} from '../core';


const HEADER = `
var _ = require('underscore');
var widgets = require('@jupyter-widgets/base');
var WidgetModel = widgets.WidgetModel;
var DOMWidgetModel = widgets.DOMWidgetModel;
var WidgetView = widgets.WidgetView;
var DOMWidgetView = widgets.DOMWidgetView;

`;

const INDENT = '  ';


function getDefaultValue(data: AttributeDef) {
  if (data === null || data === undefined || typeof data === 'string' ||
      typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  // JSON object
  return data.default;
}

function isWidgetRef(data: AttributeDef): data is IWidgetRefAttributeJSON {
  return !!data && typeof data === 'object' && data.type === 'widgetRef';
}


export
class JSWriter extends Writer {
  /**
   *
   */
  constructor(output: string) {
    super(output);
  }

  onWidget(sender: Parser, data: INamedWidget): void {
    let lines: string[] = [];
    let {name, inherits, properties} = data;

    if (this.firstOutput) {
      this.firstOutput = true;
      lines.push(...HEADER.split('\n'));
    }

    inherits = inherits || ['Widget'];
    if (inherits.length > 1) {
      console.warn(`Cannot use multiple inheritance for ${name} with JS.` +
        `Dropping ancestors: ${inherits.slice(1)}`);
    }
    lines.push(
      '', '',
      `var ${name} = ${inherits[0]}Model.extend({`,
      '',
    )
    let serializers: {[key: string]: string} = {};
    lines.push(
      `${INDENT}defaults: function() {`,
      `${INDENT}${INDENT}return _.extend(${inherits[0]}.prototype.defaults, {`,
    );
    if (properties) {
      for (let key of Object.keys(properties)) {
        lines.push(
          `${INDENT}${INDENT}${INDENT}${key}: ${getDefaultValue(properties[key])},`);
        if (isWidgetRef(properties[key])) {
          serializers[key] = '{ deserialize: widgets.unpack_models }';
        }
      }
    }
    lines.push(
      `${INDENT}${INDENT}});`,
      `${INDENT}},`,
      ``,
    );

    if (Object.keys(serializers)) {
      lines.push(
        '}, {',
        `${INDENT}serializers: _.extend({`,
        ...Object.keys(serializers).map((key) => {
          return `${key}: ${serializers[key]}`;
        }),
        `${INDENT}}, ${inherits[0]}.serializers)`
      );
    }
    lines.push('});');

    if (this.outputMultiple) {
        let fname = path.join(this.output, `${name}.js`);
        fs.writeFileSync(fname, lines.join('\n'));
      } else {
        fs.appendFileSync(this.output, lines.join('\n'));
      }
  }
}
