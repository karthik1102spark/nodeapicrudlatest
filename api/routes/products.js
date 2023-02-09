const express = require('express')
const router = express.Router()


const Product =require('../models/products')

const mongoose = require('mongoose')

router.get('/', (req, res, next)=>{
    Product.find().exec().then( (docs)=>{
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
    }).catch( (err)=>{
        res.json( 
            {
                status: false,
                message: err.message
            }
        )
    }  )
})

router.post('/', (req, res, next)=>{

   
    const product = new Product({

        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price
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

    for(const ops of req.body){
        updateOps[ops.propName] = ops.value
    }


    Product.update( { _id: id}, {$set: updateOps} ).exec().then( (result)=>{
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