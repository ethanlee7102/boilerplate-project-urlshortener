require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const shortid = require('shortid');
const {URL} = require('url');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true, unique: true }
});

const UrlModel = mongoose.model("Url", urlSchema);
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl", async function(req, res){
  let {url} = req.body;

  try{
    let parsedUrl = new URL(url);
    dns.lookup(parsedUrl.hostname, async (err) => {
      if(err){
        return res.json({error: 'invalid url'});
      }

      let existingUrl = await UrlModel.findOne({original_url: url})
      if (existingUrl){
        return res.json({original_url: existingUrl.original_url, short_url: existingUrl.short_url});
      }

      const short_url = shortid.generate();
      const newUrl =  new UrlModel({original_url: url, short_url: short_url});
      newUrl.save();

      res.json({original_url: url, short_url: short_url});
    });
  }
  catch(error){
    return res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:shortid', async function(req, res){
  try{
    const shortenedUrl = await UrlModel.findOne({short_url: req.params.shortid});
    if (shortenedUrl){
      return res.redirect(shortenedUrl.original_url);
    }
    else{
      return res.json({ error: 'No short URL found' });
    }
  } catch(error){
    return res.json({ error: 'Server error' });
  }
});
// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
