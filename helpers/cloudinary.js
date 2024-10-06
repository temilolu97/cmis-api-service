const cloudinary = require('cloudinary').v2;


cloudinary.config({
    cloud_name: 'temmylolu',
    api_key: '382253137368647',
    api_secret: 'IsOKQ9EdY0LLLwdpu1nPgX6DU9M' // Click 'View API Keys' above to copy your API secret
});


module.exports = cloudinary