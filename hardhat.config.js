require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("dotenv").config();
const { mnemonic, ETHERSCAN_KEY } = require('./.secret.json');
// console.log(process.env)
// const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY;
// const  ETHERSCAN_KEY =  process.env.ETHERSCAN_KEY
// console.log(DEV_PRIVATE_KEY)
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
    testnet3: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: [mnemonic]
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY
  
  },
};