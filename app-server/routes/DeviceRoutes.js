const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/DeviceController");

router.post("/register", deviceController.registerDevice);
router.get("/getDevice/:deviceId", deviceController.getDeviceInfo);

module.exports = router;
