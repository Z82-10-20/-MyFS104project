const express = require ('express');
const pasth = require("path");
const bcrypt = require('bcrypt');
const collection = require('./config');

const app = express();

app.use(express.json());

app.use(express.urlencoded({extended: false}));

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async(req, res) => {
const data = {
    name: req.body.username,
password: req.body.password
}

const existingUser = await collection.findOne({name: data.name});
if(existingUser) {
res.render("userexisted");
} else {

const saltRounds = 10;
const hashedPassword = await bcrypt.hash(data.password, saltRounds);

data.password = hashedPassword;

    const userdata = await collection.insertMany(data);
    console.log(userdata);

     res.render("success");
}

});

app.post("/login", async(req, res) => {
try{ 
const check = await collection.findOne({name: req.body.username});
if(!check) { 
    res.render("usernotfound");
}

const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
if(isPasswordMatch) {
    res.render("home");
}else { 

    req.render("wrongpassword");
}
}
catch{
res.render("wrongdetail");

}

});


const port = 3000;
app.listen(port, () => {
   console.log(`Server running on Port: ${port}`);
   
})