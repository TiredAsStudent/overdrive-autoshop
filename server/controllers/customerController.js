const CustomerPortal = require("../models/customerModel");

exports.fetchMyVehicles = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const vehicles = await CustomerPortal.getMyVehicles(customer_id);
    res.status(200).json(vehicles);
  } catch (err) {
    console.error("Fetch Vehicles Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.fetchLiveStatus = async (req, res) => {
  try {
    const customer_id = req.user.id;
    const activeJobs = await CustomerPortal.getActiveJobs(customer_id);
    res
      .status(200)
      .json({ message: "Live status retrieved.", jobs: activeJobs });
  } catch (err) {
    console.error("Fetch Live Status Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

//Fetch History
exports.fetchHistory = async (req, res) => {
  try {
    const customer_id = req.user.id;

    // Pagination math
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
  } catch (err) {
    console.error("Fetch History Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.fetchInvoiceDetails = async (req, res) => {
  try {
    const { job_id } = req.params;
    const customer_id = req.user.id;

    const invoice = await CustomerPortal.getInvoiceDetails(job_id, customer_id);

    if (!invoice) {
      return res
        .status(403)
        .json({ error: "Access denied or invoice not found." });
    }

    res.status(200).json(invoice);
  } catch (err) {
    console.error("Fetch Invoice Details Error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};
