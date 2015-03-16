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
    try {
        var args = url.parse(req.url, true).query;

        if (!util.isEmpty(args.id)) {
            db.getUserByEdxId(args.id, function (r_user) {
                if (!util.isEmpty(r_user)) {
                    res.render('rtc.html.ejs', {title: 'rtc', message: ''});
                    return;
                }
            });
        }

        api.createGitLabAccount(args.id, args.username, args.email, function (result) {
            if (result.result == true) {
                res.render('rtc.html.ejs', {title: 'rtc', message: ''});
                return;
            } else {
                res.render('message.html.ejs', {title: 'rtc', message: result.message});
                return;
            }
        });
    }
    catch (ex) {
        res.render('message.html.ejs', {title: 'rtc', message: 'internal error'});
        return;
    }
});

router.get('/docker', function (req, res) {
    try {
        var args = url.parse(req.url, true).query;

        if (!util.isEmpty(args.id)) {
            db.getUserByEdxId(args.id, function (r_user) {
                if (!util.isEmpty(r_user)) {
                    db.getReadyLabs(function (r_labs) {
                        res.render('docker.html.ejs', {
                            title: 'docker', labs: r_labs,
                            ttyjs_name: r_user.name, ttyjs_password: r_user.password,
                            message: ''
                        });
                        return;
                    });
                }
            });
        }

        api.createGitLabAccount(args.id, args.username, args.email, function (result) {
            if (result.result == true) {
                db.getReadyLabs(function (r_labs) {
                    res.render('docker.html.ejs', {
                        title: 'docker', labs: r_labs,
                        ttyjs_name: result.user.name, ttyjs_password: result.user.password,
                        message: ''
                    });
                    return;
                });
            } else {
                res.render('message.html.ejs', {title: 'docker', message: result.message});
                return;
            }
        });
    }
    catch (ex) {
        res.render('message.html.ejs', {title: 'docker', message: 'internal error'});
        return;
    }
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
