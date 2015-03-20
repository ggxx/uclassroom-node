'use strict';

var fs = require('fs');
var util = require('./util.js');
var db = require('./db.js');
var models = require('./model.js');
var git = require('./git.js');
var dockerApi = require('./docker-tls-api.js');
var config = JSON.parse(fs.readFileSync('./public/config.json'));


function _createGitLabAccount(edxid, username, email, callback) {
    if (util.isEmpty(edxid)) {
        callback({result: false, message: 'edx id cannot be empty'});
        return;
    }

    if (edxid.length != 32) {
        callback({result: false, message: 'invalid edx id'});
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
                                                // build docker
                                                db.getLabByName(config.LAB.DEFAULT_UCORE, function (result_lab) {
                                                    var docker = new models.Docker();
                                                    docker.name = config.LAB.DEFAULT_UCORE;
                                                    docker.lab = result_lab;
                                                    docker.builder = user;
                                                    docker.startBuildTime = new Date();
                                                    docker.status = 'building';
                                                    db.insertDocker(docker, function (result_num) {
                                                        dockerApi.buildStudentDocker(config.DOCKER.HOST, config.DOCKER.PORT,
                                                            config.DOCKER.CA, config.DOCKER.CERT, config.DOCKER.KEY, config.DOCKER.MEMORY,
                                                            docker, user.privateKey, user.publicKey,
                                                            user.name, user.password, user.email, user.gitToken,
                                                            config.GIT.HOST, config.GIT.PORT,
                                                            config.GIT.TEACHER.TOKEN, config.DOCKER.NAMESPACE,
                                                            function () {
                                                                db.getUserDockerByName(user.name, docker.name, function (result_docker) {
                                                                    result_docker.contId = docker.contId;
                                                                    result_docker.buildTime = new Date();
                                                                    result_docker.status = 'ready';
                                                                    db.updateDocker(result_docker, function (result_num) {
                                                                        db.getUserByName(user.name, function (r_user) {
                                                                            callback({result: true, user: r_user});
                                                                            return;
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    } else {
                        callback({result: false, message: err});
                        return;
                    }
                });
            });
        });
    });
}


exports.createGitLabAccount = _createGitLabAccount;
