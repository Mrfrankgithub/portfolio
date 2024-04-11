const express = require("express");
const Joi = require('joi');
const bcrypt = require("bcrypt");
const session = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


const app = express();
const port = 4000;


//you can only communicate with a server using routes
//each route must define a http protocol: GET, POST, PUT, PATCH, DELETE

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'hcbebiuewhlfuwhefioewo;ijiwejijifweiiijeij747y7y4y4hyhnvnohoouh4hiv',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
    store: new PrismaSessionStore(
        new PrismaClient(),
        {
            checkPeriod: 2 * 60 * 1000,  //ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }
    )
}));


app.get('/', function (req, res) {
    res.render("index");
});


app.get('/about', function (req, res) {
    res.render("about");
});

app.get('/form', function (req, res) {
    res.render("form");
});


app.post("/validate", (req, res) => {

    const schema = Joi.object({
        fullname: Joi.string().required(),
        email: Joi.string().email().required(),
        message: Joi.string().required()
    });

    const validate = schema.validate(req.body);
    if (validate.error) {
        res.send(validate.error.message);
    } else {
        res.send("validation passed")
    }
});


app.get("/register", (req, res) => {
    res.render("register");
});

//FOR REGISTERING USER
app.post("/reguser", async (req, res) => {

    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).max(200)
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.json({
                error: result.error.message
            });
        }

        //check if email already exist
        const users = await prisma.users.findMany({
            where: {
                email: req.body.email
            }
        });


        if (users.length > 0) {
            return res.json({
                error: "Email already exist"
            });
        }

        await prisma.users.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: bcrypt.hashSync(req.body.password, 10)
            }
        });

        return res.redirect('/register');


    } catch (error) {
        return res.send(error);
    }
});

app.get("/log", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {


    //SKIPPED INPUT VALIDADION: TO BE DONE LATER


    // FIRST CHECK IF THE EMAIL IS IN DATABASE
    const users = await prisma.users.findMany({
        where: {
            email: req.body.email
        }
    });

    if (users.length == 0) {
        return res.send("Account not found")
    }

    const foundUser = users[0];
    const passwordInDatabase = foundUser.password;
    const enteredPassword = req.body.password;

    // return res.json({
    //     passwordInDatabase, enteredPassword
    // });

    const compare = bcrypt.compareSync(enteredPassword, passwordInDatabase);
    if (compare == true) {
        //login the user
        req.session.userId = foundUser.id;
        return res.send("Your session id is " + req.session.userId);
    } else {
        return res.send("Password incorrect");
    }

});



app.get("/dashboard", (req, res) => {
    return res.send("Your session id is " + req.session.id);
});



app.post('/submit', async function (req, res) {

    try {
        await prisma.contacts.create({
            data: {
                fullname: req.body.name,
                email: req.body.email,
                message: req.body.message
            }
        });

        res.status(200).json({
            serverResponse: "Message received"
        });
    } catch (error) {

        console.error(error)
        res.status(500).json({
            error: error
        })
    }
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});


// app.listen(port, function(){
//     console.log("Listening on port " + port);
// });
