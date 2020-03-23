#!/usr/bin/env node

require('source-map-support').install();

const program = require('commander');

const run = require('./lib/run').run;
const version = require('./package.json').version;

program
  .version(version)
  // TODO: Add valid parser names automatically:
  .option(
    '-p, --parser [parser]',
    'The name of the parser to use, either "json" or "python".'
  )
  .option('-o, --outputdir [outputdir]', 'The output directory.')
  .option('-t, --template [template]', 'a template file to use.')
  .option(
    '-e, --extension [extension]',
    'The file extension to use for the output.'
  )
  .arguments('<file> [languages...]')
  .action(function (file, languages, cmd) {
    run(file, languages || ['python'], {
      output: cmd.outputdir,
      parserName: cmd.parser,
      templateFile: cmd.template,
      fileExt: cmd.extension,
    });
  })
  .parse(process.argv);
