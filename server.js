const express = require('express');
require('dotenv').config();
const multer = require('multer');// Specially For handling with file input
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');//For Hashing the password


//Importing File
const File = require('./models/File');

const app = express();
app.use(express.urlencoded({ extented: true }));
const upload = multer({dest: 'uploads'}); //This middleware creates a uploads folder and stores the file we want to send in it
const PORT = process.env.PORT;


app.set('view engine','ejs');

app.get("/", (req, res) => {
    res.render("index")
  })
  
  app.post("/upload", upload.single("file"), async (req, res) => {
    const fileData = {
      path: req.file.path,
      originalName: req.file.originalname,
    }
    if (req.body.password != null && req.body.password !== "") {
      fileData.password = await bcrypt.hash(req.body.password, 10)
    }
  
    const file = await File.create(fileData)
  
    res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
  })
  
  app.route("/file/:id").get(handleDownload).post(handleDownload)
  
  async function handleDownload(req, res) {
    const file = await File.findById(req.params.id)
  
    if (file.password != null) {
      if (req.body.password == null) {
        res.render("password")
        return
      }
  
      if (!(await bcrypt.compare(req.body.password, file.password))) {
        res.render("password", { error: true })
        return
      }
    }
  
    file.downloadCount++
    await file.save()
    console.log(file.downloadCount)
  
    res.download(file.path, file.originalName)
}

/*DATABASE CONNECTION */
mongoose.connect(process.env.DATABASE_URL,()=>{
    console.log('Database connected')
});





app.listen(PORT,() => {
    console.log(`Listening on PORT ${PORT}`);
});