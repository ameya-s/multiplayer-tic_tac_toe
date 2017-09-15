const express = require('express'),
    path = require('path');

// Initiate express object
const app = new express();

// Serve static files from public directory
app.use(express.static('public'));

// Start server on port 3001
app.listen(3001, () => {
    console.log('server started at port: 3001');
});

// Handle Get at root
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'index.html'));
});
