const cron = require('node-cron');
const express = require('express');
const nodemailer = require('nodemailer');
const prompt = require('prompt-sync')();
const nightmare = require('nightmare')();
const app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({
    extended: true
}));

app.listen(process.env.PORT || 3000);

app.use(express.static(__dirname));

app.get('/', function (req, resp) {
    resp.sendFile('index.html', { root: __dirname });
});

app.post('/', function (req, resp) {
    var tmp = JSON.parse(JSON.stringify(req.body));
    go(tmp);
    resp.send("Email will be sent!");
});


function go(tmp) {
    const url = tmp.url;
    const myPrice = tmp.myPrice;
    const email = tmp.email;
    const pswrd = tmp.pswrd;
    const reciever = tmp.reciever;


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass: pswrd
        }
    });

    const mailOptions = {
        from: email,
        to: reciever,
        subject: 'HURRYYYY!!! Price dropped',
        text: `The price of your product ${url} has dropped below ${myPrice}... Grab the deal before the sale ends!`
    };
    //sendIt(transporter, mailOptions);
    const task = cron.schedule('*/10 * * * * *', () => compare(transporter, mailOptions, myPrice, url, task));
}

function sendIt(transporter, mailOptions) {
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

async function compare(transporter, mailOptions, myPrice, url, task) {
    try {
        const priceStr = await nightmare.goto(url)
            .wait("#priceblock_ourprice")
            .evaluate(() => document.getElementById("priceblock_ourprice").innerText);

        const actualPrice = parseInt(priceStr.substring(1));

        if (actualPrice < myPrice) {
            console.log("Price Is Low");
            task.stop();
            sendIt(transporter, mailOptions);
        } else {
            console.log("It is still expensive");
        }

    } catch (e) {
        throw e;
    }
}

