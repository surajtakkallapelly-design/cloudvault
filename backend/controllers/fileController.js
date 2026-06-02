import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import File from '../models/File.js';
import Folder from '../models/Folder.js';
import User from '../models/User.js';
import { ZipArchive } from 'archiver';
import { sendEmail } from '../services/emailService.js';

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

const calculateUserStorage = async (userId) => {
  const files = await File.find({ owner: userId });
  let totalSize = 0;
  let filesCount = 0;

  files.forEach(f => {
    totalSize += (f.fileSize || 0);
    filesCount += 1;
    if (f.versions && f.versions.length > 0) {
      f.versions.forEach(v => {
        totalSize += (v.fileSize || 0);
      });
    }
  });

  return { totalSize, filesCount };
};

// @desc    Get presigned S3 URL for file upload
// @route   GET /api/files/upload-url
// @access  Private
export const getUploadUrl = async (req, res) => {
  const { fileName, fileType, fileSize } = req.query;

  if (!fileName || !fileType) {
    return res.status(400).json({ message: 'Please provide fileName and fileType query parameters' });
  }

  try {
    const size = parseInt(fileSize, 10);
    if (!isNaN(size)) {
      const { totalSize } = await calculateUserStorage(req.user._id);
      if (totalSize + size > 20 * 1024 * 1024 * 1024) {
        return res.status(400).json({ message: 'Upload Blocked: Adding this file would exceed your vault storage limit of 20 GB.' });
      }
    }

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
      let protocol = req.protocol;
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        protocol = 'https';
      }
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
    const size = parseInt(fileSize, 10);
    if (!isNaN(size)) {
      const { totalSize } = await calculateUserStorage(req.user._id);
      if (totalSize + size > 20 * 1024 * 1024 * 1024) {
        return res.status(400).json({ message: 'Upload Blocked: Adding this file would exceed your vault storage limit of 20 GB.' });
      }
    }

    const targetFolder = folder || 'Root';
    // Check if file with same name already exists in same folder for this user and isn't trashed
    let file = await File.findOne({ fileName, folder: targetFolder, owner: req.user._id, isTrashed: false });

    if (file) {
      // Versioning logic: backup current version
      const newVersionNum = (file.versions?.length || 0) + 1;
      file.versions.push({
        versionNumber: newVersionNum,
        s3Key: file.s3Key,
        fileSize: file.fileSize,
        uploadedAt: file.updatedAt || new Date()
      });

      // Update main to the new upload details
      file.s3Key = s3Key;
      file.fileSize = fileSize;
      file.fileType = fileType;
      await file.save();
      res.status(200).json(file);
    } else {
      // Create new file document
      file = await File.create({
        fileName,
        s3Key,
        fileSize,
        fileType,
        owner: req.user._id,
        folder: targetFolder,
      });
      res.status(201).json(file);
    }
  } catch (error) {
    console.error('Error saving file metadata:', error);
    res.status(500).json({ message: 'Failed to save file metadata', error: error.message });
  }
};

