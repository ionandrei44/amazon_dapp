import { useEffect, useState } from "react";
import { ethers } from "ethers";

import Navigation from "./components/Navigation";
import Section from "./components/Section";
import Product from "./components/Product";

import Dappazon from "./abis/Dappazon.json";

import config from "./config.json";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [dappazon, setDappazon] = useState(null);
  const [items, setItems] = useState({
    electronics: [],
    clothing: [],
    toys: [],
  });

  const [item, setItem] = useState({});
  const [toggle, setToggle] = useState(false);

  const togglePop = (item) => {
    setItem(item);
    toggle ? setToggle(false) : setToggle(true);
  };

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    const network = await provider.getNetwork();

    const dappazon = new ethers.Contract(
      config[network.chainId].dappazon.address,
      Dappazon,
      provider
    );
    setDappazon(dappazon);

    const items = [];

    for (let i = 0; i < 9; i++) {
      const item = await dappazon.items(i + 1);
      items.push(item);
    }

    const electronics = items.filter((item) => item.category === "electronics");
    const clothing = items.filter((item) => item.category === "clothing");
    const toys = items.filter((item) => item.category === "toys");

    setItems({ electronics, clothing, toys });
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <h2>Dappazon Best Sellers</h2>

      {items && (
        <>
          <Section
            title={"Clothing & Jewelry"}
            items={items.clothing}
            togglePop={togglePop}
          />
          <Section
            title={"Electronics & Gadgets"}
            items={items.electronics}
            togglePop={togglePop}
          />
          <Section
            title={"Toys & Gaming"}
            items={items.toys}
            togglePop={togglePop}
          />
        </>
      )}

      {toggle && (
        <Product
          item={item}
          provider={provider}
          account={account}
          dappazon={dappazon}
          togglePop={togglePop}
        />
      )}
    </div>
  );
}

export default App;
