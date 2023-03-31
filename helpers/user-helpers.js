var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const { response } = require("express");

module.exports = {
  doLogin: (userData) => {
    loginStatus = false;
    let response = {};
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        if (user.blocked != true) {
          bcrypt.compare(userData.Password, user.Password).then((status) => {
            if (status) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              resolve({ status: false, message: "Invalid Password" });
            }
          });
        } else {
          resolve({ status: false, message: "User is Blocked" });
        }
      } else {
        resolve({ status: false, message: "Invalid Email" });
      }
    });
  },

  doSignup: (userData) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      let userByEmail = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      let userByPhone = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Phone: userData.Phone });
      if (userByEmail) {
        resolve({ status: false, flag: true });
      } else {
        if (userByPhone) {
          resolve({ status: false, flag: false });
        } else {
          userData.Password = await bcrypt.hash(userData.Password, 10);
          db.get()
            .collection(collection.USER_COLLECTION)
            .insertOne(userData)
            .then((data) => {
              resolve({ status: true });
            });
        }
      }
    });
  },

  verifyPhone: (phone) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Phone: phone });
      console.log(user);
      if (user) {
        if (user.blocked) {
          reject({ blocked: true });
        } else {
          resolve();
        }
      } else {
        reject({ nouser: true });
      }
    });
  },

  totUsers: () => {
    return new Promise(async (resolve, reject) => {
      var totalUsers = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .count();
      resolve(totalUsers);
    });
  },
  totProducts: () => {
    return new Promise(async (resolve, reject) => {
      var totalProducts = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .count();
      resolve(totalProducts);
    });
  },

  totOrders: () => {
    return new Promise(async (resolve, reject) => {
      var totalOrders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .count();
      resolve(totalOrders);
    });
  },

  ////////////////////////////////////////////address///////////////////////////////////////////
  addAddress: (userId, fullAddress) => {
    return new Promise(async (resolve, reject) => {
      let addressObject = {
        userId: objectId(userId),
        firstName: fullAddress.FirstName,
        lastName: fullAddress.LastName,
        country: fullAddress.Country,
        addressLine_1: fullAddress.AddressLine1,
        addressLine_2: fullAddress.AddressLine2,
        city: fullAddress.City,
        state: fullAddress.State,
        postcode: fullAddress.Postcode,
        phone: fullAddress.Phone,
        email: fullAddress.Email,
        date: Date.now(),
      };
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .insertOne(addressObject);
      resolve(address);
    });
  },

  getAllSavedAddresses: (userId) => {
    return new Promise(async (resolve, reject) => {
      let savedAddresses = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(savedAddresses);
    });
  },

  getAddress: (addressId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: objectId(addressId) })
        .then((address) => {
          resolve(address);
        });
    });
  },

  deleteAddressFunction: (addressId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .deleteOne({ _id: objectId(addressId) })
        .then((address) => {
          resolve(address);
        });
    });
  },

  ///////////////////////////////////////////related products////////////////////////////////////////////////////////////////
  getRelatedProducts: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: objectId(categoryId) })
        .toArray()
        .then((relatedProducts) => {
          resolve(relatedProducts);
        });
    });
  },
  //////////////////////////////////////change profile///////////////////////////////////////////////////
  updateProfile: (userID, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userID) },
          {
            $set: {
              Name: userDetails.Name,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getDeliveredOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ user: objectId(userId), status: "Delivered" })
        .count()
        .then((orders) => {
          resolve(orders);
        });
    });
  },

  getReturnedOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ user: objectId(userId), status: "Returned" })
        .count()
        .then((orders) => {
          resolve(orders);
        });
    });
  },

  ///////////////////////////////////////Change Password///////////////////////////////////////////
  getUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      if (user) {
        resolve(user);
      }
    });
  },

  changePassword: (userId, newPassword) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              Password: await bcrypt.hash(newPassword, 10),
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  //////////////////////////////////////////////cancel and return order/////////////////////////////////////////////////////
  orderCancel: (ordId) => {
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(ordId) });
      if (
        order.paymentMethod === "wallet" ||
        order.paymentMethod === "razorpay" ||
        order.paymentMethod === "paypal"
      ) {
        if (order.status === "Placed") {
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: objectId(order.user) },
              {
                $inc: {
                  wallet: order.totalAmount,
                },
              }
            )
            .then(() => {
              db.get()
                .collection(collection.ORDER_COLLECTION)
                .updateOne(
                  { _id: objectId(ordId) },
                  {
                    $set: {
                      walletCredited: true,
                    },
                  }
                );
            });
        }
      }
      const temp = order.products.filter((item) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { _id: objectId(item.Item) },
              { $inc: { Stock: Number(item.Quantity) } },
              function (err, res) {
                if (err) throw err;
                resolve();
              }
            );
        });
      });
      Promise.all(temp)
        .then(() => {
          //after all the promises of every element in the array are resolved, then to proceed to next step
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(ordId) },
              {
                $set: {
                  is_Cancelled: true,
                  status: "Cancelled",
                },
              }
            )
            .then(() => {
              resolve();
            });
        })
        .catch((err) => {
          console.log(err.message);
        });
    });
  },

  orderReturn: (ordId) => {
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(ordId) });
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(order.user) },
          {
            $inc: {
              wallet: order.totalAmount,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(ordId) },
              {
                $set: {
                  walletCredited: true,
                },
              }
            );
        });
      const temp = order.products.filter((item) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { _id: objectId(item.Item) },
              { $inc: { Stock: Number(item.Quantity) } },
              function (err, res) {
                if (err) throw err;
                resolve();
              }
            );
        });
      });

      Promise.all(temp)
        .then(() => {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(ordId) },
              {
                $set: {
                  is_Returned: true,
                  status: "Returned",
                  returnedDate: new Date(),
                },
              }
            )
            .then(() => {
              resolve();
            });
        })
        .catch((err) => {
          console.log(err.message);
        });
    });
  },

  ///////////////////////////////////////////////wallet///////////////////////////////////////////////
  updateWallet: (userId, wallet) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              wallet: parseInt(wallet),
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  getWalletHistory: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let walletHistory = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ user: objectId(userId), walletCredited: true })
          .sort({ $natural: -1 })
          .toArray();
        resolve(walletHistory);
      } catch (error) {
        reject(error);
      }
    });
  },
};
