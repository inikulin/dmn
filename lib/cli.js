var fs = require('fs'),
    path = require('path'),
    nopt = require('nopt'),
    co = require('co'),
    dmn = require('../index'),
    console = require('../lib/console_ex');


/**
 * Print version
 */
var packageFile = fs.readFileSync(path.join(__dirname, '../package.json')).toString();

console.log('dmn@' + JSON.parse(packageFile).version);


/**
 * Usage and options
 */
var USAGE = [
        '',
        'Usage: dmn <command(s)> [options]' ,
        '',
        'Commands:',
        '   gen         :  generate (or add items to existing) .npmignore file.',
        '                  To keep item in release package just prepend it\'s',
        '                  pattern with \'!\'',
        '   clean       :  clean project\'s node_modules from useless clutter',
        '',
        'Options:',
        '   -f, -force  :  don\'t ask for command confirmation',
        '   -l, -list   :  list files that will be deleted by "clean" command',
        '',
        'For more help and information go to https://github.com/inikulin/dmn'
    ].join('\n'),

    OPTIONS = {
        'force': Boolean,
        'list': Boolean
    },

    OPTIONS_SHORTHANDS = {
        'f': ['--force'],
        'l': ['--list']
    };


/**
 * Delayed exit. This gives stdout time to flush.
 */
function exit(code) {
    setTimeout(function () {
        process.exit(code);
    });
}


/**
 * Executes dmn command
 */
function* exec(cmd, opts) {
    try {
        yield dmn[cmd](process.cwd(), opts);
    }

    catch (err) {
        console.error(err);
        console.error('This should never happen!');
        console.error('Please submit an issue to: https://github.com/inikulin/dmn/issues');
        exit(1);
    }
}


/**
 * Parse command line arguments
 */
var opts = nopt(OPTIONS, OPTIONS_SHORTHANDS, process.argv, 2),
    cmds = opts.argv.remain
        .filter(function (arg, pos, cmds) {
            //NOTE: skip duplicates, because we don't run the same command twice
            return cmds.indexOf(arg) === pos && (arg === 'clean' || arg === 'gen');
        });


/**
 * If we don't have commands to execute then just print usage and exit
 */
if (!cmds.length) {
    console.log(USAGE);
    exit(0);
}


/**
 * Otherwise sequentially execute given commands
 */
else {
    co(function* () {
        while (cmds.length)
            yield exec(cmds.shift(), opts);

        exit(0);
    })();
}
