const FCM = require('fcm-node');
const dotenv = require('dotenv').config();
const env = dotenv.parsed;
const fcm = new FCM(env.GCM_KEY);

exports.PushNotification = (deviceType, token, data, callback) => {
  console.log('=========== PUSH NOTIFICATION START ============');
  console.dir(deviceType, token, data);

  const message = {
    to: token,
    content_available: true,
    priority: 'high',
  };

  if (deviceType === 'android') {
    message.data = data;
  }
  if (deviceType === 'ios') {

      message.notification = {
        'title': data.title,
        'body': data.body,
        'text': data.text,
        'delivery_type': data.delivery_type,
      };
    
  }
  console.dir('final response');
  console.dir(message);
  fcm.send(message, function (err, response) {
    if (err) {
      console.log('Something has gone wrong!', err);
    } else {
      console.log('Successfully sent with response: ', response);
    }
  });
};
