

import {
  IWriterConstructor
} from './base';

import {
  PythonWriter
} from './python';

import {
  JSES5Writer
} from './js-es5';

import {
  JSES6Writer
} from './js-es6';


export {
  Writer, IWriterConstructor
} from './base';

export
let writers: {[key: string]: IWriterConstructor| undefined} = {
  python: PythonWriter,
  js: JSES5Writer,
  javascript: JSES5Writer,
  'js-es5': JSES5Writer,
  es5: JSES5Writer,
  'js-es6': JSES6Writer,
  es6: JSES6Writer,
}