'use strict';

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('chai').should();
const fs = require('fs');
const asserts = require('./lib/asserts');

describe('Parser', function() {
  context('ES5', function() {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse/`);
    return files.forEach(file => it(file, () => asserts.assertFile(`/parse/${file}`)));
  });

  context('ES6 script', function() {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse-es6-script/`);
    return files.forEach(file =>
      it(file, () => asserts.assertFile(`/parse-es6-script/${file}`, {parserOptions: {}}))
    );
  });

  return context('ES6 module', function() {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse-es6-module/`);
    return files.forEach(file =>
      it(file, () =>
        asserts.assertFile(`/parse-es6-module/${file}`, {
          parserOptions: {
            sourceType: 'module',
          },
        })
      )
    );
  });
});
