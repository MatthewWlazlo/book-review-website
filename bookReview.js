const http = require("http");
const express = require("express");
const pagesRouter = require("./routes/pages");
const fs = require("fs");
const { get } = require("https");
const path = require("path");
const { name } = require("ejs");
require("dotenv").config({ path: "./credentialsDontPost/.env" });
const mongoose = require("mongoose");
const Book = require("./mongodb-mongoose/models/book.cjs");
const Review = require("./mongodb-mongoose/models/review.cjs");

const portNumber = Number(process.argv[2] || 4000);
console.log("argv:", process.argv);
console.log("Using port:", portNumber);
const app = express();
const uri = process.env.MONGO_CONNECTION_STRING;

//conecting to database
const databaseName = "CMSC335DB";

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

//rendering pages with router
app.use("/", pagesRouter);

const server = app.listen(portNumber, () => {
  console.log(
    `Web server started and running at http://localhost:${portNumber}`
  );
  process.stdout.write("Stop to shutdown the server: ");
});

process.stdin.on("data", (input) => {
  const cmd = input.toString("utf8").trim();

  if (cmd === "stop") {
    server.close(() => {
      console.log("Shutting down the server");
      process.exit(0);
    });

    setTimeout(() => process.exit(0), 2000);
    return;
  } else {
    console.log(`Invalid command: ${cmd}`);
    process.stdout.write("Stop to shutdown the server: ");
  }
});
console.log("\n" + uri + "\n");
mongoose
  .connect(uri)
  .then(() => {
    console.log("\nConnected to MongoDB")
    console.log("DB:", mongoose.connection.name);
  })
  .catch((err) => console.log(err));

//lookup reviews for a book based on username or book title

app.post("/lookup", async (req, res) => {
  const search = req.body.query;
  const pattern = new RegExp(`^${search}$`, "i");
  const [book, username] = await Promise.all([
    Book.findOne({ "title": { $regex: pattern }}),
    Review.find({ "name": { $regex: pattern }}),
  ]);
  console.log("\nBook: " + book + "\nUser: " + username);
  console.log("\nUsername" + username.name);

  let variables = {
    keyword: "",
    book_info: "",
    reviews: "",
  };

  console.log("\nSearch: " + search + "\n");

  if (book) {
    variables.keyword = search;
    const reviews = Array.isArray(book.reviews) ? book.reviews : [];
    reviews.forEach((r) => {
      console.log("\nReached!");
      variables.reviews += `
            <strong>Name: </strong>${r.name}<br>
            <strong>Email: </strong>${r.email}<br>
            <strong>Rating: </strong>${r.rating}<br>
            <strong>Review: </strong>${r.review}<br><br>
          `;
    });

    const results = await searchBook(search);
    const bookQuery = results[0];
    const title = bookQuery.title;
    const published = bookQuery.published;
    const author = bookQuery.author;
    const summary = bookQuery.summary;

    variables.book_info = `<h3><strong>Title: </strong>${title}</h3>
                            <h3><strong>Author(s): </strong>${author}</h3>
                            <strong>Published: </strong>${published}<br>
                            <strong>Summary: </strong>${summary}<br>`;


    console.log(variables);
    res.render("submit_lookup", variables);
  } else if (username && username.length > 0) {
    console.log("\nReached username!");
    variables.keyword = search;
    username.forEach((r) => {
      variables.reviews += `
          <strong>Name: </strong>${r.name}<br>
          <strong>Email: </strong>${r.email}<br>
          <strong>Title: </strong>${r.title}<br>
          <strong>Author: </strong>${r.author}<br>
          <strong>Rating: </strong>${r.rating}<br>
          <strong>Review: </strong>${r.review}<br><br>
        `;
    });

    res.render("submit_lookup", variables);
  } else {
    console.log("\nReached no results!");
    variables.keyword = search;
    variables.reviews = `<h2>No results found!</h2><br><br>`;
    console.log(variables.reviews);

    res.render("submit_lookup", variables);
  }
});

//submits review to database

app.post("/submit_review", async (req, res) => { // Need to update this so reviews for books that are already in the database get added to that entries review list

  const { name, email, title, author, rating, review } = req.body;
  //gather data from API
  // need publishing date and summary
  console.log("Searching for book...\n");
  console.log(`Name:  ${name}\n`);
  try {
    const results = await searchBook(title);
    const picked = results?.[0] || {}
    const pattern = new RegExp(`^${title}$`, "i");
    const bookExists = await Book.findOne({ "title": { $regex: pattern }});

    if (bookExists){
      await Book.updateOne(
        { _id: bookExists._id },
        {
          $push: {
            reviews: {
              name,
              email,
              rating,
              review
            }
          }
        }
      );
    } else {
        const book_data = new Book({
        title: title,
        published: picked.published,
        author: author,
        summary: picked.summary,
        reviews: [
          {
            name: name,
            email: email,
            rating: rating,
            review: review,
          },
        ],
      });
      await book_data.save();
      console.log("\nSaved book!");
    }
    
    
    console.log("Created book schema");
    const review_data = new Review({
      name: name,
      email: email,
      title: title,
      author: author,
      rating: rating,
      review: review,
    });
    console.log("\nCreated review schema");
    await review_data.save();
    console.log("\nSaved review!");
  } catch (e) {
    console.error("Submit review failed:", e);
    res.status(500).send("Error saving review");
  } finally {
    res.render("submit_review", { book: title});
  }
});

//looks up book information from API (information based on schema)
async function searchBook(query) {
  try {
    const encodedQuery = encodeURIComponent(query);

    //API query call based on URL
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodedQuery}&limit=10`
    );

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
        let summary = "No summary available";

        // fetch description from Works API if work key exists
        if (book.key) {
          try {
            const workResponse = await fetch(
              `https://openlibrary.org${book.key}.json`
            );
            if (workResponse.ok) {
              const workData = await workResponse.json();
              if (workData.description) {
                summary =
                  typeof workData.description === "string"
                    ? workData.description
                    : workData.description.value || "No summary available";
              }
            }
          } catch (error) {
            console.log(`Could not fetch description for ${book.title}`);
          }
        }

        return {
          title: book.title || "Title",
          published: book.first_publish_year
            ? book.first_publish_year.toString()
            : "Unknown",
          author: book.author_name
            ? book.author_name.join(", ")
            : "Unknown Author",
          summary: summary,
        };
      })
    );

    return books;
  } catch (error) {
    console.error("Error searching for book:", error);
    throw error;
  }
}
