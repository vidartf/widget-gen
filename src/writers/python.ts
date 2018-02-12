

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  Writer
} from './base';

import {
  INamedWidget, Parser, AttributeDef, isUnionAttribute, hasWidgetRef,
} from '../core';


const HEADER = `
from traitlets import (
    Unicode, Enum, Instance, Union, Float, Int, List, Tuple, Dict,
    Undefined, Bool, Any
)
from ipywidgets import Widget, DOMWidget
from ipydatawidgets import (
    NDArray, DataUnion, shape_constraints, array_serialization,
    data_union_serialization
)
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

    if (this.outputMultiple || this.firstOutput) {
      this.firstOutput = false;
      lines.push(...HEADER.split('\n'));
    }
    if (this.outputMultiple) {
      let refs = sender.resolveInternalRefs(data);
      if (data.inherits) {
        let localSuper = sender.widgetNames.intersection(data.inherits);
        refs = refs.union(localSuper);
      }
      console.debug(`${name} depends on: ${[...refs].join(', ')}`);
      refs.forEach((ref) => {
        lines.push(`from .${ref} import ${ref}`)
      });
    }

    lines.push(
      '', '',  // add some empty lines
      `class ${name}(${(inherits || ['Widget']).join(', ')}):`,
      '',
    )
    if (properties) {
      for (let key of Object.keys(properties)) {
        let traitDef = properties[key];
        let start = `${INDENT}${key} = `;
        let trait = makeTrait(traitDef);
        lines.push(...(start + trait).split('\n'));
        lines.push('')  // add empty lines between traits
      }
    } else {
      lines.push(`${INDENT}pass`);
    }
    lines.push('');  // add an empty line at end

    if (this.outputMultiple) {
      let fname = path.join(this.output, `${name}.py`);
      this.modules.push(name);
      fs.writeFileSync(fname, lines.join('\n'));
    } else {
      fs.appendFileSync(this.output, lines.join('\n'));
    }
  }

  finalize(): Promise<void> {
    if (this.outputMultiple) {
      // Write init file for directory output
      let fname = path.join(this.output, `__init__.py`);
      let lines = this.modules.map((name) => {
        return `from .${name} import ${name}`;
      });
      lines.push('');  // add an empty line at end
      return fs.writeFile(fname, lines.join('\n'));
    }
    return Promise.resolve();
  }

  modules: string[] = [];
}


function convertBoolean(value: any): string {
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


function makeTrait(data: AttributeDef, innerTrait=false): string {
  let traitDef: string = 'Any()';
  let tag = '.tag(sync=True)'

  if (data === null) {

    traitDef = 'Any(None, allow_none=True)';

  } else if (data === undefined) {

    traitDef = 'Any(Undefined)';

  } else if (typeof data === 'string') {

    traitDef = `Unicode('${data}')`;

  } else if (typeof data === 'number') {

    if (Number.isInteger(data)) {
      traitDef = `Int(${data})`;
    } else {
      traitDef = `Float(${data})`;
    }

  } else if (typeof data === 'boolean') {

    traitDef = `Bool(${convertBoolean(data)})`

  } else {

    // JSON object
    if (data.help) {
      tag = `.tag(sync=True, help='${data.help}')`
    }
    let allowNoneArg = '';
    if (data.allowNull !== undefined) {
      allowNoneArg = `, allow_none=${convertBoolean(data.allowNull)}`;
    }
    if (isUnionAttribute(data)) {

      const defs = data.oneOf.map((subdata) => makeTrait(subdata, true));
      traitDef = `Union([\n${INDENT}${INDENT}${defs.join(`,\n${INDENT}${INDENT}`)}\n${INDENT}]${allowNoneArg})`;

    } else {

      let defValue = data.default;
      if (defValue === null) {
        defValue = 'None';
      } else if (defValue === undefined) {
        defValue = '';
      } else if (defValue === true) {
        defValue = 'True';
      } else if (defValue === false) {
        defValue = 'False'
      }
      switch (data.type) {

      case 'int':
        traitDef = `Int(${defValue}${allowNoneArg})`;
        break;

      case 'float':
        traitDef = `Float(${defValue}${allowNoneArg})`;
        break;

      case 'boolean':
        traitDef = `Bool(${defValue}${allowNoneArg})`;
        break;

      case 'string':
        traitDef = `Unicode(${defValue}${allowNoneArg})`;
        break;

      case 'object':
        traitDef = `Dict(${defValue}${allowNoneArg})`;
        break;

      case 'array':
        let items = data.items;
        if (items === undefined) {
          traitDef = `Tuple(${defValue}${allowNoneArg})`;
        } else if (Array.isArray(items)) {
          let itemDefs = [];
          for (let item of items) {
            itemDefs.push(makeTrait(item, true));
          }
          traitDef = (
            `Tuple((\n` +
              `${INDENT}${INDENT}${itemDefs.join(`,\n${INDENT}${INDENT}`)}\n` +
            `${INDENT})${allowNoneArg})`
          );
        } else {
          traitDef = `List(${makeTrait(items, true)}${allowNoneArg})`
        }
        break;

      case 'widgetRef':
        let type = data.widgetType;
        if (Array.isArray(type)) {
          const instances = type.map(function(typeName) {
            return `${INDENT}${INDENT}Instance(${typeName})`;
          });
          traitDef = 'Union([\n' + instances.join(',\n') + `\n${INDENT}]${allowNoneArg})`;
        } else {
          traitDef = `Instance(${type}${allowNoneArg})`;
        }
        break;

      case 'ndarray':
        var {shape, dtype} = data;
        let dtypeStr = '', shapeStr = '';
        if (dtype) {
          dtypeStr = `dtype=${dtype}`;
        }
        if (shape) {
          let pyShape = shape.map((entry) => {
            return entry === null ? 'None' : entry;
          });
          shapeStr = `.valid(shape_constraints(${pyShape.join(', ')}))`;
        }
        traitDef = `NDArray(${dtypeStr}${allowNoneArg})${shapeStr}`;
        break;

      case 'dataunion':
        var {shape, dtype} = data;
        let parts = [];
        if (defValue !== '') {
          parts.push(`${defValue}`);
        }
        if (dtype) {
          parts.push(`dtype=${dtype}`);
        }
        if (shape) {
          let pyShape = shape.map((entry) => {
            return entry === null ? 'None' : entry;
          });
          parts.push(`shape_constraint=shape_constraints(${pyShape.join(', ')}))`);
        }
        traitDef = `DataUnion(${parts.join(', ')}${allowNoneArg})`;
        break;

      default:
        throw new Error(`Unknown type: ${(data as any).type}`);
      }
    }
  }
  if (innerTrait) {
    return traitDef;
  } else if (hasWidgetRef(data)) {
    console.log('Has widget reference!')
    tag = tag.slice(0, tag.length - 1) + ', **widget_serialization)';
  }
  return traitDef + tag;
}
