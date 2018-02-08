

import {
  Parser
} from './core';

import {
  writers, Writer
} from './writers';


export
function run(filename: string, languages: string[], outputDirectory?: string) {
  outputDirectory = outputDirectory || '.';
  let parser = new Parser(filename);
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
    for (let writer of instances) {
      writer.finalize();
    }
  }).catch((error) => {
    console.log(error);
  });
}
