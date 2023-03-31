var db = require("../config/connection");
var collection = require("../config/collections");
const { response } = require("express");
var objectId = require("mongodb").ObjectId;

module.exports = {
  addToCartFunction: async (productId, userId) => {
    let productToCart = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .findOne({ _id: objectId(productId) });
    let productObject = {
      Item: objectId(productId),
      Quantity: 1,
      total: productToCart.Price,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ User: objectId(userId) });
      if (userCart) {
        let productExist = userCart.Products.findIndex(
          (product) => product.Item == productId
        );
        console.log("productExist = ", productExist);
        if (productExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { User: objectId(userId), "Products.Item": objectId(productId) },
              {
                $inc: {
                  "Products.$.Quantity": 1,
                  "Products.$.total": productToCart.Price,
                },
              }
            )
            .then((respone) => {
              resolve(response);
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { User: objectId(userId) },
              {
                $push: {
                  Products: productObject,
                },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
      } else {
        let cartObject = {
          User: objectId(userId),
          Products: [productObject],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObject)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ User: objectId(userId) });
      if (cart) {
        count = cart.Products.length;
      }
      resolve(count);
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { User: objectId(userId) },
          },
          {
            $unwind: "$Products",
          },
          {
            $project: {
              Item: "$Products.Item",
              Quantity: "$Products.Quantity",
              Total: "$Products.total",
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
              Total: 1,
              Product: { $arrayElemAt: ["$Product", 0] },
            },
          },
        ])
        .toArray();
      console.log("cart items === ", cartItems);
      resolve(cartItems);
    });
  },

  findCartProdQty: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let userCart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { User: objectId(userId) },
            },
            {
              $unwind: "$Products",
            },
            {
              $project: {
                Item: "$Products.Item",
                Quantity: "$Products.Quantity",
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
              $match: {
                Item: objectId(proId),
              },
            },
            {
              $project: {
                Item: 1,
                Quantity: 1,
                Product: { $arrayElemAt: ["$Product", 0] },
              },
            },
            {
              $project: {
                unitprice: { $toInt: "$Product.Price" },
                quantity: { $toInt: "$Quantity" },
              },
            },
          ])
          .toArray();
        resolve(userCart[0].quantity);
      } catch {
        resolve(0);
      }
    });
  },

  changeProductQuantityFunction: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise(async (resolve, reject) => {
      let stockCount = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(details.product) });
      if (stockCount.Stock) {
        if (details.quantity == stockCount.Stock && details.count == 1) {
          reject({ status: true });
        }
      }
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { Products: { Item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "Products.Item": objectId(details.product),
            },
            {
              $inc: { "Products.$.Quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  getTotalPriceOfOneProduct: (userId, productId) => {
    return new Promise(async (resolve, reject) => {
      let totalOfOneProduct = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { User: objectId(userId) },
          },
          {
            $unwind: "$Products",
          },
          {
            $project: {
              Item: "$Products.Item",
              Quantity: "$Products.Quantity",
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
            $match: {
              Item: objectId(productId),
            },
          },
          {
            $project: {
              Item: 1,
              Quantity: 1,
              Product: { $arrayElemAt: ["$Product", 0] },
            },
          },
          {
            $project: {
              unitPrice: { $toInt: "$Product.Price" },
              quantity: { $toInt: "$Quantity" },
            },
          },
          {
            $project: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
            },
          },
        ])
        .toArray();
      console.log("----------------------------------------------");
      console.log("subtotal=", totalOfOneProduct);
      if (totalOfOneProduct.length > 0) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { User: objectId(userId), "Products.Item": objectId(productId) },
            {
              $set: {
                "Products.$.total": totalOfOneProduct[0].total,
              },
            }
          )
          .then((response) => {
            resolve(totalOfOneProduct[0].total);
          });
      } else {
        totalOfOneProduct = 0;
        resolve(totalOfOneProduct);
      }
    });
  },

  removeProductFromCart: (productId, userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { User: objectId(userId) },
          { $pull: { Products: { Item: objectId(productId) } } }
        )
        .then((response) => {
          resolve({ response });
        });
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async function (resolve, reject) {
      try {
        let total = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { User: objectId(userId) },
            },
            {
              $unwind: "$Products",
            },
            {
              $project: {
                Item: "$Products.Item",
                Quantity: "$Products.Quantity",
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
            {
              $match: {
                "Product.isActive": true,
              },
            },
            {
              $project: {
                unitPrice: { $toInt: "$Product.Price" },
                quantity: { $toInt: "$Quantity" },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
              },
            },
          ])
          .toArray();
        console.log("183");
        console.log(total);
        console.log("hgdsstrhxydhfc", total[0].total);
        console.log("hgdsstrhxydhfc", total[0]);
        resolve(total[0].total);
      } catch {
        console.log("189");
        resolve(0);
      }
      // if(total.length == 0){
      //     console.log("1");
      //     resolve(0)
      // } else {
      //     console.log("2");
      //     let ftotal = total[0].total
      //     console.log("hereeee");
      //     ftotal = ftotal.toFixed(0)
      //     console.log(ftotal);
      //     resolve(ftotal)
      // }
    });
  },

  getIsActiveFalseCartCount: (userId) => {
    try {
      return new Promise(async (resolve, reject) => {
        let total = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { User: objectId(userId) },
            },
            {
              $unwind: "$Products",
            },
            {
              $project: {
                Item: "$Products.Item",
                Quantity: "$Products.Quantity",
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
            {
              $match: {
                "Product.isActive": false,
              },
            },
          ])
          .toArray();
        console.log("isActiveCartLength====", total.length);
        if (total.length > 0) resolve(total.length);
        else resolve(0);
      });
    } catch (err) {
      reject(err);
    }
  },
};
