const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('node:crypto')
const e = require('express')

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide valid email',
    ],
  },
  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please add an email'],
    minlength: 6,
    select: false, // when we add user, it is not going to show password
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Encrypt password using bcryptjs
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  var token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
  return token
}

// Match user entered password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = async function () {
  // Generate Token with node:crypto
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash token and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hext')

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

UserSchema.methods.sendForgotPasswordEmail = async function (message) {
  const nodemailer = require('nodemailer')
  let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    tls: {
      ciphers: 'SSLv3',
    },
    auth: {
      user: 'kipack.jeong@outlook.com',
      pass: 'A92112720181004a!?',
    },
  })
  let info = await transporter.sendMail(
    {
      from: '"Kipack Jeong" <kipack.jeong@outlook.com>',
      to: `kipack.jeong@outlook.com, raphilo92@gmail.com, ${this.email}`,
      subject: `Password reset link for ${this.name}`,
      text: `Looks like you forgot your email ${this.name}, \n following is the link to reset your email.`,
      html: `<b>Looks like you forgot your email ${this.name}, \n following is the link to reset your email.</b>`,
    },
    function (error, info) {
      if (error) {
        console.log(error)
      }
      console.log(info)
    },
  )
}

module.exports = mongoose.model('User', UserSchema)