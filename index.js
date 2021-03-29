const express = require('express')
const port = 5000
const cors = require('cors')
const bodyPaser = require('body-parser')

const app = express()
app.use(cors())
app.use(bodyPaser.json())
require('dotenv').config()


// jwt token 
var admin = require("firebase-admin");

var serviceAccount = require("./burj-khalifa-hotel-firebase-adminsdk-fxlym-0c4a832390.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});




const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4tdw4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority"`




app.get('/', (req, res) => {
    res.send('Hello World!')
})



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    console.log("mongo err", err);
    const bookingCollection = client.db("brujkhalifa").collection("booked");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        console.log(newBooking);
        bookingCollection.insertOne(newBooking)
            .then(result => {
                console.log(result);
                res.send(result.insertedCount > 0);
            })
    })



    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        bookingCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send('un-authorized access')
                    }
                }).catch((error) => {
                    res.status(401).send('un-authorized access')
                });
        }
        else {
            res.status(401).send('un-authorized access')
        }
    })



});




app.listen(process.env.PORT || port)
