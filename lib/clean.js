var fs = require('fs-extra'),
    path = require('path'),
    du = require('du'),
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

function performCleaning(nmDir, filesToDelete, initialSize) {
    cli.info('Deleting...').spin();

    var delPromises = filesToDelete.map(function (filePath) {
            filePath = path.join(nmDir, filePath);

            return Q.nfcall(fs.remove, filePath);
        }
    );

    //NOTE: delete files
    return Q

        .all(delPromises)

        .then(function () {
            //NOTE: get new size of the node_modules dir
            return Q.nfcall(du, nmDir);
        })

        .then(function (newSize) {
            cli.ok([
                'Done! Your node_modules directory size was ', toKbString(initialSize), ' but now it\'s ',
                toKbString(newSize), ' which is ', percentsLess(newSize, initialSize), '% less.'
            ].join(''));

            return Q('cleaned');
        });
}

function confirmClean(nmDir, filesToDelete, initialSize) {
    return Q

        .Promise(function (done) {
            cli.confirm('Delete items?', done);
        })

        .then(function (yes) {
            if (yes)
                return performCleaning(nmDir, filesToDelete, initialSize);

            cli.ok('Cleaning was canceled.');

            return Q('canceled');
        });
}

function scanNodeModules(nmDir) {
    return Q.all([
        Q.nfcall(du, nmDir), //get initial size of the node_modules dir
        Q.nfcall(globby, getCleanTargets(), {cwd: nmDir})   //find files matching ignore targets
    ]);
}


//API
module.exports = function (projectDir, options) {
    var nmDir = path.join(projectDir, './node_modules');

    cli.info('Searching for items to clean (it may take a while for big projects)...').spin();

    if (!fs.existsSync(nmDir)) {
        cli.ok('No need for a clean-up: project doesn\'t have node_modules.');

        return Q('no-deps');
    }

    return scanNodeModules(nmDir).spread(function (initialSize, filesToDelete) {
        if (!filesToDelete.length) {
            cli.ok('No need for a clean-up: your dependencies are already perfect.');

            return Q('already-perfect');
        }

        cli.info(filesToDelete.length + ' item(s) are set for deletion');

        if (options.list)
            cli.list(filesToDelete);

        if (options.force)
            return performCleaning(nmDir, filesToDelete, initialSize);

        return confirmClean(nmDir, filesToDelete, initialSize);
    });

};
