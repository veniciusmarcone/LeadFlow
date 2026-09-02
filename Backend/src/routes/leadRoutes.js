const express = require("express");

const router = express.Router();

const leadController = require("../controllers/leadController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// TODAS AS ROTAS DE LEADS EXIGEM LOGIN
router.use(authMiddleware);

router.get("/", leadController.getLeads);

router.get("/:id/history", leadController.getLeadHistory);

router.get("/export", authMiddleware, leadController.exportLeadsCSV);

router.get("/:id", leadController.getLeadById);

router.post("/", leadController.createLead);

router.put("/:id", leadController.updateLead);

router.delete("/:id", adminMiddleware, leadController.deleteLead);

module.exports = router;