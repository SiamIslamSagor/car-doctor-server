//////////////////////////////////////////////////////////////
//////////////// COMMON SETUP FOR ALL PROJECT ////////////////
//////////////////////////////////////////////////////////////

/* const express = require("express");
const cors = require("cors");
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
// to gate data in body
app.use(express.json());

app.get("/", (req, res) => {
  res.send("doctor is running");
});

app.listen(port, () => {
  console.log(`CAR DOCTOR SERVER IS RUNNING ON PORT ${port}`);
});
 */

//////////////////////////////////////////////////////////////
//////////////// COMMON SETUP FOR ALL PROJECT ////////////////
//////////////////////////////////////////////////////////////
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookeParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
// to read cookie data
app.use(cookeParser());
// to gate data in body
app.use(express.json());

// console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e9we0w0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// my middlewares
const logger = async (req, res, next) => {
  console.log("called::>", req.host, req.originalUrl);
  next();
};
// create middleware for verify token
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  // if token not found, then run this code block
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  // if token found , then verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    // if token invalid or expired or destroy, then run this code block
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    // if token have no problem and it's right , then=>
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("carDoctor").collection("services");

    const bookingCollection = client.db("carDoctor").collection("bookings");

    // auth related api
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log(user);

      // generate cookie token
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        // set cookie
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // to get all services data
    app.get("/services", logger, async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      // to filter data
      const options = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });

    // bookings
    /////////////// sum data read ////////////////
    app.get("/bookings", logger, verifyToken, async (req, res) => {
      console.log(
        "user mail is=>>",
        req.query.email,
        "Or user token email is=>>",
        req.user.email
      );
      // console.log("token is::> ", req.cookies.token);
      console.log("user in the valid token=>>", req.user, req.query);
      // match user token
      if (req.query.email !== req.user.email) {
        console.log("::in not valid block executed::");
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    /////////////// sum data read ////////////////
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updatedDoc = {
        $set: {
          status: updatedBooking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("doctor is running");
});

app.listen(port, () => {
  console.log(`CAR DOCTOR SERVER IS RUNNING ON PORT ${port}`);
});
