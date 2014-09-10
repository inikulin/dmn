var fs = require('fs-extra'),
    path = require('path'),
    du = require('du'),
    eachAsync = require('each-async'),
    globby = require('globby'),
    read = require('read'),
    spinner = require('char-spinner');

//Utils
function exit() {
    setTimeout(process.exit);
}

function toKbString(bytes) {
    return (bytes && (bytes / 1024).toFixed(2)) + ' Kb';
}

function percentsLess(newVal, oldVal) {
    return oldVal && (100 - 100 * newVal / oldVal).toFixed(1);
}

function getTargets() {
    var targetsFile = path.join(__dirname, './targets.json');

    return JSON.parse(fs.readFileSync(targetsFile).toString());
}

function createCleanTargets() {
    var targets = getTargets(),
        directDeps = targets.map(function (pattern) {
            return '*/' + pattern;
        }),
        indirectDeps = targets.map(function (pattern) {
            return '**/node_modules/*/' + pattern;
        });

    return directDeps.concat(indirectDeps);
}

function deleteFiles(baseDir, files, callback) {
    eachAsync(files, function (filePath, i, next) {
        filePath = path.join(baseDir, filePath);
        fs.remove(filePath, next);
    }, callback);
}


function createCli(silent) {
    var cli = {};

    //Logging methods
    var loggingMethods = {
        ok: '\x1B[32mOK\x1B[0m: ',
        info: '\x1B[33mINFO\x1B[0m: ',
        error: '\x1B[31mERROR\x1B[0m: '
    };

    Object.keys(loggingMethods).forEach(function (name) {
        cli[name] = function (msg) {
            if (!silent)
                console.log(loggingMethods[name] + msg);

            return cli;
        };
    });

    //List
    cli.list = function (arr) {
        arr.forEach(function (item) {
            console.log('\x1B[35m*\x1B[0m   ' + item);
        });

        return cli;
    };

    //Confirm
    cli.confirm = function (what, callback) {
        var prompt = '\x1B[36mCONFIRM\x1B[0m: ' + what + '(Y/N):',
            getAnswer = function () {
                read({prompt: prompt, silent: false}, function (err, result) {
                    result = result && result.trim().toLowerCase();

                    if (result !== 'y' && result !== 'n')
                        setTimeout(getAnswer);
                    else
                        callback(result === 'y');
                });
            };

        getAnswer();
    };

    //Spinner
    var spinnerInterval = null;

    cli.spin = function (enable) {
        if (!silent) {
            if (enable)
                spinnerInterval = spinner();

            else if (spinnerInterval) {
                clearInterval(spinnerInterval);
                spinner.clear();
            }
        }

        return cli;
    };

    return cli;
}


//API
exports.clean = function (projectDir, options, callback) {
    var nmDir = path.join(projectDir, './node_modules'),
        cli = createCli(options.silent);

    callback = callback || exit;

    cli.info('Searching for items to clean...').spin(true);

    if (!fs.existsSync(nmDir)) {
        cli.spin(false).ok('No need for a clean-up: project doesn\'t have node_modules.');
        callback();

        return;
    }

    du(nmDir, function (err, initialSize) {
        globby(createCleanTargets(), {cwd: nmDir}, function (err, files) {
            if (!files.length) {
                cli.spin(false).ok('No need for a clean-up: your dependencies are already perfect.');
                callback();

                return;
            }

            var doClean = function () {
                cli.info('Deleting...').spin(true);

                deleteFiles(nmDir, files, function () {
                    du(nmDir, function (err, newSize) {
                        cli.spin(false).ok([
                            'Done! Your node_modules directory size was ',
                            toKbString(initialSize),
                            ' but now it\'s ',
                            toKbString(newSize),
                            ' which is ',
                            percentsLess(newSize, initialSize),
                            '% less.'
                        ].join(''));

                        callback();
                    });
                });
            };

            cli.spin(false).info(files.length + ' item(s) are set for deletion');

            if (options.list)
                cli.list(files);

            if (options.force)
                doClean();
            else {
                cli.confirm('Delete items?', function (ok) {
                    if (ok)
                        doClean();
                    else {
                        cli.ok('Cleaning was canceled.');
                        callback();
                    }
                });
            }
        });
    })
};
