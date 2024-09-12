import { Request, Response } from 'express';

export const generateThumbnail = (req: Request, res: Response) => {
  return res.status(200).json({
    message: 'Thumbnail generated successfully',
    file: res.locals.file
  });
};
