require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const app = express();
const port = 3000;

// Your existing endpoints...
app.post('/receiveData', express.json(), (req, res) => {
  const data = req.body;  // Data sent by the client

  // Connect to the MongoDB client
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(err => {
    if (err) {
      console.error(err);
      res.status(500).send('Error connecting to database.');
      return;
    }

    const collection = client.db("pomodoroDB").collection("pomodoroData");

    // Insert the data into the collection
    collection.insertOne(data, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error inserting data into database.');
        return;
      }

      console.log('Data inserted into database.');
      res.status(200).json({ message: 'Data received and inserted successfully.' });
    });

    // Close the connection to the client
    client.close();
  });
});

app.get('/sendToWebhook', (req, res) => {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(err => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    const collection = client.db("pomodoroDB").collection("pomodoroData");

    collection.find({}).toArray((err, documents) => {
      if (err) {
        res.status(500).send(err);
        return;
      }

      for (let document of documents) {
        axios.post(process.env.WEBHOOK_URL, document)
          .then(response => console.log(response.status))
          .catch(error => console.log(error));
      }

      client.close();
    });
  });

  res.status(200).send("Webhook requests sent.");
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
