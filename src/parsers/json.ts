
import * as fs from 'fs-extra';

import {
  Parser
} from './base';

import {
  IDefinition, translatePropertiesToInternal
} from './formatTypes'

import {
  IWidget
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
    return fs.readFile(this.input).then((f) => {
      this.processDefinition(JSON.parse(f.toString()) as IDefinition);
    });
  }

  processDefinition(data: IDefinition) {
    if (data.widgets === undefined) {
      throw new Error('Missing "widgets" key in definition file');
    }
    this._names = new MSet(Object.keys(data.widgets));
    for (let name of Object.keys(data.widgets)) {
      let def = data.widgets[name];
      let properties = translatePropertiesToInternal(def.properties);
      let refs = this.resolveInternalRefs(properties);
      if (def.inherits) {
        // Include local ancestors in refs
        refs = refs.union(this.widgetNames.intersection(def.inherits));
      }

      let widget: IWidget = {
        ...def,
        properties,
        name,
        localDependencies: [...refs],
        // Default base class:
        inherits: def.inherits ? def.inherits : ['Widget'],
      };
      this._newWidget.emit(widget);
    }
  }

  get widgetNames(): MSet<string> {
    return this._names;
  }

  protected _names: MSet<string>;
}


