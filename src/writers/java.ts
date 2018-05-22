
import * as path from 'path';

import {
  TemplateWriter, TemplateState
} from './template';

import {
  Attributes,
} from '../core';


export
class JavaWriter extends TemplateWriter {
  /**
   *
   */
  constructor(output: string, options: Partial<TemplateWriter.IOptions> = {}) {
    super(output, {
      fileExt: 'java',
      template: path.resolve(__dirname, '../../templates/java.njk'),
      ...options,
    });
    this.env.addFilter('uppercase', function(str) {
        return str.toUpperCase( )
    });
    this.env.addFilter('camelcase', function(str) {
        var parsed_str = ""
        var splitted = str.split("_")
        for (let word of splitted) {
            parsed_str += word.charAt(0).toUpperCase() + word.slice(1)
        }
        return parsed_str;
    });
    this.env.addFilter('fromlower', function(str) {
        return str.charAt(0).toLowerCase() + str.slice(1)
    });
    this.env.addFilter('javatypes', function(str) {
        switch(str) {
            case 'string': {
                return 'String'
            }
            case 'boolean': {
                return 'boolean'
            }
            case 'int': {
                return 'int'
            }
            case 'float': {
                return 'double'
            }
            case 'array': {
                return 'List'
            }
            default: {
                return 'Object'
            }
        }
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
    return super.finalize()
  }
}



function convertValue(value: any, valType: any): string {
  if (value === true) {
    return 'true';
  } else if (value === false) {
    return 'false';
  } else if (value === null) {
    return 'null';
  } else if (value === undefined) {
    return 'null';
  } else if (Array.isArray(value)) {
    return `${value.map(v => convertValue(v, typeof v)).join(', ')}`;
  } else if (typeof value === 'string') {
    return `"${value.toString()}"`;
  }
  return value.toString();
}


function makeTrait(data: Attributes.Attribute, innerTrait=false): string {
  let traitDef: string = 'Any()';

  if (data === null) {

    traitDef = 'null;';

  } else if (data === undefined) {

    traitDef = 'null;';

  } else if (typeof data === 'string') {

    traitDef = `"${convertValue(data, 'string')};"`;

  } else if (typeof data === 'number') {

    if (Number.isInteger(data)) {
      traitDef = `${data};`;
    } else {
      traitDef = `${data};`;
    }

  } else if (typeof data === 'boolean') {

    traitDef = `${convertValue(data, 'bool')};`

  } else {
    if (Attributes.isUnion(data)) {
      traitDef = `new ArrayList<>`;

    } else {

      let defValue = convertValue(data.default, typeof data);
      switch (data.type) {

      case 'object':
        traitDef = `null`;
        break;

      case 'array':
        let items = data.items;
        if (items === undefined) {
          traitDef = `new ArrayList<>()`;
        } else if (Array.isArray(items)) {
          if (defValue) {
            traitDef = (`Arrays.asList(${defValue})`);
          } else {
            traitDef = `new ArrayList<>()`;
          }
        } else {
          traitDef = `Arrays.asList(${makeTrait(items, true)}))`
        }
        break;

      case 'widgetRef':
        traitDef = `new ${data.widgetType}()`;
        break;

      case 'ndarray':
        traitDef = `null;`
        break;

      case 'dataunion':
        traitDef = `null;`
        break;

      default:
        traitDef = `${defValue}`;
      }
    }
  }
  return traitDef
}
