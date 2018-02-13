
import {
  Signal, ISignal
} from '@phosphor/signaling';

import {
  INamedWidget, getWidgetRefs
} from '../core';

import {
  MSet
} from '../setMethods';



export
interface IParserConstructor {
  new (filename: string): Parser;
}


export
abstract class Parser {
  constructor(protected filename: string) {
  }

  abstract start(): Promise<void>;

  resolveInternalRefs(data: INamedWidget): MSet<string> {
    let properties = data.properties;
    if (!properties) {
      return new MSet();
    }
    let refs: MSet<string> = new MSet();
    for (let propName of Object.keys(properties)) {
      let prop = properties[propName];
      refs = refs.union(getWidgetRefs(prop));
    }
    return this.widgetNames.intersection(refs);
  }

  get newWidget(): ISignal<this, INamedWidget> {
    return this._newWidget;
  }

  abstract readonly widgetNames: MSet<string>;

  protected _newWidget = new Signal<this, INamedWidget>(this);
}

