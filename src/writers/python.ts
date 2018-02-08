

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  Writer
} from './base';

import {
  INamedWidget, Parser, AttributeDef
} from '../core';


const HEADER = `
from trailtets import (
    Unicode, Enum, Instance, Union, Float, Int, List, Tuple, Dict,
    Undefined, Bool
)
from ipywidgets import Widget, DOMWidget
`;

const INDENT = '    ';


export
class PythonWriter extends Writer {
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

    lines.push(
      '', '',  // add some empty lines
      `class ${name}(${(inherits || ['Widget']).join(', ')}):`,
      '',
    )
    if (properties) {
      for (let key of Object.keys(properties)) {
        let traitDef = properties[key];
        let start = `${INDENT}${name} = `;
        let trait = this.makeTrait(traitDef);
        lines.push(...(start + trait).split('\n'));
      }
    } else {
      lines.push(`${INDENT}pass`);
    }

    if (this.outputMultiple) {
      let fname = path.join(this.output, `${name}.py`);
      fs.writeFileSync(fname, lines.join('\n'));
    } else {
      fs.appendFileSync(this.output, lines.join('\n'));
    }
  }

  convertBoolean(value: any): string {
    if (value === true) {
      return 'True';
    } else if (value === false) {
      return 'False';
    } else if (value === null) {
      return 'None';
    } else if (value === undefined) {
      return 'Undefined';
    }
    return value.toString();
  }

  makeTrait(data: AttributeDef): string {
    let traitDef: string = 'Any()';
    let tag = '.tag(sync=True)'

    if (data === null) {
      traitDef = 'Any(None, allow_none=True).tag(sync=True)';
    } else if (data === undefined) {
      traitDef = 'Any(Undefined).tag(sync=True)';
    } else if (typeof data === 'string') {
      traitDef = `Unicode('${data}').tag(sync=True)`;
    } else if (typeof data === 'number') {
      if (Number.isInteger(data)) {
        traitDef = `Int(${data}).tag(sync=True)`;
      } else {
        traitDef = `Float(${data}).tag(sync=True)`;
      }
    } else if (typeof data === 'boolean') {
      traitDef = `Bool(${this.convertBoolean(data)})`
    } else {
      // JSON object
      if (data.help) {
        tag = `.tag(sync=True, help='${data.help}')`
      }
      let defValue = data.default;
      if (defValue === null) {
        defValue = 'None';
      } else if (defValue === undefined) {
        defValue = 'Undefined';
      }
      let allowNoneArg = `allow_none=${this.convertBoolean(data.allowNull)}`;
      switch (data.type) {

      case 'int':
        traitDef = `Int(${defValue}, )`;
        break;

      case 'float':
        traitDef = `Float(${defValue}, ${allowNoneArg})`;
        break;

      case 'boolean':
        if (defValue === true) {
          defValue = 'True';
        } else if (defValue === false) {
          defValue = 'False'
        }
        traitDef = `Bool(${defValue}, ${allowNoneArg})`;
        break;

      case 'string':
        traitDef = `Unicode(${defValue}, ${allowNoneArg})`;
        break;

      case 'object':
        traitDef = `Dict(${defValue}, ${allowNoneArg})`;
        break;

      case 'array':
        let items = data.items;
        if (items === undefined) {
          traitDef = `Tuple(${defValue}, ${allowNoneArg})`;
        } else if (Array.isArray(items)) {
          let itemDefs = [];
          for (let item of items) {
            itemDefs.push(this.makeTrait(item));
          }
          traitDef = (
            `Tuple((\n` +
              `${INDENT}${INDENT}${itemDefs.join(`,\n${INDENT}${INDENT}`)}\n` +
            `${INDENT}), ${allowNoneArg})`
          );
        } else {
          traitDef = `List(${this.makeTrait(items)}, ${allowNoneArg})`
        }
        break;

      case 'widgetRef':
        let type = data.widgetType;
        tag = tag.slice(0, tag.length - 1) + ', **widget_serialization)';
        if (Array.isArray(type)) {
          const instances = type.map(function(typeName) {
            return `${INDENT}${INDENT}Instance(${typeName})`;
          });
          traitDef = 'Union([\n' + instances.join(',\n') + `\n${INDENT}], ${allowNoneArg})`;
        } else {
          traitDef = `Instance(${type}, ${allowNoneArg})`;
        }
        break;

      default:
        throw new Error(`Unknown type: ${(data as any).type}`);
      }
    }

    return traitDef + tag;
  }
}