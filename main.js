
require('source-map-support').install()

const program = require('commander');

const run = require('./lib/run').run;
const version = require('./package.json').version;


program
  .version(version)
  .option('-o, --outputdir [outputdir]', 'The output directory')
  .arguments('<file> [languages...]')
  .action(function(file, languages, cmd) {
    run(file, languages || ['python'], cmd.outputdir);
  })
  .parse(process.argv)
