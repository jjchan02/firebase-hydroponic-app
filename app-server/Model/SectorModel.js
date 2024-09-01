const { db, admin } = require("../firebase");
const moment = require("moment-timezone");

const convertToMYT = (utcTimeInMs) => {
  return moment(utcTimeInMs).tz("Asia/Kuala_Lumpur").format();
};

const getParameterSettings = async (sectorId) => {
  try {
    if (!sectorId) {
      throw new Error("Sector ID is required");
    }

    const sectorDoc = await db.collection("sectors").doc(sectorId).get();
    if (!sectorDoc.exists) {
      throw new Error("Sector document not found");
    }

    const sectorData = sectorDoc.data();
    const parameterSettings = sectorData.parameterSettings || {};

    // console.log(parameterSettings);
    return parameterSettings;
  } catch (error) {
    console.error("Error fetching sector settings:", error);
    throw error;
  }
};

const getParameterData = async (sectorId, selectedInterval, date, month) => {
  if (!sectorId || !selectedInterval) {
    throw new Error("Sector ID or selected interval is required");
  }

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    // const timestamp = new Date();
    // const dayDocId = timestamp.toISOString().split("T")[0]; // YYYY-MM-DD format
    // const monthDocId = timestamp.toISOString().slice(0, 7); // YYYY-MM format
    // const monthRef = sectorRef.collection(monthDocId);
    let parameterData = {};

    if (selectedInterval === "daily") {
      const dayDocId = date.split("T")[0]; // YYYY-MM-DD format
      const monthCollection = date.slice(0, 7);
      const dayRef = sectorRef.collection(monthCollection).doc(dayDocId);
      const daySnapshot = await dayRef.get();
      if (daySnapshot.exists) {
        parameterData = daySnapshot.data();
      }
    } else if (selectedInterval === "monthly") {
      const monthRef = sectorRef.collection(month);
      const monthSnapshot = await monthRef.get();
      if (!monthSnapshot.empty) {
        monthSnapshot.forEach((doc) => {
          const docData = doc.data();
          Object.keys(docData).forEach((parameter) => {
            if (!parameterData[parameter]) {
              parameterData[parameter] = [];
            }
            parameterData[parameter].push(...docData[parameter]);
          });
        });
      }
    }
    return parameterData;
  } catch (error) {
    console.error("Error fetching parameter data:", error);
    throw error;
  }
};

const retrieveLatestData = async (sectorId, maxDataPoints = 100) => {
  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const todayTimestamp = convertToMYT(new Date()).split("+")[0];
    const todayDocId = todayTimestamp.split("T")[0]; // YYYY-MM-DD format

    let processedData = {};
    const getPreviousDay = (date) => {
      const prevDay = new Date(date);
      prevDay.setDate(prevDay.getDate() - 1);
      return prevDay.toISOString().split("T")[0];
    };

    let currentDay = todayDocId;
    let completed = false;

    while (!completed) {
      const month = currentDay.slice(0, 7); // YYYY-MM format
      const dayRef = sectorRef.collection(month).doc(currentDay);
      const docSnapshot = await dayRef.get();

      if (docSnapshot.exists) {
        const data = docSnapshot.data();

        // Loop through each parameter in the document
        for (const parameter in data) {
          if (data.hasOwnProperty(parameter)) {
            if (!processedData[parameter]) {
              processedData[parameter] = [];
            }

            const parameterDataPoints = data[parameter].length;
            const remainingDataPoints =
              maxDataPoints - processedData[parameter].length;

            if (parameterDataPoints > remainingDataPoints) {
              processedData[parameter] = data[parameter]
                .slice(-remainingDataPoints)
                .concat(processedData[parameter]);
            } else {
              processedData[parameter] = data[parameter].concat(
                processedData[parameter]
              );
            }

            // Check if this parameter has enough data points now
            if (processedData[parameter].length >= maxDataPoints) {
              completed = Object.keys(processedData).every(
                (key) => processedData[key].length >= maxDataPoints
              );
            }
          }
        }
      }

      // Move to the previous day
      if (!completed) {
        currentDay = getPreviousDay(currentDay);
        // console.log(currentDay);
      }
    }

    console.log(`processedData contains data points for each parameter.`);
    console.log(processedData);
    return processedData;
  } catch (error) {
    console.error("Error retrieving latest data:", error);
    return {};
  }
};

