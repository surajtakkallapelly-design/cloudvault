import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const TEST_EMAIL = 'surajtakkallapelly@gmail.com';
const TEST_PASS = '123456';

const COLLAB_EMAIL = 'collab-suraj@example.com';
const COLLAB_PASS = '123456';

async function runTests() {
  console.log(`\n=================== STARTING INTENSE E2E TESTING ===================`);
  console.log(`Target Backend Base URL: ${BASE_URL}\n`);

  // 1. Log in or sign up the main test user
  let token;
  let userId;
  try {
    console.log(`[Auth] Attempting login for ${TEST_EMAIL}...`);
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASS,
    });
    token = loginRes.data.token;
    userId = loginRes.data._id;
    console.log(`[Auth] Login successful. User ID: ${userId}`);
  } catch (err) {
    if (err.response && (err.response.status === 401 || err.response.status === 404)) {
      console.log(`[Auth] Login failed or user not found. Registering new user...`);
      const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
        name: 'Suraj Takkallapelly',
        email: TEST_EMAIL,
        password: TEST_PASS,
      });
      token = signupRes.data.token;
      userId = signupRes.data._id;
      console.log(`[Auth] Registration successful! User ID: ${userId}`);
    } else {
      throw new Error(`Auth initiation failed: ${err.message}`);
    }
  }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Log in or sign up the collaborator user
  let collabToken;
  let collabId;
  try {
    console.log(`[Auth] Attempting login for collaborator ${COLLAB_EMAIL}...`);
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: COLLAB_EMAIL,
      password: COLLAB_PASS,
    });
    collabToken = loginRes.data.token;
    collabId = loginRes.data._id;
    console.log(`[Auth] Collaborator login successful. User ID: ${collabId}`);
  } catch (err) {
    if (err.response && (err.response.status === 401 || err.response.status === 404)) {
      console.log(`[Auth] Collaborator login failed or not found. Registering collaborator...`);
      const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
        name: 'Suraj Collaborator',
        email: COLLAB_EMAIL,
        password: COLLAB_PASS,
      });
      collabToken = signupRes.data.token;
      collabId = signupRes.data._id;
      console.log(`[Auth] Collaborator registration successful! User ID: ${collabId}`);
    } else {
      throw new Error(`Collaborator auth initiation failed: ${err.message}`);
    }
  }

  const collabHeaders = { headers: { Authorization: `Bearer ${collabToken}` } };

  // Helper for cleanup (delete any files named 'suraj-test.txt', 'bulk-1.txt', 'bulk-2.txt')
  async function cleanUpFiles(headers) {
    const listRes = await axios.get(`${BASE_URL}/api/files/my-files`, headers);
    const filesToClean = listRes.data.filter(f => 
      ['suraj-test.txt', 'bulk-1.txt', 'bulk-2.txt'].includes(f.fileName)
    );
    for (const f of filesToClean) {
      console.log(`[Cleanup] Permanently deleting file ${f.fileName} (${f._id})...`);
      // First move to trash if not already trashed
      if (!f.isTrashed) {
        await axios.put(`${BASE_URL}/api/files/trash/${f._id}`, {}, headers);
      }
      await axios.delete(`${BASE_URL}/api/files/${f._id}`, headers);
    }
  }

  await cleanUpFiles(authHeaders);

  // -------------------------------------------------------------
  // FEATURE 1: FILE VERSIONING
  // -------------------------------------------------------------
  console.log(`\n--- TESTING FEATURE: FILE VERSIONING ---`);

  // Step A: Upload version 1 of 'suraj-test.txt'
  console.log('[Versioning] Uploading Version 1 of suraj-test.txt...');
  const v1UrlRes = await axios.get(`${BASE_URL}/api/files/upload-url`, {
    params: { fileName: 'suraj-test.txt', fileType: 'text/plain' },
    ...authHeaders
  });
  const { uploadUrl: v1UploadUrl, s3Key: v1S3Key } = v1UrlRes.data;

  const v1Content = 'This is version 1 content of the file.';
  await axios.put(v1UploadUrl, v1Content, { headers: { 'Content-Type': 'text/plain' } });
  
  const v1SaveRes = await axios.post(`${BASE_URL}/api/files/save-metadata`, {
    fileName: 'suraj-test.txt',
    s3Key: v1S3Key,
    fileSize: v1Content.length,
    fileType: 'text/plain',
    folder: 'Root',
  }, authHeaders);
  const fileId = v1SaveRes.data._id;
  console.log(`[Versioning] File created. ID: ${fileId}`);

  // Step B: Upload version 2 of 'suraj-test.txt'
  console.log('[Versioning] Uploading Version 2 of suraj-test.txt...');
  const v2UrlRes = await axios.get(`${BASE_URL}/api/files/upload-url`, {
    params: { fileName: 'suraj-test.txt', fileType: 'text/plain' },
    ...authHeaders
  });
  const { uploadUrl: v2UploadUrl, s3Key: v2S3Key } = v2UrlRes.data;

  const v2Content = 'This is version 2 content of the file. It should overwrite and create a version history entry.';
  await axios.put(v2UploadUrl, v2Content, { headers: { 'Content-Type': 'text/plain' } });

  const v2SaveRes = await axios.post(`${BASE_URL}/api/files/save-metadata`, {
    fileName: 'suraj-test.txt',
    s3Key: v2S3Key,
    fileSize: v2Content.length,
    fileType: 'text/plain',
    folder: 'Root',
  }, authHeaders);

  // Step C: Verify versions list contains 1 element (the old Version 1)
  console.log('[Versioning] Fetching versions list...');
  const versionsRes = await axios.get(`${BASE_URL}/api/files/${fileId}/versions`, authHeaders);
  const versions = versionsRes.data;
  console.log(`[Versioning] Found versions:`, versions);
  if (versions.length !== 1) {
    throw new Error(`Expected exactly 1 historical version, found ${versions.length}`);
  }
  if (versions[0].versionNumber !== 1) {
    throw new Error(`Expected historical version to be versionNumber 1`);
  }

  // Verify current active content is version 2
  const activeContentRes = await axios.get(`${BASE_URL}/api/files/download/${v2S3Key}`, {
    ...authHeaders,
    responseType: 'text'
  });
  console.log(`[Versioning] Current active content: "${activeContentRes.data}"`);
  if (activeContentRes.data !== v2Content) {
    throw new Error('Active content is not version 2!');
  }

  // Step D: Restore Version 1
  console.log('[Versioning] Restoring Version 1...');
  const restoreRes = await axios.post(`${BASE_URL}/api/files/${fileId}/versions/1/restore`, {}, authHeaders);
  console.log('[Versioning] Restore response received.');

  // Verify current active file key has changed to Version 1 S3 key
  const restoredFileObj = restoreRes.data;
  if (restoredFileObj.s3Key !== v1S3Key) {
    throw new Error(`Restore failed: S3 key did not switch back to Version 1 key`);
  }

  // Verify active download content is now version 1 content
  const restoredContentRes = await axios.get(`${BASE_URL}/api/files/download/${v1S3Key}`, {
    ...authHeaders,
    responseType: 'text'
  });
  console.log(`[Versioning] Current active content after restore: "${restoredContentRes.data}"`);
  if (restoredContentRes.data !== v1Content) {
    throw new Error('Restored content is not version 1!');
  }

  // Verify there is now exactly 1 historical version (which should be Version 2)
  const newVersionsRes = await axios.get(`${BASE_URL}/api/files/${fileId}/versions`, authHeaders);
  console.log(`[Versioning] Post-restore versions:`, newVersionsRes.data);
  if (newVersionsRes.data.length !== 1) {
    throw new Error(`Expected exactly 1 historical version after restore, found ${newVersionsRes.data.length}`);
  }
  if (newVersionsRes.data[0].versionNumber !== 2) {
    throw new Error(`Expected historical version after restore to be versionNumber 2`);
  }

  // Delete version 2
  console.log('[Versioning] Deleting Version 2 history entry...');
  await axios.delete(`${BASE_URL}/api/files/${fileId}/versions/2`, authHeaders);
  const finalVersionsRes = await axios.get(`${BASE_URL}/api/files/${fileId}/versions`, authHeaders);
  if (finalVersionsRes.data.length !== 0) {
    throw new Error(`Expected versions to be empty after deletion, found ${finalVersionsRes.data.length}`);
  }
  console.log('[Versioning] Versioning tests passed successfully!');

  // -------------------------------------------------------------
  // FEATURE 2: COLLABORATIVE SHARING
  // -------------------------------------------------------------
  console.log(`\n--- TESTING FEATURE: COLLABORATIVE SHARING ---`);

  // Step A: Share file with collaborator's email
  console.log(`[Sharing] Sharing file ${fileId} with collaborator ${COLLAB_EMAIL}...`);
  const shareRes = await axios.post(`${BASE_URL}/api/files/share-user/${fileId}`, {
    email: COLLAB_EMAIL,
    permission: 'edit'
  }, authHeaders);
  console.log(`[Sharing] Share response:`, shareRes.data.sharedWith);

  const sharedRecord = shareRes.data.sharedWith.find(s => s.email === COLLAB_EMAIL);
  if (!sharedRecord) {
    throw new Error(`Sharing record not found in file sharedWith array`);
  }
  if (sharedRecord.permission !== 'edit') {
    throw new Error(`Expected sharing permission 'edit', got '${sharedRecord.permission}'`);
  }

  // Step B: Log in as collaborator and check Shared with me
  console.log('[Sharing] Verifying Shared with me list as collaborator...');
  const sharedWithMeRes = await axios.get(`${BASE_URL}/api/files/shared-with-me`, collabHeaders);
  console.log('[Sharing] Collaborator Shared with me list:', sharedWithMeRes.data.map(f => f.fileName));
  const hasSharedFile = sharedWithMeRes.data.some(f => f._id === fileId);
  if (!hasSharedFile) {
    throw new Error(`Collaborator cannot see the shared file in Shared with me list!`);
  }

  // Step C: Revoke sharing access
  console.log(`[Sharing] Revoking share access for collaborator ID: ${collabId}...`);
  await axios.delete(`${BASE_URL}/api/files/share-user/${fileId}/${collabId}`, authHeaders);

  // Verify not visible anymore
  const postRevokeRes = await axios.get(`${BASE_URL}/api/files/shared-with-me`, collabHeaders);
  const stillHasSharedFile = postRevokeRes.data.some(f => f._id === fileId);
  if (stillHasSharedFile) {
    throw new Error(`Collaborator can still see the shared file after access revocation!`);
  }
  console.log('[Sharing] Collaborative sharing tests passed successfully!');

  // -------------------------------------------------------------
  // FEATURE 3: FILTERS & SORTING
  // -------------------------------------------------------------
  console.log(`\n--- TESTING FEATURE: FILTERS & SORTING ---`);

  // We have 'suraj-test.txt'. Let's create an image file and check type filtering.
  console.log('[Filters] Creating mock image file...');
  const imgUrlRes = await axios.get(`${BASE_URL}/api/files/upload-url`, {
    params: { fileName: 'suraj-image.png', fileType: 'image/png' },
    ...authHeaders
  });
  const { uploadUrl: imgUploadUrl, s3Key: imgS3Key } = imgUrlRes.data;
  await axios.put(imgUploadUrl, 'mock-image-data', { headers: { 'Content-Type': 'image/png' } });
  const imgSaveRes = await axios.post(`${BASE_URL}/api/files/save-metadata`, {
    fileName: 'suraj-image.png',
    s3Key: imgS3Key,
    fileSize: 15,
    fileType: 'image/png',
    folder: 'Root',
  }, authHeaders);
  const imgId = imgSaveRes.data._id;

  // Query files of type = image
  console.log('[Filters] Fetching type=image files...');
  const imageFilesRes = await axios.get(`${BASE_URL}/api/files/my-files`, {
    params: { type: 'image' },
    ...authHeaders
  });
  console.log('[Filters] Image files list:', imageFilesRes.data.map(f => f.fileName));
  if (!imageFilesRes.data.some(f => f._id === imgId)) {
    throw new Error('Image filter failed to return the mock image!');
  }
  if (imageFilesRes.data.some(f => f._id === fileId)) {
    throw new Error('Image filter returned a text file!');
  }

  // Query files of type = text
  console.log('[Filters] Fetching type=text files...');
  const textFilesRes = await axios.get(`${BASE_URL}/api/files/my-files`, {
    params: { type: 'text' },
    ...authHeaders
  });
  console.log('[Filters] Text files list:', textFilesRes.data.map(f => f.fileName));
  if (!textFilesRes.data.some(f => f._id === fileId)) {
    throw new Error('Text filter failed to return the mock text file!');
  }

  // Sort files by fileName asc
  console.log('[Filters] Sorting files by fileName_asc...');
  const sortRes = await axios.get(`${BASE_URL}/api/files/my-files`, {
    params: { sortBy: 'fileName_asc' },
    ...authHeaders
  });
  const sortedNames = sortRes.data.map(f => f.fileName);
  console.log('[Filters] Sorted names:', sortedNames);
  // Verify that it is correctly sorted ascendingly alphabetically
  const expectedSorted = [...sortedNames].sort();
  if (JSON.stringify(sortedNames) !== JSON.stringify(expectedSorted)) {
    throw new Error('Sorting by fileName_asc failed!');
  }

  // Clean up mock image
  if (imgId) {
    await axios.put(`${BASE_URL}/api/files/trash/${imgId}`, {}, authHeaders);
    await axios.delete(`${BASE_URL}/api/files/${imgId}`, authHeaders);
  }
  console.log('[Filters] Filters & sorting tests passed successfully!');

  // -------------------------------------------------------------
  // FEATURE 4: BULK OPERATIONS
  // -------------------------------------------------------------
  console.log(`\n--- TESTING FEATURE: BULK OPERATIONS ---`);

  // Step A: Create folder and files to bulk test
  console.log('[Bulk] Creating folder "SurajFolder"...');
  let folderId;
  try {
    const folderRes = await axios.post(`${BASE_URL}/api/files/folders`, { name: 'SurajFolder' }, authHeaders);
    folderId = folderRes.data._id;
    console.log(`[Bulk] Folder created. ID: ${folderId}`);
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message.includes('already exists')) {
      console.log(`[Bulk] Folder already exists, fetching folders list...`);
      const getFoldersRes = await axios.get(`${BASE_URL}/api/files/folders`, authHeaders);
      const matchedFolder = getFoldersRes.data.find(f => f.name === 'SurajFolder');
      folderId = matchedFolder._id;
    } else {
      throw err;
    }
  }

  console.log('[Bulk] Creating 2 files "bulk-1.txt" and "bulk-2.txt"...');
  // Create bulk-1
  const b1UrlRes = await axios.get(`${BASE_URL}/api/files/upload-url`, {
    params: { fileName: 'bulk-1.txt', fileType: 'text/plain' },
    ...authHeaders
  });
  await axios.put(b1UrlRes.data.uploadUrl, 'Bulk 1 Content', { headers: { 'Content-Type': 'text/plain' } });
  const b1SaveRes = await axios.post(`${BASE_URL}/api/files/save-metadata`, {
    fileName: 'bulk-1.txt',
    s3Key: b1UrlRes.data.s3Key,
    fileSize: 14,
    fileType: 'text/plain',
    folder: 'Root'
  }, authHeaders);
  const b1Id = b1SaveRes.data._id;

  // Create bulk-2
  const b2UrlRes = await axios.get(`${BASE_URL}/api/files/upload-url`, {
    params: { fileName: 'bulk-2.txt', fileType: 'text/plain' },
    ...authHeaders
  });
  await axios.put(b2UrlRes.data.uploadUrl, 'Bulk 2 Content', { headers: { 'Content-Type': 'text/plain' } });
  const b2SaveRes = await axios.post(`${BASE_URL}/api/files/save-metadata`, {
    fileName: 'bulk-2.txt',
    s3Key: b2UrlRes.data.s3Key,
    fileSize: 14,
    fileType: 'text/plain',
    folder: 'Root'
  }, authHeaders);
  const b2Id = b2SaveRes.data._id;

  // Step B: Bulk Move to "SurajFolder"
  console.log(`[Bulk] Bulk moving files [${b1Id}, ${b2Id}] to folder "SurajFolder"...`);
  await axios.post(`${BASE_URL}/api/files/bulk-move`, {
    fileIds: [b1Id, b2Id],
    folderName: 'SurajFolder'
  }, authHeaders);

  // Verify they are in folder "SurajFolder"
  const folderFilesRes = await axios.get(`${BASE_URL}/api/files/my-files`, {
    params: { folder: 'SurajFolder' },
    ...authHeaders
  });
  console.log('[Bulk] Files inside SurajFolder:', folderFilesRes.data.map(f => f.fileName));
  if (folderFilesRes.data.length < 2) {
    throw new Error('Bulk move failed: Folder contains less than 2 files!');
  }

  // Step C: Bulk download as ZIP
  console.log(`[Bulk] Testing bulk download ZIP stream for [${b1Id}, ${b2Id}]...`);
  const zipRes = await axios.get(`${BASE_URL}/api/files/bulk-download`, {
    params: { ids: `${b1Id},${b2Id}` },
    ...authHeaders,
    responseType: 'arraybuffer'
  });
  console.log(`[Bulk] ZIP Download Response Status: ${zipRes.status}, Size: ${zipRes.data.byteLength} bytes`);
  if (zipRes.status !== 200) {
    throw new Error(`Bulk download failed with status code ${zipRes.status}`);
  }
  if (zipRes.data.byteLength < 100) {
    throw new Error(`Bulk download returned a file that is too small to be a ZIP!`);
  }

  // Step D: Bulk Trash
  console.log(`[Bulk] Bulk trashing files [${b1Id}, ${b2Id}]...`);
  await axios.post(`${BASE_URL}/api/files/bulk-trash`, { fileIds: [b1Id, b2Id] }, authHeaders);

  // Verify they are marked as trashed
  const trashFilesRes = await axios.get(`${BASE_URL}/api/files/my-files`, {
    params: { trash: 'true' },
    ...authHeaders
  });
  const trashedIds = trashFilesRes.data.map(f => f._id);
  console.log('[Bulk] Trashed file IDs:', trashedIds);
  if (!trashedIds.includes(b1Id) || !trashedIds.includes(b2Id)) {
    throw new Error('Bulk trash failed: Files are not in trash!');
  }

  // Step E: Bulk Restore
  console.log(`[Bulk] Bulk restoring files [${b1Id}, ${b2Id}]...`);
  await axios.post(`${BASE_URL}/api/files/bulk-restore`, { fileIds: [b1Id, b2Id] }, authHeaders);

  // Verify they are restored
  const postRestoreRes = await axios.get(`${BASE_URL}/api/files/my-files`, {
    params: { trash: 'true' },
    ...authHeaders
  });
  const postRestoreTrashedIds = postRestoreRes.data.map(f => f._id);
  if (postRestoreTrashedIds.includes(b1Id) || postRestoreTrashedIds.includes(b2Id)) {
    throw new Error('Bulk restore failed: Files are still in trash!');
  }

  // Step F: Bulk Delete permanently
  console.log(`[Bulk] Bulk trashing again before delete...`);
  await axios.post(`${BASE_URL}/api/files/bulk-trash`, { fileIds: [b1Id, b2Id] }, authHeaders);
  console.log(`[Bulk] Bulk deleting permanently [${b1Id}, ${b2Id}]...`);
  await axios.post(`${BASE_URL}/api/files/bulk-delete`, { fileIds: [b1Id, b2Id] }, authHeaders);

  // Verify they are completely deleted from DB
  const finalFilesRes = await axios.get(`${BASE_URL}/api/files/my-files`, authHeaders);
  const finalFileIds = finalFilesRes.data.map(f => f._id);
  if (finalFileIds.includes(b1Id) || finalFileIds.includes(b2Id)) {
    throw new Error('Bulk delete failed: Files are still present in my-files!');
  }

  console.log('[Bulk] Bulk operations tests passed successfully!');

  // Final cleanup of version test file
  console.log('\n[Cleanup] Cleaning up version test file...');
  await cleanUpFiles(authHeaders);

  console.log(`\n=================== ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY! ===================\n`);
}

runTests().catch(err => {
  console.error(`\nTest Run Failed!`, err);
  process.exit(1);
});
