import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const { videoId } = req.params;
    const userId = req.user._id;

    // 1- Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    // 2- Check if video exists
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    // 3- Check if user already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

    // 4- If like exists → unlike
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Video unliked successfully")
        );
    }

    // 5- Else → create like
    await Like.create({
        video: videoId,
        likedBy: userId
    });

    return res.status(200).json(
        new ApiResponse(200, { liked: true }, "Video liked successfully")
    );
})

const toggleCommentLike = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const isCommentExists = await Comment.exists({ _id: commentId })
    if (!isCommentExists) {
        throw new ApiError(404, "Comment not found")
    }
    
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Comment unliked successfully")
        );
    }

    await Like.create({
        comment: commentId,
        likedBy: userId
    })
    return res.status(200).json(
        new ApiResponse(200, { liked: true }, "Comment liked successfully")
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const { tweetId } = req.params
    const userId = req.user._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const isTweetExists = await Tweet.exists({ _id: tweetId })
    if (!isTweetExists) {
        throw new ApiError(404, "Tweet not found")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Tweet unliked successfully")
        );
    }

    await Like.create({
        tweet: tweetId,
        likedBy: userId
    })
    return res.status(200).json(
        new ApiResponse(200, { liked: true }, "Tweet liked successfully")
    );
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pipeline = [
        // 1- Only likes by current user & only video likes
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $type: "objectId" }
            }
        },
        // 2- Sort by latest liked
        {
            $sort: { createdAt: -1 }
        },
        // 3- Join videos
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        // 4- Unwind video array
        {
            $unwind: "$video"
        },
        // 5- Join video owner
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "video.owner"
            }
        },
        // 6- Unwind owner
        {
            $unwind: "$video.owner"
        },
        // 7- Select only required fields
        {
            $project: {
                _id: 0,
                video: {
                    _id: 1,
                    title: 1,
                    thumbnail: 1,
                    createdAt: 1,
                    owner: {
                        _id: "$video.owner._id",
                        username: "$video.owner.username",
                        avatar: "$video.owner.avatar"
                    }
                }
            }
        },
    ];
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    // Execute aggregation
    const videoAggregation = Like.aggregate(pipeline);
    const videos = await Like.aggregatePaginate(videoAggregation, options);
    console.log('videos', videos);
    
    return res.status(200).json(
        new ApiResponse(200, videos, "Liked videos fetched successfully")
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}