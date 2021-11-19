const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const cors = require('cors');
const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 5000;



const serviceAccount = require('./car-house-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function varifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();

}
//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pd5gx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('carHouse');
        const productsCollection = database.collection('products');
        const orderCollection = database.collection('order');
        const usersCollection = database.collection('usersInfo')
        const ratingsCollection = database.collection('ratings')

        //get all product
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.json(product);
        })

        //get 6 product value
        app.get('/homeProduct', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.limit(6).toArray();
            res.send(products);
        });

        //add Product
        app.post('/addProduct', async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.json(result)
        })

        ///delete Product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        });

        //add user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });
        //get one user by name.

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await (usersCollection.findOne(query));
            res.json(user);
        })

        //placeOrder
        app.post('/order', async (req, res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder);
            res.json(result);

        });
        //get All Order
        app.get('/orders', async (req, res) => {
            const cursor = orderCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        });

        //DELETE order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.json(result);
        });
        //UPDATE order
        app.put('/order/:id', async (req, res) => {

            const id = req.params.id;
            const updatedOrder = req.body;

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    orderStatus: updatedOrder.orderStatus
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc, options)

            console.log('Updating id = ', id)
            res.send(result);
        })

        //post ratings
        app.post('/ratings', async (req, res) => {
            const newRatings = req.body;
            const result = await ratingsCollection.insertOne(newRatings);
            res.json(result);
        });
        //get all ratings
        app.get('/rating', async (req, res) => {
            const cursor = ratingsCollection.find({});
            const ratings = await cursor.toArray();
            res.send(ratings);
        });

        //Checking Admin
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;

            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        //making admin
        app.put('/users/admin', varifyToken, async (req, res) => {
            const user = req.body;
            console.log("Given ", req.decodedEmail)

            const requester = req.decodedEmail;

            if (requester) {
                const requesterAccounter = await usersCollection.findOne({ email: requester });
                if (requesterAccounter.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: "Access Denied" });
            }

        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


// Server check
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Finding port
app.listen(port, () => {
    console.log("Listing from port = ", port);
})