import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    //  Validate input
    if (!content || !content.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    // Create comment
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet added successfully")
    );
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
    const {page= 1, limit= 10}= req.query;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }

    const isUserExists= await User.exists({_id: userId});
    if(!isUserExists){
        throw new ApiError(400, "User not found")
    }
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip= (pageNumber - 1) * limit;

    // 1- Fetch paginated tweets
    const tweet= await Tweet.find({owner: userId})
    .populate("owner", "_id username avatar")
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limitNumber)

    // 2- Count total tweets
    const totalTweets = await Tweet.countDocuments({ owner: userId });

    // 3- Build pagination metadata
    const pagination = {
        page: pageNumber,
        limit: limitNumber,
        totalItems: totalTweets,
        totalPages: Math.ceil(totalTweets / limitNumber),
        hasNextPage: pageNumber * limitNumber < totalTweets,
        hasPrevPage: pageNumber > 1
    };

    return res.status(200).json(
        new ApiResponse(200, {tweet, pagination}, 'Tweets fetched successfully')
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    // TODO: update tweet
    const {tweetId}= req.params;
    const {content}= req.body;
    if(!content || !content.trim()){
        throw new ApiError(400, "Tweet content is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    // Combination of findById and save -- 2 DB calls but safer
    const tweet= await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    // authorization check
    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not allowed to update this tweet");
    }

    tweet.content= content.trim();
    await tweet.save();

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}= req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet= await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }
    // authorization check
    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not allowed to delete this tweet");
    }
    await Tweet.findOneAndDelete(tweetId)

    return res.status(200).json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}