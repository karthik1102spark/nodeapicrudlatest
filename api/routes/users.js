const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User =require('../../model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const dotenv = require('dotenv').config();
const env = dotenv.parsed;

router.post('/create', async (req, res, next)=>{

    // Our register logic starts here
    try {
        // Get user input
        const { first_name, last_name, email, password, blogs } = req.body;
    console.log(req.body);
        // Validate user input
        if (!(email && password && first_name && last_name)) {
          res.status(400).send("All input is requireds");
        }
    
        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ email });
    
        if (oldUser) {
          return res.status(409).send("User Already Exist. Please Login");
        }
    
        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);
    
        // Create user in our database
        const user = await User.create({
          first_name,
          last_name,
          email: email.toLowerCase(), // sanitize: convert email to lowercase
          password: encryptedPassword,
          blogs:[blogs]
        });
    
        // Create token
        const token = jwt.sign(
          { user_id: user._id, email },
          env.TOKEN_KEY,
          {
            expiresIn: "2h",
          }
        );
        // save user token
        user.token = token;
    
        // return new user
        res.status(201).json(user);
      } catch (err) {
        console.log(err);
      }
      // Our register logic ends here
    

})

router.post("/login", async (req, res) => {

    // Our login logic starts here
    try {
      // Get user input
      const { email, password } = req.body;
  
      // Validate user input
      if (!(email && password)) {
        res.status(400).send("All input is required");
      }
      // Validate if user exist in our database
      const user = await User.findOne({ email });
  
      if (user && (await bcrypt.compare(password, user.password))) {
        // Create token
        const token = jwt.sign(
          { user_id: user._id, email },
          env.TOKEN_KEY,
          {
            expiresIn: "2h",
          }
        );
  
        // save user token
        user.token = token;
  
        // user
         res.status(200).json(user);
      }else{
        res.status(400).send("Invalid Credentials");
      }
    } catch (err) {
      console.log(err);
    }
    // Our login logic ends here
  });

module.exports = router;
