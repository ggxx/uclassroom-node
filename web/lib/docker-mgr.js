'use strict';

var colors = require('colors');
var cookieParser = require('cookie-parser');
var util = require('./util.js');
var models = require('./model.js');
var dockerUtil = require('./docker-tls-api.js');

function _listen(io, db, config) {
    var nsp = io.of('/cloud');
    nsp.on('connection', function (socket) {
        console.log('socket on [connection]'.blue);

        var user;
        socket.on('bind', function (edxid) {
            console.log('bind');
            db.getUserByEdxId(edxid, function (result_user) {
                user = result_user;
                emitDockers();
            });
        });

        socket.on('dockers', function () {
            console.log('dockers');
            emitDockers();
        });

        socket.on('build_docker', function (message) {
            console.log('build_docker');
            if (util.isEmpty(message.dockerLab) || util.isEmpty(message.dockerName) || (message.dockerLab.length != 12 && message.dockerLab.length != 24)) {
                socket.emit('build_docker');
                return;
            }
            db.findLab(message.dockerLab, function (result_lab) {
                var docker = new models.Docker();
                docker.name = message.dockerName;
                docker.lab = result_lab;
                docker.builder = user;
                docker.startBuildTime = new Date();
                docker.status = 'building';
                db.insertDocker(docker, function (result_num) {
                    emitDockers();
                    dockerUtil.buildStudentDocker(config.DOCKER.HOST, config.DOCKER.PORT,
                        config.DOCKER.CA, config.DOCKER.CERT, config.DOCKER.KEY,
                        docker, user.privateKey, user.publicKey, user.name, user.password, user.email, user.gitToken,
                        config.GIT.HOST, config.GIT.PORT, config.GIT.TEACHER.TOKEN, config.DOCKER.NAMESPACE,
                        function () {
                            db.getUserDockerByName(user.name, docker.name, function (result_docker) {
                                result_docker.contId = docker.contId;
                                result_docker.buildTime = new Date();
                                result_docker.status = 'ready';
                                db.updateDocker(result_docker, function (result_num) {
                                    emitDockers();
                                });
                            });
                        });
                });
            });
        });

        socket.on('start_docker', function (dockerid) {
            console.log('start_docker');
            db.findDocker(dockerid, function (result_docker) {
                result_docker.status = 'starting';
                db.updateDocker(result_docker, function (result_num) {
                    emitDockers();
                    dockerUtil.startStudentDocker(config.DOCKER.HOST, config.DOCKER.PORT,
                        config.DOCKER.CA, config.DOCKER.CERT, config.DOCKER.KEY, result_docker,
                        function () {
                            result_docker.status = 'running';
                            db.updateDocker(result_docker, function (result_num) {
                                emitDockers();
                            });
                        });
                });
            });
        });

        socket.on('stop_docker', function (dockerid) {
            console.log('stop_docker');
            db.findDocker(dockerid, function (result_docker) {
                result_docker.status = 'stopping';
                db.updateDocker(result_docker, function (result_num) {
                    emitDockers();
                    dockerUtil.stopStudentDocker(config.DOCKER.HOST, config.DOCKER.PORT,
                        config.DOCKER.CA, config.DOCKER.CERT, config.DOCKER.KEY, result_docker,
                        function () {
                            result_docker.status = 'ready';
                            db.updateDocker(result_docker, function (result_num) {
                                emitDockers();
                            });
                        });
                });
            });
        });

        function emitDockers() {
            db.getUserDockers(user._id, function (result_dockers) {
                socket.emit('dockers', result_dockers);
            });
        }
    });
}

exports.listen = _listen;
