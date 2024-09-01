const { db, storage, admin } = require("../firebase");
const { FieldValue } = require("firebase-admin/firestore");

const getPlants = async (req, res) => {
  const { sectorId } = req.query;

  try {
    const sectorRef = db.collection("sectors").doc(sectorId);
    const sectorDoc = await sectorRef.get();

    if (!sectorDoc.exists) {
      console.error("Sector not found");
      return res.status(400).send("Sector not found");
    }

    const sectorData = sectorDoc.data();
    const plantList = sectorData.plantList || [];

    console.log(`Plant list for sector ${sectorId}:`, plantList);

    if (plantList.length === 0) {
      console.log("No plants found in sector");
      return res.status(200).json([]);
    } else {
      const plants = [];
      for (const plantId of plantList) {
        console.log(`Fetching plant document for ID: ${plantId}`);
        const plantRef = db.collection("plant").doc(plantId);
        const plantDoc = await plantRef.get();
        if (plantDoc.exists) {
          const plantData = { id: plantDoc.id, ...plantDoc.data() };
          plants.push(plantData);
          // console.log(`Plant added: ${JSON.stringify(plantData)}`);
        } else {
          // console.log(`Plant document not found for ID: ${plantId}`);
        }
      }
      // console.log("Final plant list:", plants);
      res.status(200).json(plants);
    }
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addPlant = async (req, res) => {
  const { name, status } = req.body;
  const { sectorId } = req.params;
  const file = req.file;

  if (!name || !status || !file) {
    return res.status(400).send("Name, status, and image are required.");
  }

  try {
    // Upload image to Firebase Storage
    const storageRef = storage.bucket().file(`sectors/${sectorId}_${name}`);
    await storageRef.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    // Get the download URL of the uploaded image
    const downloadURL = await storageRef.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // Set expiration date as needed
    });

    // Save plant data to Firestore
    const newPlant = {
      name,
      status,
      sectorId,
      imageUrl: downloadURL[0],
      lastUpdate: FieldValue.serverTimestamp(),
      records: [],
      importantDates: [],
    };
    const plantRef = await db.collection("plant").add(newPlant);
    const plantId = plantRef.id;

    // Add the plantId to the sector's plantList
    const sectorRef = await db.collection("sectors").doc(sectorId);
    await sectorRef.update({
      plantList: admin.firestore.FieldValue.arrayUnion(plantId),
    });

    res.status(200).send({ message: "Plant added successfully" });
  } catch (error) {
    console.error("Error adding plant:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getPlantByName = async (req, res) => {
  const { plantId } = req.params;
  try {
    const plantRef = db.collection("plant").doc(plantId);
    const doc = await plantRef.get();
    if (!doc.exists) {
      return res.status(404).send("Plant not found");
    }
    res.status(200).send(doc.data());
  } catch (error) {
    console.error("Error fetching plant:", error);
    res.status(500).send("Internal Server Error");
  }
};

const deletePlant = async (req, res) => {
  const { plantId, sectorId } = req.query;
  try {
    // Get the plant document
    const plantRef = db.collection("plant").doc(plantId);
    const doc = await plantRef.get();
    if (!doc.exists) {
      return res.status(404).send("Plant not found");
    }

    const plantData = doc.data();

    // Delete the image from Firebase Storage
    const storageRef = storage
      .bucket()
      .file(`sectors/${sectorId}_${plantData.name}`);
    await storageRef.delete();

    // Delete the plant document
    await plantRef.delete();

    // Update the sector's plant list
    const sectorRef = db.collection("sectors").doc(sectorId);
    await sectorRef.update({
      plantList: admin.firestore.FieldValue.arrayRemove(plantId),
    });

    res.status(200).send({ message: "Plant deleted successfully" });
  } catch (error) {
    console.error("Error deleting plant:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updatePlant = async (req, res) => {
  const { plantId } = req.params;
  const { status, imageUrl, records, importantDates } = req.body;
  const currentDate = new Date();

  try {
    const plantRef = db.collection("plant").doc(plantId);
    const doc = await plantRef.get();
    if (!doc.exists) {
      return res.status(404).send("Plant not found");
    }

    const plantData = doc.data();
    plantData.status = status;
    plantData.imageUrl = imageUrl;
    plantData.lastUpdate = FieldValue.serverTimestamp();
    plantData.records = records.map((record) => ({
      ...record,
      date: currentDate,
    }));
    plantData.importantDates = importantDates;

    await plantRef.set(plantData);

    res.status(200).send({ message: "Plant updated successfully" });
  } catch (error) {
    console.error("Error updating plant:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addRecord = async (req, res) => {
  const { plantId } = req.params;
  const { observation, measurement } = req.body;
  const currentDate = new Date();

  try {
    const plantRef = db.collection("plant").doc(plantId);
    const doc = await plantRef.get();
    if (!doc.exists) {
      return res.status(404).send("Plant not found");
    }

    const plantData = doc.data();

    // Initialize records array if it doesn't exist
    if (!plantData.records) {
      plantData.records = [];
    }

    plantData.records.push({
      date: currentDate,
      observation,
      measurement,
    });

    plantData.lastUpdate = FieldValue.serverTimestamp();

    await plantRef.set(plantData);

    res.status(200).send({ message: "Record added successfully" });
  } catch (error) {
    console.error("Error adding record:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addImportantDate = async (req, res) => {
  const { plantId } = req.params;
  const { date, note } = req.body;

  try {
    const plantRef = db.collection("plant").doc(plantId);
    const doc = await plantRef.get();
    if (!doc.exists) {
      return res.status(404).send("Plant not found");
    }

    const plantData = doc.data();

    // Initialize importantDates array if it doesn't exist
    if (!plantData.importantDates) {
      plantData.importantDates = [];
    }

    plantData.importantDates.push({ date, note });
    plantData.lastUpdate = FieldValue.serverTimestamp();

    await plantRef.set(plantData);

    res.status(200).send({ message: "Important date added successfully" });
  } catch (error) {
    console.error("Error adding important date:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getPlants,
  addPlant,
  getPlantByName,
  deletePlant,
  updatePlant,
  addRecord,
  addImportantDate,
};
