import * as fs from 'fs-extra';

import * as path from 'path';

import { TemplateWriter, TemplateState } from './template';

import { Attributes, hasWidgetRef } from '../core';

const INDENT = '    ';

export class PythonWriter extends TemplateWriter {
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
      let { properties } = widget;
      return {
        ...widget,
        properties: properties
          ? Object.keys(properties).reduce((res, key) => {
              let attr = properties![key];
              res[key] = {
                ...attr,
                traitDef: this.makeTrait(attr),
              };
              return res;
            }, {} as TemplateState)
          : properties,
      };
    });
    return data;
  }

  finalize(): Promise<void> {
    return super.finalize().then(() => {
      if (this.outputMultiple) {
        // Write init file for directory output
        let fname = path.join(this.output, `__init__.py`);
        let lines = this.modules.map((name) => {
          return `from .${name} import ${name}`;
        });
        lines.push(''); // add an empty line at end
        return fs.writeFile(fname, lines.join('\n'));
      }
    });
  }

  protected convertValue(value: any): string {
    if (value === true) {
      return 'True';
    } else if (value === false) {
      return 'False';
    } else if (value === null) {
      return 'None';
    } else if (value === undefined) {
      return '';
    } else if (Array.isArray(value)) {
      return `[${value.map((v) => this.convertValue(v)).join(', ')}]`;
    } else if (typeof value === 'string') {
      return `'${value.toString()}'`;
    } else if (typeof value === 'object') {
      // Assume this is a Dict trait, inline as JSON string
      return `json.loads('${JSON.stringify(value)}')`;
    }
    return value.toString();
  }

  protected makeTrait(data: Attributes.Attribute, innerTrait = false): string {
    let traitName: string;
    let args: string[] = [];
    let tagArgs = ['sync=True'];
    let joinHorizontal = true;
    let postFixes: string[] = [];
    const outerIndent = innerTrait ? '' : INDENT;

    if (data === undefined) {
      traitName = 'Any'
      args.push('Undefined');
    } else {
      const defValue = this.convertValue(data.default);
      const hasAllowNullArg = data.allowNull !== undefined && data.allowNull !== false;

      if (data.type === 'union') {
        traitName = 'Union';
        joinHorizontal = false;
        const defs = data.oneOf.map((subdata) => this.makeTrait(subdata, true).split(/\n/g).join(`\n${outerIndent}${INDENT}${INDENT}`));
        args.push(
          `[\n${outerIndent}${INDENT}${INDENT}${defs.join(
            `,\n${outerIndent}${INDENT}${INDENT}`
          )}\n${outerIndent}${INDENT}]`
        );
        if (defValue) {
          args.push(`default_value=${defValue}`);
        }
      } else if (data?.enum) {
        // TODO: Figure out a way to combine enum validation with normal traits
        // (probably make our own trait types via mixins)
        traitName = 'Enum';
        joinHorizontal = false;
        args.push([
          `[`,
          ...data.enum.map((v) => `${INDENT}${this.convertValue(v)},`),
          `]`,
        ].join(`\n${outerIndent}${INDENT}`));
        if (defValue !== '' && (data.default !== null || hasAllowNullArg)) {
          args.push(`default_value=${defValue}`);
        }
      } else {
        switch (data.type) {
          case 'any':
            traitName = 'Any';
            if (defValue) {
              args.push(defValue);
            }
            break;

          case 'int':
            traitName = 'Int';
            if (defValue) {
              args.push(defValue);
            }
            break;

          case 'float':
            traitName = 'Float';
            if (defValue) {
              args.push(defValue);
            }
            break;

          case 'boolean':
            traitName = 'Bool';
            if (defValue) {
              args.push(defValue);
            }
            break;

          case 'string':
            traitName = 'Unicode';
            if (defValue) {
              args.push(defValue);
            }
            break;

          case 'object':
            traitName = 'Dict';
            if (data.default !== undefined) {
              args.push(`default_value=${defValue}`);
            }
            break;

          case 'array':
            let items = data.items;
            if (items === undefined) {
              traitName = 'Tuple';
              if (defValue) {
                args.push(defValue);
              }
            } else if (Array.isArray(items)) {
              traitName = 'Tuple';
              joinHorizontal = false;
              for (let item of items) {
                args.push(this.makeTrait(item, true).split(/\n/g).join(`\n${outerIndent}${INDENT}`));
              }
              if (defValue) {
                args.push(`default_value=${defValue}`);
              }
            } else {
              traitName = 'List';
              args.push(this.makeTrait(items, true).split(/\n/g).join(`\n${outerIndent}${INDENT}`));
              if (defValue) {
                args.push(`default_value=${defValue}`);
              }
            }
            break;

          case 'widgetRef':
            let type = data.widgetType;
            if (Array.isArray(type)) {
              const instances = type.map(function (typeName) {
                return `Instance(${typeName})`;
              });
              traitName = 'Union';
              joinHorizontal = false;
              args.push(
                '[\n' +
                instances.join(`,\n${outerIndent}${INDENT}`) +
                `\n${outerIndent}]`
              );
            } else {
              traitName = 'Instance';
              args.push(type);
            }
            break;

          case 'ndarray':
            traitName = 'NDArray';
            var { shape, dtype } = data;
            if (dtype) {
              args.push(`dtype=${dtype}`);
            }
            if (shape) {
              let pyShape = shape.map((entry) => {
                return entry === null ? 'None' : entry;
              });
              postFixes.push(`.valid(shape_constraints(${pyShape.join(', ')}))`)
            }
            tagArgs.push('**array_serialization');
            break;

          case 'dataunion':
            traitName = 'DataUnion';
            var { shape, dtype } = data;
            if (defValue !== '') {
              args.push(`${defValue}`);
            }
            if (dtype) {
              args.push(`dtype=${dtype}`);
            }
            if (shape) {
              let pyShape = shape.map((entry) => {
                return entry === null ? 'None' : entry;
              });
              args.push(
                `shape_constraint=shape_constraints(${pyShape.join(', ')}))`
              );
            }
            tagArgs.push('**data_union_serialization');
            break;

          default:
            throw new Error(`Unknown type: ${(data as any).type}`);
        }
      }
      if (data.allowNull !== undefined && data.allowNull !== false) {
        args.push(`allow_none=${this.convertValue(data.allowNull)}`);
      }
      if (data.help) {
        args.push(`help="""${data.help}"""`);
      }
    }

    let stem: string;
    if (joinHorizontal) {
      stem = `${traitName}(${args.join(', ')})`;
    } else {
      stem = `${traitName}(\n${outerIndent}${INDENT}${args.join(`,\n${outerIndent}${INDENT}`)}\n${outerIndent})`
    }
    if (innerTrait) {
      return stem;
    } else if (hasWidgetRef(data)) {
      tagArgs.push('**widget_serialization');
    }
    return `${stem}.tag(${tagArgs.join(', ')})`;
  }
}
