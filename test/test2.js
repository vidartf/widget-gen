require('source-map-support').install();

const run = require('../lib/run').run;

const rimraf = require('rimraf');

const path = require('path');

const fs = require('fs-extra');

const os = require('os');

const expect = require('chai').expect;

const spawnSync = require('child_process').spawnSync;

function mkdtemp(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/**
 * Test that modules can be imported, and widgets instantiated
 */
function instantiatePythonWidgets(outdir) {
  const cmd = [
    `MODULE_PATH = ${JSON.stringify(path.join(outdir, '__init__.py'))}`,
    `MODULE_NAME = 'module_under_test'`,
    `import importlib`,
    `import sys`,
    `spec = importlib.util.spec_from_file_location(MODULE_NAME, MODULE_PATH)`,
    `module = importlib.util.module_from_spec(spec)`,
    `sys.modules[spec.name] = module`,
    `spec.loader.exec_module(module)`,
    `for w in dir(module):`,
    `    if not w.startswith('_'):`,
    `        getattr(module, w)()`,
  ];
  const res = spawnSync('python', ['-c', cmd.join('\n')], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(res.stderr);
  }
}

describe('test2', () => {
  describe('python', () => {
    it('should generate all the files', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test2.py');
      let outdir = null;
      return mkdtemp('widget-gen')
        .then((d) => {
          outdir = d;
          return run(fname, ['python'], { output: outdir });
        })
        .then(() => {
          return fs.readdir(outdir);
        })
        .then((dirFiles) => {
          return new Promise((resolve, reject) => {
            try {
              expect(dirFiles).to.eql(['A.py', 'B.py', '__init__.py']);
              instantiatePythonWidgets(outdir);
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

  describe('javascript', () => {
    it('should generate all the files', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test2.py');
      let outdir = null;
      return mkdtemp('widget-gen')
        .then((d) => {
          outdir = d;
          return run(fname, ['javascript'], { output: outdir });
        })
        .then(() => {
          return fs.readdir(outdir);
        })
        .then((dirFiles) => {
          return new Promise((resolve, reject) => {
            try {
              expect(dirFiles).to.eql(['A.js', 'B.js', 'index.js']);
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

    it('should generate a single file with all the definitions', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test2.py');
      let outdir = null;
      let outfile = null;
      return mkdtemp('widget-gen')
        .then((d) => {
          outdir = d;
          outfile = path.join(outdir, 'widgets.js');
          return run(fname, ['javascript'], { output: outfile });
        })
        .then(() => {
          return fs.readdir(outdir);
        })
        .then((dirFiles) => {
          return new Promise((resolve, reject) => {
            try {
              expect(dirFiles).to.eql(['widgets.js']);
              const content = fs.readFileSync(outfile, { encoding: 'utf-8' });
              const pattern = /^var (\w(\w|[_0-9])*)Model = (\w(\w|[_0-9])*)Model.extend\({$/gm;
              const names = [];
              let match;
              while ((match = pattern.exec(content))) {
                names.push(match[1]);
              }
              expect(names.sort()).to.eql(['A', 'B']);
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
});
