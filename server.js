var express = require("express");
var mongo = require('mongodb').MongoClient
var dburl = "mongodb://localhost:27017/littleurl";
var app = express();
var urlRegex = /^\/http(s?):\/\/((\w{1,}\.)*\w+)\.(\w{1,3})$/;
var digitRegex = /^\/\d+$/;

app.get(urlRegex, (req, resp)=>{
    var providedUrl = req.url.substr(1);
    
    mongo.connect(dburl, function(err, db) {
        
        if(err) {
            handelError(err, resp);
        }
        
        var urlCollection = db.collection("urls");
        
        urlCollection.find({url: providedUrl}).toArray((err, documents)=>{
            
            if(err) {
                handelError(err, resp);
            }
            
            var result = {};
            if(documents[0]) {
                result.url = documents[0].shortUrl;
                resp.json(result);
                db.close();
            } else {
                var urlId = generateId(1000);
                urlCollection.insert({_id:urlId, url:providedUrl, shortUrl: req.hostname + '/' + urlId}, (err, data)=>{
                    if(err) {
                        handelError(err, resp);
                    }
                    
                    db.close();
                    result.url = data.ops[0].shortUrl;
                    resp.json(result);
                });
            }
        });
    });
}).get(digitRegex, (req,resp)=>{
    var shortUrlId = req.url.substr(1);
    
    mongo.connect(dburl, function(err, db) {
        
        if(err) {
            handelError(err, resp);
        }
        
        var urlCollection = db.collection('urls');
        
        console.log("Query condition " + JSON.stringify({_id:shortUrlId}));
        urlCollection.find({_id:+shortUrlId}).toArray((err, data)=>{
            if(err) {
                handelError(err, resp);
            } 
           
            console.log("Got result " + data.length);
            if(data[0]) {
                resp.redirect(data[0].url);
            } else {
                resp.statusCode = 400;
                resp.send("No match URL found!!");
            }
            db.close();
        });
    });
}).get('/*', (req, resp)=>{
    resp.statusCode = 400;
    resp.send("Invalid request!");
}).listen(8080, ()=>{
    console.log("Server started!");
});

function generateId(range) {
    if(!range) {
        range = 100;
    }
    return Math.floor(Math.random()*range);
}

function handelError(err, resp) {
    console.error(err);
    resp.statusCode = 500;
    resp.send("Server error!!");
}