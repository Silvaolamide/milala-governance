require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("dotenv").config();


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
      accounts: ["8d93db770ffda91bce9e758fb88c6bb6ff1adb6191f125481844d6fa4c64d589"],
    },
  },
  etherscan: {
    // apiKey: "QY163355TNRJXJFY9WFM8WAHNBS6FF63HN",
    // apiKey: "PNTIGJ3SRJU7SQ5FRXHUIT94DN9BC3WCMK",
    apiKey: {
      bscTestnet: "PNTIGJ3SRJU7SQ5FRXHUIT94DN9BC3WCMK"
  }
  },
};