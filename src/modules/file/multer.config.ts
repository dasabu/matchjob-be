import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import fs from 'fs';
import { diskStorage } from 'multer';
import path, { join } from 'path';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  getProjectRootPath = () => {
    return process.cwd();
  };

  createDirectoryIfNotExists(targetDirectory: string) {
    fs.mkdir(targetDirectory, { recursive: true }, (error) => {
      if (!error) {
        return;
      }
      switch (error.code) {
        case 'EEXIST':
          // Error: Requested location already exists, but it's not a directory.
          console.error(
            `Error: Path exists but is not a directory - ${targetDirectory}`,
          );
          break;
        case 'ENOTDIR':
          // Error: The parent hierarchy contains a file with the same name as the dir you're trying to create.
          console.error(
            `Error: Parent path contains a file with the same name - ${targetDirectory}`,
          );
          break;
        default:
          // Some other error like permission denied.
          console.error(`Error creating directory ${targetDirectory}:`, error);
          break;
      }
    });
  }

  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        // directory store uploaded files
        destination: (req, file, cb) => {
          const folder = req?.headers?.folder_type ?? 'default';
          this.createDirectoryIfNotExists(`public/${folder}`);
          cb(null, join(this.getProjectRootPath(), `public/${folder}`));
        },
        // format file's name
        filename: (req, file, cb) => {
          // file extension
          const fileExt = path.extname(file.originalname);

          // file's base name (without extension)
          const fileBaseName = path.basename(file.originalname, fileExt);

          const finalFileName = `${fileBaseName}-${Date.now()}${fileExt}`;
          cb(null, finalFileName);
        },
      }),
      // only allow valid file type
      fileFilter: (req, file, cb) => {
        const allowedFileTypes = [
          'jpg',
          'jpeg',
          'png',
          'gif',
          'pdf',
          'doc',
          'docx',
        ];
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        const isValidFileType = allowedFileTypes.includes(fileExtension);

        if (!isValidFileType) {
          cb(
            new HttpException(
              'Invalid file type',
              HttpStatus.UNPROCESSABLE_ENTITY,
            ),
            null,
          );
        } else cb(null, true);
      },
      // max file size
      limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB
      },
    };
  }
}
