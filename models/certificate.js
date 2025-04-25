const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const certificateRequestSchema = new Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    typeOfCertificate: {
        type: String,
        enum: ['Custodian', 'Course Completion', 'Bonafide'],
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date
    },
    request: {
        type: String
    },
    academic_years: {
        type: String
    },
    semester: {
        type: String
    }


});

module.exports = mongoose.model('Certificates', certificateRequestSchema);