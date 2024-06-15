var path = require('path'),
    fs = require('fs-extra'),
    glob = require('fast-glob'),
    console = require('./console_ex'),
    targets = require('./targets');
    patterns = ['**/(' + targets.join('|') + ')'];


function confirm(what) {
    return function (done) {
        console.confirm(what, function (yes) {
            done(null, yes);
        });
    };
}


/**
 * Measurement utils
 */
function toKbString(bytes) {
    return (bytes / 1024).toFixed(2) + ' Kb';
}


/**
 * Remove files that should be ignored
 */
function* removeFiles(nmDir, filesToDelete) {
    console
        .info('Deleting...')
        .spin();

    const stats = yield filesToDelete.map(function (filePath) {
        filePath = path.join(nmDir, filePath);
        return fs.stat(filePath);
    });

    // Delete files in parallel
    yield filesToDelete.map(function (filePath) {
        filePath = path.join(nmDir, filePath);
        return fs.remove(filePath);
    });

    // Tell how awesome we are now
    console.ok(
            'Done! Your node_modules directory is now ' +
            toKbString(stats.reduce(function (total, cur) {
                return total + cur.size;
            }, 0)) + ' smaller.'
    );

    return 'OK: cleaned';
}


/**
 * Remove files that should be ignored, but consider user confirmation
 */
function* removeFilesWithConfirmation(nmDir, filesToDelete) {
    var yes = yield confirm('Delete items?');

    if (yes)
        return yield removeFiles(nmDir, filesToDelete);

    console.ok('Cleaning was canceled.');
    return 'OK: canceled';
}


/**
 * Clean module entry point
 */
module.exports = function* (projectDir, options) {
    var nmDir = path.join(projectDir, './node_modules');

    console
        .info('Searching for items to clean (it may take a while for big projects)...')
        .spin();


    // Ensure we have a node_modules dir
    var nmExists = yield fs.exists(nmDir);

    if (!nmExists) {
        console.ok('No need for a clean-up: project doesn\'t have node_modules.');
        return 'OK: no-deps';
    }


    // Fetch files to clean in parallel
    var files = yield glob(patterns, {cwd: nmDir, onlyFiles: false});


    // Nothing to delete, we're done here
    if (!files.length) {
        console.ok('No need for a clean-up: your dependencies are already perfect.');
        return 'OK: already-perfect';
    }


    // Report about found items
    console.info(files.length + ' item(s) are set for deletion');

    if (options.list)
        console.list(files);


    // Delete files or ask for user confirmation
    // if we don't have 'force' option enabled
    return yield options.force ?
        removeFiles(nmDir, files) :
        removeFilesWithConfirmation(nmDir, files);
};
