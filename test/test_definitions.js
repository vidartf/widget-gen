
const path = require('path');

const fs = require('fs-extra');

const expect = require('chai').expect;

const JSONValidation = require('json-validation').JSONValidation;

const definitionSchema = fs.readFileSync(
  path.resolve(__dirname, 'definition.schema.json'),
  'utf-8'
);


describe('validate test definitions', () => {
  let dirname = path.resolve(__dirname, 'definitions');

  fs.readdirSync(dirname).forEach((fname) => {

    it(`should validate ${fname}`, () => {

      return fs.readFile(path.join(dirname, fname), 'utf-8').then((content) => {
        const definition = JSON.parse(content);
        const jv = new JSONValidation();
        let result = jv.validate(definition, definitionSchema);
        const errorMsg = 'Definition has the following errors: ' + result.errors.join(', ');
        expect(result.ok, errorMsg).to.be.true;
      });

    });

  });

});
