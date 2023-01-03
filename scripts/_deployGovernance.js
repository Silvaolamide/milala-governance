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
const TokenAddress= '0x734Fbc13488bc07e0B68Bf080653f937922B4A66';
// const TimelockAddress= '0xd234e8B392e2B8ba66cA7143E913E2D1196DC75C';

const minDelay = 0;
const proposer = '0xc6B0d512670fa464F515a8ce971609c78CBF0Cb7';
const executor = '0xc6B0d512670fa464F515a8ce971609c78CBF0Cb7';
const admin = '0xc6B0d512670fa464F515a8ce971609c78CBF0Cb7';

const Timelock = await ethers.getContractFactory("Timelock"); 
  const timelock = await Timelock.deploy(minDelay, [proposer], [executor], admin)

  // const instance = await upgrades.deployProxy(Timelock);
  
  await timelock.deployed();



  // const FEE_DATA = {
  //   maxFeePerGas: ethers.utils.parseUnits("100", "gwei"),
  //   maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
  // };

  // // Wrap the provider so we can override fee data.
  // const provider = new ethers.providers.FallbackProvider([ethers.provider], 1);
  // provider.getFeeData = async () => FEE_DATA;

  // // Create the signer for the mnemonic, connected to the provider with hardcoded fee data
  // const signer = ethers.Wallet.fromMnemonic(memphrase).connect(provider);

  const Governance = await ethers.getContractFactory("Milalagovernor"); 

  // const instance = await upgrades.deployProxy(PearlzToken);
  const instance = await upgrades.deployProxy(Governance, [TokenAddress, timelock.address], {
    initializer: "initialize",
    kind: "transparent",
  });
  
  await instance.deployed();
  
  // get timelock roles
  const timelockExecuterRole = await timelock.EXECUTOR_ROLE();
  const timelockProposerRole = await timelock.PROPOSER_ROLE();
  const timelockCancellerRole = await timelock.CANCELLER_ROLE();

  // grant timelock roles to governor contract
  await timelock.grantRole(timelockExecuterRole, instance.address);
  await timelock.grantRole(timelockProposerRole, instance.address);
  await timelock.grantRole(timelockCancellerRole, instance.address);

  console.log("Dao deployed to:  governor: "+ instance.address +" timelock: "+ timelock.address + " token: "+ TokenAddress,
  );

  // console.log("MilalaToken Instance address: " + instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
