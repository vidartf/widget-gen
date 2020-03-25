import * as path from 'path';

import { exec as execSync } from 'child_process';

import { promisify } from 'util';

import { Parser } from './base';

import { IWidget } from '../core';

import { MSet } from '../setMethods';

const exec = promisify(execSync);

// Path to python implementation of the parser
const PYTHON_HELPER = path.resolve(__dirname, 'python_parser.py');

/**
 * Parser for generating widgets from Widget definitions in python.
 */
export class PythonParser extends Parser {
  start(): Promise<void> {
    // This calls out to an implementation in python, that pipes back JSON
    // in our internal format.
    const cmd = `python "${PYTHON_HELPER}" "${this.input}"`;
    return exec(cmd, { windowsHide: true } as any).then(
      ({ stdout, stderr }) => {
        const data = JSON.parse((stdout as any) as string) as IWidget[];
        return this.processDefinitions(data);
      }
    );
  }

  processDefinitions(data: IWidget[]) {
    if (!Array.isArray(data)) {
      throw new Error(`Invalid widget data: ${data}`);
    }
    this._names = new MSet(data.map((w) => w.name));
    for (let def of data) {
      this.processWidget(def);
    }
  }

  processWidget(def: IWidget) {
    let refs = this.resolveInternalRefs(def.properties);
    if (def.inherits) {
      // Include local ancestors in refs
      refs = refs.union(this.widgetNames.intersection(def.inherits));
    }

    let widget: IWidget = {
      ...def,
      localDependencies: [...refs],
      // Default base class:
      inherits: def.inherits ? def.inherits : ['Widget'],
    };
    this._newWidget.emit(widget);
  }

  get widgetNames(): MSet<string> {
    return this._names;
  }

  protected _names: MSet<string>;
}
