
import * as path from 'path';

import {
  exec as execSync
} from 'child_process';

import {
  promisify
} from 'util';

import {
  JsonParser
} from './json';

import {
  IDefinition
} from './formatTypes';

const exec = promisify(execSync);

// Path to python implementation of the parser
const PYTHON_HELPER = path.resolve(__dirname, 'python_parser.py');


/**
 * Parser for generating widgets from Widget definitions in python.
 */
export
class JavaParser extends JsonParser {

  start(): Promise<void> {
    // This calls out to an implementation in python, that pipes back JSON
    // in our custom format, see JsonParser.
    const cmd = `python "${PYTHON_HELPER}" "${this.input}"`;
    return exec(cmd, {windowsHide: true} as any).then(({stdout, stderr}) => {
      const data = JSON.parse(stdout as any as string) as IDefinition;
      return this.processDefinition(data);
    });
  }
}
