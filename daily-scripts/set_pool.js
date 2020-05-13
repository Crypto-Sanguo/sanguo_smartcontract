// This script needs to be called at the beginning of the day.

const IOST = require('iost')

const bs58 = require('bs58');

const waitFor = (duration) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('');
    }, duration);
  });
}


// use RPC
const rpc = new IOST.RPC(new IOST.HTTPProvider("https://api.iost.io"));
rpc.blockchain.getChainInfo().then(console.log);

// init iost sdk
let iost = new IOST.IOST({ // will use default setting if not set
    gasRatio: 1,
    gasLimit: 1000000,
    delay:0,
}, new IOST.HTTPProvider('https://api.iost.io'));

const account = new IOST.Account("*****Your Account******");
const kp = new IOST.KeyPair(bs58.decode('*****Your Private Key******'));

account.addKeyPair(kp, "owner");
account.addKeyPair(kp, "active");


const treasureManagerAddress = "Contract3a5jpKWhY1m3gsHGfcqfTpEJjPjxWKfDJRLsXDVVNvja";


const run = async () => {
  const tx1 = iost.callABI(treasureManagerAddress,
      "debugSetPool",
      []);
  account.signTx(tx1);
  const handler1 = new IOST.TxHandler(tx1, rpc);

  handler1.onFailed(console.log).send();
};

run();