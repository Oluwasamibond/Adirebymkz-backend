const cloudinary = require("cloudinary").v2;

// const cloud_name =  process.env.CLOUDINARY_CLOUD_NAME
// const api_key = process.env.CLOUDINARY_API_KEY
// const  api_secret = process.env.CLOUDINARY_API_SECRET

cloudinary.config({
    cloud_name: 'di2jzztul',
    api_key: '841973262831719',
    api_secret : 'JGCskPUxtw-M1ZzuhjMBUWOvb1k' ,

 
});

const opts = {
    overwrite: true,
    invalidated: true,
    resource_type: "auto",
}

module.exports = (image) => {
  return new Promise ((resolve, reject) => {
    cloudinary.uploader.upload(image, opts, (error, result) => {
        if(result && result.secure_url){
            return resolve(result.secure_url)
        }
        return reject({message: error.message})
    })
  })
};
