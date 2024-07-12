const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 4200;


const url = 'mongodb://localhost:27017';
const dbName = 'mydb';

app.get('/users', async (req, res) => {

  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {

    await client.connect();

    console.log('Connected to MongoDB');

   
    const db = client.db(dbName);

  
    const collection = db.collection('users');

    
    const result = await collection.find({}).toArray();

   
    res.json(result);
  } catch (error) {
    console.error('Error fetching data:', error);
  
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
  
    await client.close();
    console.log('Connection closed');
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});








