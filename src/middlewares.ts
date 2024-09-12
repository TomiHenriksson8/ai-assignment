/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextFunction, Request, Response} from 'express';
import {ErrorResponse} from './types/MessageTypes';
import CustomError from './classes/CustomError';
import {FieldValidationError, validationResult} from 'express-validator';
import fetchData from './lib/fetchData';
import fs from 'fs';
import https from 'https';

const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new CustomError(`🔍 - Not Found - ${req.originalUrl}`, 404);
  next(error);
};

const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  // console.error('errorHandler', chalk.red(err.stack));
  res.status(err.status || 500);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

const validate = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${(error as FieldValidationError).path}`)
      .join(', ');
    next(new CustomError(messages, 400));
    return;
  }
  next();
};

export const validateTopic = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.body.topic || req.body.topic.trim() === '') {
    return next(new Error('Topic is required for generating the thumbnail'));
  }
  next();
};

export const getAiImage = async (
  req: Request<{}, {}, { topic: string }>,
  res: Response<{}, { url: string }>,
  next: NextFunction
) => {
  try {
    const data = {
      model: 'dall-e-2',
      prompt: `A YouTube thumbnail for a video about ${req.body.topic}. Include visuals like ${req.body.topic === 'space' ? 'stars, planets, and astronauts' : req.body.topic} with splash text.`,
      size: '1024x1024',
    };

    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

    const response = await fetchData<{ data: { url: string }[] }>(
      process.env.OPENAI_API_URL + '/v1/images/generations',
      options
    );

    if (!response.data[0].url) {
      throw new Error('Image not generated');
    }

    res.locals.url = response.data[0].url;
    next();
  } catch (error) {
    next(new Error('Image generation failed'));
  }
};

export const saveAiImage = async (
  _req: Request,
  res: Response<{}, { file: string; url: string }>,
  next: NextFunction
) => {
  const imageName = 'thumbnail.png';
  const file = fs.createWriteStream('./uploads/' + imageName);

  if (!res.locals.url) {
    res.locals.file = 'default.png';
    next();
    return;
  }

  https
    .get(res.locals.url, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`Image downloaded from ${res.locals.url}`);
        res.locals.file = imageName;
        next();
      });
    })
    .on('error', (err) => {
      fs.unlink(imageName, () => {
        next(new Error(`Error downloading image: ${err.message}`));
      });
    });
};

export {notFound, errorHandler, validate};
