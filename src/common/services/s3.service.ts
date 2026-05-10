//~ Assignment 18 ~//

import { StorageEnum } from "./../enum/multer.enum";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  AWS_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  SIGNED_URL_EXPIRES_IN,
} from "../../config/config.service";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { APPError } from "../utils/global-error-handler";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

  async createPreSignedUrl({
    path = "General",
    fileName,
    ContentType,
    expiresIn = SIGNED_URL_EXPIRES_IN,
  }: {
    path?: string;
    fileName: string;
    ContentType: string;
    expiresIn?: number;
  }) {
    const Key = `social_media_app/${path}/${randomUUID()}__${fileName}`;
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      ContentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, Key };
  }

  async getFile(Key: string) {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });
    return this.client.send(command);
  }

  async getPreSignedUrl({
    Key,
    expiresIn = SIGNED_URL_EXPIRES_IN,
    download,
  }: {
    Key: string;
    expiresIn?: number;
    download?: string | undefined;
  }) {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      ResponseContentDisposition: download
        ? `attachment; filename="${Key.split("/").pop()}"`
        : undefined,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url;
  }

  async getFiles(folderName: string) {
    const command = new ListObjectsV2Command({
      Bucket: AWS_BUCKET_NAME,
      Prefix: `social_media_app/${folderName}`,
    });
    return this.client.send(command);
  }

  async deleteFile(Key: string) {
    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });
    return this.client.send(command);
  }

  async deleteFiles(Keys: string[]) {
    const keyMapping = Keys.map((k) => {
      return { Key: k };
    });
    const command = new DeleteObjectsCommand({
      Bucket: AWS_BUCKET_NAME,
      Delete: {
        Objects: keyMapping,
      },
    });
    return this.client.send(command);
  }

  async deleteFolder(folderName: string) {
    const data = await this.getFiles(folderName);

    const keyMapping = data.Contents!.map((c) => {
      return c.Key;
    });
    return await this.deleteFiles(keyMapping as string[]);
  }
}
