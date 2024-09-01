const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerConfig");
const plantsController = require("../controllers/PlantController");

router.get("/getplants", plantsController.getPlants);
router.post(
  "/addplant/:sectorId",
  upload.single("image"),
  plantsController.addPlant
);
router.get("/plants/:plantId", plantsController.getPlantByName);
router.delete("/deleteplant", plantsController.deletePlant);
router.put("/updateplant/:plantId", plantsController.updatePlant);
router.post("/plants/:plantId/records", plantsController.addRecord);
router.post(
  "/plants/:plantId/importantDates",
  plantsController.addImportantDate
);

module.exports = router;
