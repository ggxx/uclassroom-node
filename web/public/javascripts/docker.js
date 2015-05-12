'use strict';

var SOCKET_IO_NSP = SOCKET_IO_URL + '/docker';
var buildDocker = document.getElementById('buildDocker');
var dockerName = document.getElementById('dockerName');
var dockerLab = document.getElementById('dockerLab');

var socket = io.connect(SOCKET_IO_NSP);
socket.on('connect', function () {
    console.log('socket on connect');

    var args = new Object();
    args = GetUrlParms();
    socket.emit('bind', args['edxid']);
});
socket.on('error', function (text) {
    console.log('socket on error');
    showNotify(text);
});
socket.on('dockers', function (dockers) {
    console.log('socket on dockers');
    refreshDockerList(dockers);
});

buildDocker.onclick = function () {
    var message = {
        dockerName: dockerName.value,
        dockerLab: dockerLab.value
    };
    socket.emit('build_docker', message);
}

function startDocker(id) {
    socket.emit('start_docker', id);
}

function stopDocker(id) {
    socket.emit('stop_docker', id);
}

function refreshDockerList(dockers) {
    var dom = document.getElementById('dockers');
    var trs = '';
    dockers.forEach(function (docker) {
        trs += '<tr>';
        trs += '<td class="right">' + docker.name + '</td>';
        trs += '<td class="right">' + docker.lab.name + '</td>';
        trs += '<td class="right">' + docker.buildTime + '</td>';
        //.toLocaleDateString() + ', ' + docker.buildTime.toLocaleTimeString()
        if (docker.status == 'running') {
            trs += '<td class="right">';
            trs += '<a class="bg-green fg-white button small" href="javascript:stopDocker(\'' + docker._id + '\');">Stop</a> ';
            trs += '<a class="bg-green fg-white button small" href="http://' + docker.host + ':' + docker.port + '/" target="_blank">Web Terminal</a> ';
            if (docker.vnc != 0) {
                trs += '<a class="bg-green fg-white button small" href="http://' + docker.host + ':' + docker.vnc + '/vnc_auto.html" target="_blank">Web VNC</a> ';
            }
            trs += '</td>';
        }
        else if (docker.status == 'ready') {
            trs += '<td class="right">';
            trs += '<a class="bg-green fg-white button small" href="javascript:startDocker(\'' + docker._id + '\');">Start</a>';
            trs += '</td>';
        }
        else {
            trs += '<td class="right">' + docker.status + '</td>';
        }
        trs += '</tr>';
    });
    dom.innerHTML = trs;
}

function showNotify(text) {
    $.Notify({
        shadow: true,
        timeout: 6000,
        style: {background: 'red', color: 'white'},
        position: 'bottom-right',
        caption: 'Information',
        content: text
    });
}