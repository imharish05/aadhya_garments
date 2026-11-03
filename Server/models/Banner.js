'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: true },
  subtitle: { type: DataTypes.STRING(300) },
  description: { type: DataTypes.TEXT, allowNull: true },
  ctaText: { type: DataTypes.STRING(80) },
  ctaLink: { type: DataTypes.STRING(300) },
  image: { type: DataTypes.STRING(500), allowNull: false },
  type: { type: DataTypes.ENUM('HERO', 'PROMO', 'DEAL', 'EXCLUSIVE_DEAL', 'BRAND', 'COUNTDOWN', 'ABOUT'), defaultValue: 'PROMO' },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
  badgeText: { type: DataTypes.STRING(50) },  // e.g. "40% OFF"
  countdown: { type: DataTypes.DATE },         // for countdown banners
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  hooks: {
    beforeCreate: async (banner) => {
      if (!banner.id) {
        const max = await Banner.max('id');
        banner.id = (max || 0) + 1;
      }
    }
  }
});

module.exports = Banner;
