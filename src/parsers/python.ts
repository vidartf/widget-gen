
import * as path from 'path';

import {
  exec as execSync
} from 'child_process';

import {
  promisify
} from 'util';

import {
  Parser
} from './base';

import {
  IDefinition, INamedWidget
} from '../core';

import {
  MSet
} from '../setMethods';

const exec = promisify(execSync);

// Path to python implementation of the parser
let PYTHON_HELPER = path.resolve(__dirname, 'python_parser.py');


/**
 * Parser for generating widgets from Widget definitions in python.
 */
export
class PythonParser extends Parser {

  start(): Promise<void> {
    return exec(`python "${PYTHON_HELPER}" "${this.filename}"`, {windowsHide: true} as any).then(({stdout, stderr}) => {
      const data = JSON.parse(stdout as any as string) as IDefinition;
      if (data.widgets === undefined) {
        throw new Error('Missing "widgets" key in definition file');
      }
      this._names = new MSet(Object.keys(data.widgets));
      for (let name of Object.keys(data.widgets)) {
        let namedDef: INamedWidget = {
          ...data.widgets[name],
          name: name,
        };
        this._newWidget.emit(namedDef);
      }
    });
  }

  get widgetNames(): MSet<string> {
    return this._names;
  }

  protected _names: MSet<string>;
}
