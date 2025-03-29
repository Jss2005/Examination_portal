const express = require('express');
const Exam = require("../models/exam");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync.js");
const { validateExam, isLoggedIn, authorizedRoles, schema } = require("../middleware.js");
const ExpressError = require('../utils/ExpressError.js');
const readxlsxFile = require("read-excel-file/node");

const path = require('path');
const pdf = require('html-pdf');
const ejs = require('ejs');

const axios = require("axios");
const fs = require("fs").promises;
const fs1 = require("fs");

const puppeteer = require('puppeteer');




const { upload_exam_notifications, multipleUpload, upload_exam_results } = require("../storage.js")
const { s3Uploadv3ExamNotifications, getObjectSignedUrl, s3Uploadv3Signature, s3Uploadv3Challan, s3Uploadv3Results } = require("../s3service.js")

const router = express.Router();




//GET Route
router.get("/", wrapAsync(async(req, res) => {
    const availableExams = await Exam.find({});
    res.render("exams/index.ejs", { availableExams });
}))

//NEW Route
router.get("/new", authorizedRoles("Admin"), isLoggedIn, (req, res) => {
    console.log(res.locals.currUser)
    res.render("exams/new.ejs");
})

//CREATE ROUTE
router.post("/", isLoggedIn, authorizedRoles("Admin"), upload_exam_notifications.single("notification"), wrapAsync(async(req, res) => {


    let exam = req.body.exam;
    console.log(exam)


    const resp = await s3Uploadv3ExamNotifications(req.file);
    console.log(resp);
    const uri = await getObjectSignedUrl(resp);
    console.log(uri)



    // console.log(url, +"   ", filename);
    const newExam = new Exam(exam);
    newExam.notification = uri;

    await newExam.save();
    res.redirect('/exams');

}));



//Show Route
router.get("/:id", isLoggedIn, authorizedRoles("Admin", "clerk"), wrapAsync(async(req, res) => {
    let { id } = req.params;
    const exam = await Exam.findById(id);
    res.render('exams/show.ejs', { exam });
}))


//EDIT ROUTE
router.get("/:id/edit", isLoggedIn, authorizedRoles("Admin"), wrapAsync(async(req, res) => {
    let { id } = req.params;
    const exam = await Exam.findById(id);
    res.render('exams/edit.ejs', { exam });
}))

//UPDATE ROUTE
router.put("/:id", isLoggedIn, authorizedRoles("Admin"), validateExam, wrapAsync(async(req, res) => {
    /*if (!req.body.listing)
        throw new ExpressError(400, "Send Valid data for listing") //400-Bad Request by client*/
    let { id } = req.params;

    await Exam.findByIdAndUpdate(id, {...req.body.exam });

    res.redirect(`/exams/${id}`);
}))


//DELETE ROUTE
router.delete("/:id", isLoggedIn, authorizedRoles("Admin"), wrapAsync(async(req, res) => {
    let { id } = req.params;
    let deletedExam = await Exam.findByIdAndDelete(id);

    res.redirect(`/exams`);
}))

router.get("/:id/registrations", isLoggedIn, authorizedRoles("clerk"), wrapAsync(async(req, res) => {
    const { id } = req.params;
    const exam = await Exam.findById(id).populate("registeredStudents.studentId");

    const currStudents = exam.registeredStudents.map(s => {
        const student = s.studentId;
        const registration = student.examRegistrations.find(reg => reg.examId.equals(id));

        return {
            _id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            branch: student.branch,
            email: student.email,
            image: student.image,
            challan_pdf: registration.challan_pdf,
            signature: registration.signature,
            //signature: registration && registration.signature ? 
        };
    });
    //return res.json(currStudents);


    return res.render("exams/verify_registation.ejs", { students: currStudents, exam });

}))

router.get("/:id/revaluation_registrations", isLoggedIn, authorizedRoles("clerk"), wrapAsync(async(req, res) => {
    const { id } = req.params;

    // Find all students who have registered for this exam and applied for revaluation
    const students = await User.find({
        "examRegistrations": {
            $elemMatch: { examId: id, applyForRevaluation: true }
        }
    });

    const exam = await Exam.findById(id);
    return res.render("exams/verify_revaluation_registation.ejs", { students, exam });
}))


router.post("/:id/registrations", isLoggedIn, authorizedRoles("clerk"), wrapAsync(async(req, res) => {
    const { id } = req.params;
    const { studentIds } = req.body; // Array of student IDs

    // Extract statuses for each student
    let updatedRegistrations = studentIds.map(studentId => {
        return {
            studentId,
            status_of_application: req.body[`status_${studentId}`] // Get selected status
        };
    });

    // console.log(updatedRegistrations);

    for (let reg of updatedRegistrations) {
        await User.updateOne({ _id: reg.studentId, "examRegistrations.examId": id }, { $set: { "examRegistrations.$.status_of_application": reg.status_of_application } });
    }

    req.flash("success", "Registrations updated successfully!");
    res.redirect(`/exams/${id}/registrations`);

}))




