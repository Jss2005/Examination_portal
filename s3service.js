const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const uuid = require("uuid").v4;
const mime = require("mime-types");
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}


const s3client = new S3Client({
    region: process.env.AWS_REGION, // Ensure this is set in your environment
});

exports.s3Uploadv3Image = async(file) => {

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/images/${uuid()}-${file.originalname}`,
        Body: file.buffer,
    };

    await s3client.send(new PutObjectCommand(params));
    return params.Key;
};


exports.s3Uploadv3ExamNotifications = async(file) => {

    const contentType = mime.lookup(file.originalname) || "application/octet-stream";
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/notifications/${uuid()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: contentType,
        ContentDisposition: "inline"
    };

    await s3client.send(new PutObjectCommand(params));
    return params.Key;
};


exports.s3Uploadv3Challan = async(file) => {

    const contentType = mime.lookup(file.originalname) || "application/octet-stream";
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/Challans/${uuid()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: contentType,
        ContentDisposition: "inline"
    };

    await s3client.send(new PutObjectCommand(params));
    return params.Key;
};

exports.s3Uploadv3Signature = async(file) => {

    const contentType = mime.lookup(file.originalname) || "application/octet-stream";
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/Signatures/${uuid()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: contentType,
        ContentDisposition: "inline",

    };

    await s3client.send(new PutObjectCommand(params));
    return params.Key;
};



exports.s3Uploadv3Results = async(file) => {


    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/Results/${uuid()}-${file.originalname}`,
        Body: file.buffer,

        ContentDisposition: "inline",

    };

    await s3client.send(new PutObjectCommand(params));
    return params.Key;
};



exports.getObjectSignedUrl = async(key) => {

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    }


    const command = new GetObjectCommand(params);
    const seconds = 60 * 60
    const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

    return url
}