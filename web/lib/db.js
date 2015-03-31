'use strict';

var mongodb = require('mongodb');
var util = require('../lib/util.js');
var jslogger = util.getJsLogger();
var db;

var USER_COLLECTION = 'users';
var ROOM_COLLECTION = 'rooms';
var MESSAGE_COLLECTION = 'messages';
var DOCKER_COLLECTION = 'dockers';
var LAB_COLLECTION = 'labs';
var RESULT_COLLECTION = 'results';

function _connect(url, callback) {
    jslogger.info("db.connect");
    mongodb.MongoClient.connect(url, function (err, database) {
        if (err) throw err;
        db = database;
        callback();
    });
}
function _validateUser(user, callback) {
    jslogger.info("db.validateUser");
    if (user.name.length > 30 || user.name.length < 4) {
        callback('The length of name must between 4 and 30!');
        return;
    }
    if (user.password.length > 30 || user.password.length < 8) {
        callback('The length of password must between 8 and 30!');
        return;
    }
    db.collection(USER_COLLECTION).findOne({'name': user.name}, function (err, result) {
        if (err) throw err;
        if (result == null) {
            db.collection(USER_COLLECTION).findOne({'email': user.email}, function (err2, result2) {
                if (err2) throw err2;
                if (result2 == null) {
                    callback('');
                }
                else {
                    callback('Email has been used');
                }
            });
        }
        else {
            callback('Name has been used');
        }
    });
}
function _insertUser(user, callback) {
    jslogger.info("db.insertUser");
    db.collection(USER_COLLECTION).insert(user, {safe: true}, function (err, result) {
        if (err) throw err;
        if (result.length > 0) callback(result[0]);
    });
}
function _updateUser(user, callback) {
    jslogger.info("db.updateUser");
    db.collection(USER_COLLECTION).update({'_id': mongodb.ObjectID(user._id)},
        {
            $set: {
                'name': user.name,
                'password': user.password,
                'email': user.email,
                'classroom': user.classroom,
                'cameraSharing': user.cameraSharing,
                'microphoneSharing': user.microphoneSharing,
                'screenSharing': user.screenSharing,
                'socket': user.socket,
                'gitId': user.gitId,
                'gitToken': user.gitToken,
                'privateKey': user.privateKey,
                'publicKey': user.publicKey,
                'edxId': user.edxId
            }
        }, function (err, result) {
            if (err) throw err;
            callback(result);
        });
}
function _findUser(userid, callback) {
    jslogger.info("db.findUser");
    db.collection(USER_COLLECTION).findOne({'_id': mongodb.ObjectID(userid)}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _getUserSocket(userid, callback) {
    jslogger.info("db.getUserSocket");
    db.collection(USER_COLLECTION).findOne({'_id': mongodb.ObjectID(userid)}, function (err, result) {
        if (err) throw err;
        callback(result.socket);
    });
}
function _login(name, password, callback) {
    jslogger.info("db.login");
    db.collection(USER_COLLECTION).findOne({'name': name, 'password': password}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _getUserByEdxId(edxid, callback) {
    jslogger.info("db.getUserByEdxId");
    db.collection(USER_COLLECTION).findOne({'edxId': edxid}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _getUserByEmail(email, callback) {
    jslogger.info("db.getUserByEmail");
    db.collection(USER_COLLECTION).findOne({'email': email}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _getUserByName(name, callback) {
    jslogger.info("db.getUserByName");
    db.collection(USER_COLLECTION).findOne({'name': name}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _removeUser(userid, callback) {
    jslogger.info("db.removeUser");
    db.collection(USER_COLLECTION).remove({'_id': mongodb.ObjectID(userid)}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _getUsersInRoom(roomid, callback) {
    jslogger.info("db.getUsersInRoom");
    db.collection(USER_COLLECTION).find({'classroom._id': mongodb.ObjectID(roomid)}).toArray(function (err, items) {
        if (err) throw err;
        callback(items);
    });
}
function _getRooms(callback) {
    jslogger.info("db.getRooms");
    db.collection(ROOM_COLLECTION).find().toArray(function (err, items) {
        if (err) throw err;
        callback(items);
    });
}
function _getCurrentRooms(callback) {
    jslogger.info("db.getCurrentRooms");
    db.collection(ROOM_COLLECTION).find({'endingTime': null}).toArray(function (err, items) {
        if (err) throw err;
        callback(items);
    });
}
function _findRoom(roomid, callback) {
    jslogger.info("db.findRoom");
    db.collection(ROOM_COLLECTION).findOne({'_id': mongodb.ObjectID(roomid)}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _insertRoom(room, callback) {
    jslogger.info("db.insertRoom");
    db.collection(ROOM_COLLECTION).insert(room, {safe: true}, function (err, result) {
        if (err) throw err;
        if (result.length > 0) callback(result[0]);
    });
}
function _updateRoom(room, callback) {
    jslogger.info("db.updateRoom");
    db.collection(ROOM_COLLECTION).update({'_id': mongodb.ObjectID(room._id)},
        {
            $set: {
                'name': room.name,
                'password': room.password,
                'creator': room.creator,
                'creatingTime': room.creatingTime,
                'endingTime': room.endingTime
            }
        }, function (err, result) {
            if (err) throw err;
            callback(result);
        });
}
function _insertMessage(message, callback) {
    jslogger.info("db.insertMessage");
    db.collection(MESSAGE_COLLECTION).insert(message, {safe: true}, function (err, result) {
        if (err) throw err;
        if (result.length > 0) callback(result[0]);
    });
}
function _insertDocker(docker, callback) {
    jslogger.info("db.insertDocker");
    db.collection(DOCKER_COLLECTION).insert(docker, {safe: true}, function (err, result) {
        if (err) throw err;
        if (result.length > 0) callback(result[0]);
    });
}
function _getUserDockers(userid, callback) {
    jslogger.info("db.getUserDockers");
    db.collection(DOCKER_COLLECTION).find({'builder._id': mongodb.ObjectID(userid)}).toArray(function (err, items) {
        if (err) throw err;
        callback(items);
    });
}
function _findDocker(dockerid, callback) {
    jslogger.info("db.findDocker");
    db.collection(DOCKER_COLLECTION).findOne({'_id': mongodb.ObjectID(dockerid)}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _getUserDockerByName(username, dockername, callback) {
    jslogger.info("db.getUserDockerByName");
    db.collection(DOCKER_COLLECTION).findOne({'builder.name': username, 'name': dockername}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _updateDocker(docker, callback) {
    jslogger.info("db.updateDocker");
    db.collection(DOCKER_COLLECTION).update({'_id': mongodb.ObjectID(docker._id)},
        {
            $set: {
                'name': docker.name,
                'lab': docker.lab,
                'builder': docker.builder,
                'startBuildTime': docker.startBuildTime,
                'buildTime': docker.buildTime,
                'lastRunTime': docker.lastRunTime,
                'host': docker.host,
                'port': docker.port,
                'contId': docker.contId,
                'status': docker.status
            }
        }, function (err, result) {
            if (err) throw err;
            callback(result);
        });
}
function _removeUserDockers(userid, callback) {
    jslogger.info("db.removeUserDockers");
    db.collection(DOCKER_COLLECTION).remove({'builder._id': mongodb.ObjectID(userid)}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _insertLab(lab, callback) {
    jslogger.info("db.insertLab");
    db.collection(LAB_COLLECTION).insert(lab, {safe: true}, function (err, result) {
        if (err) throw err;
        if (result.length > 0) callback(result[0]);
    });
}
function _updateLab(lab, callback) {
    jslogger.info("db.updateLab");
    db.collection(LAB_COLLECTION).update({'_id': mongodb.ObjectID(lab._id)},
        {
            $set: {
                'name': lab.name,
                'desc': lab.desc,
                'dockerFile': lab.dockerFile,
                'project': lab.project,
                'creatingTime': lab.creatingTime,
                'status': lab.status
            }
        }, function (err, result) {
            if (err) throw err;
            callback(result);
        });
}
function _upsertLabByName(lab, callback) {
    jslogger.info("db.upsertLabByName");
    db.collection(LAB_COLLECTION).update({'name': lab.name},
        {
            $set: {
                'desc': lab.desc,
                'dockerFile': lab.dockerFile,
                'project': lab.project,
                'creatingTime': lab.creatingTime,
                'status': lab.status
            }
        },
        {upsert: true},
        function (err, result) {
            if (err) throw err;
            callback(result);
        });
}
function _findLab(labid, callback) {
    jslogger.info("db.findLab");
    db.collection(LAB_COLLECTION).findOne({'_id': mongodb.ObjectID(labid)}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _getReadyLabs(callback) {
    jslogger.info("db.getReadyLabs");
    db.collection(LAB_COLLECTION).find({status: 'ready'}).toArray(function (err, items) {
        if (err) throw err;
        callback(items);
    });
}
function _getLabs(callback) {
    jslogger.info("db.getLabs");
    db.collection(LAB_COLLECTION).find().toArray(function (err, items) {
        if (err) throw err;
        callback(items);
    });
}
function _getLabByName(name, callback) {
    jslogger.info("db.getLabByName");
    db.collection(LAB_COLLECTION).findOne({'name': name}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}
function _validateLab(lab, callback) {
    jslogger.info("db.validateLab");
    if (util.isEmpty(lab.name)) {
        callback('Lab name cannot be empty!');
        return;
    }
    db.collection(LAB_COLLECTION).findOne({'name': lab.name}, function (err, result) {
        if (err) throw err;
        if (!util.isEmpty(result)) {
            callback('Lab name has been used');
            return;
        }
        else {
            callback('');
        }
    });
}
function _getUserResults(userid, callback) {
    jslogger.info("db.getUserResults");
    db.collection(RESULT_COLLECTION).find({'docker.builder._id': mongodb.ObjectID(userid)}).toArray(function (err, items) {
        if (err) throw err;
        callback(items);
    });
}
function _findResult(resultid, callback) {
    jslogger.info("db.findResult");
    db.collection(RESULT_COLLECTION).findOne({'_id': mongodb.ObjectID(resultid)}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}

exports.connect = _connect;
exports.validateUser = _validateUser;
exports.insertUser = _insertUser;
exports.findUser = _findUser;
exports.getUserSocket = _getUserSocket;
exports.getUsersInRoom = _getUsersInRoom;
exports.updateUser = _updateUser;
exports.login = _login;
exports.getRooms = _getRooms;
exports.getCurrentRooms = _getCurrentRooms;
exports.findRoom = _findRoom;
exports.insertRoom = _insertRoom;
exports.updateRoom = _updateRoom;
exports.insertMessage = _insertMessage;
exports.insertDocker = _insertDocker;
exports.findDocker = _findDocker;
exports.getUserDockers = _getUserDockers;
exports.getUserDockerByName = _getUserDockerByName;
exports.updateDocker = _updateDocker;
exports.insertLab = _insertLab;
exports.updateLab = _updateLab;
exports.upsertLabByName = _upsertLabByName;
exports.findLab = _findLab;
exports.getLabByName = _getLabByName;
exports.getLabs = _getLabs;
exports.getReadyLabs = _getReadyLabs;
exports.validateLab = _validateLab;
exports.getUserResults = _getUserResults;
exports.findResult = _findResult;
exports.getUserByEdxId = _getUserByEdxId;
exports.getUserByEmail = _getUserByEmail;
exports.getUserByName = _getUserByName;
exports.removeUser = _removeUser;
exports.removeUserDockers = _removeUserDockers;