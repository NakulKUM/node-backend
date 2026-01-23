import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema= new Schema({
   videoFile: {
      url: {
        type: String,
        required: true
      },
      public_id: {
        type: String,
        required: true
      },
      resource_type: {
        type: String,
        enum: ["video"],
        default: "video"
      }
   },

   thumbnail: {
      url: {
        type: String,
        required: true
      },
      public_id: {
        type: String,
        required: true
      },
      resource_type: {
        type: String,
        enum: ["image"],
        default: "image"
      }
   },

   title: {
      type: String,
      required: true,
   },
   description: {
      type: String,
      required: true,
   },
   duration: {
      type: Number, //Cloudinary
      required: true,
   },
   views: {
      type: Number,
      default: 0,
   },
   isPublished: {
      type: Boolean,
      default: true,
   },
   owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
   }
},{
   timestamps: true,
});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video= mongoose.model("Video", videoSchema);