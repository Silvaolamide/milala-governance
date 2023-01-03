const {expect, assert} = require('chai');
const web3 = require('web3');
const { ethers, upgrades  } = require('hardhat');
const { BigNumber } = require("bignumber.js");
//start tests

describe('Milala Governance Test', () => {
    let owner, adm, addr1, addr2, addr3, addr4, payee; 

    
    it("Should go through the entire Proposal Lifecycle", async function () {
        // beforeEach(async () => {

        [owner,adm, addr1, addr2, addr3, addr4, payee,  _] = await ethers.getSigners();
        const minDelay = 0;
        const proposer = owner.address;
        const executor = owner.address;
        const admin = owner.address;
        //Contracts Deployment


            //Deploy Timelock Contract
            const Timelock = await ethers.getContractFactory("Timelock"); 
            const timelock = await Timelock.deploy(minDelay, [proposer], [executor], admin)
            await timelock.deployed();
            expect(timelock.address);     
            console.log(`Timelock address: ${timelock.address}`)  
            console.log("---------------------------------------------------------------")
        
            //Deploy Treasury Contract
            // const funds = web3.utils.toWei('25', 'ether');
            // const Treasury = await ethers.getContractFactory("Treasury"); 
            // const treasury = await Treasury.deploy(payee, { value: funds });
        

            //Deploy Milala Token Contract
            const Milalatoken = await ethers.getContractFactory("Milalatoken"); 
            const milalatoken = await upgrades.deployProxy(Milalatoken, [], {
                initializer: "initialize",
                kind: "transparent",
            });
            

            await milalatoken.deployed();
            // expect(await svtoken.totalSupply()).to.equal(1);
            console.log(`Milala Token address: ${milalatoken.address}`)
            expect(await milalatoken.owner()).to.equal(owner.address)
            console.log("who is the owner of the milala token: ", await milalatoken.owner())
            console.log(`Total supply: ${ ethers.utils.formatEther(await milalatoken.totalSupply())}`)
            console.log("---------------------------------------------------------------")
            
            //Deploy Governance Contract
            
            const Governance = await ethers.getContractFactory("Milalagovernor"); 
            const governance = await upgrades.deployProxy(Governance, [milalatoken.address, timelock.address], {
                initializer: "initialize",
                kind: "transparent",
            });
            
            await governance.deployed();
            expect(governance.address);
            console.log(`Governor address: ${governance.address}`)  
            console.log("---------------------------------------------------------------")

            console.log("starting")
            console.log(`Mint Milala Token for addr1 to addr4 and delegate`)  
            console.log("---------------------------------------------------------------")

            const votes = ethers.utils.parseUnits("50.0", 18)
            await milalatoken.mint(addr1.address, votes);
            await milalatoken.mint(addr2.address, votes);
            await milalatoken.mint(addr3.address, votes);
            await milalatoken.mint(addr4.address, votes);

            await milalatoken.connect(addr1).delegate(addr1.address);
            await milalatoken.connect(addr2).delegate(addr2.address);
            await milalatoken.connect(addr3).delegate(addr3.address);
            await milalatoken.connect(addr4).delegate(addr4.address);

            console.log(`Balances of Addr1 to Addr4`)  
            console.log(` Addr1: ${ ethers.utils.formatEther(await milalatoken.balanceOf(addr1.address))}, Addr2:  ${ ethers.utils.formatEther(await milalatoken.balanceOf(addr2.address))}, Addr3:  ${ ethers.utils.formatEther(await milalatoken.balanceOf(addr3.address))}, Addr4:  ${ ethers.utils.formatEther(await milalatoken.balanceOf(addr4.address))}`)  
            console.log("---------------------------------------------------------------")

            // Create new proposal
            // Proposal states: 1 - Active, 4 - Succeeded, 5 - Queued , 7 - Executed
            console.log(`Creating a New Proposal`) 

            const grant = ethers.utils.parseUnits("25.0", 18);
            const newProposal = {
                        grantAmount: grant,
                        transferCalldata: milalatoken.interface.encodeFunctionData('mint', [payee.address, grant]),
                        descriptionHash: ethers.utils.id("Release Funds to Payee")
            };
            // const encodedFunction = await treasury.releaseFunds().encodeABI()
            const description = "Release Funds from Treasury"
            const proposeTx = await governance.propose(
                        [milalatoken.address],
                        [0],
                        [newProposal.transferCalldata],
                        newProposal.descriptionHash,
            );
            

            const tx = await proposeTx.wait();
            await network.provider.send('evm_mine'); // wait 1 block before opening voting
            
            //proposal parameters
            const proposalId = tx.events.find((e) => e.event == 'ProposalCreated').args.proposalId;

            
           
            

            proposalState = await governance.state(proposalId);
            // console.log(`Current state of proposal: ${proposalState.toString()}  \n`)
            const snapshot = await governance.proposalSnapshot(proposalId);
            console.log(`Proposal created on block ${snapshot.toString()}`)
            
            const deadline = await governance.proposalDeadline(proposalId)
            console.log(`Proposal deadline on block ${deadline.toString()}\n`)
            
            expect(proposalState).to.equal(0); // The state of the proposal. 1 is not passed. 0 is passed.
            console.log(`${tx.events[0].event}: 
              proposalState: ${proposalState},
              proposalId: ${tx.events[0].args.proposalId.toString()},
              tokenAddress: ${tx.events[0].args.targets.toString()},
              amount: ${tx.events[0].args[3].toString()},
              transferCalldata: ${tx.events[0].args.calldatas.toString()},
              description: ${tx.events[0].args.description},
              startBlock:  ${tx.events[0].args.startBlock.toString()}`)
            console.log("---------------------------------------------------------------")
        

            // Let's vote // 0 = Against, 1 = For, 2 = Abstain
            await governance.connect(addr1).castVote(proposalId, 1);
            await governance.connect(addr2).castVote(proposalId, 1);
            await governance.connect(addr3).castVote(proposalId, 0);
            await governance.connect(addr4).castVote(proposalId, 2);

            const { againstVotes, forVotes, abstainVotes } = await governance.proposalVotes(proposalId);
            const hasVoted = await governance.hasVoted(proposalId , addr1.address)
            

            //check who has voted
            expect(await hasVoted).to.equal(true);
            console.log(`AgainstVotes: ${ethers.utils.formatEther((await governance.proposalVotes(proposalId)).againstVotes.toString())}`)
            console.log(`ForVotes: ${ethers.utils.formatEther((await governance.proposalVotes(proposalId)).forVotes.toString())}`)
            console.log(`AbstainVotes: ${ethers.utils.formatEther((await governance.proposalVotes(proposalId)).abstainVotes.toString())}`)
            console.log(`Quorum (Number of Votes Required to Pass): ${ethers.utils.formatEther((await governance.quorum(tx.events[0].args.startBlock.toString())))}`)
            console.log("---------------------------------------------------------------")
            // const { againstVotes, forVotes, abstainVotes } = await governance.proposalVotes.call(id)
            // console.log(`Votes For: ${web3.utils.fromWei(forVotes.toString(), 'ether')}`)
            // console.log(`Votes Against: ${web3.utils.fromWei(againstVotes.toString(), 'ether')}`)
            // console.log(`Votes Neutral: ${web3.utils.fromWei(abstainVotes.toString(), 'ether')}\n`)



            proposalState = await governance.state(proposalId);
            console.log(`Current state of proposal (1 = Active): ${proposalState.toString()}  \n`)
            console.log('Addresses (governance/timelock/milalatoken): ', governance.address, timelock.address, milalatoken.address)
            // Giving governor the rights to propose something on the timelock contract.


            //   await milalatoken.transfer(payee.address, grant);
            //   await milalatoken.transfer(payee.address, grant);

            // Mine a block
            await network.provider.send('hardhat_mine', ["0x284696"]); // Mine a block
            blockNumber =  await ethers.provider.getBlockNumber();
            console.log(`Current blocknumber: ${blockNumber}\n`)

            // console.log("this is it", votes2.forVotes);
            // assert(votes2.forVotes.eq(2), "Vote count mismatch"); // < FAILS votes is an array and all its members, "forVotes", "againstVotes", etc are all 0

            // Exec
            //Execute
            // await governance.execute([treasury.address], [0], [newProposal.transferCalldata], newProposal.descriptionHash)

        
            proposalState = await governance.state(proposalId);
            console.log(`Current state of proposal (4 - Succeeded): ${proposalState.toString()}  \n`)


            // blockNumber = await web3.eth.getBlockNumber()
            // console.log(`Current blocknumber: ${blockNumber}\n`)

            const quorum = await governance.quorum(blockNumber - 1)
            console.log(`Number of votes required to pass: ${web3.utils.fromWei(quorum.toString(), 'ether')}\n`)
            
            //Transfer ownership of token to timelock address
            await milalatoken.transferOwnership(timelock.address);
            expect(await milalatoken.owner()).to.equal(timelock.address)
            console.log("who is the new owner of the milala token: ", await milalatoken.owner())
            console.log("---------------------------------------------------------------")



            // get timelock roles
            const timelockExecuterRole = await timelock.EXECUTOR_ROLE();
            const timelockProposerRole = await timelock.PROPOSER_ROLE();
            const timelockCancellerRole = await timelock.CANCELLER_ROLE();
            const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();  
            //   console.log(timelockExecuterRole, timelockProposerRole, timelockCancellerRole);

            // grant timelock roles to governor contract
            const executorole = await timelock.grantRole(timelockExecuterRole, governance.address);
            const proposerole= await timelock.grantRole(timelockProposerRole, governance.address);
            const revokerole = await timelock.grantRole(adminRole, owner.address);
            const cancelerole = await timelock.grantRole(timelockCancellerRole, owner.address);
            // expect(proposerole.events[0].args.account).to.equal(governance.address);
            // expect(executorole.events[0].args.account).to.equal(governance.address);
            // // expect(revokerole.events[0].args.account).to.equal(owner.address);
            // expect(cancelerole.events[0].args.account).to.equal(owner.address);
            // console.log(`Proposer role: ${proposerole.events[0].args.account}`)
            // console.log(`Executor role: ${executorole.events[0].args.account}`)
            // // console.log(`Revoke role: ${revokerole.events[0].args.account}`)
            // console.log(`Canceller role: ${cancelerole.events[0].args.account}`)
            console.log("Executor and Proposer roles granted to Governance Contract, Revokerole and Cancelerole to Owner Address")
            console.log("---------------------------------------------------------------")
            
            // Queue 
            // const hash = web3.utils.sha3("Release Funds from Treasury")
            // await governance.queue([milalatoken.address], [0], [newProposal.transferCalldata], newProposal.descriptionHash,)

            console.log("Queuing the Proposal")
            // Queue a proposal

            // await hre.network.provider.send("hardhat_mine");  // Mine a block
            const descriptionHash = ethers.utils.id(await tx.events[0].args.description);
            const queueTX = await governance.queue(
            [tx.events[0].args.targets.toString()],
            [(new BigNumber(await tx.events[0].args[3])).c[0]],
            [await tx.events[0].args.calldatas.toString()],
            descriptionHash,
            );
            await queueTX.wait(1);
            
            console.log("Proposal Queing Successful")
            // console.log(await queueTX.wait(1));

            console.log("---------------------------------------------------------------")
            proposalState = await governance.state(proposalId);
            console.log(`Current state of proposal (5 = Queued): ${proposalState.toString()}  \n`)
            console.log("---------------------------------------------------------------")

            console.log("Executing the Proposal")
            const executeTX = await governance.execute(
                [tx.events[0].args.targets.toString()],
                [(new BigNumber(await tx.events[0].args[3])).c[0]],
                [await tx.events[0].args.calldatas.toString()],
                descriptionHash,
                );
                await executeTX.wait(1);
            
            console.log("Proposal Execution Successful")
            // console.log(await executeTX.wait(1));
            console.log("---------------------------------------------------------------")
            
            console.log("Has Payee received payment? Check Balance")

            console.log("payee balance; ",  ethers.utils.formatEther((await milalatoken.balanceOf(payee.address)).toString()));
            proposalState = await governance.state(proposalId);
            console.log(`Current state of proposal (7 = Executed): ${proposalState.toString()}  \n`)
            // await governance.execute(
            //             [milalatoken.address],
            //             [0],
            //             [newProposal.transferCalldata],
            //             newProposal.descriptionHash,
            // );
            console.log("---------------------------------------------------------------")
    });
    

})