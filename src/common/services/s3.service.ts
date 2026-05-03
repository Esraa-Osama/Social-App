//~ Assignment 17 ~//

import { StorageEnum } from "./../enum/multer.enum";
import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  AWS_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../config/config.service";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { APPError } from "../utils/global-error-handler";
import { Upload } from "@aws-sdk/lib-storage";

export class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile({
    ACL = ObjectCannedACL.private,
    path = "General",
    file,
    storageType = StorageEnum.memory,
  }: {
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
    storageType?: StorageEnum;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      ACL,
      Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,
      Body:
        storageType === StorageEnum.memory
          ? file.buffer
          : fs.createReadStream(file.path),
      ContentType: file.mimetype,
    });

    if (!command.input.Key) {
      throw new APPError("failed to upload file");
    }

    await this.client.send(command);
    return command.input.Key;
  }

  async uploadLargeFile({
    ACL = ObjectCannedACL.private,
    path = "General",
    file,
    storageType = StorageEnum.disk,
  }: {
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
    storageType?: StorageEnum;
  }): Promise<string> {
    const command = new Upload({
      client: this.client,
      params: {
        Bucket: AWS_BUCKET_NAME,
        ACL,
        Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,
        Body:
          storageType === StorageEnum.memory
            ? file.buffer
            : fs.createReadStream(file.path),
        ContentType: file.mimetype,
      },
    });

    const result = await command.done();

    command.on("httpUploadProgress", (progress) => {
      console.log(progress);
    });

    return result.Key as string;
  }

  async uploadFiles({
    ACL = ObjectCannedACL.private,
    path = "General",
    files,
    storageType = StorageEnum.memory,
    isLarge = false,
  }: {
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[];
    storageType?: StorageEnum;
    isLarge?: boolean;
  }): Promise<string[]> {
    let urls: string[] = [];

    if (isLarge) {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadLargeFile({ file, path, storageType, ACL });
        }),
      );
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadFile({ file, path, storageType, ACL });
        }),
      );
    }
    return urls;
  }
}
