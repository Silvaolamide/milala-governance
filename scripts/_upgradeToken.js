const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
var util = require('util');
var log_stdout = process.stdout;
const memphrase = fs.readFileSync(".secret").toString().trim();

var dateNow = new Date();
var timeNow = (dateNow.getHours() > 12 ? dateNow.getHours() - 12 : dateNow.getHours())  + '-' + dateNow.getMinutes() + (dateNow.getHours() > 12 ? ' PM' : ' AM');
var logPath = dateNow.toDateString() + '_' + timeNow + ".log"
var log_file = fs.createWriteStream('LOGS_' + logPath, {flags : 'w'});
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

// scripts/index.js
async function main() {

  // const FEE_DATA = {
  //   maxFeePerGas: ethers.utils.parseUnits("100", "gwei"),
  //   maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
  // };

  // // Wrap the provider so we can override fee data.
  // const provider = new ethers.providers.FallbackProvider([ethers.provider], 1);
  // provider.getFeeData = async () => FEE_DATA;

  // // Create the signer for the mnemonic, connected to the provider with hardcoded fee data
  // const signer = ethers.Wallet.fromMnemonic(memphrase).connect(provider);

  const PearlzToken = await ethers.getContractFactory("PearlzToken"); 
  const instanceAddress = '0x5A56EbB676C48B58aC8507Ff2e9396CC84950f22';
  const upgraded = await upgrades.upgradeProxy(instanceAddress, PearlzToken);

  console.log("PearlzToken instance: " + upgraded.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