// @desc    Get all files belonging to the logged-in user
// @route   GET /api/files/my-files
// @access  Private
export const getMyFiles = async (req, res) => {
  const { type, starred, trash, sortBy, search, folder, folderOwner } = req.query;

  try {
    let ownerId = req.user._id;

    // Check if we are browsing a shared folder
    if (folder && folder !== 'Root' && folderOwner && trash !== 'true' && starred !== 'true' && !search) {
      const sharedFolder = await Folder.findOne({
        name: folder,
        owner: folderOwner,
        'sharedWith.user': req.user._id,
        isTrashed: false
      });
      if (sharedFolder) {
        ownerId = folderOwner;
      }
    }

    const query = { owner: ownerId };

    // Folder scoping
    if (folder) {
      query.folder = folder;
    } else if (trash !== 'true' && starred !== 'true' && !search) {
      // Scoping to root by default if navigating folders and no special view is active
      query.folder = 'Root';
    }

    // Starred filter
    if (starred === 'true') {
      query.isStarred = true;
    }

    // Trash filter
    if (trash === 'true') {
      query.isTrashed = true;
    } else {
      query.isTrashed = false;
    }

    // Type filter
    if (type && type !== 'all') {
      const typeLower = type.toLowerCase();
      if (typeLower === 'pdf') {
        query.fileType = 'application/pdf';
      } else if (typeLower === 'image') {
        query.fileType = { $regex: /^image\//i };
      } else if (typeLower === 'video') {
        query.fileType = { $regex: /^video\//i };
      } else if (typeLower === 'audio') {
        query.fileType = { $regex: /^audio\//i };
      } else if (typeLower === 'text') {
        query.fileType = { $regex: /(text\/|application\/javascript|application\/json)/i };
      } else if (typeLower === 'document') {
        // Office documents
        query.fileName = { $regex: /\.(doc|docx|xls|xlsx|ppt|pptx)$/i };
      }
    }

    // Text search
    if (search) {
      query.fileName = { $regex: search, $options: 'i' };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default: newest
    if (sortBy) {
      switch (sortBy) {
        case 'createdAt_asc':
          sortOptions = { createdAt: 1 };
          break;
        case 'fileSize_desc':
          sortOptions = { fileSize: -1 };
          break;
        case 'fileSize_asc':
          sortOptions = { fileSize: 1 };
          break;
        case 'fileName_asc':
          sortOptions = { fileName: 1 };
          break;
        case 'fileName_desc':
          sortOptions = { fileName: -1 };
          break;
        case 'createdAt_desc':
        default:
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    const files = await File.find(query).sort(sortOptions);
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

const isTextOrCode = (fileName, fileType = '') => {
  const type = fileType.toLowerCase();
  const ext = fileName.split('.').pop().toLowerCase();
  const textExts = [
    'txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 
    'py', 'ipynb', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 
    'rb', 'swift', 'kt', 'pl', 'r', 'sh', 'go', 'rs', 'yaml', 
    'yml', 'xml', 'sql', 'ini', 'log', 'conf', 'config', 'dockerfile'
  ];
  return type.startsWith('text/') || type === 'application/json' || type === 'application/javascript' || textExts.includes(ext);
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
    } else if (requesterId && file.sharedWith && file.sharedWith.some(share => share.user && share.user.toString() === requesterId)) {
      hasAccess = true;
    } else if (requesterId && file.folder && file.folder !== 'Root') {
      const parentFolder = await Folder.findOne({
        name: file.folder,
        owner: file.owner,
        'sharedWith.user': requesterId,
        isTrashed: false
      });
      if (parentFolder) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess && file.isShared) {
      // Check link expiration
      if (!file.sharedLinkExpiresAt || new Date() < new Date(file.sharedLinkExpiresAt)) {
        hasAccess = true;
      }
    }

    if (!hasAccess && req.query.emailToken) {
      try {
        const decoded = jwt.verify(req.query.emailToken, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        if (decoded.fileId === file._id.toString() && file.sharedWith.some(share => share.email.toLowerCase() === decoded.email.toLowerCase())) {
          hasAccess = true;
        }
      } catch (err) {
        // Email token verification failed or expired
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: File is private or link has expired' });
    }

    // Deliver file URL or direct file download stream
    const isDownload = req.query.download === 'true';
    const host = req.get('host');
    let protocol = req.protocol;
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      protocol = 'https';
    }
    const tokenParam = token ? `?token=${token}` : '';
    const finalUrl = `${protocol}://${host}/api/files/download/${s3Key}${tokenParam}`;

    if (req.query.json === 'true') {
      let textContent = undefined;
      if (isTextOrCode(file.fileName, file.fileType)) {
        try {
          if (isAWSConfigured()) {
            const { GetObjectCommand } = await import('@aws-sdk/client-s3');
            const getCommand = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: s3Key,
            });
            const s3Response = await getS3Client().send(getCommand);
            textContent = await s3Response.Body.transformToString();
          } else {
            const filePath = path.join(process.cwd(), 'uploads', s3Key);
            if (fs.existsSync(filePath)) {
              textContent = fs.readFileSync(filePath, 'utf-8');
            }
          }
        } catch (readErr) {
          console.error('Error reading text/code file content on backend:', readErr);
          textContent = 'Error: Failed to fetch text/code content from storage.';
        }
      }
      res.json({ downloadUrl: finalUrl, isLocal: !isAWSConfigured(), textContent });
    } else {
      // Set appropriate disposition and type headers
      const escapedFilename = file.fileName.replace(/"/g, '\\"');
      const encodedFilename = encodeURIComponent(file.fileName);
      
      res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
      if (file.fileSize) {
        res.setHeader('Content-Length', file.fileSize);
      }
      
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${escapedFilename}"; filename*=UTF-8''${encodedFilename}`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${escapedFilename}"; filename*=UTF-8''${encodedFilename}`);
      }

      if (isAWSConfigured()) {
        try {
          const { GetObjectCommand } = await import('@aws-sdk/client-s3');
          const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
          };
          const command = new GetObjectCommand(s3Params);
          const s3Response = await getS3Client().send(command);

          s3Response.Body.on('error', (streamErr) => {
            console.error('S3 download stream error:', streamErr);
            if (!res.headersSent) {
              res.status(500).send('Error streaming file from S3');
            }
          });
          s3Response.Body.pipe(res);
        } catch (s3Error) {
          console.error('S3 fetch error during stream download:', s3Error);
          res.status(500).json({ message: 'Failed to stream file from S3 bucket', error: s3Error.message });
        }
      } else {
        const filePath = path.join(process.cwd(), 'uploads', s3Key);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ message: 'File physical storage not found' });
        }

        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (streamErr) => {
          console.error('Local download stream error:', streamErr);
          if (!res.headersSent) {
            res.status(500).send('Error streaming local file');
          }
        });
        fileStream.pipe(res);
      }
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

    // 1. Delete object from storage (wrapped in try-catch to be robust if file is already deleted or storage is unreachable)
    try {
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
    } catch (storageError) {
      console.warn('Physical storage deletion failed or file not found, proceeding with database registry removal:', storageError);
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

// @desc    Share a file with an email address
// @route   POST /api/files/share/:fileId
// @access  Private
export const shareFileWithUser = async (req, res) => {
  const { fileId } = req.params;
  const { email, permission } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    // Find the user to share with (optional)
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (targetUser && targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot share files with yourself' });
    }

    let isAlreadyShared;
    if (targetUser) {
      isAlreadyShared = file.sharedWith.some(
        (share) => (share.user && share.user.toString() === targetUser._id.toString()) || share.email.toLowerCase() === email.toLowerCase()
      );
    } else {
      isAlreadyShared = file.sharedWith.some(
        (share) => share.email.toLowerCase() === email.toLowerCase()
      );
    }

    if (isAlreadyShared) {
      file.sharedWith = file.sharedWith.map((share) =>
        share.email.toLowerCase() === email.toLowerCase()
          ? { ...share, permission: permission || 'view' }
          : share
      );
    } else {
      file.sharedWith.push({
        user: targetUser ? targetUser._id : undefined,
        email: email.toLowerCase(),
        permission: permission || 'view'
      });
    }

    await file.save();

    // Send email notification (registered or unregistered)
    try {
      const isRegistered = !!targetUser;
      const appUrl = 'https://cloudvault-anurag.duckdns.org';
      const permissionLabel = permission === 'edit' ? 'Editor (Read-Write)' : 'Viewer (Read-only)';
      
      const host = req.get('host');
      let protocol = req.protocol;
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        protocol = 'https';
      }

      // Generate direct access token valid for 7 days
      const emailToken = jwt.sign(
        { email: email.toLowerCase(), fileId: file._id },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '7d' }
      );
      const directAccessUrl = `${protocol}://${host}/api/files/download/${encodeURIComponent(file.s3Key)}?emailToken=${emailToken}`;

      const subject = `[CloudVault] File shared with you: ${file.fileName}`;
      const text = isRegistered
        ? `Hi there,\n\n${req.user.name} (${req.user.email}) has shared the file "${file.fileName}" with you on CloudVault as ${permissionLabel}.\n\nYou can access it directly using the link below:\n\n${directAccessUrl}\n\nOr log in to your workspace at ${appUrl} to access it.\n\nBest regards,\nCloudVault Support`
        : `Hi there,\n\n${req.user.name} (${req.user.email}) has shared the file "${file.fileName}" with you on CloudVault as ${permissionLabel}.\n\nYou can view and download this file directly without registering an account using the link below:\n\n${directAccessUrl}\n\nAdditionally, you can register for a free account at ${appUrl} using this email address to save and manage all shared files in your own secure vault workspace!\n\nBest regards,\nCloudVault Support`;

      const html = isRegistered
        ? `<div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
             <h3>File Shared With You</h3>
             <p><strong>${req.user.name}</strong> (<em>${req.user.email}</em>) has shared the file <strong>${file.fileName}</strong> with you as <strong>${permissionLabel}</strong>.</p>
             <p style="margin: 20px 0;">
               <a href="${directAccessUrl}" target="_blank" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Shared File</a>
             </p>
             <p>Or log in to your workspace at <a href="${appUrl}" target="_blank">${appUrl}</a> to access it.</p>
             <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
             <p style="font-size: 11px; color: #6b7280;">This is an automated notification from CloudVault.</p>
           </div>`
        : `<div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
             <h3>File Shared With You</h3>
             <p><strong>${req.user.name}</strong> (<em>${req.user.email}</em>) has shared the file <strong>${file.fileName}</strong> with you as <strong>${permissionLabel}</strong>.</p>
             <p style="margin: 20px 0;">
               <a href="${directAccessUrl}" target="_blank" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Shared File directly</a>
             </p>
             <p style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin-top: 20px;">
               <strong>No account required:</strong> You can view and download the file immediately by clicking the button above. If you want to keep track of this and other shared files, register for a free CloudVault account at <a href="${appUrl}" target="_blank">${appUrl}</a> using this email address.
             </p>
             <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
             <p style="font-size: 11px; color: #6b7280;">This is an automated notification from CloudVault.</p>
           </div>`;

      await sendEmail({
        to: email.toLowerCase(),
        subject,
        text,
        html
      });
      console.log(`[Email] Sharing notification sent successfully to ${email}`);
    } catch (emailErr) {
      console.error('[Email] Failed to send sharing notification email:', emailErr.message);
    }

    const updatedFile = await File.findById(fileId).populate('sharedWith.user', 'name email');
    res.json(updatedFile);
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ message: 'Failed to share file', error: error.message });
  }
};

// @desc    Revoke file access for a user
// @route   DELETE /api/files/share/:fileId/:userId
// @access  Private
// export const removeFileShare = async (req, res) => {
export const removeFileShare = async (req, res) => {
  const { fileId, userId } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found or unauthorized access' });
    }

    if (userId.includes('@')) {
      file.sharedWith = file.sharedWith.filter(
        (share) => share.email.toLowerCase() !== userId.toLowerCase()
      );
    } else {
      file.sharedWith = file.sharedWith.filter(
        (share) => !share.user || share.user.toString() !== userId
      );
    }

    await file.save();
    const updatedFile = await File.findById(fileId).populate('sharedWith.user', 'name email');
    res.json(updatedFile);
  } catch (error) {
    console.error('Error removing file share:', error);
    res.status(500).json({ message: 'Failed to remove sharing', error: error.message });
  }
};

// @desc    Get all files shared with the current user
// @route   GET /api/files/shared-with-me
// @access  Private
export const getSharedWithMe = async (req, res) => {
  try {
    const files = await File.find({
      'sharedWith.user': req.user._id,
      isTrashed: false
    }).populate('owner', 'name email').sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error('Error fetching shared files:', error);
    res.status(500).json({ message: 'Failed to fetch shared files', error: error.message });
  }
};

// @desc    Get all historical versions of a file
// @route   GET /api/files/:fileId/versions
// @access  Private
export const getFileVersions = async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json(file.versions || []);
  } catch (error) {
    console.error('Error fetching file versions:', error);
    res.status(500).json({ message: 'Failed to fetch file versions', error: error.message });
  }
};

