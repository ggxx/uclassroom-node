'use strict';

var process = require('child_process');
var colors = require('colors');
var fs = require('fs');
var git = require('./git.js');
var util = require('./util.js');
var loggerUtil = require('./logger.js');
var jslogger = loggerUtil.getLogger();

var tmp_path = '/tmp/uclassroom/';

function _buildLabDocker(host, port, ca, cert, key, mem_limit, docker_namespace, lab_name, docker_file_text, callback) {
    jslogger.info('docker.buildLabDocker');
    fs.exists(tmp_path, function (exists) {
        if (!exists) {
            fs.mkdirSync(tmp_path);
        }
        var my_path = tmp_path + util.guid() + '/';
        fs.mkdirSync(my_path);
        var dockerFile = my_path + 'Dockerfile';
        fs.appendFileSync(dockerFile, docker_file_text);
        var cmd = 'cd ' + my_path + ' && ' +
            ' docker --tlsverify ' +
            ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
            ' -H=tcp://' + host + ':' + port +
            ' build --rm -t ' + docker_namespace + '/' + lab_name + ' .';
        jslogger.info('[exec] ' + cmd);
        process.exec(cmd, function (error, stdout, stderr) {
            if (error !== null) {
                jslogger.error('exec error: ' + error);
            }
            else {
                jslogger.info('docker is ready');
                callback('ok');
            }
        });
    });
}

function _buildStudentDocker(host, port, ca, cert, key, mem_limit, docker, private_key, public_key, user_name, user_psw, user_email, user_token, git_host, git_port, teacher_token, docker_namespace, callback) {
    jslogger.info('docker.buildStudentDocker');
    fs.exists(tmp_path, function (exists) {
        if (!exists) {
            fs.mkdirSync(tmp_path);
        }
        var my_path = tmp_path + util.guid() + '/';
        fs.mkdirSync(my_path);

        git.getUserByToken(git_host, git_port, teacher_token, function (r_teacher) {
            var r_teacher = JSON.parse(r_teacher);
            var teacher_name = r_teacher.username;
            var dockerFile = my_path + 'Dockerfile';
            var dockerFileText = _createStudentDockerfile(docker, private_key, public_key, user_name, user_psw, user_email, git_host, git_port, docker_namespace, teacher_name);
            fs.appendFileSync(dockerFile, dockerFileText);
            git.createPrivateProject(git_host, git_port, user_token, docker.name, function (a) {
                git.addProjectDeveloper(git_host, git_port, user_token, user_name + '%2F' + docker.name, r_teacher.id, function (b) {
                    var student_namespace = user_name.toLowerCase();
                    if (student_namespace.length < 4) {
                        student_namespace += "____";
                    }
                    var cmd = 'cd ' + my_path + ' && ' +
                        ' docker --tlsverify ' +
                        ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
                        ' -H=tcp://' + host + ':' + port +
                        ' build --rm -t ' + student_namespace + '/' + docker.name + ' .';
                    jslogger.info('[exec] ' + cmd);
                    process.exec(cmd, function (error, stdout, stderr) {
                        if (error !== null) {
                            jslogger.error('exec error: ' + error);
                        }
                        else {
                            var cmd2 = ' docker --tlsverify ' +
                                ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
                                ' -H=tcp://' + host + ':' + port +
                                ' create -p :8080 -p :6080 -m ' + mem_limit + ' ' + student_namespace + '/' + docker.name;
                            jslogger.info('[exec] ' + cmd2);
                            process.exec(cmd2, function (error, stdout, stderr) {
                                if (error !== null) {
                                    jslogger.error('exec error: ' + error);
                                } else {
                                    docker.contId = stdout.toString().replace(/\n/g, "");
                                    jslogger.info('docker is ready');
                                    callback('ok');
                                }
                            });
                        }
                    });
                });
            });
        });
    });
}

