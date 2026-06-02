import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const { api } = useAuth();
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);

  // Helper to update progress or status of a specific item in the queue
  const updateQueueItem = useCallback((id, updates) => {
    setUploadQueue((prevQueue) =>
      prevQueue.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  // Upload a single file
  const uploadSingleFile = async (id, file, targetFolder) => {
    try {
      updateQueueItem(id, { status: 'uploading', progress: 0 });

      // 1. Get S3 presigned upload URL
      const { data } = await api.get('/api/files/upload-url', {
        params: {
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
        },
      });

      const { uploadUrl, s3Key } = data;

      // 2. Upload file directly to S3 (or mock local route) using PUT
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const current = progressEvent.loaded;
          const percentCompleted = Math.round((current * 100) / total);
          updateQueueItem(id, { progress: percentCompleted });
        },
      });

      // 3. Save file metadata in Mongo database
      await api.post('/api/files/save-metadata', {
        fileName: file.name,
        s3Key,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        folder: targetFolder || 'Root',
      });

      updateQueueItem(id, { status: 'success', progress: 100 });
      return true;
    } catch (err) {
      console.error(`Upload failed for file: ${file.name}`, err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Transmission failed';
      updateQueueItem(id, { status: 'error', error: errorMessage });
      return false;
    }
  };

  // Upload multiple files concurrently
  const uploadFiles = useCallback(async (filesList, targetFolder, currentTotalSize = 0) => {
    const filesArray = Array.from(filesList);
    if (filesArray.length === 0) return;

    const storageLimit = 20 * 1024 * 1024 * 1024; // 20 GB free-tier cap
    
    // Check if adding all files will exceed limit using global API if possible
    const totalNewSize = filesArray.reduce((sum, f) => sum + f.size, 0);
    let currentGlobalSize = currentTotalSize;
    try {
      const { data: usageData } = await api.get('/api/files/storage-usage');
      currentGlobalSize = usageData.totalSize || 0;
    } catch (err) {
      console.warn('Failed to fetch storage usage, falling back to local size:', err.message);
    }

    if (currentGlobalSize + totalNewSize > storageLimit) {
      alert(`Upload Blocked: Adding these files would exceed your vault storage limit of 20 GB.`);
      return;
    }

    // Open and expand the drawer
    setIsDrawerOpen(true);
    setIsDrawerExpanded(true);

    // Create queue items
    const newItems = filesArray.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending', // pending, uploading, success, error
      error: null,
      folder: targetFolder || 'Root',
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);

    // Trigger parallel uploads (concurrency limited naturally by browser/HTTP or standard Promise.all)
    const uploadPromises = newItems.map((item) =>
      uploadSingleFile(item.id, item.file, item.folder)
    );

    const results = await Promise.all(uploadPromises);

    // If any uploads succeeded, trigger a custom event or callback to refresh dashboard data
    const anySuccess = results.some((r) => r === true);
    if (anySuccess) {
      // Dispatch custom event to notify dashboard to reload file list
      window.dispatchEvent(new CustomEvent('vault-files-updated'));
    }
  }, [api, updateQueueItem]);

  const clearCompleted = useCallback(() => {
    setUploadQueue((prev) => prev.filter((item) => item.status !== 'success'));
  }, []);

  const removeQueueItem = useCallback((id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = {
    uploadQueue,
    isDrawerOpen,
    isDrawerExpanded,
    setIsDrawerOpen,
    setIsDrawerExpanded,
    uploadFiles,
    clearCompleted,
    removeQueueItem,
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};
