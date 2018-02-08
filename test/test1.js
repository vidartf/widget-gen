
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

  });


});
