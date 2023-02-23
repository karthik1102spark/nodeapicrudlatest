var app = require('express')();
var server = require('http').Server(app);
var debug = require('debug')('SmartCar:sockets');
var request = require('request');
var port = process.env.PORT || '3000';
var mysql = require('mysql');
const { PushNotification } = require('./fcm');
const dotenv = require('dotenv').config();
const env = dotenv.parsed;

// Sender will user_id and receiver will provider_id
server.listen(port);
if(env.APP_ENV == 'local') {
    const http = require('http');
    server = http.createServer(app);
}else {
    const fs = require('fs');
    const https = require('https');
    const options = {
        key: fs.readFileSync('/var/www/html/live_ssl/privkey.pem'),
        cert: fs.readFileSync('/var/www/html/live_ssl/cert.pem'),
        ca: fs.readFileSync('/var/www/html/live_ssl/fullchain.pem'),
        secure: true,
        reconnect: true,
        rejectUnauthorized: false
    };
    server = https.createServer(options, app);
}
app.get('/app', function (req, res) {
    console.log('hello app 3000');
    res.end("Welcome to Node.js HTTP Server.");
})
app.get('/', (req, res) => res.send('Hello World.'));

var io = require('socket.io')(server, {
    cors: { origin: "*" }
});

/** storing db configuration */
var connection = mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE
});
connection.connect();

app.get('/sendRequestToDriver', (req, res) => {

    let requestedData = {};
    requestedData.data = req.query.data
    requestedData.success = (req.query.success == 1) ? 'true' : 'false'
    io.emit('receiveRequestFromUser_' + req.query.current_provider, requestedData);
    return res.json({ success: true })
});

app.get('/serviceAccept', (req, res) => {

    let serviceAcceptDetails = {};
    serviceAcceptDetails.data = req.query.data
    serviceAcceptDetails.message = req.query.message
    serviceAcceptDetails.success = (req.query.success == 1) ? 'true' : 'false'
    io.emit('serviceAcceptProvider', serviceAcceptDetails);
    return res.json({ success: true })
});

app.get('/assignNextProvider', (req, res) => {

    let assignNextProviderDetails = {};
    assignNextProviderDetails.success = (req.query.success == 1) ? 'true' : 'false'
    assignNextProviderDetails.data = req.query.data
    io.emit('receiveRequestFromUser_' + req.query.current_provider, assignNextProviderDetails);
    console.log('assignNextProvider:');
    console.log(assignNextProviderDetails);
    return res.json({ success: true })
});

//tracking provider status in user app
app.get('/providerStatus', (req, res) => {

    let providerStatusUpdate = {};
    providerStatusUpdate.status = req.query.status
    providerStatusUpdate.message = req.query.message
    providerStatusUpdate.success = (req.query.success == 1) ? 'true' : 'false'
    providerStatusUpdate.data = req.query.data
    io.emit('providerStatusUpdate', providerStatusUpdate);
    return res.json({ success: true })
});

app.get('/providerDetails', (req, res) => {

    let providerDetailsUpdate = {};
    providerDetailsUpdate.success = (req.query.success == 1) ? 'true' : 'false'
    providerDetailsUpdate.data = req.query.data
    io.emit('getProviderList', providerDetailsUpdate);
    console.log('getProviderList: ');
    console.log(providerDetailsUpdate);
    return res.json({ success: true })
});

app.get('/cancelRequestByUser', (req, res) => {

    let userCancelRequest = {};
    userCancelRequest.success = (req.query.success == 1) ? 'true' : 'false'
    userCancelRequest.data = req.query.data
    io.emit('cancelRequestByUser', userCancelRequest);
    return res.json({ success: true })
});