router.post("/:id/revaluation_registrations", isLoggedIn, authorizedRoles("clerk"), wrapAsync(async(req, res) => {
    const { id } = req.params;
    const { studentIds } = req.body; // Array of student IDs

    // Extract statuses for each student
    let updatedRegistrations = studentIds.map(studentId => {
        return {
            studentId,
            status_of_revaluation_application: req.body[`status_${studentId}`] // Get selected status
        };
    });

    // console.log(updatedRegistrations);

    for (let reg of updatedRegistrations) {
        await User.updateOne({ _id: reg.studentId, "examRegistrations.examId": id }, { $set: { "examRegistrations.$.status_of_revaluation_application": reg.status_of_revaluation_application } });
    }

    req.flash("success", "Revaluation Status updated successfully!");
    res.redirect(`/exams`);

}))


router.get("/:id/students/:studentId", isLoggedIn, wrapAsync(async(req, res) => {
    const { id, studentId } = req.params;


    const student = await User.findById(studentId);
    const exam = await Exam.findById(id);


    return res.render("users/registration_form.ejs", { exam, student });
}))






router.post("/:id/students/:studentId", isLoggedIn, multipleUpload, wrapAsync(async(req, res) => {
    const { id, studentId } = req.params;
    const { name, fatherName, email, branch, rollNumber, DOB, gender, yearOfExam, monthOfExam, numSubjects, subjects, amountPaid, challanNumber, image } = req.body.student;

    //console.log(subjects);
    const student = await User.findByIdAndUpdate(studentId, { name, fatherName, email, branch, DOB, gender });

    //student.role = "Student";
    let alreadyRegistered = false;

    student.examRegistrations.forEach((exm) => {
        if (exm.examId.toString() === id) {
            alreadyRegistered = true;
        }
    })

    if (!alreadyRegistered) {




        const resp = await s3Uploadv3Signature(req.files.signature[0]);
        // console.log(resp);
        const uri = await getObjectSignedUrl(resp);
        console.log(uri)

        const resp2 = await s3Uploadv3Challan(req.files.challan[0]);
        console.log(resp2);
        const uri2 = await getObjectSignedUrl(resp2);
        console.log(uri2)



        student.examRegistrations.push({
            examId: id,
            challan_pdf: uri2,
            signature: uri,
            yearOfExam,
            monthOfExam,
            numSubjects,
            subjects,
            amountPaid,
            challanNumber
        })

        await student.save();

        const exam = await Exam.findByIdAndUpdate(id);
        exam.registeredStudents.push({
            studentId: studentId
        })

        await exam.save();
        return res.redirect("/exams");
    } else {
        req.flash("error", "Already applied for this exam");
        return res.redirect("/exams");
    }
}))



router.get("/:id/postresults", authorizedRoles("Admin"), wrapAsync(async(req, res) => {
    const { id } = req.params;

    // Find the exam with populated student details and exam registrations
    const exam = await Exam.findById(id)
        .populate('registeredStudents.studentId', 'name rollNumber branch examRegistrations');

    if (!exam) {
        return res.status(404).send('Exam not found');
    }
    res.render("results/postresults.ejs", { exam: exam });
}))

router.post("/:id/postresults", authorizedRoles("Admin"), upload_exam_results.single("exam[results]"), wrapAsync(async(req, res) => {
    const { id } = req.params; // Exam ID from the route parameter

    const exam = await Exam.findById(id);
    if (!exam) {
        return res.status(404).send({ message: "Exam not found." });
    }



    const resp = await s3Uploadv3Results(req.file);
    console.log(resp);
    const uri = await getObjectSignedUrl(resp);
    console.log(uri)


    exam.results_excel_sheet = uri;
    exam.isResultsDeclared = true;
    exam.results_declared_at = Date.now();

    await exam.save();

    console.log(`File uploaded successfully: ${req.file.filename}`);

    req.flash("success", "Results Declared Successfully!");
    res.redirect(`/exams`);
}));



async function downloadFromS3(s3Url, outputFile) {
    const response = await axios.get(s3Url, { responseType: "arraybuffer" });
    await fs.writeFile(outputFile, response.data);
    return outputFile;
}


