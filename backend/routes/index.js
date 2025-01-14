const express = require('express');
const router = express.Router();

// Define your main routes here
router.get('/', (req, res) => {
  res.send('Welcome to the API');
});

module.exports = router;
