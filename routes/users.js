require('dotenv').config();
const express = require('express');
const Exam = require("../models/exam.js");
const User = require("../models/user.js");
const SignUp = require("../models/signup.js")
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require('passport');
const { saveRedirectURL } = require('../middleware.js');
const { validateExam, isLoggedIn, authorizedRoles, schema } = require("../middleware.js");
const { upload_images } = require('../storage.js');
const fs = require('fs');
const path = require('path');
const CryptoJS = require("crypto-js");
const { s3Uploadv3Image, getObjectSignedUrl } = require('../s3service.js');

const router = express.Router();


function encrypt(data) {
    var ciphertext = CryptoJS.AES.encrypt(data, process.env.ENCRYPTION_KEY).toString();
    return ciphertext;
}

function decrypt(ciphertext) {
    var bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);

    //console.log(originalText); // 'my message'
    return originalText
}

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
})



router.post("/signup", upload_images.single("image"), wrapAsync(async(req, res) => {
    try {
        let { username, rollNumber, password } = req.body;
        console.log(req.body);

        if (req.file) {
            console.log(`Image uploaded: ${req.file.filename}`);
        } else {
            console.log("No image uploaded");
        }


        const allSignUps = await SignUp.find({});
        //console.log("ALL SignUp", allSignUps);

        const users = await User.find({ username });
        //console.log("Already Registered", users);

        if (users && users.length > 0) {
            throw Error("Student with same  username already exists")

        }


        const users_with_same_rollno = await User.find({ rollNumber });
        //console.log("Already Registered", users_with_same_rollno);

        if (users_with_same_rollno && users_with_same_rollno.length > 0) {
            throw Error("Student with same  roll number already exists")

        }

        const currSignUps_with_same_username = await SignUp.find({ username });
        if (currSignUps_with_same_username && currSignUps_with_same_username.length > 0) {
            throw Error("Choose another username")

        }
        const currSignUps_with_same_rollno = await SignUp.find({ rollNumber });
        if (currSignUps_with_same_rollno && currSignUps_with_same_rollno.length > 0) {
            throw Error("Student with same  roll number is under verification ")

        }

        const currSignUps = await SignUp.find({ username, rollNumber });
        if (currSignUps && currSignUps.length > 0) {
            throw Error("Wait till the examiner confirms your credentials")

        }

        const encryptedPassword = encrypt(password);

        const newSignUp = new SignUp({ username, rollNumber, password: encryptedPassword });

        console.log(req.file);


        const results = await s3Uploadv3Image(req.file);
        console.log(results);
        console.log();
        const uri = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${results}`;
        console.log()
            /* const uri = await getObjectSignedUrl(results);
             console.log(uri)*/

        newSignUp.image = uri;

        const s = await newSignUp.save();
        req.flash("success", "Your credientials will be verified");
        res.redirect("/signup");



    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }


}));

router.get("/validate_student_signups", authorizedRoles("clerk"), wrapAsync(async(req, res) => {
    const allSignUps = await SignUp.find({});
    return res.render("users/validate_student_signups.ejs", { allSignUps })
}))

router.post("/validate_student_signups", authorizedRoles("clerk"), wrapAsync(async(req, res) => {
    console.log(req.body.selectedUsers);
    const verifyed_students = req.body.selectedUsers;
    verifyed_students.forEach(async(student) => {
        let [username, rollNumber, password, image] = student.split("|");
        console.log(username, rollNumber, password, image);

        const studentRecord = await SignUp.findOne({ username, rollNumber });

        const newUser = new User({ username, rollNumber });
        newUser.image = image;
        password = decrypt(password);
        console.log(password)

        const registeredUser = await User.register(newUser, password);

        const x = await SignUp.deleteMany({ username, rollNumber });
        console.log("Deleted ", x);

    })
    res.redirect("/exams")

}))

/*router.post("/signup", wrapAsync(async(req, res) => {
    try {
        let { username, rollNumber, password } = req.body;
        console.log(req.body)

        const newUser = new User({ username, rollNumber });

        const registeredUser = await User.register(newUser, password);
        //Login automatically after signup and log in the user
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to the website ");
            res.redirect("/exams");
        })


    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }


}));*/

router.get("/login", (req, res) => {

    res.render("users/login.ejs");
})


router.post("/login", saveRedirectURL, passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), wrapAsync(async(req, res) => {
    req.flash("success", "Welcome back to Website!");
    let redirectURL = res.locals.redirectURL || "/exams";
    res.redirect(redirectURL);



}));

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged Out Successfully!");
        res.redirect("/exams");
    })
})





module.exports = router;