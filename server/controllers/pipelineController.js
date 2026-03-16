const Pipeline = require("../models/pipelineModel");
const catchAsync = require("../utils/catchAsync");

exports.createEstimate = catchAsync(async (req, res, next) => {
  const { vehicle_id, assigned_mechanic_id, items } = req.body;

  const branch_id =
    req.user.role === "Admin" && req.body.branch_id
      ? req.body.branch_id
      : req.user.branch_id;
  if (!branch_id)
    return res
      .status(400)
      .json({ error: "Branch ID is required to create an estimate." });

  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ error: "Cannot create an estimate without items." });
  }

  const invalidItem = items.find(
    (item) => item.quantity <= 0 || item.unit_price < 0,
  );
  if (invalidItem) {
    return res
      .status(400)
      .json({
        error: "Item quantities must be > 0, and prices cannot be negative.",
      });
  }

  const newJob = await Pipeline.createEstimate(
    vehicle_id,
    branch_id,
    assigned_mechanic_id,
    items,
  );
  res
    .status(201)
    .json({
      message: "Estimate created successfully. No stock affected.",
      job: newJob,
    });
});

exports.advanceStage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { target_stage } = req.body;

  let updatedJob;
  if (target_stage === "Sales Order") {
    updatedJob = await Pipeline.convertToSalesOrder(id);
    return res
      .status(200)
      .json({
        message: "Converted to Sales Order. Stock reserved.",
        job: updatedJob,
      });
  } else if (target_stage === "Invoice") {
    updatedJob = await Pipeline.convertToInvoice(id);
    return res
      .status(200)
      .json({
        message: "Job Invoiced. Stock permanently deducted.",
        job: updatedJob,
      });
  } else {
    return res.status(400).json({ error: "Invalid target stage." });
  }
});

exports.getJobs = catchAsync(async (req, res, next) => {
  const { branch_id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
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
});

exports.updateStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const updatedJob = await Pipeline.updateJobStatus(id, status);
  res.status(200).json({ message: "Kanban status updated.", job: updatedJob });
});

exports.cancelServiceJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const cancelledJob = await Pipeline.cancelJob(id);

  if (!cancelledJob)
    return res
      .status(404)
      .json({ error: "Job not found or could not be cancelled." });

  res
    .status(200)
    .json({
      message:
        "Job cancelled. If parts were reserved, they have been released.",
      job: cancelledJob,
    });
});
