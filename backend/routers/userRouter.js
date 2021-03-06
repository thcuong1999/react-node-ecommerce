const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const data = require("../data");
const User = require("../models/userModel");
const { generateToken, isAuth, isAdmin, sendMail } = require("../utils");
const Profile = require("../models/profileModel");
const jwt = require("jsonwebtoken");

const userRouter = express.Router();
//=== ADMIN
//=== Admin Signin
userRouter.post(
  "/admin/signin",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(401)
        .send({ message: "Invalid email, please try again !" });
    else {
      // If not admin, return
      if (!user.isAdmin)
        return res.status(401).send({ message: "Sorry, you aren't admin !" });

      // user exist then check password
      const pwdMatch = bcrypt.compareSync(req.body.password, user.password);
      if (!pwdMatch)
        return res
          .status(401)
          .send({ message: "Password doesn't match, please try again !" });
    }

    // If everything OK
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  })
);

userRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    try {
      const userFullInfo = await User.find({
        _id: { $ne: req.user._id }, // not equal to admin id
      }).populate("profile");
      res.status(200).send(userFullInfo);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  })
);

userRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    try {
      const userToDel = await User.findById(req.params.id);
      if (userToDel) {
        if (userToDel.profile) {
          // Find and delete profile in Profile model first
          await Profile.findByIdAndDelete(userToDel.profile);
        }
        // No profile then just delete user in User model
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        res.send(deletedUser);
      } else {
        res.send({ msg: "User Not Found !" });
      }
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  })
);
//=== /ADMIN

userRouter.get(
  "/seed",
  expressAsyncHandler(async (req, res) => {
    const createdUsers = await User.insertMany(data.users);
    res.send(createdUsers);
  })
);

//=== User signin
userRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user)
      return res
        .status(401)
        .send({ message: "Invalid email, please try again !" });
    else {
      // If exist then check if email is confirm
      // If no, send a message
      if (user.status === "pending") {
        return res
          .status(401)
          .send({ message: "Pending Account. Please Verify Your Email!" });
      }
      // If yes
      const pwdMatch = bcrypt.compareSync(req.body.password, user.password);
      if (!pwdMatch)
        return res
          .status(401)
          .send({ message: "Password doesn't match, please try again !" });
    }

    // If everything OK
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  })
);

//=== User register
userRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    // name, email, password
    // check email
    const existUser = await User.findOne({ email: req.body.email });
    if (existUser)
      return res.status(409).send({
        message: "Email is already taken, please try another email !",
        success: false,
      });

    // else, create new user
    const code = jwt.sign(
      { email: req.body.email },
      process.env.SECRET_KEY || "mytopsecret"
    );

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
      isAdmin: false,
      confirmationCode: code,
    });

    const createdUser = await user.save();

    // Send mail
    const email = createdUser.email;
    const subject = "Please confirm your account";
    const html = `<h1>Email Confirmation</h1>
        <h2>Hello ${createdUser.name}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=http://localhost:3003/confirm/${createdUser.confirmationCode}> Click here</a>
        </div>`;

    sendMail(email, subject, html);

    res.send({
      message:
        "User was registered successfully! Please check your email for confirmation.",
      success: true,
    });

    // res.send({
    //   _id: createdUser._id,
    //   name: createdUser.name,
    //   email: createdUser.email,
    //   isAdmin: createdUser.isAdmin,
    //   token: generateToken(createdUser),
    // });
  })
);

userRouter.put(
  "/change-password",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const currentPwd = req.body.currentPwd;
    const newPwd = req.body.newPwd;
    const user = await User.findById(req.user._id);
    // check current password
    if (!bcrypt.compareSync(currentPwd, user.password))
      return res
        .status(401)
        .send({ message: "Current password doesn't match !" });

    // New password can not be the same with current password
    if (newPwd === currentPwd)
      return res.status(401).send({
        message: "New password must be different from current password!",
      });

    // find and update password
    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
      password: bcrypt.hashSync(newPwd, 8),
    });

    res.send({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser),
    });
  })
);

module.exports = userRouter;
