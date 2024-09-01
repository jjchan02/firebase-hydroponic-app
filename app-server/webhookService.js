const axios = require("axios");
const { db, admin } = require("./firebase");
const sectorModel = require("./Model/SectorModel");
const moment = require("moment-timezone");

const convertToMYT = (utcTimeInMs) => {
  return moment(utcTimeInMs).tz("Asia/Kuala_Lumpur").format();
};

const parameterKeys = [
  "surroundingTemperature",
  "surroundingHumidity",
  "solutionTemperature",
  "pH",
  "tds",
  "lightIntensity",
  "foggerTemperature",
  "foggerHumidity",
  "foggerTrigger",
  "lowTdsTrigger",
  "highTdsTrigger",
  "lowPhTrigger",
  "highPhTrigger",
];

const sendDataForPredict = async (latestData) => {
  try {
    if (!latestData) {
      throw new Error("latestData is undefined or null");
    }

    console.log("Sending data to Python");
    const response = await axios.post(
      "http://127.0.0.1:5000/predict-triggers",
      { latestData },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Data sent successfully");
    console.log(response.data);
    return response.data.trigger_status;
  } catch (error) {
    console.error(
      "Error sending data to Python script:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

const sendDataToPython = async (latestData) => {
  try {
    if (!latestData) {
      throw new Error("latestData is undefined or null");
    }

    console.log("Sending data to Python");
    const response = await axios.post(
      "http://127.0.0.1:5000/receive-data",
      { latestData },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Data sent successfully");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending data to Python script:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

const storeAnomalies = async (userId, sectorId, summary) => {
  const timestamp = convertToMYT(new Date());
  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    // send alert notification
    await axios.post("http://localhost:3000/message/sendAlert", {
      userId,
      sectorId,
    });
    const anomaliesRec = {
      createdAt: timestamp,
      anomaliesSummary: summary,
      sectorId: sectorId,
    };

    // Add the anomaly record to the anomaliesCollection
    const anomalyRef = await db
      .collection("anomaliesCollection")
      .add(anomaliesRec);
    const anomalyId = anomalyRef.id;

    // Update the sector document with the new anomaly ID
    await sectorRef.update({
      anomalyList: admin.firestore.FieldValue.arrayUnion(anomalyId),
    });

    console.log(`Anomalies stored successfully: ${anomalyId}`);
  } catch (error) {
    console.log("Error storing anomalies: ", error);
    throw error;
  }
};

const updateLatestData = async (userId, sectorId) => {
  try {
    let anomalyStatus = false;
    if (!sectorId) {
      throw new Error("Sector ID is missing");
    }

    const sectorDoc = await db.collection("sectors").doc(sectorId).get();
    let roundedPredictions = parameterKeys.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});

    if (!sectorDoc.exists) {
      throw new Error("Sector document does not exist");
    }

    const sectorData = sectorDoc.data();
    const sectorCreatedAt = sectorData.createdAt.toDate();
    const initPeriod = new Date(sectorCreatedAt);
    initPeriod.setDate(initPeriod.getDate() + 1);

    const currentDate = new Date();
    if (currentDate < initPeriod) {
      console.log(roundedPredictions);
      return { mappedPredictions: roundedPredictions, anomalyStatus };
    }

    console.log(
      "Sector document exists and has sufficient data, sending data to Python"
    );

    const parameterData = await sectorModel.retrieveLatestData(sectorId);

    // Call sendDataToPython to send data and parameterSettings
    const response = await sendDataToPython(parameterData);
    const triggerStatus = await sendDataForPredict(parameterData);

    // Store anomalies if detected is true
    if (response.summary.detected === true) {
      await storeAnomalies(userId, sectorId, response.summary);
      anomalyStatus = true;
      // console.log("Anomaly detected");
    } else {
      console.log("No anomaly detected");
    }

    // Get the last key in response.predictions
    const lastPredictionKey = Object.keys(response.predictions).pop();
    const predictionArray = response.predictions[lastPredictionKey];

    // Ensure predictionArray length matches parameterKeys length
    if (predictionArray.length !== parameterKeys.length) {
      throw new Error(
        "Prediction array length does not match parameter keys length"
      );
    }

    // Map predictions to respective parameters
    const mappedPredictions = parameterKeys.reduce((acc, key, index) => {
      acc[key] = predictionArray[index];
      return acc;
    }, {});

    // Round the predictions to suitable precision
    roundedPredictions = {
      surroundingTemperature:
        Math.round(mappedPredictions.surroundingTemperature * 100) / 100,
      surroundingHumidity:
        Math.round(mappedPredictions.surroundingHumidity * 100) / 100,
      solutionTemperature:
        Math.round(mappedPredictions.solutionTemperature * 100) / 100,
      pH: Math.round(mappedPredictions.pH * 100) / 100,
      tds: Math.round(mappedPredictions.tds),
      lightIntensity: Math.round(mappedPredictions.lightIntensity),
      foggerTemperature:
        Math.round(mappedPredictions.foggerTemperature * 100) / 100,
      foggerHumidity: Math.round(mappedPredictions.foggerHumidity * 100) / 100,
      foggerTrigger: mappedPredictions.foggerTrigger,
      lowTdsTrigger: mappedPredictions.lowTdsTrigger,
      highTdsTrigger: mappedPredictions.highTdsTrigger,
      lowPhTrigger: mappedPredictions.lowPhTrigger,
      highPhTrigger: mappedPredictions.highPhTrigger,
    };

    // Fetch the current trigger settings
    let currentTriggerSettings = {};
    try {
      const triggerSettingsResponse = await axios.get(
        `http://localhost:3000/sector/getTriggerSettings/${sectorId}`
      );
      currentTriggerSettings = triggerSettingsResponse.data.triggerSettings;
    } catch (error) {
      console.error("Error fetching trigger settings:", error);
    }

    // Compare with the new trigger status
    const newTriggerSettings = {};
    Object.keys(triggerStatus).forEach((triggerName) => {
      if (triggerStatus[triggerName]) {
        newTriggerSettings[triggerName] = true;
      } else {
        newTriggerSettings[triggerName] = false;
      }
    });

    // Check if the current settings differ from the new trigger settings
    const settingsChanged =
      JSON.stringify(currentTriggerSettings) !==
      JSON.stringify(newTriggerSettings);

    if (settingsChanged) {
      try {
        await axios.post("http://localhost:3000/sector/updateTriggerSettings", {
          sectorId,
          triggerSettings: newTriggerSettings,
        });
        console.log("Trigger settings updated");
      } catch (error) {
        console.error("Error updating trigger settings:", error);
      }
    } else {
      console.log("No changes in trigger settings");
    }

    return { mappedPredictions: roundedPredictions, anomalyStatus };
  } catch (error) {
    console.error("Error updating latest data:", error);
    throw error;
  }
};

module.exports = {
  updateLatestData,
};
