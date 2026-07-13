const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for uploaded photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const orderId = req.params.orderId;
    const dir = path.join(__dirname, '../uploads/orders', orderId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // e.g. before-packed.jpg, in-bag.jpg, driver-pickup.jpg
    cb(null, file.fieldname + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
