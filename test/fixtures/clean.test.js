var fs = require('fs-extra'),
    path = require('path'),
    should = require('should'),
    cli = require('../../lib/cli'),
    dmn = require('../../index');


describe('clean', function () {
    var tmpPath = path.join(__dirname, '../tmp'),
        filesToClean = [
            'node_modules/yo/.travis.yml',
            'node_modules/awesome_package/.gitignore',
            'node_modules/awesome_package/Gruntfile.js',
            'node_modules/yo/node_modules/yoyo/yo.pyc',
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


    cli.silent = true;

    //NOTE: ensureDir which can be safely passed to Array.forEach()
    //(learn more: http://www.wirfs-brock.com/allen/posts/166)
    function ensureDirSync(dir) {
        fs.ensureDirSync(dir, 0777);
    }

    beforeEach(function () {
        fs.ensureDirSync(tmpPath);
        process.chdir(tmpPath);
    });

    afterEach(function (done) {
        process.chdir(__dirname);
        fs.remove(tmpPath, done);
    });

    it('should clean targets and ignore everything else', function (done) {
        filesToClean.concat(filesToIgnore).forEach(fs.ensureFileSync);
        dirsToClean.concat(dirsToIgnore).forEach(ensureDirSync);

        dmn.clean(tmpPath, {force: true}).done(function (status) {
            status.should.eql('OK: cleaned');

            filesToClean.concat(dirsToClean).forEach(function (file) {
                fs.existsSync(file).should.be.false;
            });

            filesToIgnore.concat(dirsToIgnore).forEach(function (file) {
                fs.existsSync(file).should.be.true;
            });

            done();
        });
    });

    it('should do nothing if there is no node_modules directory in the project', function (done) {
        var projectFiles = [
                'index.js',
                'Readme.md',
                'package.json'
            ],
            projectDirs = [
                'lib',
                'src'
            ];

        projectFiles.forEach(fs.ensureFileSync);
        projectDirs.forEach(ensureDirSync);

        dmn.clean(tmpPath, {force: true}).done(function (status) {
            status.should.eql('OK: no-deps');

            projectFiles.concat(projectDirs).forEach(function (file) {
                fs.existsSync(file).should.be.true;
            });

            done();
        });
    });

    it('should do nothing if dependencies are already clean', function (done) {
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

        projectFiles.forEach(fs.ensureFileSync);
        projectDirs.forEach(ensureDirSync);

        dmn.clean(tmpPath, {force: true}).done(function (status) {
            status.should.eql('OK: already-perfect');

            projectFiles.concat(projectDirs).forEach(function (file) {
                fs.existsSync(file).should.be.true;
            });

            done();
        });
    });

    it('should cancel cleaning on user demand if "force" flag disabled', function (done) {
        filesToClean.concat(filesToIgnore).forEach(fs.ensureFileSync);
        dirsToClean.concat(dirsToIgnore).forEach(ensureDirSync);

        cli.confirm = function (what, callback) {
            callback(false);
        };

        dmn.clean(tmpPath, {force: false}).done(function (status) {
            status.should.eql('OK: canceled');

            filesToClean
                .concat(filesToIgnore)
                .concat(dirsToClean)
                .concat(dirsToIgnore)
                .forEach(function (file) {
                    fs.existsSync(file).should.be.true;
                });

            done();
        });
    });

    it('should clean on user confirmation if "force" flag disabled', function (done) {
        filesToClean.concat(filesToIgnore).forEach(fs.ensureFileSync);
        dirsToClean.concat(dirsToIgnore).forEach(ensureDirSync);

        cli.confirm = function (what, callback) {
            callback(true);
        };

        dmn.clean(tmpPath, {force: false}).done(function (status) {
            status.should.eql('OK: cleaned');

            filesToClean.concat(dirsToClean).forEach(function (file) {
                fs.existsSync(file).should.be.false;
            });

            filesToIgnore.concat(dirsToIgnore).forEach(function (file) {
                fs.existsSync(file).should.be.true;
            });

            done();
        });
    });
});
