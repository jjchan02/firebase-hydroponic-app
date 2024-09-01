const { db, admin } = require(".././firebase");

const getFarmByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User email is required" });
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const farmList = userData.farmList || [];

    if (farmList.length === 0) {
      return res.status(200).json([]);
    } else {
      const farms = [];
      for (const farmId of farmList) {
        const farmRef = db.collection("farms").doc(farmId);
        const farmDoc = await farmRef.get();
        if (farmDoc.exists) {
          farms.push({ id: farmDoc.id, ...farmDoc.data() });
        }
      }
      res.status(200).json(farms);
    }
  } catch (error) {
    console.error("Error fetching farm:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addFarm = async (req, res) => {
  const { userId, name, location, createdAt } = req.body;

  if (!userId || !name || !location || !createdAt) {
    return res.status(400).send("All fields are required.");
  }

  try {
    // Create new farm object
    const newFarm = {
      name,
      location,
      createdAt: new Date(createdAt),
      sectorList: [],
    };

    // Add the new farm to Firestore
    const farmRef = await db.collection("farms").add(newFarm);
    const farmId = farmRef.id;

    // Add the farm ID to the user's farmList
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      farmList: admin.firestore.FieldValue.arrayUnion(farmId),
    });

    res.status(200).send({ id: farmId, ...newFarm, sectorList: [] });
  } catch (error) {
    console.error("Error adding farm:", error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteFarm = async (req, res) => {
  const { farmId } = req.params;
  const { userId } = req.query;
  console.log(userId);

  try {
    // Get the farm document
    const farmDoc = await db.collection("farms").doc(farmId).get();
    if (!farmDoc.exists) {
      return res.status(404).send("Farm not found.");
    }

    // Get farm data
    const farmData = farmDoc.data();

    // Delete the farm document
    await db.collection("farms").doc(farmId).delete();

    // Remove the farm ID from the user's farmList
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      farmList: admin.firestore.FieldValue.arrayRemove(farmId),
    });

    // Delete associated sector documents
    const sectorList = farmData.sectorList || [];
    const batch = db.batch();
    sectorList.forEach((sectorId) => {
      const sectorRef = db.collection("sectors").doc(sectorId);
      batch.delete(sectorRef);
    });
    await batch.commit();

    res.status(200).send("Farm deleted successfully.");
  } catch (error) {
    console.error("Error deleting farm:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getFarmByUserId,
  addFarm,
  deleteFarm,
};
