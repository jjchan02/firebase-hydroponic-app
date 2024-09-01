const { db, admin } = require("../firebase");
const { updateLatestData } = require("../webhookService");
const sectorModel = require("../Model/SectorModel");
const messagingService = require("../messagingService");
const moment = require("moment-timezone");

const convertToMYT = (utcTimeInMs) => {
  return moment(utcTimeInMs).tz("Asia/Kuala_Lumpur").format();
};

const getLatestData = async (req, res) => {
  const { sectorId } = req.params;

  if (!sectorId) {
    return res.status(400).json({ error: "Sector ID is required" });
  }

  try {
    const sectorDoc = await db.collection("sectors").doc(sectorId).get();
    if (!sectorDoc.exists) {
      return res.sendStatus(404);
    }

    const sectorData = sectorDoc.data();
    const latestData = sectorData.latestData || {};

    res.status(200).send({ latestData });
  } catch (error) {
    console.error("Error fetching sector details:", error);
    res.sendStatus(500);
  }
};

const updateParameterSettings = async (req, res) => {
  const { sectorId, parameterSettings } = req.body;

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const doc = await sectorRef.get();

    if (!doc.exists) {
      return res.status(404).send("Sector not found");
    }

    const existingSettings = doc.data().parameterSettings || {};
    const updatedSettings = { ...existingSettings, ...parameterSettings };

    await sectorRef.update({
      parameterSettings: updatedSettings,
    });

    res.status(200).send("Update Successful");
  } catch (error) {
    console.error("Error updating parameter data:", error);
    res.sendStatus(500);
  }
};

