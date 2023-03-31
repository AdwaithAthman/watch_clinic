var db = require("../config/connection");
var collection = require("../config/collections");
const { response } = require("express");
var objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.client_id_paypal,
  client_secret: process.env.client_secret_paypal,
});

var instance = new Razorpay({
  key_id: process.env.key_id_rzp,
  key_secret: process.env.key_secret_rzp,
});

module.exports = {
  getTotalAmount: (userId) => {
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
                "Product.isActive": true,
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: { $multiply: ["$Quantity", "$Product.Price"] } },
              },
            },
          ])
          .toArray();
        console.log("cart total = ", total);
        console.log("cart total leng= ", total.length);
        if (total.length > 0) resolve(total[0].total);
        else resolve(0);
      });
    } catch (err) {
      reject(err);
    }
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ User: objectId(userId) });
      console.log("cartt = ", cart);
      resolve(cart.Products);
    });
  },

  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status = order["payment-method"] === "COD" ? "Placed" : "Pending";
      let orderObject = {
        deliveryDetails: {
          firstName: order.FirstName,
          lastName: order.LastName,
          country: order.Country,
          addressLine_1: order.AddressLine1,
          addressLine_2: order.AddressLine2,
          city: order.City,
          state: order.State,
          postcode: order.Postcode,
          phone: order.Phone,
          email: order.Email,
        },
        user: objectId(order.UserId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
      };
      console.log("hi", products);
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObject)
        .then((response) => {
          console.log("orderObject = ", orderObject);
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ User: objectId(order.UserId) });
          const temp = products.filter((item) => {
            // Item: new ObjectId("6397fa331247e416d736450f"),
            // Quantity: 1,
            // total: 2000
            return new Promise((resolve, reject) => {
              db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(item.Item) },
                  { $inc: { Stock: -Number(item.Quantity) } },
                  function (err, res) {
                    if (err) throw err;
                    resolve();
                  }
                );
            });
          });
          Promise.all(temp)
            .then(() => {
              resolve(response.insertedId);
            })
            .catch((err) => {
              console.log(err.message);
            });
        });
    });
  },

  generateRazorpay: (orderId, total) => {
    console.log("orderId: ", orderId);
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err, "is the err occured in the generate rzp");
        }
        console.log("new: ", order);
        resolve(order);
      });
    });
  },

  verifyPayment: (details) => {
    console.log("details========", details);
    return new Promise((resolve, reject) => {
      // try {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "bDyYT6e3VpKLb8viLsSlZV1k");
      console.log(
        "payment[razorpay_order_id]",
        details["payment[razorpay_signature]"]
      );
      console.log(
        "details.payment.razorpay_payment-id ",
        details["payment[razorpay_payment_id]"]
      );
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      console.log(details, "===details");
      console.log(hmac, "===hmac");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        console.log("failed");
        reject();
      }

      // } catch (error) {
      //     reject()
      //     console.log(error,'is the error in order placing');
      // }
    });
  },

  //paypal: function
  generatePaypal: (grandTotal) => {
    return new Promise((resolve, reject) => {
      var create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/order-success",
          cancel_url: "http://localhost:3000/checkout",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "item",
                  sku: "item",
                  price: grandTotal,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: grandTotal,
            },
            description: "This is the payment description.",
          },
        ],
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          console.log("error paypal payment = ", error);
          throw error;
        } else {
          console.log(
            "Create Payment Response ",
            payment.transactions[0].amount
          );
          console.log(payment, "payment type");
          console.log(payment.links[1].href);
          resolve(payment.links[1].href);
        }
      });
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  updateOrderStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
};
