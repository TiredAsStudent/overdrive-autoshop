const { exec } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");
const BackupLog = require("../../models/BackupLog");
const { logSecureAction } = require("../../utils/auditLogger");

const execPromise = util.promisify(exec);

class BackupService {
  static async generateBackup(adminId, ipAddress, isManual = true) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `overdrive_backup_${timestamp}.sql`;

    // Ensure isolated backup directory exists outside public routes
    const backupDirectory = path.join(__dirname, "../../../backups");
    if (!fs.existsSync(backupDirectory)) {
      fs.mkdirSync(backupDirectory, { recursive: true });
    }

    const outputPath = path.join(backupDirectory, fileName);
    const backupType = isManual ? "MANUAL" : "AUTOMATED";

    // Build the secure execution string
    const command = `pg_dump -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -d ${process.env.DB_NAME} -F c -b -v -f "${outputPath}"`;

    try {
      // Execute pg_dump, securely injecting the password into the child process environment
      await execPromise(command, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD },
      });

      // Calculate generated file size in MB
      const stats = fs.statSync(outputPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Save to database
      const newBackup = await BackupLog.create({
        file_name: fileName,
        backup_type: backupType,
        file_size_mb: fileSizeMB,
        status: "SUCCESS",
        executed_by: adminId,
      });

      // Write to immutable Audit Trail
      await logSecureAction(
        adminId,
        null, // Global action, no branch ID
        isManual ? "MANUAL_BACKUP_GENERATED" : "AUTOMATED_BACKUP_GENERATED",
        "INFO",
        ipAddress || "SYSTEM",
        "backup_logs",
        newBackup.id,
        null,
        newBackup,
      );

      return newBackup;
    } catch (error) {
      // Log the failure to the database ledger so the Admin sees the red error badge
      await BackupLog.create({
        file_name: fileName,
        backup_type: backupType,
        file_size_mb: 0.0,
        status: "FAILED",
        executed_by: adminId,
        error_message: error.message,
      });

      await logSecureAction(
        adminId,
        null,
        "DATABASE_BACKUP_FAILED",
        "CRITICAL",
        ipAddress || "SYSTEM",
        "backup_logs",
        null,
        null,
        { error: error.message },
      );

      throw new Error(`Database compilation failed: ${error.message}`);
    }
  }

  static async getBackupLogs(page = 1, limit = 5, search = "") {
    const offset = (page - 1) * limit;

    const [totalItems, logs] = await Promise.all([
      BackupLog.countFiltered(search),
      BackupLog.findPaginatedFiltered(limit, offset, search),
    ]);

    return {
      logs,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = BackupService;
