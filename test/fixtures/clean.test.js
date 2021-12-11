var fs = require('fs-extra'),
    path = require('path'),
    co = require('co'),
    console = require('../../lib/console_ex'),
    dmn = require('../../index');


/**
 * Test data
 */
var filesToClean = [
        'node_modules/yo/.travis.yml',
        'node_modules/yo/.eslintignore',
        'node_modules/yo/yarn.lock',
        'node_modules/awesome_package/.gitignore',
        'node_modules/awesome_package/Gruntfile.js',
        'node_modules/yo/node_modules/yoyo/yo.pyc',
        'node_modules/eslint/node_modules/rxjs/_esm2015/internal/observable/dom/fetch.js.map',
        'node_modules/yo/node_modules/yoyo/Changes'
    ],

    dirsToClean = [
        'node_modules/yo/benchmark',
        'node_modules/awesome_package/examples',
        'node_modules/yo/node_modules/yoyo/test',
        'node_modules/yo/node_modules/yoyo/.coverage_data/'
    ],

    filesToIgnore = [
        '.npmignore',
        'node_modules/yo/index.js',
        'node_modules/yo/node_modules/yoyo/package.json',
        'node_modules/awesome_package/Readme.md'
    ],

    dirsToIgnore = [
        'node_modules/yo/lib',
        'node_modules/yo/node_modules/yoyo/src',
        'lib',
        'test'
    ];


/**
 * Get test working directory path
 */
var tmpPath = path.join(__dirname, '../tmp');


/**
 * Wrap fs thunks, so they can be safely passed to Array.map()
 * (learn more: http://www.wirfs-brock.com/allen/posts/166)
 */
function ensureDir(dir) {
    return fs.ensureDir(dir, 0777);
}

function ensureFile(file) {
    return fs.ensureFile(file);
}



describe('clean', function () {

    /**
     * Test setup / teardown
     */
    beforeEach(async function () {
        await ensureDir(tmpPath);
        process.chdir(tmpPath);
    });

    afterEach(async function () {
        process.chdir(__dirname);
        await fs.remove(tmpPath);
    });


    /**
     * Tests
     */
    it('should clean targets and ignore everything else', co.wrap(function* () {
        yield [
            filesToClean
                .concat(filesToIgnore)
                .map(ensureFile),

            dirsToClean
                .concat(dirsToIgnore)
                .map(ensureDir)
        ];

        var originalConsoleOk = console.ok;
        var out = '';
        console.ok = function(data) {
            out += data;
            originalConsoleOk(data);
        }
        var status = yield dmn.clean(tmpPath, {force: true});
        console.ok = originalConsoleOk;

        status.should.eql('OK: cleaned');

        out.should.eql('Done! Your node_modules directory is now 16.00 Kb smaller.');

        (yield filesToClean
            .concat(dirsToClean)
            .map(fs.exists))
            .forEach(function (exists) {
                exists.should.be.false;
            });

        (yield filesToIgnore
            .concat(dirsToIgnore)
            .map(fs.exists))
            .forEach(function (exists) {
                exists.should.be.true;
            });
    }));


    it('should do nothing if there is no node_modules directory in the project', co.wrap(function* () {
        var projectFiles = [
                'index.js',
                'Readme.md',
                'package.json'
            ],

            projectDirs = [
                'lib',
                'src'
            ];

        yield [
            projectFiles.map(ensureFile),
            projectDirs.map(ensureDir)
        ];

        var status = yield dmn.clean(tmpPath, {force: true});

        status.should.eql('OK: no-deps');

        (yield projectFiles
            .concat(projectDirs)
            .map(fs.exists))
            .forEach(function (exists) {
                exists.should.be.true;
            });
    }));


    it('should do nothing if dependencies are already clean', co.wrap(function* () {
        var projectFiles = [
                '.npmignore',
                'node_modules/yo/index.js',
                'node_modules/yo/node_modules/yoyo/package.json',
                'node_modules/awesome_package/Readme.md'
            ],

            projectDirs = [
                'node_modules/yo/lib',
                'node_modules/yo/node_modules/yoyo/src',
                'lib',
                'test'
            ];

        yield [
            projectFiles.map(ensureFile),
            projectDirs.map(ensureDir)
        ];

        var status = yield dmn.clean(tmpPath, {force: true});

        status.should.eql('OK: already-perfect');

        (yield projectFiles
            .concat(projectDirs)
            .map(fs.exists))
            .forEach(function (exists) {
                exists.should.be.true;
            });
    }));


    it('should cancel cleaning on user demand if "force" flag disabled', co.wrap(function* () {
        yield [
            filesToClean
                .concat(filesToIgnore)
                .map(ensureFile),

            dirsToClean
                .concat(dirsToIgnore)
                .map(ensureDir)
        ];

        console.confirm = function (what, callback) {
            callback(false);
        };

        var status = yield dmn.clean(tmpPath, {force: false});

        status.should.eql('OK: canceled');

        (yield filesToClean
            .concat(filesToIgnore)
            .concat(dirsToClean)
            .concat(dirsToIgnore)
            .map(fs.exists))
            .forEach(function (exists) {
                exists.should.be.true;
            });
    }));


    it('should clean on user confirmation if "force" flag disabled', co.wrap(function* () {
        yield [
            filesToClean
                .concat(filesToIgnore)
                .map(ensureFile),

            dirsToClean
                .concat(dirsToIgnore)
                .map(ensureDir)
        ];

        console.confirm = function (what, callback) {
            callback(true);
        };

        var status = yield dmn.clean(tmpPath, {force: false});

        status.should.eql('OK: cleaned');

        (yield filesToClean
            .concat(dirsToClean)
            .map(fs.exists))
            .forEach(function (exists) {
                exists.should.be.false;
            });

        (yield filesToIgnore
            .concat(dirsToIgnore)
            .map(fs.exists))
            .forEach(function (exists) {
                exists.should.be.true;
            });
    }));
});
