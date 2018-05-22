
import * as path from 'path';

import {
  TemplateWriter, TemplateState
} from './template';

import {
  Attributes,
} from '../core';


/**
 * A writer for Java based widgets
 */
export
class JavaWriter extends TemplateWriter {
  /**
   * Create a Java writer
   */
  constructor(output: string, options: Partial<TemplateWriter.IOptions> = {}) {
    super(output, {
      fileExt: 'java',
      template: path.resolve(__dirname, '../../templates/java.njk'),
      ...options,
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
            traitDef: formatDefault(attr),
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



function convertValue(value: any): string {
  if (value === true) {
    return 'true';
  } else if (value === false) {
    return 'false';
  } else if (value === null) {
    return 'null';
  } else if (value === undefined) {
    return 'null';
  } else if (Array.isArray(value)) {
    return `${value.map(v => convertValue(v)).join(', ')}`;
  } else if (typeof value === 'string') {
    return `"${value.toString()}"`;
  }
  return value.toString();
}


function formatDefault(data: Attributes.Attribute, recursive=false): string {
  let res: string = 'null';

  if (data === null || data === undefined ||
      typeof data === 'string' || typeof data === 'boolean' ||
      typeof data === 'number') {

    // Atrtibute definition is in simplified form
    res = convertValue(data);

  } else {
    // Atrtibute definition is a full specification object
    if (Attributes.isUnion(data)) {

      // TODO: How are union traits specified for Java?
      res = `new ArrayList<>`;

    } else {

      switch (data.type) {

      case 'object':
        // TODO: This should be a dict/hashmap, possibly with a default value
        res = `null`;
        break;

      case 'array':
        let items = data.items;
        if (items === undefined) {
          res = `new ArrayList<>()`;
        } else if (Array.isArray(items)) {
          if (data.default !== undefined) {
            res = (`Arrays.asList(${convertValue(data.default)})`);
          } else {
            res = `new ArrayList<>()`;
          }
        } else {
          res = `Arrays.asList(${formatDefault(items, true)}))`
        }
        break;

      case 'widgetRef':
        res = `new ${data.widgetType}()`;
        break;

      case 'ndarray':
        // TODO: Make a Java package for ipydatawidgets
        res = `null`
        break;

      case 'dataunion':
      // TODO: Make a Java package for ipydatawidgets
        res = `null`
        break;

      default:
        res = convertValue(data.default);
      }
    }
  }
  // Only add terminating semi-colon if not called recursively:
  if (!recursive) {
    res = res + ';';
  }
  return res
}
