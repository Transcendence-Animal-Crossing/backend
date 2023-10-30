import { extname } from 'path';
import * as multer from 'multer';

export const multerOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};
