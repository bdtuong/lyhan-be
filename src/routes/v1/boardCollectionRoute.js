import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { boardCollectionValidation } from '~/validations/boardCollectionValidation.js';
import { boardCollectionController } from '~/controllers/PostsCollection/boardCollectionController.js';

const Router2 = express.Router();

Router2.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: API get list boards' });
  })
  .post(
    boardCollectionValidation.createNew,
    boardCollectionController.createNew,
  );

Router2.route('/:id').get(boardCollectionController.getDetails).put;

export const boardCollectionRoute = Router2;
