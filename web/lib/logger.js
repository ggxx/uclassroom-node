'use strict';

var util = require('./util.js');
var log4js = require('log4js');
var jsLogger;

function _initJsLogger(cfg, cwd) {
    if (util.isEmpty(jsLogger)) {
        log4js.configure(cfg, {cwd: cwd});
        jsLogger = log4js.getLogger('uclassroom');
        jsLogger.setLevel('DEBUG');
    }
    return jsLogger;
}
function _getLogger() {
    return jsLogger;
}


exports.initJsLogger = _initJsLogger;
exports.getLogger = _getLogger;
