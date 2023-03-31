var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");

module.exports = {
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ Email: adminData.Email });
      if (admin) {
        if (adminData.Password == admin.Password) {
          response.admin = admin;
          response.status = true;
          resolve(response);
        } else {
          resolve({ status: false });
        }
      } else {
        resolve({ status: false });
      }
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  getUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let singleUser = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      resolve(singleUser);
    });
  },

  changeStatus: (id) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(id) });
      if (user.blocked == true) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne({ _id: objectId(id) }, { $set: { blocked: false } })
          .then((response) => {
            resolve("unblocked");
          });
      } else {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne({ _id: objectId(id) }, { $set: { blocked: true } })
          .then((response) => {
            resolve("blocked");
          });
      }
    });
  },

  addCategory: (userData) => {
    userData.Category = userData.Category.toUpperCase();
    userData.isActive = true;
    let response = {};
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ Category: userData.Category });
      if (category) {
        resolve((response.status = false));
      } else {
        db.get()
          .collection(collection.CATEGORY_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve((response.status = true));
          });
      }
    });
  },

  updateCategory: (categoryId, categoryDetails) => {
    categoryDetails.Category = categoryDetails.Category.toUpperCase();
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(categoryId) },
          {
            $set: {
              Category: categoryDetails.Category,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  getCategoryDetails: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(categoryId) })
        .then((category) => {
          resolve(category);
        });
    });
  },

  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find({ isActive: true })
        .toArray();
      resolve(categories);
    });
  },

  getCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(categoryId) })
        .then((category) => {
          resolve(category);
        });
    });
  },

  deleteCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      // db.get()
      //   .collection(collection.CATEGORY_COLLECTION)
      //   .deleteOne({ _id: objectId(categoryId) })
      //   .then((response) => {
      //     resolve(response);
      //   });
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(categoryId) },
          {
            $set: {
              isActive: false,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .update(
              { Category: objectId(categoryId) },
              {
                $set: {
                  isActive: false,
                },
              }
            );
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  addProduct: (product) => {
    return new Promise(async (resolve, reject) => {
      product.Category = objectId(product.Category);
      product.Price = parseInt(product.Price);
      product.Stock = parseInt(product.Stock);
      product.isActive = true;
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(product)
        .then((productDetails) => {
          resolve(productDetails.insertedId);
        });
    });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ isActive: true })
        .toArray();
      resolve(products);
    });
  },

  getAllProductsSort: (sortOrder) => {
    return new Promise(async (resolve, reject) => {
      let sortedProducts = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ isActive: true })
        .sort({ Price: parseInt(sortOrder) })
        .toArray();
      resolve(sortedProducts);
    });
  },

  getAllProductsFromCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: objectId(categoryId) })
        .toArray();
      resolve(products);
    });
  },

  deleteProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      // await db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id: objectId(productId)}).then((response)=>{
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: objectId(productId) }, { $set: { isActive: false } })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getProductDetails: (productId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((productDetails) => {
          resolve(productDetails);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise(async (resolve, reject) => {
      productDetails.Category = objectId(productDetails.Category);
      productDetails.Price = parseInt(productDetails.Price);
      productDetails.Stock = parseInt(productDetails.Stock);
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
          {
            $set: {
              Name: productDetails.Name,
              Price: productDetails.Price,
              Description: productDetails.Description,
              Stock: productDetails.Stock,
              Category: productDetails.Category,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////////////////////////////////////////////Get Stock///////////////////////////////////////////////////////////
  findStock: (id) => {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(id) });

      resolve(product.Stock);
    });
  },

  //////////////////////////////////////////Sales Report////////////////////////////////////////////////////////////////
  salesReport: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ status: "Delivered" })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  getSearchResult: (query) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Name: { $regex: query, $options: "i" } })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
};
