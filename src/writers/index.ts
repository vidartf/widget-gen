

import {
  IWriterConstructor
} from './base';

import {
  PythonWriter
} from './python';


export {
  Writer, IWriterConstructor
} from './base';

export
let writers: {[key: string]: IWriterConstructor| undefined} = {
  python: PythonWriter,
}