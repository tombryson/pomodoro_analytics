require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const app = express();
const port = 3000;

app.post('/receiveData', express.json(), async (req, res) => {
  const data = req.body;
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    const collection = client.db("pomodoroDB").collection("pomodoroData");

    await collection.insertOne(data);

    console.log('Data inserted into database.');
    res.status(200).json({ message: 'Data received and inserted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing request.');
  } finally {
    await client.close();
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
      session_start: new Date(item.session_start).toLocaleString(), // Converted to human-readable format
      session_end: item.session_end ? new Date(item.session_end).toLocaleString() : null, // Converted if not null
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

    const projects = organiseData(pomodoros);


    let data = '';
    console.log(pomodoros); // Log data to console
    console.log(projects); // Log project data

    for (let pomodoro of pomodoros) {
      data += `<p>${JSON.stringify(pomodoro)}</p>`; // Collect the data to a string
    }

    res.status(200).send(`<h1>Data from MongoDB</h1>${data}`); // Render the data
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
