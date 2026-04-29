const JobCardModel = require("../models/JobCard");
const { logSecureAction } = require("../utils/auditLogger");

class StaffJobCardService {
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

    // ==========================================
    //  VALIDATION GATES
    // ==========================================
    if (newStatus === "ONGOING" && !oldJob.mechanic_id) {
      throw new Error(
        "Validation Gate Failed: You must assign a mechanic before moving the vehicle into the bay.",
      );
    }

    if (newStatus === "DONE") {
      if (
        !oldJob.diagnostic_notes ||
        oldJob.diagnostic_notes.trim().length < 5
      ) {
        throw new Error(
          "Validation Gate Failed: A detailed Mechanic Diagnosis is required to generate the Service Passport.",
        );
      }
    }

    const updatedJob = await JobCardModel.updateStatus(jobId, newStatus);

    await logSecureAction(
      staffUser.id,
      staffUser.branchId,
      "JOB_CARD_STATUS_UPDATED",
      "INFO",
      ipAddress,
      "job_cards",
      jobId,
      { status: oldJob.status },
      {
        status: newStatus,
        started_at: updatedJob.started_at,
        completed_at: updatedJob.completed_at,
      },
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

module.exports = StaffJobCardService;
