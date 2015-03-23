'use strict';

var process = require('child_process');
var colors = require('colors');
var fs = require('fs');
var git = require('./git.js');
var util = require('./util.js');

var tmp_path = '/tmp/uclassroom/';

function _buildLabDocker(host, port, ca, cert, key, mem_limit, docker_namespace, lab_name, docker_file_text, callback) {
    console.info('_buildLabDocker');
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
        console.info('[exec] '.yellow + cmd.yellow);
        process.exec(cmd, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            else {
                console.log('docker is readly');
                callback('ok');
            }
        });
    });
}

function _buildStudentDocker(host, port, ca, cert, key, mem_limit, docker, private_key, public_key, user_name, user_psw, user_email, user_token, git_host, git_port, teacher_token, docker_namespace, callback) {
    console.info('_buildStudentDocker');
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
                    var cmd = 'cd ' + my_path + ' && ' +
                        ' docker --tlsverify ' +
                        ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
                        ' -H=tcp://' + host + ':' + port +
                        ' build --rm -t ' + student_namespace + '/' + docker.name + ' .';
                    console.info('[exec] '.yellow + cmd.yellow);
                    process.exec(cmd, function (error, stdout, stderr) {
                        if (error !== null) {
                            console.log('exec error: ' + error);
                        }
                        else {
                            var cmd2 = ' docker --tlsverify ' +
                                ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
                                ' -H=tcp://' + host + ':' + port +
                                ' create -p :8080 ' + student_namespace + '/' + docker.name;
                            console.info('[exec] '.yellow + cmd2.yellow);
                            process.exec(cmd2, function (error, stdout, stderr) {
                                if (error !== null) {
                                    console.log('exec error: ' + error);
                                }
                                else {
                                    docker.contId = stdout.toString();
                                    console.log('docker is readly');
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
    var cmd = ' docker --tlsverify ' +
        ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
        ' -H=tcp://' + host + ':' + port +
        ' start ' + docker.contId;
    console.info('[exec] '.yellow + cmd.yellow);
    process.exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        } else {
            var cmd2 = cmd = ' docker --tlsverify ' +
            ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
            ' -H=tcp://' + host + ':' + port +
            ' port ' + docker.contId;
            console.info('[exec] '.yellow + cmd2.yellow);
            process.exec(cmd2, function (error, stdout, stderr) {
                if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    //stdout2 "8080/tcp -> 0.0.0.0:49153"
                    docker.host = host;
                    docker.port = stdout.toString().split(":")[1];
                    callback('ok');
                }
            });
        }
    });
}

function _stopStudentDocker(host, port, ca, cert, key, docker, callback) {
    var cmd = ' docker --tlsverify ' +
        ' --tlscacert=' + ca + ' --tlscert=' + cert + ' --tlskey=' + key +
        ' -H=tcp://' + host + ':' + port +
        ' stop ' + docker.contId;
    console.info('[exec] '.yellow + cmd.yellow);
    process.exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        } else {
            callback('ok');
        }
    });
}

function _createStudentDockerfile(docker, private_key, public_key, user_name, user_pwd, user_email, git_host, git_port, docker_namespace, teacher_name) {
    var dockerfile =
        '# ' + docker.name +
        '\n#' +
        '\n# VERSION    0.0.1' +
        '\n' +
        '\nFROM ' + docker_namespace + '/' + docker.lab.name +
        '\nMAINTAINER Guo Xu <ggxx120@gmail.com>' +
        '\n' +
        '\nRUN echo -ne "' + private_key.replace(/\n/g, '\\n') + '" > /root/.ssh/id_rsa;\\' +
        '\n  echo -ne "' + public_key.replace(/\n/g, '\\n') + '" > /root/.ssh/id_rsa.pub;\\' +
        '\n  chmod 0600 /root/.ssh/id_rsa ;\\' +
        '\n  echo -ne "' + _createTTYJSConfig(user_name, user_pwd) + '" > /opt/ttyjs/ttyjs-config.json;\\' +
        '\n  git config --global user.name "' + user_name + '" ;\\' +
        '\n  git config --global user.email "' + user_email + '" ;\\' +
        '\n  echo -ne "StrictHostKeyChecking no\\nUserKnownHostsFile /dev/null\\n" >> /etc/ssh/ssh_config ;\\' +
        '\n  mkdir /' + docker.name + ' ;\\' +
        '\n  cd /' + docker.name + ' ;\\' +
        '\n  git init ;\\' +
        '\n  wget -q -O /' + docker.name + '/archive.tar.gz http://' + git_host + ':' + git_port + '/' + teacher_name + '/' + docker.lab.project + '/repository/archive.tar.gz ;\\' +
        '\n  tar -xzf /' + docker.name + '/archive.tar.gz -C /' + docker.name + '/ ;\\' +
        '\n  cp -r /' + docker.name + '/' + docker.lab.project + '.git/* /' + docker.name + '/ ;\\' +
        '\n  rm -r /' + docker.name + '/' + docker.lab.project + '.git ;\\' +
        '\n  rm /' + docker.name + '/archive.tar.gz ;\\' +
        '\n  cd /' + docker.name + ' ;\\' +
        '\n  git add . ;\\' +
        '\n  git remote add origin git@' + git_host + ':' + user_name + '/' + docker.name + '.git ;\\' +
        '\n  git commit -a -s -m "init" ;\\' +
        '\n  git push -u origin master ;' +
        '\n' +
        '\n EXPOSE 8080' +
        '\n ENTRYPOINT ["tty.js", "--config", "/opt/ttyjs/ttyjs-config.json"]';
    console.log(dockerfile);
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
        '\\n  \\"cwd\\": \\".\\",' +
        '\\n  \\"syncSession\\": false,' +
        '\\n  \\"sessionTimeout\\": 600000,' +
        '\\n  \\"log\\": true,' +
        '\\n  \\"io\\": { \\"log\\": false },' +
        '\\n  \\"debug\\": false,' +
        '\\n  \\"term\\": {' +
        '\\n    \\"termName\\": \\"xterm\\",' +
        '\\n    \\"geometry\\": [80, 24],' +
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

exports.buildLabDocker = _buildLabDocker;
exports.buildStudentDocker = _buildStudentDocker;
exports.startStudentDocker = _startStudentDocker;
exports.stopStudentDocker = _stopStudentDocker;
