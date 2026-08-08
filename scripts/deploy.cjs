const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`\n==================================================`);
  console.log(`🚀 Deploying Aegis-F Suite on ${network.name} (Chain ID: ${network.config.chainId || 31337})`);
  console.log(`==================================================\n`);

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error("❌ No private key provided in .env (set PRIVATE_KEY=0x... to deploy)");
    process.exit(1);
  }
  const deployer = signers[0];
  console.log(`Deployer Address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} FLR/ETH\n`);

  // Flare Network FTSOv2 contract addresses
  const COSTON2_FTSO_V2 = "0x3d893c53d9e80E433582fe4091473fC49f11618F";
  const FLARE_MAINNET_FTSO_V2 = "0xC1d7029C970d9B683Da9d37b49d84D081dbeD54c"; // Flare Contract Registry
  
  let ftsoV2Target = ethers.ZeroAddress;
  if (network.name === "coston2") {
    ftsoV2Target = COSTON2_FTSO_V2;
  } else if (network.name === "flare") {
    ftsoV2Target = FLARE_MAINNET_FTSO_V2;
  }

  // 1. Deploy MockKineticPosition
  console.log(`1. Deploying MockKineticPosition...`);
  const PositionFactory = await ethers.getContractFactory("MockKineticPosition");
  const position = await PositionFactory.deploy(ftsoV2Target);
  await position.waitForDeployment();
  const positionAddress = await position.getAddress();
  console.log(`✅ MockKineticPosition deployed at: ${positionAddress}`);

  // Set default initial mock price if on local network
  if (network.name === "hardhat" || network.name === "localhost") {
    await position.setMockPrice(ethers.parseEther("0.035"), true);
    console.log(`   Mock price set to $0.035 per FLR for local testing.`);
  }

  // 2. Deploy InstructionSender
  console.log(`\n2. Deploying InstructionSender (FCC Relay Gateway)...`);
  const SenderFactory = await ethers.getContractFactory("InstructionSender");
  const sender = await SenderFactory.deploy();
  await sender.waitForDeployment();
  const senderAddress = await sender.getAddress();
  console.log(`✅ InstructionSender deployed at: ${senderAddress}`);

  // 3. Deploy AegisVault
  console.log(`\n3. Deploying AegisVault...`);
  const teeKeeperAddress = process.env.TEE_KEEPER_ADDRESS || deployer.address;
  const VaultFactory = await ethers.getContractFactory("AegisVault");
  const vault = await VaultFactory.deploy(teeKeeperAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✅ AegisVault deployed at: ${vaultAddress}`);
  console.log(`   Designated TEE Keeper: ${teeKeeperAddress}`);

  // 4. Save Deployment Manifest
  const deploymentManifest = {
    network: network.name,
    chainId: network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    explorerBaseUrl: network.name === "coston2" 
      ? "https://coston2-explorer.flare.network/address/"
      : "https://flare-explorer.flare.network/address/",
    contracts: {
      MockKineticPosition: positionAddress,
      InstructionSender: senderAddress,
      AegisVault: vaultAddress,
    },
    teeKeeper: teeKeeperAddress,
    ftsoV2FeedId: "0x01464c522f55534400000000000000000000000000",
    ftsoV2FeedName: "FLR/USD",
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const manifestPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(deploymentManifest, null, 2));
  console.log(`\n📄 Deployment manifest written to: ${manifestPath}`);
  console.log(`==================================================\n`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
