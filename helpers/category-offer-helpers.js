var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");

module.exports = {
  addCategoryOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      let categoryDetails = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ Category: data.category });
      console.log("categoryId: ", categoryDetails._id);
      try {
        data.startDateIso = new Date(data.starting);
        data.endDateIso = new Date(data.expiry);
        data.categoryId = categoryDetails._id;
        let exist = await db
          .get()
          .collection(collection.CATEGORYOFFER_COLLECTION)
          .findOne({ category: data.category });
        if (exist) {
          reject();
        } else {
          db.get()
            .collection(collection.CATEGORYOFFER_COLLECTION)
            .insertOne(data)
            .then(() => {
              resolve();
            });
        }
      } catch {
        resolve(0);
      }
    });
  },

  getAllCatOffers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let allCatOffers = await db
          .get()
          .collection(collection.CATEGORYOFFER_COLLECTION)
          .find()
          .toArray();
        resolve(allCatOffers);
      } catch {
        resolve(0);
      }
    });
  },

  getCatOfferDetails: (id) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.CATEGORYOFFER_COLLECTION)
          .findOne({ _id: objectId(id) })
          .then((response) => {
            resolve(response);
          });
      } catch {
        resolve(0);
      }
    });
  },

  editedCatOffer: (catOfferId, data) => {
    console.log(catOfferId);
    console.log(data);
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.CATEGORYOFFER_COLLECTION)
          .updateOne(
            { _id: objectId(catOfferId) },
            {
              $set: {
                category: data.category,
                catOfferPercentage: parseInt(data.catOfferPercentage),
                starting: data.starting,
                expiry: data.expiry,
              },
            }
          );
        resolve();
      } catch {
        resolve(0);
      }
    });
  },

  startCategoryOffer: (date) => {
    let startDateIso = new Date(date);
    return new Promise(async (resolve, reject) => {
      try {
        let data = await db
          .get()
          .collection(collection.CATEGORYOFFER_COLLECTION)
          .find({
            $and: [
              { startDateIso: { $lte: startDateIso } },
              { endDateIso: { $gte: startDateIso } },
            ],
          })
          .toArray();
        console.log("catData====================", data);
        if (data.length > 0) {
          await Promise.all(
            data.map(async (onedata) => {
              console.log("onedata: ", onedata);
              let products = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .find({
                  Category: onedata.categoryId,
                  offer: { $exists: false },
                })
                .toArray();
              console.log("products: ", products);
              if (products) {
                await Promise.all(
                  products.map((product) => {
                    let actualPrice = parseInt(product.Price);
                    let catOfferPercentage = parseInt(
                      onedata.catOfferPercentage
                    );
                    let newPrice = (actualPrice * catOfferPercentage) / 100;
                    newPrice = parseInt(newPrice.toFixed());
                    console.log("newprice: ", newPrice);
                    console.log(actualPrice, newPrice);
                    return db
                      .get()
                      .collection(collection.PRODUCT_COLLECTION)
                      .updateOne(
                        { _id: objectId(product._id) },
                        {
                          $set: {
                            actualPrice: actualPrice,
                            Price: actualPrice - newPrice,
                            offer: true,
                            catOfferPercentage: catOfferPercentage,
                          },
                        }
                      );
                  })
                );
              }
            })
          );
          resolve();
        } else {
          let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ catOfferPercentage: { $exists: true } })
            .project({ _id: 1, Category: 1, actualPrice: 1 })
            .toArray();

          let expiredOffers = await db
            .get()
            .collection(collection.CATEGORYOFFER_COLLECTION)
            .find({
              $or: [
                { endDateIso: { $lte: startDateIso } },
                { startDateIso: { $gte: startDateIso } },
              ],
            })
            .toArray();

          if (expiredOffers.length > 0) {
            let bulkOps = [];

            for (const expiredOffer of expiredOffers) {
              bulkOps.push({
                deleteOne: {
                  filter: { _id: objectId(expiredOffer._id) },
                },
              });

              if (bulkOps.length > 0) {
                await db
                  .get()
                  .collection(collection.CATEGORYOFFER_COLLECTION)
                  .bulkWrite(bulkOps);
              }

              bulkOps = [];

              for (const product of products) {
                if (
                  String(product.Category) === String(expiredOffer.categoryId)
                ) {
                  bulkOps.push({
                    updateOne: {
                      filter: { _id: objectId(product._id) },
                      update: {
                        $set: {
                          Price: product.actualPrice,
                        },
                        $unset: {
                          offer: "",
                          catOfferPercentage: "",
                          actualPrice: "",
                        },
                      },
                    },
                  });
                }
              }
              if (bulkOps.length > 0) {
                await db
                  .get()
                  .collection(collection.PRODUCT_COLLECTION)
                  .bulkWrite(bulkOps);
              }
            }
            resolve();
          } else {
            resolve();
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteCategoryOfferFunction: (catOfferId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let catOffer = await db
          .get()
          .collection(collection.CATEGORYOFFER_COLLECTION)
          .findOne({ _id: objectId(catOfferId) });
        let category = catOffer.categoryId;
        console.log("category", category);
        let products = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .find({ Category: category, offer: { $exists: true } })
          .toArray();
        if (products) {
          await db
            .get()
            .collection(collection.CATEGORYOFFER_COLLECTION)
            .deleteOne({ _id: objectId(catOfferId) })
            .then(async () => {
              await products.map(async (product) => {
                await db
                  .get()
                  .collection(collection.PRODUCT_COLLECTION)
                  .updateOne(
                    { _id: objectId(product._id) },
                    {
                      $set: {
                        Price: product.actualPrice,
                      },
                      $unset: {
                        offer: "",
                        catOfferPercentage: "",
                        actualPrice: "",
                      },
                    }
                  )
                  .then(() => {
                    resolve();
                  });
              });
            });
        } else {
          resolve();
        }
      } catch {
        resolve(0);
      }
    });
  },
};
