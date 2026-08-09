import { globalDb } from '../src/services/db';

async function testBackupRestore() {
  console.log('🧪 Running Database Backup & Restore Verification Test...\n');

  try {
    // 1. Trigger database backup
    const backupPath = globalDb.backup();
    console.log('✅ Store Backup Created At:', backupPath);

    // 2. Perform database restore test
    const restoreOk = globalDb.restore(backupPath);
    if (!restoreOk) {
      throw new Error('Database restore failed!');
    }
    console.log('✅ Store Restore Succeeded Intact!');

    console.log('\n🎉 DATABASE BACKUP & RESTORE TEST PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Backup/Restore Test Failed:', err);
    process.exitCode = 1;
  }
}

testBackupRestore();
