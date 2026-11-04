'use strict';
require('dotenv').config();
const sequelize = require('../config/db');

async function fixAutoIncrement() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const [tablesResult] = await sequelize.query('SHOW TABLES');
    const tableNames = tablesResult.map(r => Object.values(r)[0]);

    console.log(`Found ${tableNames.length} tables in database.`);

    for (const tableName of tableNames) {
      const [desc] = await sequelize.query(`DESCRIBE \`${tableName}\``);
      const idCol = desc.find(c => c.Field === 'id');

      if (!idCol) {
        console.log(`⏩ Skipping ${tableName}: No 'id' column found.`);
        continue;
      }

      if (idCol.Extra && idCol.Extra.toLowerCase().includes('auto_increment')) {
        console.log(`✅ Table ${tableName} already has AUTO_INCREMENT.`);
        continue;
      }

      console.log(`\n🔧 Fixing AUTO_INCREMENT for table: ${tableName}...`);

      // 1. Get CREATE TABLE statement
      const [createRes] = await sequelize.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSql = createRes[0]['Create Table'];

      // 2. Get current max ID and row count
      const [maxRes] = await sequelize.query(`SELECT COALESCE(MAX(\`id\`), 0) AS maxId, COUNT(*) AS count FROM \`${tableName}\``);
      const maxId = Number(maxRes[0].maxId);
      const origCount = Number(maxRes[0].count);
      const nextAutoInc = maxId + 1;
      console.log(`   Current rows: ${origCount}, Max ID: ${maxId}, Next AUTO_INCREMENT: ${nextAutoInc}`);

      // 3. Prepare temp table SQL
      const tempTableName = `_tmp_${tableName}`;
      const oldTableName = `_old_${tableName}`;

      // Clean up any leftovers if previously aborted
      await sequelize.query(`DROP TABLE IF EXISTS \`${tempTableName}\``);
      await sequelize.query(`DROP TABLE IF EXISTS \`${oldTableName}\``);

      // Replace table name in create sql
      // The createSql begins with CREATE TABLE `tableName` (
      let newCreateSql = createSql.replace(
        new RegExp(`CREATE TABLE \`${tableName}\``, 'i'),
        `CREATE TABLE \`${tempTableName}\``
      );

      // In newCreateSql, add AUTO_INCREMENT to id column
      // Matches `id` int NOT NULL, or `id` int(11) NOT NULL, etc.
      const idRegex = /(`id`\s+(?:int|bigint|mediumint|smallint|tinyint)(?:\([0-9]+\))?\s+NOT\s+NULL)(?!.*AUTO_INCREMENT)/i;
      if (!idRegex.test(newCreateSql)) {
        console.error(`❌ Could not locate id definition in CREATE TABLE for ${tableName}! SQL was:\n${createSql}`);
        continue;
      }

      newCreateSql = newCreateSql.replace(idRegex, `$1 AUTO_INCREMENT`);

      // Append AUTO_INCREMENT = nextAutoInc before or after ENGINE/CHARSET if needed
      // If AUTO_INCREMENT already exists in table options, update it, else append
      if (/AUTO_INCREMENT=\d+/i.test(newCreateSql)) {
        newCreateSql = newCreateSql.replace(/AUTO_INCREMENT=\d+/i, `AUTO_INCREMENT=${nextAutoInc}`);
      } else {
        newCreateSql += ` AUTO_INCREMENT=${nextAutoInc}`;
      }

      // 4. Create temp table
      await sequelize.query(newCreateSql);

      // 5. Copy data
      if (origCount > 0) {
        await sequelize.query(`INSERT INTO \`${tempTableName}\` SELECT * FROM \`${tableName}\``);
      }

      // 6. Verify row count
      const [newCountRes] = await sequelize.query(`SELECT COUNT(*) AS count FROM \`${tempTableName}\``);
      const newCount = Number(newCountRes[0].count);
      if (newCount !== origCount) {
        throw new Error(`Row count mismatch for ${tableName}: original ${origCount} vs copied ${newCount}. Aborting!`);
      }

      // 7. Swap tables
      await sequelize.query(`RENAME TABLE \`${tableName}\` TO \`${oldTableName}\`, \`${tempTableName}\` TO \`${tableName}\``);

      // 8. Verify swapped table
      const [finalDesc] = await sequelize.query(`DESCRIBE \`${tableName}\``);
      const finalIdCol = finalDesc.find(c => c.Field === 'id');
      if (!finalIdCol || !finalIdCol.Extra.toLowerCase().includes('auto_increment')) {
        throw new Error(`Failed to apply AUTO_INCREMENT to ${tableName}!`);
      }

      // 9. Drop old table
      await sequelize.query(`DROP TABLE IF EXISTS \`${oldTableName}\``);
      console.log(`🎉 Successfully converted ${tableName} to AUTO_INCREMENT (next: ${nextAutoInc})`);
    }

    console.log('\nAll tables processed successfully!');
  } catch (err) {
    console.error('❌ Error during AUTO_INCREMENT migration:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixAutoIncrement();
