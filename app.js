const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { stringify, parse } = require('wkt');

const app = express();
const port = process.env.PORT || 3000;

const connection = mysql.createConnection({
  host: '',
  user: 'admin',
  password: '',
  database: 'droneManager',
});

// Middleware
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/addFlightInstance', (req, res) => {
  const wktPointsArr = req.body.destinations.map((coordinate) => stringify({
    type: 'Point',
    coordinates: [coordinate.lng, coordinate.lat],
  }));

  const wktPointStr = `"${wktPointsArr.join('","')}"`;

  const wktHub = stringify({
    type: 'Point',
    coordinates: [req.body.hub.lng, req.body.hub.lat],
  });

  connection.query(
    'CALL droneManager.createFlightInstance(?, ?, ?)',
    [wktHub, req.body.droneCount, wktPointStr],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const response = {
        id: results[0][0].flightInstanceId,
        paths: results[1].map((result) => ({
          path: parse(result.path),
          id: result.id,
        })),
      };

      res.json(response);
    }
  );
});

app.post('/killDrone', (req, res) => {
  const wktKilledDronePoints = req.body.killedDronePoints.map((point) =>
    stringify({
      type: 'Point',
      coordinates: [point.lng, point.lat],
    })
  );

  const wktPointStr = `"${wktKilledDronePoints.join('","')}"`;

  connection.query(
    'CALL droneManager.killDrone(?, ?)',
    [req.body.killedDroneId, wktPointStr],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const response = {
        id: results[0][0].flightInstanceId,
        paths: results[1].map((result) => ({
          path: parse(result.path),
          id: result.id,
        })),
      };

      res.json(response);
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
    return;
  }

  console.log('Database connection successful');
});
