var fs = require('fs');
var util = require('./util.js');
var db = require('./db.js');
var models = require('./model.js');
var git = require('./git.js');
var config = JSON.parse(fs.readFileSync('./public/config.json'));


function _createGitLabAccount(edxid, username, email, callback) {
    if (util.isEmpty(edxid)) {
        callback({result: false, message: 'edx id cannot be empty'});
        return;
    }

    db.getUserByEdxId(edxid, function (r_user) {
        if (!util.isEmpty(r_user)) {
            callback({result: false, message: 'edx id has been registered'});
            return;
        }
        if (util.isEmpty(username)) {
            callback({result: false, message: 'user name cannot be empty'});
            return;
        }
        if (util.isEmpty(email)) {
            callback({result: false, message: 'email cannot be empty'});
            return;
        }
        db.getUserByName(username, function (r_user) {
            if (!util.isEmpty(r_user)) {
                callback({result: false, message: 'name has been used'});
                return;
            }
            db.getUserByEmail(email, function (r_user) {
                if (!util.isEmpty(r_user)) {
                    callback({result: false, message: 'email has been used'});
                    return;
                }
                // create account
                var user = new models.User();
                user.name = username;
                user.password = util.randomId();
                user.creatingTime = new Date();
                user.email = email;
                user.edxId = edxid;

                db.validateUser(user, function (err) {
                    if (err == '') {
                        //Add git account and get git id
                        git.createGitAccount(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.email, user.password, user.name, user.name, function (body) {
                            var gitMsg = JSON.parse(body);
                            if (!util.isEmpty(gitMsg.message)) {
                                callback({result: false, message: JSON.stringify(gitMsg.message)});
                                return;
                            } else {
                                user.gitId = gitMsg.id;
                                // get git token
                                git.session(config.GIT.HOST, config.GIT.PORT, user.name, user.password, function (result_body) {
                                    gitMsg = JSON.parse(result_body);
                                    user.gitToken = gitMsg.private_token;
                                    // Create ssh key
                                    util.genSSHKey(user.email, function (priKey, pubKey) {
                                        user.privateKey = priKey;
                                        user.publicKey = pubKey;
                                        // Add ssh key to git
                                        git.addSSHKey(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.gitId, 'default ssh key', user.publicKey, function () {
                                            // Add new user
                                            db.insertUser(user, function (r) {
                                                db.getUserByName(user.name, function (r_user) {
                                                    callback({result: true, user: r_user});
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    }
                    else {
                        callback({result: false, message: err});
                        return;
                    }
                });
            });
        });
    });
}


exports.createGitLabAccount = _createGitLabAccount;