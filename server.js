require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const app = express();
const port = 3000;

// Your existing endpoints...
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


app.get('/viewData', async (req, res) => { // <-- 'async' keyword is here
  const uri = process.env.MONGO_URI;
  console.log(uri);
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect(); // <-- 'await' keyword is inside async function

    const collection = client.db("pomodoroDB").collection("pomodoroData");

    const documents = await collection.find({}).toArray();

    let data = '';

    for (let document of documents) {
      data += `<p>${JSON.stringify(document)}</p>`;
    }

    res.status(200).send(`<h1>Data from MongoDB</h1>${data}`);
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
