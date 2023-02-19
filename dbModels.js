import { TEXT, INTEGER, DECIMAL } from "sequelize";
import sequelize from "./sequelizeConfig.js";

export const dbProduct = sequelize.define('products', {
  title: TEXT,
  price: DECIMAL,
  desc: TEXT,
  image: TEXT,
  quantity: INTEGER,
  category: TEXT,
},{
  freezeTableName: true,
});