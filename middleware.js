const Exam = require("./models/exam.js");
const { examSchema } = require("./serverside_validation.js");
const ExpressError = require("./utils/ExpressError.js");
module.exports.validateExam = (req, res, next) => {
    let { error } = examSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

module.exports.isLoggedIn = (req, res, next) => {
    console.log(req.user);
    //post login page
    console.log(req.path, "...", req.originalUrl); //   /new ... /listings/new
    if (!req.isAuthenticated()) {

        //redirect URL after login
        req.session.redirectURL = req.originalUrl; // to redirect to previous page after login

        req.flash("error", "You must be logged in to register for the exam");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectURL = (req, res, next) => {
    if (req.session.redirectURL) {
        res.locals.redirectURL = req.session.redirectURL;
    }
    next();
}

module.exports.authorizedRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {

            req.flash("error", "Denied Request");
            res.redirect("/exams");
        }
        next();
    }

}

module.exports.schema = {
    'Name': {
        prop: 'name',
        type: String
    },
    'Branch': {
        prop: 'branch',
        type: String
    },
    'Roll No': {
        prop: 'roll_number',
        type: String
    },
    'Subject': {
        prop: 'subject',
        type: String
    },
    'Grade': {
        prop: 'grade',
        type: String
    }

}