function _startStudentDocker(host, port, ca, cert, key, docker, callback) {
    jslogger.info('docker.startStudentDocker');
    var cmd = ' docker --tlsverify ' +
        ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
        ' -H=tcp://' + host + ':' + port +
        ' start ' + docker.contId;
    jslogger.info('[exec] ' + cmd);
    process.exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            jslogger.error('exec error: ' + error);
        } else {
            var cmd2 = cmd = ' docker --tlsverify ' +
            ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
            ' -H=tcp://' + host + ':' + port +
            ' port ' + docker.contId;
            jslogger.info('[exec] ' + cmd2);
            process.exec(cmd2, function (error, stdout, stderr) {
                if (error !== null) {
                    jslogger.error('exec error: ' + error);
                } else {
                    //stdout:
                    // 6080/tcp -> 0.0.0.0:49100
                    // 8080/tcp -> 0.0.0.0:49101
                    docker.host = host;
                    stdout.toString().split("\n").forEach(function (item) {
                        if (item.split('/')[0] == '6080') {
                            // noVNC port
                            docker.vnc = item.split(":")[1].replace(/\n/g, "");
                        } else if (item.split('/')[0] == '8080') {
                            // ttyjs port
                            docker.port = item.split(":")[1].replace(/\n/g, "");
                        }
                    });
                    jslogger.info('docker is running');
                    callback('ok');
                }
            });
        }
    });
}

function _stopStudentDocker(host, port, ca, cert, key, docker, callback) {
    jslogger.info('docker.stopStudentDocker');
    var cmd = ' docker --tlsverify ' +
        ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
        ' -H=tcp://' + host + ':' + port +
        ' stop ' + docker.contId;
    jslogger.info('[exec] ' + cmd);
    process.exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            jslogger.error('exec error: ' + error);
        } else {
            jslogger.info('docker is stopped');
            callback('ok');
        }
    });
}

function _rebuildStudentDocker(host, port, ca, cert, key, mem_limit, docker, private_key, public_key, user_name, user_psw, user_email, user_token, git_host, git_port, teacher_token, docker_namespace, callback) {
    jslogger.info('docker.rebuildStudentDocker');

    _stopStudentDocker(host, port, ca, cert, key, docker, function (result) {
        var rmCmd = 'docker --tlsverify ' +
            ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
            ' -H=tcp://' + host + ':' + port +
            ' rm ' + docker.contId;
        jslogger.info('[exec] ' + rmCmd);
        process.exec(rmCmd, function (error, stdout, stderr) {
            var student_namespace = user_name.toLowerCase();
            if (student_namespace.length < 4) {
                student_namespace += "____";
            }
            var rmiCmd = 'docker --tlsverify ' +
                ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
                ' -H=tcp://' + host + ':' + port +
                ' rmi ' + student_namespace + '/' + docker.name;
            jslogger.info('[exec] ' + rmiCmd);
            process.exec(rmiCmd, function (error, stdout, stderr) {
                var cmd = 'cd ' + my_path + ' && ' +
                    ' docker --tlsverify ' +
                    ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
                    ' -H=tcp://' + host + ':' + port +
                    ' build --rm -t ' + student_namespace + '/' + docker.name + ' .';
                jslogger.info('[exec] ' + cmd);
                process.exec(cmd, function (error, stdout, stderr) {
                    if (error !== null) {
                        jslogger.error('exec error: ' + error);
                    }
                    else {
                        var createCmd = ' docker --tlsverify ' +
                            ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
                            ' -H=tcp://' + host + ':' + port +
                            ' create -p :8080 -m ' + mem_limit + ' ' + student_namespace + '/' + docker.name;
                        jslogger.info('[exec] ' + createCmd);
                        process.exec(createCmd, function (error, stdout, stderr) {
                            if (error !== null) {
                                jslogger.error('exec error: ' + error);
                            } else {
                                docker.contId = stdout.toString().replace(/\n/g, "");
                                jslogger.info('docker is ready');
                                callback('ok');
                            }
                        });
                    }
                });
            });
        });
    });
}

