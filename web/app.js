'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var fs = require('fs');
var http = require('http');
var https = require('https');
var colors = require('colors');
var sio = require('socket.io');

var db = require('./lib/db.js');
var util = require('./lib/util.js');
var rtc = require('./lib/rtc.js');
var dockerMgr = require('./lib/docker-mgr.js');

var edx = require('./routes/edx-rt.js');
var api = require('./routes/api-rt.js');

var config = JSON.parse(fs.readFileSync('./public/config.json'));
var options = {
    key: fs.readFileSync('./tls/agent-test-key.pem'),
    cert: fs.readFileSync('./tls/agent-test-cert.pem')
};


var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', edx);
app.use('/api/', api);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            title: config.TITLE,
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        title: config.TITLE,
        message: err.message,
        error: {
            status: err.status,
            stack: ''
        }
    });
});

var server = config.USE_HTTPS ? https.createServer(options, app) : http.createServer(app);
db.connect(config.DB_URL, function () {
    server.listen(config.PORT);
    var io = sio.listen(server);
    rtc.listen(io, db, config);
    dockerMgr.listen(io, db, config);
    console.log('[info] '.green + 'start listening on port ' + config.PORT);
});