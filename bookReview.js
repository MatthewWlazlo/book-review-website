const http = require('http')
const express = require ('express');
const fs = require('fs');
const { get } = require('https');
const path = require("path");
const { name } = require('ejs');
require("dotenv").config({ path: "./credentialsDontPost/.env" });
const mongoose = require('mongoose');
const Book = require('./mongodb-mongoose/models/book.cjs');
const Review = require('./mongodb-mongoose/models/review.cjs');

const portNumber = Number(process.argv[2] || 4000);
console.log("argv:", process.argv);
console.log("Using port:", portNumber);
const app = express();
const uri = process.env.MONGO_CONNECTION_STRING;

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set("views", path.resolve(__dirname, "templates"));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/lookup", (req, res) => {
  res.render("lookup");
});

app.get("/review", (req, res) => {
  res.render("review");
});

app.get("about", (req, res) => {
  res.render("about");
});

app.post("/lookup", async (req, res) =>{
    const rawSearch = req.body.query;
    const search = rawSearch.toLowerCase().trim();
    const [book, user] = await Promise.all([
        Book.findOne({ "book.title": new RegExp(`^${search}$`, "i") }),
        Review.findOne({ "review.user": new RegExp(`^${search}$`, "i") })
    ]);

    let variables = {
        keyword: "",
        book_info: "",
        reviews: ""
    };

    if (book) {

        variables.keyword = rawSearch;
        book.reviews.forEach( r => {
            variables.reviews += `
            Name: ${r.name}<br>
            Email: ${r.email}<br>
            Rating: ${r.rating}<br>
            Review: ${r.review}<br><br>
          `;
        });

        res.render("submit_lookup", variables);
    } else if (user) {
      variables.keyword = rawSearch;
      user.forEach( r =>{
        if (r.user === search){
          variables.reviews += `
            Name: ${r.name}<br>
            Email: ${r.email}<br>
            Rating: ${r.rating}<br>
            Review: ${r.review}<br><br>
          `;
        }
      })

        res.render("submit_lookup", variables);
    } else {
      variables.keyword = rawSearch;
      variables.reviews = `<h2>No results found!</h2><br><br>`;

      res.render("submit_lookup", variables);
    }
  });

app.post("/review", (req, res) =>{
  const { name, email, title, author, rating, review } = req.body;
  const book = searchBook(title);
  const book_data = {
    title: title,
    published: published,
    author: author,
    summary: summary,
    reviews: []
  };
})

const server = app.listen(portNumber, () => {
    console.log(`Web server started and running at http://localhost:${portNumber}`);
    process.stdout.write('Stop to shutdown the server: ');
});

process.stdin.on('data', (input) => {
  const cmd = input.toString('utf8').trim();

  if(cmd === 'stop'){
      server.close(() => {
        console.log('Shutting down the server')
        process.exit(0);
      });

      setTimeout(() => process.exit(0), 2000);
      return;
  } else {
      console.log(`Invalid command: ${cmd}`);
      process.stdout.write('Stop to shutdown the server: ');
    }
  }) 

mongoose.connect(uri)
  .then(() => console.log("\nConnected to MongoDB"))
  .catch(err => console.log(err));

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

async function addReviewById(bookId, newReview) {
  const bookDoc = await Book.findById(bookId);
  if (!bookDoc) {
    throw new Error("Book not found");
  }

  bookDoc.book.reviews.push({
    name: newReview.name,
    email: newReview.email,
    rating: newReview.rating,
    review: newReview.review
  });

  await bookDoc.save();
  return bookDoc;
}

