const { messaging } = require("firebase-admin");
const { db } = require("../firebase");
const messagingService = require("../messagingService");

const getNotification = async (req, res) => {
  const { userId } = req.query;
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const { notificationList } = userDoc.data();
      res.status(200).json({ notificationList });
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).send("Error getting notifications");
  }
};

const deleteNotification = async (req, res) => {
  const { userId, notificationIds } = req.body; // Expect an array of notification IDs
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const { notificationList } = userDoc.data();
      const updatedList = notificationList.filter(
        (notification) => !notificationIds.includes(notification.id)
      );
      await userRef.update({ notificationList: updatedList });
      res.status(200).send("Notifications deleted successfully");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).send("Error deleting notifications");
  }
};

const checkAndSaveNotification = async (req, res) => {
  const { userId } = req.body;
  try {
    await messagingService.checkConditionsAndSaveNotification(userId);
    res.status(200).send("Notifications checked and saved successfully");
  } catch (error) {
    console.error("Error checking and saving notifications:", error);
    res.status(500).send("Error checking and saving notifications");
  }
};

const sendAlert = async (req, res) => {
  const { userId, sectorId } = req.body;
  try {
    await messagingService.checkAlertConditionAndSaveNotification(
      userId,
      sectorId
    );
    res.status(200).send("Alert checked and saved successfully");
  } catch (error) {
    console.error("Error checking and saving notifications:", error);
    res.status(500).send("Error checking and saving notifications");
  }
};

module.exports = {
  sendAlert,
  getNotification,
  deleteNotification,
  checkAndSaveNotification,
};
