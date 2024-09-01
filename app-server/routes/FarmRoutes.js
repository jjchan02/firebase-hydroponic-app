const express = require("express");
const router = express.Router();
const farmController = require("../controllers/FarmController");

router.get("/getfarm/:userId", farmController.getFarmByUserId);
router.post("/addfarm", farmController.addFarm);
router.delete("/deletefarm/:farmId", farmController.deleteFarm);

module.exports = router;
