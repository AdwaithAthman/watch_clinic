var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const { log } = require("handlebars");

module.exports = {
  addExclusiveDeal: (dealData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let exist = await db
          .get()
          .collection(collection.EXCLUSIVEDEAL_COLLECTION)
          .findOne({ ProductName: dealData.ProductName });
        if (exist) {
          reject();
        } else {
          await db
            .get()
            .collection(collection.EXCLUSIVEDEAL_COLLECTION)
            .insertOne(dealData)
            .then((data) => {
              resolve(data);
            });
        }
      } catch (error) {
        console.log(error);
        reject();
      }
    });
  },

  getAllExclusiveDeals: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let allExclusiveDeals = await db
          .get()
          .collection(collection.EXCLUSIVEDEAL_COLLECTION)
          .find()
          .toArray();
        resolve(allExclusiveDeals);
      } catch {
        resolve(0);
      }
    });
  },

  addHeadBanner: (bannerDetails) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.HEADBANNER_COLLECTION)
        .insertOne(bannerDetails)
        .then((bannerInfo) => {
          resolve(bannerInfo.insertedId); //insertedId is the _id of the newly inserted document
        });
    });
  },

  getAllHeadBanners: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let allHeadBanners = await db
          .get()
          .collection(collection.HEADBANNER_COLLECTION)
          .find()
          .toArray();
        resolve(allHeadBanners);
      } catch (error) {
        resolve(0);
      }
    });
  },

  getHeadBanner: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let headBanner = await db
          .get()
          .collection(collection.HEADBANNER_COLLECTION)
          .findOne({ _id: objectId(id) });
        resolve(headBanner);
      } catch (error) {
        resolve(0);
      }
    });
  },

  updateHeadBanner: (bannerId, bannerDetails) => {
    return new Promise(async (resolve, reject) => {
      try {
        let updatedHeadBanner = await db
          .get()
          .collection(collection.HEADBANNER_COLLECTION)
          .updateOne(
            { _id: objectId(bannerId) },
            {
              $set: {
                mainHeading: bannerDetails.mainHeading,
                tagline: bannerDetails.tagline,
                description: bannerDetails.description,
                redirectLink: bannerDetails.redirectLink,
              },
            }
          );
        resolve(updatedHeadBanner);
      } catch (error) {
        console.log(error);
        resolve(0);
      }
    });
  },

  toDeleteHeadBanner: (bannerId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.HEADBANNER_COLLECTION)
          .deleteOne({ _id: objectId(bannerId) })
          .then(() => {
            resolve();
          });
      } catch (error) {
        console.log(error);
        resolve(0);
      }
    });
  },

  getAllDealsWithProductInfo: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.EXCLUSIVEDEAL_COLLECTION)
        .aggregate([
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "ProductName",
              foreignField: "Name",
              as: "productInfo",
            },
          },
        ])
        .toArray()
        .then((result) => {
          // console.log("result", result[0].productInfo);
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getExclusiveDeal: (dealId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.EXCLUSIVEDEAL_COLLECTION)
          .findOne({ _id: objectId(dealId) })
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  updateDealPostFn: (dealId, dealData) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.EXCLUSIVEDEAL_COLLECTION)
          .updateOne(
            { _id: objectId(dealId) },
            {
              $set: {
                ProductName: dealData.ProductName,
                caption: dealData.caption,
                catchPhrase: dealData.catchPhrase,
              },
            }
          )
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteExclusiveDealFn: (id) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.EXCLUSIVEDEAL_COLLECTION)
          .deleteOne({ _id: objectId(id) })
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
};
