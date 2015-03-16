var express = require('express');
var util = require('../lib/util.js');
var db = require('../lib/db.js');
var api = require('../lib/api.js');

var router = express.Router();


router.get('/', function (req, res) {
    res.send({"result": true, "message": "I'm working!"});
});

router.get('/users', function (req, res) {
    res.send({"result": true, "message": "I'm working!"});
});

// Get user by id.
router.get('/users/:edxid', function (req, res) {
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
                        "name": r_user.name,
                        "password": r_user.password,
                        "private_key": r_user.privateKey,
                        "public_key": r_user.publicKey
                    }
                });
                return;
            } else {
                sendErrorMessage(res, 'user id does not exist');
                return;
            }
        });
    }
    catch (ex) {
        sendErrorMessage(res, 'internal error');
        return;
    }
});

// Create user
router.post('/users', function (req, res) {
    try {
        api.createGitLabAccount(req.body.edxid, req.body.username, req.body.email, function (result) {
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
                return;
            } else {
                sendErrorMessage(res, result.message);
                return;
            }
        });
    }
    catch (ex) {
        sendErrorMessage(res, 'internal error');
        return;
    }
});

function sendErrorMessage(res, msg) {
    res.send({"result": false, "message": msg});
}

module.exports = router;