// @desc    Restore a past version of a file
// @route   POST /api/files/:fileId/versions/:versionNumber/restore
// @access  Private
export const restoreFileVersion = async (req, res) => {
  const { fileId, versionNumber } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const versionIndex = file.versions.findIndex(
      (v) => v.versionNumber === parseInt(versionNumber)
    );

    if (versionIndex === -1) {
      return res.status(404).json({ message: 'Specified version not found' });
    }

    const versionToRestore = file.versions[versionIndex];

    // Backup current active details
    const currentS3Key = file.s3Key;
    const currentFileSize = file.fileSize;
    const currentUploadedAt = file.updatedAt || new Date();
    const newVersionNum = (file.versions?.length || 0) + 1;

    // Set version target details as active
    file.s3Key = versionToRestore.s3Key;
    file.fileSize = versionToRestore.fileSize;

    // Remove target version, insert backup of current version in its place
    file.versions.splice(versionIndex, 1);
    
    file.versions.push({
      versionNumber: newVersionNum,
      s3Key: currentS3Key,
      fileSize: currentFileSize,
      uploadedAt: currentUploadedAt
    });

    await file.save();
    res.json(file);
  } catch (error) {
    console.error('Error restoring file version:', error);
    res.status(500).json({ message: 'Failed to restore version', error: error.message });
  }
};

