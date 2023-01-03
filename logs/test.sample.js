const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("bignumber.js");

describe("SaudeVapor Governance test.", function () {
  it("Should go through the entire Proposal Lifecycle", async function () {

    const accounts = await ethers.getSigners();

    //Deploy Token and mint 1 token to owner
    const SVToken = await ethers.getContractFactory("SVToken");
    const svtoken = await SVToken.deploy();    
    await svtoken.deployed();
    expect(svtoken.address); 
    const setsvTOKENTx = await svtoken.safeMint( accounts[0].address , " String Test ");
    await setsvTOKENTx.wait(1);
    const transactionResponse = await svtoken.delegate(accounts[0].address)
    await transactionResponse.wait(1)

    expect(await svtoken.totalSupply()).to.equal(1);
    console.log(`Token Collection address: ${svtoken.address}`)
    console.log(`Total supply: ${await svtoken.totalSupply()}`)
    console.log("---------------------------------------------------------------")

    //Deploy Timelock    
    const TimeLock = await ethers.getContractFactory("TimeLock");
    const timelock = await TimeLock.deploy(0, [], []);    
    await timelock.deployed();
    expect(timelock.address);     
    console.log(`Timelock address: ${timelock.address}`)  
    console.log("---------------------------------------------------------------")

    //Deploy Governor
    const SVGovernor = await ethers.getContractFactory("SVGovernor");
    const svgovernor = await SVGovernor.deploy(svtoken.address, timelock.address);    
    await svgovernor.deployed();
    expect(svgovernor.address);
    console.log(`SVGovernor address: ${svgovernor.address}`)  
    console.log("---------------------------------------------------------------")

    // Setting up contracts for roles
    const proposerRole = await timelock.PROPOSER_ROLE()
    const executorRole = await timelock.EXECUTOR_ROLE()
    const adminRole = await timelock.TIMELOCK_ADMIN_ROLE()  
    const proposerTx = await timelock.grantRole(proposerRole, svgovernor.address)
    const proposerole = await proposerTx.wait(1)
    const executorTx = await timelock.grantRole(executorRole, "0x0000000000000000000000000000000000000000")
    const executorole = await executorTx.wait(1)
    const revokeTx = await timelock.revokeRole(adminRole, accounts[0].address)
    const revokerole = await revokeTx.wait(1)
    expect(proposerole.events[0].args.account).to.equal(svgovernor.address);
    expect(executorole.events[0].args.account).to.equal("0x0000000000000000000000000000000000000000");
    expect(revokerole.events[0].args.account).to.equal(accounts[0].address);
    console.log(`Proposer role: ${proposerole.events[0].args.account}`)
    console.log(`Executor role: ${executorole.events[0].args.account}`)
    console.log(`Revoke role: ${revokerole.events[0].args.account}`)
    console.log("---------------------------------------------------------------")

    // Transfer ownership
    const transferOwnershipTx = await svtoken.transferOwnership(timelock.address)
    const newTokenContractOwner = await transferOwnershipTx.wait(1)
    expect(newTokenContractOwner.events[0].args.newOwner).to.equal(timelock.address);
    console.log(`New SVToken contract ower: ${newTokenContractOwner.events[0].args.newOwner}`)
    console.log("---------------------------------------------------------------")

    //Create a proposal
    const token = await ethers.getContractAt("SVToken", svtoken.address);    
    const addressTo = accounts[1].address;
    const stringUri = " String Test 1 ";
    const transferCalldata = token.interface.encodeFunctionData("safeMint", [addressTo, stringUri]);
    const description = `Create a token to: ${addressTo}, for contribuition of: ${stringUri}`
    const proposeTX = await svgovernor.propose(
      [svtoken.address],
      [0],
      [transferCalldata],
      description,
    )
    await proposeTX.wait(1);
    const data = await proposeTX.wait(1);
    const proposalId = data.events[0].args.proposalId.toString()
    await hre.network.provider.send("hardhat_mine");  // Mine 1 block = votingDelay()
    const proposalState = await svgovernor.state(proposalId)    
    expect(proposalState).to.equal(0); // The state of the proposal. 1 is not passed. 0 is passed.
    console.log(`${data.events[0].event}: 
      proposalState: ${proposalState},
      proposalId: ${data.events[0].args.proposalId.toString()},
      tokenAddress: ${data.events[0].args.targets.toString()},
      amount: ${data.events[0].args[3].toString()},
      transferCalldata: ${data.events[0].args.calldatas.toString()},
      description: ${data.events[0].args.description},
      startBlock:  ${data.events[0].args.startBlock.toString()}`)
    console.log("---------------------------------------------------------------")

    // Cast a Vote
    const voteWay = 1 // 0 = Against, 1 = For, 2 = Abstain
    const voteTx = await svgovernor.castVote(proposalId, voteWay)
    await voteTx.wait(1)
    expect(await voteTx.wait(1)); 
    const hasVoted = await svgovernor.hasVoted(proposalId , accounts[0].address)
    expect(await hasVoted).to.equal(true);
    console.log(`AgainstVotes: ${(await svgovernor.proposalVotes(proposalId)).againstVotes.toString()}`)
    console.log(`ForVotes: ${(await svgovernor.proposalVotes(proposalId)).forVotes.toString()}`)
    console.log(`AbstainVotes: ${(await svgovernor.proposalVotes(proposalId)).abstainVotes.toString()}`)
    console.log(`Quorum: ${(await svgovernor.quorum(data.events[0].args.startBlock.toString()))}`)
    console.log("---------------------------------------------------------------")

    // TokenAddress, amount and transferCalldata from event
    expect(await data.events[0].args.targets.toString()).to.equal(svtoken.address);
    expect((new BigNumber(await data.events[0].args[3])).c[0]).to.equal(0);
    expect(await data.events[0].args.calldatas.toString()).to.equal(transferCalldata);
    expect(await data.events[0].args.description).to.equal(description);

    // Queue a proposal
    await hre.network.provider.send("hardhat_mine");  // Mine a block
    const descriptionHash = ethers.utils.id(await data.events[0].args.description);
    const queueTX = await svgovernor.queue(
      [data.events[0].args.targets.toString()],
      [(new BigNumber(await data.events[0].args[3])).c[0]],
      [await data.events[0].args.calldatas.toString()],
      descriptionHash,
    );
    await queueTX.wait(1);
    console.log(await queueTX.wait(1));

    // // Mine 45819 block = votingPeriod() + 1
    // await hre.network.provider.send("hardhat_mine", ["0xB2FB"]);

    // // Execute the Proposal
    // const executeTX = await svgovernor.execute(
    // [data.events[0].args.targets.toString()],
    // [(new BigNumber(await data.events[0].args[3])).c[0]],
    // [await data.events[0].args.calldatas.toString()],
    // descriptionHash,
    // );
    // await executeTX.wait(1);
    // console.log(await executeTX.wait(1));
  });

});