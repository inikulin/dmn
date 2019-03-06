var path = require('path'),
    fs = require('co-fs-extra'),
    thunk = require('thunkify'),
    dirSize = require('du'),
    glob = require('globby'),
    console = require('./console_ex'),
    targets = require('./targets');


/**
 * Thunks
 */
dirSize = thunk(dirSize);

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
    return (bytes && (bytes / 1024).toFixed(2)) + ' Kb';
}

function percentsLess(newVal, oldVal) {
    return oldVal && (100 - 100 * newVal / oldVal).toFixed(1);
}


/**
 * Create array of patterns which will be used for cleaning
 */
function getCleanTargets() {
    var directDeps = targets.map(function (pattern) {
            return '*/' + pattern;
        }),

        indirectDeps = targets.map(function (pattern) {
            return '**/node_modules/*/' + pattern;
        });

    return directDeps.concat(indirectDeps);
}


/**
 * Remove files that should be ignored
 */
function* removeFiles(nmDir, filesToDelete, initialSize) {
    console
        .info('Deleting...')
        .spin();


    // Delete files in parallel
    yield filesToDelete.map(function (filePath) {
        filePath = path.join(nmDir, filePath);
        return fs.remove(filePath);
    });


    // Obtain new node_modules dir size
    var newSize = yield dirSize(nmDir);


    // Tell how awesome we are now
    console.ok(
            'Done! Your node_modules directory size was ' +
            toKbString(initialSize) + ' but now it\'s ' +
            toKbString(newSize) + ' which is ' +
            percentsLess(newSize, initialSize) + '% less.'
    );

    return 'OK: cleaned';
}


/**
 * Remove files that should be ignored, but consider user confirmation
 */
function* removeFilesWithConfirmation(nmDir, filesToDelete, initialSize) {
    var yes = yield confirm('Delete items?');

    if (yes)
        return yield removeFiles(nmDir, filesToDelete, initialSize);

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


    // Get initial size of the node_modules dir and try
    // to fetch files to clean in parallel
    var initialSize = dirSize(nmDir),
        files = glob(getCleanTargets(), {cwd: nmDir});

    initialSize = yield initialSize;
    files = yield files;


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
        removeFiles(nmDir, files, initialSize) :
        removeFilesWithConfirmation(nmDir, files, initialSize);
};