// @desc    Delete a specific historical version
// @route   DELETE /api/files/:fileId/versions/:versionNumber
// @access  Private
export const deleteFileVersion = async (req, res) => {
  const { fileId, versionNumber } = req.params;

  try {
    const file = await File.findOne({ _id: fileId, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const versionIndex = file.versions.findIndex(
      (v) => v.versionNumber === parseInt(versionNumber)
    );

    if (versionIndex === -1) {
      return res.status(404).json({ message: 'Version not found' });
    }

    const version = file.versions[versionIndex];

    // Delete S3 object or local mock file
    try {
      if (isAWSConfigured()) {
        const client = getS3Client();
        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: version.s3Key,
        });
        await client.send(command);
      } else {
        const filePath = path.join(process.cwd(), 'uploads', version.s3Key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (err) {
      console.error(`S3 deletion failed for version ${versionNumber}:`, err.message);
    }

    file.versions.splice(versionIndex, 1);
    await file.save();

    res.json({ message: 'Version deleted successfully', file });
  } catch (error) {
    console.error('Error deleting version:', error);
    res.status(500).json({ message: 'Failed to delete version', error: error.message });
  }
};

// @desc    Soft delete files/folders in bulk
// @route   POST /api/files/bulk-trash
// @access  Private
export const bulkTrashFiles = async (req, res) => {
  const { fileIds, folderIds } = req.body;

  try {
    const user = req.user._id;

    if (fileIds && fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: user },
        { isTrashed: true }
      );
    }

    if (folderIds && folderIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: folderIds }, owner: user },
        { isTrashed: true }
      );
      // Soft delete files matching these folders
      const folders = await Folder.find({ _id: { $in: folderIds }, owner: user });
      const folderNames = folders.map(f => f.name);
      await File.updateMany(
        { folder: { $in: folderNames }, owner: user },
        { isTrashed: true }
      );
    }

    res.json({ message: 'Items trashed successfully' });
  } catch (error) {
    console.error('Error bulk trashing:', error);
    res.status(500).json({ message: 'Bulk trash failed', error: error.message });
  }
};

