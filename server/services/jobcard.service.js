const JobCardModel = require("../models/JobCard");
const { logSecureAction } = require("../utils/auditLogger");

class JobCardService {
  static async getBranchBoard(branchId) {
    if (!branchId) throw new Error("Branch context missing.");
    return await JobCardModel.getActiveBoard(branchId);
  }

  static async verifyJobOwnership(jobId, branchId) {
    const job = await JobCardModel.findById(jobId);
    if (!job) throw new Error("Job Card not found.");
    if (job.branch_id !== branchId) {
      throw new Error(
        "Security Violation: Job card belongs to a different branch.",
      );
    }
    return job;
  }

  static async updateJobStatus(jobId, newStatus, staffUser, ipAddress) {
    const oldJob = await this.verifyJobOwnership(jobId, staffUser.branchId);

    if (oldJob.status === newStatus) return oldJob; // Prevent redundant updates

    const updatedJob = await JobCardModel.updateStatus(jobId, newStatus);

    // TODO: Future Billing Integration Hook
    // If newStatus === 'ONGOING', trigger SalesOrder generation & Inventory Reservation here
    // If newStatus === 'DONE', trigger Invoice Finalization readiness here

    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      "JOB_CARD_STATUS_UPDATED",
      "INFO",
      ipAddress,
      "job_cards",
      jobId,
      { status: oldJob.status },
      { status: newStatus },
    );

    return updatedJob;
  }

  static async assignMechanic(jobId, mechanicId, staffUser, ipAddress) {
    const oldJob = await this.verifyJobOwnership(jobId, staffUser.branchId);

    const updatedJob = await JobCardModel.assignMechanic(jobId, mechanicId);

    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      "JOB_CARD_MECHANIC_ASSIGNED",
      "INFO",
      ipAddress,
      "job_cards",
      jobId,
      { mechanic_id: oldJob.mechanic_id },
      { mechanic_id: mechanicId },
    );

    return updatedJob;
  }

  static async updateDiagnosis(jobId, notes, staffUser, ipAddress) {
    await this.verifyJobOwnership(jobId, staffUser.branchId);

    const updatedJob = await JobCardModel.updateDiagnosis(jobId, notes);

    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      "JOB_CARD_DIAGNOSIS_UPDATED",
      "INFO",
      ipAddress,
      "job_cards",
      jobId,
      null,
      { diagnostic_notes: notes },
    );

    return updatedJob;
  }
}

module.exports = JobCardService;
