
import * as fs from 'fs-extra';

import {
  Signal, ISignal
} from '@phosphor/signaling';



export
interface IDefinition {
  widgets: {
    [key: string]: IWidgetJSON;
  }
}

export
interface IWidgetJSON {
  inherits?: string[];
  properties?: {
    [key: string]: AttributeDef;
  },
  help?: string;
}

export
interface INamedWidget extends IWidgetJSON {
  name: string;
}

export
interface IBaseAttributeJSON {
  type: string;
  help?: string;
  allowNull: boolean;
}

export
interface IArrayAttributeJSON extends IBaseAttributeJSON {
  type: 'array';
  default?: any[] | null;
  items: IAttributeJSON[] | IArrayAttributeJSON | undefined;
}

export
interface IWidgetRefAttributeJSON extends IBaseAttributeJSON {
  type: 'widgetRef';
  widgetType: string | string[];
  default?: null;
}

export
interface IObjectAttributeJSON extends IBaseAttributeJSON {
  type: 'object';
  default?: any | null;
}

export
interface IStringAttributeJSON extends IBaseAttributeJSON {
  type: 'string';
  default?: string | null;
}

export
interface IFloatAttributeJSON extends IBaseAttributeJSON {
  type: 'float';
  default?: number | null;
}

export
interface IIntegerAttributeJSON extends IBaseAttributeJSON {
  type: 'int';
  default?: number | null;
}

export
interface IBooleanAttributeJSON extends IBaseAttributeJSON {
  type: 'boolean';
  default?: boolean | null;
}

export
interface IUnionAttributeJSON {
  help?: string;
  allowNull: boolean;
  oneOf: IAttributeJSON[];
}

export
type IAttributeJSON = (
  IArrayAttributeJSON | IObjectAttributeJSON | IWidgetRefAttributeJSON |
  IStringAttributeJSON | IFloatAttributeJSON | IIntegerAttributeJSON |
  IBooleanAttributeJSON | IUnionAttributeJSON
);

export
type AttributeDef = string | number | boolean | null | IAttributeJSON | undefined;


export
function isUnionAttribute(attribute: IAttributeJSON): attribute is IUnionAttributeJSON {
  return 'oneOf' in attribute && attribute.oneOf !== undefined;
}

export
class Parser {
  constructor(protected filename: string) {
  }

  start(): Promise<void> {
    return fs.readFile(this.filename).then((f) => {
      const data = JSON.parse(f.toString()) as IDefinition;
      if (data.widgets === undefined) {
        throw new Error('Missing "widgets" key in definition file');
      }
      for (let widgetName of Object.keys(data.widgets)) {
        let namedDef: INamedWidget = {
          ...data.widgets[widgetName],
          name: widgetName,
        };
        this._newWidget.emit(namedDef);
      }
    });
  }

  get newWidget(): ISignal<this, INamedWidget> {
    return this._newWidget;
  }

  private _newWidget = new Signal<this, INamedWidget>(this);
}
