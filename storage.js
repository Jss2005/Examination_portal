const multer = require("multer");



const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[0] === "image") {
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
};

// ["image", "jpeg"]

const upload_images = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1000000000 },
});



const fileFilter_exam_notifications = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "pdf") {
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
};

const upload_exam_notifications = multer({
    storage,
    fileFilter_exam_notifications,
    limits: { fileSize: 1000000000 },
});



const storage_challans_signatures = multer.memoryStorage();
const upload_challans_signatures = multer({
    storage: storage_challans_signatures,

});

const multipleUpload = upload_challans_signatures.fields([{ name: 'challan' }, { name: "signature" }])



const storage_results = multer.memoryStorage();
const fileFilterResults = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; // PDFs & XLSX
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .pdf and .xlsx files are allowed!'), false);
    }
};


const upload_exam_results = multer({
    storage_results,
    fileFilterResults
});


module.exports = { upload_images, upload_exam_notifications, multipleUpload, upload_exam_results }