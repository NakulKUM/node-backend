import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

// GEt All videos---------------------------------------------------------------

const getAllVideos = asyncHandler(async (req, res) => {    
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline = [];
    // Match videos by user if userId is provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }
    // Match videos by query
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        });
    }
    // Sort videos
    if (sortBy && sortType) {
        const sortTypeValue = sortType === 'desc' ? -1 : 1;
        pipeline.push({
            $sort: {
                [sortBy]: sortTypeValue
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }
    // Add lookup for owner details
    pipeline.push({
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
    }, {
        $unwind: "$ownerDetails"
    });

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videoAggregation = Video.aggregate(pipeline);
    const videos = await Video.aggregatePaginate(videoAggregation, options);
    return res.status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});


// Publish Video-----------------------------------------------------


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!videoFile) {
        throw new ApiError(500, "Failed to upload video file to Cloudinary");
    }
    if (videoFile.resource_type !== "video") {
        await deleteFromCloudinary(videoFile.public_id, "video");
        throw new ApiError(400, "Uploaded file must be a video file");
    }

    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }
    if (thumbnail.resource_type !== "image") {
        await deleteFromCloudinary(thumbnail.public_id, "image");
        throw new ApiError(400, "Uploaded file must be an image file");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id,
            resource_type: videoFile.resource_type,
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id,
            resource_type: thumbnail.resource_type,
        },
        duration: videoFile.duration,
        owner: req.user?._id,
    });

    return res.status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

// Get Video-----------------------------------------------------

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video= await Video.findById(videoId);
    return res.status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))
})

// Update Video-----------------------------------------------------

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId")
  }

  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to update this video")
  }

  const updateData = {}

  if (title) updateData.title = title
  if (description) updateData.description = description

  if (req.file?.path) {
    const thumbnail = await uploadOnCloudinary(req.file.path)
    if (!thumbnail) {
      throw new ApiError(400, "Error while uploading thumbnail")
    }
    updateData.thumbnail = {
        url: thumbnail.secure_url,
        public_id: thumbnail.public_id,
        resource_type: thumbnail.resource_type
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData },
    { new: true }
  )

  return res.status(200).json(
    new ApiResponse(200, updatedVideo, "Video updated successfully")
  )
})

// Delete Video-----------------------------------------------------

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, 'Invalid video Id')
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // delete video and thumbnail from cloudinary
    if(video.videoFile.public_id) {
        await deleteFromCloudinary(video.videoFile.public_id, 'video');
    }
    if(video.thumbnail.public_id) {
        await deleteFromCloudinary(video.thumbnail.public_id, 'image');
    }

    // delete DB record
    await Video.findByIdAndDelete(videoId);

    return res.status(200)
        .json(new ApiResponse(200, {}, 'Video deleted successfully'))
})

// Toggle isPublished----------------------------------------------------

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video= await findOne({_id: videoId, owner: userId});
    if(!video){
        throw new ApiError(404, "Video not found or you are not authorized to perform this action");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Publish status toggled successfully")
    );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}