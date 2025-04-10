const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    name: {
        type: String,
        // required: true
    },
    image: {
        type: String,
        //filename: String
    },

    email: {
        type: String,
        // required: true
    },
    fatherName: {
        type: String,
        //required: true
    },
    rollNumber: {
        type: String,
        // required: true,
        unique: true
    },
    branch: {
        type: String,
        // required: true
    },
    DOB: {
        type: Date,
        // required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Prefer not to say'],
        // required: true
    },
    role: {
        type: String,
        default: "Student"
    },
    //Newly added---------------------------------------------------------------

    course: { type: String },
    //----------------------------------------------------------

    examRegistrations: [{
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
        },
        semester: {
            type: String
        },
        status_of_application: {
            type: String,
            enum: ["accepted", "rejected", "pending"],
            default: "pending"

        },

        status_of_revaluation_application: {
            type: String,
            enum: ["accepted", "rejected", "pending"],
            default: "pending"
        },
        subjects: [{
            type: String,
            required: true
        }],
        yearOfExam: {
            type: Number,
            required: true
        },
        monthOfExam: {
            type: String,
            required: true
        },
        appliedAt: {
            type: Date
        },
        dateOfPayment: {
            type: Date
        },
        totalSubjects: {
            type: Number
        },
        station: {
            type: String
        },

        amountPaid: {
            type: Number,
            required: true
        },
        challanNumber: {
            type: String,
        },
        challan_pdf: {
            type: String
        },
        signature: {
            type: String
        },



        applyForRevaluation: {
            type: Boolean,
            default: false
        },
        revaluation_challan_pdf: {
            type: String
        },
        revaluation_signature: {
            type: String
        },
        reEvaluationSubjects: [{
            name: { type: String },
            code: { type: String },
            internal: { type: String },
            external: { type: String },
            total: { type: String }
        }],
        revaluation_bank_name: {
            type: String,
        },
        revaluation_challanNumber: {
            type: String,
        },
        revaluation_amountPaid: {
            type: String,
        },
        registeredAt: {
            type: Date,
            default: Date.now(),
        }
    }]

});
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);