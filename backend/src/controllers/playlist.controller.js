import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body;
    
    if (!name || !description || !name.trim() || !description.trim()) {
        throw new ApiError(400, "Name and description are required");
    }
    const playlist= await Playlist.create({
        name: name.trim(),
        description: description.trim(), 
        owner: req.user?._id
    })
    if(!playlist){
        throw new ApiError(500, "Failed to create playlist")
    }
    return res.status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
        throw new ApiError(404, "User not found");
    }

    const playlists = await Playlist.find({ owner: userId })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    );
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            options: { sort: { createdAt: -1 } } // sort videos
        });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const userId = req.user?._id;

    // 1- Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId");
    }

    // 2- Find playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // 3- Authorization check
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not allowed to modify this playlist");
    }

    // 4- Check video exists
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    // 5- Prevent duplicate
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(409, "Video already exists in playlist");
    }

    // 6- Add video
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});


// const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
//     const { playlistId, videoId } = req.params;
//     const userId = req.user?._id;

//     if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
//         throw new ApiError(400, "Invalid playlistId or videoId");
//     }

//     const playlist = await Playlist.findById(playlistId);
//     if (!playlist) {
//         throw new ApiError(404, "Playlist not found");
//     }

//     if (playlist.owner.toString() !== userId.toString()) {
//         throw new ApiError(403, "You are not allowed to modify this playlist");
//     }

//     const videoIndex = playlist.videos.findIndex(
//         (vid) => vid.toString() === videoId
//     );

//     if (videoIndex === -1) {
//         throw new ApiError(404, "Video not found in playlist");
//     }

//     playlist.videos.splice(videoIndex, 1);
//     await playlist.save();

//     return res.status(200).json(
//         new ApiResponse(200, playlist, "Video removed from playlist successfully")
//     );
// });


// Another good approach
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId");
    }

    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: userId, videos: videoId },
        { $pull: { videos: videoId } },
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(404, "Playlist or Video not found or you are not authorized to perform this action");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});


// const deletePlaylist = asyncHandler(async (req, res) => {
//     const {playlistId} = req.params
//     const userId= req.user._id;
//     // TODO: delete playlist
//     if (!isValidObjectId(playlistId)){
//         throw new ApiError(400, "Invalid playlistId");
//     }

//     const playlist = await Playlist.findById(playlistId);
//     if (!playlist) {
//         throw new ApiError(404, "Playlist not found");
//     }

//     if (playlist.owner.toString() !== userId.toString()) {
//         throw new ApiError(403, "You are not allowed to modify this playlist");
//     }

//     await Playlist.findByIdAndDelete(playlistId);
//     return res.status(200).json(
//         new ApiResponse(200, playlist, "Playlist deleted successfully")
//     );
// })

// Another good approach
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    const playlist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: userId,
    });

    if (!playlist) {
        throw new ApiError( 404, "Playlist not found or you are not authorized to delete it");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    );
});


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    const userId= req.user._id;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }
    if(!name || !description || !name.trim() || !description.trim()){
        throw new ApiError(400, "Name and Description are required")
    }

    const updatedPlaylist= await Playlist.findOneAndUpdate(
        {_id: playlistId, owner: userId},
        {name: name.trim(), description: description.trim()},
        {new: true}
    )

    if(!updatedPlaylist){
        throw new ApiError(404, "Playlist not found or you are not authorized to update it")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated succussfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}