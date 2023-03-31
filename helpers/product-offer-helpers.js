var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");

module.exports = {
  addProductOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collection.PRODUCTOFFER_COLLECTION)
        .findOne({ product: data.product });
      if (exist) {
        reject();
      } else {
        data.startDateIso = new Date(data.starting);
        data.endDateIso = new Date(data.expiry);
        data.productOfferPercentage = parseInt(data.productOfferPercentage);
        let exist = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ Name: data.product, offer: { $exists: true } });
        if (exist) {
          reject();
        } else {
          db.get()
            .collection(collection.PRODUCTOFFER_COLLECTION)
            .insertOne(data)
            .then(() => {
              resolve();
            });
        }
      }
    });
  },

  getAllProductOffer: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let AllCatOffers = await db
          .get()
          .collection(collection.PRODUCTOFFER_COLLECTION)
          .find()
          .toArray();
        resolve(AllCatOffers);
      } catch {
        resolve(0);
      }
    });
  },

  getProductOfferDetails: (id) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.PRODUCTOFFER_COLLECTION)
          .findOne({ _id: objectId(id) })
          .then((response) => {
            resolve(response);
          });
      } catch {
        resolve(0);
      }
    });
  },

  getAllProductOffers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let allProductOffers = await db
          .get()
          .collection(collection.PRODUCTOFFER_COLLECTION)
          .find()
          .toArray();
        resolve(allProductOffers);
      } catch {
        resolve(0);
      }
    });
  },

  getProdOfferDetails: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.PRODUCTOFFER_COLLECTION)
          .findOne({ _id: objectId(id) })
          .then((response) => {
            resolve(response);
          });
      } catch {
        resolve(0);
      }
    });
  },

  editProdOffer: (proOfferId, data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCTOFFER_COLLECTION)
        .updateOne(
          { _id: objectId(proOfferId) },
          {
            $set: {
              product: data.product,
              starting: data.starting,
              expiry: data.expiry,
              productOfferPercentage: parseInt(data.productOfferPercentage),
              startDateIso: new Date(data.starting),
              endDateIso: new Date(data.expiry),
            },
          }
        )
        .then(async () => {
          let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ Name: data.product, offer: { $exists: true } })
            .toArray();
          if (products) {
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
                      productOfferPercentage: "",
                      actualPrice: "",
                    },
                  }
                )
                .then(() => {
                  resolve();
                });
            });
          } else {
            resolve();
          }
          resolve();
        });
    });
  },

  deleteProdOffer: (proOfferId) => {
    return new Promise(async (resolve, reject) => {
      let productOfferPercentage = await db
        .get()
        .collection(collection.PRODUCTOFFER_COLLECTION)
        .findOne({ _id: objectId(proOfferId) });
      let pname = productOfferPercentage.product;
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ Name: pname });
      console.log(product);
      db.get()
        .collection(collection.PRODUCTOFFER_COLLECTION)
        .deleteOne({ _id: objectId(proOfferId) })
        .then(() => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { Name: pname },
              {
                $set: {
                  Price: product.actualPrice,
                },
                $unset: {
                  offer: "",
                  productOfferPercentage: "",
                  actualPrice: "",
                },
              }
            )
            .then(() => {
              resolve();
            });
        });
    });
  },

  startProductOffer: (date) => {
    try {
      let proStartDateIso = new Date(date);
      return new Promise(async (resolve, reject) => {
        let data = await db
          .get()
          .collection(collection.PRODUCTOFFER_COLLECTION)
          .find({
            $and: [
              { startDateIso: { $lte: proStartDateIso } },
              { endDateIso: { $gte: proStartDateIso } },
            ],
          })
          .toArray();
        console.log("proddataOffer=====: ", data);
        if (data.length > 0) {
          await data.map(async (onedata) => {
            let product = await db
              .get()
              .collection(collection.PRODUCT_COLLECTION)
              .findOne({ Name: onedata.product, offer: { $exists: false } });

            if (product) {
              let actualPrice = parseInt(product.Price);
              let newPrice = parseInt(
                (actualPrice * onedata.productOfferPercentage) / 100
              );
              newPrice = parseInt(newPrice.toFixed());

              db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(product._id) },
                  {
                    $set: {
                      actualPrice: actualPrice,
                      Price: actualPrice - newPrice,
                      offer: true,
                      productOfferPercentage: onedata.productOfferPercentage,
                    },
                  }
                );
            }
          });
          resolve();
        } else {
          let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({
              productOfferPercentage: { $exists: true },
            })
            .project({
              _id: 1,
              Category: 1,
              actualPrice: 1,
              Name: 1,
              productOfferPercentage: 1,
            })
            .toArray();

          let expiredOffers = await db
            .get()
            .collection(collection.PRODUCTOFFER_COLLECTION)
            .find({
              $or: [
                { endDateIso: { $lte: proStartDateIso } },
                { startDateIso: { $gte: proStartDateIso } },
              ],
            })
            .toArray();

          if (expiredOffers.length > 0 && products.length > 0) {
            let bulkOps = [];

            for (const product of products) {
              for (const expiredOffer of expiredOffers) {
                if (
                  product.Name.toLowerCase() ===
                  expiredOffer.product.toLowerCase()
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
                          productOfferPercentage: "",
                          actualPrice: "",
                        },
                      },
                    },
                  });
                }
              }
            }

            if (bulkOps.length > 0) {
              await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .bulkWrite(bulkOps);
            }

            bulkOps = [];

            for (const expiredOffer of expiredOffers) {
              bulkOps.push({
                deleteOne: {
                  filter: { _id: objectId(expiredOffer._id) },
                },
              });
            }

            if (bulkOps.length > 0) {
              await db
                .get()
                .collection(collection.PRODUCTOFFER_COLLECTION)
                .bulkWrite(bulkOps);
            }

            resolve();
          } else {
            resolve();
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
};
