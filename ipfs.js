const axios = require("axios");
const FormData = require("form-data");

// Function to upload multiple files to IPFS via Pinata
const addFilestoIPFS = async (arrayofPathandBase64Content) => {
  try {
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const uploadPromises = [];

    // Log to check if the array is being passed correctly (Optional)
    console.log("Uploading files:", arrayofPathandBase64Content);

    // Loop over the array and upload each file
    arrayofPathandBase64Content.forEach((file) => {
      const formData = new FormData();
      const buffer = Buffer.from(file.content, "base64");
      formData.append("file", buffer, { filename: file.path });

      // Send each file in a separate request to Pinata
      uploadPromises.push(
        axios.post(url, formData, {
          maxContentLength: "Infinity", // Allow large files
          headers: {
            "pinata_api_key": process.env.PINATA_API_KEY,
            "pinata_secret_api_key": process.env.PINATA_SECRET_API_KEY,
            ...formData.getHeaders(),
          },
        })
      );
    });

    // Wait for all uploads to complete
    const responses = await Promise.all(uploadPromises);

    console.log("All files uploaded successfully!");

    // Return IPFS hashes (CIDs) for all uploaded files
    const ipfsHashes = responses.map((response) => {
      console.log("IPFS Hash (CID):", response.data.IpfsHash);
      return response.data.IpfsHash;
    });

    return ipfsHashes; // Return the IPFS hashes (CIDs)

  } catch (error) {
    // Enhanced error handling
    console.error("Error uploading files to IPFS:", error.response?.data || error.message);

    // Throw the error or return a custom error message (depending on your setup)
    throw new Error("An error occurred while uploading files to IPFS.");
  }
};

module.exports = { addFilestoIPFS };  // Export the function
