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
      return res.status(400).json({
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
    res.status(500).json({
      error: err.message || "Internal server error during stage transition.",
    });
  }
};

//Get Jobs for the Kanban Board
exports.getJobs = async (req, res) => {
  try {
    const { branch_id } = req.params;

    // Pagination logic
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20; // Default to 20 jobs for the board
    const offset = (page - 1) * limit;

    const jobsResult = await Pipeline.getBranchJobs(branch_id, limit, offset);

    res.status(200).json({
      message: "Branch jobs retrieved successfully.",
      data: jobsResult.data,
      pagination: {
        total_records: jobsResult.totalRecords,
        current_page: page,
        total_pages: Math.ceil(jobsResult.totalRecords / limit),
        per_page: limit,
      },
    });
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

//Cancel a job and release inventory
exports.cancelServiceJob = async (req, res) => {
  try {
    const { id } = req.params;
    const cancelledJob = await Pipeline.cancelJob(id);

    if (!cancelledJob) {
      return res
        .status(404)
        .json({ error: "Job not found or could not be cancelled." });
    }

    res.status(200).json({
      message:
        "Job cancelled. If parts were reserved, they have been released.",
      job: cancelledJob,
    });
  } catch (err) {
    console.error("Cancel Job Error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error." });
  }
};
