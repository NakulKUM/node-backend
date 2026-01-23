import multer from 'multer';
import path from "path";
import crypto from "crypto";


// }
const storage= multer.diskStorage({
   destination: function (req, file, cb){
      cb(null, "./public/temp")
   },
   filename: function (req, file, cb) {
     const uniqueName = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
     cb(null, uniqueName);
   }
})

export const upload = multer({storage: storage})

