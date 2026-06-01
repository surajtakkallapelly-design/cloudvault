import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import File from '../models/File.js';
import Folder from '../models/Folder.js';

// Determine if we should run in mock S3 mode (to help developers test locally without AWS credentials)
const isAWSConfigured = () => {
  const key = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_BUCKET_NAME;

  return (
    key &&
    key !== 'your_aws_access_key_id' &&
    secret &&
    secret !== 'your_aws_secret_access_key' &&
    bucket &&
    bucket !== 'your_s3_bucket_name'
  );
};
// Dynamic S3 Client getter
let s3Client = null;
const getS3Client = () => {
  if (!s3Client && isAWSConfigured()) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

// @desc    Get presigned S3 URL for file upload
// @route   GET /api/files/upload-url
// @access  Private
export const getUploadUrl = async (req, res) => {
  const { fileName, fileType } = req.query;

  if (!fileName || !fileType) {
    return res.status(400).json({ message: 'Please provide fileName and fileType query parameters' });
  }

  try {
    const s3Key = `${uuidv4()}-${fileName}`;

    if (isAWSConfigured()) {
      // Real S3 upload url generation
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 }); // URL expires in 1 hour

      res.json({
        uploadUrl,
        s3Key,
        provider: 'aws',
      });
    } else {
      // Mock mode upload URL pointing to local server endpoint
      const host = req.get('host');
      const protocol = req.protocol;
      const uploadUrl = `${protocol}://${host}/api/files/mock-upload/${s3Key}`;

      console.warn('AWS Credentials not fully configured. Using mock local upload route.');

      res.json({
        uploadUrl,
        s3Key,
        provider: 'local-mock',
      });
    }
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ message: 'Failed to generate upload URL', error: error.message });
  }
};

// @desc    Mock S3 upload handler for local fallback
// @route   PUT /api/files/mock-upload/:s3Key
// @access  Public (Simulating raw S3 endpoint)
export const handleMockUpload = async (req, res) => {
  const { s3Key } = req.params;

  try {
    // Create public/uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, s3Key);
    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.status(200).send('Mock upload successful');
    });

    writeStream.on('error', (err) => {
      console.error('Mock stream error:', err);
      res.status(500).send('Mock upload failed writing file');
    });
  } catch (error) {
    console.error('Mock upload handler error:', error);
    res.status(500).send('Mock upload handler error');
  }
};

// @desc    Save file metadata after successful S3/local upload
// @route   POST /api/files/save-metadata
// @access  Private
export const saveFileMetadata = async (req, res) => {
  const { fileName, s3Key, fileSize, fileType, folder } = req.body;

  if (!fileName || !s3Key || !fileSize || !fileType) {
    return res.status(400).json({ message: 'Please provide all metadata fields: fileName, s3Key, fileSize, fileType' });
  }

  try {
    const file = await File.create({
      fileName,
      s3Key,
      fileSize,
      fileType,
      owner: req.user._id,
      folder: folder || 'Root',
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Error saving file metadata:', error);
    res.status(500).json({ message: 'Failed to save file metadata', error: error.message });
  }
};

// @desc    Get all files belonging to the logged-in user
// @route   GET /api/files/my-files
// @access  Private
export const getMyFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ message: 'Failed to fetch files', error: error.message });
  }
};

// @desc    Toggle file sharing (enable and set 24h expiration)
// @route   POST /api/files/share/:fileId
// @access  Private
export const shareFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });

    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    // Toggle isShared
    if (file.isShared) {
      file.isShared = false;
      file.sharedLinkExpiresAt = null;
    } else {
      file.isShared = true;
      file.sharedLinkExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
    }

    await file.save();
    res.json(file);
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ message: 'Failed to toggle file sharing', error: error.message });
  }
};

