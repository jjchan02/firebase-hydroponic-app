const { db, admin } = require(".././firebase");

const registerUser = async (req, res) => {
  const { userId, farmList, messageToken } = req.body;
  const notificationSettings = [true, true, true];
  const notificationList = [];

  if (!userId || !messageToken) {
    return res.status(400).send("Invalid request data");
  }

  try {
    await db.collection("users").doc(userId).set({
      messageToken,
      farmList,
      notificationSettings,
      notificationList,
    });

    res.status(200).send("User registered successfully");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updateEmail = async (req, res) => {
  const { uid, newEmail } = req.body;
  try {
    // Update email in Firebase Authentication
    await admin.auth().updateUser(uid, { email: newEmail });

    res.status(200).send({ message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating email: ", error);
    res.status(500).send({ message: "Failed to update email" });
  }
};

const checkAndUpdateToken = async (req, res) => {
  const { userId, messageToken } = req.body;

  if (!messageToken || !userId) {
    console.log("No message token or user ID found");
    return res.status(400).send("No message token or user ID found");
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const currentToken = userDoc.data().messageToken;
      if (currentToken !== messageToken) {
        await userRef.update({ messageToken });
        console.log("Token updated: ", messageToken);
      }
      return res.status(200).send("Token checked successfully");
    } else {
      console.log("User not found");
      return res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error updating message token:", error);
    return res.status(500).send("Error updating message token");
  }
};

const getUser = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).send("User ID is required");
  }

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).send("User not found");
    }

    const userData = userDoc.data();
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updateUserSettings = async (req, res) => {
  const { userId, notificationSettings } = req.body;
  // console.log("Received data:", { userId, notificationSettings }); // Debug log

  if (!userId || !notificationSettings) {
    return res.status(400).send("Invalid request data");
  }

  try {
    await db.collection("users").doc(userId).update({
      notificationSettings,
    });
    // console.log("Notification settings updated in DB"); // Debug log

    res.status(200).send("Notification settings updated successfully");
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).send("Internal Server Error");
  }
};

const checkEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    res.status(200).send({ exists: true });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      res.status(200).send({ exists: false });
    } else {
      res.status(500).send({ error: error.message });
    }
  }
};

module.exports = {
  registerUser,
  updateEmail,
  getUser,
  updateUserSettings,
  checkAndUpdateToken,
  checkEmail,
};
