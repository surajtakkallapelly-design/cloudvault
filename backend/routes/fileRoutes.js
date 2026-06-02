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
  shareFileWithUser,
  removeFileShare,
  getSharedWithMe,
  getFileVersions,
  restoreFileVersion,
  deleteFileVersion,
  bulkTrashFiles,
  bulkRestoreFiles,
  bulkDeleteFiles,
  bulkMoveFiles,
  bulkDownloadFiles,
} from '../controllers/fileController.js';

const router = express.Router();

// Protected file routes
router.get('/upload-url', protect, getUploadUrl);
router.post('/save-metadata', protect, saveFileMetadata);
router.get('/my-files', protect, getMyFiles);
router.post('/share/:fileId', protect, shareFile);
router.put('/rename/:fileId', protect, renameFile);
router.post('/folders', protect, createFolder);
router.get('/folders', protect, getFolders);
router.put('/move/:fileId', protect, moveFileToFolder);
router.put('/star/:fileId', protect, toggleStarFile);
router.put('/trash/:fileId', protect, toggleTrashFile);

// Bulk operations
router.get('/bulk-download', protect, bulkDownloadFiles);
router.post('/bulk-trash', protect, bulkTrashFiles);
router.post('/bulk-restore', protect, bulkRestoreFiles);
router.post('/bulk-delete', protect, bulkDeleteFiles);
router.post('/bulk-move', protect, bulkMoveFiles);

// Collaborative Sharing
router.get('/shared-with-me', protect, getSharedWithMe);
router.post('/share-user/:fileId', protect, shareFileWithUser);
router.delete('/share-user/:fileId/:userId', protect, removeFileShare);

// File Versions
router.get('/:fileId/versions', protect, getFileVersions);
router.post('/:fileId/versions/:versionNumber/restore', protect, restoreFileVersion);
router.delete('/:fileId/versions/:versionNumber', protect, deleteFileVersion);

router.delete('/:fileId', protect, deleteFile);

// Public route for downloading files (handles checking ownership/share token internally)
router.get('/download/:s3Key', getDownloadUrl);

// Public route mimicking the raw S3 PUT request for mock uploads
router.put('/mock-upload/:s3Key', handleMockUpload);

export default router;