// @desc    Restore files/folders in bulk from trash
// @route   POST /api/files/bulk-restore
// @access  Private
export const bulkRestoreFiles = async (req, res) => {
  const { fileIds, folderIds } = req.body;

  try {
    const user = req.user._id;

    if (fileIds && fileIds.length > 0) {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: user },
        { isTrashed: false }
      );
    }

    if (folderIds && folderIds.length > 0) {
      await Folder.updateMany(
        { _id: { $in: folderIds }, owner: user },
        { isTrashed: false }
      );
      const folders = await Folder.find({ _id: { $in: folderIds }, owner: user });
      const folderNames = folders.map(f => f.name);
      await File.updateMany(
        { folder: { $in: folderNames }, owner: user },
        { isTrashed: false }
      );
    }

    res.json({ message: 'Items restored successfully' });
  } catch (error) {
    console.error('Error bulk restoring:', error);
    res.status(500).json({ message: 'Bulk restore failed', error: error.message });
  }
};

// @desc    Permanently delete files/folders in bulk
// @route   POST /api/files/bulk-delete
// @access  Private
export const bulkDeleteFiles = async (req, res) => {
  const { fileIds, folderIds } = req.body;

  try {
    const user = req.user._id;

    if (fileIds && fileIds.length > 0) {
      const files = await File.find({ _id: { $in: fileIds }, owner: user });

      for (const file of files) {
        try {
          if (isAWSConfigured()) {
            const client = getS3Client();
            await client.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.s3Key,
            }));

            for (const ver of file.versions || []) {
              await client.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: ver.s3Key,
              }));
            }
          } else {
            const filePath = path.join(process.cwd(), 'uploads', file.s3Key);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            for (const ver of file.versions || []) {
              const verPath = path.join(process.cwd(), 'uploads', ver.s3Key);
              if (fs.existsSync(verPath)) fs.unlinkSync(verPath);
            }
          }
        } catch (err) {
          console.error(`S3 deletion failed for ${file.fileName}:`, err.message);
        }
      }

      await File.deleteMany({ _id: { $in: fileIds }, owner: user });
    }

    if (folderIds && folderIds.length > 0) {
      const folders = await Folder.find({ _id: { $in: folderIds }, owner: user });
      const folderNames = folders.map(f => f.name);

      const filesInFolders = await File.find({ folder: { $in: folderNames }, owner: user });
      const innerFileIds = filesInFolders.map(f => f._id);

      if (innerFileIds.length > 0) {
        await File.deleteMany({ _id: { $in: innerFileIds }, owner: user });
        for (const file of filesInFolders) {
          try {
            if (isAWSConfigured()) {
              const client = getS3Client();
              await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: file.s3Key }));
              for (const ver of file.versions || []) {
                await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: ver.s3Key }));
              }
            } else {
              const filePath = path.join(process.cwd(), 'uploads', file.s3Key);
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              for (const ver of file.versions || []) {
                const verPath = path.join(process.cwd(), 'uploads', ver.s3Key);
                if (fs.existsSync(verPath)) fs.unlinkSync(verPath);
              }
            }
          } catch (err) {
            console.error(`S3 deletion failed during folder sweep:`, err.message);
          }
        }
      }

      await Folder.deleteMany({ _id: { $in: folderIds }, owner: user });
    }

    res.json({ message: 'Items deleted permanently' });
  } catch (error) {
    console.error('Error bulk deleting:', error);
    res.status(500).json({ message: 'Bulk delete failed', error: error.message });
  }
};

