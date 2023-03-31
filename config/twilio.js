var db = require("../config/connection");
var collection = require("../config/collections");

const config = {
  authToken: process.env.authToken,
  accountSID: process.env.accountSID,
  serviceSID: process.env.serviceSID,
};

const client = require("twilio")(config.accountSID, config.authToken);

module.exports = {
  loginGetOtp: (phone) => {
    phone = "+91" + phone;
    console.log(phone);
    return new Promise((resolve, reject) => {
      client.verify
        .services(config.serviceSID)
        .verifications.create({
          to: phone,
          channel: "sms",
        })
        .then((response) => {
          // console.log(response);
          console.log("success");
          resolve();
        })
        .catch((e) => {
          console.log(e);
          console.log("failed");
          reject();
        });
    });
  },

  loginVerifyOtp: (phone, otp) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Phone: phone });
      phone = "+91" + phone;
      client.verify
        .services(config.serviceSID)
        .verificationChecks.create({
          to: phone,
          code: otp,
        })
        .then((response) => {
          let valid = response.valid;
          if (valid) {
            console.log("success");
            resolve({ status: true, user });
          } else {
            resolve({ status: false });
          }
        })
        .catch((e) => {
          console.log(e);
          console.log("failed");
          reject();
        });
    });
  },
};
