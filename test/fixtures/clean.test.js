var fs = require('fs-extra'),
    path = require('path'),
    should = require('should'),
    dmn = require('../../index');


describe('clean', function () {
    var tmpPath = path.join(__dirname, '../tmp');

    beforeEach(function () {
        fs.ensureDirSync(tmpPath);
        process.chdir(tmpPath);
    });

    afterEach(function (done) {
        process.chdir(__dirname);
        fs.remove(tmpPath, done);
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

        filesToClean.concat(filesToIgnore).forEach(fs.ensureFileSync);
        dirsToClean.concat(dirsToIgnore).forEach(function (dir) {
            fs.ensureDirSync(dir);
        });

        dmn.clean(tmpPath, function () {
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
