
import {
  Attributes
} from '../../core';


function formatValue(value: any): string {
  return JSON.stringify(value);
}

/**
 * Get the default value formatted for JavaScript
 *
 * @param data The attribute whose default value to use
 */
export
function getDefaultValue(data: Attributes.Attribute): string {
  if (data === null || data === undefined ||
      typeof data === 'number' || typeof data === 'boolean' ||
      typeof data === 'string') {
    return formatValue(data);
  } else if (Attributes.isUnion(data)) {
    return getDefaultValue(data.oneOf[0]);
  }
  // JSON object
  return formatValue(data.default);
}
