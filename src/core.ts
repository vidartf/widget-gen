import { MSet } from './setMethods';

/**
 * A self-contained widget definition.
 */
export interface IWidget {
  properties?: {
    [key: string]: Attributes.Attribute;
  };
  name: string;
  inherits: string[];
  localDependencies: string[];
  help?: string;
}

export namespace Attributes {
  /**
   * Base structure for all attribute definitions.
   */
  export interface IBase {
    type: string;
    help?: string;
    allowNull?: boolean;
    enum?: any[];
  }

  /**
   * Array/sequence attribute definition.
   */
  export interface IArray extends IBase {
    type: 'array';
    default?: any[] | null;
    items?: DefinedAttribute[];
  }

  /**
   * Widget reference attribute definition.
   */
  export interface IWidgetRef extends IBase {
    type: 'widgetRef';
    widgetType: string | string[];
    default?: null;
  }

  /**
   * Object/hashmap/dictionary attribute definition.
   */
  export interface IObject extends IBase {
    type: 'object';
    default?: any | null;
  }

  /**
   * String attribute definition.
   */
  export interface IString extends IBase {
    type: 'string';
    default?: string | null;
  }

  /**
   * Floating point number attribute definition.
   */
  export interface IFloat extends IBase {
    type: 'float';
    default?: number | null;
  }

  /**
   * Integer attribute definition.
   */
  export interface IInteger extends IBase {
    type: 'int';
    default?: number | null;
  }

  /**
   * Boolean attribute definition.
   */
  export interface IBoolean extends IBase {
    type: 'boolean';
    default?: boolean | null;
  }

  /**
   * Any attribute definition.
   */
  export interface IAny extends IBase {
    type: 'any';
    default?: any;
  }

  /**
   * Numpy.ndarray-like attribute definition.
   */
  export interface INDArray extends IBase {
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
  export interface IDataUnion extends IBase {
    type: 'dataunion';
    default?: any[] | null;
    shape?: number[];
    dtype: string; // TODO: Make enum
  }

  /**
   * Union attribute definition.
   */
  export interface IUnion extends IBase {
    type: 'union';
    oneOf: DefinedAttribute[];
    default: any;
  }

  /**
   * An extended attribute definition.
   */
  export type DefinedAttribute =
    | IArray
    | IObject
    | IWidgetRef
    | IString
    | IFloat
    | IInteger
    | IBoolean
    | IAny
    | IUnion
    | INDArray
    | IDataUnion;

  /**
   * An attribute definition.
   */
  export type Attribute = DefinedAttribute | undefined;

  export type Properties = { [key: string]: Attribute };
}

/**
 * Find all sub-definitions of an attribute defintion.
 *
 * @export
 * @param {AttributeDef} data The attribute definition
 * @returns {AttributeDef[]} A flattened array of all sub-definitions
 */
export function getSubDefinitions(
  data: Attributes.Attribute
): Attributes.Attribute[] {
  let directSubs;
  if (data?.type === 'union') {
    directSubs = data.oneOf;
  } else if (data?.type === 'array' && data.items) {
    directSubs = Array.isArray(data.items) ? data.items : [data.items];
  } else {
    return [];
  }
  return directSubs.reduce((cum: Attributes.Attribute[], sub) => {
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
export function hasWidgetRef(data: Attributes.Attribute): boolean {
  if (data?.type === 'widgetRef') {
    return true;
  }
  for (let sub of getSubDefinitions(data)) {
    if (sub?.type === 'widgetRef') {
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
export function getWidgetRefs(data: Attributes.Attribute): MSet<string> {
  if (data?.type === 'widgetRef') {
    return new MSet(
      Array.isArray(data.widgetType) ? data.widgetType : [data.widgetType]
    );
  }
  return new MSet(
    getSubDefinitions(data).reduce((cum: string[], sub) => {
      if (sub?.type === 'widgetRef') {
        return cum.concat(
          Array.isArray(sub.widgetType) ? sub.widgetType : [sub.widgetType]
        );
      }
      return cum;
    }, [])
  );
}
