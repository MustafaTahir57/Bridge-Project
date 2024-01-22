import React, { useEffect, useState } from "react";
import containerImage from "../media/bg_img.jpeg";
import { useSelector, useDispatch } from "react-redux";
import { connectionAction } from "../Redux/connection/actions";
import "./Presales.css";
import { toast } from "react-toastify";
import { HederaTokenAddress, HederaContractAbi } from "../Utils/HederaToken";
import { HederaChainContract, HederaChainContractAbi } from "../Utils/HederaChain";
import { ETHToken,ETHTokenContractAbi } from "../Utils/ETHTokens";
import { ETHChainContract,ETHChainContractAbi } from "../Utils/ETHChain";

export default function AppPresale({ changeStake }) {
  let acc = useSelector((state) => state.connect?.connection);
  const connectState = useSelector((state) => state.connect);
  const network = connectState?.network;
  const [ETHTokens, setUsersETHTokenBalance] = useState(0);
  const [HederaToken, setusersHederaTokenBalance] = useState(0);
  const [amount, setAmount] = useState(1);
  const dispatch = useDispatch();

  const onConnectAccount = () => {
    try{
      dispatch(connectionAction());
    }catch(e){
      console.log("e", e);
    }
  };

  const handleAmountChange = (e) => {
    if (isNaN(e.target.value) || e.target.value === "") {
      setAmount(0);
      return;
    }

    if (e.target.value[0] === "0" && e.target.value.length > 1) {
      setAmount(e.target.value.slice(1));
      return;
    }

    if (e.target.value >= 0) {
      setAmount(e.target.value);
    }
  };

  const incrementAmount = () => {
    setAmount(parseInt(amount) + 1);
  };

  const decrementAmount = () => {
    if (amount > 1) {
      setAmount(amount - 1);
    }
  };

  const getUserBalance = async () => {
    const web3 = window.web3;
      if (
        acc !== "No Wallet" &&
        acc !== "Wrong Network" &&
        acc !== "Connect Wallet"
      ) {
        let EthTokenContractOf = new web3.eth.Contract(
          ETHTokenContractAbi,
          ETHToken
        );
        let hederaTokenContractOf = new web3.eth.Contract(
          HederaContractAbi,
          HederaTokenAddress
        );
        try {
          let userUsdtBal = await EthTokenContractOf.methods.balanceOf(acc?.account).call();
            userUsdtBal = web3.utils.fromWei(userUsdtBal);
            userUsdtBal = parseFloat(userUsdtBal);
            setUsersETHTokenBalance(userUsdtBal);
        } catch (error) {
          console.error("Error fetching ETH Token balance:", error.message);
        }
        
        try {
          let userMbtcBal = await hederaTokenContractOf.methods.balanceOf(acc?.account).call();
          userMbtcBal = web3.utils.fromWei(userMbtcBal);
        userMbtcBal = parseFloat(userMbtcBal);
        setusersHederaTokenBalance(userMbtcBal);
        } catch (error) {
          console.error("Error fetching Hedera Token balance:", error.message);
        }
        
      }
    
  };

const waitUntilTransactionMined = async (web3, transactionHash) => {
  while (true) {
    const receipt = await web3.eth.getTransactionReceipt(transactionHash);
    if (receipt && receipt.blockHash) {
      return receipt;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); 
  }
};

const mintTokensToHedera = async () => {
  try {
    const web3 = window.web3;
    const contract = new web3.eth.Contract(
      ETHTokenContractAbi,
      ETHToken
    );

    const ethChainContract = new web3.eth.Contract(
      ETHChainContractAbi,
      ETHChainContract
    );

    const amounts = web3.utils.toWei(amount);

    await contract.methods.mint(acc?.account, amounts).send({
      from: acc?.account,
    });
      toast.success("mint succrssfully.")

    await contract.methods.approve(ETHChainContract, amounts).send({
      from: acc?.account,
    });
    toast.success("approve succrssfully.")
    const latestBlock = await web3.eth.getBlock("latest");
    const nonce = latestBlock.timestamp;
    const signature = await web3.eth.personal.sign(`Burn to Hedera: ${amounts} tokens with nonce ${nonce}`,
      acc?.account
    );
    console.log(signature)
    const result = await ethChainContract.methods
      .burn(amounts, nonce, signature)
      .send({
        from: acc?.account,
      });
      if(result.status === true){
        toast.success("burn succrssfully.")
      }
    const receipt = await waitUntilTransactionMined(web3, result.transactionHash);
    if (receipt.status === true) {
      const eventData = result.events.CrossTransfer.returnValues;
      const sender = eventData[0];
      const receiver = eventData[1];
      const amount = eventData[2];
      const timestamp = eventData[3];
      const nonce = eventData[4];
      const signature = eventData[5];
      const status = eventData[6];
      web3.setProvider(new web3.providers.HttpProvider("https://testnet.hashio.io/api"));
      await handleCrossTransferEvent(sender, receiver, amount, timestamp, nonce, signature, status);
    } else {
      console.error('Transaction failed.');
    }
  } catch (error) {
    console.error("Error minting tokens to Hedera:", error);
    toast.error("Error minting tokens to Hedera. See console for details.");
  } finally {
    setAmount(1);
  }
};
// const handleCrossTransferEvent = async (sender, receiver, amount, timestamp, nonce, signature, status) => {
//   const web3 = window.web3;
//   const privateKey = '3bb7923b25da26990e6eba3e1aaa3378a6ab1574414baccfa2bcec572ed5ed8a';
//   const account = web3.eth.accounts.privateKeyToAccount(privateKey);
//   console.log(account)
//   web3.eth.accounts.wallet.add(account);
//   const hederaChainContract = new web3.eth.Contract(
//     HederaChainContractAbi,
//     HederaChainContract
//   );
//   try {
//     if (typeof status !== 'undefined') {
//       if (status == 0) {
//         const tx = await hederaChainContract.methods
//           .mint(sender, acc?.account, amount, nonce, signature)
//           .send({
//             from: acc?.account,
//           });
//            await waitUntilTransactionMined(web3, tx.transactionHash);
//       } else if (status == 1) {
//         await hederaChainContract.methods
//           .burn(amount, nonce, signature)
//           .send({
//             from: acc?.account,
//             gas: 200000, 
//           });
//       } else {
//         console.error("Unknown status:", status);
//       }
//     } else {
//       console.error("Status not present in eventData");
//     }
//   } catch (error) {
//     console.error("Error in handleCrossTransferEvent:", error);
//   }
// };
const handleCrossTransferEvent = async (sender, receiver, amount, timestamp, nonce, signature, status) => {
  const web3 = window.web3;
  const privateKey = '3bb7923b25da26990e6eba3e1aaa3378a6ab1574414baccfa2bcec572ed5ed8a';
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  console.log(account)
  web3.eth.accounts.wallet.add(account);
  const hederaChainContract = new web3.eth.Contract(
    HederaChainContractAbi,
    HederaChainContract
  );
  try {
    if (typeof status !== 'undefined') {
      if (status == 0) {
        const tx = await hederaChainContract.methods
          .mint(sender, acc?.account, amount, nonce, signature)
          .send({
            from: acc?.account,
            gas: 8000000,  // Set a higher gas limit as needed
          });
      let data=  await waitUntilTransactionMined(web3, tx.transactionHash);
        if(data.status === true){
          toast.success("token bridge successfully.")
         }
      } else if (status == 1) {
        await hederaChainContract.methods
          .burn(amount, nonce, signature)
          .send({
            from: acc?.account,
            gas: 8000000,  
          });
          toast.success("burn succrssfully.")
      } else {
        console.error("Unknown status:", status);
      }
    } else {
      console.error("Status not present in eventData");
    }
  } catch (error) {
    console.error("Error in handleCrossTransferEvent:", error);
  }
};

const mintTokensToETH = async () => {
  const web3 = window.web3; 
  try {
    const HederaToken = new web3.eth.Contract(
      HederaContractAbi,
      HederaTokenAddress
    );
    const hederaChainContract = new web3.eth.Contract(
      HederaChainContractAbi,
      HederaChainContract
    );
    const amounts = web3.utils.toWei(amount);
    await HederaToken.methods.mint(acc?.account, amounts).send({
      from: acc?.account,
    });
    
      toast.success("mint succrssfully.")
    await HederaToken.methods.approve(HederaChainContract, amounts).send({
      from: acc?.account,
    });
    
      toast.success("approve succrssfully.")
    const latestBlock = await web3.eth.getBlock("latest");
    const nonce = latestBlock.timestamp;
    const signature = await web3.eth.personal.sign(`Burn to Hedera: ${amounts} tokens with nonce ${nonce}`,
      acc?.account
    );
    console.log(signature)
    const result = await hederaChainContract.methods
      .burn(amounts, nonce, signature)
      .send({
        from: acc?.account,
        gas: 8000000, 
      });
      if(result.status === true){
        toast.success("burn succrssfully.")
      }
    const receipt = await waitUntilTransactionMined(web3, result.transactionHash);
    if (receipt.status === true) {
      const eventData = result.events.CrossTransfer.returnValues;
      const sender = eventData[0];
      const receiver = eventData[1];
      const amount = eventData[2];
      const timestamp = eventData[3];
      const nonce = eventData[4];
      const signature = eventData[5];
      const status = eventData[6];
      web3.setProvider(new web3.providers.HttpProvider("https://sepolia.infura.io/v3/4f837ff6daa44f6aa9c39bfa87e9ca1f"));
      await handleCrossTransferEvent1(sender, receiver, amount, timestamp, nonce, signature, status);
    }
  } catch (error) {
    console.error("Error minting tokens to Hedera:", error);
    toast.error("Error minting tokens to Hedera. See console for details.");
  } finally {
    setAmount(0);
  }
};
const handleCrossTransferEvent1 = async (sender, receiver, amount, timestamp, nonce, signature, status) => {
  const web3 = window.web3;
  const privateKey = '3bb7923b25da26990e6eba3e1aaa3378a6ab1574414baccfa2bcec572ed5ed8a';
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  const ethChainContract = new web3.eth.Contract(
    ETHChainContractAbi,
    ETHChainContract
  );
  try {
    if (typeof status !== 'undefined') {
      if (status == 0) {
        const tx = await ethChainContract.methods
          .mint(sender, acc?.account, amount, nonce, signature)
          .send({
            from: acc?.account,
            gas: 300000,
            gasPrice: web3.utils.toWei('8', 'gwei'),
          });
        let data =  await waitUntilTransactionMined(web3, tx.transactionHash);
         if(data.status === true){
          toast.success("token bridge successfully.")
         }
      } else if (status == 1) {
         await ethChainContract.methods
          .burn(amount, nonce, signature)
          .send({
            from: acc?.account,
            gas: 200000,
          });
          toast.success("burn succrssfully.")
      } else {
        console.error("Unknown status:", status);
      }
    } else {
      console.error("Status not present in eventData");
    }
  } catch (error) {
    console.error("Error in handleCrossTransferEvent:", error);
  }
};

  
  useEffect(() => {
    getUserBalance();
  }, [acc, network]);

  return (
    <div className="presales-wrapper">
      <img src={containerImage} alt="blockchain" />
      <div className="container">
        <div className="wallet-button">
          <h1 className="logo">BRIDGE</h1>
          <button onClick={onConnectAccount}>
            {acc === "No Wallet"
              ? "No Wallet"
              : acc === "Connect Wallet"
              ? "Connect Wallet"
              : acc === "Wrong Network"
              ? "Wrong Network"
              : acc?.account.substring(0, 4) + "..." + acc?.account.substring(acc?.account?.length - 4)}
          </button>
        </div>
        <div className="flex-content">
          <div className="flex-item wallet-content">
            <img src={containerImage} alt="wallet_bg" />
            <h1>BRIDGE</h1>
            <div className="wallet-details">
              <h1>Your Balance:</h1>
              <div className="wallet-balance">
                <div className="balance-item">
                  <span>ETH Token Balance: </span>
                  <span>{ETHTokens}</span>
                </div>
                <div className="balance-item">
                  <span>Hedera Token Balance: </span>
                  <span>{HederaToken}</span>
                </div>
              </div>
            </div>
            <div className="buy-token-content">
              <h1>Amount</h1>
              <div className="buy-token-input">
                <button onClick={decrementAmount}>-</button>
                <input
                  type="number"
                  onChange={handleAmountChange}
                  value={amount}
                />
                <button onClick={incrementAmount}>+</button>
              </div>
              <div className="buy-token-buttons d-flex justify-content-center">
                {acc?.network === 'Sepolia test network' && (
                  <button onClick={mintTokensToHedera}>Transfer To Hedera</button>
                )}
                {acc?.network === 'Hedera Testnet' && (
                  <button onClick={mintTokensToETH}>Transfer To Sepolia</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
