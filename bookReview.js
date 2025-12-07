const http = require('http')
const express = require ('express');
const fs = require('fs');
const { get } = require('https');
const path = require("path");
const { name } = require('ejs');
require("dotenv").config();
const mongoose = require('mongoose');
const Book = require('./models/book');

const portNumber = process.argv[2];
const app = express();
const uri = process.env.MONGO_CONNECTION_STRING;

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set("views", path.resolve(__dirname, "templates"));

mongoose.connect('mongodb://localhost:27017/CMSC335DB')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));


app.post("/submit_review", (req, res) =>{
    const { name, email, movie, author, published, summary, review } = req.body;
    compTime = new Date().toString();
    time = `Task completed at ${compTime}`;

    const book_review = {

    }
});
