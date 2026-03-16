const CustomerPortal = require("../models/customerModel");
const catchAsync = require("../utils/catchAsync");

exports.fetchMyVehicles = catchAsync(async (req, res, next) => {
  const customer_id = req.user.id;
  const vehicles = await CustomerPortal.getMyVehicles(customer_id);
  res.status(200).json(vehicles);
});

exports.fetchLiveStatus = catchAsync(async (req, res, next) => {
  const customer_id = req.user.id;
  const activeJobs = await CustomerPortal.getActiveJobs(customer_id);
  res.status(200).json({ message: "Live status retrieved.", jobs: activeJobs });
});

exports.fetchHistory = catchAsync(async (req, res, next) => {
  const customer_id = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const historyResult = await CustomerPortal.getServiceHistory(
    customer_id,
    limit,
    offset,
  );

  res.status(200).json({
    message: "Service history retrieved successfully.",
    data: historyResult.data,
    pagination: {
      total_records: historyResult.totalRecords,
      current_page: page,
      total_pages: Math.ceil(historyResult.totalRecords / limit),
      per_page: limit,
    },
  });
});

exports.fetchInvoiceDetails = catchAsync(async (req, res, next) => {
  const { job_id } = req.params;
  const customer_id = req.user.id;

  const invoice = await CustomerPortal.getInvoiceDetails(job_id, customer_id);

  if (!invoice) {
    return res
      .status(403)
      .json({ error: "Access denied or invoice not found." });
  }

  res.status(200).json(invoice);
});
