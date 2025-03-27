const mongoose = require('mongoose');
const User = require("./user");
const { date } = require('joi');
const Schema = mongoose.Schema;


const examSchema = Schema({
    course: { //Btech,Mtech
        type: String,
        required: true,
    },
    regulation: { //R20,R19
        type: String,
        required: true,
    },
    semester: { //1-1 ..... 4-2
        type: String,
        required: true,
    },
    typeOfExam: { //Regular,Supply
        type: String,
        required: true,
    },
    notification: {
        type: String,

    },
    month: {
        type: String,
    },
    year: {
        type: String,
    },
    //TODO
    isHallTicketIssued: {
        type: Boolean,
        default: false,
    },
    //TODO
    isResultsDeclared: {
        type: Boolean,
        default: false
    },
    isRevaluationResultsDeclared: {
        type: Boolean,
        default: false
    },
    results_excel_sheet: {
        type: String,
    },
    results_declared_at: {
        type: Date
    },
    reEvaluationResults_excel_sheet: {
        type: String,

    },



    registeredStudents: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // required: true
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },

    }],


    //TODO
    /*results: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subjects: [{
            name: {
                type: String,
                required: true,
            },
            grade: {
                type: String,
                enum: ["A+", "A", "B", "C", "D", "E", "F"],
                required: true,
            },
        }],
    }, ],

    reEvaluationResults: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subjects: [{
            name: {
                type: String,
                required: true,
            },
            grade: {
                type: String,
                enum: ["A+", "A", "B", "C", "D", "E", "F"],
                required: true,
            },
        }],
    }, ],*/

});


module.exports = mongoose.model('Exam', examSchema);