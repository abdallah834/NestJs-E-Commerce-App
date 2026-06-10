import type { NextFunction, Request, Response } from 'express';

export const defaultLanguage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // console.log(
  //   (req.headers['accept-language'] = req.headers['accept-language'] ?? 'en'),
  // );
  next();
};
