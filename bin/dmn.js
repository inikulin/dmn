#!/usr/bin/env node

//Enable generators for node v10.x.x
require('gnode');

var fs = require('fs'),
    path = require('path'),
    nopt = require('nopt'),
    dmn = require('../index'),
    cli = require('../lib/console_ex');


//Print version
var packageFile = fs.readFileSync(path.join(__dirname, '../package.json')).toString();

console_ex.log('dmn@' + JSON.parse(packageFile).version);

//Usage
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

//Exit
function exit(code) {
    //NOTE: give stdout time to flush
    setTimeout(function () {
        process.exit(code);
    });
}

//Parse args
var opts = nopt(OPTIONS, OPTIONS_SHORTHANDS, process.argv, 2),
    cmds = opts.argv.remain
        .filter(function (arg, pos, cmds) {
            //NOTE: skip duplicates, because we don't run the same command twice
            return cmds.indexOf(arg) === pos && (arg === 'clean' || arg === 'gen');
        });


//Command sequence
function whenError(err) {
    console_ex.error(err);
    console_ex.error('This should never happen!');
    console_ex.error('Please submit an issue to: https://github.com/inikulin/dmn/issues');
    exit(1);
}

function whenDone() {
    if (cmds.length)
        runCommand();

    else
        exit(0);
}

function runCommand() {
    var cmd = cmds.pop();

    dmn[cmd](process.cwd(), opts).done(whenDone, whenError);
}

//Here we go...
if (!cmds.length) {
    console_ex.log(USAGE);
    exit(0);
}
else
    runCommand();