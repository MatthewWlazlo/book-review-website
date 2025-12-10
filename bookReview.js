const http = require('http')
const express = require ('express');
const fs = require('fs');
const { get } = require('https');
const path = require("path");
const { name } = require('ejs');
require("dotenv").config();
const mongoose = require('mongoose');
const Book = require('./models/book');
const Review = require('./models/review');

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


app.post("/submit_review", async (req, res) =>{
    const rawSearch = req.body.query;
    const search = rawSearch.toLowercase().trim()
    const [book, user] = await Promise.all([
        Book.findOne({ "book.title": search}),
        User.findOne({ "review.user": search})
    ]);

    let variables = {
        keyword: "",
        reviews: ""
    };

    if (book) {

        variables.keyword = rawSearch;
        book.reviews.forEach( r => {
            variables.reviews += ``
        })

    } else if (user) {

    } else {

    }

});

//returning search results from user (returns reviews from given user or book title)
app.post("/submit_lookup", async (req, res) => {

  //check both username and book title fields

});


//looks up book information from API (information based on schema)
async function searchBook(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    
    //API query call based on URL
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodedQuery}&limit=10`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.docs || data.docs.length === 0) {
      return [];
    }
    
    //map results
    const books = await Promise.all(
      data.docs.slice(0, 10).map(async (book) => {
        let summary = 'No summary available';
        
        // fetch description from Works API if work key exists
        if (book.key) {
          try {
            const workResponse = await fetch(`https://openlibrary.org${book.key}.json`);
            if (workResponse.ok) {
              const workData = await workResponse.json();
              if (workData.description) {
                summary = typeof workData.description === 'string' 
                  ? workData.description 
                  : workData.description.value || 'No summary available';
              }
            }
          } catch (error) {
            console.log(`Could not fetch description for ${book.title}`);
          }
        }
        
        return {
          title: book.title || 'Unknown Title',
          published: book.first_publish_year ? book.first_publish_year.toString() : 'Unknown',
          author: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
          summary: summary
        };
      })
    );
    
    return books;
    
  } catch (error) {
    console.error('Error searching for book:', error);
    throw error;
  }
}