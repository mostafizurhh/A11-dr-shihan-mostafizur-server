const express = require('express')
const cors = require('cors')
// const jwt = require('jsonwebtoken')
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config() /* to hide DB credential */

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`listening from port ${port}`)
})

/*--------------------
  mongoDB connection 
  -------------------*/
/* hide DB credential */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mniec4l.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

/* verify and decode JWT token from client */
// function verifyJWT(req, res, next) {
//     const authHeader = req.headers.authorization;
//     console.log(authHeader)
//     if (!authHeader) {
//         return res.status(401).send({ message: 'Unauthorized Access' })
//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'Forbidden User' })
//         }
//         req.decoded = decoded;
//         next();
//     });
// }

async function run() {
    try {
        /* create a DB in mongoDB for all services */
        const serviceCollection = client.db('dr-shihan').collection('services');

        /* to show DB's data to UI */
        /* API to get all services */
        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query).sort({ date: -1 })
            const services = await cursor.limit(3).toArray()
            res.send(services)
        });
        app.get('/allservices', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query).sort({ date: -1 })
            const services = await cursor.toArray()
            res.send(services)
        });

        /* API to get a specific service/data */
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        });

        /* (CREATE)create single service data from client side */
        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service).sort({ date: -1 });
            res.send(result);
        })

        /* create JWT token API */
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15d' })
            res.send({ token })
        })

        /* create a DB in mongoDB for all reviews */
        const reviewCollection = client.db('dr-shihan').collection('reviews');

        /* (CREATE)create single single data from client side info */
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review).sort({ date: -1 });
            res.send(result);
        })

        /* (READ)create API to get all reviews data from DB*/
        app.get('/reviews', async (req, res) => {
            /* verify user with jwt token */
            // const decoded = req.decoded;

            // if (decoded.email !== req.query.email) {
            //     return res.status(403).send({ message: 'Forbidden User' })
            // }
            let query = {}

            /* find specific user's review with email */
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query).sort({ date: -1 })
            const reviews = await cursor.toArray()
            res.send(reviews)
        });


        /* (CREATE) create API to get a specific review data from server and DB */
        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.findOne(query);
            res.send(result)
        });

        /* (UPDATE) create API to update a specific review data from server and DB */
        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const review = req.body;
            const updatedReview = {
                $set: {
                    message: review.message
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedReview);
            res.send(result);
        });

        /* (DELETE) create API to delete a specific review data from server and DB */
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(query)
            res.send(result)
        });
    }
    finally {

    }
}
run().catch(error => console.error(error))