import util from 'util';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import mime from 'mime';

import AWS from 'aws-sdk';
import {clone} from 'lodash';

import fs from 'co-fs-extra';
import co from 'co';

export const SKIP_MATCHES = 'File Matches, skipped %s';
export const UPLOAD_SUCCESS = 'Uploaded: %s/%s';
export const ERR_UPLOAD = 'Upload error: %s (%s)';
export const ERR_CHECKSUM = 'Update prevented: local hash is %s but bucket hash is %s for %s';
export const DELETE_SUCCESS = 'Deleted: %s';
export const ABORT_UPLOAD = 'Unexpected error: (%s) %s, aborting upload for %s';

/**
 * Gets the content type of the file, based on it's extension.
 * @param  {String} src Path to file fow which content type should be evaluated.
 * @return {String}     Returns string with content type and charset.
 */
export function contentType(src, ext) {
  var type = mime.lookup(ext || src).replace('-', '');
  var charset = mime.charsets.lookup(type, null);

  if (charset) {
    type += '; charset=' + charset;
  }

  return type;
}

/**
 * Creates an MD5 hash of a give file.
 * @param  {String} data Contents of the file.
 * @return {String}      MD5 Hash of the file contents, returned as HEX string.
 */
export function createMd5Hash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Creates an MD5 hash of a give file.
 * @param  {String} data Contents of the file.
 * @return {String}      MD5 Hash of the file contents, returned as Base64 string.
 */
export function base64Md5(data) {
  return crypto.createHash('md5').update(data).digest('base64');
}

/**
 * Returns a 'Key' attribute of a request to get info about file in AWS S3.
 * @param  {Object} file File object with information bout it's path.
 * @return {Object}      Returns an object with a 'Key' parameter,
 *                       being a base path of the file location, with slashes
 *                       removed from the path.
 */
export function buildBaseParams(file, filePrefix, fileName) {
  var dest = path.relative(file.base, file.path).replace(/\\/g,'/');

  if (fileName) {
    dest = fileName.replace(/\\/g,'/');
  }
  if (filePrefix) {
    dest = filePrefix + '/' + dest;
  }
  return {
    Key: dest
  };
}

/**
 * Returns an array of aliases this file should be uploaded as, in the event
 * the filename matches the index specified.
 * @param  {String} file  File object, with all its details
 * @param  {String} index An index file name, which if the filename matches
 *                        will generate aliases.
 * @returns {Array} An array of Strings to act as aliases, or null if it's not an index.
 */
export function buildIndexes(file, index) {

  // If there's no index specified, there's nothing to do.
  if (!index) {
    return Array();
  }

  // If the filename doesn't match the index, there's nothing to do.
  if (path.basename(file.path) !== index) {
    return Array();
  }

  var dest = path.relative(file.base, file.path).replace(/\\/g,'/');

  // The root object is handled separately on S3.
  if (path.dirname(dest) === '.') {
    return Array();
  }

  // Two aliases: the path name, and the path name with a trailing slash.
  return new Array(
    path.dirname(dest),
    path.dirname(dest) + '/'
  );
}

/**
 * Takes a file object, and prepares parameters required during AWS S3 file upload.
 * @param  {Object} file File object, with all it's details.
 * @return {Object}      AWS S3 upload function parameters.
 */
export function buildUploadParams(file, filePrefix, ext, fileName) {
  var params = Object.assign({
    ContentMD5: base64Md5(file.contents),
    Body: file.contents,
    ContentType: contentType(file.path, ext)
  }, buildBaseParams(file, filePrefix, fileName));

  return params;
}

export function handleETag(opts) {
  if(opts.Metadata && opts.Metadata.ETag === true) {
    opts.Metadata.ETag = opts.ContentMD5;
  }

  return opts;
}

/**
 * Uploads a file to AWS S3 bucket.
 * @param  {Object} client AWS Client object.
 * @param  {Object} file   File details of a file to be uploaded.
 * @param  {Object} opts   Object with additional AWS parameters.
 * @return {Promise}        Returns a promise which resolves with a log message of upload status.
 */
export function upload(client, file, opts, filePrefix, ext, fileName) {
  return new Promise((resolve, reject) => {
    opts = Object.assign({
      ACL: 'public-read'
    }, opts);

    var params = Object.assign({}, buildUploadParams(file, filePrefix, ext, fileName), opts);
    params = handleETag(params);
    var dest = params.Key;

    // Upload the file to s3.
    client.putObject(params, function (err) {
      if (err) {
        return reject(util.format(ERR_UPLOAD, err, err.stack));
      }

      return resolve(util.format(UPLOAD_SUCCESS, params.Bucket, dest));
    });
  });
}

