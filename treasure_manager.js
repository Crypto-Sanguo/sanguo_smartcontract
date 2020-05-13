/*

#balance
[user] => number

#holding_points
[user] => [[day, value]]

#holdingAll
[day] => number

#burning_points
[user] => [[day, value]]

#burningAll
[day] => number

#power_points
[user] => [[day, value]]

#powerAll
[day] => number

#land_points
[user] => [[week, value]]

#landAll
[week] => number

#clearance
[user] => {
  value: // div. from holding and burning and referral
  day:  // Any thing < day is clear
  week: // Any land dividends < week is clear
}

#pool_total
#pool_land_total

#pool1
day => number

#pool2
day => number

#pool3

#pool4

#referral

#referralBonus
[user] => value

#referralTeam0 / 1 / 2
[user] => [user0, user1, user2, ...]

#referralSpent
[user] => amount

#profit

*/

const SYMBOL = "sgt";

class TreasureManager {

  init() {
  }

  mmm() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const config = {
      "decimal": 0,
      "canTransfer": true,
      "fullName": "Sanguo Token"
    };

    blockchain.callWithAuth("token.iost", "create",
        [SYMBOL, blockchain.contractName(), 1000000000000, config]);
  }

  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
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

  setUnitManager(unitManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("unitManager", unitManager);
  }

  _getUnitManager() {
    return storage.get("unitManager");
  }

  setBattle(battle) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("battle", battle);
  }

  _getBattle() {
    return storage.get("battle");
  }

  setAccount(account) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("account", account);
  }

  _getAccount() {
    return storage.get("account");
  }

  setRankManager(rankManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("rankManager", rankManager);
  }

  _getRankManager() {
    return storage.get("rankManager");
  }

  setEpicManager(epicManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("epicManager", epicManager);
  }

  _getEpicManager() {
    return storage.get("epicManager");
  }

  setLandManager(landManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("landManager", landManager);
  }

  _getLandManager() {
    return storage.get("landManager");
  }

  debugIssueTo(who, amount) {
    amount *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only owner and land manager can change";
    }

    blockchain.callWithAuth("token.iost", "issue",
        [SYMBOL, blockchain.contractName(), amount.toString()]);

    let total = +storage.mapGet("balance", who) || 0;
    total = +(total + amount).toFixed(8);
    storage.mapPut("balance", who, total.toString());

    this._checkDividendByHolding(who, total);

    blockchain.callWithAuth(this._getRankManager(),
        "setValue", [who, "balance", total.toString()]);
  }

  issue(amount) {
    amount *= 1;

    if (!blockchain.requireAuth(this._getItemManager(), "active") &&
        !blockchain.requireAuth(this._getBattle(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only approved contracts can issue";
    }

    blockchain.callWithAuth("token.iost", "issue",
        [SYMBOL, blockchain.contractName(), amount.toString()]);

    let total = +storage.mapGet("balance", tx.publisher) || 0;
    total = +(total + amount).toFixed(8);
    storage.mapPut("balance", tx.publisher, total.toString());

    this._checkDividendByHolding(tx.publisher, total);

    blockchain.callWithAuth(this._getRankManager(),
        "setValue", [tx.publisher, "balance", total.toString()]);
  }

  destroy(amount) {
    amount *= 1;

    let total = +storage.mapGet("balance", tx.publisher) || 0;

    if (amount > total) {
      throw "destroy more than balance";
    }

    total = +(total - amount).toFixed(8);
    storage.mapPut("balance", tx.publisher, total.toString());

    blockchain.callWithAuth("token.iost", "destroy",
        [SYMBOL, blockchain.contractName(), amount.toString()]);

    this._checkDividendByHolding(tx.publisher, total);

    blockchain.callWithAuth(this._getRankManager(),
        "setValue", [tx.publisher, "balance", total.toString()]);
  }

  debugDestoryFrom(who, amount) {
    amount *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    let total = +storage.mapGet("balance", who) || 0;

    if (amount > total) {
      throw "destroy more than balance";
    }

    total = +(total - amount).toFixed(8);
    storage.mapPut("balance", who, total.toString());

    blockchain.callWithAuth("token.iost", "destroy",
        [SYMBOL, blockchain.contractName(), amount.toString()]);

    this._checkDividendByHolding(who, total);

    blockchain.callWithAuth(this._getRankManager(),
        "setValue", [who, "balance", total.toString()]);
  }

  snatch(who, canSnatch) {
    canSnatch *= 1;

    if (!blockchain.requireAuth(this._getBattle(), "active")) {
      throw "only approved contracts can issue";
    }

    var hisBalance = +storage.mapGet("balance", who) || 0;
    var myBalance = +storage.mapGet("balance", tx.publisher) || 0;

    if (!canSnatch) {
      return {
        myBalance: myBalance,
        hisBalance: hisBalance,
        amount: 0
      };
    }

    const count = +blockchain.call(this._getLandManager(), "countOfFarms", [who])[0];
    const amount = Math.floor(hisBalance / 20 / Math.max(1, count));

    hisBalance = +(hisBalance - amount).toFixed(8);
    storage.mapPut("balance", who, hisBalance.toString());

    myBalance = +(myBalance + amount).toFixed(8);
    storage.mapPut("balance", tx.publisher, myBalance.toString());

    this._checkDividendByHolding(tx.publisher, myBalance);
    this._checkDividendByHolding(who, hisBalance);

    blockchain.callWithAuth(this._getRankManager(),
        "setValue", [tx.publisher, "balance", myBalance.toString()]);
    blockchain.callWithAuth(this._getRankManager(),
        "setValue", [who, "balance", hisBalance.toString()]);

    return {
      myBalance: myBalance,
      hisBalance: hisBalance,
      amount: amount
    };
  }

  _ceilDate(time) {
    if (time < 46800) return 0;
    return Math.ceil((time - 46800) / 86400);
  }

  _ceilWeek(time) {
    return Math.ceil(time / 86400 / 7);
  }

  _getYesterday() {
    const now = Math.floor(tx.time / 1e9);
    return this._ceilDate(now) - 1;
  }

  _getToday() {
    const now = Math.floor(tx.time / 1e9);
    return this._ceilDate(now);
  }

  _getThisWeek() {
    const now = Math.floor(tx.time / 1e9);
    return this._ceilWeek(now - 108000);
  }

  depositSGT(amountStr) {
    throw "not implemented";

    blockchain.call("token.iost", "transfer",
        [SYMBOL, tx.publisher, blockchain.contractName(), amountStr, "deposit"]);

    let total = +storage.mapGet("balance", tx.publisher) || 0;
    total = +(total + amountStr * 1).toFixed(8);
    storage.mapPut("balance", tx.publisher, total.toString());

    this._checkDividendByHolding(tx.publisher, total);
  }

  withdrawSGT(amountStr) {
    throw "not implemented";

    let total = +storage.mapGet("balance", tx.publisher) || 0;

    if (amountStr * 1 > total) {
      throw "not enough";
    }

    total = +(total - amountStr * 1).toFixed(8);
    storage.mapPut("balance", tx.publisher, total.toString());

    blockchain.callWithAuth("token.iost", "transfer", 
        [SYMBOL, blockchain.contractName(), tx.publisher, amountStr, "withdraw"]);

    this._checkDividendByHolding(tx.publisher, total);
  }

  withdraw() {
    const total = this._getAndClearDividendValue();

    blockchain.withdraw(tx.publisher,
                        total.toString(),
                        "withdraw");
  }

  balanceOfSGT(who) {
    return storage.mapGet("balance", who) || 0;
  }

  _checkDividendByHolding(who, holdNow) {
    const today = this._getToday();

    const points = JSON.parse(storage.mapGet("holding_points", who) || "[]");

    if (points.length == 0 || points[points.length - 1][0] < today) {
      points.push([today, holdNow]);
    } else {
      points[points.length - 1][1] = holdNow;
    }

    storage.mapPut("holding_points", who, JSON.stringify(points));

    var holdingAll = blockchain.call("token.iost", "balanceOf", [SYMBOL, blockchain.contractName()]);
    storage.mapPut("holdingAll", today.toString(), holdingAll.toString());
  }

  burn(amount) {
    amount *= 1;
    this.destroy(amount);
    this._checkDividendByBurning(tx.publisher, amount);
  }

  _checkDividendByBurning(who, burnNow) {
    const today = this._getToday();

    const points = JSON.parse(storage.mapGet("burning_points", who) || "[]");

    if (points.length == 0 || points[points.length - 1][0] < today) {
      points.push([today, burnNow]);
    } else {
      points[points.length - 1][1] += burnNow;
    }

    storage.mapPut("burning_points", who, JSON.stringify(points));

    var burningAll = +storage.mapGet("burningAll", today.toString()) || 0;
    storage.mapPut("burningAll", today.toString(), (burningAll + burnNow).toFixed(8));
  }

  savePower(who, amount, date) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    amount *= 1;
    date *= 1;

    var today;
    if (date <= 0) {
      today = this._getToday();
    } else {
      today = date;
    }

    const points = JSON.parse(storage.mapGet("power_points", who) || "[]");

    if (points.length == 0 || points[points.length - 1][0] < today) {
      points.push([today, amount]);
    } else {
      points[points.length - 1][0] = today;
      points[points.length - 1][1] = amount;
    }

    storage.mapPut("power_points", who, JSON.stringify(points));
  }

  saveAllPower(sum, date) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    sum *= 1;
    date *= 1;

    var today;
    if (date <= 0) {
      today = this._getToday();
    } else {
      today = date;
    }

    storage.mapPut("powerAll", today.toString(), sum.toString());
  }

  saveLand(who, amount, week) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only owner can change";
    }

    amount *= 1;
    week *= 1;

    var thisWeek;
    if (week <= 0) {
      thisWeek = this._getThisWeek();
    } else {
      thisWeek = week;
    }

    const points = JSON.parse(storage.mapGet("land_points", who) || "[]");

    if (points.length == 0 || points[points.length - 1][0] < thisWeek) {
      points.push([thisWeek, amount]);
    } else {
      points[points.length - 1][1] = amount;
    }

    storage.mapPut("land_points", who, JSON.stringify(points));
  }

  saveAllLand(sum, week) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only owner can change";
    }

    sum *= 1;
    week *= 1;

    var thisWeek;
    if (week <= 0) {
      thisWeek = this._getThisWeek();
    } else {
      thisWeek = week;
    }

    storage.mapPut("landAll", thisWeek.toString(), sum.toString());
  }

  withdrawReferralBonus() {
    const value = +(storage.mapGet("referralBonus", tx.publisher)) || 0;
    blockchain.withdraw(tx.publisher,
                        value.toString(),
                        "withdraw");
    storage.mapPut("referralBonus", tx.publisher, "0");
  }

  _addReferralBolusFor(who, delta) {
    var value = +(storage.mapGet("referralBonus", who)) || 0;
    value = +(value + delta).toFixed(8);
    storage.mapPut("referralBonus", who, value.toString());
  }

  _addReferralBonus(value, who) {
    const value0 = +(value * 0.5).toFixed(8);
    const value1 = +(value * 0.309).toFixed(8);
    const value2 = +(value - value0 - value1).toFixed(8);

    const referral = JSON.parse(storage.mapGet("referral", who) || "[\"\",\"\",\"\"]");

    if (referral[0]) {
      this._addReferralBolusFor(referral[0], value0);

      if (referral[1]) {
        this._addReferralBolusFor(referral[1], value1);

        if (referral[2]) {
          this._addReferralBolusFor(referral[2], value2);
        } else {
          this._addProfit(value2);
        }
      } else {
        this._addProfit(+(value1 + value2).toFixed(8));
      }
    } else {
      this._addProfit(value);
    }

    var spent = +storage.mapGet("referralSpent", who) || 0;
    spent = +(spent + value).toFixed(8);
    storage.mapPut("referralSpent", who, spent.toString());
  }

  _addProfit(profit) {
    let value = +(storage.get("profit")) || 0;
    value = +(value + profit).toFixed(8);
    storage.put("profit", value.toString());
  }

  markReferral(from, to) {
    if (!blockchain.requireAuth(this._getAccount(), "active") &&
        !blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only account or owner can markReferral";
    }

    if (storage.mapGet("referral", to)) {
      throw "referral-exist";
    }

    const lastReferral = JSON.parse(storage.mapGet("referral", from) || "[\"\",\"\",\"\"]");
    const myReferral = [from, lastReferral[0], lastReferral[1]];
    storage.mapPut("referral", to, JSON.stringify(myReferral));

    const team = JSON.parse(storage.mapGet("referralTeam0", from) || "[]");
    if (team.indexOf(to) < 0 && team.length < 5000) {
      team.push(to);
      storage.mapPut("referralTeam0", from, JSON.stringify(team));

      if (lastReferral[0]) {
        const team1 = JSON.parse(storage.mapGet("referralTeam1", lastReferral[0]) || "[]");
        if (team1.indexOf(to) < 0 && team1.length < 5000) {
          storage.mapPut("referralTeam1", lastReferral[0], JSON.stringify(team1));
        }
      }

      if (lastReferral[1]) {
        const team2 = JSON.parse(storage.mapGet("referralTeam2", lastReferral[1]) || "[]");
        if (team2.indexOf(to) < 0 && team2.length < 5000) {
          storage.mapPut("referralTeam2", lastReferral[1], JSON.stringify(team2));
        }
      }
    }
  }

  debugCleanUp(days) {
    days *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const today = this._getToday();

    for (let i = 0; i < days; ++i) {
      storage.mapDel("pool1", (today + i).toString());
      storage.mapDel("pool2", (today + i).toString());
    }
  }

  withdrawProfit() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const profit = +storage.get("profit");
    blockchain.withdraw(tx.publisher,
                        profit.toString(),
                        "withdraw");
    storage.put("profit", "0");
  }

  debugAddPool(value) {
    value *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    this._addPool(value);
  }

  debugSetPool() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    this._setPool();
  }

  _setPool() {
    const today = this._getToday();

    const pool1ExistingValue = +storage.mapGet("pool1", today.toString()) || 0;
    const pool2ExistingValue = +storage.mapGet("pool2", today.toString()) || 0;

    if (pool1ExistingValue && pool2ExistingValue) return;

    var total = +storage.get("pool_total") || 0;
    const pool1Value = +(total * 0.525 * 0.05).toFixed(8);
    const pool2Value = +(total * 0.175 * 0.05).toFixed(8);
    const pool3Value = +(total * 0.3 * 0.05).toFixed(8);
    total = +(total - pool1Value - pool2Value - pool3Value).toFixed(8);

    storage.mapPut("pool1", today.toString(), pool1Value.toString());
    storage.mapPut("pool2", today.toString(), pool2Value.toString());
    storage.mapPut("pool3", today.toString(), pool3Value.toString());

    storage.put("pool_total", total.toString());
  }

  debugSetPool2(today) {
    today *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const pool1ExistingValue = +storage.mapGet("pool1", today.toString()) || 0;
    const pool2ExistingValue = +storage.mapGet("pool2", today.toString()) || 0;

    if (pool1ExistingValue && pool2ExistingValue) return;

    var total = +storage.get("pool_total") || 0;
    const pool1Value = +(total * 0.525 * 0.05).toFixed(8);
    const pool2Value = +(total * 0.175 * 0.05).toFixed(8);
    const pool3Value = +(total * 0.3 * 0.05).toFixed(8);
    total = +(total - pool1Value - pool2Value - pool3Value).toFixed(8);

    storage.mapPut("pool1", today.toString(), pool1Value.toString());
    storage.mapPut("pool2", today.toString(), pool2Value.toString());
    storage.mapPut("pool3", today.toString(), pool3Value.toString());

    storage.put("pool_total", total.toString());
  }

  landSetLandPool() {
    if (!blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only owner can change";
    }

    return this._setLandPool();
  }

  _setLandPool() {
    const thisWeek = this._getThisWeek();

    const poolExistingValue = +storage.mapGet("pool4", thisWeek.toString()) || 0;

    if (poolExistingValue) return 0;

    var total = +storage.get("pool_land_total") || 0;
    const poolValue = +(total * 0.05).toFixed(8);
    total = +(total - poolValue).toFixed(8);

    storage.mapPut("pool4", thisWeek.toString(), poolValue.toString());

    storage.put("pool_land_total", total.toString());

    return poolValue;
  }

  _addPool(delta) {
    var total = +storage.get("pool_total") || 0;
    total = +(total + delta).toFixed(8);
    storage.put("pool_total", total.toString());
  }

  _addLandPool(delta) {
    delta *= 1;
    
    var total = +storage.get("pool_land_total") || 0;
    total = +(total + delta).toFixed(8);
    storage.put("pool_land_total", total.toString());
  }

  pay(value) {
    value *= 1;

    if (!blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getItemManager(), "active") &&
        !blockchain.requireAuth(this._getBattle(), "active") &&
        !blockchain.requireAuth("Contract6X3dqZMUSxVMDaH3cUAYCviTdXdE89hTDmTMUAuBeHWL", "active") &&
        !blockchain.requireAuth(this._getAccount(), "active")) {
      throw "only unitManager, itemManager, battle, or account can pay";
    }

    const value0 = +(value * 0.8).toFixed(8);  // 80%

    const value1 = +(value * 0.1).toFixed(8);  // 10%
    this._addReferralBonus(value1, tx.publisher);

    const value2 = +(value - value0 - value1).toFixed(8);  // 10%
    this._addProfit(value2);

    this._addPool(value0);
  }

  payLand(value, who) {
    value *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only owner and landManager can pay";
    }

    const value0 = +(value * 0.8).toFixed(8);  // 80%

    const value1 = +(value * 0.1).toFixed(8);  // 10%
    this._addReferralBonus(value1, who);

    const value2 = +(value - value0 - value1).toFixed(8);  // 10%
    this._addProfit(value2);

    this._addLandPool(value0);
  }

  payFee(value) {
    value *= 1;

    if (!blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getItemManager(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only unitManager, itemManager, and landManager can pay";
    }

    this._addProfit(value);
  }

  _getAndClearDividendValue() {
    const clearance = JSON.parse(storage.mapGet("clearance", tx.publisher)
        || "{\"value\": 0, \"day\": 0, \"week\": 0}");
    clearance.week = clearance.week || 0;

    const today = this._getToday();
    const thisWeek = this._getThisWeek();

    const holdingPoints = JSON.parse(storage.mapGet("holding_points", tx.publisher) || "[]");
    const burningPoints = JSON.parse(storage.mapGet("burning_points", tx.publisher) || "[]");
    const powerPoints = JSON.parse(storage.mapGet("power_points", tx.publisher) || "[]");
    const landPoints = JSON.parse(storage.mapGet("land_points", tx.publisher) || "[]");

    var total = 0;

    var i;

    if (holdingPoints.length) {
      for (i = holdingPoints.length - 1; i >=0; --i) {
        if (holdingPoints[i][0] >= clearance.day ||
            (i + 1 < holdingPoints.length && holdingPoints[i + 1][0] >= clearance.day)) {
          const start = Math.max(clearance.day, holdingPoints[i][0]);

          let end;
          if (i + 1 < holdingPoints.length) {
            end = holdingPoints[i + 1][0];
          } else {
            end = today;
          }

          for (let j = start; j < end; ++j) {
            const pool = +storage.mapGet("pool1", j.toString()) || 0;
            const holdingAll = +storage.mapGet("holdingAll", j.toString()) || 1;
            total += holdingPoints[i][1] * pool / holdingAll;
          }
        } else {
          break;
        }
      }
    }

    if (burningPoints.length) {
      for (i = burningPoints.length - 1; i >= 0; --i) {
        const day = burningPoints[i][0];
        if (day >= today) continue;

        if (day >= clearance.day) {
          const pool = +storage.mapGet("pool2", day.toString()) || 0;
          const burningAll = +storage.mapGet("burningAll", day.toString()) || 1;
          total += burningPoints[i][1] * pool / burningAll;
        } else {
          break;
        }
      }
    }

    if (powerPoints.length) {
      for (i = powerPoints.length - 1; i >= 0; --i) {
        const day = powerPoints[i][0];
        if (day >= today) continue;

        if (day >= clearance.day) {
          const pool = +storage.mapGet("pool3", day.toString()) || 0;
          const powerAll = +storage.mapGet("powerAll", day.toString()) || 0;
          total += powerAll ? powerPoints[i][1] * pool / powerAll : 0;
        } else {
          break;
        }
      }
    }

    if (landPoints.length) {
      for (i = landPoints.length - 1; i >= 0; --i) {
        const week = landPoints[i][0];
        if (week >= thisWeek) continue;

        if (week >= clearance.week) {
          const pool = +storage.mapGet("pool4", week.toString()) || 0;
          const landAll = +storage.mapGet("landAll", week.toString()) || 0;
          total += landAll ? landPoints[i][1] * pool / landAll : 0;
        } else {
          break;
        }
      }
    }

    const oldValue = clearance.value;
    clearance.value = 0;
    clearance.day = today;
    clearance.week = thisWeek;

    storage.mapPut("clearance", tx.publisher, JSON.stringify(clearance));

    // Put the new amount but return all amount for withrawal.
    blockchain.callWithAuth(this._getRankManager(), "addValue", [tx.publisher, "revenue", total.toString()]);

    return total + oldValue;
  }

  consolidate(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const clearance = JSON.parse(storage.mapGet("clearance", who)
        || "{\"value\": 0, \"day\": 0, \"week\": 0}");
    clearance.week = clearance.week || 0;

    const today = this._getToday();
    const thisWeek = this._getThisWeek();

    const holdingPoints = JSON.parse(storage.mapGet("holding_points", who) || "[]");
    const burningPoints = JSON.parse(storage.mapGet("burning_points", who) || "[]");
    const powerPoints = JSON.parse(storage.mapGet("power_points", who) || "[]");
    const landPoints = JSON.parse(storage.mapGet("land_points", tx.publisher) || "[]");

    var total = 0;

    if (holdingPoints.length) {
      for (let i = holdingPoints.length - 1; i >= 0; --i) {
        if (holdingPoints[i][0] >= clearance.day ||
            (i + 1 < holdingPoints.length && holdingPoints[i + 1][0] >= clearance.day)) {
          const start = Math.max(clearance.day, holdingPoints[i][0]);

          let end;
          if (i + 1 < holdingPoints.length) {
            end = holdingPoints[i + 1][0];
          } else {
            end = today;
          }

          for (let j = start; j < end; ++j) {
            const pool = +storage.mapGet("pool1", j.toString()) || 0;
            const holdingAll = +storage.mapGet("holdingAll", j.toString()) || 1;
            total += holdingPoints[i][1] * pool / holdingAll;
          }
        } else {
          break;
        }
      }
    }

    if (burningPoints.length) {
      for (let i = burningPoints.length - 1; i >= 0; --i) {
        const day = burningPoints[i][0];
        if (day >= today) continue;

        if (day >= clearance.day) {
          const pool = +storage.mapGet("pool2", day.toString()) || 0;
          const burningAll = +storage.mapGet("burningAll", day.toString()) || 1;
          total += burningPoints[i][1] * pool / burningAll;
        } else {
          break;
        }
      }
    }

    if (powerPoints.length) {
      for (let i = powerPoints.length - 1; i >= 0; --i) {
        const day = powerPoints[i][0];
        if (day >= today) continue;

        if (day >= clearance.day) {
          const pool = +storage.mapGet("pool3", day.toString()) || 0;
          const powerAll = +storage.mapGet("powerAll", day.toString()) || 0;
          total += powerAll ? powerPoints[i][1] * pool / powerAll : 0;
        } else {
          break;
        }
      }
    }

    if (landPoints.length) {
      for (i = landPoints.length - 1; i >= 0; --i) {
        const week = landPoints[i][0];
        if (week >= thisWeek) continue;
        
        if (week >= clearance.week) {
          const pool = +storage.mapGet("pool4", week.toString()) || 0;
          const landAll = +storage.mapGet("landAll", week.toString()) || 0;
          total += landAll ? landPoints[i][1] * pool / landAll : 0;
        } else {
          break;
        }
      }
    }

    clearance.value = clearance.value + total;
    clearance.day = today;
    clearance.week = thisWeek;

    storage.mapPut("clearance", who, JSON.stringify(clearance));

    // NOTE: what we add is only the newly added value.
    blockchain.callWithAuth(this._getRankManager(), "addValue", [who, "revenue", total.toString()]);

    return total;
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const balance = storage.mapGet("balance", from);
    if (balance) {
      storage.mapPut("balance", to, balance);
      storage.mapDel("balance", from);
    }

    const holding_points = storage.mapGet("holding_points", from)
    if (holding_points) {
      storage.mapPut("holding_points", to, holding_points);
      storage.mapDel("holding_points", from);
    }

    const burning_points = storage.mapGet("burning_points", from)
    if (burning_points) {
      storage.mapPut("burning_points", to, burning_points);
      storage.mapDel("burning_points", from);
    }

    const clearance = storage.mapGet("clearance", from)
    if (clearance) {
      storage.mapPut("clearance", to, clearance);
      storage.mapDel("clearance", from);
    }
  }

  debugChangeClearance(who, date) {
    date *= 1;
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const clearance = JSON.parse(storage.mapGet("clearance", who));
    clearance.day = date;
    storage.mapPut("clearance", who, JSON.stringify(clearance));
  }
}


module.exports = TreasureManager;
