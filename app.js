const express = require('express');
var cors = require('cors');
const app = express();
const port = 3000;
let morgan = require('morgan');
let bodyParser = require('body-parser');
let mysql = require('mysql');
const { stringify, parse } = require('wkt');
const { response } = require('express');

const connection = mysql.createConnection({
    host: '',
    user: 'admin',
    password: "",
    database: "droneManager"
    });

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/addFlightInstance', (req, res) => {
    wktPointsArr = []
    req.body.destinations.forEach((coordinate) => {
        wktPointsArr.push(stringify({
            type: "Point",
            coordinates: [coordinate.lng, coordinate.lat]
        }));
    }); 
    wktPointStr = wktPointsArr.toString().replaceAll(",", "\",\"");
    wktPointStr = "\"" + wktPointStr + "\"";
    //console.log(wktPointStr);
    wktHub = stringify({
        type: "Point",
        coordinates: [req.body.hub.lng, req.body.hub.lat]
    })
    connection.query(`ECHO droneManager.createFlightInstance([${wktPointStr}] :> ARRAY(GEOGRAPHYPOINT), ?, ?)`, [wktHub, req.body.droneCount], (error, results, fields) => {
        console.log(error);
        console.log(results);
        console.log(fields);
        let response = {
          id: results[0].flightInstanceId,
          paths: []
        };
        results.forEach((result) => {
          response.paths.push({
            path: parse(result.path),
            id: result.id
          });
        })
        res.send(response);
    });
  });

app.post('/killDrone', (req, res) => {
  let wktKilledDronePoints = [];
  console.log(req.body);
  req.body.killedDronePoints.forEach((point) => {
    wktKilledDronePoints.push(stringify({
      type: "Point",
      coordinates: [point.lng, point.lat]
    }));
  });
  wktPointStr = wktKilledDronePoints.toString().replaceAll(",", "\",\"");
  wktPointStr = "\"" + wktPointStr + "\"";
  connection.query(`ECHO droneManager.killDrone(?, [${wktPointStr}] :> ARRAY(GEOGRAPHYPOINT))`, [req.body.killedDroneId, wktKilledDronePoints], (error, results, fields) => {
    console.log(error);
    console.log(results);
    console.log(fields);
    let response = {
      id: results[0].flightInstanceId,
      paths: []
    };
    results.forEach((result) => {
      response.paths.push({
        path: parse(result.path),
        id: result.id
      });
    })
    res.send(response);
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
   
    console.log('connected as id ' + connection.threadId);
});