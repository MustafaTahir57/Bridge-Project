import Web3 from "web3";
let isItConnected = false;

const networks = {
  eth: {
    chainId: `0x${Number(11155111).toString(16)}`,
    chainName: "Sepolia test network",
    nativeCurrency: {
      name: "Sepolia test network",
      symbol: "SepoliaETH",
      decimals: 18,
    },
    rpcUrls: [],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
  Hedera: {
    chainId: `0x${Number(296).toString(16)}`,
    chainName: "Hedera Testnet",
    nativeCurrency: {
      name: "Hedera Testnet",
      symbol: "HBAR",
      decimals: 18,
    },
    rpcUrls: [],
    blockExplorerUrls: ["https://hashscan.io/testnet/dashboard"],
  },
  // bsc: {
  //   chainId: `0x${Number(97).toString(16)}`,
  //   chainName: "BNB Smart Chain Testnet",
  //   nativeCurrency: {
  //     name: "BNB Smart Chain Testnet",
  //     symbol: "tBNB",
  //     decimals: 18,
  //   },
  //   rpcUrls: [],
  //   blockExplorerUrls: ["https://testnet.bscscan.com/"],
  // },
};
 const changeNetwork = async ({ networkName }) => {
   try {
    if (!window.ethereum) throw new Error("No crypto wallet found");
      await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          ...networks[networkName],
        },
      ],
    });
  } catch (err) {
    console.log("not found");
  }
};
const handleNetworkSwitch = async (networkName) => {
  await changeNetwork({ networkName });
};
let accounts;
const getAccounts = async () => {
  const web3 = window.web3;
  try {
    accounts = await web3.eth.getAccounts();
    return accounts;
  } catch (error) {
    console.log("Error while fetching acounts: ", error);
    return null;
  }
};
export const disconnectWallet = async () => {
  await window.ethereum.request({
    method: "eth_requestAccounts",
    params: [{ eth_accounts: {} }],
  });
};
export const loadWeb3 = async () => {
  
  try {
    if (window.ethereum) {
      let network = null;
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      await window.web3.eth.getChainId((err, netId) => {
        switch (netId.toString()) {
          case "11155111":
            isItConnected = true;
            network = 1
            break;
            case "296":
              isItConnected = true;
              network = 2
              break;
          default:
            handleNetworkSwitch("Sepolia test network");
            isItConnected = false;

        }
      });
      if (isItConnected == true) {
        let accounts = await getAccounts();
        let result;
        if(network === 1){
          result = "Sepolia test network"
        } else{
          result = "Hedera Testnet"
        }
        return {account: accounts[0], network:result };
      } else {
        let res = "Wrong Network";
        return res;
      }
    } else {
      let res = "No Wallet";
      return res;
    }
  } catch (error) {
    let res = "No Wallet";
    return res;
  }
};
