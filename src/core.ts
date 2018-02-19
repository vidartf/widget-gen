
import {
  MSet
} from './setMethods';


/**
 * Interface of the JSON definition file root node.
 */
export
interface IDefinition {
  widgets: {
    [key: string]: IWidgetJSON;
  }
}

/**
 * A widget definition structure.
 */
export
interface IWidgetJSON {
  inherits?: string[];
  properties?: {
    [key: string]: AttributeDef;
  },
  help?: string;
}

/**
 * A widget definition including its own name as a field.
 *
 * Differs from structure on disk by having its name included.
 */
export
interface INamedWidget extends IWidgetJSON {
  name: string;
}

/**
 * Base structure for all attribute definitions.
 */
export
interface IBaseAttributeJSON {
  help?: string;
  allowNull?: boolean;
}

/**
 * Base structure for all typed attribute definitions.
 */
export
interface ITypedAttributeJSON extends IBaseAttributeJSON {
  type: string;
}

/**
 * Array/sequence attribute definition.
 */
export
interface IArrayAttributeJSON extends ITypedAttributeJSON {
  type: 'array';
  default?: any[] | null;
  items?: IAttributeJSON[] | IAttributeJSON;
}

/**
 * Widget reference attribute definition.
 */
export
interface IWidgetRefAttributeJSON extends ITypedAttributeJSON {
  type: 'widgetRef';
  widgetType: string | string[];
  default?: null;
}

/**
 * Object/hashmap/dictionary attribute definition.
 */
export
interface IObjectAttributeJSON extends ITypedAttributeJSON {
  type: 'object';
  default?: any | null;
}

/**
 * String attribute definition.
 */
export
interface IStringAttributeJSON extends ITypedAttributeJSON {
  type: 'string';
  default?: string | null;
}

/**
 * Floating point number attribute definition.
 */
export
interface IFloatAttributeJSON extends ITypedAttributeJSON {
  type: 'float';
  default?: number | null;
}

/**
 * Integer attribute definition.
 */
export
interface IIntegerAttributeJSON extends ITypedAttributeJSON {
  type: 'int';
  default?: number | null;
}

/**
 * Boolean attribute definition.
 */
export
interface IBooleanAttributeJSON extends ITypedAttributeJSON {
  type: 'boolean';
  default?: boolean | null;
}

/**
 * Numpy.ndarray-like attribute definition.
 */
export
interface INDArrayAttributeJSON extends ITypedAttributeJSON {
  type: 'ndarray';
  default?: any[] | null;
  shape?: number[];
  dtype: string;  // TODO: Make enum
}

/**
 * Dataunion attribute definition.
 *
 * See jupyter-datawidgets for details.
 */
export
interface IDataUnionAttributeJSON extends ITypedAttributeJSON {
  type: 'dataunion';
  default?: any[] | null;
  shape?: number[];
  dtype: string;  // TODO: Make enum
}

/**
 * Union attribute definition.
 */
export
interface IUnionAttributeJSON extends IBaseAttributeJSON {
  oneOf: IAttributeJSON[];
}

/**
 * An extended attribute definition.
 */
export
type IAttributeJSON = (
  IArrayAttributeJSON | IObjectAttributeJSON | IWidgetRefAttributeJSON |
  IStringAttributeJSON | IFloatAttributeJSON | IIntegerAttributeJSON |
  IBooleanAttributeJSON | IUnionAttributeJSON | INDArrayAttributeJSON |
  IDataUnionAttributeJSON
);

/**
 * An attribute definition.
 */
export
type AttributeDef = string | number | boolean | null | IAttributeJSON | undefined;


/**
 * Check whether the attribute defintion is for a union type.
 */
export
function isUnionAttribute(attribute: AttributeDef): attribute is IUnionAttributeJSON {
  return !!attribute && typeof attribute === 'object' && 'oneOf' in attribute && attribute.oneOf !== undefined;
}

/**
 * Check whether the attribute defintion is for a widget reference type.
 */
export
function isWidgetRef(data: AttributeDef): data is IWidgetRefAttributeJSON {
  return !!data && typeof data === 'object' &&
    !isUnionAttribute(data) && data.type === 'widgetRef';
}

/**
 * Check whether the attribute defintion is for an array/sequence type.
 */
export
function isArrayAttribute(data: AttributeDef): data is IArrayAttributeJSON {
  return !!data && typeof data === 'object' &&
    !isUnionAttribute(data) && data.type === 'array';
}

/**
 * Find all sub-definitions of an attribute defintion.
 *
 * @export
 * @param {AttributeDef} data The attribute definition
 * @returns {AttributeDef[]} A flattened array of all sub-definitions
 */
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

/**
 * Whether an attribute definition contains a widget reference.
 *
 * Checks all sub-definitions for the presence of a widget reference.
 *
 * @export
 * @param {AttributeDef} data The attribute definition to check
 * @returns {boolean} Whether the attribute definition contains a widget reference
 */
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

/**
 * Get the names of any widget reference contained within an attribute definition.
 *
 * @export
 * @param {AttributeDef} data The atrtibute definition to check
 * @returns {MSet<string>} A set of the names of the referenced widgets.
 */
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
