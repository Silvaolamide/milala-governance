const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// scripts/index.js
async function main() {
  const PearlzCreditSystem = await hre.ethers.getContractFactory("PearlzCreditSystem");
  const Token = await hre.ethers.getContractFactory('PearlzToken');

  // const address = "0xC82fDa94891CC9Fad9262b261f7343AFc18cfC50";
  // const address = "0x200EE38F80DeFF127c7F5dA9A477aAd8b99d8735";
  const address = "0x48c918834e4bD1D9b37ff913249666303358aA37";
  // const tokenAddress = '0x74B237bbe013c6F8D5F53A165637da5096CCb3a0';
  const tokenAddress = '0x07B5E51406812fe8D62cCe38D09AFaC52078e16C';

  const token = await Token.attach(tokenAddress);
  const contract = await PearlzCreditSystem.attach(address);
  console.log("pearlz credit system address: " + contract.address);

  const addresses = [
    '0x20Cb006BCFd1CE0249269804761BFe20d91b7C6c',
    '0x8faBfae3864E42762582D136CB2d0d7A51A95AD1',
    '0x0973a8889AB77d3b7958aE262152F042337af734',
    '0x4D2B3E3e2AFa26F65833D6FDf7a1A76595AaBbD8',
    '0x028d9350A67a5Bb91534e861960BB6dbFe7F43C4',
    '0xc6B0d512670fa464F515a8ce971609c78CBF0Cb7'
  ];

  // dont forget allowance!
  // const allowanceResp = await token.approve(address, ethers.utils.parseEther('9999999999999999999'));

  // console.log(allowanceResp)

  const amounts = [ethers.utils.parseEther('2000'),ethers.utils.parseEther('1800.24'),ethers.utils.parseEther('600'),ethers.utils.parseEther('2500'),ethers.utils.parseEther('1750'),ethers.utils.parseEther('1750')];

  const resp = await contract.creditAccounts(addresses, amounts, ethers.utils.parseEther("10400.24"));

  console.log(resp);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
