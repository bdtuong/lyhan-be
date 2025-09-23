import { StatusCodes } from "http-status-codes"
import ApiError from "~/utils/ApiError.js"
import { eventModel } from "~/models/eventModel.js"

/**
 * Admin tạo Event
 */
const createNew = async (data, user) => {
  try {
    if (!user.admin) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can create events")
    }

    const newEvent = await eventModel.createNew({
      ...data,
      createdByID: user._id, // chuẩn field với model
    })
    return newEvent
  } catch (error) {
    throw error
  }
}

/**
 * Lấy Event (có phân trang)
 */
const getEventsWithPagination = async (page = 1, pageSize = 10) => {
  try {
    return await eventModel.getEventsWithPagination(page, pageSize)
  } catch (error) {
    throw error
  }
}

/**
 * Lấy chi tiết Event theo ID
 */
const getDetails = async (eventId) => {
  try {
    const event = await eventModel.getDetails(eventId)
    if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "Event not found")
    return event
  } catch (error) {
    throw error
  }
}

/**
 * User tham gia Event
 */
const joinEvent = async (eventId, userId) => {
  try {
    const event = await eventModel.addParticipant(eventId, userId)
    if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "Event not found or join failed")
    return event
  } catch (error) {
    throw error
  }
}

/**
 * User rời Event
 */
const leaveEvent = async (eventId, userId) => {
  try {
    const event = await eventModel.removeParticipant(eventId, userId)
    if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "Event not found or leave failed")
    return event
  } catch (error) {
    throw error
  }
}

/**
 * Search Event theo từ khóa
 */
const searchEvents = async (searchTerm) => {
  try {
    return await eventModel.searchEvents(searchTerm)
  } catch (error) {
    throw error
  }
}

/**
 * Admin xóa Event (soft delete)
 */
const deleteEvent = async (eventId, user) => {
  try {
    if (!user.admin) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can delete events")
    }
    const deleted = await eventModel.deleteEvent(eventId)
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, "Event not found or delete failed")
    return deleted
  } catch (error) {
    throw error
  }
}

/**
 * Admin sửa Event
 */
const updateEvent = async (eventId, data, user) => {
  try {
    if (!user.admin) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can update events")
    }

    const updated = await eventModel.updateOneById(eventId, {
      ...data,
      updatedAt: Date.now(),
    })

    if (!updated) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Event not found or update failed")
    }

    return updated
  } catch (error) {
    throw error
  }
}

export const eventService = {
  createNew,
  getEventsWithPagination,
  getDetails,
  joinEvent,
  leaveEvent,
  searchEvents,
  deleteEvent,
  updateEvent,
}
