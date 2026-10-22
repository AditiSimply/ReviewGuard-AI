/**
 * ReviewGuard AI - Initial Administrator Seed & Provisioning Script
 * 
 * Safely creates or updates the primary system administrator account.
 * Reads credentials from environment variables or secure defaults:
 *  - ADMIN_EMAIL (default: admin@reviewguard.ai)
 *  - ADMIN_PASSWORD (default: Admin@123)
 *  - ADMIN_USERNAME (default: admin)
 *  - ADMIN_NAME (default: System Administrator)
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const { initDatabase, db } = require("../src/db");

async function seedAdmin() {
  console.log("==============================================================");
  console.log(" ReviewGuard AI - System Administrator Provisioning Tool");
  console.log("==============================================================");

  await initDatabase();

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@reviewguard.ai").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim();
  const adminName = process.env.ADMIN_NAME || "System Administrator";

  console.log(`Target Admin Email: ${adminEmail}`);
  console.log(`Target Admin Username: ${adminUsername}`);

  const existingByEmail = await db.users.findByEmail(adminEmail);
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  if (existingByEmail) {
    console.log(`Found existing user account [${existingByEmail._id}]. Ensuring admin role and updating credentials...`);
    await db.users.updateRole(existingByEmail._id, "admin");
    const data = require("fs").readFileSync(require("path").join(__dirname, "..", "data", "reviewguard_db.json"), "utf-8");
    const parsed = JSON.parse(data);
    const u = (parsed.users || []).find(x => x._id === existingByEmail._id);
    if (u) {
      u.passwordHash = passwordHash;
      u.isActive = true;
      u.role = "admin";
      require("fs").writeFileSync(require("path").join(__dirname, "..", "data", "reviewguard_db.json"), JSON.stringify(parsed, null, 2));
    }

    await db.auditLogs.log({
      username: adminUsername,
      action: "PROVISION_ADMIN_UPDATE",
      entity_type: "USER",
      entity_id: existingByEmail._id,
      details: `Administrator account credentials updated via seed script.`
    });

    console.log(`Successfully updated administrator account: ${adminEmail}`);
  } else {
    console.log("Creating new primary administrator account...");
    const newAdmin = await db.users.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: "admin",
      name: adminName,
      isActive: true
    });

    await db.auditLogs.log({
      username: adminUsername,
      action: "PROVISION_ADMIN_CREATE",
      entity_type: "USER",
      entity_id: newAdmin._id,
      details: `Primary administrator account provisioned via seed script.`
    });

    console.log(`Successfully created new administrator account [${newAdmin._id}]: ${adminEmail}`);
  }

  console.log("--------------------------------------------------------------");
  console.log("Administrator provisioning complete.");
  console.log(`Email/Username: ${adminEmail} (or username: ${adminUsername})`);
  console.log("Role: admin");
  console.log("You can now sign in via the Admin section in ReviewGuard AI.");
  console.log("==============================================================");
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error("Failed to seed administrator:", err);
  process.exit(1);
});
