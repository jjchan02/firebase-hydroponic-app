const express = require("express");
const plantRoutes = require("./routes/PlantRoutes");
const farmRoutes = require("./routes/FarmRoutes");
const userRoutes = require("./routes/UserRoutes");
const sectorRoutes = require("./routes/SectorRoutes");
const messageRoutes = require("./routes/MessageRoutes");
const deviceRoutes = require("./routes/DeviceRoutes");
const cron = require("node-cron");
const axios = require("axios");
const { db } = require("./firebase");

const app = express();
const port = 3000;

// 0 0 * * * for 12am, * * * * * for every min
cron.schedule("0 0 * * *", async () => {
  try {
    const userSnapshot = await db.collection("users").get();
    const userIds = userSnapshot.docs.map((doc) => doc.id);
    for (const userId of userIds) {
      await axios.post(
        "http://localhost:3000/message/checkAndSaveNotifications",
        { userId }
      );
    }
    console.log("Notifications checked and saved successfully for all users");
  } catch (error) {
    console.error("Error checking and saving notifications:", error);
  }
});

cron.schedule("0 * * * *", async () => {
  try {
    const now = new Date();
    const timeoutPeriod = 30 * 60 * 1000; // 30 minutes timeout

    const sectorsSnapshot = await db.collection("sectors").get();
    const batch = db.batch();

    sectorsSnapshot.forEach((doc) => {
      const sectorData = doc.data();
      const lastUpdate = new Date(sectorData.lastUpdate);

      // Check if last update exceeds the timeout period
      if (now - lastUpdate > timeoutPeriod) {
        batch.update(doc.ref, { status: "offline" });
      } else {
        batch.update(doc.ref, { status: "online" });
      }
    });

    await batch.commit();
    console.log("Sector statuses updated successfully");
  } catch (error) {
    console.error("Error updating sector statuses:", error);
  }
});

app.use(express.json());
app.use("/user", userRoutes);
app.use("/plant", plantRoutes);
app.use("/farm", farmRoutes);
app.use("/sector", sectorRoutes);
app.use("/message", messageRoutes);
app.use("/device", deviceRoutes);

app.listen(port, () => console.log(`Server has started on port: ${port}`));
