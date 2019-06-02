'use strict';

require('chai').should();
const fs = require('fs');
const asserts = require('./lib/asserts');

describe('Parser', () => {
  context('ES5', () => {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse/`);
    files.forEach(file => it(file, () => asserts.assertFile(`/parse/${file}`)));
  });

  context('ES6 script', () => {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse-es6-script/`);
    files.forEach(file =>
      it(file, () => asserts.assertFile(`/parse-es6-script/${file}`, {parserOptions: {}}))
    );
  });

  context('ES6 module', () => {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse-es6-module/`);
    files.forEach(file =>
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
