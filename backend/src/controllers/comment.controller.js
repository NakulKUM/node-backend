import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $sort: { createdAt: -1 } // newest first
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: "$ownerDetails",
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  const options = {
    page: Number(page),
    limit: Number(limit)
  };

  const aggregation = Comment.aggregate(pipeline).option({ lean: true });
  const comments = await Comment.aggregatePaginate(aggregation, options);

  return res.status(200).json(
    new ApiResponse(200, comments, "Comments fetched successfully")
  );
});


const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  // 1- Validate input
  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // 2- Check if video exists
  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  // 3- Create comment
  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id
  });

  return res.status(201).json(
    new ApiResponse(201, comment, "Comment added successfully")
  );
});


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}= req.params;
    const {content}= req.body;
    if(!content || !content.trim()){
      throw new ApiError(400, "Comment content is required")
    }

    if(!isValidObjectId(commentId)){
      throw new ApiError(400, "Invalid comment id")
    }
    // Combination of findById and save -- 2 DB calls but safer
    const comment= await Comment.findById(commentId);
    if(!comment){
      throw new ApiError(404, "Comment not found")
    }

    //  authorization check
    if (!comment.owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content= content.trim();
    await comment.save();

    // const updatedComment= await Comment.findByIdAndUpdate(
    //   commentId,
    //   {$set: {content: content}},
    //   {new: true}
    // )

    return res.status(200).json(
      new ApiResponse(200, comment, "Comment updated")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}= req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    //  authorization check
    if (!comment.owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await Comment.findOneAndDelete(commentId);
    return res.status(200).json(
      new ApiResponse(200, null, "Comment deleted successfully")
    )
})

export { getVideoComments, addComment, updateComment, deleteComment}