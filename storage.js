const multer = require('multer');
const path = require('path');

// Set storage destination and filename
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/results'); // Save files to the 'uploads' directory
    },
    filename: function(req, file, cb) {
        //  cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        cb(null, Date.now() + file.originalname);

    }
});

const storage_images = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/images'); // Save files to the 'uploads' directory
    },
    filename: function(req, file, cb) {

        cb(null, Date.now() + file.originalname);

    }
});


/*const storage_challans = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/challans'); // Save files to the 'uploads' directory
    },
    filename: function(req, file, cb) {

        cb(null, Date.now() + file.originalname);

    }
});*/

const storage_notifications = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/exam_notifications'); // Save files to the 'uploads' directory
    },
    filename: function(req, file, cb) {

        cb(null, Date.now() + file.originalname);

    }
});

// File filter to accept specific document formats
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; // PDFs & XLSX
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .pdf and .xlsx files are allowed!'), false);
    }
};

const fileFilter_images = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']; // Allow only PNG, JPG, JPEG
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg, and .jpeg files are allowed!'), false);
    }
};

/*const fileFilter_challans = (req, file, cb) => {
    const allowedTypes = ['application/pdf']; // PDFs 
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .pdf files are allowed!'), false);
    }
};*/

const fileFilter_exam_notifications = (req, file, cb) => {
    const allowedTypes = ['application/pdf']; // PDFs 
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .pdf files are allowed!'), false);
    }
};




// Multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    //limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

const upload_images = multer({
    storage: storage_images,
    fileFilter: fileFilter_images,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});


/*const upload_challans = multer({
    storage: storage_challans,
    fileFilter: fileFilter_challans,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});*/


const upload_exam_notifications = multer({
    storage: storage_notifications,
    fileFilter: fileFilter_exam_notifications,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});



const storage_challans_signatures = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/challans_signatures'); // Save files to the 'uploads' directory
    },
    filename: function(req, file, cb) {

        cb(null, Date.now() + file.originalname);

    }
})
const upload_challans_signatures = multer({
    storage: storage_challans_signatures,

});

const multipleUpload = upload_challans_signatures.fields([{ name: 'challan' }, { name: "signature" }])

module.exports = { upload, upload_images, upload_exam_notifications, multipleUpload };