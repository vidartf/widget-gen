require('source-map-support').install();

const run = require('../lib/run').run;

const rimraf = require('rimraf');

const path = require('path');

const fs = require('fs-extra');

const os = require('os');

const expect = require('chai').expect;

function mkdtemp(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe('custom template', () => {
  it('should generate all the files', () => {
    let fname = path.resolve(__dirname, 'definitions', 'test2.py');
    let tname = path.resolve(__dirname, 'custom_template.njk');
    let outdir = null;
    return mkdtemp('widget-gen')
      .then((d) => {
        outdir = d;
        return run(fname, ['ts'], {
          output: outdir,
          templateFile: tname,
        });
      })
      .then(() => {
        return fs.readdir(outdir);
      })
      .then((dirFiles) => {
        return new Promise((resolve, reject) => {
          try {
            expect(dirFiles).to.eql(['A.ts', 'B.ts', 'index.ts']);
            const pattern = /^ {4}this\.foo = 42;$/m;
            dirFiles.forEach((fn) => {
              if (fn === 'index.ts') {
                return;
              }
              const content = fs.readFileSync(path.join(outdir, fn), {
                encoding: 'utf-8',
              });
              expect(pattern.test(content), `file: ${fn}`).to.eql(true);
            });
          } finally {
            rimraf(outdir, (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          }
        });
      });
  });
});
