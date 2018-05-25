
import * as path from 'path';

import {
  TemplateWriter, TemplateState
} from './template';

import {
  Attributes, IWidget
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
      let parsed_str = '';
      const split = str.split("_");
      for (let word of split) {
        parsed_str += word.charAt(0).toUpperCase() + word.slice(1);
      }
      return parsed_str;
    });
    this.env.addFilter('fromlower', function(str) {
      return str.charAt(0).toLowerCase() + str.slice(1);
    });
  }

  /**
   * Write out a sequence of widget definitions to disk.
   *
   * @param filename The filename to save to.
   * @param widgets The widget definitions to write.
   */
  write(filename: string, widgets: IWidget[]): void {
    if (widgets.length > 1 && !this.outputMultiple) {
      throw new Error('Cannot write multiple widget definitions to one Java file!');
    }
    return super.write(filename, widgets);
  }

  javatype(attr: Attributes.Attribute): string {
    if (!attr) {
      return 'Object';
    }
    switch(attr.type) {
    case 'string': {
      return 'String';
    }
    case 'boolean': {
      return 'boolean';
    }
    case 'int': {
      return 'int';
    }
    case 'float': {
      return 'double';
    }
    case 'array': {
      return 'List';
    }
    case 'object': {
      return 'Map<String, Serializable>';
    }
    case 'widgetRef': {
      if (Array.isArray(attr.widgetType)) {
        // For widget refs that can be one of multiple types,
        // use the known common base:
        return 'Widget';
      }
      return attr.widgetType;
    }
    default: {
      return 'Object';
    }
    }
  }

  transformState(data: TemplateState): TemplateState {
    data = super.transformState(data);
    data.package = '<placeholderPackageName>';
    data.widgets = data.widgets.map((widget) => {
      let {properties} = widget;
      return {
        ...widget,
        properties: properties ? Object.keys(properties).reduce((res, key) => {
          let attr = properties![key];
          res[key] = {
            ...attr,
            javatype: this.javatype(attr),
            defaultValue: formatDefault(attr),
          }
          return res;
        }, {} as TemplateState) : properties,
      };
    });
    return data;
  }

  finalize(): Promise<void> {
    return super.finalize();
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

      // Use the default from the first possible union type:
      res = formatDefault(data.oneOf[0], true);

    } else {

      switch (data.type) {

      case 'object':
        if (data.default === null || data.default === undefined) {
          res = 'null';
        } else {
          const lines = [];
          lines.push('new HashMap<String, Serializable>()')
          // This should also get an initializer if there is a default value!
          const keys = Object.keys(data.default);
          if (keys.length > 0) {
            lines.push('  {');
            for (let key of keys) {
              lines.push(`    put("${key}", ${formatDefault(data.default[key])})`);
            }
            lines.push('  }');
          }
          res = lines.join('\n');
        }
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
        if (data.default === null || data.default === undefined) {
          res = 'null';
        } else {
          res = `new ${data.widgetType}()`;
        }
        break;

      case 'ndarray':
        // TODO: Make a Java package for ipydatawidgets
        res = `null`;
        break;

      case 'dataunion':
      // TODO: Make a Java package for ipydatawidgets
        res = `null`;
        break;

      default:
        res = convertValue(data.default);
      }
    }
  }
  return res;
}
