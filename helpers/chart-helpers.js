var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");

module.exports = {
  findOrdersByDay: () => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              date: {
                $gte: new Date(new Date() - 60 * 60 * 24 * 1000 * 13),
              },
            },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
              dayOfWeek: { $dayOfWeek: "$date" },
            },
          },
          {
            $group: {
              _id: "$day",
              count: { $sum: 1 },
              detail: { $first: "$$ROOT" },
            },
          },
          {
            $sort: { detail: 1 },
          },
        ])
        .toArray();
      console.log(data, " is the data");

      resolve(data);
    });
  },

  graphdata: () => {
    return new Promise(async (resolve, reject) => {
      //   WeeklySales
      var weeklySales = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { status: "Delivered" } },
          {
            $project: {
              date: { $convert: { input: "$_id", to: "date" } },
              total: "$totalAmount",
            },
          },
          {
            $match: {
              date: {
                $lt: new Date(),
                $gt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000 * 7),
              },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: "$date" },
              total: { $sum: "$total" },
            },
          },
          {
            $project: {
              date: "$_id",
              total: "$total",
              _id: 0,
            },
          },
          {
            $sort: { date: 1 },
          },
        ])
        .toArray();

      console.log("weekly sales: ", weeklySales[0]);

      // monthly Sales
      var monthlySales = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { status: "Delivered" } },
          {
            $project: {
              date: { $convert: { input: "$_id", to: "date" } },
              total: "$totalAmount",
            },
          },
          {
            $match: {
              date: {
                $lt: new Date(),
                $gt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000 * 365),
              },
            },
          },
          {
            $group: {
              _id: { $month: "$date" },
              total: { $sum: "$total" },
            },
          },
          {
            $project: {
              month: "$_id",
              total: "$total",
              _id: 0,
            },
          },
        ])
        .toArray();

      console.log("monthly sales: ", monthlySales);

      // Yearly Sales
      var yearlySales = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { status: "Delivered" } },
          {
            $project: {
              date: { $convert: { input: "$_id", to: "date" } },
              total: "$totalAmount",
            },
          },

          {
            $group: {
              _id: { $year: "$date" },
              total: { $sum: "$total" },
            },
          },
          {
            $project: {
              year: "$_id",
              total: "$total",
              _id: 0,
            },
          },
        ])
        .toArray();

      console.log("yearly sales: ", yearlySales);

      resolve({ weeklySales, monthlySales, yearlySales });
    });
  },
};
