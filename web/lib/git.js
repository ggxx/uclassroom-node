'use strict';

var http = require('http');
var qs = require('querystring');
var util = require('./util.js');
var jslogger = util.getJsLogger();

function _createGitAccount(host, port, adminToken, email, password, username, name, callback) {
    jslogger.info('git.createGitAccount');
    var opt = {
        host: host,
        port: port,
        method: 'POST',
        path: '/api/v3/users?private_token=' + adminToken,
        headers: {}
    };
    var body = '';

    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    var data = {email: email, password: password, username: username, name: name};
    req.write(qs.stringify(data));
    req.end();
}

function _removeGitAccount(host, port, adminToken, gitid, callback) {
    jslogger.info('git.removeGitAccount');
    var opt = {
        host: host,
        port: port,
        method: 'DELETE',
        path: '/api/v3/users/' + gitid + '?private_token=' + adminToken,
        headers: {}
    };
    var body = '';

    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    req.end();
}

function _addSSHKey(host, port, adminToken, gitid, title, key, callback) {
    jslogger.info('git.addSSHKey');
    var opt = {
        host: host,
        port: port,
        method: 'POST',
        path: '/api/v3/users/' + gitid + '/keys?private_token=' + adminToken,
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    var data = {title: title, key: key};
    req.write(qs.stringify(data));
    req.end();
}

function _forkProject(host, port, token, projectid, callback) {
    jslogger.info('git.forkProject');
    var opt = {
        host: host,
        port: port,
        method: 'POST',
        path: '/api/v3/projects/fork/' + projectid + '?private_token=' + token,
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    req.end();
}

function _addProjectDeveloper(host, port, userToken, projectid, developerid, callback) {
    jslogger.info('git.addProjectDeveloper');
    var opt = {
        host: host,
        port: port,
        method: 'POST',
        path: '/api/v3/projects/' + projectid + '/members?private_token=' + userToken,
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    var data = {user_id: developerid, access_level: 30};
    req.write(qs.stringify(data));
    req.end();
}

function _createPrivateProject(host, port, userToken, projectname, callback) {
    jslogger.info('git.createPrivateProject');
    var opt = {
        host: host,
        port: port,
        method: 'POST',
        path: '/api/v3/projects?private_token=' + userToken,
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    var data = {name: projectname, visibility_level: 0};
    req.write(qs.stringify(data));
    req.end();
}

function _session(host, port, username, password, callback) {
    jslogger.info('git.session');
    var opt = {
        host: host,
        port: port,
        method: 'POST',
        path: '/api/v3/session',
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    var data = {login: username, password: password};
    req.write(qs.stringify(data));
    req.end();
}

function _getUserProjects(host, port, userToken, callback) {
    jslogger.info('git.getUserProjects');
    var opt = {
        host: host,
        port: port,
        method: 'GET',
        path: '/api/v3/projects/owned?private_token=' + userToken,
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {

            // choose public project
            var projects = eval(body);
            var pubProjects = [];
            for (var i = 0; i < projects.length; i++) {
                if (projects[i].public == true) {
                    pubProjects.push(projects[i].name);
                }
            }
            callback(pubProjects);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    req.end();
}

function _getUserByToken(host, port, userToken, callback) {
    jslogger.info('git.getUserByToken');
    var opt = {
        host: host,
        port: port,
        method: 'GET',
        path: '/api/v3/user?private_token=' + userToken,
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    req.end();
}

function _getUser(host, port, token, name, email, callback) {
    jslogger.info('git.getUser');
    var opt = {
        host: host,
        port: port,
        method: 'GET',
        path: '/api/v3/users?private_token=' + token,
        headers: {}
    };
    var body = '';
    var req = http.request(opt, function (res) {
        jslogger.info("Got response: " + res.statusCode);
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            // choose public project
            var users = eval(body);
            for (var i = 0; i < users.length; i++) {
                if (name != '' && users[i].username == name) {
                    callback(users[i]);
                    break;
                } else if (email != '' && users[i].email == email) {
                    callback(users[i]);
                    break;
                }
            }
        });
        callback({});
    });
    req.on('error', function (e) {
        jslogger.info("Got error: " + e.message);
    });
    req.end();
}


exports.createGitAccount = _createGitAccount;
exports.removeGitAccount = _removeGitAccount;
exports.addSSHKey = _addSSHKey;
exports.session = _session;
exports.forkProject = _forkProject;
exports.createPrivateProject = _createPrivateProject;
exports.addProjectDeveloper = _addProjectDeveloper;
exports.getUserProjects = _getUserProjects;
exports.getUser = _getUser;
exports.getUserByToken = _getUserByToken;
