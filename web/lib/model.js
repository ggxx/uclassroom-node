function _user() {
}
_user.prototype = {
    name: '',
    password: '',
    email: '',
    classroom: {},
    cameraSharing: false,
    microphoneSharing: false,
    screenSharing: false,
    socket: '',
    gitId: '',
    gitToken: '',
    privateKey: '',
    publicKey: '',
    edxId: ''
}

function _classroom() {
}
_classroom.prototype = {
    name: '',
    password: '',
    creator: {},
    creatingTime: null,
    endingTime: null
}

function _message() {
}
_message.prototype = {
    text: '',
    room: {},
    sender: {},
    time: null
}

function _connection() {
}
_connection.prototype = {
    offer: {},
    answer: {},
    creatingTime: null,
    endingTime: null,
    type: {}
}

function _docker() {
}
_docker.prototype = {
    name: '',
    lab: {},
    builder: {},
    startBuildTime: null,
    buildTime: null,
    lastRunTime: null,
    contId: '',
    host: '',
    port: 0,
    status: ''
}

function _lab() {
}
_lab.prototype = {
    name: '',
    desc: '',
    dockerFile: '',
    project: '',
    creatingTime: null,
    status: ''
}

function _result() {
}
_result.prototype = {
    docker: {},
    commits: [],
    result: '',
    grade: '',
    build_time: null,
    infos: []
}
/*
 function _commit(){}
 _commit.prototype = {
 id: '',
 author: '',
 committer: '',
 authored_date: '',
 committed_date: '',
 message: ''
 }

 function _info(){}
 _info.prototype = {
 name: '',
 time: '',
 result: {
 timeout: false,
 status: 0,
 output: [],
 pid: 0
 }
 }
 */

exports.User = _user;
exports.Message = _message;
exports.Connection = _connection;
exports.Classroom = _classroom;
exports.Docker = _docker;
exports.Lab = _lab;
exports.Result = _result;
//exports.Commit = _commit;
//exports.Info = _info;
