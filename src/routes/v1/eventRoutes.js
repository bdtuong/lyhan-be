import express from "express"
import { eventController } from "~/controllers/EventsCollection/eventController.js"
import { middlewareToken } from "~/middlewares/middlewareToken.js"
import { upload } from '~/middlewares/uploadMiddleware.js';

const router = express.Router()

// 🟦 Event routes
router.post(
  "/",
  middlewareToken.verifyTokenAndAdmin, // chỉ admin mới tạo
  upload.array("images", 5),           // ✅ cho phép up tối đa 5 ảnh
  eventController.createNew
)

router.get("/", eventController.getEvents) // Lấy danh sách events (pagination)
router.get("/search", eventController.searchEvents) // Search events
router.get("/:id", eventController.getDetails) // Chi tiết event

router.post(
  "/:id/join",
  middlewareToken.verifyToken,
  eventController.joinEvent
)

router.post(
  "/:id/leave",
  middlewareToken.verifyToken,
  eventController.leaveEvent
)

router.put(
  "/:id",
  middlewareToken.verifyTokenAndAdmin,
  upload.array("images", 5),           // ✅ cho phép update ảnh
  eventController.updateEvent
)

router.delete(
  "/:id",
  middlewareToken.verifyTokenAndAdmin,
  eventController.deleteEvent
)

export const eventRoutes = router
