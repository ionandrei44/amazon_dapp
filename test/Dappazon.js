const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Dappazon", () => {
  it("has a name", async () => {
    const Dappazon = await ethers.getContractFactory("Dappazon");
    const dappazon = await Dappazon.deploy(); // Added await here
    await dappazon.deployed(); // Ensure the contract is deployed before calling any function
    expect(await dappazon.name()).to.equal("Dappazon");
  });
});
