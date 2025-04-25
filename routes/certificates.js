require('dotenv').config();
const express = require('express');
const Exam = require("../models/exam.js");
const User = require("../models/user.js");
const Certificates = require("../models/certificate.js")
const wrapAsync = require("../utils/wrapAsync.js");

const { validateExam, isLoggedIn, authorizedRoles, schema } = require("../middleware.js");
const { upload_images } = require('../storage.js');
const router = express.Router();


router.get("/requests", isLoggedIn, authorizedRoles("Admin"), wrapAsync(async(req, res) => {

    const allRequests = await Certificates.find({ status: "pending" }).populate('student', 'name rollNumber');
    res.render("certificates/all_requests.ejs", { allRequests });

}));

router.post("/request/accept/:requestId", isLoggedIn, authorizedRoles("Admin"), wrapAsync(async(req, res) => {
    const { requestId } = req.params;

    // Find the request by ID and update its status to 'approved'
    const request = await Certificates.findById(requestId);

    if (!request) {
        req.flash("error", "Certificate request not found.");
        return res.redirect("/certificates/all-requests");
    }



    request.approvedAt = Date.now();
    request.status = 'approved';
    await request.save();

    req.flash("success", "Certificate request has been approved.");
    res.redirect("/certificates/requests");
}));



router.post("/request/reject/:requestId", isLoggedIn, authorizedRoles("Admin"), wrapAsync(async(req, res) => {
    const { requestId } = req.params;

    // Find the request by ID and update its status to 'rejected'
    const request = await Certificates.findById(requestId);

    if (!request) {
        req.flash("error", "Certificate request not found.");
        return res.redirect("/certificates/all-requests");
    }

    request.status = 'rejected';
    await request.save();

    req.flash("success", "Certificate request has been rejected.");
    res.redirect("/certificates/requests");
}));



router.get("/request/bonafide", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    // console.log(req.user);
    return res.render("certificates/bonafide_form.ejs");

}))
router.get("/request/custodian", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    // console.log(req.user);
    return res.render("certificates/custodian_form.ejs");

}))

router.get("/request/course_completion", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {

    return res.render("certificates/course_completion_form.ejs");

}))


router.post("/request/bonafide", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    console.log(req.user._id);

    const { typeOfCertificate, academic_years, purpose, request, semester } = req.body;

    const newRequest = new Certificates({
        student: req.user._id,
        typeOfCertificate,
        academic_years,
        purpose,
        request,
        semester
    });

    await newRequest.save();

    req.flash("success", "Your certificate request has been submitted successfully!");
    res.redirect(`/exams/${req.user._id}/dashboard`);

}))


router.post("/request/custodian", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    console.log(req.user._id);

    const { typeOfCertificate, academic_years, purpose, request, semester } = req.body;

    const newRequest = new Certificates({
        student: req.user._id,
        typeOfCertificate,
        academic_years,
        purpose,
        request,
        semester
    });

    await newRequest.save();

    req.flash("success", "Your certificate request has been submitted successfully!");
    res.redirect(`/exams/${req.user._id}/dashboard`);

}))



router.post("/request/course_completion", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    console.log(req.user._id);

    const { typeOfCertificate, academic_years, purpose, request, semester } = req.body;

    const newRequest = new Certificates({
        student: req.user._id,
        typeOfCertificate,
        academic_years,
        purpose,
        request,
        semester
    });

    await newRequest.save();

    req.flash("success", "Your certificate request has been submitted successfully!");
    res.redirect(`/exams/${req.user._id}/dashboard`);

}))

router.get("/bonafide", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    const { id } = req.params;

    const certificate = await Certificates.findOne({ student: req.user._id, typeOfCertificate: "Bonafide", status: "approved" }).populate("student", "name rollNumber branch course");


    /*
    [
  {
    "_id": "68073c113cb60abcabe4578d",
    "student": {
      "_id": "67f74714fa7a42b422a9733c",
      "rollNumber": "21021A0542",
      "course": "BTech",
      "branch": "CSE",
      "name": "Bharadwaj"
    },
    "typeOfCertificate": "Bonafide",
    "purpose": "on-boarding-the-job",
    "status": "approved",
    "request": "I have job ",
    "academic_years": "2020-2024",
    "semester": "IV-I",
    "appliedAt": "2025-04-22T06:49:53.023Z",
    "__v": 0
  }
]
     */
    if (!certificate) {
        req.flash("error", "Certificate not found.");
        return res.redirect(`/exams/${req.user._id}/dashboard`);
    }




    return res.render("certificates/bonafide.ejs", { certificate });
}));


router.get("/custodian", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    const { id } = req.params;

    const certificate = await Certificates.findOne({ student: req.user._id, typeOfCertificate: "Custodian", status: "approved" }).populate("student", "name rollNumber branch course");

    if (!certificate) {
        req.flash("error", "Certificate not found.");
        return res.redirect(`/exams/${req.user._id}/dashboard`);
    }




    return res.render("certificates/custodian.ejs", { certificate });
}));


router.get("/course_completion", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    const { id } = req.params;

    const certificate = await Certificates.findOne({ student: req.user._id, typeOfCertificate: "Course Completion", status: "approved" }).populate("student", "name rollNumber branch course");

    if (!certificate) {
        req.flash("error", "Certificate not found.");
        return res.redirect(`/exams/${req.user._id}/dashboard`);
    }




    return res.render("certificates/course_completion.ejs", { certificate });
}));


module.exports = router;