const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE =
  "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;

describe("Dappazon", () => {
  let dappazon;
  let deployer, buyer;

  beforeEach(async () => {
    [deployer, buyer] = await ethers.getSigners();

    const Dappazon = await ethers.getContractFactory("Dappazon");
    dappazon = await Dappazon.deploy();
    await dappazon.deployed();
  });

  describe("Deployment", () => {
    it("sets the owner", async () => {
      const owner = await dappazon.owner();
      expect(owner).to.equal(deployer.address);
    });
  });

  describe("Listing", () => {
    let transaction;

    beforeEach(async () => {
      transaction = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();
    });

    it("returns item attributes", async () => {
      const item = await dappazon.items(1);
      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("emits list function events", () => {
      expect(transaction).to.emit(dappazon, "List");
    });
  });

  describe("Listing and buying", () => {
    let transaction;

    beforeEach(async () => {
      transaction = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      transaction = await dappazon.connect(buyer).buy(ID, { value: COST });
    });

    it("updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(COST);
    });

    it("updates buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      expect(result).to.equal(1);
    });

    it("adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1);
      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME);
    });

    it("emits a buy event", async () => {
      await expect(transaction)
        .to.emit(dappazon, "Buy")
        .withArgs(buyer.address, 1, ID);
    });

    it("reverts purchase when insufficient Ether is sent", async () => {
      const insufficientPayment = COST.sub(
        ethers.utils.parseUnits("0.1", "ether")
      );

      await expect(
        dappazon.connect(buyer).buy(ID, { value: insufficientPayment })
      ).to.be.revertedWith("Not enough Ether sent");
    });

    it("reverts purchase when item is out of stock", async () => {
      for (let i = 1; i < STOCK; i++) {
        transaction = await dappazon.connect(buyer).buy(ID, { value: COST });
        await transaction.wait();
      }

      const item = await dappazon.items(ID);
      expect(item.stock).to.equal(0);

      await expect(
        dappazon.connect(buyer).buy(ID, { value: COST })
      ).to.be.revertedWith("Item out of stock");
    });
  });

  describe("Withdrawing", () => {
    let balanceBefore;

    beforeEach(async () => {
      // List item
      let transaction = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      // Buy item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST });
      await transaction.wait();

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address);

      // Withdraw
      transaction = await dappazon.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(0);
    });
  });
});
