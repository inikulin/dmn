var fs = require('fs'),
    path = require('path'),
    Mocha = require('mocha'),
    console = require('../lib/console_ex');


/**
 * Enable generators for node v10.x.x and Mocha
 */
require('gnode');
require('co-mocha')(Mocha);


/**
 * Enable should.js
 */
require('should');


/**
 * Disable project modules console output
 */
console.silent = true;


/**
 * Load tests
 */
var fixturesDir = path.join(__dirname, './fixtures'),
    mocha = new Mocha()
        .ui('bdd')
        .reporter('spec');

fs.readdirSync(fixturesDir).forEach(function (file) {
    mocha.addFile(path.join(fixturesDir, file));
});


/**
 * Let the wheels spin
 */
mocha.run(function (failed) {
    process.on('exit', function () {
        process.exit(failed);
    });
});