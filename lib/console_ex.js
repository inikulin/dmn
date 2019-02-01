var read = require('read'),
    spinner = require('char-spinner');


/**
 * Export console
 */
var con = module.exports = {
    silent: false
};


/**
 * Spinner
 */
var spinnerInterval = null;

con.spin = function () {
    if (!con.silent)
        spinnerInterval = spinner();

    return con;
};

con.stopSpin = function () {
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinner.clear();
    }

    return con;
};


/**
 * Logging methods
 */
var log = con.log = function (msg) {
    con.stopSpin();

    if (!con.silent)
        console.log(msg);
};

var loggingMethods = {
    ok: '\x1B[32mOK\x1B[0m: ',
    info: '\x1B[33mINFO\x1B[0m: '
};

Object.keys(loggingMethods).forEach(function (name) {
    con[name] = function (msg) {
        log(loggingMethods[name] + msg);

        return con;
    };
});

con.error = function (err) {
    var msg = err.message || err.msg || err.code || err;

    if (err.stack)
        msg += '\n' + err.stack;

    msg.split(/\r?\n/g).forEach(function (msgLine) {
        log('\x1B[31mERROR\x1B[0m: ' + msgLine);
    });
};

con.list = function (arr) {
    arr.forEach(function (item) {
        log('   \x1B[35m*\x1B[0m ' + item);
    });

    return con;
};


/**
 * Confirm
 */
con.confirm = function (what, callback) {
    var prompt = con.silent ? null : '\x1B[36mCONFIRM\x1B[0m: ' + what + '(Y/N):';

    var getAnswer = function () {
        read({prompt: prompt, silent: con.silent}, function (err, result) {
            result = result && result.trim().toLowerCase();

            if (result !== 'y' && result !== 'n')
                setTimeout(getAnswer);
            else
                callback(result === 'y');
        });
    };

    con.stopSpin();

    getAnswer();
};

