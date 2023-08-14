require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const app = express();
const port = 3000;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to the MongoDB client
client.connect().then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

app.use(cors()); // Enables all CORS requests

app.post('/receiveData', express.json(), async (req, res) => {
  const data = req.body;
  try {
    const collection = client.db("pomodoroDB").collection("pomodoroData");
    await collection.insertOne(data);
    console.log('Data inserted into database.');
    res.status(200).json({ message: 'Data received and inserted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing request.');
  }
});


function organiseData(pomodoros) {
  return pomodoros.reduce((acc, item) => {
    // Check if the project already exists in the accumulator
    if (!acc[item.project]) {
      acc[item.project] = [];
    }
    // Push the task into the appropriate project array
    acc[item.project].push({
      round: item.round,
      type: item.type,
      task: item.task,
      session_start: item.session_start, // Keeping original for calculations
      session_start_readable: new Date(item.session_start).toLocaleString(), // Human-readable version
      session_end: item.session_end,
      session_end_readable: item.session_end ? new Date(item.session_end).toLocaleString() : null, // Human-readable version
      seconds: item.seconds,
    });

    return acc;
  }, {});
}


app.get('/viewData', async (req, res) => {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    const collection = client.db("pomodoroDB").collection("pomodoroData");

    const pomodoros = await collection.find({}).toArray();

    const projects = organiseData(pomodoros); // Logic processing of pomodoro Data

    let data = '';

    res.status(200).json(projects); // Send the data back if requested
    // for (let pomodoro of pomodoros) {
    //   data += `<p>${JSON.stringify(pomodoro)}</p>`; // Collect the data to a string
    // }
    // res.status(200).send(`<h1>Data from MongoDB</h1>${data}`); // Render the data
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving data.');
  } finally {
    await client.close();
  }
});


app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to Pomodoro Analytics</h1>
    <p>This is the home page!</p>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Handling termination signals to close the DB connection
process.on('SIGINT', () => {
  client.close();
  process.exit();
});

process.on('SIGTERM', () => {
  client.close();
  process.exit();
});