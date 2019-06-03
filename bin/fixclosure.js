#!/usr/bin/env node
'use strict';

(async () => {
  const cli = require('../lib/cli');
  await cli(process.argv, process.stdout, process.stderr, process.exit);
})();
