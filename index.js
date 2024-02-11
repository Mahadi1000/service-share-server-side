const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// middleware
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      "https://service-sharing-6d792.firebaseapp.com",
      "https://service-sharing-6d792.web.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.Access_Token, {
        expiresIn: "24h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // service related api
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
      // console.log(result);
      res.send(result);
    });

    app.post("/allServices", async (req, res) => {
      const allService = req.body;
      const result = await allServiceCollection.insertOne(allService);
      res.send(result);
    });

    app.get("/allServices/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; // Convert id to ObjectId
      const result = await allServiceCollection.findOne(query);
      res.send(result);
    });

    app.delete("/allServices/:id", async (req, res) => {
      try {
        // console.log(req.params.id);
        const id = req.params.id;

        const filter = { _id: id }; // Assuming id is a string

        const result = await allBookingCollection.deleteOne(filter);

        if (result.deletedCount > 0) {
          console.log("Document deleted successfully.");
          res.status(200).json({ deletedCount: result.deletedCount });
        } else {
          console.log("No matching document found for deletion.");
          res
            .status(404)
            .json({ error: "No matching document found for deletion." });
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.put("/allServices/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateService = req.body;
      const service = {
        $set: {
          name: updateService.name,
          services: updateService.services,
          type: updateService.type,
          price: updateService.price,
          description: updateService.description,
          providerImage: updateService.providerImage,
          serviceArea: updateService.serviceArea,
          photo: updateService.photo,
        },
      };

      try {
        const result = await allServiceCollection.updateOne(
          filter,
          service,
          options
        );

        if (result.matchedCount > 0) {
          res.status(200).json({ modifiedCount: result.modifiedCount });
        } else {
          res
            .status(404)
            .json({ error: "No matching document found for update." });
        }
      } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.get("/bookings", async (req, res) => {
      console.log("cookies", req.cookies);

      const book = allBookingCollection.find();
      const result = await book.toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/bookings/:id", async (req, res) => {
      // console.log(req.params);
      console.log("cookies", req.cookies);

      const id = req.params.id;
      const query = { _id: id };
      const result = await allBookingCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await allBookingCollection.insertOne(booking);
      res.send(result);
    });
    app.delete("/bookings/:id", async (req, res) => {
      try {
        // console.log(req.params.id);
        const id = req.params.id;

        const filter = { _id: id }; // Assuming id is a string

        const result = await allBookingCollection.deleteOne(filter);

        if (result.deletedCount > 0) {
          console.log("Document deleted successfully.");
          res.status(200).json({ deletedCount: result.deletedCount });
        } else {
          console.log("No matching document found for deletion.");
          res
            .status(404)
            .json({ error: "No matching document found for deletion." });
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
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
