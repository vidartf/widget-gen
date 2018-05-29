
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
function run(filename: string, languages: string[], options: Partial<IOptions>) {
  const {parserName, templateFile, fileExt} = options;
  const output = options.output || '.';
  let parser = makeParser(filename, parserName);
  let instances: Writer[] = [];
  for (let language of languages) {
    let writerCtor = writers[language];
    if (writerCtor === undefined) {
      throw new Error(`Unknown language: ${language}. ` +
        `Valid languages: ${Object.keys(writers)}.`);
    }
    let options: Writer.IOptions = {};
    if (templateFile) {
      options.template = templateFile;
    }
    if (fileExt) {
      options.fileExt = fileExt;
    }
    let writer = new writerCtor(output, options);
    instances.push(writer);
    parser.newWidget.connect(writer.onWidget, writer);
  }
  return parser.start().then(() => {
    return Promise.all(instances.map((writer) => {
      return writer.finalize();
    }));
  }, (error) => {
    console.log(error);
  });
}


export
interface IOptions {
  output: string;
  parserName: string;
  templateFile: string;
  fileExt: string;
}
