const logFileStorage = require("./build/logFileStorage.json");
const Web3 = require("web3");
const axios = require("axios");
const FormData = require("form-data");
const utils = require("./utils");

let web3, contract;

// Initialize Web3
const initializeWeb3 = async () => {
  if (web3 && contract) return;
  const provider = new Web3.Web3.providers.HttpProvider("HTTP://127.0.0.1:7545");
  web3 = new Web3.Web3(provider);
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = logFileStorage.networks[networkId];
  contract = new web3.eth.Contract(logFileStorage.abi, deployedNetwork.address);
};

// Function to upload a file to Pinata (IPFS)
const uploadFileToPinata = async (filePath, base64Content) => {
  try {
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const formData = new FormData();
    const buffer = Buffer.from(base64Content, "base64");
    formData.append("file", buffer, { filename: filePath });

    // Sending the request to Pinata
    const response = await axios.post(url, formData, {
      maxContentLength: "Infinity", // Allow large files
      headers: {
        "pinata_api_key": process.env.PINATA_API_KEY,
        "pinata_secret_api_key": process.env.PINATA_SECRET_API_KEY,
        ...formData.getHeaders(),
      },
    });

    // Log the response for debugging
    console.log("Pinata Upload Response:", response.data);

    // Return the IPFS hash (CID) of the uploaded file
    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error uploading file to Pinata:", error.response?.data || error.message);
    throw new Error(`Failed to upload file to Pinata: ${error.response?.data?.error || error.message}`);
  }
};

// Function to get block data from the contract
const getBlocksData = async () => {
  try {
    const data = await contract.methods.getter().call({ gas: "1000000" });
    return utils.processJSONforBigInt(data);
  } catch (error) {
    console.error("Error fetching blocks data:", error.message);
    throw new Error("Failed to fetch blocks data from the contract.");
  }
};

// Function to add a block to the contract with a file uploaded to IPFS via Pinata
const addBlock = async (filePath, base64Content, camp) => {
  try {
    // Upload the file to Pinata and get its IPFS hash (CID)
    const ipfsHash = await uploadFileToPinata(filePath, base64Content);

    // Save the IPFS hash and camp info to the contract
    const write = await contract.methods.setter(ipfsHash, camp).send({
      from: process.env.SENDER_ACCOUNT,
      gas: "1000000",
    });

    // Return the processed write result
    return utils.processJSONforBigInt(write);
  } catch (error) {
    console.error("Error adding block to the contract:", error.message);
    throw new Error("Failed to add block to the contract.");
  }
};

// Function to get Ethereum accounts
const getAccounts = async () => {
  try {
    const accounts = await web3.eth.getAccounts();
    return accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error.message);
    throw new Error("Failed to fetch Ethereum accounts.");
  }
};

// Export all the necessary functions
module.exports = {
  initializeWeb3,
  web3,
  contract,
  getBlocksData,
  addBlock,
  getAccounts,
};
