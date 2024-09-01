const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");

router.post("/register", userController.registerUser);
router.post("/updateEmail", userController.updateEmail);
router.get("/getUser", userController.getUser);
router.post("/updateUserSettings", userController.updateUserSettings);
router.post("/checkToken", userController.checkAndUpdateToken);
router.post("/checkEmail", userController.checkEmail);

module.exports = router;
