const express = require("express");
const bcrypt = require("bcrypt");
var userHelpers = require("../helpers/user-helpers");
var adminHelpers = require("../helpers/admin-helpers");
var cartHelpers = require("../helpers/cart-helpers");
var checkoutHelpers = require("../helpers/checkout-helpers");
var orderHelpers = require("../helpers/order-helpers");
var wishlistHelpers = require("../helpers/wishlist-helpers");
var couponHelpers = require("../helpers/coupon-helpers");
var categoryOfferHelpers = require("../helpers/category-offer-helpers");
var productOfferHelpers = require("../helpers/product-offer-helpers");
var bannerManagementHelpers = require("../helpers/banner-management-helpers");
const otpAuthentication = require("../config/twilio");
const { response } = require("express");
const { ObjectId } = require("mongodb");
// const moment = require('moment');

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

const userController = {
  homeView: async (req, res, next) => {
    try {
      let user = req.session.user;
      let categories = await adminHelpers.getAllCategory();
      let products = await adminHelpers.getAllProducts();
      let cartCount = null;
      let wishlistCount = null;
      let headBanners = await bannerManagementHelpers.getAllHeadBanners();
      let allDealsWithProductInfo =
        await bannerManagementHelpers.getAllDealsWithProductInfo();

      //each category
      let firstCategory = categories[0];
      let secondCategory = categories[1];
      let thirdCategory = categories[2];

      products.forEach(async (element) => {
        let categoryName = await adminHelpers.getCategory(element.Category);
        if (categoryName) {
          element.categoryName = categoryName.Category;
        }
      });

      if (user) {
        //offer
        let todayDate = new Date().toISOString().slice(0, 10);
        let startCouponOffer = await couponHelpers.startCouponOffer(todayDate);
        let startCategoryOffer = await categoryOfferHelpers.startCategoryOffer(
          todayDate
        );
        let startProductOffer = await productOfferHelpers.startProductOffer(
          todayDate
        );

        cartCount = await cartHelpers.getCartCount(user._id);
        wishlistCount = await wishlistHelpers.getWishlistCount(user._id);
        let singleUser = await adminHelpers.getUser(user._id);
        let isInwishlist = "isInwishlist" + user._id;

        products.forEach(async (element) => {
          if (element.Stock <= 10 && element.Stock != 0) {
            element.fewStock = true;
          } else if (element.Stock == 0) {
            element.noStock = true;
          }
        });

        const updatedProducts = products.map((item) => {
          if (item.wishlist) {
            item.wishlist.forEach((usr) => {
              let i = usr.User + ""; //Here user is string not objectId
              if (i == user._id) {
                item.isInWishlist = true;
              } else {
                item.isInWishlist = false;
              }
            });
          }
          return item;
        });
        res.render("user/home", {
          user_files: true,
          user: true,
          categories,
          singleUser,
          products: updatedProducts,
          cartCount,
          wishlistCount,
          startCouponOffer,
          startCategoryOffer,
          startProductOffer,
          firstCategory,
          secondCategory,
          thirdCategory,
          headBanners,
          allDealsWithProductInfo,
        });
      } else {
        //offer
        let todayDate = new Date().toISOString().slice(0, 10);
        let startCouponOffer = await couponHelpers.startCouponOffer(todayDate);
        let startCategoryOffer = await categoryOfferHelpers.startCategoryOffer(
          todayDate
        );
        let startProductOffer = await productOfferHelpers.startProductOffer(
          todayDate
        );

        res.render("user/home", {
          user_files: true,
          user: true,
          categories,
          products,
          startCouponOffer,
          startCategoryOffer,
          startProductOffer,
          firstCategory,
          secondCategory,
          thirdCategory,
          headBanners,
          allDealsWithProductInfo,
          cartCount: 0,
          wishlistCount: 0,
        });
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  loginGet: (req, res, next) => {
    try {
      let user = req.session.user;
      if (user) {
        res.redirect("/");
      } else {
        res.render("user/login", {
          admin_files: true,
          loginErr: req.session.loginErr,
        });
        req.session.loginErr = false;
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  loginPost: (req, res, next) => {
    try {
      userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {
          req.session.loggedIn = true;
          req.session.user = response.user;
          if (req.session.previousUrl) {
            res.redirect(req.session.previousUrl);
          } else {
            res.redirect("/");
          }
        } else {
          req.session.loginErr = response.message;
          res.redirect("/login");
        }
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  logoutGet: (req, res, next) => {
    try {
      req.session.loggedIn = null;
      req.session.user = null;
      res.redirect("/");
    } catch (error) {
      res.redirect("/error");
    }
  },

  signupGet: (req, res, next) => {
    try {
      res.render("user/signup", {
        admin_files: true,
        signupErr: req.session.signupErr,
      });
      signupErr = false;
    } catch (error) {
      res.redirect("/error");
    }
  },

  signupPost: (req, res, next) => {
    try {
      userHelpers.doSignup(req.body).then((response) => {
        if (response.status) {
          res.redirect("/login");
        } else {
          if (response.flag) {
            req.session.signupErr = "Email already exists";
            res.redirect("/signup");
          } else {
            req.session.signupErr = "Phone number already exists";
            res.redirect("/signup");
          }
        }
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  getOtpPost: (req, res, next) => {
    try {
      const phone = req.body.Phone;
      userHelpers
        .verifyPhone(phone)
        .then(() => {
          otpAuthentication
            .loginGetOtp(phone)
            .then(() => {
              res.render("user/otp", { admin_files: true, phone });
            })
            .catch((err) => {
              res.redirect("/login");
            });
        })
        .catch((response) => {
          if (response.nouser) {
            req.session.invalidUser = "invalid number";
            res.redirect("/login");
          } else {
            req.session.blockErr = "user blocked";
            res.redirect("/login");
          }
        });
    } catch (error) {
      res.redirect("/error");
    }
  },

  otpPost: async (req, res, next) => {
    const otp = req.body.Otp;
    const phone = req.body.Phone;
    otpAuthentication
      .loginVerifyOtp(phone, otp)
      .then((response) => {
        if (response.status) {
          req.session.loggedIn = true;
          req.session.user = response.user;
          res.redirect("/");
        } else {
          res.redirect("/login");
        }
      })
      .catch(() => {
        res.redirect("/login");
      });
  },

  ////////////////////////////////////////profile//////////////////////////////////////////
  profileViewGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      req.session.previousUrl = "/profile";
      let userDetails = await userHelpers.getUser(singleUser._id);
      let deliveredOrders = await userHelpers.getDeliveredOrders(
        singleUser._id
      );
      let returnedOrders = await userHelpers.getReturnedOrders(singleUser._id);
      let cartCount = await cartHelpers.getCartCount(singleUser._id);
      let wishlistCount = await wishlistHelpers.getWishlistCount(
        singleUser._id
      );
      allSavedAddresses = await userHelpers.getAllSavedAddresses(
        singleUser._id
      );
      res.render("user/profile", {
        user_files: true,
        user: true,
        singleUser,
        allSavedAddresses,
        userDetails,
        deliveredOrders,
        returnedOrders,
        cartCount,
        wishlistCount,
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  profileSecurityViewGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      req.session.previousUrl = "/profile-security";
      let cartCount = await cartHelpers.getCartCount(singleUser._id);
      let wishlistCount = await wishlistHelpers.getWishlistCount(
        singleUser._id
      );
      res.render("user/profile-security", {
        user_files: true,
        user: true,
        singleUser,
        passErr: req.session.changePasswordError,
        cartCount,
        wishlistCount,
      });
      req.session.changePasswordError = false;
    } catch (error) {
      res.redirect("/error");
    }
  },

  passwordChangePost: async (req, res, next) => {
    try {
      let userId = req.session.user._id;
      let enteredPassword = req.body.currentPassword;
      let newPassword = req.body.newPassword;
      let confirmPassword = req.body.confirmPassword;

      if (newPassword == confirmPassword) {
        let userdetails = await userHelpers.getUser(userId);
        bcrypt.compare(enteredPassword, userdetails.Password).then((status) => {
          if (status) {
            userHelpers.changePassword(userId, newPassword).then((response) => {
              req.session.success = true;
              console.log("req.session===========", req.session);
              res.json({ passwordChanged: true });
            });
          }
        });
      } else {
        req.session.changePasswordError =
          "The new password and confirm password fields do not match";
        // res.redirect("/profile-security");
        res.json({ passwordMismatch: true });
      }
    } catch (error) {
      console.log("Something Went Wrong in Profile");
      res.redirect("/error");
    }
  },

  editProfilePost: (req, res, next) => {
    let userID = req.params.id;
    userHelpers.updateProfile(userID, req.body).then(async (data) => {
      try {
        if (req.files.profileImg) {
          let image = req.files?.profileImg;
          await image.mv(
            `./public/product-images/${userID}.jpg`,
            (err, succ) => {
              if (err) {
                console.warn(err);
              }
              {
                console.log("success");
              }
            }
          );
        }
        res.redirect("/profile");
      } catch (err) {
        // res.redirect('/profile')
        console.log("Something went wrong in Profile Page Post");
        res.redirect("/error");
      }
    });
  },

  walletHistoryGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      console.log("req.session=============", req.session);
      let cartCount = await cartHelpers.getCartCount(singleUser._id);
      let wishlistCount = await wishlistHelpers.getWishlistCount(
        singleUser._id
      );
      await userHelpers
        .getWalletHistory(singleUser._id)
        .then((walletHistory) => {
          walletHistory.forEach((element) => {
            element.date = element.date.toISOString().split("T")[0];
          });
          res.render("user/wallet-history", {
            user_files: true,
            user: true,
            singleUser,
            cartCount,
            wishlistCount,
            walletHistory,
          });
        });
    } catch (error) {
      console.log("Something went wrong at Wallet History", error);
      res.redirect("/error");
    }
  },

  ///////////////////////////////////////addresses///////////////////////////////////////
  saveAddressPatch: (req, res, next) => {
    try {
      console.log("address = ", req.body);
      let singleUser = req.session.user;
      let fullAddress = req.body;
      userHelpers.addAddress(singleUser._id, fullAddress).then((response) => {
        if (response) {
          res.send({ response: true });
        }
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  deleteAddress: (req, res, next) => {
    try {
      userHelpers.deleteAddressFunction(req.params.id).then((response) => {
        res.json({ status: true });
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  editAddressGet: async (req, res, next) => {
    try {
      let address = await userHelpers.getAddress(req.params.id);
      res.send({ address });
    } catch (error) {
      res.redirect("/error");
    }
  },

  addAddressGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      req.session.previousUrl = "/add-address";
      if (singleUser) {
        let cartCount = await cartHelpers.getCartCount(singleUser._id);
        let wishlistCount = await wishlistHelpers.getWishlistCount(
          singleUser._id
        );
        await res.render("user/add-address", {
          user_files: true,
          user: true,
          cartCount,
          wishlistCount,
          singleUser,
        });
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  productGet: async (req, res, next) => {
    try {
      let user = req.session.user;
      let productId = req.query.id;
      req.session.previousUrl = "/product?id=" + productId;
      let categoryList = await adminHelpers.getAllCategory();
      let cartCount = null;
      let wishlistCount = null;
      if (user) {
        let cartCount = await cartHelpers.getCartCount(user._id);
        let wishlistCount = await wishlistHelpers.getWishlistCount(user._id);
        let singleUser = await adminHelpers.getUser(user._id);
        adminHelpers
          .getProductDetails(productId)
          .then(async (productDetails) => {
            if (productDetails.Stock <= 10 && productDetails.Stock != 0) {
              productDetails.fewStock = true;
            } else if (productDetails.Stock == 0) {
              productDetails.noStock = true;
            }
            let relatedProducts = await userHelpers.getRelatedProducts(
              productDetails.Category
            );
            const updatedRelatedProducts = relatedProducts.map((item) => {
              if (item.wishlist) {
                item.wishlist.forEach((usr) => {
                  let i = usr.User + ""; //Here user is string not objectId
                  if (i == user._id) {
                    item.isInWishlist = true;
                  } else {
                    item.isInWishlist = false;
                  }
                });
              }
              return item;
            });
            let products = await adminHelpers.getAllProducts();
            let productss = await adminHelpers.getAllProducts();

            productss.forEach(async (element) => {
              if (element.Stock <= 10 && element.Stock != 0) {
                element.fewStock = true;
              } else if (element.Stock == 0) {
                element.noStock = true;
              }
            });

            if (productDetails.wishlist) {
              productDetails.wishlist.forEach((usr) => {
                let i = usr.User + ""; //Here user is string not objectId
                if (i == user._id) {
                  productDetails.isInWishlist = true;
                } else {
                  productDetails.isInWishlist = false;
                }
              });
            }

            res.render("user/product", {
              user_files: true,
              user: true,
              productDetails,
              categoryList,
              relatedProducts: updatedRelatedProducts,
              cartCount,
              wishlistCount,
              singleUser,
              products,
              productss,
            });
          });
      } else {
        adminHelpers
          .getProductDetails(productId)
          .then(async (productDetails) => {
            let relatedProducts = await userHelpers.getRelatedProducts(
              productDetails.Category
            );
            let productss = await adminHelpers.getAllProducts();
            let products = await adminHelpers.getAllProducts();

            productss.forEach(async (element) => {
              if (element.Stock <= 10 && element.Stock != 0) {
                element.fewStock = true;
              } else if (element.Stock == 0) {
                element.noStock = true;
              }
            });

            productDetails = await adminHelpers.getProductDetails(productId);
            if (productDetails.Stock <= 10 && productDetails.Stock != 0) {
              productDetails.fewStock = true;
            } else if (productDetails.Stock == 0) {
              productDetails.noStock = true;
            }

            res.render("user/product", {
              user_files: true,
              user: true,
              productDetails,
              categoryList,
              relatedProducts,
              products,
              productss,
            });
          });
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  shopGet: async (req, res, next) => {
    try {
      let user = req.session.user;
      req.session.previousUrl = "/shop";
      let categories = await adminHelpers.getAllCategory();
      let products = await adminHelpers.getAllProducts();
      let cartCount = null;
      let wishlistCount = null;

      if (req.query.query && req.query.results) {
        const query = req.query.query;
        const results = JSON.parse(req.query.results);

        for (let i = 0; i < results.length; i++) {
          const element = results[i];
          const categoryName = await adminHelpers.getCategory(element.Category);
          if (categoryName) {
            element.categoryName = categoryName.Category;
          }
        }

        if (user) {
          cartCount = await cartHelpers.getCartCount(user._id);
          wishlistCount = await wishlistHelpers.getWishlistCount(user._id);
          let singleUser = await adminHelpers.getUser(user._id);
          results.forEach(async (element) => {
            if (element.Stock <= 10 && element.Stock != 0) {
              element.fewStock = true;
            } else if (element.Stock == 0) {
              element.noStock = true;
            }
          });

          results.map((item) => {
            if (item.wishlist) {
              item.wishlist.forEach((usr) => {
                let i = usr.User + ""; //Here user is string not objectId
                if (i == user._id) {
                  item.isInWishlist = true;
                } else {
                  item.isInWishlist = false;
                }
              });
            }
            return item;
          });

          res.render("user/shop", {
            user_files: true,
            user: true,
            categories,
            singleUser,
            products: results,
            cartCount,
            wishlistCount,
            query,
          });
        } else {
          res.render("user/shop", {
            user_files: true,
            user: true,
            categories,
            products: results,
            cartCount: 0,
            wishlistCount: 0,
            query,
          });
        }
      } else {
        for (let i = 0; i < products.length; i++) {
          const element = products[i];
          const categoryName = await adminHelpers.getCategory(element.Category);
          if (categoryName) {
            element.categoryName = categoryName.Category;
          }
        }

        if (user) {
          cartCount = await cartHelpers.getCartCount(user._id);
          wishlistCount = await wishlistHelpers.getWishlistCount(user._id);
          let singleUser = await adminHelpers.getUser(user._id);
          products.forEach(async (element) => {
            if (element.Stock <= 10 && element.Stock != 0) {
              element.fewStock = true;
            } else if (element.Stock == 0) {
              element.noStock = true;
            }
          });

          products.map((item) => {
            if (item.wishlist) {
              item.wishlist.forEach((usr) => {
                let i = usr.User + ""; //Here user is string not objectId
                if (i == user._id) {
                  item.isInWishlist = true;
                } else {
                  item.isInWishlist = false;
                }
              });
            }
            return item;
          });

          res.render("user/shop", {
            user_files: true,
            user: true,
            categories,
            singleUser,
            products,
            cartCount,
            wishlistCount,
          });
        } else {
          res.render("user/shop", {
            user_files: true,
            user: true,
            categories,
            products,
            cartCount: 0,
            wishlistCount: 0,
          });
        }
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  shopSearch: async (req, res) => {
    try {
      const query = req.query.query;
      const searchResult = await adminHelpers.getSearchResult(query);
      res.status(200).json({ searchResult });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
      res.redirect("/error");
    }
  },

  shopSearchResults: async (req, res) => {
    try {
      res.redirect(
        301,
        "/shop?" +
          "query=" +
          encodeURIComponent(req.query.query) +
          "&results=" +
          encodeURIComponent(req.query.results)
      );
    } catch (error) {
      res.redirect("/error");
    }
  },

  categoryShopGet: async (req, res, next) => {
    try {
      let user = req.session.user;
      let categoryId = req.query.id;
      let products = await adminHelpers.getAllProductsFromCategory(categoryId);
      let categoryName = await adminHelpers.getCategory(categoryId);

      let cartCount = null;
      let wishlistCount = null;

      products.forEach(async (element) => {
        let categoryName = await adminHelpers.getCategory(element.Category);
        if (categoryName) {
          element.categoryName = categoryName.Category;
        }
      });

      if (user) {
        cartCount = await cartHelpers.getCartCount(user._id);
        wishlistCount = await wishlistHelpers.getWishlistCount(user._id);
        let singleUser = await adminHelpers.getUser(user._id);
        products.forEach(async (element) => {
          if (element.Stock <= 10 && element.Stock != 0) {
            element.fewStock = true;
          } else if (element.Stock == 0) {
            element.noStock = true;
          }
        });
        const updatedProducts = products.map((item) => {
          if (item.wishlist) {
            item.wishlist.forEach((usr) => {
              let i = usr.User + ""; //Here user is string not objectId
              if (i == user._id) {
                item.isInWishlist = true;
              } else {
                item.isInWishlist = false;
              }
            });
          }
          return item;
        });
        res.render("user/mainCategory-shop", {
          user_files: true,
          user: true,
          categoryName,
          singleUser,
          products: updatedProducts,
          cartCount,
          wishlistCount,
        });
      } else {
        res.render("user/mainCategory-shop", {
          user_files: true,
          user: true,
          categoryName,
          products,
          cartCount: 0,
          wishlistCount: 0,
        });
      }
    } catch (error) {
      console.log("Something is wrong in categoryShop");
      res.redirect("/error");
    }
  },

  ///////////////////////////////////////////////////////wishlist////////////////////////////////////////////////////////
  wishlistGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      req.session.previousUrl = "/wishlist";
      let products = await wishlistHelpers.getWishlistProducts(
        req.session.user._id
      );
      let wishlistCount = null;
      let cartCount = null;
      if (singleUser) {
        wishlistCount = await wishlistHelpers.getWishlistCount(singleUser._id);
        cartCount = await cartHelpers.getCartCount(singleUser._id);
        res.render("user/wishlist", {
          user_files: true,
          user: true,
          singleUser,
          products,
          wishlistCount,
          cartCount,
        });
      }
    } catch (err) {
      res.render("user/cart", {
        user_files: true,
        user: true,
        singleUser,
        products: null,
        wishlistCount: 0,
        cartCount: 0,
      });
    }
  },

  addToWishlist: async (req, res, next) => {
    try {
      let user = req.session.user;
      if (user) {
        await wishlistHelpers
          .addToWishlistFunction(req.params.id, req.session.user._id)
          .then(() => {
            res.json({ add: true });
          })
          .catch(() => {
            res.json({ remove: true });
          });
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  removeFromWishlist: async (req, res, next) => {
    try {
      let user = req.session.user;
      if (user) {
        await wishlistHelpers
          .deleteWishlist(
            req.params.id,
            req.params.wishId,
            req.session.user._id
          )
          .then((response) => {
            res.json({ status: true });
          });
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  removeFromWishlist2: async (req, res, next) => {
    try {
      let user = req.session.user;
      if (user) {
        await wishlistHelpers
          .deleteWishlist2(req.params.id, req.session.user._id)
          .then((response) => {
            res.json({ status: true });
          });
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  ///////////////////////////////////////cart////////////////////////////////////
  addToCart: async (req, res, next) => {
    try {
      let user = req.session.user;
      let proQuantity = await cartHelpers.findCartProdQty(
        req.session.user._id,
        req.params.id
      );
      let productStock = await adminHelpers.findStock(req.params.id);

      if (user) {
        if (productStock === proQuantity) {
          res.json({ maxLimit: true });
        } else {
          cartHelpers
            .addToCartFunction(req.params.id, req.session.user._id)
            .then((response) => {
              res.json({ status: true });
            });
        }
      } else {
        res.json({ status: "login" });
      }
    } catch (error) {
      console.log("Something Wrong in Add To CartGET");
      res.redirect("/error");
    }
  },

  cartGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      req.session.previousUrl = "/cart";
      let products = await cartHelpers.getCartProducts(req.session.user._id);
      let cartCount = null;
      let wishlistCount = null;
      let total = await checkoutHelpers.getTotalAmount(singleUser._id);
      if (singleUser) {
        products.forEach((element) => {
          if (element.Quantity === 1) {
            element.notQuantOne = false;
            console.log("notQuantOne = false");
          } else {
            element.notQuantOne = true;
            console.log("notQuantOne = true");
          }
        });

        cartCount = await cartHelpers.getCartCount(singleUser._id);
        wishlistCount = await wishlistHelpers.getWishlistCount(singleUser._id);
        let isActiveFalseCartCount =
          await cartHelpers.getIsActiveFalseCartCount(singleUser._id);
        res.render("user/cart", {
          user_files: true,
          user: true,
          singleUser,
          products,
          cartCount,
          total,
          wishlistCount,
          isActiveFalseCartCount,
        });
      }
    } catch (err) {
      res.render("user/cart", {
        user_files: true,
        user: true,
        products: null,
        cartCount: 0,
        total: 0,
        wishlistCount: 0,
      });
    }
  },

  changeProductQuantity: async (req, res, next) => {
    try {
      var obj = req.body;
      obj.user = await req.session.user._id;
      cartHelpers
        .changeProductQuantityFunction(obj)
        .then(async (response) => {
          response.totalPriceOfOneProduct =
            await cartHelpers.getTotalPriceOfOneProduct(
              req.session.user._id,
              req.body.product
            );
          response.total = await checkoutHelpers.getTotalAmount(obj.user);
          console.log(
            "totalPriceOfOneProduct= ",
            response.totalPriceOfOneProduct
          );
          res.json(response);
          // res.status(200).send({response:true})
        })
        .catch((response) => {
          if (response.status || response.noStock) {
            res.json({ noStock: true });
          } else {
            res.json({ maxLimitStock: true });
          }
        });
    } catch (error) {
      console.log("Something Went Wrong in Change Prod QTY");
      res.redirect("/error");
    }
  },

  removeFromCart: (req, res, next) => {
    try {
      cartHelpers
        .removeProductFromCart(req.params.id, req.session.user._id)
        .then((response) => {
          res.json({ status: true });
        });
    } catch (error) {
      res.redirect("/error");
    }
  },

  checkoutGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      req.session.previousUrl = "/checkout";
      let total = await checkoutHelpers.getTotalAmount(singleUser._id);
      let products = await cartHelpers.getCartProducts(req.session.user._id);
      let wallet = false;
      if (total <= singleUser.wallet) {
        wallet = true;
      }
      let allSavedAddresses = await userHelpers.getAllSavedAddresses(
        singleUser._id
      );
      console.log("total=", total);
      if (singleUser) {
        let cartCount = await cartHelpers.getCartCount(singleUser._id);
        let wishlistCount = await wishlistHelpers.getWishlistCount(
          singleUser._id
        );
        res.render("user/checkout", {
          user_files: true,
          user: true,
          singleUser,
          cartCount,
          total,
          allSavedAddresses,
          wallet,
          products,
          wishlistCount,
        });
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  placeOrderPost: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      let products = await checkoutHelpers.getCartProductList(req.body.UserId);
      let totalPrice = parseInt(req.body.subTotalAfterDiscount);
      console.log("Total Amount ?Getting After the posting :", req.body);
      checkoutHelpers
        .placeOrder(req.body, products, totalPrice)
        .then(async (orderId) => {
          if (req.body["payment-method"] == "COD") {
            res.json({ codSuccess: true });
          } else if (req.body["payment-method"] == "razorpay") {
            checkoutHelpers
              .generateRazorpay(orderId, totalPrice)
              .then((response) => {
                res.json(response);
              });
          } else if (req.body["payment-method"] == "paypal") {
            console.log("206 = ", totalPrice);
            checkoutHelpers.generatePaypal(totalPrice).then(async (link) => {
              //  let codPlaced = await checkoutHelpers.ordersModel()
              res
                .status(200)
                .send({ success: true, paypalSuccess: true, link });
            });
          } else if (req.body["payment-method"] == "wallet") {
            if (singleUser.wallet >= totalPrice) {
              let wallet = singleUser.wallet - totalPrice;
              let walletUpdate = await userHelpers.updateWallet(
                singleUser._id,
                wallet
              );
              let orderUpdate = await checkoutHelpers.updateOrderStatus(
                orderId
              );
              res.json({ walletSuccess: true });
            }
          }
        });
    } catch (error) {
      res.redirect("/error");
    }
  },

  orderGet: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      req.session.previousUrl = "/order";
      if (singleUser) {
        let orderHistory = await orderHelpers.getOrderDetails(singleUser._id);
        let cartCount = await cartHelpers.getCartCount(singleUser._id);
        let wishlistCount = await wishlistHelpers.getWishlistCount(
          singleUser._id
        );
        orderHistory.forEach((element) => {
          let a = element.date.toISOString().split("T")[0];
          console.log(a);
          element.date = a;
        });
        // res.locals.moment = moment
        console.log("orderHistory=", orderHistory);
        orderHistory.forEach((element) => {
          if (element.status == "Delivered") {
            element.Delivered = true;
          } else if (element.status == "Cancelled") {
            element.Cancelled = true;
          } else if (element.status == "Returned") {
            element.Returned = true;
          }
        });
        res.render("user/order", {
          user_files: true,
          user: true,
          singleUser,
          orderHistory,
          cartCount,
          wishlistCount,
        });
      }
    } catch (error) {
      res.redirect("/error");
    }
  },

  cancelOrderIdGet: (req, res) => {
    try {
      //verifyLogin Required
      userHelpers.orderCancel(req.params.id).then(() => {
        res.redirect("/order");
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  returnOrderIdGet: (req, res) => {
    try {
      //verifyLogin Required
      userHelpers.orderReturn(req.params.id).then(() => {
        res.redirect("/order");
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  orderedProducts: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      let orderId = req.query.id;
      let cartCount = await cartHelpers.getCartCount(singleUser._id);
      let wishlistCount = await wishlistHelpers.getWishlistCount(
        singleUser._id
      );
      let getOrderedProducts = await orderHelpers.getOrderedProductsFunction(
        orderId
      );
      res.render("user/ordered-products", {
        user_files: true,
        user: true,
        singleUser,
        getOrderedProducts,
        cartCount,
        wishlistCount,
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  orderSuccess: async (req, res, next) => {
    try {
      let singleUser = req.session.user;
      let cartCount = await cartHelpers.getCartCount(singleUser._id);
      let wishlistCount = await wishlistHelpers.getWishlistCount(
        singleUser._id
      );
      res.render("user/order-success", {
        user_files: true,
        user: true,
        singleUser,
        cartCount,
        wishlistCount,
      });
    } catch (error) {
      res.redirect("/error");
    }
  },

  verifyPayment: (req, res, next) => {
    checkoutHelpers
      .verifyPayment(req.body)
      .then(() => {
        console.log("req.body===", req.body);
        checkoutHelpers
          .changePaymentStatus(req.body["order[receipt]"])
          .then(() => {
            console.log("order receipt", req.body["order[receipt]"]);
            console.log("success full");
            res.json({ status: true });
          });
      })
      .catch((err) => {
        console.log(err, "is the error in the user.js verify payment");
        res.json({ status: false, errMsg: "payment failed" });
      });
  },

  ///////////////////////////////////////users coupon ////////////////////////////////////////////
  postApplyCoupon: async (req, res) => {
    try {
      let id = req.session.user._id;
      let coupon = req.body.coupon;
      let totalAmount = await cartHelpers.getTotalAmount(req.session.user._id);
      couponHelpers
        .validateCoupon(req.body, id, totalAmount)
        .then((response) => {
          console.log("Enterred to validate", response);
          req.session.couponTotal = response.total;
          console.log("ResTotal:", response.total);
          if (response.success) {
            console.log(response);
            console.log("success");
            res.json({
              couponSuccess: true,
              total: response.total,
              discountValue: response.discountValue,
              coupon,
            });
          } else if (response.couponUsed) {
            res.json({ couponUsed: true });
          } else if (response.couponExpired) {
            console.log("expired");
            res.json({ couponExpired: true });
          } else {
            res.json({ invalidCoupon: true });
          }
        });
    } catch (error) {
      console.log("somthing wrong in Coupon Posted ");
      res.redirect("/error");
    }
  },

  //error-page
  errorPageGet: async (req, res) => {
    let singleUser = req.session.user;
    let cartCount;
    let wishlistCount;
    if (singleUser) {
      cartCount = await cartHelpers.getCartCount(singleUser._id);
      wishlistCount = await wishlistHelpers.getWishlistCount(singleUser._id);
      res.render("user/errorPage", {
        user_files: true,
        user: true,
        singleUser,
        cartCount,
        wishlistCount,
      });
    } else {
      res.render("user/errorPage", {
        user_files: true,
        user: true,
        cartCount: 0,
        wishlistCount: 0,
      });
    }
  },
};

module.exports = userController;
