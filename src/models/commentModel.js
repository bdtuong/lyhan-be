import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';
// Define Collection (name & schema)

const COMMENT_COLLECTION_NAME = 'comments';
const COMMENT_COLLECTION_SCHEMA = Joi.object({
  // optional có thể thêm lượt like sau
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  boardID: Joi.required(),
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  author: Joi.required(),
  content: Joi.string().required().min(1),
  username: Joi.string().required(),
  slug: Joi.string().trim().strict(),
  upvote: Joi.number().default(0),
  downvote: Joi.number().default(0),
  votes: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string()
          .pattern(OBJECT_ID_RULE)
          .message(OBJECT_ID_RULE_MESSAGE),
        type: Joi.string().valid('up', 'down'),
        createdAt: Joi.date().default(Date.now),
      }),
    )
    .default([]),

  // bắt buộc
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
});

const validateBeforeCreate = async data => {
  return await COMMENT_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createComment = async data => {
  try {
    const validData = await validateBeforeCreate(data);
    const createdComment = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .insertOne(validData);

    return createdComment;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async id => {
  try {
    return await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    throw new Error(error);
  }
};
// querry aggregate để lấy thông tin về
const getDetails = async id => {
  try {
    return await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            _destroy: false,
          },
        },
        {
          $lookup: {
            from: CommentModel.COMMENT_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'commentId',
            as: 'authorComments',
          },
        },
      ])
      .toArray();
  } catch (error) {
    throw new Error(`Error in getDetails: ${error.message}`);
  }
};

const updateOneById = async (id, updateData) => {
  try {
    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }, // Trả về document sau khi đã cập nhật
      );
    return result.value; // Trả về document đã được cập nhật
  } catch (error) {
    throw new Error(error);
  }
};

const deleteOneById = async (commentId) => {
  try {
    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .findOneAndDelete(
        { _id: new ObjectId(commentId) }
      );
    
    return result
    
    // if (result.value) {
    //   // Document was deleted successfully.  Show notification.
    //   showNotification("Comment deleted successfully!"); // Call your notification function
    //   return true; // Indicate success (optional)
    // } else {
    //   // Document not found.  You might choose to show a different notification or handle it silently.
    //   // Example:
    //   // showNotification("Comment not found."); // Or don't show anything.
    //   return false; // Indicate failure (optional)
    // }

  } catch (error) {
    console.error("Error deleting comment:", error);
    showNotification("Error deleting comment: " + error.message, "error"); // Show error notification
    return false; // Indicate failure
  }
};


// // Example notification function (replace with your actual implementation):
// function showNotification(message, type = "success") {
//   // Use your preferred notification library or method here.
//   if (type === "success") {
//     alert(message); // Simple alert for demonstration.  Use a better method in production.
//   } else {
//     alert("Error: " + message); // Example error notification
//   }
// }


// How to use:
// const isDeleted = await deleteOneById("theObjectIdString");

// if (isDeleted) {
//   // Further actions after successful deletion (if needed)
// } else {
//   // Handle deletion failure (if needed)
// }

export const CommentModel = {
  COMMENT_COLLECTION_NAME,
  COMMENT_COLLECTION_SCHEMA,
  createComment,
  findOneById,
  getDetails,
  updateOneById,
  deleteOneById

};
