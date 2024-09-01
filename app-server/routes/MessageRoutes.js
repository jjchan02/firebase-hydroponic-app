const express = require("express");
const router = express.Router();
const messageController = require("../controllers/MessageController");

router.get("/getNotification", messageController.getNotification);
router.delete("/deleteNotification", messageController.deleteNotification);
router.post(
  "/checkAndSaveNotifications",
  messageController.checkAndSaveNotification
);
router.post("/sendAlert", messageController.sendAlert);

module.exports = router;
