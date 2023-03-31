var db = require("../config/connection");
var collection = require("../config/collections");
const { response } = require("express");
var objectId = require("mongodb").ObjectId;

module.exports = {
  getOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ user: objectId(userId) })
        .sort({ $natural: -1 })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },

  getOrderedProductsFunction: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              Item: "$products.Item",
              Quantity: "$products.Quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "Item",
              foreignField: "_id",
              as: "Product",
            },
          },
          {
            $project: {
              Item: 1,
              Quantity: 1,
              Product: { $arrayElemAt: ["$Product", 0] },
            },
          },
        ])
        .toArray();
      console.log("order items === ", orderItems);
      resolve(orderItems);
    });
  },

  //////////////////////////////////////////////////admin///////////////////////////////////////////////////////
  getAllOrderDetails: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ $natural: -1 })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },

  productStatus: (orderId, currentStatus) => {
    let status = currentStatus;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: status,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  getSingleOrderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orderDetails = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            { $match: { _id: objectId(orderId) } },
            { $unwind: "$products" },
            {
              $lookup: {
                from: "product",
                localField: "products.Item",
                foreignField: "_id",
                as: "productData",
              },
            },
            {
              $project: {
                _id: 1,
                deliveryDetails: 1,
                paymentMethod: 1,
                totalAmount: 1,
                status: 1,
                date: 1,
                products: {
                  _id: "$products._id",
                  Item: "$products.Item",
                  Quantity: "$products.Quantity",
                  productData: { $arrayElemAt: ["$productData", 0] },
                },
              },
            },
          ]);
        orderDetails.toArray(function (err, result) {
          if (err) throw err;

          const products = result.map((order) => order.products);
          const combinedResult = {
            _id: result[0]._id,
            deliveryDetails: result[0].deliveryDetails,
            paymentMethod: result[0].paymentMethod,
            totalAmount: result[0].totalAmount,
            status: result[0].status,
            date: result[0].date,
            products: products,
          };
          resolve(combinedResult);
        });
      } catch (error) {
        reject(error);
      }
    });
  },
};
