var read = require('read'),
    spinner = require('char-spinner');

var cli = module.exports = {
    silent: false
};


//Spinner
var spinnerInterval = null;

cli.spin = function () {
    if (!cli.silent)
        spinnerInterval = spinner();

    return cli;
};

cli.stopSpin = function () {
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinner.clear();
    }

    return cli;
};


//Logging methods
var log = cli.log = function (msg) {
    cli.stopSpin();

    if (!cli.silent)
        console.log(msg);
};

var loggingMethods = {
    ok: '\x1B[32mOK\x1B[0m: ',
    info: '\x1B[33mINFO\x1B[0m: '
};

Object.keys(loggingMethods).forEach(function (name) {
    cli[name] = function (msg) {
        log(loggingMethods[name] + msg);

        return cli;
    };
});

cli.error = function (err) {
    var msg = err.message || err.msg || err.code || err;

    if (err.stack)
        msg += '\n' + err.stack;

    msg.split(/\r?\n/g).forEach(function (msgLine) {
        log('\x1B[31mERROR\x1B[0m: ' + msgLine);
    });
};

//List
cli.list = function (arr) {
    arr.forEach(function (item) {
        log('   \x1B[35m*\x1B[0m ' + item);
    });

    return cli;
};


//Confirm
cli.confirm = function (what, callback) {
    var prompt = cli.silent ? null : '\x1B[36mCONFIRM\x1B[0m: ' + what + '(Y/N):';

    var getAnswer = function () {
        read({prompt: prompt, silent: cli.silent}, function (err, result) {
            result = result && result.trim().toLowerCase();

            if (result !== 'y' && result !== 'n')
                setTimeout(getAnswer);
            else
                callback(result === 'y');
        });
    };

    cli.stopSpin();

    getAnswer();
};

