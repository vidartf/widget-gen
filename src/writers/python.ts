

import * as fs from 'fs-extra';

import * as path from 'path';

import {
  TemplateWriter, TemplateState
} from './template';

import {
  Attributes, hasWidgetRef,
} from '../core';


const INDENT = '    ';


export
class PythonWriter extends TemplateWriter {
  /**
   *
   */
  constructor(output: string, options: Partial<TemplateWriter.IOptions> = {}) {
    super(output, {
      fileExt: 'py',
      template: path.resolve(__dirname, '../../templates/python.njk'),
      ...options,
    });
  }

  transformState(data: TemplateState): TemplateState {
    data = super.transformState(data);
    data.widgets = data.widgets.map((widget) => {
      let {properties} = widget;
      return {
        ...widget,
        properties: properties ? Object.keys(properties).reduce((res, key) => {
          let attr = properties![key];
          res[key] = {
            ...attr,
            traitDef: makeTrait(attr),
          }
          return res;
        }, {} as TemplateState) : properties,
      };
    });
    return data;
  }

  finalize(): Promise<void> {
    return super.finalize().then(() =>{
      if (this.outputMultiple) {
        // Write init file for directory output
        let fname = path.join(this.output, `__init__.py`);
        let lines = this.modules.map((name) => {
          return `from .${name} import ${name}`;
        });
        lines.push('');  // add an empty line at end
        return fs.writeFile(fname, lines.join('\n'));
      }
    });
  }
}



function convertValue(value: any): string {
  if (value === true) {
    return 'True';
  } else if (value === false) {
    return 'False';
  } else if (value === null) {
    return 'None';
  } else if (value === undefined) {
    return '';
  } else if (Array.isArray(value)) {
    return `[${value.map(v => convertValue(v)).join(', ')}]`;
  } else if (typeof value === 'string') {
    return `'${value.toString()}'`;
  }
  return value.toString();
}


function makeTrait(data: Attributes.Attribute, innerTrait=false): string {
  let traitDef: string = 'Any()';
  let tag = '.tag(sync=True)'

  if (data === null) {

    traitDef = 'Any(None, allow_none=True)';

  } else if (data === undefined) {

    traitDef = 'Any(Undefined)';

  } else if (typeof data === 'string') {

    traitDef = `Unicode(${convertValue(data)})`;

  } else if (typeof data === 'number') {

    if (Number.isInteger(data)) {
      traitDef = `Int(${data})`;
    } else {
      traitDef = `Float(${data})`;
    }

  } else if (typeof data === 'boolean') {

    traitDef = `Bool(${convertValue(data)})`

  } else {

    // JSON object
    if (data.help) {
      tag = `.tag(sync=True, help='${data.help}')`
    }
    let allowNoneArg = '';
    if (data.allowNull !== undefined && data.allowNull !== false) {
      allowNoneArg = `, allow_none=${convertValue(data.allowNull)}`;
    }
    if (Attributes.isUnion(data)) {

      const defs = data.oneOf.map((subdata) => makeTrait(subdata, true));
      traitDef = `Union([\n${INDENT}${INDENT}${defs.join(`,\n${INDENT}${INDENT}`)}\n${INDENT}]${allowNoneArg})`;

    } else {

      let defValue = convertValue(data.default);
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
        let defArg;
        if (data.default === undefined) {
          defArg = '';
          // Remove ', ' from start of allowNoneArg
          allowNoneArg = allowNoneArg.slice(2);
        } else {
          defArg = `default_value=${defValue}`;
        }
        traitDef = `Dict(${defArg}${allowNoneArg})`;
        break;

      case 'array':
        let items = data.items;
        if (items === undefined) {
          traitDef = `Tuple(${defValue}${allowNoneArg})`;
        } else if (Array.isArray(items)) {
          let lines = [];
          for (let item of items) {
            lines.push(makeTrait(item, true));
          }
          if (defValue) {
            lines.push(`default_value=${defValue}`)
          }
          if (allowNoneArg) {
            lines.push(allowNoneArg.slice(2));
          }
          traitDef = (
            `Tuple(\n` +
            `${INDENT}${INDENT}${lines.join(`,\n${INDENT}${INDENT}`)}\n` +
            `${INDENT})`
          );
        } else {
          traitDef = `List(${makeTrait(items, true)}${defValue ? `, default_value=${defValue}` : ''}${allowNoneArg})`
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
        tag = tag.slice(0, tag.length - 1) + ', **array_serialization)';
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
        tag = tag.slice(0, tag.length - 1) + ', **data_union_serialization)';
        break;

      default:
        throw new Error(`Unknown type: ${(data as any).type}`);
      }
    }
  }
  if (innerTrait) {
    return traitDef;
  } else if (hasWidgetRef(data)) {
    tag = tag.slice(0, tag.length - 1) + ', **widget_serialization)';
  }
  return traitDef + tag;
}
