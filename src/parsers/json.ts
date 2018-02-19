
import * as fs from 'fs-extra';

import {
  Parser
} from './base';

import {
  IDefinition, INamedWidget
} from '../core';

import {
  MSet
} from '../setMethods';


/**
 * Parser for our custom JSON schema format.
 */
export
class JsonParser extends Parser {

  start(): Promise<void> {
    return fs.readFile(this.filename).then((f) => {
      const data = JSON.parse(f.toString()) as IDefinition;
      if (data.widgets === undefined) {
        throw new Error('Missing "widgets" key in definition file');
      }
      this._names = new MSet(Object.keys(data.widgets));
      for (let widgetName of Object.keys(data.widgets)) {
        let namedDef: INamedWidget = {
          ...data.widgets[widgetName],
          name: widgetName,
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


