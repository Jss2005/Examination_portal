if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require('mongoose');
const Exam = require("./models/exam");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const wrapAsync = require('./utils/wrapAsync');
const { validateExam } = require("./middleware")
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const expressLayouts = require('express-ejs-layouts');
const cors = require("cors")




const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const examRouter = require("./routes/exams.js")
const UserRouter = require("./routes/users.js")



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use('/uploads', express.static('uploads'));
app.use(cors())
const dbURI = process.env.ATLASDB_URL;
console.log(dbURI)

const store = MongoStore.create({
    mongoUrl: dbURI,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600
})

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE ", err)
})


const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //after seven days (in ms) from today
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



const MONGO_URL = "mongodb://127.0.0.1:27017/examination";
main().then(() => console.log('Connection successful'))
    .catch(err => console.log(err));
async function main() {
    await mongoose.connect(dbURI);
}


app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user; //current logged in user

    console.log(res.locals.success)
    next();
})


app.use("/exams", examRouter);
app.use("/", UserRouter);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not found"));
})

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!!!" } = err;

    res.status(statusCode).render("exams/error.ejs", { message });
})

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})