/*


# ticket
[user] => count

# lottery_units
[
  [unitId, chance (1 - 1000)]
]

# lottery_items
[
  [itemId => chance (1 - 1000)]
]

# badLuck
[user] => times

# badLuckStore
{
  \"items\": [{
  }],
  \"units\": [{
    \"unitId\": 28,
    \"count\": 50
  }, {
    \"unitId\": 19,
    \"count\": 50
  }, {
    \"unitId\": 33,
    \"count\": 120
  }, {
    \"unitId\": 50,
    \"count\": 88
  }]
}

# xMasResults
[]

# xMasQueue
[]
*/


class LotteryManager {

  init() {
  }
  
  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
  }

  setTreasureManager(treasureManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("treasureManager", treasureManager);
  }

  _getTreasureManager() {
    return storage.get("treasureManager");
  }

  setUnitManager(unitManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }
    
    storage.put("unitManager", unitManager);
  }

  _getUnitManager() {
    return storage.get("unitManager");
  }

  setItemManager(itemManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }
    
    storage.put("itemManager", itemManager);
  }

  _getItemManager() {
    return storage.get("itemManager");
  }

  setBadLuckStore(badLuckStore) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("badLuckStore", badLuckStore);
  }

  _getBadLuckStore() {
    return JSON.parse(storage.get("badLuckStore") || "[]");
  }

  setBadLuck(who, badLuckStr) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.mapPut("badLuck", who, badLuckStr);
  }

  _setBadLuck(who, badLuck) {
    storage.mapPut("badLuck", who, badLuck.toString());
  }
  
  _getBadLuck(who) {
    return +storage.mapGet("badLuck", who) || 0;
  }

  _random(nonce)  {
    // Cheap random number generator.

    const hash = tx.hash;

    var result = nonce;

    for (let i = 0; i < hash.length; ++i) {
      result = (result * 61583 + hash.charCodeAt(i) + 101533) % 61153;
    }

    return result % 60089;
  }

  addTickets(who, amount) {
    amount *= 1;

    if (!blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only unitManager or owner can add tickets";
    }

    var count = +storage.mapGet("ticket", who) || 0;
    count += amount;
    storage.mapPut("ticket", who, count.toString());
  }

  _redeemTickets(who, amount) {
    var count = +storage.mapGet("ticket", who) || 0;
    if (amount > count) {
      throw 'not enough tickets';
    }
    count -= amount;
    storage.mapPut("ticket", who, count.toString());
  }

  addLotteryUnits(unitIdArrayStr, chanceArrayStr) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const unitIdArray = JSON.parse(unitIdArrayStr);
    const chanceArray = JSON.parse(chanceArrayStr);

    if (unitIdArray.length != chanceArray.length) {
      throw "invalid input";
    }

    const array = [];

    unitIdArray.forEach((unitId, i) => {
      array.push([unitId, chanceArray[i]])
    });

    storage.put("lottery_units", JSON.stringify(array));
  }

  addLotteryItems(itemIdArrayStr, chanceArrayStr) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const itemIdArray = JSON.parse(itemIdArrayStr);
    const chanceArray = JSON.parse(chanceArrayStr);

    if (itemIdArray.length != chanceArray.length) {
      throw "invalid input";
    }

    const array = [];

    itemIdArray.forEach((itemId, i) => {
      array.push([itemId, chanceArray[i]])
    });

    storage.put("lottery_items", JSON.stringify(array));
  }

  drawUnit(unitId, times) {
    unitId *= 1;
    times = Math.floor(times * 1) || 0;

    const hasUnit = blockchain.call(this._getUnitManager(), "hasUnit", [tx.publisher, unitId.toString()])[0] * 1;

    if (hasUnit) {
      throw "already have unit";
    }

    if (times <= 0) {
      throw "invalid input";
    }

    const array = JSON.parse(storage.get("lottery_units") || []);

    var chance = 0;
    array.forEach(pair => {
      if (pair[0] == unitId) {
        chance = pair[1];
      }
    });

    if (chance < 1 || chance >= 1000) {
      throw "invalid chance";
    }

    var didWin = 0;
    var actualTimes = 0;

    for (let i = 0; i < times; ++i) {
      const r = this._random(i) % 1000;
      ++actualTimes;

      if (r < chance) {
        didWin = 1;
        break;
      }
    }

    this._redeemTickets(tx.publisher, actualTimes);

    if (didWin) {
      blockchain.callWithAuth(this._getUnitManager(), "issueForFree", [unitId.toString()]);
      this._setBadLuck(tx.publisher, 0);
    } else {
      let badLuck = this._getBadLuck(tx.publisher);
      badLuck += times;
      this._setBadLuck(tx.publisher, badLuck);
    }

    return didWin;
  }

  buyUnitWithBadLuck(unitId) {
    unitId *= 1;

    var found = 0;
    var need = 0;

    const backLuckStore = this._getBadLuckStore();
    backLuckStore.units.forEach(unit => {
      if (unit.unitId == unitId) {
        found = 1;
        need = unit.count * 1;
      }
    });

    if (!found) {
      throw 'not-found';
    }

    var badLuck = this._getBadLuck(tx.publisher);
    if (need > badLuck) {
      throw 'not-enough-bad-luck';
    }

    badLuck -= need;
    this._setBadLuck(tx.publisher, badLuck);

    blockchain.callWithAuth(this._getUnitManager(), "issueForFree", [unitId.toString()]);
  }

  buyItemWithBadLuck(itemId) {
    itemId *= 1;

    var found = 0;
    var need = 0;

    const backLuckStore = this._getBadLuckStore();
    backLuckStore.items.forEach(item => {
      if (item.itemId == itemId) {
        found = 1;
        need = item.count * 1;
      }
    });

    if (!found) {
      throw 'not-found';
    }

    var badLuck = this._getBadLuck(tx.publisher);
    if (need > badLuck) {
      throw 'not-enough-bad-luck';
    }

    badLuck -= need;
    this._setBadLuck(tx.publisher, badLuck);

    blockchain.callWithAuth(this._getItemManager(), "issueForFree", [itemId.toString()]);
  }

  drawWithTicket() {
    this._redeemTickets(tx.publisher, 1);

    let found = false;
    const queue = JSON.parse(storage.get("xMasQueue") || '[]');
    for (let i = 0; i < queue.length; ++i) {
      if (queue[i][0] == tx.publisher) {
        queue[i][1] += 1;
        found = true;
        break;
      }
    }
    if (!found) {
      queue.push([tx.publisher, 1]);
    }
    storage.put("xMasQueue", JSON.stringify(queue));

    return "1";
  }

  drawWithIOST() {
    // Charges IOST.
    blockchain.transfer(tx.publisher,
                        this._getTreasureManager(),
                        "500",
                        "drawWithIOST");
    blockchain.callWithAuth(this._getTreasureManager(),
                            "pay",
                            ["500"]);

    let found = false;
    const queue = JSON.parse(storage.get("xMasQueue") || '[]');
    for (let i = 0; i < queue.length; ++i) {
      if (queue[i][0] == tx.publisher) {
        queue[i][1] += 1;
        found = true;
        break;
      }
    }
    if (!found) {
      queue.push([tx.publisher, 1]);
    }
    storage.put("xMasQueue", JSON.stringify(queue));

    return "1";
  }

  fillList() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("xMasList", JSON.stringify(
[
[1,2,3,4,5,6,7,8,10,11,19,20,21,28,29,30,31,32,33,36,37,39,40,41,42,50],
[5,6,8,9,10,11,12,13,14,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,117,118,119,120,121,122]
]
));
  }

  debugFixResults() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("xMasResults", JSON.stringify(
[[1577241931,"unseenmagic",1,9],[1577242010,"iost222222",0,7]]
));
  }

  processOneXmaxQueue() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const queue = JSON.parse(storage.get("xMasQueue") || '[]');
    if (queue.length <= 0) return;

    const entry = queue.shift();

    entry[1] -= 1;
    if (entry[1]) {
      queue.push(entry);
    }

    storage.put("xMasQueue", JSON.stringify(queue));

    const list = JSON.parse(storage.get("xMasList"));
    const sum = list[0].length + list[1].length;

    if (!sum) return;

    const r = this._random(sum) % sum;

    let type = 2;
    const who = entry[0];
    let v = 0;

    if (r < list[0].length) {
      const hasUnit = blockchain.call(
          this._getUnitManager(),
          "hasUnit",
          [who, r.toString()])[0] * 1;
      if (hasUnit) {
        type = 2;
        // Refund.
      } else {
        type = 1;
        v = list[0][r];

        blockchain.callWithAuth(this._getUnitManager(), "debugAddUnitDirectly", [who, v.toString(), "1"]);
        list[0].splice(r, 1);
      }
    } else {
      type = 0;
      v = list[1][r - list[0].length];

      blockchain.callWithAuth(this._getItemManager(), "debugMake", [who, v.toString(), "1", "99"]);
      list[1].splice(r - list[0].length, 1);
    }

    storage.put("xMasList", JSON.stringify(list));

    const results = JSON.parse(storage.get("xMasResults") || "[]");

    const now = Math.floor(tx.time / 1e9);
    results.push([now, who, type, v]);
    storage.put("xMasResults", JSON.stringify(results));
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const badLuck = storage.mapGet("badLuck", from);
    if (badLuck) {
      storage.mapPut("badLuck", to, badLuck);
      storage.mapDel("badLuck", from);
    }

    const ticket = storage.mapGet("ticket", from);
    if (ticket) {
      storage.mapPut("ticket", to, ticket);
      storage.mapDel("ticket", from);
    }
  }
}

module.exports = LotteryManager;
