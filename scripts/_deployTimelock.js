const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
var util = require('util');
var log_stdout = process.stdout;
// const memphrase = fs.readFileSync(".secret").toString().trim();

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
  const minDelay = 0;
  const proposer = '0xbB2B3074FfD055B77A6b99E78C820f85AB3429a0';
  const executor = '0xbB2B3074FfD055B77A6b99E78C820f85AB3429a0';
  const admin = '0xbB2B3074FfD055B77A6b99E78C820f85AB3429a0';
  // const FEE_DATA = {
  //   maxFeePerGas: ethers.utils.parseUnits("100", "gwei"),
  //   maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
  // };

  // // Wrap the provider so we can override fee data.
  // const provider = new ethers.providers.FallbackProvider([ethers.provider], 1);
  // provider.getFeeData = async () => FEE_DATA;

  // // Create the signer for the mnemonic, connected to the provider with hardcoded fee data
  // const signer = ethers.Wallet.fromMnemonic(memphrase).connect(provider);

  const Timelock = await ethers.getContractFactory("Timelock"); 
  const instance = await Timelock.deploy(minDelay, [proposer], [executor], admin)

  // const instance = await upgrades.deployProxy(Timelock);
  
  await instance.deployed();

  console.log("Timelock Instance address: " + instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
