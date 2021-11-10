const express = require('express')
const app = express()
const { MongoClient } = require('mongodb');

const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pd5gx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        console.log("connect");
        const database = client.db('Car_House');
        const productsCollection = database.collection('products');

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Automobiles Shop!!!')
})

app.listen(port, () => {
    console.log(`Listening at :${port}`)
})