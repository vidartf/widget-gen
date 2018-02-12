
require('source-map-support').install();

const run = require('../lib/run').run;

const rimraf = require('rimraf');

const path = require('path');

const fs = require('fs-extra');

const os = require('os');

const expect = require('chai').expect;

function mkdtemp(prefix) {
  return fs.mkdtemp(path.join(
    os.tmpdir(),
    prefix
  ));
}

describe('test1', () => {

  describe('python', () => {

    it('should generate all the files', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test1.json');
      let outdir = null;
      return mkdtemp('widget-gen').then((d) => {
        outdir = d;
        return run(fname, ['python'], outdir);
      }).then(() => {
        return fs.readdir(outdir);
      }).then((dirFiles) => {
        return new Promise((resolve, reject) => {
          try {
            expect(dirFiles).to.eql([
              "DataArray.py",
              "DataContainer.py",
              "DataSet.py",
              "ImageData.py",
              "Piece.py",
              "UnstructuredGrid.py",
              "VtkWidget.py"
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


  describe('javascript', () => {

    it('should generate all the files', () => {
      let fname = path.resolve(__dirname, 'definitions', 'test1.json');
      let outdir = null;
      return mkdtemp('widget-gen').then((d) => {
        outdir = d;
        return run(fname, ['javascript'], outdir);
      }).then(() => {
        return fs.readdir(outdir);
      }).then((dirFiles) => {
        return new Promise((resolve, reject) => {
          try {
            expect(dirFiles).to.eql([
              "DataArray.js",
              "DataContainer.js",
              "DataSet.js",
              "ImageData.js",
              "Piece.js",
              "UnstructuredGrid.js",
              "VtkWidget.js"
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
      let fname = path.resolve(__dirname, 'definitions', 'test1.json');
      let outdir = null;
      let outfile = null;
      return mkdtemp('widget-gen').then((d) => {
        outdir = d;
        outfile = path.join(outdir, 'widgets.js');
        return run(fname, ['javascript'], outfile);
      }).then(() => {
        return fs.readdir(outdir);
      }).then((dirFiles) => {
        return new Promise((resolve, reject) => {
          try {
            expect(dirFiles).to.eql([
              "widgets.js",
            ]);
            const content = fs.readFileSync(outfile, {encoding: 'utf-8'});
            const pattern = /\nvar (\w(\w|[_0-9])*)Model = (\w(\w|[_0-9])*)Model.extend\({\n/g;
            const names = [];
            let match;
            while (match = pattern.exec(content)) {
              names.push(match[1]);
            }
            expect(names.sort()).to.eql([
              "DataArray",
              "DataContainer",
              "DataSet",
              "ImageData",
              "Piece",
              "UnstructuredGrid",
              "VtkWidget",
            ])
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
