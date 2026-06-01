import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUploadUrl,
  handleMockUpload,
  saveFileMetadata,
  getMyFiles,
  shareFile,
  getDownloadUrl,
  deleteFile,
  renameFile,
  createFolder,
  getFolders,
  moveFileToFolder,
  toggleStarFile,
  toggleTrashFile,
} from '../controllers/fileController.js';

const router = express.Router();

// Protected file routes
router.get('/upload-url', protect, getUploadUrl);
router.post('/save-metadata', protect, saveFileMetadata);
router.get('/my-files', protect, getMyFiles);
router.post('/share/:fileId', protect, shareFile);
router.delete('/:fileId', protect, deleteFile);
router.put('/rename/:fileId', protect, renameFile);
router.post('/folders', protect, createFolder);
router.get('/folders', protect, getFolders);
router.put('/move/:fileId', protect, moveFileToFolder);
router.put('/star/:fileId', protect, toggleStarFile);
router.put('/trash/:fileId', protect, toggleTrashFile);

// Public route for downloading files (handles checking ownership/share token internally)
router.get('/download/:s3Key', getDownloadUrl);

// Public route mimicking the raw S3 PUT request for mock uploads
router.put('/mock-upload/:s3Key', handleMockUpload);

export default router;
