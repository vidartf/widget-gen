import { Attributes } from '../core';

/**
 * Interface of the JSON definition file root node.
 */
export interface IDefinition {
  widgets: {
    [key: string]: IWidgetJSON;
  };
}

/**
 * A widget definition structure.
 */
export interface IWidgetJSON {
  inherits?: string[];
  properties?: {
    [key: string]: AttributeDef;
  };
  help?: string;
}

/**
 * Base structure for all attribute definitions.
 */
export interface IBaseAttributeJSON {
  help?: string;
  allowNull?: boolean;
}

/**
 * Base structure for all typed attribute definitions.
 */
export interface ITypedAttributeJSON extends IBaseAttributeJSON {
  type: string;
}

/**
 * Array/sequence attribute definition.
 */
export interface IArrayAttributeJSON extends ITypedAttributeJSON {
  type: 'array';
  default?: any[] | null;
  items?: IAttributeJSON[] | IAttributeJSON;
}

/**
 * Widget reference attribute definition.
 */
export interface IWidgetRefAttributeJSON extends ITypedAttributeJSON {
  type: 'widgetRef';
  widgetType: string | string[];
  default?: null;
}

/**
 * Object/hashmap/dictionary attribute definition.
 */
export interface IObjectAttributeJSON extends ITypedAttributeJSON {
  type: 'object';
  default?: any | null;
}

/**
 * String attribute definition.
 */
export interface IStringAttributeJSON extends ITypedAttributeJSON {
  type: 'string';
  default?: string | null;
}

/**
 * Floating point number attribute definition.
 */
export interface IFloatAttributeJSON extends ITypedAttributeJSON {
  type: 'float';
  default?: number | null;
}

/**
 * Integer attribute definition.
 */
export interface IIntegerAttributeJSON extends ITypedAttributeJSON {
  type: 'int';
  default?: number | null;
}

/**
 * Boolean attribute definition.
 */
export interface IBooleanAttributeJSON extends ITypedAttributeJSON {
  type: 'boolean';
  default?: boolean | null;
}

/**
 * Numpy.ndarray-like attribute definition.
 */
export interface INDArrayAttributeJSON extends ITypedAttributeJSON {
  type: 'ndarray';
  default?: any[] | null;
  shape?: number[];
  dtype: string; // TODO: Make enum
}

/**
 * Dataunion attribute definition.
 *
 * See jupyter-datawidgets for details.
 */
export interface IDataUnionAttributeJSON extends ITypedAttributeJSON {
  type: 'dataunion';
  default?: any[] | null;
  shape?: number[];
  dtype: string; // TODO: Make enum
}

/**
 * Union attribute definition.
 */
export interface IUnionAttributeJSON extends IBaseAttributeJSON {
  type: undefined;
  oneOf: NNAttributeDef[];
}

/**
 * An extended attribute definition.
 */
export type IAttributeJSON =
  | IArrayAttributeJSON
  | IObjectAttributeJSON
  | IWidgetRefAttributeJSON
  | IStringAttributeJSON
  | IFloatAttributeJSON
  | IIntegerAttributeJSON
  | IBooleanAttributeJSON
  | IUnionAttributeJSON
  | INDArrayAttributeJSON
  | IDataUnionAttributeJSON;

export type NNAttributeDef = string | number | boolean | IAttributeJSON;

/**
 * An attribute definition.
 */
export type AttributeDef =
  | NNAttributeDef
  | IUnionAttributeJSON
  | null
  | undefined;

export type Properties = { [key: string]: AttributeDef };

/**
 * Check whether the attribute defintion is for a union type.
 */
export function isUnionAttribute(
  data: AttributeDef
): data is IUnionAttributeJSON {
  return (
    !!data &&
    typeof data === 'object' &&
    'oneOf' in data &&
    data.oneOf !== undefined
  );
}

/**
 * Check whether the attribute defintion is for a widget reference type.
 */
export function isWidgetRef(
  data: AttributeDef
): data is IWidgetRefAttributeJSON {
  return (
    !!data &&
    typeof data === 'object' &&
    !isUnionAttribute(data) &&
    data.type === 'widgetRef'
  );
}

/**
 * Check whether the attribute defintion is for an array/sequence type.
 */
export function isArrayAttribute(
  data: AttributeDef
): data is IArrayAttributeJSON {
  return (
    !!data &&
    typeof data === 'object' &&
    !isUnionAttribute(data) &&
    data.type === 'array'
  );
}

/**
 * Check whether the attribute defintion is for an ndarray type.
 */
export function isNDArray(data: AttributeDef): data is INDArrayAttributeJSON {
  return (
    !!data &&
    typeof data === 'object' &&
    !isUnionAttribute(data) &&
    data.type === 'ndarray'
  );
}

/**
 * Check whether the attribute defintion is for an dataunion type.
 */
export function isDataUnion(
  data: AttributeDef
): data is IDataUnionAttributeJSON {
  return (
    !!data &&
    typeof data === 'object' &&
    !isUnionAttribute(data) &&
    data.type === 'dataunion'
  );
}

/**
 * Translate an attribute definition from its form on disk, to the
 * representation used internally (more verbose, no shortcuts).
 *
 * @param attribute The attribute definition to translate.
 * @returns The translated attribute
 */
export function translateToInternal(
  attribute: NNAttributeDef
): Attributes.DefinedAttribute;
export function translateToInternal(attribute: null | undefined): undefined;
export function translateToInternal(
  attribute: AttributeDef
): Attributes.Attribute;
export function translateToInternal(
  attribute: AttributeDef
): Attributes.Attribute {
  if (typeof attribute === 'string') {
    return {
      type: 'string',
      default: attribute,
    } as Attributes.IString;
  } else if (typeof attribute === 'number') {
    if (Number.isInteger(attribute)) {
      return {
        type: 'int',
        default: attribute,
      } as Attributes.IInteger;
    }
    return {
      type: 'float',
      default: attribute,
    } as Attributes.IFloat;
  } else if (typeof attribute === 'boolean') {
    return {
      type: 'boolean',
      default: attribute,
    } as Attributes.IBoolean;
  } else if (attribute === null) {
    throw new Error('Property is simply defined as "null", which is invalid');
  } else if (attribute === undefined) {
    return undefined;
  } else if (isUnionAttribute(attribute)) {
    return {
      type: 'union',
      oneOf: attribute.oneOf.map((a) => translateToInternal(a)),
    } as Attributes.IUnion;
  } else if (isArrayAttribute(attribute)) {
    let items: undefined | Attributes.DefinedAttribute[];
    if (attribute.items === undefined) {
      items = undefined;
    } else if (Array.isArray(attribute.items)) {
      items = attribute.items.map((a) => translateToInternal(a));
    } else {
      items = [translateToInternal(attribute.items)];
    }
    return {
      ...attribute,
      items,
    } as Attributes.IArray;
  } else {
    return attribute;
  }
}

export function translatePropertiesToInternal(
  props: Properties | undefined
): Attributes.Properties | undefined {
  if (!props) {
    return props;
  }
  return Object.keys(props).reduce((res, key) => {
    res[key] = translateToInternal(props[key]);
    return res;
  }, {} as { [key: string]: Attributes.Attribute });
}
