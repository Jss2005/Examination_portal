const Joi = require('joi');

module.exports.examSchema = Joi.object({
    exam: Joi.object({
        course: Joi.string().required(),
        regulation: Joi.string().required(),
        typeOfExam: Joi.string().required(),
        semester: Joi.string().required(),

    }).required()
});