const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const medicineController = require('../controllers/medicineController');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/images'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('medicineImage'), medicineController.scanMedicine);

module.exports = router;
