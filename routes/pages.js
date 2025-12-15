const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.render("home.ejs"));
router.get("/home", (req, res) => res.render("home.ejs"));
router.get("/lookup", (req, res) => res.render("lookup.ejs"));
router.get("/review", (req, res) => res.render("review.ejs"));
router.get("/about", (req, res) => res.render("about.ejs"));

module.exports = router;