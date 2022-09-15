'use strict';

require('dotenv').config();
const { exec } = require('pkg');

const build = async (enter, out) => {
  try {
    await exec([
      enter,
      '--config', './pkg.config.json',
      '--output', out,
      '--debug'
    ]);
  } catch (error) {
    console.error(error);
  }
};

build('./dist/watcher.js',
  'H:\\services\\watch-nprinting-repots\\watch-nprinting-repots.exe')
  .then(() => console.log(`build complete for ${performance.now()} ms`));



