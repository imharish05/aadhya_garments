'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { AdminUser, Role } = require('./models');
const sequelize = require('./config/db');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    let [role] = await Role.findOrCreate({
      where: { name: 'ADMIN' },
      defaults: { permissions: { all: true } }
    });

    const email = process.argv[2] || 'admin@twinapparels.com';
    const rawPassword = process.argv[3] || 'Admin@123';
    const name = process.argv[4] || 'Super Admin';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    let admin = await AdminUser.findOne({ where: { email } });
    if (admin) {
      await admin.update({
        password: hashedPassword,
        roleId: role.id,
        isActive: true,
        name
      });
      console.log(`SUCCESS: Admin user "${email}" updated with password "${rawPassword}"!`);
    } else {
      admin = await AdminUser.create({
        name,
        email,
        password: hashedPassword,
        roleId: role.id,
        isActive: true
      });
      console.log(`SUCCESS: Admin user "${email}" created successfully with password "${rawPassword}"!`);
    }
  } catch (error) {
    console.error('ERROR creating/updating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