// @desc    Download/view a file (resolves to direct S3 read URL or local mock file path)
// @route   GET /api/files/download/:s3Key
// @access  Public (If isShared is true and not expired) OR Private (If requester is owner)
export const getDownloadUrl = async (req, res) => {
  const { s3Key } = req.params;

  try {
    const file = await File.findOne({ s3Key }).populate('owner', 'name email');

    if (!file) {
      return res.status(404).json({ message: 'File record not found' });
    }

    // Determine access eligibility
    let hasAccess = false;

    // Check if requester is logged in as the owner
    let requesterId = null;
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        token = req.headers.authorization.split(' ')[1];
      } catch (err) {}
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        requesterId = decoded.id;
      } catch (err) {
        // Token verification failed, continue check as anonymous requester
      }
    }

    if (requesterId && file.owner && requesterId === file.owner._id.toString()) {
      hasAccess = true;
    } else if (file.isShared) {
      // Check link expiration
      if (!file.sharedLinkExpiresAt || new Date() < new Date(file.sharedLinkExpiresAt)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: File is private or link has expired' });
    }

    // Deliver file URL or direct file download stream
    let finalUrl = '';
    const isDownload = req.query.download === 'true';

    if (isAWSConfigured()) {
      // Generate a signed URL for reading the object
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
      };

      if (isDownload) {
        s3Params.ResponseContentDisposition = `attachment; filename="${file.fileName}"`;
      } else {
        s3Params.ResponseContentDisposition = 'inline';
      }

      const command = new GetObjectCommand(s3Params);
      finalUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
    } else {
      // Deliver the local mock file download stream or URL
      const host = req.get('host');
      const protocol = req.protocol;
      finalUrl = `${protocol}://${host}/uploads/${s3Key}`;
    }

    if (req.query.json === 'true') {
      res.json({ downloadUrl: finalUrl, isLocal: !isAWSConfigured() });
    } else {
      res.redirect(finalUrl);
    }
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ message: 'Failed to generate download url', error: error.message });
  }
};

// @desc    Delete file from database and S3 / mock uploads directory
// @route   DELETE /api/files/:fileId
// @access  Private
export const deleteFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });

    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    // Enforce soft-deletion/trash check before allowing permanent purge
    if (!file.isTrashed) {
      return res.status(400).json({ message: 'File must be moved to trash before permanent deletion' });
    }

    // 1. Delete object from storage
    if (isAWSConfigured()) {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.s3Key,
      });
      await getS3Client().send(deleteCommand);
    } else {
      // Delete mock file from local upload directory
      const filePath = path.join(process.cwd(), 'uploads', file.s3Key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 2. Delete registry from MongoDB database
    await file.deleteOne();

    res.json({ message: 'File deleted permanently' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file permanently', error: error.message });
  }
};

// @desc    Rename a file
// @route   PUT /api/files/rename/:fileId
// @access  Private
export const renameFile = async (req, res) => {
  const { fileId } = req.params;
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).json({ message: 'Please provide a new file name' });
  }

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    file.fileName = newName;
    await file.save();
    res.json(file);
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ message: 'Failed to rename file', error: error.message });
  }
};

// @desc    Create a new folder
// @route   POST /api/files/folders
// @access  Private
export const createFolder = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Please provide a folder name' });
  }

  try {
    if (name.toLowerCase() === 'root') {
      return res.status(400).json({ message: '"Root" is a reserved folder name' });
    }

    const folderExists = await Folder.findOne({ name, owner: req.user._id });
    if (folderExists) {
      return res.status(400).json({ message: 'A folder with this name already exists' });
    }

    const folder = await Folder.create({
      name,
      owner: req.user._id,
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Failed to create folder', error: error.message });
  }
};

// @desc    Get all folders belonging to the logged-in user
// @route   GET /api/files/folders
// @access  Private
export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ owner: req.user._id }).sort({ name: 1 });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Failed to fetch folders', error: error.message });
  }
};

// @desc    Move a file to another folder
// @route   PUT /api/files/move/:fileId
// @access  Private
export const moveFileToFolder = async (req, res) => {
  const { fileId } = req.params;
  const { folderName } = req.body; // 'Root' or custom folder name

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    // Verify folder exists if it's not Root
    if (folderName && folderName !== 'Root') {
      const folder = await Folder.findOne({ name: folderName, owner: req.user._id });
      if (!folder) {
        return res.status(404).json({ message: 'Target folder does not exist' });
      }
    }

    file.folder = folderName || 'Root';
    await file.save();
    res.json(file);
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ message: 'Failed to move file', error: error.message });
  }
};

// @desc    Toggle star status of a file
// @route   PUT /api/files/star/:fileId
// @access  Private
export const toggleStarFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    file.isStarred = !file.isStarred;
    await file.save();
    res.json(file);
  } catch (error) {
    console.error('Error starring file:', error);
    res.status(500).json({ message: 'Failed to star file', error: error.message });
  }
};

// @desc    Toggle trash status of a file (soft-delete / restore)
// @route   PUT /api/files/trash/:fileId
// @access  Private
export const toggleTrashFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    file.isTrashed = !file.isTrashed;
    await file.save();
    res.json(file);
  } catch (error) {
    console.error('Error trashing file:', error);
    res.status(500).json({ message: 'Failed to trash file', error: error.message });
  }
};