// @desc    Move files to a new folder in bulk
// @route   POST /api/files/bulk-move
// @access  Private
export const bulkMoveFiles = async (req, res) => {
  const { fileIds, folderName } = req.body;

  try {
    const user = req.user._id;

    if (folderName && folderName !== 'Root') {
      const folder = await Folder.findOne({ name: folderName, owner: user });
      if (!folder) {
        return res.status(404).json({ message: 'Target folder does not exist' });
      }
    }

    await File.updateMany(
      { _id: { $in: fileIds }, owner: user },
      { folder: folderName || 'Root' }
    );

    res.json({ message: 'Files moved successfully' });
  } catch (error) {
    console.error('Error bulk moving files:', error);
    res.status(500).json({ message: 'Bulk move failed', error: error.message });
  }
};

// @desc    Download multiple files bundled inside a zip archive
// @route   GET /api/files/bulk-download
// @access  Private
export const bulkDownloadFiles = async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ message: 'Please provide file IDs' });
  }

  const fileIds = ids.split(',');

  try {
    const files = await File.find({ _id: { $in: fileIds }, owner: req.user._id });
    if (files.length === 0) {
      return res.status(404).json({ message: 'No files found to download' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="cloudvault-bulk-download.zip"');

    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      res.status(500).send({ message: 'Zip generation failed', error: err.message });
    });

    archive.pipe(res);

    for (const file of files) {
      try {
        if (isAWSConfigured()) {
          const client = getS3Client();
          const s3Command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.s3Key,
          });
          const s3Response = await client.send(s3Command);
          archive.append(s3Response.Body, { name: file.fileName });
        } else {
          const filePath = path.join(process.cwd(), 'uploads', file.s3Key);
          if (fs.existsSync(filePath)) {
            archive.append(fs.createReadStream(filePath), { name: file.fileName });
          }
        }
      } catch (fileErr) {
        console.error(`Failed to pack file ${file.fileName}:`, fileErr.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error in bulk download:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Bulk download failed', error: error.message });
    }
  }
};

