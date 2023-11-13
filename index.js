const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kvsufwy.mongodb.net/your-database-name?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("service").collection("services");
    const allServiceCollection = client.db("service").collection("allService");
    const allBookingCollection = client.db("service").collection("booking");

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/allServices", async (req, res) => {
      const type = req.query.type;
      const filter = type ? { type } : {};
      const cursor = allServiceCollection.find(filter);
      const result = await cursor.toArray();
      console.log(result)
      res.send(result);
    });

    app.post("/allServices", async (req, res) => {
      const allService = req.body;
      const result = await allServiceCollection.insertOne(allService);
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      const book = allBookingCollection.find()
      const result = await book.toArray()
      res.send(result)
    })

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await allBookingCollection.insertOne(booking);
      res.send(result);
    });


    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Simple Crud is running...");
});

app.listen(port, () => {
  console.log(`Simple Crud is Running on port ${port}`);
});
