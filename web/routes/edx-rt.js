var fs = require('fs');
var express = require('express');
var url = require('url');
var util = require('../lib/util.js');
var git = require('../lib/git.js');
var db = require('../lib/db.js');
var models = require('../lib/model.js');
var dockerApi = require('../lib/docker-tls-api.js');
var config = JSON.parse(fs.readFileSync('./public/config.json'));
var router = express.Router();


router.get('/rtc', function (req, res) {

    var args = url.parse(req.url, true).query;
    if (util.isEmpty(args.id)) {
        res.render('message.html.ejs', {title: 'rtc', message: 'error parameters'});
        return;
    }

    db.getUserByEdxId(args.id, function (result_user) {
        if (!util.isEmpty(result_user)) {
            res.render('rtc.html.ejs', {title: 'rtc', message: 'ok'});
            return;
        } else {
            if (util.isEmpty(args.username) || util.isEmpty(args.email)) {
                res.render('message.html.ejs', {title: 'rtc', message: 'error parameters'});
                return;
            }
            var user = new models.User();
            user.name = args.username;
            user.password = util.randomId();
            user.creatingTime = new Date();
            user.email = args.email;
            user.edxId = args.id;
            git.getUser(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.name, user.email, function (r_user) {
                if (!util.isEmpty(r_user)) {
                    res.render('message.html.ejs', {title: 'rtc', message: 'user name or email has been used'});
                    return;
                } else {
                    // Check user before insert
                    db.validateUser(user, function (err) {
                        if (err == '') {
                            //Add git account and get git id
                            git.createGitAccount(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.email, user.password, user.name, user.name, function (body) {
                                var gitMsg = JSON.parse(body);
                                if (!util.isEmpty(gitMsg.message)) {
                                    res.render('message.html.ejs', {
                                        title: 'rtc',
                                        message: JSON.stringify(gitMsg.message)
                                    });
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
                                            git.addSSHKey(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.gitId, 'uClassroomKey', user.publicKey, function () {
                                                // Add new user
                                                db.insertUser(user, function (r) {
                                                    res.render('rtc.html.ejs', {title: 'rtc', message: 'ok'});
                                                    return;
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        }
                        else {
                            res.render('message.html.ejs', {title: 'rtc', message: err});
                            return;
                        }
                    });
                }
            });
        }
    });

});

router.get('/docker', function (req, res) {

    var args = url.parse(req.url, true).query;
    if (util.isEmpty(args.id)) {
        res.render('message.html.ejs', {title: 'docker', message: 'error parameters'});
        return;
    }

    db.getUserByEdxId(args.id, function (result_user) {
        if (!util.isEmpty(result_user)) {
            db.getReadyLabs(function (r_labs) {
                res.render('docker.html.ejs', {
                    title: 'docker', labs: r_labs,
                    ttyjs_name: result_user.name, ttyjs_password: result_user.password,
                    message: ''
                });
                return;
            });
        } else {
            if (util.isEmpty(args.username) || util.isEmpty(args.email)) {
                res.render('message.html.ejs', {title: 'docker', message: 'error parameters'});
                return;
            }
            var user = new models.User();
            user.name = args.username;
            user.password = util.randomId();
            user.creatingTime = new Date();
            user.email = args.email;
            user.edxId = args.id;
            git.getUser(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.name, user.email, function (r_user) {
                if (!util.isEmpty(r_user)) {
                    res.render('message.html.ejs', {title: 'docker', message: 'user name or email has been used'});
                    return;
                } else {
                    // Check user before insert
                    db.validateUser(user, function (err) {
                        if (err == '') {
                            //Add git account and get git id
                            git.createGitAccount(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.email, user.password, user.name, user.name, function (body) {
                                var gitMsg = JSON.parse(body);
                                if (!util.isEmpty(gitMsg.message)) {
                                    res.render('message.html.ejs', {
                                        title: 'docker',
                                        message: JSON.stringify(gitMsg.message)
                                    });
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
                                            git.addSSHKey(config.GIT.HOST, config.GIT.PORT, config.GIT.TOKEN, user.gitId, 'uClassroomKey', user.publicKey, function () {
                                                // Add new user
                                                db.insertUser(user, function (r) {
                                                    db.getReadyLabs(function (r_labs) {
                                                        res.render('docker.html.ejs', {
                                                            title: 'docker',
                                                            labs: r_labs,
                                                            ttyjs_name: user.name,
                                                            ttyjs_password: user.password,
                                                            message: ''
                                                        });
                                                        return;
                                                    });
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        }
                        else {
                            res.render('message.html.ejs', {title: 'docker', message: err});
                            return;
                        }
                    });
                }
            });
        }
    });
});

router.get('/labs', function (req, res) {
    db.getLabs(function (result_labs) {
        git.getUserProjects(config.GIT.HOST, config.GIT.PORT, config.GIT.TEACHER.TOKEN, function (result_projects) {
            res.render('labs.html.ejs', {
                title: 'labs',
                username: '',
                labs: result_labs,
                projects: result_projects,
                message: ''
            });
        });
    });
});

router.post('/labs', function (req, res) {

    git.getUserByToken(config.GIT.HOST, config.GIT.PORT, config.GIT.TEACHER.TOKEN, function (result_user) {
        var lab = new models.Lab();
        lab.name = req.body.name;
        lab.desc = req.body.desc;
        lab.dockerFile = req.body.dockerFile;
        lab.dockerType = req.body.dockerType;
        lab.project = req.body.project;
        lab.creatingTime = new Date();
        lab.makeScripts = req.body.makeScripts;
        lab.status = 'creating';

        db.validateLab(lab, function (err) {
            if (err != '') {
                res.render('message.html.ejs', {title: 'docker', message: err});
                return;
            }
            db.upsertLabByName(lab, function (result) {
                //build docker (step2)
                dockerApi.buildLabDocker(config.DOCKER.HOST, config.DOCKER.PORT,
                    config.DOCKER.CA, config.DOCKER.CERT, config.DOCKER.KEY,
                    config.DOCKER.NAMESPACE, lab.name, lab.dockerFile,
                    function (msg) {
                        db.getLabByName(lab.name, function (result_lab) {
                            result_lab.status = 'ready';
                            db.updateLab(result_lab, function (result2) {
                                db.getReadyLabs(function (r_labs) {
                                    res.render('docker.html.ejs', {
                                        title: 'docker',
                                        labs: r_labs,
                                        ttyjs_name: result_user.name,
                                        ttyjs_password: result_user.password,
                                        message: 'ok'
                                    });
                                    return;
                                });
                            });
                        });
                    }
                );
            });
        });
    });
});


module.exports = router;
