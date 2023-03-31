const express = require("express");
var userHelpers = require("../helpers/user-helpers");
var adminHelpers = require("../helpers/admin-helpers");
var cartHelpers = require("../helpers/cart-helpers");
var checkoutHelpers = require("../helpers/checkout-helpers");
var orderHelpers = require("../helpers/order-helpers");
var chartHelpers = require("../helpers/chart-helpers");
var couponHelpers = require("../helpers/coupon-helpers");
var categoryOfferHelpers = require("../helpers/category-offer-helpers");
var productOfferHelpers = require("../helpers/product-offer-helpers");
var bannerManagementHelpers = require("../helpers/banner-management-helpers");
const fs = require("fs");

const adminController = {
  adminloginGet: (req, res, next) => {
    let admin = req.session.admin;
    if (admin) {
      res.redirect("/admin/admin-dashboard");
    } else {
      res.render("admin/admin-login", {
        admin_files: true,
        loginErr: req.session.loginErr,
      });
      loginErr = false;
    }
  },

  adminloginPost: (req, res, next) => {
    adminHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.admin = response.admin;
        res.redirect("/admin/admin-dashboard");
      } else {
        req.session.loginErr = "Invalid Username or Password";
        res.redirect("/admin");
      }
    });
  },

  adminLogout: (req, res, next) => {
    req.session.admin = null;
    req.session.loggedIn = false;
    req.session.loginErr = null;
    res.redirect("/admin");
  },

  // adminDashboard: (req, res, next) => {
  //   res.render("admin/admin-dashboard", { admin_files: true, admin: true });
  // },

  adminUserManagement: (req, res, next) => {
    adminHelpers.getAllUsers().then((users) => {
      let admin = req.session.admin;
      if (admin) {
        res.render("admin/admin-user-management", {
          admin_files: true,
          admin: true,
          users,
        });
      } else {
        res.redirect("/admin");
      }
    });
  },

  blockStatus: (req, res, next) => {
    adminHelpers.changeStatus(req.query.id).then((response) => {
      admin_msg = response;
      res.redirect("/admin/admin-user-management");
    });
  },

  adminProductManagement: async (req, res, next) => {
    let categoryList = await adminHelpers.getAllCategory();

    adminHelpers.getAllProducts().then((productList) => {
      productList.forEach(async (element) => {
        let categoryName = await adminHelpers.getCategory(element.Category);
        if (categoryName) {
          element.categoryName = categoryName.Category;
        }
      });

      res.render("admin/admin-product-management", {
        admin_files: true,
        admin: true,
        productList,
        categoryList,
      });
    });
  },

  adminAddProductGet: (req, res, next) => {
    adminHelpers.getAllCategory().then((categoryList) => {
      res.render("admin/admin-add-product", {
        admin_files: true,
        admin: true,
        categoryList,
      });
    });
  },

  adminAddProductPost: (req, res, next) => {
    adminHelpers.addProduct(req.body).then((id) => {
      let image_1 = req.files.Image1;
      let image_2 = req.files.Image2;
      let image_3 = req.files.Image3;
      let image_4 = req.files.Image4;

      image_1.mv(`./public/product-images/${id}.jpg`, (err, done) => {});
      image_2.mv(`./public/product-images/${id}2.jpg`, (err, done) => {});
      image_3.mv(`./public/product-images/${id}3.jpg`, (err, done) => {});
      image_4.mv(`./public/product-images/${id}4.jpg`, (err, done) => {});
      res.redirect("/admin/admin-product-management");
    });
  },

  adminEditProductGet: async (req, res, next) => {
    let categoryList = await adminHelpers.getAllCategory();
    adminHelpers.getProductDetails(req.params.id).then((productDetails) => {
      res.render("admin/admin-edit-product", {
        admin_files: true,
        admin: true,
        productDetails,
        categoryList,
      });
    });
  },

  adminEditProductPost: (req, res, next) => {
    let id = req.query.id;
    adminHelpers.updateProduct(id, req.body).then(async (response) => {
      try {
        if (req.files.Image1) {
          let image_1 = req.files.Image1;
          await image_1.mv(`./public/product-images/${id}.jpg`, (err, done) => {
            if (err) {
              console.warn(err);
            } else {
              console.log("success");
            }
          });
        }
        if (req.files.Image2) {
          let image_2 = req.files.Image2;
          await image_2.mv(
            `./public/product-images/${id}2.jpg`,
            (err, done) => {
              if (err) {
                console.warn(err);
              } else {
                console.log("success");
              }
            }
          );
        }
        if (req.files.Image3) {
          let image_3 = req.files.Image3;
          await image_3.mv(
            `./public/product-images/${id}3.jpg`,
            (err, done) => {
              if (err) {
                console.warn(err);
              } else {
                console.log("success");
              }
            }
          );
        }
        if (req.files.Image4) {
          let image_4 = req.files.Image4;
          await image_4.mv(
            `./public/product-images/${id}4.jpg`,
            (err, done) => {
              if (err) {
                console.warn(err);
              } else {
                console.log("success");
              }
            }
          );
        }
        res.redirect("/admin/admin-product-management");
      } catch (err) {
        console.log("error");
        res.redirect("/admin/admin-product-management");
      }
    });
  },

  adminDeleteProduct: (req, res, next) => {
    let productId = req.params.id;
    adminHelpers.deleteProduct(productId).then((response) => {
      res.redirect("/admin/admin-product-management");
    });
  },

  adminCategoryManagement: (req, res, next) => {
    adminHelpers.getAllCategory().then((categories) => {
      if (categories) {
        res.render("admin/admin-category-management", {
          admin_files: true,
          admin: true,
          categories,
        });
      }
    });
  },

  adminAddCategoryGet: (req, res, next) => {
    res.render("admin/admin-add-category", {
      admin_files: true,
      admin: true,
      categoryErr: false,
    });
  },

  adminAddCategoryPost: (req, res, next) => {
    adminHelpers.addCategory(req.body).then((response) => {
      if (response) {
        res.redirect("/admin/admin-category-management");
      } else {
        res.render("admin/admin-add-category", {
          admin_files: true,
          admin: true,
          categoryErr: true,
        });
      }
    });
  },

  adminEditCategoryGet: (req, res, next) => {
    adminHelpers.getCategoryDetails(req.params.id).then((category) => {
      res.render("admin/admin-edit-category", {
        admin_files: true,
        admin: true,
        category,
      });
    });
  },

  adminEditCategoryPost: (req, res, next) => {
    adminHelpers.updateCategory(req.params.id, req.body).then((response) => {
      res.redirect("/admin/admin-category-management");
    });
  },

  adminDeleteCategory: (req, res, next) => {
    let categoryId = req.params.id;
    adminHelpers.deleteCategory(categoryId).then((response) => {
      res.redirect("/admin/admin-category-management");
    });
  },

  adminOrderManagementGet: async (req, res, next) => {
    await orderHelpers.getAllOrderDetails().then((allOrderDetails) => {
      allOrderDetails.forEach((element) => {
        if (element.status == "Delivered") {
          element.Delivered = true;
        } else if (element.status == "Cancelled") {
          element.Cancelled = true;
        } else if (element.status == "Returned") {
          element.Returned = true;
        }
      });
      res.render("admin/admin-order-management", {
        admin_files: true,
        admin: true,
        allOrderDetails,
      });
    });
  },

  orderViewDetailsGet: async (req, res) => {
    const id = req.params.id;
    let viewDetails = await orderHelpers.getSingleOrderDetails(id);
    viewDetails.date = viewDetails.date.toISOString().split("T")[0];
    res.render("admin/order-details", {
      admin_files: true,
      admin: true,
      viewDetails,
    });
  },

  editStatusPost: async (req, res, next) => {
    console.log("edit status post- req.params.id: ", req.params.id);
    console.log("edit status post- req.body.status", req.body.status);
    orderHelpers.productStatus(req.params.id, req.body.status).then(() => {
      res.redirect("/admin/admin-order-management");
    });
  },

  ///////////////////////////////////banner management//////////////////////////////////////////////////////

  bannerManagementGet: async (req, res, next) => {
    try {
      let allHeadBanners = await bannerManagementHelpers.getAllHeadBanners();
      let allExclusiveDeals =
        await bannerManagementHelpers.getAllExclusiveDeals();
      res.render("admin/banner-management", {
        admin_files: true,
        admin: true,
        allExclusiveDeals,
        allHeadBanners,
      });
    } catch (error) {
      console.log("Something wrong with the banner management");
    }
  },

  headBannerGet: (req, res, next) => {
    try {
      res.render("admin/add-head-banner", { admin_files: true, admin: true });
    } catch (error) {
      console.log("something is wrong with the head banner");
    }
  },

  headBannerPost: (req, res, next) => {
    bannerManagementHelpers.addHeadBanner(req.body).then((id) => {
      let image_1 = req.files.Image1;

      image_1.mv(`./public/users/img/hero/${id}.jpg`, (err, done) => {});

      res.redirect("/admin/banner-management");
    });
  },

  editHeadBannerGet: async (req, res, next) => {
    bannerManagementHelpers.getHeadBanner(req.params.id).then((headBanner) => {
      res.render("admin/edit-head-banner", {
        admin_files: true,
        admin: true,
        headBanner,
      });
    });
  },

  editHeadBannerPost: (req, res, next) => {
    let id = req.params.id;
    bannerManagementHelpers
      .updateHeadBanner(id, req.body)
      .then(async (response) => {
        try {
          if (req.files.Image1) {
            let image_1 = req.files.Image1;
            await image_1.mv(
              `./public/users/img/hero/${id}.jpg`,
              (err, done) => {
                if (err) {
                  console.warn(err);
                } else {
                  console.log("success");
                }
              }
            );
          }
          res.redirect("/admin/banner-management");
        } catch (error) {
          console.log(error);
          res.redirect("/admin/banner-management");
        }
      });
  },

  deleteHeadBanner: (req, res) => {
    try {
      let id = req.params.id;
      bannerManagementHelpers.toDeleteHeadBanner(id).then(() => {
        // Specify the path of the image you want to delete
        const imagePath = `./public/users/img/hero/${id}.jpg`;

        // Use the fs.unlink() method to delete the image file
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("Image deleted successfully!");
          }
        });

        res.sendStatus(204);
      });
    } catch (error) {
      console.log(error);
      res.redirect("/admin/banner-management");
    }
  },

  addExclusiveDealGet: (req, res, next) => {
    adminHelpers.getAllProducts().then((products) => {
      if (products) {
        res.render("admin/exclusive-deals-add-product", {
          admin_files: true,
          admin: true,
          products,
        });
      } else {
        res.render("admin/exclusive-deals-add-product", {
          admin_files: true,
          admin: true,
        });
      }
    });
  },

  addExclusiveDealPost: (req, res, next) => {
    try {
      let products = adminHelpers.getAllProducts();
      bannerManagementHelpers.addExclusiveDeal(req.body).then((response) => {
        if (response) {
          res.redirect("/admin/banner-management");
        } else {
          res.render("admin/exclusive-deals-add-product", {
            admin_files: true,
            admin: true,
            products,
          });
        }
      });
    } catch (error) {
      console.log("Error adding exclusive deal");
    }
  },

  editExclusiveDealGet: async (req, res, next) => {
    try {
      let dealId = req.params.id;
      let exclusiveDeal = await bannerManagementHelpers.getExclusiveDeal(
        dealId
      );
      await adminHelpers.getAllProducts().then((products) => {
        if (products) {
          res.render("admin/exclusive-deals-edit-product", {
            admin_files: true,
            admin: true,
            products,
            exclusiveDeal,
          });
        } else {
          res.render("admin/exclusive-deals-edit-product", {
            admin_files: true,
            admin: true,
          });
        }
      });
    } catch (error) {
      console.log("Error at edit exclusive deal page: ", error);
    }
  },

  editExclusiveDealPost: (req, res, next) => {
    const id = req.params.id;
    try {
      bannerManagementHelpers.updateDealPostFn(id, req.body).then(() => {
        res.redirect("/admin/banner-management");
      });
    } catch (error) {
      console.log(error);
    }
  },

  deleteExclusiveDeal: (req, res) => {
    const id = req.params.id;
    try {
      bannerManagementHelpers.deleteExclusiveDealFn(id).then(() => {
        res.sendStatus(204);
      });
    } catch (error) {
      console.log(error);
    }
  },

  ////////////////////////// Dashboard ////////////////////////////////
  adminDashboardGet: async (req, res) => {
    //verifyLogin1
    let Users = await userHelpers.totUsers();
    let Products = await userHelpers.totProducts();
    let Orders = await userHelpers.totOrders();
    let Revenue = await chartHelpers.graphdata();
    let totalRevenue;

    if (Revenue.yearlySales.length > 0 && Revenue.yearlySales[0].total) {
      totalRevenue = Revenue.yearlySales[0].total;
    } else {
      totalRevenue = 0;
    }

    res.render("admin/admin-dashboard", {
      admin_files: true,
      admin: true,
      Users,
      Products,
      Orders,
      totalRevenue,
    });
  },

  adminDashboardGetday: async (req, res) => {
    await chartHelpers.findOrdersByDay().then((data) => {
      res.json(data);
    });
  },

  adminDashboardPostDataGraph: async (req, res) => {
    console.log("308");
    await chartHelpers.graphdata().then((data) => {
      console.log("dfd");
      console.log(data, "post data graph");
      res.json({ data });
    });
  },

  /////////////////////////////////coupon/////////////////////////////////

  getlistCoupon: async (req, res) => {
    let coupons = await couponHelpers.getAllCoupons();
    res.render("admin/list-coupon", {
      admin_files: true,
      admin: true,
      coupons,
    });
  },

  getAddCoupon: (req, res) => {
    res.render("admin/add-coupon", { admin_files: true, admin: true });
  },

  postAddCoupon: (req, res) => {
    couponHelpers.addCoupon(req.body).then(() => {
      res.redirect("/admin/list-coupon");
    });
  },

  DeleteCouponDelete: (req, res) => {
    console.log("57222");
    // let userId = req.session.user._id
    let id = req.body.couponId;
    couponHelpers.deleteCoupon(id).then((response) => {
      res.status(200).send({ response: true });
    });
  },

  //////////////////////////////////////Category Offers/////////////////////////////////////////////////
  getCategoryOffer: async (req, res, next) => {
    try {
      let category = await adminHelpers.getAllCategory();
      let allOfferCategory = await categoryOfferHelpers.getAllCatOffers();
      res.render("admin/category-offer", {
        admin_files: true,
        admin: true,
        category,
        allOfferCategory,
      });
    } catch (error) {
      console.log("somthing wrong in Add Category offer");
    }
  },

  getCategoryAddOffer: async (req, res, next) => {
    let category = await adminHelpers.getAllCategory();
    res.render("admin/category-add-offer", {
      admin_files: true,
      admin: true,
      category,
    });
  },

  postCategoryAddOffer: (req, res, next) => {
    try {
      console.log("category req.body = ", req.body);
      categoryOfferHelpers
        .addCategoryOffer(req.body)
        .then(() => {
          res.redirect("/admin/category-offer");
        })
        .catch(() => {
          req.session.offerExist = "offer for this category is already added";
          res.redirect("/admin/category-offer");
        });
    } catch (error) {
      console.log("somthing wrong in  Add Category offer ");
    }
  },

  getEditCategoryOffer: async (req, res, next) => {
    try {
      let data = await categoryOfferHelpers.getCatOfferDetails(req.params.id);
      let category = await adminHelpers.getAllCategory();
      res.render("admin/category-edit-offer", {
        admin_files: true,
        admin: true,
        category,
        data,
      });
    } catch (error) {
      console.log("Somthing wrong in editCategory Offer ");
    }
  },

  postEditCategoryOffer: (req, res, next) => {
    try {
      console.log("///////////////////Hasyoooooo//////////////", req.body);
      let id = req.params.id;
      categoryOfferHelpers.editedCatOffer(id, req.body).then(() => {
        console.log("Ivide eththeetund");
        res.redirect("/admin/category-offer");
      });
    } catch (error) {
      console.log("Somthing wrong in editCategory Offer");
    }
  },

  deleteCategoryOffer: (req, res, next) => {
    categoryOfferHelpers
      .deleteCategoryOfferFunction(req.params.id)
      .then((response) => {
        res.redirect("/admin/category-offer");
      });
  },

  //////////////////////////////////////Product Offers/////////////////////////////////////////////////
  getProductOffer: async (req, res, next) => {
    try {
      let allOfferProducts = await productOfferHelpers.getAllProductOffers();
      res.render("admin/product-offer", {
        admin_files: true,
        admin: true,
        allOfferProducts,
      });
    } catch {
      console.log("Somthing wrong in getProducOffer");
    }
  },

  getProductAddOffer: async (req, res, next) => {
    try {
      let products = await adminHelpers.getAllProducts();
      res.render("admin/product-add-offer", {
        admin_files: true,
        admin: true,
        products,
      });
    } catch {
      console.log("Something wrong in getProductAddOffer");
    }
  },

  postProductAddOffer: (req, res, next) => {
    try {
      console.log("product req.body = ", req.body);
      productOfferHelpers
        .addProductOffer(req.body)
        .then(() => {
          res.redirect("/admin/product-offer");
        })
        .catch(() => {
          req.session.offerExist = "offer for this product is already added";
          res.redirect("/admin/product-offer");
        });
    } catch (error) {
      console.log("somthing wrong in postProductAddOffer");
    }
  },

  getProductOfferEdit: async (req, res, next) => {
    try {
      let products = await adminHelpers.getAllProducts();
      let data = await productOfferHelpers.getProdOfferDetails(req.params.id);
      res.render("admin/product-edit-offer", {
        admin_files: true,
        admin: true,
        data,
        products,
      });
    } catch (error) {
      console.log("Somthing wrong with Edit Product Offer ");
    }
  },

  postProductOfferEdit: (req, res, next) => {
    console.log("edit proOffer: ", req.params.id);
    console.log("edit proOffer: ", req.body);
    productOfferHelpers.editProdOffer(req.params.id, req.body).then(() => {
      res.redirect("/admin/product-offer");
    });
  },

  deleteProductOffer: (req, res, next) => {
    productOfferHelpers.deleteProdOffer(req.params.id).then(() => {
      res.redirect("/admin/product-offer");
    });
  },

  ///////////////////////////////////////////Sales-report///////////////////////////////////////////
  getSalesReport: async (req, res, next) => {
    let salesData = await adminHelpers.salesReport();
    console.log("salesData: ", salesData);
    res.render("admin/sales-report", {
      admin_files: true,
      admin: true,
      salesData,
    });
  },
};

module.exports = adminController;
