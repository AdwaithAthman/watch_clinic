var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const { response } = require("express");

module.exports = {
  addToWishlistFunction: (proId, userId) => {
    console.log("addToWishlist1");
    let proObj = {
      Item: objectId(proId),
    };
    return new Promise(async (resolve, reject) => {
      console.log("addToWishlist2");
      let userWish = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ User: objectId(userId) });

      if (userWish) {
        let productExist = userWish.Products.findIndex(
          (product) => product.Item == proId
        );

        if (productExist != -1) {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { User: objectId(userId), "Products.Item": objectId(proId) },
              {
                $pull: { Products: { Item: objectId(proId) } },
              }
            )
            .then(() => {
              console.log("wishlistremove123");

              db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(proId) },
                  {
                    $pull: { wishlist: { User: objectId(userId) } },
                  }
                )
                .then((res) => {
                  reject();
                });
            });
        } else {
          console.log("addToWishlist1");
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { User: objectId(userId) },
              {
                $push: { Products: proObj },
              }
            )
            .then(async () => {
              console.log("addToWishlist1");

              const product = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id: objectId(proId) });
              let userObj = {
                User: objectId(userId),
              };
              db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(proId) },
                  { $push: { wishlist: userObj } }
                )
                .then(() => {
                  resolve();
                });
            });
        }
      } else {
        let wishObj = {
          User: objectId(userId),
          Products: [proObj],
        };
        let userObj = {
          User: objectId(userId),
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishObj)
          .then(() => {
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                { _id: objectId(proId) },
                { $push: { wishlist: userObj } }
              )
              .then(() => {
                resolve();
              });
          });
      }
    });
  },

  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishlistItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
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
              Product: { $arrayElemAt: ["$Product", 0] },
            },
          },
        ])
        .toArray();
      console.log("wishlist items = ", wishlistItems);
      resolve(wishlistItems);
    });
  },

  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ User: objectId(userId) });
      if (wishlist) {
        count = wishlist.Products.length;
        resolve(count);
      } else {
        resolve(count);
      }
    });
  },

  // delete wishlist item
  deleteWishlist: (proId, wishId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: objectId(wishId), "Products.Item": objectId(proId) },
          {
            $pull: { Products: { Item: objectId(proId) } },
          }
        )
        .then(() => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { _id: objectId(proId) },
              {
                $pull: { wishlist: { User: objectId(userId) } },
              }
            )
            .then(() => {
              resolve();
            });
        });
    });
  },

  deleteWishlist2: (proId, userId) => {
    return new Promise((resolve, reject) => {
      Promise.all([
        db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .updateOne(
            { User: objectId(userId), "Products.Item": objectId(proId) },
            {
              $pull: { Products: { Item: objectId(proId) } },
            }
          ),
        db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(proId) },
            {
              $pull: { wishlist: { User: objectId(userId) } },
            }
          ),
      ])
        .then((results) => {
          resolve(results);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getProductExistInWishlist: (proId, userId) => {
    return new Promise((resolve, reject) => {
      // console.log("proId = ", proId);
      // console.log("userId = ", userId);
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { _id: proId },
          },
          {
            $project: {
              isInWishlist: {
                $anyElementTrue: {
                  $map: {
                    input: "$wishlist",
                    as: "wishlistId",
                    in: { $eq: ["$$wishlistId", objectId(userId)] },
                  },
                },
              },
            },
          },
        ])
        .toArray()
        .then((product) => {
          console.log("product = ", product);
          resolve(product);
        })
        .catch((err) => reject(err));
    });
  },
};
