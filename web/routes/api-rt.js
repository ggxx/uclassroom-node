'use strict';

var fs = require('fs');
var express = require('express');
var util = require('../lib/util.js');
var db = require('../lib/db.js');
var api = require('../lib/api.js');
var config = JSON.parse(fs.readFileSync('./public/config.json'));
var jslogger = util.getJsLogger();
var router = express.Router();

router.get('/', function (req, res) {
    jslogger.info("get " + req.url);
    res.send({"result": true, "message": "I'm working!"});
    jslogger.info("response: I'm working!");
});

// Get user by id.
router.get('/users/:edxid', function (req, res) {
    jslogger.info("get " + req.url);
    var edxid = req.params.edxid;
    if (util.isEmpty(edxid)) {
        sendErrorMessage(res, 'user id cannot be empty');
        return;
    }
    try {
        db.getUserByEdxId(edxid, function (r_user) {
            if (!util.isEmpty(r_user)) {
                res.send({
                    "result": true, "user": {
                        "edx_id": r_user.edxId,
                        "email": r_user.email,
                        "git_id": r_user.gitId,
                        "git_token": r_user.gitToken,
                        "ucore_lab": "git@" + config.GIT.HOST + ":" + r_user.name + "/ucore_lab.git",
                        "name": r_user.name,
                        "password": r_user.password,
                        "private_key": r_user.privateKey,
                        "public_key": r_user.publicKey
                    }
                });
                jslogger.info("response: user info");
                return;
            } else {
                sendErrorMessage(res, 'user id does not exist');
                return;
            }
        });
    }
    catch (ex) {
        jslogger.warn(ex);
        sendErrorMessage(res, 'internal error');
        return;
    }
});

// Create user
router.post('/users', function (req, res) {
    jslogger.info("post " + req.url);
    try {
        api.createAccount(req.body.edxid, req.body.username, req.body.email, function (result) {
            if (result.result == true) {
                res.send({
                    "result": true, "user": {
                        "edx_id": result.user.edxId,
                        "email": result.user.email,
                        "git_id": result.user.gitId,
                        "git_token": result.user.gitToken,
                        "name": result.user.name,
                        "password": result.user.password,
                        "private_key": result.user.privateKey,
                        "public_key": result.user.publicKey
                    }
                });
                jslogger.info("response: user info");
                return;
            } else {
                sendErrorMessage(res, result.message);
                return;
            }
        });
    }
    catch (ex) {
        jslogger.warn(ex);
        sendErrorMessage(res, 'internal error');
        return;
    }
});

router.delete('/users/:edxid', function (req, res) {
    jslogger.info("delete " + req.url);
    try {
        api.removeAccount(req.body.edxid, function (result) {
            if (result.result == true) {
                res.send({"result": true});
                jslogger.info("response: true");
                return;
            } else {
                sendErrorMessage(res, result.message);
                return;
            }
        });
    }
    catch (ex) {
        jslogger.warn(ex);
        sendErrorMessage(res, 'internal error');
        return;
    }
});

// Remove User
router.post('/users/remove/:userid', function (req, res) {
    jslogger.info("post " + req.url);
    // TODO: remove user
});

function sendErrorMessage(res, msg) {
    res.send({"result": false, "message": msg});
    jslogger.info("response: " + msg);
}

module.exports = router;
