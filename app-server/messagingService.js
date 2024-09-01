const { admin, db } = require("./firebase");
const { FieldValue } = admin.firestore;
const moment = require("moment-timezone");

const verifySettings = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.data().notificationSettings;
};

const sendNotification = async (token, title, body) => {
  try {
    await admin.messaging().send({
      token: token,
      notification: {
        title: title,
        body: body,
      },
    });
    console.log("Notification sent successfully");
  } catch (error) {
    console.log("Error sending notification:", error);
  }
};

const fetchImportantDates = async (userId) => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const farmList = userDoc.data().farmList;
    let importantDates = [];

    for (const farmId of farmList) {
      const farmDoc = await db.collection("farms").doc(farmId).get();
      const sectorList = farmDoc.data().sectorList;

      for (const sectorId of sectorList) {
        const sectorDoc = await db.collection("sectors").doc(sectorId).get();
        const plantList = sectorDoc.data().plantList;

        for (const plantId of plantList) {
          const plantDoc = await db.collection("plant").doc(plantId).get();
          const plantData = plantDoc.data();
          importantDates.push(...plantData.importantDates);
        }
      }
    }
    return importantDates;
  } catch (error) {
    console.error("Error fetching important dates:", error);
    return [];
  }
};

const checkAlertConditionAndSaveNotification = async (userId, sectorId) => {
  const settings = await verifySettings(userId);
  const now = new Date();

  if (settings[1]) {
    // Anomaly Alert
    await saveNotification(
      userId,
      "Anomaly Alert",
      `Anomaly detected, please check your farm at sector ${sectorId}`,
      now,
      "important"
    );
  }
};

const checkConditionsAndSaveNotification = async (userId) => {
  const settings = await verifySettings(userId);
  const importantDates = await fetchImportantDates(userId);
  const now = new Date();
  const nowDateString = convertToMYT(now).split("T")[0]; // format date as YYYY-MM-DD in MYT

  if (settings[0]) {
    // Check important dates
    for (const dateEntry of importantDates) {
      const { date, note } = dateEntry;
      if (date === nowDateString) {
        await saveNotification(
          userId,
          "Reminder: Task to do today",
          `Task(s): ${note}`,
          now,
          "normal"
        );
      }
    }
  }

  if (settings[2]) {
    // Daily reminder
    await saveNotification(
      userId,
      "Daily Reminder",
      "This is your daily reminder for you to check on your farm.",
      now,
      "normal"
    );
  }
};

const convertToMYT = (utcTimeInMs) => {
  return moment(utcTimeInMs).tz("Asia/Kuala_Lumpur").format();
};

const saveNotification = async (userId, title, body, time, type) => {
  try {
    const mytTime = convertToMYT(time.getTime());
    const date = mytTime.split("T")[0]; // format date as YYYY-MM-DD
    const timeString = mytTime.split("T")[1].split("+")[0]; // format time as HH:MM:SS

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const messageToken = userDoc.data().messageToken;

      await userRef.update({
        notificationList: FieldValue.arrayUnion({
          id: new Date().getTime().toString(),
          title,
          content: body,
          date,
          time: timeString,
          type: type,
        }),
      });

      // Send the notification
      await sendNotification(messageToken, title, body);

      console.log("Notification saved and sent successfully");
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error saving and sending notification:", error);
  }
};

module.exports = {
  checkAlertConditionAndSaveNotification,
  checkConditionsAndSaveNotification,
  saveNotification,
};
