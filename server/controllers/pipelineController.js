const Pipeline = require("../models/pipelineModel");

//Create a Draft Estimate
exports.createEstimate = async (req, res) => {
  try {
    const { vehicle_id, assigned_mechanic_id, items } = req.body;

    // Fix: Allow Admin to specify branch; force Staff to use their locked branch.
    const branch_id =
      req.user.role === "Admin" && req.body.branch_id
        ? req.body.branch_id
        : req.user.branch_id;

    if (!branch_id) {
      return res
        .status(400)
        .json({ error: "Branch ID is required to create an estimate." });
    }

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Cannot create an estimate without items." });
    }

    // Fix: Input Validation to prevent negative stock inputs
    const invalidItem = items.find(
      (item) => item.quantity <= 0 || item.unit_price < 0,
    );
    if (invalidItem) {
      return res
        .status(400)
        .json({
          error:
            "Item quantities must be greater than zero, and prices cannot be negative.",
        });
    }

    const newJob = await Pipeline.createEstimate(
      vehicle_id,
      branch_id,
      assigned_mechanic_id,
      items,
    );
    res.status(201).json({
      message: "Estimate created successfully. No stock affected.",
      job: newJob,
    });
  } catch (err) {
    console.error("Create Estimate Error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error." });
  }
};

//To Sales Order or Invoice
exports.advanceStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { target_stage } = req.body; // 'Sales Order' or 'Invoice'

    let updatedJob;
    if (target_stage === "Sales Order") {
      updatedJob = await Pipeline.convertToSalesOrder(id);
      return res.status(200).json({
        message: "Converted to Sales Order. Stock reserved.",
        job: updatedJob,
      });
    } else if (target_stage === "Invoice") {
      updatedJob = await Pipeline.convertToInvoice(id);
      return res.status(200).json({
        message: "Job Invoiced. Stock permanently deducted.",
        job: updatedJob,
      });
    } else {
      return res.status(400).json({ error: "Invalid target stage." });
    }
  } catch (err) {
    console.error("Advance Stage Error:", err.message);
    // Modified to return the specific DB error if stock reservation fails
    res
      .status(500)
      .json({
        error: err.message || "Internal server error during stage transition.",
      });
  }
};

//Get Jobs for the Kanban Board
exports.getJobs = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const jobs = await Pipeline.getBranchJobs(branch_id);
    res.status(200).json(jobs);
  } catch (err) {
    console.error("Get Jobs Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

//Update Kanban Status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Ongoing', 'Cleaning', 'Done'

    const updatedJob = await Pipeline.updateJobStatus(id, status);
    res
      .status(200)
      .json({ message: "Kanban status updated.", job: updatedJob });
  } catch (err) {
    console.error("Update Status Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};
