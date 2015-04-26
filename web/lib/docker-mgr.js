'use strict';

var colors = require('colors');
var cookieParser = require('cookie-parser');
var util = require('./util.js');
var models = require('./model.js');
var dockerUtil = require('./docker-tls-api.js');
var loggerUtil = require('./logger.js');
var jslogger = loggerUtil.getLogger();

function _listen(io, db, config) {
    var nsp = io.of('/docker');
    nsp.on('connection', function (socket) {
        jslogger.info('docker.socket on [connection]');

        var user;
        socket.on('bind', function (edxid) {
            jslogger.info('docker.socket on [bind]');
            db.getUserByEdxId(edxid, function (result_user) {
                if (util.isEmpty(result_user)) {
                    socket.emit('error', 'cannot find edx id');
                    return;
                }
                user = result_user;
                emitDockers();
            });
        });

        socket.on('dockers', function () {
            jslogger.info('docker.socket on [dockers]');
            emitDockers();
        });

        socket.on('build_docker', function (message) {
            jslogger.info('docker.socket on [build_docker]');
            // message.dockerLab: docker._id
            // message.dockerName: docker.name
            if (util.isEmpty(message.dockerLab) || util.isEmpty(message.dockerName) || (message.dockerLab.length != 12 && message.dockerLab.length != 24)) {
                socket.emit('error', 'build docker failed, invalid parameters');
                return;
            }
            var exp = /[a-z0-9-_]+/;
            var result = exp.test(message.dockerName);
            if (result == false) {
                socket.emit('error', 'Invalid docker name, only [a-z0-9-_] are allowed');
                return;
            }
            if (message.dockerName.length < 4 || message.dockerName.length > 30) {
                socket.emit('error', 'Invalid docker name, size between 4 and 30');
                return;
            }

            db.findLab(message.dockerLab, function (result_lab) {
                if (util.isEmpty(result_lab)) {
                    socket.emit('error', 'build docker failed, parameters error');
                    return;
                }
                var docker = new models.Docker();
                docker.name = convertToDockerName(message.dockerName);
                docker.lab = result_lab;
                docker.builder = user;
                docker.startBuildTime = new Date();
                docker.status = 'building';
                db.insertDocker(docker, function (result_num) {
                    emitDockers();
                    dockerUtil.buildStudentDocker(config.DOCKER.HOST, config.DOCKER.PORT,
                        config.DOCKER.CA, config.DOCKER.CERT, config.DOCKER.KEY, config.DOCKER.MEMORY,
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
            jslogger.info('docker.socket on [start_docker]');
            db.findDocker(dockerid, function (result_docker) {
                if (util.isEmpty(result_docker)) {
                    socket.emit('error', 'cannot find docker, parameters error');
                    return;
                }
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
            jslogger.info('docker.socket on [stop_docker]');
            db.findDocker(dockerid, function (result_docker) {
                if (util.isEmpty(result_docker)) {
                    socket.emit('error', 'cannot find docker, parameters error');
                    return;
                }
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

        function convertToDockerName(name) {
            return name.toLowerCase().replace(/\./g, '-');
        }
    });
}

exports.listen = _listen;
