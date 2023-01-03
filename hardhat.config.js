require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("dotenv").config({ path: ".env" });
// require("dotenv").config();
const { mnemonic, ETHERSCAN_KEY } = require('./.secret.json');
const { API_URL, PRIVATE_KEY, ETHERSCAN_KEY_GOERLI } = process.env;

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  networks: {
    hardhat: {}, 
    testnet3: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [mnemonic]
    },
  //   goerli: {
  //     url: API_URL,
  //     accounts: [`0x${PRIVATE_KEY}`]
  //  }
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY_GOERLI
  
  },
};