const getSectorList = async (req, res) => {
  const { farmId } = req.params;

  if (!farmId) {
    return res.status(400).json({ error: "Farm ID is required" });
  }

  try {
    const farmRef = db.collection("farms").doc(farmId);
    const farmDoc = await farmRef.get();

    if (!farmDoc.exists) {
      return res.status(404).json({ error: "Farm not found" });
    }

    const farmData = farmDoc.data();
    const sectorList = farmData.sectorList || [];

    if (sectorList.length === 0) {
      return res.status(200).json([]);
    } else {
      const sectors = [];
      for (const sectorId of sectorList) {
        const sectorRef = db.collection("sectors").doc(sectorId);
        const sectorDoc = await sectorRef.get();
        if (sectorDoc.exists) {
          sectors.push({ id: sectorDoc.id, ...sectorDoc.data() });
        }
      }
      res.status(200).json(sectors);
    }
  } catch (error) {
    console.error("Error fetching sector list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addSector = async (req, res) => {
  const { farmId, deviceId, userId } = req.body;

  if (!farmId || !deviceId || !userId) {
    return res
      .status(400)
      .send("Farm ID, Device ID, and User ID are required!");
  }

  try {
    const farmRef = db.collection("farms").doc(farmId);

    // Define the default parameter settings
    const ranges = {
      surroundingTemperature: [20, 30],
      surroundingHumidity: [40, 60],
      solutionTemperature: [18, 22],
      lightIntensity: [200, 800],
      tds: [0, 1200],
      pH: [6, 7],
      foggerTemperature: [19, 29],
      foggerHumidity: [41, 61],
    };

    // Initialize parameter data structure
    const parameterData = {
      surroundingTemperature: [],
      surroundingHumidity: [],
      solutionTemperature: [],
      lightIntensity: [],
      tds: [],
      pH: [],
      foggerTemperature: [],
      foggerHumidity: [],
    };

    const triggerSwitch = {
      lowTdsTrigger: false,
      highTdsTrigger: false,
      lowPhTrigger: false,
      highTdsTrigger: false,
      foggerTrigger: false,
    };

    const newSector = {
      createdAt: new Date(),
      plantList: [],
      parameterSettings: ranges,
      latestData: parameterData,
      device: deviceId,
      triggerSettings: triggerSwitch,
    };

    const sectorRef = await db.collection("sectors").add(newSector);
    const sectorId = sectorRef.id;

    const deviceRef = db.collection("devices").doc(deviceId);
    const deviceDoc = await deviceRef.get();

    if (!deviceDoc.exists) {
      return res.status(400).send("Device not found!");
    }

    const deviceData = deviceDoc.data();

    if (deviceData.linkSector || deviceData.linkUser) {
      return res.status(400).send("Device already linked to a sector or user!");
    }

    await deviceRef.update({
      linkSector: sectorId,
      linkUser: userId,
    });

    await farmRef.update({
      sectorList: admin.firestore.FieldValue.arrayUnion(sectorId),
    });

    res.status(200).send({ sectorId });
  } catch (error) {
    console.error("Error adding sector:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updateParameterData = async (req, res) => {
  const { userId, sectorId, parameters } = req.body;
  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const timestamp = convertToMYT(new Date()).split("+")[0];
    const dayDocId = timestamp.split("T")[0]; // YYYY-MM-DD format
    const monthDocId = timestamp.slice(0, 7); // YYYY-MM format

    const dayRef = sectorRef.collection(monthDocId).doc(dayDocId);

    // Send to anomaly detection server and return the predicted parameters
    const { mappedPredictions, anomalyStatus } = await updateLatestData(
      userId,
      sectorId
    );
    console.log("Mapped Predictions:", mappedPredictions);

    const updates = {};
    const latestUpdates = {
      lastUpdate: timestamp,
      status: "online", // Mark sector as online when data is updated
    };

    for (const parameter in parameters) {
      const value = parameters[parameter];
      const prediction = mappedPredictions[parameter];

      // Check if prediction is defined
      if (prediction !== undefined) {
        updates[`${parameter}`] = admin.firestore.FieldValue.arrayUnion({
          timestamp,
          value,
          prediction,
          anomalyStatus,
        });
      } else {
        console.warn(`No prediction found for parameter: ${parameter}`);
        updates[`${parameter}`] = admin.firestore.FieldValue.arrayUnion({
          timestamp,
          value,
          prediction: null, // Use null if prediction is undefined
          anomalyStatus,
        });
      }

      latestUpdates[`latestData.${parameter}`] = {
        timestamp,
        value,
      };
    }

    // Perform batch update
    const batch = db.batch();
    batch.set(dayRef, updates, { merge: true });
    batch.update(sectorRef, latestUpdates);

    await batch.commit();

    res.status(200).send("Update Successful");
  } catch (error) {
    console.error("Error updating parameter data:", error);
    res.sendStatus(500);
  }
};

const handledeleteSector = async (req, res) => {
  const { farmId, sectorId } = req.query;

  if (!farmId || !sectorId) {
    return res.status(400).json({ error: "Sector ID or farm ID is required" });
  }

  try {
    await sectorModel.deleteSector(farmId, sectorId);
    res.status(200).send("Sector deleted successfully.");
  } catch (error) {
    console.error("Error deleting sector:", error);
    res.status(500).send("Internal Server Error");
  }
};

const handleGetParameterData = async (req, res) => {
  const { sectorId, selectedInterval, date, month } = req.body;

  if (!sectorId || !selectedInterval) {
    return res
      .status(400)
      .json({ error: "Sector ID or Selected Interval is required" });
  }

  try {
    const parameterData = await sectorModel.getParameterData(
      sectorId,
      selectedInterval,
      date,
      month
    );
    res.status(200).send({ parameterData });
  } catch (error) {
    console.error("Error fetching parameter data:", error);
    res.sendStatus(500);
  }
};

const handleGetParameterSettings = async (req, res) => {
  const { sectorId } = req.params;

  try {
    const parameterSettings = await sectorModel.getParameterSettings(sectorId);
    res.status(200).json({ parameterSettings });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Failed to fetch parameter settings" });
  }
};

const handleGetAnomalyData = async (req, res) => {
  const { sectorId, selectedInterval, date, month } = req.body;

  if (!sectorId || !selectedInterval) {
    return res
      .status(400)
      .json({ error: "Sector ID or Selected Interval is required" });
  }

  try {
    const anomalyData = await sectorModel.getAnomaliesData(
      sectorId,
      selectedInterval,
      date,
      month
    );
    res.status(200).json({ anomalyData });
  } catch (error) {
    console.error("Error fetching anomaly data:", error);
    res.sendStatus(500);
  }
};

const getTriggerSettings = async (req, res) => {
  const { sectorId } = req.params;

  try {
    const sectorDoc = await db.collection("sectors").doc(sectorId).get();
    if (!sectorDoc) {
      console.log("Sector not exists");
      res.status(400).send("Sector not exists");
    }
    const sectorData = sectorDoc.data();
    const triggerSettings = sectorData.triggerSettings;
    res.status(200).json({ triggerSettings });
  } catch (error) {
    res.status(500).send("Internal Server Error: ", error);
  }
};

const updateTriggerSettings = async (req, res) => {
  const { sectorId, triggerSettings } = req.body;

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const doc = await sectorRef.get();

    if (!doc.exists) {
      return res.status(404).send("Sector not found");
    }

    const existingSettings = doc.data().triggerSettings || {};
    const updatedSettings = { ...existingSettings, ...triggerSettings };

    await sectorRef.update({
      triggerSettings: updatedSettings,
    });

    res.status(200).send("Update Successful");
  } catch (error) {
    console.error("Error updating parameter data:", error);
    res.sendStatus(500);
  }
};

const postTriggerResult = async (req, res) => {
  const { userId } = req.params;
  const { triggerType, status, details } = req.body;
  const timestamp = new Date();

  try {
    messagingService.saveNotification(
      userId,
      `Trigger Result for ${triggerType}`,
      `Status: ${status}\nDetails: ${details}`,
      timestamp,
      "normal"
    );
    res.status(200).json({ message: "Execution result recorded" });
  } catch (error) {
    console.error("Error recording execution result:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDataForExport = async (req, res) => {
  const { sectorId, year, month, day } = req.body;

  // Ensure month and day are two digits
  const formattedMonth = month.toString().padStart(2, "0");
  const formattedDay = day.toString().padStart(2, "0");

  // Construct document IDs
  const dayDocId = `${year}-${formattedMonth}-${formattedDay}`; // YYYY-MM-DD format
  const monthDocId = `${year}-${formattedMonth}`; // YYYY-MM format

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);

    // Reference to the day document
    const dayRef = sectorRef.collection(monthDocId).doc(dayDocId);

    const dayDoc = await dayRef.get();

    if (!dayDoc.exists) {
      // If day document does not exist
      return res
        .status(404)
        .json({ error: "Data for the selected day does not exist" });
    }

    // Return day-level data
    res.json(dayDoc.data());
  } catch (error) {
    console.error("Error fetching data for export:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getSectorStatus = async (req, res) => {
  const { sectorId } = req.params;

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const sectorDoc = await sectorRef.get();

    if (!sectorDoc.exists) {
      return res.status(404).send("Sector not found");
    }

    const sectorData = sectorDoc.data();
    const lastUpdate = sectorData.lastUpdate;
    const status = sectorData.status || "offline";

    res.json({ lastUpdate, status });
  } catch (error) {
    console.error("Error retrieving sector status:", error);
    res.sendStatus(500);
  }
};

module.exports = {
  getLatestData,
  handleGetParameterSettings,
  handleGetParameterData,
  handleGetAnomalyData,
  updateParameterSettings,
  getSectorList,
  addSector,
  handledeleteSector,
  updateParameterData,
  getTriggerSettings,
  updateTriggerSettings,
  postTriggerResult,
  getDataForExport,
  getSectorStatus,
};
