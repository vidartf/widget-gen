
import {
  MSet
} from './setMethods';


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
  allowNull?: boolean;
}

export
interface IArrayAttributeJSON extends IBaseAttributeJSON {
  type: 'array';
  default?: any[] | null;
  items?: IAttributeJSON[] | IAttributeJSON;
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
interface INDArrayAttributeJSON extends IBaseAttributeJSON {
  type: 'ndarray';
  default?: any[] | null;
  shape?: number[];
  dtype: string;  // TODO: Make enum
}

export
interface IDataUnionAttributeJSON extends IBaseAttributeJSON {
  type: 'dataunion';
  default?: any[] | null;
  shape?: number[];
  dtype: string;  // TODO: Make enum
}

export
interface IUnionAttributeJSON {
  help?: string;
  allowNull?: boolean;
  oneOf: IAttributeJSON[];
}

export
type IAttributeJSON = (
  IArrayAttributeJSON | IObjectAttributeJSON | IWidgetRefAttributeJSON |
  IStringAttributeJSON | IFloatAttributeJSON | IIntegerAttributeJSON |
  IBooleanAttributeJSON | IUnionAttributeJSON | INDArrayAttributeJSON |
  IDataUnionAttributeJSON
);

export
type AttributeDef = string | number | boolean | null | IAttributeJSON | undefined;


export
function isUnionAttribute(attribute: AttributeDef): attribute is IUnionAttributeJSON {
  return !!attribute && typeof attribute === 'object' && 'oneOf' in attribute && attribute.oneOf !== undefined;
}

export
function isWidgetRef(data: AttributeDef): data is IWidgetRefAttributeJSON {
  return !!data && typeof data === 'object' &&
    !isUnionAttribute(data) && data.type === 'widgetRef';
}

export
function isArrayAttribute(data: AttributeDef): data is IArrayAttributeJSON {
  return !!data && typeof data === 'object' &&
    !isUnionAttribute(data) && data.type === 'array';
}

export
function getSubDefinitions(data: AttributeDef): AttributeDef[] {
  let directSubs;
  if (isUnionAttribute(data)) {
    directSubs = data.oneOf;
  } else if (isArrayAttribute(data) && data.items) {
    directSubs = Array.isArray(data.items) ? data.items : [data.items];
  } else {
    return [];
  }
  return directSubs.reduce((cum: AttributeDef[], sub) => {
    return cum.concat(getSubDefinitions(sub));
  }, directSubs);
}

export
function hasWidgetRef(data: AttributeDef): boolean {
  if (isWidgetRef(data)) {
    return true;
  }
  for (let sub of getSubDefinitions(data)) {
    if (isWidgetRef(sub)) {
      return true;
    }
  }
  return false;
}

export
function getWidgetRefs(data: AttributeDef): MSet<string> {
  if (isWidgetRef(data)) {
    return new MSet(Array.isArray(data.widgetType) ? data.widgetType : [data.widgetType]);
  }
  return new MSet(getSubDefinitions(data).reduce((cum: string[], sub) => {
    if (isWidgetRef(sub)) {
      return cum.concat(Array.isArray(sub.widgetType) ? sub.widgetType : [sub.widgetType]);
    }
    return cum;
  }, []));
}
