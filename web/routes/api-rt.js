var express = require('express');
var router = express.Router();

// GET users listing.
router.get('/users', function(req, res) {
	res.send('get');
});

// Create user
router.post('/users', function(req, res) {
	res.send('post');
});

// Retrieve user
router.get('/users/:id', function(req, res) {
	res.send('get');
});

// Update user
router.put('/users/:id', function(req, res) {
	res.send('put');
});

// Delete user
router.delete('/users/:id', function(req, res) {
	res.send('delete');
});

module.exports = router;
