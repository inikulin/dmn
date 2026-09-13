const fs = require('fs'),
    path = require('path'),
    console = require('../lib/console_ex');

// Workaround for Node.js 22.x.
(async function () {
    const { default: Mocha } = await import('mocha');


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
const fixturesDir = path.join(__dirname, './fixtures'),
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
})();