router.get("/:id/results/:studentId", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    const { id, studentId } = req.params;
    const student = await User.findById(studentId);
    const exam = await Exam.findById(id);

    if (exam.isResultsDeclared) {

        const s3Url = exam.results_excel_sheet; // Ensure this is a signed S3 URL

        // Create a temporary path to save the file
        const tempFilePath = path.join(__dirname, "..", "temp_results.xlsx");

        await downloadFromS3(s3Url, tempFilePath);
        console.log("File downloaded successfully:", tempFilePath);

        const rows = await readxlsxFile(tempFilePath, { schema, sheet: "Sheet1" });




        const result = rows.rows;
        console.log(result);

        const studentResult = [];
        result.forEach((row) => {

            if (row.roll_number && student.rollNumber && row.roll_number.toString() == student.rollNumber.toString()) {

                studentResult.push({
                    name: row.name,
                    branch: row.branch,
                    roll_number: row.roll_number,
                    subject: row.subject,
                    grade: row.grade
                })
            }

        })

        console.log(studentResult)


        const date = new Date(exam.results_declared_at);
        date.setDate(date.getDate() + 5); // Add 5 days for revaluation

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);

        const formattedDate = `${day}/${month}/${year}`;

        // Convert formatted date to a valid Date object for comparison
        const revaluationDeadline = new Date(`20${year}`, month - 1, day);
        const currentDate = new Date();

        const revaluationDisabled = currentDate > revaluationDeadline; // Boolean flag


        console.log("Revaluation Deadline:", revaluationDeadline);
        console.log("Current Date:", currentDate);
        console.log("Is Revaluation Disabled:", revaluationDisabled);


        return res.render("results/viewresults.ejs", { studentResult, exam, student, revaluationDisabled, revaluationDeadline: formattedDate });

    }
    req.flash("error", "Results are not yet Declared");
    res.redirect(`/exams`);
}))


router.get("/:id/re_evaluation/:studentId", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    const { id, studentId } = req.params;
    const student = await User.findById(studentId).populate("examRegistrations", "subjects");
    const exam = await Exam.findById(id);



    if (exam.isResultsDeclared) {
        return res.render("results/apply_for_re_evaluation.ejs", { exam, student });
    } else {
        req.flash("error", "You haven't applied for this exam");
        res.redirect(`/exams`);
    }
}))





router.post("/:id/re_evaluation/:studentId", isLoggedIn, authorizedRoles("Student"), multipleUpload, wrapAsync(async(req, res) => {
    const { id, studentId } = req.params;
    const { student } = req.body;


    // Extract subjects from the request
    const subjects = student.subjects;

    // Fetch the student from the database
    const stu = await User.findById(studentId);
    if (!stu) {
        req.flash("error", "Student not found.");

    }


    const examRegistration = stu.examRegistrations.find(reg => reg.examId.toString() === id);
    if (!examRegistration) {
        req.flash("error", "Exam registration not found.");

    }
    examRegistration.applyForRevaluation = true;


    const resp = await s3Uploadv3Signature(req.files.signature[0]);
    // console.log(resp);
    const uri = await getObjectSignedUrl(resp);
    console.log(uri)

    const resp2 = await s3Uploadv3Challan(req.files.challan[0]);
    console.log(resp2);
    const uri2 = await getObjectSignedUrl(resp2);
    console.log(uri2)


    for (let i = 0; i < subjects.length; i++) {
        examRegistration.reEvaluationSubjects.push(subjects[i]);
    }

    examRegistration.revaluation_challan_pdf = uri2;
    examRegistration.revaluation_signature = uri;




    let stu1 = await stu.save();

    res.redirect(`/exams`);
}));


router.get("/:id/postrevaluationResults", authorizedRoles("Admin"), wrapAsync(async(req, res) => {
    const { id } = req.params;


    const exam = await Exam.findById(id);

    if (!exam) {
        req.flash("error", "Exam not found.");
        res.redirect("/exams");
    }


    res.render("results/postrevaluationresults.ejs", { exam: exam })
}));

router.post("/:id/postrevaluationresults", authorizedRoles("Admin"), upload_exam_results.single("exam[revaluationResults]"), wrapAsync(async(req, res) => {
    const { id } = req.params; // Exam ID from the route parameter

    const exam = await Exam.findById(id);
    if (!exam) {
        return res.status(404).send({ message: "Exam not found." });
    }

    const resp = await s3Uploadv3Results(req.file);
    console.log(resp);
    const uri = await getObjectSignedUrl(resp);
    console.log(uri)


    exam.isRevaluationResultsDeclared = true;
    exam.reEvaluationResults_excel_sheet = uri;

    await exam.save();
    console.log(`File uploaded successfully: ${req.file.filename}`);

    req.flash("success", "Results Declared Successfully!");
    res.redirect(`/exams`);

}));



