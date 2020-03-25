require('source-map-support').install();

const run = require('../lib/run').run;

const rimraf = require('rimraf');

const path = require('path');

const fs = require('fs-extra');

const expect = require('chai').expect;

const { mkdtemp, instantiatePythonWidgets } = require('./util');

describe('test_enum', () => {
  describe('python', () => {
    it('should generate all the files', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test_enum.json');
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
              expect(dirFiles).to.eql([
                'BaseTestWidget.py',
                'EnumExplicitDefault.py',
                'EnumImplicitNullDefault.py',
                'EnumNullDefault.py',
                '__init__.py',
              ]);
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
      let fname = path.resolve(__dirname, 'definitions', 'test_enum.json');
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
              expect(dirFiles).to.eql([
                'BaseTestWidget.js',
                'EnumExplicitDefault.js',
                'EnumImplicitNullDefault.js',
                'EnumNullDefault.js',
                'index.js',
              ]);
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
      let fname = path.resolve(__dirname, 'definitions', 'test_enum.json');
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
              expect(names.sort()).to.eql([
                'BaseTestWidget',
                'EnumExplicitDefault',
                'EnumImplicitNullDefault',
                'EnumNullDefault',
              ]);
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

  describe('ts', () => {
    it('should generate all the files', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test_enum.json');
      let outdir = null;
      return mkdtemp('widget-gen')
        .then((d) => {
          outdir = d;
          return run(fname, ['ts'], { output: outdir });
        })
        .then(() => {
          return fs.readdir(outdir);
        })
        .then((dirFiles) => {
          return new Promise((resolve, reject) => {
            try {
              expect(dirFiles).to.eql([
                'BaseTestWidget.ts',
                'EnumExplicitDefault.ts',
                'EnumImplicitNullDefault.ts',
                'EnumNullDefault.ts',
                'index.ts',
              ]);
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
      let fname = path.resolve(__dirname, 'definitions', 'test_enum.json');
      let outdir = null;
      let outfile = null;
      return mkdtemp('widget-gen')
        .then((d) => {
          outdir = d;
          outfile = path.join(outdir, 'widgets.ts');
          return run(fname, ['ts'], { output: outfile });
        })
        .then(() => {
          return fs.readdir(outdir);
        })
        .then((dirFiles) => {
          return new Promise((resolve, reject) => {
            try {
              expect(dirFiles).to.eql(['widgets.ts']);
              const content = fs.readFileSync(outfile, { encoding: 'utf-8' });
              const pattern = /^class (\w(\w|[_0-9])*?)Model extends (\w(\w|[_0-9])*?)Model \{$/gm;
              const names = [];
              let match;
              while ((match = pattern.exec(content))) {
                names.push(match[1]);
              }
              expect(names.sort()).to.eql([
                'BaseTestWidget',
                'EnumExplicitDefault',
                'EnumImplicitNullDefault',
                'EnumNullDefault',
              ]);
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

  describe('java', () => {
    it('should generate all the files', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test_enum.json');
      let outdir = null;
      return mkdtemp('widget-gen')
        .then((d) => {
          outdir = d;
          return run(fname, ['java'], { output: outdir });
        })
        .then(() => {
          return fs.readdir(outdir);
        })
        .then((dirFiles) => {
          return new Promise((resolve, reject) => {
            try {
              expect(dirFiles).to.eql([
                'BaseTestWidget.java',
                'EnumExplicitDefault.java',
                'EnumImplicitNullDefault.java',
                'EnumNullDefault.java',
              ]);
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

    it('should fail when trying to write to a single file', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test_enum.json');
      let outdir = null;
      let outfile = null;
      const log = [];
      const origConsole = console.log;
      const cleanUp = () => {
        console.log = origConsole;
        rimraf(outdir, () => {});
      };
      return mkdtemp('widget-gen')
        .then((d) => {
          outdir = d;
          outfile = path.join(outdir, 'widgets.java');

          console.log = (message) => {
            log.push(message);
          };
          return run(fname, ['java'], { output: outfile });
        })
        .then(() => {
          cleanUp();
          expect(log.length).to.equal(1);
          expect(log[0]).is.instanceOf(Error);
          expect(log[0].message).to.eql(
            'Cannot write multiple widget definitions to one Java file!'
          );
        }, cleanUp);
    });
  });
});
