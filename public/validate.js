const { Router } = require("express");

var nameError = document.getElementById("name-error");
var emailError = document.getElementById("email-error");

function validateName() {
  var name = document.getElementById("name").value.trim();

  if (name.length == 0) {
    nameError.innerHTML = "Name is Required";
    nameError.style.color = "red";
    return false;
  }

  if (!name.match(/^[A-Za-z ]*$/)) {
    nameError.innerHTML = "Write a FullName";
    nameError.style.color = "red";
    return false;
  }

  if (name.length < 3) {
    nameError.innerHTML = "Enter minimum 3 charactors";
    nameError.style.color = "red";
    return false;
  }

  nameError.innerHTML = "Name is valid";
  nameError.style.color = "green";
  return true;
}

function validateEmail() {
  var email = document.getElementById("email").value.trim();
  if (email.length == 0) {
    emailError.innerHTML = "Email is Required";
    emailError.style.color = "red";
    return false;
  }

  if (
    !email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    emailError.innerHTML = "Email is Invalid";
    emailError.style.color = "red";
    return false;
  }
  emailError.innerHTML = "Email is valid";
  emailError.style.color = "green";
  return true;
}

jQuery_1_7_1(document).on("submit", "form", function (e) {
  if (validateName() && validateEmail()) {
  } else {
    e.preventDefault();
    alert("Invalid data!");
    return false;
  }
});
