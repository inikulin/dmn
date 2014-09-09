var fs = require('fs-extra'),
    path = require('path'),
    should = require('should'),
    tmp = require('tmp'),
    dmn = require('../../index');


describe('clean', function () {
    var cwd = null;

    beforeEach(function (done) {
        tmp.dir({ mode: 0777}, function (err, tmpPath) {
            cwd = tmpPath;
            process.chdir(cwd);
            done();
        });
    });

    afterEach(function (done) {
        process.chdir(__dirname);
        fs.remove(cwd, done);
    });

    it('should clean targets and ignore everything else', function (done) {
        var filesToClean = [
                'node_modules/yo/.travis.yml',
                'node_modules/awesome_package/.gitignore',
                'node_modules/awesome_package/Gruntfile.js',
                'node_modules/yo/node_modules/yoyo/Makefile',
                'node_modules/yo/node_modules/yoyo/Changes'
            ],
            dirsToClean = [
                'node_modules/yo/test',
                'node_modules/awesome_package/examples',
                'node_modules/yo/node_modules/yoyo/test',
                'node_modules/yo/node_modules/yoyo/.coverage_data/'
            ],
            filesToIgnore = [
                'node_modules/yo/index.js',
                'node_modules/yo/node_modules/yoyo/package.json',
                'node_modules/awesome_package/Readme.md'
            ],
            dirsToIgnore = [
                'node_modules/yo/lib',
                'node_modules/yo/node_modules/yoyo/src'
            ];

        filesToClean.concat(filesToIgnore).forEach(fs.ensureFileSync);
        dirsToClean.concat(dirsToIgnore).forEach(fs.ensureDirSync);

        dmn.clean(cwd, function () {
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
