var fs = require('fs-extra'),
    path = require('path'),
    should = require('should'),
    dmn = require('../../index');

var tmpPath = path.join(__dirname, '../tmp');

dmn.NODE_MODULES = 'n_m';

beforeEach(function () {
    fs.ensureDirSync(tmpPath);
    process.chdir(tmpPath);
});

afterEach(function (done) {
    process.chdir(__dirname);
    fs.remove(tmpPath, done);
});

describe('clean', function () {

    it('should clean targets and ignore everything else', function (done) {
        var filesToClean = [
                dmn.NODE_MODULES + '/yo/.travis.yml',
                dmn.NODE_MODULES + '/awesome_package/.gitignore',
                dmn.NODE_MODULES + '/awesome_package/Gruntfile.js',
                dmn.NODE_MODULES + '/yo/' + dmn.NODE_MODULES + '/yoyo/Makefile',
                dmn.NODE_MODULES + '/yo/' + dmn.NODE_MODULES + '/yoyo/Changes'
            ],
            dirsToClean = [
                dmn.NODE_MODULES + '/yo/test',
                dmn.NODE_MODULES + '/awesome_package/examples',
                dmn.NODE_MODULES + '/yo/' + dmn.NODE_MODULES + '/yoyo/test',
                dmn.NODE_MODULES + '/yo/' + dmn.NODE_MODULES + '/yoyo/.coverage_data/'
            ],
            filesToIgnore = [
                dmn.NODE_MODULES + '/yo/index.js',
                dmn.NODE_MODULES + '/yo/' + dmn.NODE_MODULES + '/yoyo/package.json',
                dmn.NODE_MODULES + '/awesome_package/Readme.md'
            ],
            dirsToIgnore = [
                dmn.NODE_MODULES + '/yo/lib',
                dmn.NODE_MODULES + '/yo/' + dmn.NODE_MODULES + '/yoyo/src'
            ];

        filesToClean.concat(filesToIgnore).forEach(fs.ensureFileSync);
        dirsToClean.concat(dirsToIgnore).forEach(fs.ensureDirSync);

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
