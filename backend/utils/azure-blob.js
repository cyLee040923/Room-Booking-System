
const { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } = require("@azure/storage-blob");

// require('dotenv').config();
// const { v1: uuidv1 } = require('uuid');

const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
// const containerName = "roomimages";
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);

// const accountName = connStr.match(/AccountName=([^;]+)/)[1];
// const accountKey = connStr.match(/AccountKey=([^;]+)/)[1];
// const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);


// async function createBlob(fileName, fileContent) {
//     try {
//         const containerClient = blobServiceClient.getContainerClient(containerName);
//         const blobName = fileName;
//         const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
//         await blockBlobClient.upload(fileContent, fileContent.length);
//         console.log(`Upload block blob ${blobName} successfully`);

//         // Generate SAS URL immediately after upload
//         const sasUrl = await generateBlobSasUri(blobName);

//         return {
//             blobName: blobName,
//             url: blockBlobClient.url,
//             sasUrl: sasUrl
//         };
//     } catch (error) {
//         console.error('Error creating blob:', error);
//         throw error;
//     }
// }
async function createBlob(containerName, fileName, fileContent) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = fileName;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        const uploadResponse = await blockBlobClient.upload(fileContent, fileContent.length);
        if (!uploadResponse) {
            throw new Error('Blob upload failed');
        }

        console.log(`Upload block blob ${blobName} successfully`);

        return {
            blobName: blobName,
            url: blockBlobClient.url
        };
    } catch (error) {
        console.error('Error creating blob:', error);
        throw error;
    }
}

// async function generateBlobSasUri(blobName) {
//     try {
//         // const containerClient = blobServiceClient.getContainerClient(containerName);
//         // const blobClient = containerClient.getBlobClient(blobName);

//         const startsOn = new Date();
//         const expiresOn = new Date(new Date().valueOf() + 24 * 60 * 60 * 1000); // 24 hours from now

//         const sasOptions = {
//             containerName,
//             blobName,
//             permissions: BlobSASPermissions.parse("r"), // Read-only permission
//             startsOn,
//             expiresOn,
//         };

//         // const sasToken = generateBlobSASQueryParameters(
//         //     sasOptions,
//         //     sharedKeyCredential
//         // ).toString();

//         const sasToken = generateBlobSASQueryParameters(
//             {
//                 containerName: containerName,
//                 blobName: blobName,
//                 permissions: sasOptions.permissions,
//                 startsOn: sasOptions.startsOn,
//                 expiresOn: sasOptions.expiresOn,
//             },
//             sharedKeyCredential
//         ).toString();

//         const blobClient = blobServiceClient.getContainerClient(containerName).getBlobClient(blobName);
//         return `${blobClient.url}?${sasToken}`;
//     } catch (error) {
//         console.error('Error generating SAS URI:', error);
//         throw error;
//     }
// }


module.exports = { createBlob };
