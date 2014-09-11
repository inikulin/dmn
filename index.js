var fs = require('fs-extra'),
    path = require('path'),
    du = require('du'),
    eachAsync = require('each-async'),
    globby = require('globby'),
    read = require('read'),
    spinner = require('char-spinner'),
    Q = require('q');


//Utils
//-------------------------------------------------------------------------------------------------------------
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

function rimrafMultiple(baseDir, files, callback) {
    eachAsync(files, function (filePath, i, next) {
        filePath = path.join(baseDir, filePath);
        fs.remove(filePath, next);
    }, callback);
}

function parseNpmIgnore(content) {
    return content
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map(function (str) {
            return str.trim();
        })
        .filter(function (str) {
            //NOTE: remove empty strings and comments
            return str && str.indexOf('#') !== 0;
        });
}


//CLI
//-------------------------------------------------------------------------------------------------------------
function createCli(silent) {
    var cli = {};

    //Spinner
    var spinnerInterval = null;

    cli.spin = function () {
        if (!silent)
            spinnerInterval = spinner();

        return cli;
    };

    cli.stopSpin = function () {
        if (spinnerInterval) {
            clearInterval(spinnerInterval);
            spinner.clear();
        }

        return cli;
    };

    //Logging methods
    var log = function (msg) {
        cli.stopSpin();

        if (!silent)
            console.log(msg);
    };

    var loggingMethods = {
        ok: '\x1B[32mOK\x1B[0m: ',
        info: '\x1B[33mINFO\x1B[0m: '
    };

    Object.keys(loggingMethods).forEach(function (name) {
        cli[name] = function (msg) {
            log(loggingMethods[name] + msg);

            return cli;
        };
    });

    //List
    cli.list = function (arr) {
        arr.forEach(function (item) {
            log('   \x1B[35m*\x1B[0m ' + item);
        });

        return cli;
    };

    //Confirm
    cli.confirm = function (what, callback) {
        var prompt = silent ? null : '\x1B[36mCONFIRM\x1B[0m: ' + what + '(Y/N):';

        var getAnswer = function () {
            read({prompt: prompt, silent: silent}, function (err, result) {
                result = result && result.trim().toLowerCase();

                if (result !== 'y' && result !== 'n')
                    setTimeout(getAnswer);
                else
                    callback(result === 'y');
            });
        };

        cli.stopSpin();

        getAnswer();
    };

    return cli;
}


//Clean
//-------------------------------------------------------------------------------------------------------------
function deleteFoundFiles(cli, nmDir, filesToDelete, initialSize) {
    var newSize = 0;

    cli.info('Deleting...').spin();

    return Q

        .Promise(function (done) {
            //NOTE: delete files
            rimrafMultiple(nmDir, filesToDelete, done);
        })

        .then(function () {
            //NOTE: get new size of the node_modules dir
            return Q.Promise(function (done) {
                du(nmDir, function (err, size) {
                    newSize = size;
                    done();
                });
            });
        })

        .then(function () {
            cli.ok([
                'Done! Your node_modules directory size was ', toKbString(initialSize), ' but now it\'s ',
                toKbString(newSize), ' which is ', percentsLess(newSize, initialSize), '% less.'
            ].join(''));
        });
}

function confirmClean(cli, nmDir, filesToDelete, initialSize) {
    return Q

        .Promise(function (done) {
            cli.confirm('Delete items?', done);
        })

        .then(function (yes) {
            if (yes)
                return deleteFoundFiles(cli, nmDir, filesToDelete, initialSize);

            cli.ok('Cleaning was canceled.');
        });
}

//Api
exports.clean = function (projectDir, options) {
    var nmDir = path.join(projectDir, './node_modules'),
        cli = createCli(options.silent),
        initialSize = 0,
        filesToDelete = null;

    cli.info('Searching for items to clean (it may take a while for big projects)...').spin();

    if (!fs.existsSync(nmDir)) {
        cli.ok('No need for a clean-up: project doesn\'t have node_modules.');

        return Q.done();
    }

    return Q

        //NOTE: get initial size of the node_modules dir
        .Promise(function (done) {
            du(nmDir, function (err, size) {
                initialSize = size;
                done();
            });
        })

        .then(function () {
            //NOTE: find matching files
            return Q.Promise(function (done) {
                globby(createCleanTargets(), {cwd: nmDir}, function (err, files) {
                    filesToDelete = files;
                    done();
                });
            });
        })

        .then(function () {
            if (!filesToDelete.length) {
                cli.ok('No need for a clean-up: your dependencies are already perfect.');
                return;
            }

            cli.info(filesToDelete.length + ' item(s) are set for deletion');

            if (options.list)
                cli.list(filesToDelete);

            if (options.force)
                return deleteFoundFiles(cli, nmDir, filesToDelete, initialSize);

            return confirmClean(cli, nmDir, filesToDelete, initialSize);
        });

};


//Generate
//-------------------------------------------------------------------------------------------------------------
exports.gen = function (projectDir, options, callback) {
    var ignoreFile = path.join(projectDir, './.npmignore'),
        cli = createCli(options.silent);

    callback = callback || exit;

    cli.info('Reading and parsing .npmignore file...').spin();

    fs.ensureFile(ignoreFile, function () {
        fs.readFile(ignoreFile, function (err, content) {
            content = content.toString();

            //NOTE: yep, so selfish...
            content = content || '# Generated by dmn (https://github.com/inikulin/dmn)';

            var alreadyIgnored = parseNpmIgnore(content);

            cli.info('Searching for items to ignore...').spin();

            var ignores = [];

            eachAsync(getTargets(), function (pattern, i, next) {
                globby(pattern, {cwd: projectDir}, function (err, files) {
                    if (files.length)
                        ignores.push(pattern);

                    next();
                });

            }, function () {
                //NOTE: skip already ignored patterns
                ignores = ignores.filter(function (pattern) {
                    return alreadyIgnored.indexOf(pattern) === -1;
                });

                if (!ignores.length) {
                    cli.ok('Unignored patterns was not found. Your .npmignore file is already perfect.');
                    callback();

                    return;
                }

                cli.info('Following patterns will be added to .npmignore file:');
                cli.list(ignores);

                var savePatterns = function () {
                    content += '\r\n\r\n' + ignores.join('\r\n');

                    fs.writeFile(ignoreFile, content, function () {
                        cli.ok('.npmignore file was updated.');
                        callback();
                    });
                };

                if (options.force)
                    savePatterns();
                else {
                    cli.confirm('Save?', function (yes) {
                        if (yes)
                            savePatterns();
                        else {
                            cli.ok('.npmignore file update was canceled.');
                            callback();
                        }
                    });
                }
            });
        });
    });
};

