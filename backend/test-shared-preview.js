import jwt from 'jsonwebtoken';

const apiBaseUrl = process.env.BASE_URL || 'http://localhost:5001';
const jwtSecret = 'super_secret_jwt_key_for_micro_google_drive';

async function request(url, options = {}) {
  const response = await fetch(`${apiBaseUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.response = { data };
    throw error;
  }

  return { data };
}

async function runTests() {
  console.log('=== STARTING SHAPED PREVIEW METADATA VERIFICATION TEST ===');

  const randomSuffix = Math.floor(Math.random() * 100000);
  const ownerEmail = `owner-${randomSuffix}@example.com`;
  const targetEmail = `unreg-target-${randomSuffix}@example.com`;
  const password = 'CloudVault@2026!';

  try {
    // 1. Register Owner
    console.log(`[Setup] Registering owner: ${ownerEmail}`);
    const ownerRegRes = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Owner User',
        email: ownerEmail,
        password: password
      })
    });
    const ownerToken = ownerRegRes.data.token;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    // 2. Create a File
    console.log('[Setup] Saving file metadata...');
    const fileRes = await request('/api/files/save-metadata', {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        fileName: 'instructions_anonymous.txt',
        s3Key: `anon-key-${randomSuffix}.txt`,
        fileSize: 500,
        fileType: 'text/plain',
        folder: 'Root'
      })
    });
    const fileId = fileRes.data._id;

    // 3. Share file with unregistered email
    console.log(`[Sharing] Sharing file with unregistered email: ${targetEmail}`);
    await request(`/api/files/share-user/${fileId}`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        email: targetEmail,
        permission: 'view'
      })
    });

    // 4. Generate emailToken
    console.log('[Token] Generating emailToken...');
    const emailToken = jwt.sign(
      { email: targetEmail.toLowerCase(), fileId: fileId },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 5. Try requesting file preview info route anonymously using emailToken
    console.log('[Verification] Accessing shared-preview endpoint anonymously with emailToken...');
    const accessRes = await request(`/api/files/shared-preview/${fileId}?emailToken=${emailToken}`);
    
    console.log('[Verification] Access response:', JSON.stringify(accessRes.data));
    if (accessRes.data.file && accessRes.data.downloadUrl) {
      console.log('✓ Successfully retrieved file metadata and download URLs anonymously!');
      console.log(`  File Name: ${accessRes.data.file.fileName}`);
      console.log(`  Owner: ${accessRes.data.file.owner.name} (${accessRes.data.file.owner.email})`);
      console.log(`  Download URL: ${accessRes.data.downloadUrl}`);
    } else {
      throw new Error('Response did not contain expected fields!');
    }

    // 6. Verify requesting with invalid token fails with 403
    console.log('[Verification] Checking if invalid token returns 403...');
    try {
      await request(`/api/files/shared-preview/${fileId}?emailToken=invalid_token_here`);
      throw new Error('Access should have been denied for invalid token!');
    } catch (err) {
      if (err.response && err.response.data.message.includes('Access denied')) {
        console.log('✓ Access successfully denied for invalid token (403)');
      } else {
        throw err;
      }
    }

    // 7. Test Revocation - Owner revokes share
    console.log('[Revocation] Owner revoking file access for email...');
    await request(`/api/files/share-user/${fileId}/${targetEmail}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });

    // 8. Verify the token now returns 403 Access Denied
    console.log('[Verification] Checking if access is blocked after revocation...');
    try {
      await request(`/api/files/shared-preview/${fileId}?emailToken=${emailToken}`);
      throw new Error('Access should have been denied after revocation!');
    } catch (err) {
      if (err.response && err.response.data.message.includes('Access denied')) {
        console.log('✓ Access successfully denied after revocation (403)');
      } else {
        throw err;
      }
    }

    console.log('=== ALL PREVIEW METADATA VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('Test Suite Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
