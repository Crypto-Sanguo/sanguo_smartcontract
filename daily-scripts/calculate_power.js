// This script needs to be called at the end of the day.


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

// init iost sdk
let iost = new IOST.IOST({ // will use default setting if not set
    gasRatio: 1,
    gasLimit: 4000000,
    delay:0,
}, new IOST.HTTPProvider('https://api.iost.io'));

const account = new IOST.Account("*** Your Account ***");
const kp = new IOST.KeyPair(bs58.decode('*** Your Private Key ***'));

account.addKeyPair(kp, "owner");
account.addKeyPair(kp, "active");


const rankManagerAddress = "ContractEATaSmrrarzHpChZNtS87s5PwtjR3MzwYdWRHP8zp49H";
const landManagerAddress = "ContractEaZuHUF1uQjTgSNeC3avwt7hqzynMWzs8DAq3MTpFTYd";
const treasureManagerAddress = "Contract3a5jpKWhY1m3gsHGfcqfTpEJjPjxWKfDJRLsXDVVNvja";


const _ceilDate = (time) => {
  return Math.ceil((time - 46800) / 86400);
}

const run = async ()=> {

  const now = Math.floor((new Date()).getTime() / 1000);
  const today = _ceilDate(now);

  var sum = 0;

  const d0 = await rpc.blockchain.getContractStorage(rankManagerAddress, "user_pages");
  const pages = JSON.parse(d0.data);

  for (let p = 0; p < pages.length; ++p) {
    const d1 = await rpc.blockchain.getContractStorage(rankManagerAddress, "user_values", p.toString());
    const all = JSON.parse(d1.data);

    for (let i = 0; i < all.length; ++i) {
      const who = all[i];
      const d2 = await rpc.blockchain.getContractStorage(landManagerAddress, "attack_points_by_user", who);
      const value = JSON.parse(d2.data);

      if (!value || !value.count || value.date < today) continue;

      const tx1 = iost.callABI(treasureManagerAddress,
          "savePower",
          [who, value.count.toString(), "0"]);
      account.signTx(tx1);
      const handler1 = new IOST.TxHandler(tx1, rpc);

      handler1.onFailed(console.log).send();

      console.log(who, value.count);

      await waitFor(200);

      sum += value.count;
    }
  }

  console.log(sum)

  const tx2 = iost.callABI(treasureManagerAddress,
        "saveAllPower",
        [sum.toString(), "0"]);
  account.signTx(tx2);
  const handler2 = new IOST.TxHandler(tx2, rpc);
  handler2.onFailed(console.log).send();

  await waitFor(3000);
};

setTimeout(() => {
  run();
}, 0 * 60 * 60 * 1000)