function _createStudentDockerfile(docker, private_key, public_key, user_name, user_pwd, user_email, git_host, git_port, docker_namespace, teacher_name) {
    var dockerfile =
        'FROM ' + docker_namespace + '/' + docker.lab.name +
        '\nMAINTAINER Guo Xu <ggxx120@gmail.com>' +
        '\n' +
        '\nRUN echo -ne "' + private_key.replace(/\n/g, '\\n') + '" > /root/.ssh/id_rsa;\\' +
        '\n  echo -ne "' + public_key.replace(/\n/g, '\\n') + '" > /root/.ssh/id_rsa.pub;\\' +
        '\n  chmod 0600 /root/.ssh/id_rsa ;\\' +
        '\n  echo -ne "' + _createStartupShell() + '" > /startup.sh;\\' +
        '\n  chmod +x /startup.sh;\\' +
        '\n  echo -ne "' + _createTTYJSConfig(user_name, user_pwd) + '" > /opt/ttyjs/ttyjs-config.json;\\' +
        '\n  echo ' + user_pwd + ' | echo $(vncpasswd -f) > /root/.vnc/passwd;\\' +
        '\n  chmod 0600 /root/.vnc/passwd;\\' +
        '\n  git config --global user.name "' + user_name + '" ;\\' +
        '\n  git config --global user.email "' + user_email + '" ;\\' +
        '\n  echo -ne "StrictHostKeyChecking no\\nUserKnownHostsFile /dev/null\\n" >> /etc/ssh/ssh_config ;\\' +
        '\n  cd /ucore_lab/ && git remote add origin git@' + git_host + ':' + user_name + '/' + docker.name + '.git && git push -u origin master' +
        '\n' +
            //'\n EXPOSE 22' +
            //'\n EXPOSE 5901' +
        '\nEXPOSE 6080' +
        '\nEXPOSE 8080' +
        '\nENTRYPOINT ["/startup.sh"]';
    jslogger.info(dockerfile);
    return dockerfile;
}

function _createTTYJSConfig(username, password) {
    var text =
        '{' +
        '\\n  \\"users\\": {' +
        '\\n    \\"' + username + '\\": \\"' + password + '\\"' +
        '\\n  },' +
        '\\n  \\"port\\": 8080,' +
        '\\n  \\"hostname\\": \\"0.0.0.0\\",' +
        '\\n  \\"shell\\": \\"bash\\",' +
        '\\n  \\"limitGlobal\\": 10000,' +
        '\\n  \\"limitPerUser\\": 1000,' +
        '\\n  \\"localOnly\\": false,' +
        '\\n  \\"cwd\\": \\"/ucore_lab\\",' +
        '\\n  \\"syncSession\\": false,' +
        '\\n  \\"sessionTimeout\\": 600000,' +
        '\\n  \\"log\\": true,' +
        '\\n  \\"io\\": { \\"log\\": false },' +
        '\\n  \\"debug\\": false,' +
        '\\n  \\"term\\": {' +
        '\\n    \\"termName\\": \\"xterm\\",' +
        '\\n    \\"geometry\\": [160, 48],' +
        '\\n    \\"scrollback\\": 1000,' +
        '\\n    \\"visualBell\\": false,' +
        '\\n    \\"popOnBell\\": false,' +
        '\\n    \\"cursorBlink\\": false,' +
        '\\n    \\"screenKeys\\": false,' +
        '\\n    \\"colors\\": [' +
        '\\n      \\"#2e3436\\",' +
        '\\n      \\"#cc0000\\",' +
        '\\n      \\"#4e9a06\\",' +
        '\\n      \\"#c4a000\\",' +
        '\\n      \\"#3465a4\\",' +
        '\\n      \\"#75507b\\",' +
        '\\n      \\"#06989a\\",' +
        '\\n      \\"#d3d7cf\\",' +
        '\\n      \\"#555753\\",' +
        '\\n      \\"#ef2929\\",' +
        '\\n      \\"#8ae234\\",' +
        '\\n      \\"#fce94f\\",' +
        '\\n      \\"#729fcf\\",' +
        '\\n      \\"#ad7fa8\\",' +
        '\\n      \\"#34e2e2\\",' +
        '\\n      \\"#eeeeec\\"' +
        '\\n    ]' +
        '\\n  }' +
        '\\n}';
    return text;
}

function _createStartupShell() {
    var text =
        '#!/usr/bin/env bash \\n' +
        '(vncserver && /opt/noVNC/utils/launch.sh --vnc localhost:5901) & tty.js --config /opt/ttyjs/ttyjs-config.json';
    return text;
}

exports.buildLabDocker = _buildLabDocker;
exports.buildStudentDocker = _buildStudentDocker;
exports.startStudentDocker = _startStudentDocker;
exports.stopStudentDocker = _stopStudentDocker;
exports.rebuildStudentDocker = _rebuildStudentDocker;