router.get("/:id/revaluation_results/:studentId", isLoggedIn, authorizedRoles("Student"), wrapAsync(async(req, res) => {
    const { id, studentId } = req.params;
    const student = await User.findById(studentId);
    const exam = await Exam.findById(id);

    if (exam.isRevaluationResultsDeclared) {
        const s3Url = exam.reEvaluationResults_excel_sheet; // Ensure this is a signed S3 URL

        // Create a temporary path to save the file
        const tempFilePath = path.join(__dirname, "..", "temp1_results.xlsx");

        await downloadFromS3(s3Url, tempFilePath);
        console.log("File downloaded successfully:", tempFilePath);

        const rows = await readxlsxFile(tempFilePath, { schema, sheet: "Sheet1" });
        const result = rows.rows;
        const studentResult = [];
        result.forEach((row) => {

            if (row.roll_number && student.rollNumber && row.roll_number.toString() == student.rollNumber.toString()) {

                studentResult.push({
                    name: row.name,
                    branch: row.branch,
                    roll_number: row.roll_number,
                    subject: row.subject,
                    grade: row.grade
                })
            }
        })
        return res.render("results/re_evaluation_results.ejs", { studentResult, exam, student });

    }
    req.flash("error", "Results are not yet Declared");
    res.redirect(`/exams`);
}))


async function fetchImageBase64(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const base64 = Buffer.from(response.data, "binary").toString("base64");
        return `data:image/jpeg;base64,${base64}`; // Adjust MIME type if necessary
    } catch (error) {
        console.error("Error fetching image:", error);
        return "";
    }
}



router.get('/generate-hall-ticket/:userId/:examId', async(req, res) => {
    try {
        const { userId, examId } = req.params;

        // Fetch user and exam data
        const user = await User.findById(userId);
        const exam = await Exam.findById(examId);

        if (!user || !exam) {
            return res.status(404).send('User or Exam not found');
        }

        // Find the specific exam registration
        const registration = user.examRegistrations.find(
            reg => reg.examId.toString() === examId
        );

        if (!registration) {
            return res.status(404).send('Exam registration not found');
        }

        // Set a placeholder image if user image is missing
        const base64Image = user.image || "https://images.pexels.com/photos/31346411/pexels-photo-31346411/free-photo-of-mountain-goat-standing-on-rocky-cliff-in-alps.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load";

        // Render EJS template into HTML
        const templatePath = path.join(__dirname, '../views/users/hall-ticket.ejs');
        const html = await ejs.renderFile(templatePath, { user, exam, registration, base64Image });

        // Launch Puppeteer in headless mode
        const browser = await puppeteer.launch({
            headless: false, // Optimized headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF with proper styling
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Ensures styles are applied
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
            timeout: 60000 // Ensures Puppeteer doesn't exit too soon
        });

        console.log("PDF Buffer Size:", pdfBuffer.length);

        await browser.close();

        // Optionally, save PDF to local storage (for debugging)
        fs1.writeFileSync('test.pdf', pdfBuffer);
        console.log("PDF saved as test.pdf");

        // Send PDF as response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Hall_Ticket_${user.name}.pdf"`);
        console.log("HI")
        res.end(pdfBuffer);

    } catch (error) {
        console.error('Error generating hall ticket:', error);
        res.status(500).send('Error generating hall ticket');
    }
});


module.exports = router

/*router.get('/generate-hall-ticket/:userId/:examId', async(req, res) => {
    try {
        const { userId, examId } = req.params;

        // Find user and exam data
        const user = await User.findById(userId);
        const exam = await Exam.findById(examId);

        if (!user || !exam) {
            return res.status(404).send('User or Exam not found');
        }

        // Find the specific exam registration
        const registration = user.examRegistrations.find(
            reg => reg.examId.toString() === examId
        );

        if (!registration) {
            return res.status(404).send('Exam registration not found');
        }

        let base64Image = '';
        if (user.image) {
            base64Image = await fetchImageBase64(user.image);
        }


        // Render the EJS template with data
        ejs.renderFile(
            path.join(__dirname, "../", 'views', "users", 'hall-ticket.ejs'), { user, exam, registration, base64Image },
            (err, html) => {
                if (err) {
                    return res.send(err);
                }

                // PDF Configuration
                const options = {
                    format: 'A4',
                    border: {
                        top: '10mm',
                        right: '10mm',
                        bottom: '10mm',
                        left: '10mm'
                    },
                    footer: {
                        height: '0mm'
                    },
                    renderDelay: 1000,
                    pageRanges: '1'
                };

                // Generate PDF
                pdf.create(html, options).toBuffer((err, buffer) => {
                    if (err) {
                        return res.status(500).send(err);
                    }

                    // Send the PDF as a response
                    //res.type('application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="Hall_Ticket_${user.name}.pdf"`);
                    res.setHeader('Content-Type', 'application/pdf');

                    res.send(buffer);
                });
            }
        );
    } catch (error) {
        console.error('Error generating hall ticket:', error);
        res.status(500).send('Error generating hall ticket');
    }
});

module.exports = router;*/