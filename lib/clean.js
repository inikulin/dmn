var fs = require('fs-extra'),
    path = require('path'),
    du = require('du'),
    eachAsync = require('each-async'),
    globby = require('globby'),
    Q = require('q'),
    cli = require('./cli'),
    targets = require('./targets');


function toKbString(bytes) {
    return (bytes && (bytes / 1024).toFixed(2)) + ' Kb';
}

function percentsLess(newVal, oldVal) {
    return oldVal && (100 - 100 * newVal / oldVal).toFixed(1);
}

function getCleanTargets() {
    var directDeps = targets.map(function (pattern) {
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

function deleteFoundFiles(nmDir, filesToDelete, initialSize) {
    cli.info('Deleting...').spin();

    return Q

        //NOTE: delete files
        .nfcall(rimrafMultiple, nmDir, filesToDelete)

        .then(function () {
            //NOTE: get new size of the node_modules dir
            return Q.nfcall(du, nmDir);
        })

        .then(function (newSize) {
            cli.ok([
                'Done! Your node_modules directory size was ', toKbString(initialSize), ' but now it\'s ',
                toKbString(newSize), ' which is ', percentsLess(newSize, initialSize), '% less.'
            ].join(''));

            return 'cleaned';
        });
}

function confirmClean(nmDir, filesToDelete, initialSize) {
    return Q

        .nfcall(cli.confirm, 'Delete items?')

        .then(function () {
            cli.ok('Cleaning was canceled.');

            return 'canceled';
        },

        function () {
            return deleteFoundFiles(nmDir, filesToDelete, initialSize);
        });
}

function scanNodeModules(nmDir) {
    return Q.all([
        //NOTE: get initial size of the node_modules dir
        Q.nfcall(du, nmDir),

        //NOTE: find files matching ignore targets
        Q.nfcall(globby, getCleanTargets(), {cwd: nmDir})
    ]);
}


//Api
module.exports = function (projectDir, options) {
    var nmDir = path.join(projectDir, './node_modules');

    cli.info('Searching for items to clean (it may take a while for big projects)...').spin();

    if (!fs.existsSync(nmDir)) {
        cli.ok('No need for a clean-up: project doesn\'t have node_modules.');

        return 'no-deps';
    }

    return scanNodeModules(nmDir).spread(function (initialSize, filesToDelete) {
        if (!filesToDelete.length) {
            cli.ok('No need for a clean-up: your dependencies are already perfect.');

            return 'already-perfect';
        }

        cli.info(filesToDelete.length + ' item(s) are set for deletion');

        if (options.list)
            cli.list(filesToDelete);

        if (options.force)
            return deleteFoundFiles(nmDir, filesToDelete, initialSize);

        return confirmClean(nmDir, filesToDelete, initialSize);
    });

};
