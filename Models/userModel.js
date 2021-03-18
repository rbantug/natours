const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, 'a name is required'],
    minlength: [10, 'The name should be more or equal 10 characters'],
    maxlength: [30, 'The name should be less or equal 30 characters'],
    validate: {
      validator: function (val) {
        const newString = val.split(' ').join('');
        return validator.isAlpha(newString);
      },
      message: 'Your name should only contain characters',
    },
  },
  email: {
    type: String,
    required: [true, 'An email is required'],
    unique: true,
    lowercase: true, // email in the new document will be in lowercase
    validate: {
      validator: function (val) {
        return validator.isEmail(val);
      },
      message: 'Please use a valid email address.',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg' 
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Please specify your role',
    },
    required: true,
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A password is required'],
    minlength: [8, 'Your password must be at least 8 characters.'],
    select: false, // Important! When we do a collection.find(), password will not show up. But it will show up on collection.create()
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password '],
    validate: {
      // This only works on CREATE & SAVE, not on update. 'this' keyword will not work on GET operations such as 'findByIdAndUpdate()'. Mongoose does not keep the document when using update. Our pre-save hook will not work because they need 'this' to work.
      validator: function (val) {
        return val === this.password;
      },
      message: 'The passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

///////////////////////////////
// Encrypting the password using document middleware
///////////////////////////////

userSchema.pre('save', async function (next) {
  // this middleware will run if there were changes in the password
  if (process.env.NODE_ENV === 'LOADER') return next();
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// this.isModified() is a method from mongoose that checks if the string we pass thru the method was changed because we saved/created a new/existing document

// 'bcrypt.hash' is a async method. Let's use async/await.

// '12' is the salt. Salt is random data that is used as an additional input to a one-way function that hashes data, a password or passphrase.Salts are used to safeguard passwords in storage. The higher the number, the more complex the password will be at the expense of more processing power.

// We don't need passwordConfirm in our database. We already have our encrypted password. After the validation, we'll remove the content of passwordConfirm by assign 'undefined' to it.

userSchema.pre('save', function (next) {
  if (process.env.NODE_ENV === 'LOADER') return next();
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// 'this.isNew' will return a boolean and it will check if 'this' is a new document. The pre save hook we created here will update the passwordChangedAt if the password was recently modified.
// We subtracted 1 second (1000ms) from Date.now() because there are situations where saving the document in the database is slower than creating the JWT. If the JWT was created BEFORE saving the document in the database, there will be an error because we don't want the password to be modified after creating the JWT.

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// This query middleware will filter documents with 'active: {$ne: false}'. 

// 'this' refers to the query or the result of query method.

// /^find/ is a regex that will match all find queries that we might use.

// for some reason, 'this.find()' does not work if we add async/await. The documentation also shows that it doesn't use async/await for the query methods in the query middleware.

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Regarding instanced methods --> We can create an instanced method that will be present in all documents. 'correctPassword' can be any word, we just want to call it that.

// 'bcrypt.compare' will accept 2 parameters. It will compare the candidatePassword, which is the unencrypted password from login, and userPassword, which is the encrypted password from the database. bcrypt will convert the candidatePassword to its encrypted form and compare the 2 passwords.

// bcrypt.compare returns a boolean.

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeToMillisec = this.passwordChangedAt.getTime() / 1000;
    //console.log(changeToMillisec, JWTTimestamp);
    return JWTTimestamp < changeToMillisec;
  }
  return false;
};

// 'this' refers to the current document where this instanced method will be used.
// If there was a change in the password after the token was issued, the document will not a 'passwordChangedAt' field and this function will return 'false'.
// If there was a change in the password after the token was issued, the document will have the 'passwordChangedAt' field and it will be higher than the JWT time stamp. This function will return 'true'.
// '.getTime()' converts passwordChangedAt to milliseconds

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 600000; // 10 minutes
  return resetToken;
};

// crypto is a module available in nodeJS. randomBytes() will specify the number of bytes to generate or the length.
// We will convert the resetToken to a hash because we can't save unencrypted data in the database.
// In '.createHash()', we will specfiy what algorithm will be used to create the hash object. '.update()' is where the token is stored. '.digest()' will convert the token to whatever radix you like -- the radix or base is the number of unique digits, including the digit zero, used to represent numbers.
// we will create a new field in our schema, passwordResetToken, to store the hash object we created.

const User = mongoose.model('User', userSchema);

module.exports = User;
