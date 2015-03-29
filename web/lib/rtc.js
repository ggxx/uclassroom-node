'use strict';

var colors = require('colors');
var cookieParser = require('cookie-parser');
var util = require('./util.js');
var model = require('./model.js');

function _listen(io, db, config) {
    var nsp = io.of('/classroom');
    nsp.on('connection', function (socket) {
        console.log('socket on [connection]'.blue);

        var user;
        socket.on('bind', function (edxid) {
            // Bind user id and socket id
            db.getUserByEdxId(edxid, function (result_user) {
                if (util.isEmpty(result_user)) {
                    socket.emit('error', 'cannot find edx id');
                    return;
                }
                user = result_user;
                user.classroom = {};
                user.cameraSharing = false;
                user.microphoneSharing = false;
                user.screenSharing = false;
                user.socket = socket.id;
                db.updateUser(user, function (result) {
                    socket.emit('bind', user);
                });
            });
        });

        // List rooms.
        socket.on('rooms', function () {
            console.log('socket on [rooms]'.blue);
            db.getCurrentRooms(function (rooms) {
                socket.emit('rooms', rooms);
            });
        });

        // Create room.
        // message.name      => room name
        // message.password  => room password, for future use
        // message.creator   => room creator
        socket.on('create_room', function (message) {
            console.log('socket on [create_room]'.blue);

            if (util.isEmpty(message.name)) {
                var rMessage = {
                    result: false,
                    text: 'Classroom can not be empty.',
                    room: {}
                };
                socket.emit('create_room', rMessage);
                return;
            }

            if (!util.isEmpty(user.classroom)) {
                var rMessage = {
                    result: false,
                    text: 'Please exit from other one before creating classroom.',
                    room: {}
                };
                socket.emit('create_room', rMessage);
                return;
            }

            var room = new model.Classroom();
            room.name = message.name;
            room.password = message.password;
            room.creator = message.creator;
            room.creatingTime = new Date();
            db.insertRoom(room, function (result_room) {
                var rMessage = {
                    result: true,
                    text: '',
                    room: result_room
                };
                socket.emit('create_room', rMessage);

                // Tell all to refresh rooms list
                db.getCurrentRooms(function (result_rooms) {
                    //console.log(result_rooms);
                    //console.log('before emit rooms'.red);
                    nsp.emit('rooms', result_rooms);
                });
            });
        });

        // Join room.
        // message.roomid  => room id
        socket.on('join_room', function (message) {
            console.log('socket on [join_room]'.blue);

            if (!util.isEmpty(user.classroom)) {
                if (message.roomid !== user.classroom._id) {
                    var rMessage = {
                        result: false,
                        text: 'Please exit from other one before creating classroom.',
                        room: {}
                    };
                    socket.emit('join_room', rMessage);
                }
                else {
                    var rMessage = {
                        result: false,
                        text: 'You have joined this room.',
                        room: {}
                    };
                    socket.emit('join_room', rMessage);
                }
                return;
            }

            db.getUsersInRoom(message.roomid, function (result_users) {
                if (result_users.length >= config.MAX_USER_NUM_OF_ROOM) {
                    var rMessage = {
                        result: false,
                        text: 'The user number of the room has reached the maximum.',
                        room: {}
                    };
                    socket.emit('join_room', rMessage);
                }
                else {
                    db.findRoom(message.roomid, function (result_room) {
                        user.classroom = result_room;
                        db.updateUser(user, function (result_num) {
                            var rMessage = {
                                result: true,
                                text: '',
                                room: result_room
                            };
                            socket.emit('join_room', rMessage);
                            socket.join(message.roomid);
                            // Tell all in the room to refresh users list.
                            result_users.push(user);
                            nsp.in(message.roomid).emit('users', result_users);
                        });
                    });
                }
            });
        });

        // Leave room.
        socket.on('leave_room', function () {
            console.log('socket on [leave_room]'.blue);

            if (util.isEmpty(user.classroom)) {
                var rMessage = {
                    result: false,
                    text: 'You have not joined any classroom.',
                    closed: false
                };
                socket.emit('leave_room', rMessage);
            }
            else {
                socket.leave(user.classroom._id);

                var room = user.classroom;
                user.classroom = {};
                db.updateUser(user, function (result_user_num) {
                    db.getUsersInRoom(room._id, function (result_users) {
                        if (result_users.length == 0) {
                            room.endingTime = new Date();
                            db.updateRoom(room, function (result_room_num) {
                                // Tell all to refresh rooms list
                                db.getCurrentRooms(function (result_rooms) {
                                    nsp.emit('rooms', result_rooms);
                                    var rMessage = {
                                        result: true,
                                        text: '',
                                        closed: true
                                    };
                                    socket.emit('leave_room', rMessage);
                                });
                            });
                        }
                        else {
                            // Tell other users in room to refresh users list
                            nsp.in(room._id).emit('users', result_users);

                            var rMessage = {
                                result: true,
                                text: '',
                                closed: false
                            };
                            socket.emit('leave_room', rMessage);
                        }
                    });
                });
            }
        });

        // Disconnect server.
        socket.on('disconnect', function () {
            console.log('socket on [disconnect]'.blue);

            if (util.isEmpty(user)) {
                return;
            }

            if (!util.isEmpty(user.classroom)) {
                socket.leave(user.classroom._id);

                var room = user.classroom;
                user.classroom = {};
                user.cameraSharing = false;
                user.microphoneSharing = false;
                user.screenSharing = false;
                user.socket = '';
                db.updateUser(user, function (result_user_num) {
                    db.getUsersInRoom(room._id, function (result_users) {
                        if (result_users.length == 0) {
                            room.endingTime = new Date();
                            db.updateRoom(room, function (result_room_num) {
                                // Tell all to refresh rooms list
                                db.getCurrentRooms(function (result_rooms) {
                                    nsp.emit('rooms', result_rooms);
                                });
                            });
                        }
                        else {
                            // Tell other users in room to refresh users list
                            nsp.in(room._id).emit('users', result_users);
                        }
                    });
                });
            }
        });

        // List users in room.
        // message.roomid => room id
        socket.on('users', function (message) {
            console.log('socket on [users]');
            db.getUsersInRoom(message.roomid, function (result_users) {
                socket.emit('users', result_users);
            });
        });

        // Receive text message.
        // message.text => text
        socket.on('text_message', function (message) {
            console.log('socket on [text_message]');

            if (util.isEmpty(user.classroom)) {
                var rMessage = {
                    result: false,
                    time: util.getTime(),
                    from: '',
                    text: 'no room'
                };
                socket.emit('text_message', rMessage);
                return;
            }

            var msg = new model.Message();
            msg.text = message.text;
            msg.room = user.classroom;
            msg.sender = user;
            msg.time = util.getTime();
            db.insertMessage(msg, function (result) {
                var rMessage = {
                    result: true,
                    time: msg.time,
                    from: user.name,
                    text: msg.text
                };
                // Send to all in the room
                nsp.in(user.classroom._id).emit('text_message', rMessage);
            });
        });

        // Call for another's video/audio.
        // message.offer      => offer's id
        // message.answer     => answer's id
        // message.streamtype => 1.cam & mic; 2.screen; 3.screen & cam & mic
        socket.on('call', function (message) {
            console.log('socket on [call]'.blue);
            // Find offer's socket id to call for
            db.getUserSocket(message.offer, function (result_sid) {
                nsp.connected[result_sid].emit('call', message);
            });
        });

        // Transfer candidate.
        // message.from  => from whom
        // message.to    => to whom
        // message.candidate
        // message.streamtype
        // tag => true:offer's candidate; false:answer's candidate
        socket.on('candidate', function (message) {
            console.log('socket on [candidate]'.blue);
            db.getUserSocket(message.to, function (result_sid) {
                nsp.connected[result_sid].emit('candidate', message);
            });
        });

        // P2P answer.
        // message.sdp    => answer's sdp
        // message.offer  => offer's id
        // message.answer => answer's id
        // message.streamtype
        socket.on('answer', function (message) {
            console.log('socket on [answer]'.blue);
            db.getUserSocket(message.offer, function (result_sid) {
                nsp.connected[result_sid].emit('answer', message);
            });
        });

        // P2P offer.
        // message.sdp    => sdp
        // message.offer  => offer's id
        // message.answer => answer's id
        // message.streamtype
        socket.on('offer', function (message) {
            console.log('socket on [offer]'.blue);
            db.getUserSocket(message.answer, function (result_sid) {
                nsp.connected[result_sid].emit('offer', message);
            });
        });

        // Change user device sharing status.
        // message.userid =>
        // message.cameraSharing => true, false
        // message.microphoneSharing => true, false
        socket.on('share_cam', function (message) {
            user.cameraSharing = message.cameraSharing;
            user.microphoneSharing = message.microphoneSharing;
            db.updateUser(user, function (result_num) {
                var rMessage = {
                    cameraSharing: message.cameraSharing,
                    microphoneSharing: message.microphoneSharing,
                    userid: message.userid,
                    username: user.name
                };
                nsp.in(user.classroom._id).emit('share_cam', rMessage); // in room
            });
        });

        // Change user device sharing status.
        // message.userid =>
        // message.screenSharing => true, false
        socket.on('share_screen', function (message) {
            user.screenSharing = message.screenSharing;
            db.updateUser(user, function (result_num) {
                var rMessage = {
                    screenSharing: message.screenSharing,
                    userid: message.userid,
                    username: user.name
                };
                nsp.in(user.classroom._id).emit('share_screen', rMessage); // in room
            });
        });
    });
}

exports.listen = _listen;
