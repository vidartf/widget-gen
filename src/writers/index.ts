

import {
  IWriterConstructor
} from './base';

import {
  PythonWriter
} from './python';

import {
  JSWriter
} from './js';


export {
  Writer, IWriterConstructor
} from './base';

export
let writers: {[key: string]: IWriterConstructor| undefined} = {
  python: PythonWriter,
  js: JSWriter,
  javascript: JSWriter,
}