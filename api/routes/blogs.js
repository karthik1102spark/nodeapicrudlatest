const express = require('express')
const router = express.Router()
const Product =require('../models/products')
const mongoose = require('mongoose')
var multer  = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage })
router.get('/', (req, res, next)=>{
    Product.find().then( (docs)=>{
        console.log('list')

        const response = {
            count: docs.length,
            products: docs.map( (docs)=>{
                return{
                    name: docs.name,
                    price: docs.price,
                    _id: docs._id,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/products/'+docs._id
                    }
                }
            })
        }

        res.json( 
            {
                status: true,
               data: response
            }
        )

        // res.status(200).json( 
        //     {
        //         status: true,
        //         count: docs.length,
        //         data: docs
        //     }
        // )
    }).catch( (err)=>{
        res.json( 
            {
                status: false,
                message: err.message
            }
        )
    }  )
})

router.post('/',  upload.single('profile-file'),(req, res, next)=>{


     // req.file is the `profile-file` file
  // req.body will hold the text fields, if there were any
  console.log(JSON.stringify(req.file))
  var response = '<a href="/">Home</a><br>'
  response += "Files uploaded successfully.<br>"
  response += `<img src="${req.file.path}" /><br>`
res.send(response)

    // let sampleFile;
    // let uploadPath;
  
    // if (!req.files) {
    //   return res.status(400).send('No files were uploaded.');
    // }
  
    // // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    // sampleFile = req.files.image;
    // uploadPath = 'http://localhost:3000/node-rest-shop-crud/product-images/' + sampleFile.name;
  
    // // Use the mv() method to place the file somewhere on your server
    // sampleFile.mv(uploadPath, function(err) {
    //   if (err)
    //     return res.status(500).send(err);
  
    //   res.send('File uploaded!');
    // });

   
    const product = new Product({

        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        image: 'dd'
    })

    product.save().then(  (results)=>{
        res.status(200).json({message: 'Handling Get request to products',createdProduct: product})
 
        console.log(results)
    }).catch((err)=>{
        res.json({
            status: false,
            data: err
        })
        console.log(err)
    })
})

router.get('/:productId', (req, res, next)=>{
    const id = req.params.productId
    Product.findById(id).exec()
        .then(  (doc)=>{
            console.log(doc)
           
            if(doc){
                res.json({
                    status: true,
                    data: doc
                })
            }
            else{
                res.status(404).json({message: 'No valid entry found for provided   ID'})
            }
        })
        .catch( (err)=>{
            console.log(err)
            res.status(500).json({ error: err})
        })
         
})

router.patch('/:productId', (req, res, next)=>{
    const id = req.params.productId 
    const updateOps = {}
    console.log('11111updateOps',req.body);

    // for(const ops of req.body){
    //     updateOps[ops.propName] = ops.value
    // }
console.log('updateOps',updateOps)

    Product.findByIdAndUpdate( id, req.body,{new:true}).exec().then( (result)=>{
        console.log(result)
        res.json({
            status: true,
            data: result
        })
    } ).catch( (err)=>{
        res.json({
            status: false,
            data: error 
        })
    })

})

router.delete('/:productId', (req, res, next)=>{
    const id = req.params.productId
    Product.remove({_id: id}).exec().then(  (result)=>{
        res.json({
            status: true,
            data: result
        })
    }).catch( (error)=>{
        res.json(  {
            status: false,
            data: error
        })
    }  )

})

module.exports = router;