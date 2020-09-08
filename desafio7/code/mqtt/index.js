const mqtt = require('mqtt');
const writeFile = require('fs').appendFileSync;

const fs = require('fs');

var client = mqtt.connect({
  host: 'tnt-iot.maratona.dev',
  port: 30573,
  username: 'maratoners',
  password: 'ndsjknvkdnvjsbvj'
});

client.on('message', (topic, message) => {
  console.log('receive message：', topic, message.toString())
})

client.on('connect', function () {
  client.subscribe('tnt', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })
})

function saveJson(item) {
  writeFile('./data.csv', item + "\n", (err) => {
    if (err) {
      console.log(err);
      throw new Error(err);
    }
  });
};

let cont = 0;
let header = 0;

client.on('message', function (topic, message) {

  // message is Buffer
  console.log("contador = " + cont);

  const obj1 = message.toString();
  // saveJson(obj1)

  var obj = JSON.parse(obj1);
  var keys = Object.keys(obj);
  let value = ""
  for (var i = 0; i < keys.length; i++) {
    value += value === "" ? obj[keys[i]] : "," + obj[keys[i]];
  }
  if (header == 0) {
    saveJson(keys);
    header = 1;
  }

  cont++
  if (cont >= 2500) {
    client.end()
  }
})
