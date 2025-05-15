const Joi = require("joi");

const signupSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    rollNumber: Joi.string().alphanum().min(3).max(15).required(),
    password: Joi.string().min(6).required(),
    course: Joi.string().valid("BTech", "MTech", "MCA").required(),

});

const validateInput = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    action: Joi.string().valid('accept', 'reject').required()
});



const examSchemaJoi = Joi.object({
    course: Joi.string()
        .valid("BTech", "MTech", "MCA")
        .required(),

    regulation: Joi.string()
        .alphanum()
        .min(2)
        .max(10)
        .required(),

    semester: Joi.string()
        .valid("1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2")
        .required(),

    typeOfExam: Joi.string()
        .valid("Regular", "Supply")
        .required(),

    month: Joi.string()
        .valid(
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        )
        .required(),

    year: Joi.number()
        .integer()
        .min(2000)
        .max(new Date().getFullYear() + 1)
        .required(),

    // These fields are managed programmatically, not from the form:
    isRegistrationOpen: Joi.boolean().optional(),
    isHallTicketIssued: Joi.boolean().optional(),
    isResultsDeclared: Joi.boolean().optional(),
    isRevaluationResultsDeclared: Joi.boolean().optional(),
});

module.exports = { signupSchema, validateInput, examSchemaJoi }