io.on('connection', function (socket) {

    debug('new connection established');
    debug('socket.handshake.query.sender', socket.handshake.query.sender);
    socket.join(socket.handshake.query.sender);
    socket.emit('connected', 'Connection to server established!');

    socket.on('update sender', function (data) {
        console.log('update sender', data);
        socket.join(data.sender);
        socket.handshake.query.sender = data.sender;
        socket.emit('sender updated', 'Sender Updated ID:' + data.sender);
    });

    socket.on('send location', function (data) {
        data.time = new Date();
        socket.broadcast.to(data.receiver).emit('message', data);

        var query = `SELECT requests.*,
        users.id as user_id,users.first_name as user_first_name,'senderid as {data.sender}',users.last_name as user_last_name,users.picture as user_picture,
        service_types.name as service_type_name,service_types.picture as type_picture 
        FROM requests JOIN service_types 
        ON requests.request_type = service_types.id
        JOIN users 
        ON users.id = requests.user_id
        where requests.id=`+ data.request_id;

        connection.query(query, (err, result) => {
            let allData = {}
            allData.bearing = data.bearing
            allData.status = data.status
            allData.request_start_time = result[0].request_start_time
            allData.end_time = result[0].end_time
            allData.airport_price_id = result[0].airport_price_id
            allData.amount = result[0].amount
            allData.request_id = result[0].id
            allData.request_type = result[0].request_type
            allData.provider_status = result[0].provider_status
            allData.s_latitude = result[0].s_latitude

            allData.s_longitude = result[0].s_longitude
            allData.s_address = result[0].s_address
            allData.d_address = result[0].d_address
            allData.d_latitude = result[0].d_latitude
            allData.d_longitude = result[0].d_longitude
            allData.request_status_type = result[0].request_status_type
            allData.request_status = result[0].status

            allData.user_id = result[0].user_id
            allData.user_first_name = result[0].user_first_name
            allData.user_last_name = result[0].user_last_name
            allData.user_picture = result[0].user_picture

            var providerQuery = "SELECT * from providers where id=" + data.sender

            connection.query(providerQuery, (err, providerResult) => {
                allData.car_image = providerResult[0].car_image
                allData.driver_longitude = data.longitude
                allData.driver_latitude = data.latitude
                allData.provider_first_name = providerResult[0].first_name
                allData.provider_mobile = providerResult[0].mobile
                allData.color = providerResult[0].color
                allData.provider_id = providerResult[0].id
                allData.provider_first_name = providerResult[0].first_name
                allData.provider_mobile = providerResult[0].mobile
                allData.provider_id = providerResult[0].id
                allData.provider_last_name = providerResult[0].last_name
                allData.model = providerResult[0].model
                allData.plate_no = providerResult[0].plate_no
                allData.provider_picture = providerResult[0].picture
                io.emit('providerStatusUpdate', allData);

            });
        });

    });

    socket.on('disconnect', function (data) {
        debug('disconnect', data);
    });
});

io.on('connection', function (socket) {

    debug('new connection for message established');
    debug('socket.handshake.query.sender', socket.handshake.query.sender);

    socket.join(socket.handshake.query.sender);
    socket.emit('connected', 'Connection to server established!');

    socket.on('update sender message', function (data) {
        console.log('update sender message', data);
        socket.join(data.sender);
        socket.handshake.query.sender = data.sender;
        socket.emit('sender updated', 'Sender Updated ID:' + data.sender);
    });

    //get message from provider and send to user
    socket.on('provider_as_sender', function (data) {
        console.log('message received from provider')
        data.title = 'Message Received';
        data.sender = socket.handshake.query.sender;
        data.delivery_type = 1;
        data.is_admin = 0;
        let msg = data.message;
        if (data.device_type == 'ios') {
            data.body = msg;
            data.text = msg;
        } else if (data.device_type == 'android') {
            data.message = msg;
        }
        var query = `INSERT INTO chat_messages(request_id,user_id,provider_id,message,type,delivered) VALUES ('${data.request_id}', '${data.user_id}','${data.sender}','${msg}','pu',1)`
        connection.query(query, (err, result) => {
            if (err) {
                console.log('chat message not inserted', err.message)
                return false
            } else {
                console.log('chat message inserted to db', result.insertId)
            }
        });

        var userQuery = "SELECT device_token from users where id=" + data.user_id
        connection.query(userQuery, (err, userData) => {
            PushNotification(data.device_type,userData[0].device_token, data);
            data.time = new Date();
            socket.broadcast.to(data.receiver).emit('message_from_provider_' + data.user_id, data);
        });

    });
    //get message from user and send to provider
    socket.on('user_as_sender', function (data) {
        console.log('message received from user')
        data.title = 'Message Received';
        data.sender = socket.handshake.query.sender;
        data.delivery_type = 1;
        data.is_admin = 0;
        let msg = data.message;
        if (data.device_type == 'ios') {
            data.body = msg;
            data.text = msg;
        } else if (data.device_type == 'android') {
            data.message = msg;
        }
        
        var query = `INSERT INTO chat_messages(request_id,user_id,provider_id,message,type,delivered) VALUES ('${data.request_id}', '${data.sender}','${data.provider_id}','${msg}','up',1)`
        connection.query(query, (err, result) => {
            if (err) {
                console.log('chat message not inserted', err.message)
                return false
            } else {
                console.log('chat message inserted to db', result.insertId)
            }
        });

        var providerQuery = "SELECT device_token from providers where id=" + data.provider_id
        connection.query(providerQuery, (err, providerData) => {
            PushNotification(data.device_type,providerData[0].device_token, data);
            data.time = new Date();
            socket.broadcast.to(data.receiver).emit('message_from_user_' + data.provider_id, data);
        });
    });

    socket.on('disconnect', function (data) {
        debug('disconnect', data);
    });
});