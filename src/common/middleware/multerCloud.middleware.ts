//~ Assignment 19 ~//

import type { Request } from "express";
import { MulterEnum, StorageEnum } from "./../enum/multer.enum";
import multer from "multer";
import { tmpdir } from "node:os";

const multerCloud = ({
  storageType = StorageEnum.memory,
  filesTypes = MulterEnum.image,
  maxFileSize = 5 * 1024 * 1024,
}: {
  storageType?: StorageEnum;
  filesTypes?: string[];
  maxFileSize?: number;
} = {}) => {
  const storage =
    storageType === StorageEnum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            cb: Function,
          ) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);

            cb(null, uniqueSuffix + "-" + file.originalname);
          },
        });

  function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {
    if (!filesTypes.includes(file.mimetype)) {
      cb(new Error("invalid file type"));
    }
    cb(null, true);
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSize },
  });
  return upload;
};

export default multerCloud;