export function deleteRemoved(client, files, options) {

  const params = {
    Bucket: options.bucket
  };

  return new Promise((resolve, reject) => {
    client.listObjects(params, function (err, data) {
      if (err) {
        return reject(util.format(ERR_UPLOAD, err, err.stack));
      }// an error occurred
      const s3files = data.Contents.map(item => item.Key);
      const localFiles = files.map(item => item.substr(options.cwd.length));
      const toDelete = s3files.filter(item => !localFiles.includes(item));

      if (toDelete.length > 0) {

        console.log('Deleting files: %s', toDelete);

        const params = {
          Bucket: options.bucket,
          Delete: {
            Objects: toDelete.map(item => {
              return {Key: item};
            })
          }
        };

        client.deleteObjects(params, function (err, data) {
          if (err) {
            return reject(util.format(ERR_UPLOAD, err, err.stack));
          }// an error occurred


          return resolve(util.format(DELETE_SUCCESS, toDelete));

        });
      } else {
        console.log('No files to delete.');
      }
    });
  });
}


/**
 * Checks if file is already in the S3 bucket.
 * @param  {Object}  client         AWS Client object.
 * @param  {Object}  file           File details of a file to check.
 * @param  {Object}  opts           Object with additional AWS parameters.
 * @return {Promise}                Returns a promise which rejects if file already exists,
 *                                  and doesn't need update. Otherwise fulfills.
 */
export function sync(client, file, filePrefix, opts, fileName) {
  return new Promise((resolve, reject) => {
    var expectedHash = createMd5Hash(file.contents);
    var params = {
      IfNoneMatch: expectedHash,
      Bucket: opts.Bucket
    };

    Object.assign(params, buildBaseParams(file, filePrefix, fileName));
    client.headObject(params, function (err, data) {
      if (err && (err.statusCode === 304 || err.statusCode === 412)) {
        return reject(util.format(SKIP_MATCHES, params.Key));
      }

      if (data || err.statusCode === 404) {
        return resolve();
      }

      reject(util.format(ABORT_UPLOAD, err.code, err.message, params.Key));
    });
  });
}

/**
 * Checks if the provided path is a file or directory.
 * If it is a file, it returns file details object.
 * Otherwise it returns undefined.
 */
export const readFile = co.wrap(function *(filepath, cwd, gzipFiles) {
  var stat = fs.statSync(filepath);
  if (stat.isFile()) {
    let fileContents = yield fs.readFile(filepath, {encoding: null});

    if (gzipFiles) {
      fileContents = zlib.gzipSync(fileContents);
    }

    return {
      stat: stat,
      contents: fileContents,
      base: path.join(process.cwd(), cwd),
      path: path.join(process.cwd(), filepath)
    };
  }

  return undefined;
});

/**
 * Handles a path, by obtaining file details for a provided path,
 * checking if file is already in AWS bucket and needs updates,
 * and uploading files that are not there yet, or do need an update.
 */
export const handleFile = co.wrap(function *(filePath, cwd, filePrefix, client, s3Options, ext, indexName) {
  const fileObject = yield readFile(filePath, cwd, s3Options.ContentEncoding !== undefined);

  if (fileObject !== undefined) {
    const aliases = buildIndexes(fileObject, indexName);
    try {
      yield sync(client, fileObject, filePrefix, s3Options);
      if (aliases && aliases.length > 0) {
        for (var i = 0; i < aliases.length; i++) {
          const name = aliases[i];
          yield sync(client, fileObject, filePrefix, s3Options, name);
        }
      }
    } catch (e) {
      console.log(e);
      return;
    }

    const fileUploadStatus = yield upload(client, fileObject, s3Options, filePrefix, ext);
    if (aliases && aliases.length > 0) {
      for (var i = 0; i < aliases.length; i++) {
        const name = aliases[i];
        yield upload(client, fileObject, s3Options, filePrefix, ext, name);
      }
    }
    console.log(fileUploadStatus);
  }
});

/**
 * Entry point, creates AWS client, prepares AWS options,
 * and handles all provided paths.
 */
export const deploy = co.wrap(function *(files, options, AWSOptions, s3Options, clientOptions = {}) {
  AWSOptions = clone(AWSOptions, true);
  s3Options = clone(s3Options, true);
  const cwd = options.cwd;
  const filePrefix = options.filePrefix || '';


  if (options.profile) {
    var credentials = new AWS.SharedIniFileCredentials({profile: options.profile});
    AWS.config.credentials = credentials;
  }

  AWS.config.update(Object.assign({
    sslEnabled: true
  }, AWSOptions));

  var client = new AWS.S3(clientOptions);

  yield Promise.all(files.map(function (filePath) {
    return handleFile(filePath, cwd, filePrefix, client, s3Options, options.ext, options.index);
  }));

  if(options.deleteRemoved) {
    deleteRemoved(client, files, options);
  }
});
