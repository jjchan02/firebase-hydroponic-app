const express = require("express");
const router = express.Router();
const sectorController = require("../controllers/SectorController");

router.get("/getLatestData/:sectorId", sectorController.getLatestData);
router.get("/getSector/:farmId", sectorController.getSectorList);
router.post("/addSector", sectorController.addSector);
router.post("/updateData", sectorController.updateParameterData);
router.post(
  "/updateParameterSettings",
  sectorController.updateParameterSettings
);
router.get(
  "/getTriggerSettings/:sectorId",
  sectorController.getTriggerSettings
);
router.post("/updateTriggerSettings", sectorController.updateTriggerSettings);
router.post("/triggerResult/:userId", sectorController.postTriggerResult);
router.post("/getDataForExport", sectorController.getDataForExport);
router.get("/getStatus/:sectorId", sectorController.getSectorStatus);

// refine structure
router.get(
  "/getParameterSettings/:sectorId",
  sectorController.handleGetParameterSettings
);
router.post("/getParameterData", sectorController.handleGetParameterData);
router.post("/getAnomaliesData", sectorController.handleGetAnomalyData);
router.delete("/deleteSector", sectorController.handledeleteSector);

module.exports = router;
