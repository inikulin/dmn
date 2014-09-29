//Just an easy way to update targets list and keep it nice and sorted
//Usage: node add_targets target1 target2 ...

var path = require('path'),
    fs = require('fs'),
    targets = require('../lib/targets');

var targetsToAdd = process.argv
    .slice(2)
    .map(function (newTarget) {
        return newTarget.trim();
    })
    .filter(function (newTarget) {
        return targets.indexOf(newTarget) === -1;
    });

if (!targetsToAdd.length) {
    console.log('Nothing to add');
}

else {
    targets = targets.concat(targetsToAdd).sort();

    var indent = '\n    ',
        content = 'module.exports = [';

    for (var i = 0; i < targets.length; i++) {
        content += indent + '\'' + targets[i] + '\'';

        if (i !== targets.length - 1)
            content += ',';
    }

    content += '\n];';

    var targetFile = path.join(__dirname, '../lib/targets.js');

    fs.writeFileSync(targetFile, content);
    console.log('Done');
}

