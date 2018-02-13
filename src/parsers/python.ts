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


export
class PythonParser extends Parser {

  start(): Promise<void> {
    return exec(`python python_converter.py "${this.filename}"`).then(({stdout, stderr}) => {
      const data = JSON.parse(stdout) as IDefinition;
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
