
require('source-map-support').install()

const program = require('commander');

const run = require('./lib/run').run;

program
  .arguments('[options] <file> [languages...]')
  .option('-o, --outputdir <outputdir>', 'The output directory')
  .action(function(file, outputdir, languages) {
    run(file, languages || ['python'], outputdir);
  })
  .parse(process.argv);