// @desc    Share a folder with a user
// @route   POST /api/files/folders/share/:folderId
// @access  Private
export const shareFolderWithUser = async (req, res) => {
  const { folderId } = req.params;
  const { email, permission } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or unauthorized access' });
    }

    // Find the user to share with (optional)
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (targetUser && targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot share folders with yourself' });
    }

    let isAlreadyShared;
    if (targetUser) {
      isAlreadyShared = folder.sharedWith.some(
        (share) => (share.user && share.user.toString() === targetUser._id.toString()) || share.email.toLowerCase() === email.toLowerCase()
      );
    } else {
      isAlreadyShared = folder.sharedWith.some(
        (share) => share.email.toLowerCase() === email.toLowerCase()
      );
    }

    if (isAlreadyShared) {
      folder.sharedWith = folder.sharedWith.map((share) =>
        share.email.toLowerCase() === email.toLowerCase()
          ? { ...share, permission: permission || 'view' }
          : share
      );
    } else {
      folder.sharedWith.push({
        user: targetUser ? targetUser._id : undefined,
        email: email.toLowerCase(),
        permission: permission || 'view'
      });
    }

    await folder.save();

    // Send email notification (registered or unregistered)
    try {
      const isRegistered = !!targetUser;
      const appUrl = 'https://cloudvault-anurag.duckdns.org';
      const permissionLabel = permission === 'edit' ? 'Editor (Read-Write)' : 'Viewer (Read-only)';
      
      const subject = `[CloudVault] Folder shared with you: ${folder.name}`;
      const text = isRegistered
        ? `Hi there,\n\n${req.user.name} (${req.user.email}) has shared the folder "${folder.name}" with you on CloudVault as ${permissionLabel}.\n\nLog in to your workspace at ${appUrl} to access it.\n\nBest regards,\nCloudVault Support`
        : `Hi there,\n\n${req.user.name} (${req.user.email}) has shared the folder "${folder.name}" with you on CloudVault as ${permissionLabel}.\n\nYou do not have a CloudVault account associated with this email address yet. Register for a free account at ${appUrl} using this email to instantly access the shared folder!\n\nBest regards,\nCloudVault Support`;

      const html = isRegistered
        ? `<div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
             <h3>Folder Shared With You</h3>
             <p><strong>${req.user.name}</strong> (<em>${req.user.email}</em>) has shared the folder <strong>${folder.name}</strong> with you as <strong>${permissionLabel}</strong>.</p>
             <p>Log in to your workspace at <a href="${appUrl}" target="_blank">${appUrl}</a> to access it.</p>
             <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
             <p style="font-size: 11px; color: #6b7280;">This is an automated notification from CloudVault.</p>
           </div>`
        : `<div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
             <h3>Folder Shared With You</h3>
             <p><strong>${req.user.name}</strong> (<em>${req.user.email}</em>) has shared the folder <strong>${folder.name}</strong> with you as <strong>${permissionLabel}</strong>.</p>
             <p style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5;">
               <strong>Action Required:</strong> You don't have a CloudVault account yet. Register for a free account at <a href="${appUrl}" target="_blank">${appUrl}</a> using this email address to instantly view and collaborate inside your shared folder.
             </p>
             <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
             <p style="font-size: 11px; color: #6b7280;">This is an automated notification from CloudVault.</p>
           </div>`;

      await sendEmail({
        to: email.toLowerCase(),
        subject,
        text,
        html
      });
      console.log(`[Email] Sharing notification sent successfully to ${email}`);
    } catch (emailErr) {
      console.error('[Email] Failed to send sharing notification email:', emailErr.message);
    }

    const updatedFolder = await Folder.findById(folderId).populate('sharedWith.user', 'name email');
    res.json(updatedFolder);
  } catch (error) {
    console.error('Error sharing folder:', error);
    res.status(500).json({ message: 'Failed to share folder', error: error.message });
  }
};

