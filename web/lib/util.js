'use strict';

var crypto = require('crypto');
var process = require('child_process');
var colors = require('colors');
var fs = require('fs');
var log4js = require('log4js');
var jsLogger;

function _sha1(str) {
    var md5sum = crypto.createHash('sha1');
    md5sum.update(str, 'utf8');
    return md5sum.digest('hex');
}

function _isEmpty(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
};

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function _randomId() {
    return s4() + s4();
}

function _guid() {
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
    //return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function _genSSHKey(email, callback) {
    fs.exists('/tmp/uclassroom', function (exists) {
        if (!exists) {
            fs.mkdirSync('/tmp/uclassroom');
        }
        fs.exists('/tmp/uclassroom/ssh', function (exists) {
            if (!exists) {
                fs.mkdirSync('/tmp/uclassroom/ssh');
            }
            var tmp = '/tmp/uclassroom/ssh/' + _guid();
            var cmd_keygen = 'ssh-keygen -t RSA -b 2048 -C "' + email + '" -f ' + tmp + ' -q -N "" ';
            if (!_isEmpty(jsLogger)) {
                jsLogger.info('[exec] ' + cmd_keygen);
            }
            process.exec(cmd_keygen, function (error, stdout, stderr) {
                if (error !== null) {
                    if (!_isEmpty(jsLogger)) {
                        jsLogger.info('exec error: ' + error);
                    }
                }
                else {
                    var pri = fs.readFileSync(tmp).toString();
                    var pub = fs.readFileSync(tmp + '.pub').toString();
                    callback(pri, pub);
                }
            });
        });
    });
}

function _getTime() {
    var date = new Date();
    return date.toLocaleTimeString();
    //return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}

function _initJsLogger(cfg, cwd) {
    if (_isEmpty(jsLogger)) {
        log4js.configure(cfg, {cwd: cwd});
        jsLogger = log4js.getLogger('uclassroom');
        jsLogger.setLevel('DEBUG');
    }
    return jsLogger;
}
function _getJsLogger() {
    return jsLogger;
}

exports.sha1 = _sha1;
exports.isEmpty = _isEmpty;
exports.guid = _guid;
exports.randomId = _randomId;
exports.genSSHKey = _genSSHKey;
exports.getTime = _getTime;
exports.initJsLogger = _initJsLogger;
exports.getJsLogger = _getJsLogger;
