import express from 'express';
import { boardValidation } from '~/validations/boardValidation.js';
import { boardController } from '~/controllers/PostsCollection/boardController.js';
import { upload } from '~/middlewares/uploadMiddleware.js';
// import { requireAuth, requireAdmin } from '~/middlewares/auth.js'; // 🔒 Khuyến nghị

const Router = express.Router();

// 🟢 Lấy danh sách boards (?page=&includePending=)
Router.route('/')
  .get(boardController.getBoards)
  .post(
    upload.array('images', 5),
    boardValidation.createNew,
    boardController.createNew
  );

// 🆕 Lấy danh sách posts theo hashtag (?tag=&page=&pageSize=&includePending=)
Router.route('/by-hashtag').get(boardController.getBoardsByHashtag);

// 🆕 Lấy danh sách posts theo userId (?page=&pageSize=&includePending=)
Router.route('/user/:userId').get(boardController.getBoardsByUser);

// 🟢 Search posts (?q=&includePending=)
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

// 🟢 Update post (content/images)
Router.route('/update-post/:postId').put(
  upload.array('images', 5),
  boardController.updateBoard
);

/* 🆕 KIỂM DUYỆT */
// Duyệt bài: đặt isPending=false
Router.route('/:id/approve').patch(
  // requireAuth, requireAdmin, // 🔒 Khuyến nghị
  boardController.approve
);

// Đặt trạng thái pending tuỳ ý: body { isPending: boolean }
Router.route('/:id/pending').patch(
  // requireAuth, requireAdmin, // 🔒 Khuyến nghị
  boardController.setPending
);

// 🟢 Lấy chi tiết board theo id (⚠️ để CUỐI CÙNG, hỗ trợ ?includePending=)
Router.route('/:id').get(boardController.getDetails);

export const boardRoute = Router;
