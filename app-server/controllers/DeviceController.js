const { db, admin } = require("../firebase");
const moment = require("moment-timezone");

const convertToMYT = (utcTimeInMs) => {
  return moment(utcTimeInMs).tz("Asia/Kuala_Lumpur").format();
};

const registerDevice = async (req, res) => {
  const { deviceName, deviceLocation } = req.body;

  if (!deviceName || !deviceLocation) {
    return res.status(400).json({ error: "Name and location are required." });
  }

  const timestamp = convertToMYT(new Date()).split("+")[0];

  try {
    const device = {
      deviceName: deviceName,
      deviceLocation: deviceLocation,
      createdAt: timestamp,
    };

    const deviceRef = await db.collection("devices").add(device);
    const deviceId = deviceRef.id;
    res.status(200).send(deviceId);
  } catch (error) {
    console.log("Error adding device: ", error);
    res.status(500).send("Internal Server Error");
  }
};

const getDeviceInfo = async (req, res) => {
  const { deviceId } = req.params;

  if (!deviceId) {
    res.status(400).send("Device ID is required");
  }

  try {
    const deviceDoc = await db.collection("devices").doc(deviceId).get();
    const deviceData = deviceDoc.data();

    console.log(deviceData);
    res.status(200).send({ deviceData });
  } catch (error) {
    console.log("Error retreive device info: ", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  registerDevice,
  getDeviceInfo,
};
