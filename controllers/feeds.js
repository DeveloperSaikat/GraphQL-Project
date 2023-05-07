const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    Post.find()
        .countDocuments()
        .then(count => {
            totalItems: count
            return Post.find()
                        .skip((currentPage - 1) * perPage).limit(perPage)
        })
        .then(posts => {
            res.status(200).json({
                message: 'Successful',
                posts: posts,
                totalItems 
            })
        }).catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500
            }
            next(err);
        })
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    
    const title = req.body.title;
    const content = req.body.content;
    let creator;

    const newPost = new Post({ //creating a mongoose object which gives access to all the mongoose methods
        title: title,
        content: content,
        creator: req.userId
    })

    newPost.save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(newPost);
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'Post created successfully',
                post: newPost,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            })
        })    
        .catch( err => {
            if(!err.statusCode) {
                err.statusCode = 500
            }
            next(err);
        })
    
}

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Could not find this post');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'Post retrieved',
                post: post
            })
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500
            }
            next(err);
        })
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);// getting the errors if generated

    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;

    Post.findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            if(post.creator.toString() !== req.userId) {
                const error = new Error('Not authorised');
                error.statusCode = 403;
                throw error;
            }
            post.title = title;
            post.content = content;

            return post.save();
        })
        .then(result => {
            res.status(200).json({
                message: 'Post updated',
                post: result
            })
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500
            }
            next(err);
        })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }

            if(post.creator.toString() !== req.userId) {
                const error = new Error('Not authorised');
                error.statusCode = 403;
                throw error;
            }
            return Post.findByIdAndRemove(postId);
        })
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            console.log(result);
            res.status(200).json({
                message: 'Deleted Successfully'
            })
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500
            }
            next(err);
        })
}