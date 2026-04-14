'use strict';
/**
 * s3Service.js — Amazon S3 presigned URL service
 *
 * Generates time-limited presigned URLs for direct mobile → S3 uploads
 * and backend-served downloads. All objects are stored with server-side
 * KMS encryption (aws:kms).
 *
 * Required env vars:
 *   S3_BUCKET   — bucket name (e.g. careconnect-resident-photos-123456789)
 *   AWS_REGION  — AWS region  (default: ap-southeast-2)
 */
const { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const BUCKET = process.env.S3_BUCKET;

const s3 = new S3Client({ region: REGION });

/**
 * generatePresignedUploadUrl
 * Returns a 5-minute presigned PUT URL the mobile client uses to upload
 * a resident photo directly to S3 (never through the backend).
 *
 * @param {string} key          S3 object key, e.g. "residents/42/photo.jpg"
 * @param {string} contentType  MIME type, e.g. "image/jpeg"
 * @returns {Promise<string>}   Presigned URL
 */
async function generatePresignedUploadUrl(key, contentType = 'image/jpeg') {
  if (!BUCKET) throw new Error('S3_BUCKET environment variable is not set');

  const command = new PutObjectCommand({
    Bucket:               BUCKET,
    Key:                  key,
    ContentType:          contentType,
    ServerSideEncryption: 'aws:kms',
  });

  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}

/**
 * generatePresignedDownloadUrl
 * Returns a 1-hour presigned GET URL for serving a resident photo to the app.
 *
 * @param {string} key  S3 object key
 * @returns {Promise<string>}
 */
async function generatePresignedDownloadUrl(key) {
  if (!BUCKET) throw new Error('S3_BUCKET environment variable is not set');

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}

/**
 * deleteObject
 * Removes a resident photo when the resident record is deleted.
 *
 * @param {string} key  S3 object key
 */
async function deleteObject(key) {
  if (!BUCKET) return; // no-op if S3 not configured
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * residentPhotoKey
 * Canonical key format for resident photos.
 *
 * @param {number|string} residentId
 * @param {string}        filename   e.g. "photo.jpg"
 */
function residentPhotoKey(residentId, filename = 'photo.jpg') {
  return `residents/${residentId}/${filename}`;
}

module.exports = {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteObject,
  residentPhotoKey,
};
