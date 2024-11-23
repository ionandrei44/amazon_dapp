const hre = require("hardhat");
const { items } = require("../src/items.json");

const tokens = (n) => {
  return hre.ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const Dappazon = await hre.ethers.getContractFactory("Dappazon");
  const dappazon = await Dappazon.deploy();
  await dappazon.deployed();

  console.log(`Deployed Dappazon contract at: ${dappazon.address}`);

  for (const item of items) {
    const transaction = await dappazon
      .connect(deployer)
      .list(
        item.id,
        item.name,
        item.category,
        item.image,
        tokens(item.price),
        item.rating,
        item.stock
      );

    await transaction.wait();
    console.log(`Listed item ${item.id}: ${item.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
