import express from 'express';
import { boardValidation } from '~/validations/boardValidation.js';
import { boardController } from '~/controllers/PostsCollection/boardController.js';
import { upload } from '~/middlewares/uploadMiddleware.js';

const Router = express.Router();

// 🟢 Lấy danh sách boards
Router.route('/')
  .get(boardController.getBoards)
  .post(
    upload.array('images', 5),
    boardValidation.createNew,
    boardController.createNew
  );

// 🆕 Lấy danh sách posts theo hashtag (?tag=#exsh&page=1&pageSize=10)
Router.route('/by-hashtag').get(boardController.getBoardsByHashtag);

// 🆕 Lấy danh sách posts theo userId (?page=1&pageSize=10)
Router.route('/user/:userId').get(boardController.getBoardsByUser);

// 🟢 Search posts
Router.route('/search/content').get(boardController.searchPosts);

// 🟢 Lấy danh sách bài share theo userId
Router.route('/shareDetails/:userId').get(boardController.getSharedPostsDetails);

// 🟢 Lấy danh sách bài đã lưu theo userId
Router.route('/saveDetails/:userId').get(boardController.getSavedPostsDetails);

// 🟢 Share post
Router.route('/:boardId/share').post(boardController.shareBoard);

// 🟢 Save post
Router.route('/:boardId/save').post(boardController.saveBoard);

// 🟢 Xoá bài đã lưu
Router.route('/delete-savedpost/:userId/:postId').put(boardController.deleteSavedPost);

// 🟢 Xoá post thật sự
Router.route('/delete-post/:postId').delete(boardController.deletePost);

// 🟢 Toggle like/unlike (để dưới cùng trước getDetails)
Router.route('/:id/like').post(boardController.toggleLike);

// 🟢 Lấy chi tiết board theo id (⚠️ để CUỐI CÙNG)
Router.route('/:id').get(boardController.getDetails);

export const boardRoute = Router;
