import { StatusCodes } from "http-status-codes"
import { eventService } from "~/services/eventService.js"
import { v2 as cloudinary } from "cloudinary"

/**
 * POST /events
 * Admin tạo event
 */
const createNew = async (req, res, next) => {
  try {
    const user = req.user // đã được attach từ middleware
    const { title, description, startTime, endTime, location } = req.body

    // kiểm tra sơ bộ
    if (!title || title.length < 3) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Title phải >= 3 ký tự" })
    }
    if (!description || description.length < 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Description phải >= 5 ký tự" })
    }
    if (!startTime || !endTime) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "startTime và endTime là bắt buộc" })
    }

    // ✅ Upload ảnh lên Cloudinary (giống post)
    let imageUrls = []
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "events" })
      )
      const results = await Promise.all(uploadPromises)
      imageUrls = results.map((r) => r.secure_url)
    }

    const payload = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      images: imageUrls,
      createdByID: user._id,
    }

    const createdEvent = await eventService.createNew(payload, user)
    res.status(StatusCodes.CREATED).json(createdEvent)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /events?page=1&pageSize=10
 * Lấy danh sách event có phân trang
 */
const getEvents = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const events = await eventService.getEventsWithPagination(
      parseInt(page),
      parseInt(pageSize)
    )
    res.status(StatusCodes.OK).json(events)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /events/:id
 * Lấy chi tiết event
 */
const getDetails = async (req, res, next) => {
  try {
    const event = await eventService.getDetails(req.params.id)
    res.status(StatusCodes.OK).json(event)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /events/:id/join
 * User tham gia event
 */
const joinEvent = async (req, res, next) => {
  try {
    const event = await eventService.joinEvent(req.params.id, req.user._id)
    res.status(StatusCodes.OK).json(event)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /events/:id/leave
 * User rời event
 */
const leaveEvent = async (req, res, next) => {
  try {
    const event = await eventService.leaveEvent(req.params.id, req.user._id)
    res.status(StatusCodes.OK).json(event)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /events/search?q=keyword
 * Tìm kiếm event
 */
const searchEvents = async (req, res, next) => {
  try {
    const { q } = req.query
    const results = await eventService.searchEvents(q)
    res.status(StatusCodes.OK).json(results)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /events/:id
 * Admin sửa event
 */
const updateEvent = async (req, res, next) => {
  try {
    const user = req.user
    const { startTime, endTime, location, ...rest } = req.body

    let updateData = { ...rest }

    if (startTime && endTime) {
      updateData.startTime = new Date(startTime)
      updateData.endTime = new Date(endTime)
    }
    if (location) updateData.location = location

    // ✅ nếu có ảnh mới thì upload lại Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "events" })
      )
      const results = await Promise.all(uploadPromises)
      updateData.images = results.map((r) => r.secure_url)
    }

    const updated = await eventService.updateEvent(req.params.id, updateData, user)
    res.status(StatusCodes.OK).json(updated)
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /events/:id
 * Admin xóa event
 */
const deleteEvent = async (req, res, next) => {
  try {
    const deleted = await eventService.deleteEvent(req.params.id, req.user)
    res.status(StatusCodes.OK).json(deleted)
  } catch (error) {
    next(error)
  }
}

export const eventController = {
  createNew,
  getEvents,
  getDetails,
  joinEvent,
  leaveEvent,
  searchEvents,
  updateEvent,
  deleteEvent,
}