const getAnomaliesData = async (sectorId, selectedInterval, date, month) => {
  if (!sectorId || !selectedInterval) {
    throw new Error("Sector ID or selected interval is required");
  }

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const sectorDoc = await sectorRef.get();
    if (!sectorDoc.exists) {
      throw new Error("Sector document not found");
    }

    const anomalyList = sectorDoc.data().anomalyList || [];
    // const timestamp = convertToMYT(new Date());
    const anomalyData = [];

    if (selectedInterval === "daily") {
      //const currentDay = timestamp.split("T")[0]; // YYYY-MM-DD format
      const currentDay = date.split("T")[0]; // YYYY-MM-DD format
      for (const anomalyId of anomalyList) {
        const anomalyRef = db.collection("anomaliesCollection").doc(anomalyId);
        const anomalyDoc = await anomalyRef.get();
        if (anomalyDoc.exists) {
          const anomaly = anomalyDoc.data();
          const createdAt = anomaly.createdAt.split("T")[0]; // YYYY-MM-DD format

          if (createdAt === currentDay) {
            anomalyData.push(anomaly);
          }
        }
      }
    } else if (selectedInterval === "monthly") {
      // const currentMonth = timestamp.slice(0, 7); // YYYY-MM format

      for (const anomalyId of anomalyList) {
        const anomalyRef = db.collection("anomaliesCollection").doc(anomalyId);
        const anomalyDoc = await anomalyRef.get();
        if (anomalyDoc.exists) {
          const anomaly = anomalyDoc.data();
          const createdAt = anomaly.createdAt.slice(0, 7); // YYYY-MM format

          if (createdAt === month) {
            anomalyData.push(anomaly);
          }
        }
      }
    }
    // console.log(anomalyData);
    return anomalyData;
  } catch (error) {
    console.error("Error fetching anomaly data:", error);
    throw error;
  }
};

// Delete all subcollections recursively
const deleteSubcollections = async (parentRef) => {
  const subcollections = await parentRef.listCollections();

  for (const subcollection of subcollections) {
    const subcollectionDocs = await subcollection.get();
    const batch = db.batch();

    subcollectionDocs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    // Recursively delete sub-subcollections
    for (const doc of subcollectionDocs.docs) {
      await deleteSubcollections(doc.ref);
    }
  }
};

const deleteSector = async (farmId, sectorId) => {
  if (!farmId || !sectorId) {
    throw new Error("Farm ID and sector ID are required");
  }

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const sectorDoc = await sectorRef.get();

    if (!sectorDoc.exists) {
      throw new Error("Sector not found");
    }

    const sectorData = sectorDoc.data();
    // Delete subcollections recursively
    await deleteSubcollections(sectorRef);

    // Delete the sector document
    await sectorRef.delete();

    // Update the farm's sector list
    const farmRef = db.collection("farms").doc(farmId);
    await farmRef.update({
      sectorList: admin.firestore.FieldValue.arrayRemove(sectorId),
    });

    // Delete associated plants and anomalies
    const batch = db.batch();
    const plantList = sectorData.plantList || [];
    const anomalyList = sectorData.anomalyList || [];
    const deviceId = sectorData.device;

    plantList.forEach((plantId) => {
      const plantRef = db.collection("plants").doc(plantId);
      batch.delete(plantRef);
    });

    anomalyList.forEach((anomalyId) => {
      const anomalyRef = db.collection("anomaliesCollection").doc(anomalyId);
      batch.delete(anomalyRef);
    });

    // Update the linked device
    const deviceRef = db.collection("devices").doc(deviceId);
    await deviceRef.update({
      linkSector: null,
      linkUser: null,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting sector:", error);
    throw new Error("Error: ", error);
  }
};

module.exports = {
  getParameterSettings,
  getParameterData,
  retrieveLatestData,
  getAnomaliesData,
  deleteSubcollections,
  deleteSector,
};
