var fs = require('fs-extra'),
    path = require('path'),
    du = require('du'),
    eachAsync = require('each-async'),
    globby = require('globby'),
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
    var ignoresFile = path.join(__dirname, './targets.json');
    return JSON.parse(fs.readFileSync(ignoresFile).toString());
}

function createCleanGlobs() {
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


//Log
var Log = {
    silent: false,
    spinnerInterval: null,

    write: function (msg) {
        if (!this.silent)
            console.log(msg);

        return this;
    },

    spin: function () {
        if (!this.silent)
            this.spinnerInterval = spinner();

        return this;
    },

    stopSpin: function () {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            spinner.clear();
        }

        return this;
    }
};


//API
exports.clean = function (projectDir, callback) {
    var nmDir = path.join(projectDir, './node_modules');

    nmDir = path.resolve(nmDir);
    Log.silent = !!callback;
    callback = callback || exit;

    Log.write('Searching for items to clean...').spin();

    if (!fs.existsSync(nmDir)) {
        Log.stopSpin().write('No need for a clean-up: project doesn\'t have node_modules.');
        callback();

        return;
    }

    du(nmDir, function (err, initialSize) {
        globby(createCleanGlobs(), {cwd: nmDir}, function (err, files) {
            if (!files.length) {
                Log.stopSpin().write('No need for a clean-up: your dependencies are already perfect.');
                callback();

                return;
            }

            Log.stopSpin().write(files.length + ' items are set for deletion');
            Log.write('Deleting...').spin();

            deleteFiles(nmDir, files, function () {
                du(nmDir, function (err, newSize) {
                    Log.stopSpin().write([
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
        });
    })
};
