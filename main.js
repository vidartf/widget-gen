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
    try {
      run(file, languages && languages.length > 0 ? languages : ['python'], {
        output: cmd.outputdir,
        parserName: cmd.parser,
        templateFile: cmd.template,
        fileExt: cmd.extension,
      });
    } catch (error) {
      console.error(error.message);
    }
  })
  .parse(process.argv);
