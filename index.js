"use strict";

var stringValidator = require('validator');
var _ = require('lodash');
var required = require('./validators/required');
var email = require('./validators/email');
var numeric = require('./validators/numeric');
var image = require('./validators/image');

/*
 * Rules should have format:
 * {
 *   name        : ['required']
 *   officeEmail : ['email'],
 *   phone       : ['required', 'numeric']
 * }
 *
 * Example input:
 * { name: 'Sendy', title: 'Lord', officeEmail: 'invalid email', phone: 'hi there123'}
 *
 * messageObj will be like this
 * {
 *   officeEmail: {
 *     email: 'OfficeEmail must be email'
 *   }
 *   phone: {
 *     number: 'Phone must be numeric'
 *   }
 * }
 *
 */


var validation = {
  required: required.validator,
  numeric: numeric.validator,
  email: email.validator,
  image: image.validator
};

var validationMessages = {
  required: required.message,
  numeric: numeric.message,
  email: email.message,
  image: image.message
};

var ValidationMessage = function ValidationMessage() {
  this.messageArray = [];
};

function getValidationMessage(ruleObj, propertyName, val) {
  var compiled = _.template(validationMessages[ruleObj.fullName]);

  propertyName = _.startCase(propertyName);

  return compiled({
    propertyName: propertyName,
    ruleName: ruleObj.fullName,
    ruleParams: ruleObj.params,
    value: val
  });
}

function validate(rules, obj) {
  var result = true;
  var messageObj = new ValidationMessage();

  // loop through the given rules
  _.forEach(rules, function(ruleArray, propertyName) {
    var val = obj[propertyName];
    // ruleArray should be something like ['required', 'email']
    ruleArray.forEach(function(ruleName) {
      var splitted = ruleName.split(':');
      var ruleObj = {
        // full name is the generic full name of validation rule e.g range:1:3 -> range:$1:$2, required -> required
        fullName: splitted[0],

        // get only the first part of full rule e.g if range:1:3 then we will get 'range'
        name: splitted[0],

        // get the rule params if e.g range:0:3 -> [1, 3]
        params: splitted.slice(1)
      };

      _.forEach(ruleObj.params, function(v, k) {
        ruleObj.fullName += ':$' + (k + 1).toString();
      });

      if (!validation[ruleObj.fullName](val, ruleObj, propertyName, obj)) {
        result = false;
        // set messageObj initial value
        messageObj[propertyName] = messageObj[propertyName] || {};
        // set the validation message
        var msg = getValidationMessage(ruleObj, propertyName, val);
        messageObj[propertyName][ruleObj.fullName] = msg;
        messageObj.messageArray.push(msg);
      }
    });
  });

  return {
    success: result,
    messages: messageObj
  };
}

var validator = {
  validate: validate,
  validation: validation,
  addCustomValidation: function(ruleName, fn) {
    validation[ruleName] = fn;
  },
  setValidationMessage: function(ruleName, message) {
    validationMessages[ruleName] = message;
  }
};


exports = module.exports = validator;