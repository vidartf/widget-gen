
import * as path from 'path';

import {
  Parser, JsonParser, PythonParser
} from './parsers';

import {
  writers, Writer
} from './writers';


function makeParser(filename: string, parserName?: string): Parser {
  if (parserName !== undefined) {
    switch (parserName.toLowerCase()) {
      case 'json':
        return new JsonParser(filename);
      case 'py':
      case 'python':
        return new PythonParser(filename);
      default:
        throw new Error(`Unknown parser name: ${parserName}`);
    }
  }
  switch (path.extname(filename)) {
  case '':
  case '.json':
    return new JsonParser(filename);
  case '.py':
    return new PythonParser(filename);
  default:
    throw new Error(`Unknown file extension for file: ${filename}`);
  }
}

export
function run(filename: string, languages: string[], outputDirectory?: string, parserName?: string) {
  outputDirectory = outputDirectory || '.';
  let parser = makeParser(filename, parserName);
  let instances: Writer[] = [];
  for (let language of languages) {
    let writerCtor = writers[language];
    if (writerCtor === undefined) {
      throw new Error(`Unknown language: ${language}. ` +
        `Valid languages: ${Object.keys(writers)}.`);
    }
    let writer = new writerCtor(outputDirectory);
    instances.push(writer);
    parser.newWidget.connect(writer.onWidget, writer);
  }
  return parser.start().then(() => {
    return Promise.all(instances.map((writer) => {
      return writer.finalize();
    }));
  }).catch((error) => {
    console.log(error);
  });
}