// @desc    Revoke folder access for a user
// @route   DELETE /api/files/folders/share/:folderId/:userId
// @access  Private
export const removeFolderShare = async (req, res) => {
  const { folderId, userId } = req.params;

  try {
    const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or unauthorized access' });
    }

    if (userId.includes('@')) {
      folder.sharedWith = folder.sharedWith.filter(
        (share) => share.email.toLowerCase() !== userId.toLowerCase()
      );
    } else {
      folder.sharedWith = folder.sharedWith.filter(
        (share) => !share.user || share.user.toString() !== userId
      );
    }

    await folder.save();
    const updatedFolder = await Folder.findById(folderId).populate('sharedWith.user', 'name email');
    res.json(updatedFolder);
  } catch (error) {
    console.error('Error removing folder share:', error);
    res.status(500).json({ message: 'Failed to remove sharing', error: error.message });
  }
};

// @desc    Get all folders shared with the current user
// @route   GET /api/files/folders/shared-with-me
// @access  Private
export const getSharedFoldersWithMe = async (req, res) => {
  try {
    const folders = await Folder.find({
      'sharedWith.user': req.user._id,
      isTrashed: false
    }).populate('owner', 'name email').sort({ name: 1 });

    res.json(folders);
  } catch (error) {
    console.error('Error fetching shared folders:', error);
    res.status(500).json({ message: 'Failed to fetch shared folders', error: error.message });
  }
};

// @desc    Get global storage stats for user
// @route   GET /api/files/storage-usage
// @access  Private
export const getStorageUsage = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id });
    let totalSize = 0;
    let filesCount = 0;

    const categories = {
      Images: { size: 0, count: 0 },
      Videos: { size: 0, count: 0 },
      Documents: { size: 0, count: 0 },
      Archives: { size: 0, count: 0 },
      Others: { size: 0, count: 0 }
    };

    files.forEach(file => {
      const fileSize = file.fileSize || 0;
      const versionsSize = (file.versions || []).reduce((sum, v) => sum + (v.fileSize || 0), 0);
      const combinedSize = fileSize + versionsSize;

      totalSize += combinedSize;
      filesCount += 1;

      const type = (file.fileType || '').toLowerCase();
      const ext = (file.fileName || '').split('.').pop().toLowerCase();

      if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        categories.Images.size += combinedSize;
        categories.Images.count += 1;
      } else if (type.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'].includes(ext)) {
        categories.Videos.size += combinedSize;
        categories.Videos.count += 1;
      } else if (type.startsWith('audio/') || type.includes('pdf') || type.includes('word') || type.includes('excel') || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) {
        categories.Documents.size += combinedSize;
        categories.Documents.count += 1;
      } else if (type.includes('zip') || type.includes('tar') || type.includes('rar') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
        categories.Archives.size += combinedSize;
        categories.Archives.count += 1;
      } else {
        categories.Others.size += combinedSize;
        categories.Others.count += 1;
      }
    });

    res.json({
      totalSize,
      filesCount,
      categories,
      storageLimit: 20 * 1024 * 1024 * 1024 // 20 GB
    });
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    res.status(500).json({ message: 'Failed to fetch storage usage', error: error.message });
  }
};
