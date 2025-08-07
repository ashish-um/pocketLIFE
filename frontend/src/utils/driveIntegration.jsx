import axios from "axios";

export async function findOrCreateFolder(accessToken, folderName) {
  try {
    // 1. Search for the folder first.
    // The query looks for a folder with the given name, within the appDataFolder.
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and 'appDataFolder' in parents and trashed=false`;

    let response = await axios.get(
      "https://www.googleapis.com/drive/v3/files",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { q: query, spaces: "appDataFolder", fields: "files(id)" },
      }
    );

    const files = response.data.files;
    if (files && files.length > 0) {
      console.log(
        `✅ Found existing folder '${folderName}' with ID: ${files[0].id}`
      );
      return files[0].id; // Folder exists, return its ID
    }

    // 2. If the folder doesn't exist, create it.
    console.log(`Folder '${folderName}' not found. Creating it...`);
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: ["appDataFolder"], // Create it inside the appDataFolder
    };

    response = await axios.post(
      "https://www.googleapis.com/drive/v3/files",
      folderMetadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        params: { fields: "id" },
      }
    );

    console.log(
      `✅ Successfully created folder '${folderName}' with ID: ${response.data.id}`
    );
    return response.data.id;
  } catch (error) {
    console.error(
      `❌ Error finding or creating folder '${folderName}':`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function deleteDriveFile(accessToken, fileId) {
  // Defensive check for valid inputs
  if (!fileId || typeof fileId !== "string") {
    console.error("❌ Invalid or missing fileId provided for deletion.");
    return false;
  }

  try {
    // console.log(`Attempting to delete file with ID: ${fileId}`); // Commented out for cleaner bulk logs
    await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return true;
  } catch (error) {
    console.error(
      `Error deleting file ${fileId}:`,
      error.response?.data || error.message
    );
    return false;
  }
}

export async function deleteAllFilesByName(
  accessToken,
  fileNameToDelete,
  parentFolderId = "appDataFolder"
) {
  console.log(
    `Searching for all files named: '${fileNameToDelete}' to delete...`
  );

  if (!accessToken || typeof accessToken !== "string") {
    console.error("❌ Invalid or missing accessToken provided.");
    return 0;
  }
  if (!fileNameToDelete || typeof fileNameToDelete !== "string") {
    console.error("❌ Invalid or missing fileNameToDelete provided.");
    return 0;
  }

  try {
    // 1. Find all files matching the name
    const query = `name='${fileNameToDelete}' and '${parentFolderId}' in parents and trashed=false`;
    const response = await axios.get(
      "https://www.googleapis.com/drive/v3/files",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: query,
          spaces: "appDataFolder",
          fields: "files(id)", // We only need the IDs for deletion
        },
      }
    );

    const files = response.data.files;
    if (!files || files.length === 0) {
      console.log("✅ No files found with that name. Nothing to delete.");
      return 0;
    }

    console.log(
      `Found ${files.length} file(s) to delete. Starting deletion...`
    );

    // 2. Create an array of deletion promises
    const deletionPromises = files.map((file) =>
      deleteDriveFile(accessToken, file.id)
    );

    // 3. Execute all deletion promises concurrently
    const results = await Promise.all(deletionPromises);

    // 4. Count how many were successful (true)
    const successfulDeletions = results.filter(
      (result) => result === true
    ).length;
    console.log(
      `✅ Successfully deleted ${successfulDeletions} out of ${files.length} files.`
    );

    return successfulDeletions;
  } catch (error) {
    console.error(
      "❌ An error occurred during the bulk deletion process:",
      error.response?.data || error.message
    );
    return 0;
  }
}

async function findFileByName(accessToken, fileName, parentFolderId) {
  try {
    const query = `name='${fileName}' and '${parentFolderId}' in parents and trashed=false`;

    const response = await axios.get(
      "https://www.googleapis.com/drive/v3/files",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: query,
          spaces: "appDataFolder",
          fields: "files(id, name)", // We only need the ID and name
        },
      }
    );

    const files = response.data.files;
    if (files && files.length > 0) {
      // File found, return its ID
      return files[0].id;
    } else {
      // File not found
      return null;
    }
  } catch (error) {
    // It's normal for this to "fail" if the file isn't found, so we can make this less verbose.
    console.error(
      "Error finding file by name:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function updateFileContent(accessToken, fileId, newContent) {
  try {
    const boundary = "----GoogleDriveBoundary" + Date.now();
    const multipartRequestBody =
      `--${boundary}\r\n` +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      "{}\r\n" + // Empty metadata part for a content-only update
      `--${boundary}\r\n` +
      "Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
      `${newContent}\r\n` +
      `--${boundary}--`;

    const response = await axios.patch(
      // The URL for updating includes the fileId and uses the PATCH method.
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
      multipartRequestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating file content:",
      error.response?.data || error.message
    );
    return null;
  }
}

export async function saveOrUpdateFileInDrive(
  accessToken,
  fileName,
  fileContent,
  parentFolder = "appDataFolder"
) {
  console.log(`Checking if file '${fileName}' already exists...`);
  const existingFileId = await findFileByName(
    accessToken,
    fileName,
    parentFolder
  );

  if (existingFileId) {
    console.log(`File exists. Updating content for file ID: ${existingFileId}`);
    return await updateFileContent(accessToken, existingFileId, fileContent);
  } else {
    console.log("File does not exist. Creating a new file.");
    // We can reuse the upload function we already built.
    // NOTE: Make sure your original 'uploadTextFileToDrive' function is available here.
    return await uploadTextFileToDrive(
      accessToken,
      fileName,
      fileContent,
      parentFolder
    );
  }
}

async function uploadTextFileToDrive(
  accessToken,
  fileName,
  fileContent,
  parentFolder
) {
  const metadata = {
    name: fileName,
    mimeType: "text/plain",
    parents: [parentFolder],
  };
  const boundary = "----GoogleDriveBoundary" + Date.now();
  const multipartRequestBody =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
    `${fileContent}\r\n` +
    `--${boundary}--`;

  try {
    const response = await axios.post(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      multipartRequestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating new file:",
      error.response?.data || error.message
    );
    return null;
  }
}

export async function readDriveFileContent(accessToken, fileId) {
  if (!fileId) {
    console.error("❌ No fileId provided to readDriveFileContent.");
    return null;
  }
  try {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { alt: "media" }, // Crucial: gets file content, not metadata
        responseType: "text",
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error reading content for file ${fileId}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

export async function readFileByName(
  accessToken,
  fileName,
  parentFolderId = "appDataFolder"
) {
  console.log("using this token:", accessToken);

  console.log(`Attempting to read file by name: '${fileName}'`);
  // Step 1: Find the file by its name to get the ID.
  const fileId = await findFileByName(accessToken, fileName, parentFolderId);

  if (fileId) {
    console.log(`File found with ID: ${fileId}. Now fetching content.`);
    // Step 2: Use the found ID to read the file's content.
    return await readDriveFileContent(accessToken, fileId);
  } else {
    console.log(`File '${fileName}' not found.`);
    return null;
  }
}

export async function findOrCreateJsonFileByName(
  accessToken,
  fileName,
  defaultContent = "{}",
  parentFolderId = "appDataFolder"
) {
  console.log(`Attempting to find or create file: '${fileName}'`);

  // Step 1: Find the file by its name to get the ID.
  const fileId = await findFileByName(accessToken, fileName, parentFolderId);

  if (fileId) {
    // --- FILE EXISTS ---
    console.log(`File found with ID: ${fileId}. Reading content.`);
    const textContent = await readDriveFileContent(accessToken, fileId);

    if (textContent) {
      try {
        // Try to parse the existing content
        // const jsonObject = JSON.parse(textContent);
        console.log("✅ Successfully read and parsed existing file.");
        return textContent;
      } catch (e) {
        // This can happen if the file is empty or corrupted.
        console.error(
          `File '${fileName}' content is corrupt or not valid JSON. Returning default content.`,
          e
        );
        return defaultContent;
      }
    } else {
      // File exists but is empty.
      console.warn(
        `File '${fileName}' exists but is empty. Returning default content.`
      );
      return defaultContent;
    }
  } else {
    // --- FILE DOES NOT EXIST ---
    console.log(`File '${fileName}' not found. Creating it now...`);
    // Use the main save function which handles creation.
    const createdFile = await saveOrUpdateFileInDrive(
      accessToken,
      fileName,
      defaultContent,
      parentFolderId
    );

    if (createdFile) {
      console.log("✅ Successfully created new file.");
      // Return the default content so the app can use it immediately.
      return defaultContent;
    } else {
      console.error("❌ Failed to create the new file.");
      return null; // Indicate a critical failure
    }
  }
}

export async function deleteAllAppData(accessToken) {
  console.warn(
    "⚠️ WARNING: Starting complete deletion of all app data from Google Drive."
  );

  if (!accessToken || typeof accessToken !== "string") {
    console.error("❌ Invalid or missing accessToken provided.");
    return 0;
  }

  try {
    // 1. List ALL items (files and folders) in the appDataFolder.
    // The `spaces=appDataFolder` query recursively finds everything.
    const response = await axios.get(
      "https://www.googleapis.com/drive/v3/files",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          spaces: "appDataFolder",
          fields: "files(id)", // We only need the IDs for deletion
          pageSize: 1000, // Get up to 1000 items at once
        },
      }
    );

    const items = response.data.files;
    if (!items || items.length === 0) {
      console.log("✅ No app data found in Google Drive. Nothing to delete.");
      return 0;
    }

    console.log(
      `Found ${items.length} total items (files and folders) to delete. Starting deletion...`
    );

    // 2. Create an array of deletion promises for every item.
    const deletionPromises = items.map((item) =>
      deleteDriveFile(accessToken, item.id)
    );

    // 3. Execute all deletion promises concurrently.
    const results = await Promise.all(deletionPromises);

    // 4. Count how many were successful (true)
    const successfulDeletions = results.filter(
      (result) => result === true
    ).length;
    console.log(
      `✅ Successfully deleted ${successfulDeletions} out of ${items.length} items.`
    );

    return successfulDeletions;
  } catch (error) {
    console.error(
      "❌ An error occurred during the bulk deletion process:",
      error.response?.data || error.message
    );
    return 0;
  }
}
