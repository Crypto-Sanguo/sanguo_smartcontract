/*

# unit
unitId => {
  hp:
  hpStep:
  attack:
  attackStep:
  intelligence:
  intelligenceStep:
  defense:
  defenseStep:
  agility:
  agilityStep:
  luck:
  luckStep:
  recoverCost:
  upgradeCost:
  price:
  priceStep:

  soldAmount:
}

# unitR
rId => {
  unitId: 1
  level: 1,
  energy: {
    amount: 3,
    time:
    // Actual amount = amount + (now - time) / (1 hours)
  },
  unlock: 10
}

# user
user => {
  [unitId]: {
    rId,
    page  // page + 1,
    itemRIdArray: [ itemRId, itemRId, itemRId, itemRId ]
    exp: time  // expiration date of trial.
  }
},

# trial_levels
user => {
  [unitId]: level
}

# offer
[
  {
    seller:
    rId:
    unitId:
    price:

    // Populte on the fly.
    page:
    level:
  }
]

# pages
[
  100,
  80
]

# amount_bought
user => count

# channel_count => count

# recover_info, // Very uncommon data structure
user => {
  [unitId]: [time0, time1, time2],
  count: // For lottery
}

*/

const UNIT_LIMIT = 3;
const ITEM_LIMIT = 4;
const MAX_ENERGY = 10;
const PAGE_LIMIT = 100;
const RECOVER_LIMIT = 3;
const RECOVER_LIMIT_FOR_LOTTERY = 6;


class UnitManager {

  init() {
  }

  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
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

  setTreasureManager(treasureManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("treasureManager", treasureManager);
  }

  _getTreasureManager() {
    return storage.get("treasureManager");
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

  setLandManager(landManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("landManager", landManager);
  }

  _getLandManager() {
    return storage.get("landManager");
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

  setLotteryManager(lotteryManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("lotteryManager", lotteryManager);
  }

  _getLotteryManager() {
    return storage.get("lotteryManager");
  }

  setStageManager(stageManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("stageManager", stageManager);
  }

  _getStageManager() {
    return storage.get("stageManager");
  }

  setNotificationManager(notificationManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("notificationManager", notificationManager);
  }

  _getNotificationManager() {
    return storage.get("notificationManager");
  }

  setUnit(unitId, json) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const obj = JSON.parse(json);

    const existing = JSON.parse(storage.mapGet("unit", unitId.toString()) || "{}");
    if (existing.price) {
      obj.price = existing.price;
    }
    if (existing.soldAmount) {
      obj.soldAmount = existing.soldAmount;
    }

    this._setUnit(unitId, JSON.stringify(obj));
  }

  _setUnit(unitId, json) {
    storage.mapPut("unit", unitId.toString(), json);
  }

  getUnit(unitId) {
    return this._getUnit(unitId) || {};
  }

  _getUnit(unitId) {
    return JSON.parse(storage.mapGet("unit", unitId.toString()) || "0");
  }

  _setUnitR(rId, unitR) {
    storage.mapPut("unitR", rId.toString(), JSON.stringify(unitR));
  }

  _getUnitR(rId) {
    return JSON.parse(storage.mapGet("unitR", rId.toString()) || "{}");
  }

  _getUser(userId) {
    return JSON.parse(storage.mapGet("user", userId.toString()) || "{}");
  }

  _setUser(userId, user) {
    storage.mapPut("user", userId.toString(), JSON.stringify(user));
  }

  _getTrialLevels(who) {
    return JSON.parse(storage.mapGet("trial_levels", who) || "{}");
  }

  _setTrialLevels(who, trialLevels) {
    storage.mapPut("trial_levels", who, JSON.stringify(trialLevels));
  }

  _getPages() {
    return JSON.parse(storage.get("pages") || "[]");
  }

  _setPages(pages) {
    storage.put("pages", JSON.stringify(pages));
  }

  _getOffers(page) {
    return JSON.parse(storage.mapGet("offers", page.toString())) || [];
  }

  _setOffers(page, offers) {
    storage.mapPut("offers", page.toString(), JSON.stringify(offers));
  }

  _generateRId() {
    const rId = +(storage.get("rId")) || 1;
    storage.put("rId", (rId + 1).toString());
    return rId;
  }

  hasUnit(me, unitId) {
    unitId *= 1;

    const user = this._getUser(me);
    if (user[unitId]) {
      return 1;
    } else {
      return 0;
    }
  }

  hasUnits(me, unitIdArrayStr) {
    const user = this._getUser(me);
    const unitIdArray = JSON.parse(unitIdArrayStr);

    for (let i = 0; i < unitIdArray.length; ++i) {
      if (unitIdArray[i] && !user[unitIdArray[i]]) {
        return 0
      }
    }
    return 1;
  }

  filterUnits(me, unitIdArrayStr) {
    const user = this._getUser(me);
    const unitIdArray = JSON.parse(unitIdArrayStr);
    const res = [];

    for (let i = 0; i < unitIdArray.length; ++i) {
      if (unitIdArray[i] && user[unitIdArray[i]]) {
        res.push(unitIdArray[i]);
      } else {
        res.push(0);
      }
    }
    return res;
  }

  getUnitArray(unitIdArrayStr) {
    const user = this._getUser(tx.publisher);
    const unitIdArray = JSON.parse(unitIdArrayStr);
    const result = [];

    for (let i = 0; i < unitIdArray.length; ++i) {
      const unitId = unitIdArray[i];
      const unit = this._getUnit(unitId);
      if (!unit) {
        continue;
      }

      unit.unitId = unitId;

      if (user) {
        unit.bought = (!!user[unitId]) * 1;
      }

      result.push(unit);
    }

    return result;
  }

  _addAndGetCountOfChannel(channel) {
    var count = +storage.mapGet("channel_count", channel) || 0;
    ++count;
    storage.mapPut("channel_count", channel, count.toString());
    return count;
  }

  debugFixCountOfChannel(channel, count) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.mapPut("channel_count", channel, count.toString());
  }

  _addUnitDirectly(who, unitId, level, exp) {
    const user = this._getUser(who);

    if (user[unitId]) return;

    // Creates and saves unitR.
    const unitR = {
      unitId: unitId,
      level: level,
      energy: {
        amount: MAX_ENERGY,
        time: 0
      }
    };
    const rId = this._generateRId();
    this._setUnitR(rId, unitR);

    // Saves to user
    user[unitId] = {
      rId: rId,
      page: 0,
      itemRIdArray: [0,0,0,0],
      exp: exp
    };
    this._setUser(who, user);

    this._maybeAddOneDefenseUnit(who, unitId);
  }

  debugAddUnitDirectly(who, unitId, level) {
    unitId *= 1;
    level *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    this._addUnitDirectly(who, unitId, level, 0);
  }

  addTrial(who, unitIdArrayStr, exp) {
    const unitIdArray = JSON.parse(unitIdArrayStr);
    exp *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active") &&
        !blockchain.requireAuth(this._getAccount(), "active")) {
      throw "only owner, or account can add trial";
    }

    unitIdArray.forEach(unitId => {
      unitId *= 1;
      this._addUnitDirectly(who, unitId, 1, exp);
    });
  }

  debugAddUnitDirectlyIfThree(who, unitId) {
    unitId *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const user = this._getUser(who);

    var count = 0;

    for (let i = 1; i <= 13; ++i) {
      if (user[i]) {
        ++count;
      }
    }

    if (count >= 3) {
      this._addUnitDirectly(who, unitId, 1, 0);
    }
  }

  _findWhatYouDoNotHave(user) {
    for (let i = 1; i <= 11; ++i) {
      if (!user[i]) {
        return i;
      }
    }

    return 0;
  }

  _getAmountOwned(user) {
    var count = 0;
    for (let i = 1; i <= 11; ++i) {
      if (user[i]) {
        ++count;
      }
    }

    return count;
  }

  buyFromPlatform(unitId) {
    unitId *= 1;

    const channel = blockchain.call(this._getAccount(), "getChannel", [])[0];

    blockchain.callWithAuth(this._getAccount(), "markTrial", [tx.publisher]);

    const user = this._getUser(tx.publisher);

    if (user[unitId]) {
      throw 'already have';
    }

    const unit = this._getUnit(unitId);
    if (!unit) return;

    if (unit.notForSale) {
      throw 'not for sale';
    }

    // Charges IOST.
    blockchain.transfer(tx.publisher,
                        this._getTreasureManager(),
                        unit.price.toString(),
                        "buyFromPlatform");
    blockchain.callWithAuth(this._getTreasureManager(),
                            "pay",
                            [unit.price.toString()]);
    // Record spending.
    blockchain.callWithAuth(this._getRankManager(), "addValue",
        [tx.publisher, "spending", unit.price.toString()]);

    // Updates unit price.
    unit.price = +(unit.price + unit.priceStep).toFixed(3);
    unit.soldAmount = unit.soldAmount ? unit.soldAmount + 1 : 1;
    this._setUnit(unitId, JSON.stringify(unit));

    // Creates and saves unitR.
    const unitR = {
      unitId: unitId,
      level: 1,
      energy: {
        amount: MAX_ENERGY,
        time: 0
      }
    };

    // Maybe update level according to trial.
    const trialLevels = this._getTrialLevels(tx.publisher);
    if (trialLevels[unitId] && trialLevels[unitId] > unitR.level) {
      unitR.level = trialLevels[unitId];
    }

    const rId = this._generateRId();
    this._setUnitR(rId, unitR);

    // Saves to user
    user[unitId] = {
      rId: rId,
      page: 0,
      itemRIdArray: [0,0,0,0]
    };

    this._setUser(tx.publisher, user);

    this._maybeAddOneDefenseUnit(tx.publisher, unitId);

    // Maybe add lottery
    // TODO: Maybe remove this after presale
    var amountBought = +storage.mapGet("amount_bought", tx.publisher) || 0;
    ++amountBought;
    storage.mapPut("amount_bought", tx.publisher, amountBought.toString());

    const ticketAmount = 3;
    const giftUnitId = 0;

    blockchain.callWithAuth(this._getLotteryManager(), "addTickets", [tx.publisher, ticketAmount.toString()]);

    return {
      price: unit.price,
      soldAmount: unit.soldAmount,
      ticketAmount: ticketAmount,
      giftUnitId: giftUnitId
    }
  }

  issueForFree(unitId) {
    if (!blockchain.requireAuth(this._getLotteryManager(), "active")) {
      throw "only lottery manager can issue for free";
    }

    unitId *= 1;
    const user = this._getUser(tx.publisher);

    if (user[unitId]) {
      throw 'already have';
    }

    const unit = this._getUnit(unitId);
    if (!unit) return;

    // Creates and saves unitR.
    const unitR = {
      unitId: unitId,
      level: 1,
      energy: {
        amount: MAX_ENERGY,
        time: 0
      }
    };
    const rId = this._generateRId();
    this._setUnitR(rId, unitR);

    // Saves to user
    user[unitId] = {
      rId: rId,
      page: 0,
      itemRIdArray: [0,0,0,0]
    };
    this._setUser(tx.publisher, user);

    this._maybeAddOneDefenseUnit(tx.publisher, unitId);
  }

  getOfferArray(limit, offset) {
    limit *= 1;
    offset *= 1;

    const pages = this._getPages();

    let cur = 0;
    let i = 0;

    while (cur + pages[i] < offset && i < pages.length) {
      cur += pages[i];
      ++i;
    }

    const result = [];

    while (cur < offset + limit && i < pages.length) {
      const offers = this._getOffers(i);

      for (let j = Math.max(0, offset - cur);
           j < Math.min(offers.length, offset - cur + limit);
           ++j) {
        // Populate values.
        offers[j].page = i;
        const unitR = this._getUnitR(offers[j].rId);
        offers[j].level = unitR.level;

        result.push(offers[j]);
      }

      cur += pages[i];
      ++i;
    }

    return result;
  }

  sell(unitId, price) {
    unitId *= 1;
    price *= 1;

    if (unitId == 41) {
      throw "not-tradeable";
    }

    // Check that the user has the unit.
    const user = this._getUser(tx.publisher);

    if (!user[unitId]) {
      return;
    }

    // Check that it's not in trial.
    if (user[unitId].exp) {
      throw "not-tradeable";
    }

    // Check that it's not on sale yet.
    if (user[unitId].page) {
      return;
    }

    const pages = this._getPages();

    let currentPage = 0;
    while (currentPage < pages.length && pages[currentPage] >= PAGE_LIMIT) {
      ++currentPage;
    }

    if (currentPage < pages.length) {
      ++pages[currentPage]
    } else {
      pages.push(1);
    }

    // Set pages.
    this._setPages(pages);

    // Set user
    user[unitId].page = currentPage + 1;
    this._setUser(tx.publisher, user);

    // Set offers.
    const offers = this._getOffers(currentPage);
    offers.push({
      seller: tx.publisher,
      rId: user[unitId].rId,
      unitId: unitId,
      price: price
    });
    this._setOffers(currentPage, offers);
  }

  cancel(unitId) {
    unitId *= 1;

    // Check that the user has the unit.
    const user = this._getUser(tx.publisher);
    if (!user[unitId]) {
      return;
    }

    // Check that it's on sale.
    if (!user[unitId].page) {
      return;
    }

    const currentPage = user[unitId].page - 1;

    // Set user
    user[unitId].page = 0;
    this._setUser(tx.publisher, user);

    // Decrease amount in pages.
    const pages = this._getPages();
    if (pages[currentPage]) {
      --pages[currentPage];
    }
    this._setPages(pages);

    // Remove offer from offers.
    const offers = this._getOffers(currentPage);
    const rId = user[unitId].rId;

    for (let i = 0; i < offers.length; ++i) {
      if (offers[i].rId == rId) {
        offers.splice(i, 1);
        break;
      }
    }

    this._setOffers(currentPage, offers);
  }

  debugDeleteUnit(who, unitId) {
    unitId *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const user = this._getUser(who);

    if (user) {
      // Unmount items.
      blockchain.callWithAuth(
          this._getItemManager(),
          "unmountInBatch",
          [JSON.stringify(user[unitId].itemRIdArray)]);

      // Deletes unitR.
      storage.mapDel("unitR", user[unitId].rId.toString());

      delete user[unitId];
      this._setUser(who, user);

      // Remove from land.
      blockchain.callWithAuth(
          this._getLandManager(),
          "removeUnit",
          [who, unitId.toString()]);

      this._maybeRemoveDefense(who, unitId);
    };
  }

  deleteTrial(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const user = this._getUser(who);
    const trialLevels = this._getTrialLevels(who);

    const res = [];

    for (let unitId in user) {
      if (user[unitId] && user[unitId].exp > 0) {
        // Saves trial_levels.
        const unitR = this._getUnitR(user[unitId].rId);
        trialLevels[unitId] = unitR.level;

        res.push(unitId);
        // Deletes existing unit from trial.
        storage.mapDel("unitR", user[unitId].rId.toString());

        delete user[unitId];

        // Remove from land.
        blockchain.callWithAuth(
            this._getLandManager(),
            "removeUnit",
            [who, unitId.toString()]);

        this._maybeRemoveDefense(who, unitId);
      }
    }

    if (res.length) {
      this._setTrialLevels(who, trialLevels);
      this._setUser(who, user);
    }

    return res;
  }

  buy(currentPage, rId) {
    currentPage *= 1;
    rId *= 1;

    blockchain.callWithAuth(this._getAccount(), "markTrial", [tx.publisher]);

    // Check the offer is there.
    const offers = this._getOffers(currentPage);

    const all = offers.filter((offer) => {
      return offer.rId == rId;
    });

    if (all.length <= 0) return 0;

    const offer = all[0];
    const seller = offer.seller;
    const price = offer.price;
    const unitId = offer.unitId;

    // Check that the user does not have the unit yet.
    const user = this._getUser(tx.publisher);
    if (user[unitId]) {
      return 0;
    }

    // Charges IOST.
    const fee = +(price * 0.05).toFixed(3);
    const sellerAmount = +(price - fee).toFixed(3);

    blockchain.transfer(tx.publisher, this._getTreasureManager(), fee.toString(), "buy:fee");
    blockchain.callWithAuth(this._getTreasureManager(),
                            "payFee",
                            [fee.toString()]);
    blockchain.transfer(tx.publisher, seller, sellerAmount.toString(), "buy");
    // Record spending.
    blockchain.callWithAuth(this._getRankManager(), "addValue",
        [tx.publisher, "spending", price.toString()]);
    // Record revenue
    blockchain.callWithAuth(this._getRankManager(), "addValue",
        [seller, "revenue", sellerAmount.toString()]);

    user[unitId] = {
      rId: rId,
      page: 0,
      itemRIdArray: [0,0,0,0]
    }

    // Set user.
    this._setUser(tx.publisher, user);

    // Decrease amount in pages.
    const pages = this._getPages();
    if (pages[currentPage]) {
      --pages[currentPage];
    }
    this._setPages(pages);

    // Remove offer from offers.
    for (let i = 0; i < offers.length; ++i) {
      if (offers[i].rId == rId) {
        offers.splice(i, 1);
        break;
      }
    }

    this._setOffers(currentPage, offers);

    // Remove from seller user.
    const sellerUser = this._getUser(seller);

    if (sellerUser) {
      // Unmount items.
      blockchain.callWithAuth(
          this._getItemManager(),
          "unmountInBatch",
          [JSON.stringify(sellerUser[unitId].itemRIdArray)]);

      delete sellerUser[unitId];
      this._setUser(seller, sellerUser);

      // Remove from land.
      blockchain.callWithAuth(
          this._getLandManager(),
          "removeUnit",
          [seller, unitId.toString()]);

      this._maybeRemoveDefense(seller, unitId);

      // Notification
      blockchain.callWithAuth(
          this._getNotificationManager(),
          "add",
          [seller,
           "0",
           unitId.toString(),
           sellerAmount.toString()]);
    }

    // Maybe update level according to trial.
    const trialLevels = this._getTrialLevels(tx.publisher);
    const unitR = this._getUnitR(rId);
    if (trialLevels[unitId] && trialLevels[unitId] > unitR.level) {
      unitR.level = trialLevels[unitId];
      this._setUnitR(rId, unitR);
    }

    this._maybeAddOneDefenseUnit(tx.publisher, unitId);

    return 1;
  }

  mountItem(itemRId, unitId) {
    itemRId *= 1;
    unitId *= 1;

    const user = this._getUser(tx.publisher);

    if (!user[unitId]) {
      throw "has-no-unit";
    }

    let hasItem = blockchain.call(this._getItemManager(), "hasItem", [tx.publisher, itemRId.toString()])[0] * 1;
    if (!hasItem) {
      throw "has-no-item";
    }

    const item = JSON.parse(blockchain.call(this._getItemManager(), "getItemByRId", [itemRId.toString()])[0]);
    if (!item || !item.isMountable) {
      throw "not-mountable";
    }

    for (let unitId in user) {
      for (let i = 0; i < ITEM_LIMIT; ++i) {
        if (user[unitId].itemRIdArray[i] == itemRId) {
          // Unmount from the other unit.
          user[unitId].itemRIdArray[i] = 0;

          blockchain.callWithAuth(
              this._getItemManager(),
              "unmount",
              [itemRId.toString()]);
          break;
        }
      }
    }

    const position = item.positionIndex * 1;

    // Unmount exsting one.
    const rIdToUnmount = user[unitId]["itemRIdArray"][position];
    if (rIdToUnmount) {
      blockchain.callWithAuth(
          this._getItemManager(),
          "unmount",
          [rIdToUnmount.toString()]);
    }

    user[unitId]["itemRIdArray"][position] = itemRId;

    this._setUser(tx.publisher, user);

    blockchain.callWithAuth(
        this._getItemManager(),
        "mount",
        [unitId.toString(), itemRId.toString()]);

    return rIdToUnmount || 0;
  }

  unmountItem(itemRId) {
    itemRId *= 1;

    const user = this._getUser(tx.publisher);

    for (let unitId in user) {
      for (let i = 0; i < ITEM_LIMIT; ++i) {
        if (user[unitId].itemRIdArray[i] == itemRId) {
          user[unitId].itemRIdArray[i] = 0;
        }
      }
    }

    this._setUser(tx.publisher, user);

    blockchain.callWithAuth(
        this._getItemManager(),
        "unmount",
        [itemRId.toString()]);
  }

  unmountHisItem(who, itemRId) {
    if (!blockchain.requireAuth(this._getItemManager(), "active")) {
      throw "only itemManager can change";
    }

    itemRId *= 1;

    const user = this._getUser(who);

    for (let unitId in user) {
      for (let i = 0; i < ITEM_LIMIT; ++i) {
        if (user[unitId].itemRIdArray[i] == itemRId) {
          user[unitId].itemRIdArray[i] = 0;
        }
      }
    }

    this._setUser(who, user);

    blockchain.callWithAuth(
        this._getItemManager(),
        "unmount",
        [itemRId.toString()]);
  }

  unlockLevel(unitId, level) {
    unitId *= 1;
    level *= 1;

    var rIdArray;

    if (level == 10) {
      const itemId = 111;
      const amount = 1;

      rIdArray = JSON.parse(blockchain.callWithAuth(
          this._getItemManager(),
          "useItem",
          [itemId.toString(),
           amount.toString()])[0]);
      const user = this._getUser(tx.publisher);
      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      unitR.unlock = 10;

      this._setUnitR(rId, unitR);
    } else if (level == 15) {
      const itemId = 111;
      const amount = 2;

      rIdArray = JSON.parse(blockchain.callWithAuth(
          this._getItemManager(),
          "useItem",
          [itemId.toString(),
           amount.toString()])[0]);
      const user = this._getUser(tx.publisher);
      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      unitR.unlock = 15;

      this._setUnitR(rId, unitR);
    } else if (level >= 20 && level <= 24) {
      rIdArray = JSON.parse(blockchain.callWithAuth(
          this._getItemManager(),
          "useItem",
          ["111", "2"])[0]);
      rIdArray = rIdArray.concat(JSON.parse(blockchain.callWithAuth(
          this._getItemManager(),
          "useItem",
          ["113", "1"])[0]));
      const user = this._getUser(tx.publisher);
      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      unitR.unlock = level;

      this._setUnitR(rId, unitR);
    }
    return rIdArray;
  }

  upgrade(unitId) {
    unitId *= 1;

    const user = this._getUser(tx.publisher);
    const rId = user[unitId].rId;
    const unitR = this._getUnitR(rId);

    if (unitR.level >= 10 && (!unitR.unlock || unitR.unlock < 10) ||
        unitR.level >= 15 && (!unitR.unlock || unitR.unlock < 15) ||
        unitR.level >= 20 && (!unitR.unlock || unitR.unlock < unitR.level)) {
      throw 'level-limit';
    }

    const unit = this._getUnit(unitId);
    const cost = this._upgradeCost(unit, unitR.level);

    blockchain.call(this._getTreasureManager(),
                    "destroy",
                    [cost.toString()]);

    ++unitR.level;
    this._setUnitR(rId, unitR);

    return {
      unitId: unitId,
      rId: rId,
      level: unitR.level,
      hp: this._hp(unit, unitR.level),
      attack: this._attack(unit, unitR.level),
      intelligence: this._intelligence(unit, unitR.level),
      defense: this._defense(unit, unitR.level),
      agility: this._agility(unit, unitR.level),
      luck: this._luck(unit, unitR.level),
      recoverCost: this._recoverCost(unit, unitR.level),
      upgradeCost: this._upgradeCost(unit, unitR.level)
    };
  }

  _tryRecoverAndLottery(unitId, hasLottery) {
    const now = Math.floor(tx.time / 1e9);

    const info = JSON.parse(storage.mapGet("recover_info", tx.publisher) || "{}");

    if (!info[unitId]) {
      info[unitId] = [];
    }

    if (!info["count"]) {
      info["count"] = 0;
    }

    const beginOfToday = now - now % (3600 * 24);

    // Remove any thing that's earlier than 8am Beijing time.
    if (info[unitId].length > 0 && info[unitId][0] < beginOfToday) {
      info[unitId].shift();
    }


    if (info[unitId].length < RECOVER_LIMIT) {
      info[unitId].push(now);

      let ticketAmount = 0;

      if (hasLottery) {
        // No lottery for trial units.
        ++info.count;

        if (info.count >= RECOVER_LIMIT_FOR_LOTTERY) {
          info.count = 0;

          blockchain.callWithAuth(this._getLotteryManager(), "addTickets", [tx.publisher, "1"]);

          ticketAmount = 1;
        }
      }

      storage.mapPut("recover_info", tx.publisher, JSON.stringify(info));

      return {
        unitId: unitId,
        ticketAmount: ticketAmount
      };
    } else {
      return {
        unitId: 0,
        ticketAmount: 0
      };
    }
  }

  _tryBatchRecoverAndLottery(unitIdArray, hasLottery) {
    const now = Math.floor(tx.time / 1e9);

    const info = JSON.parse(storage.mapGet("recover_info", tx.publisher) || "{}");

    if (!info["count"]) {
      info["count"] = 0;
    }

    const res = {
      unitIdArray: [],
      ticketAmount: 0
    };

    const beginOfToday = now - now % (3600 * 24);

    unitIdArray.forEach(unitId => {
      if (!info[unitId]) {
        info[unitId] = [];
      }

      // Remove any thing that's earlier than 8am Beijing time.
      if (info[unitId].length > 0 && info[unitId][0] < beginOfToday) {
        info[unitId].shift();
      }

      if (info[unitId].length < RECOVER_LIMIT) {
        info[unitId].push(now);

        if (hasLottery) {
          ++info.count;
        }

        res.unitIdArray.push(unitId);
      }
    });

    if (hasLottery) {
      const amountOfTickets = Math.floor(info.count / RECOVER_LIMIT_FOR_LOTTERY);
      info.count = info.count % RECOVER_LIMIT_FOR_LOTTERY;

      if (amountOfTickets) {
        blockchain.callWithAuth(this._getLotteryManager(),
                                "addTickets",
                                [tx.publisher, amountOfTickets.toString()]);
        res.ticketAmount = amountOfTickets;
      }
    }

    storage.mapPut("recover_info", tx.publisher, JSON.stringify(info));

    return res;
  }

  recover(unitId) {
    unitId *= 1;

    const user = this._getUser(tx.publisher);
    const rId = user[unitId].rId;
    const unitR = this._getUnitR(rId);

    if (this._realEnergy(unitR.energy) >= MAX_ENERGY) {
      // Nothing will happen.
      return;
    }

    const res = this._tryRecoverAndLottery(unitId, !unitR.exp);

    if (res.unitId == 0) return res;

    const unit = this._getUnit(unitId);
    const cost = +this._recoverCost(unit, unitR.level);

    blockchain.transfer(tx.publisher, this._getTreasureManager(), cost.toString(), "recover");
    blockchain.callWithAuth(this._getTreasureManager(),
                            "pay",
                            [cost.toString()]);
    // Record spending.
    blockchain.callWithAuth(this._getRankManager(), "addValue",
        [tx.publisher, "spending", cost.toString()]);

    const now = Math.floor(tx.time / 1e9);
    unitR.energy.amount = MAX_ENERGY;
    unitR.energy.time = now;

    this._setUnitR(rId, unitR);

    return res;
  }

  recoverInBatch(unitIdArrayStr) {
    var unitIdArray = JSON.parse(unitIdArrayStr);

    const user = this._getUser(tx.publisher);
    var isExp = false;

    unitIdArray.forEach(unitId => {
      unitId *= 1;
      if (user[unitId].exp) isExp = true;
    });

    // No lottery for exp units.
    const res = this._tryBatchRecoverAndLottery(unitIdArray, !isExp);

    if (res.unitIdArray.length == 0) return res;

    unitIdArray = res.unitIdArray;

    let cost = 0;
    const now = Math.floor(tx.time / 1e9);

    for (let i = 0; i < unitIdArray.length; ++i) {
      const unitId = unitIdArray[i] * 1;
      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      const unit = this._getUnit(unitId);

      cost += this._recoverCost(unit, unitR.level);

      unitR.energy.amount = MAX_ENERGY;
      unitR.energy.time = now;

      this._setUnitR(rId, unitR);
    }

    blockchain.transfer(tx.publisher, this._getTreasureManager(), cost.toFixed(3), "recoverInBatch");
    blockchain.callWithAuth(this._getTreasureManager(),
                            "pay",
                            [cost.toFixed(3)]);
    // Record spending.
    blockchain.callWithAuth(this._getRankManager(), "addValue",
        [tx.publisher, "spending", cost.toFixed(3)]);

    return res;
  }

  _consumeEnery(rId, unitR) {
    const res = this._realEnergy(unitR.energy);

    if (res.amount <= 0) {
      throw "not-enough-energy";
    }

    const now = Math.floor(tx.time / 1e9);

    if (res.amount == MAX_ENERGY) {
      unitR.energy.time = now;
    } else {
      unitR.energy.time = now - res.duration;
    }

    unitR.energy.amount = res.amount - 1;

    this._setUnitR(rId, unitR);

    return {
      amount: res.amount - 1,
      duration: res.duration,
      now: now
    };
  }

  _consumeEneryMore(rId, unitR, times) {
    const res = this._realEnergy(unitR.energy);

    if (res.amount < times) {
      throw "not-enough-energy";
    }

    const now = Math.floor(tx.time / 1e9);

    if (res.amount == MAX_ENERGY) {
      unitR.energy.time = now;
    } else {
      unitR.energy.time = now - res.duration;
    }

    unitR.energy.amount = res.amount - times;

    this._setUnitR(rId, unitR);

    return {
      amount: res.amount - times,
      duration: res.duration,
      now: now
    };
  }

  consumeAllEnergy(unitIdArrayStr) {
    const unitIdArray = JSON.parse(unitIdArrayStr);
    const user = this._getUser(tx.publisher);

    var amount = MAX_ENERGY;

    const rIdArray = [];
    const unitRArray = [];

    unitIdArray.forEach(unitId => {
      unitId *= 1;
      if (!unitId) {
        rIdArray.push(0);
        unitRArray.push(null);
        return;
      }

      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      rIdArray.push(rId);
      unitRArray.push(unitR);

      const res = this._realEnergy(unitR.energy);
      amount = Math.min(res.amount, amount);
    });

    if (amount <= 0) {
      return {
        amount: 0
      }
    }

    const now = Math.floor(tx.time / 1e9);

    const energies = [];

    for (let i = 0; i < rIdArray.length; ++i) {
      const rId = rIdArray[i];
      const unitR = unitRArray[i];

      if (!rId || !unitR) {
        energies.push(null);
        continue;
      }

      const res = this._realEnergy(unitR.energy);

      if (res.amount == MAX_ENERGY) {
        unitR.energy.time = now;
      } else {
        unitR.energy.time = now - res.duration;
      }
      unitR.energy.amount = res.amount - amount;
      this._setUnitR(rId, unitR);

      energies.push({
        amount: res.amount - amount,
        duration: res.duration,
        now: now
      });
    }

    return {
      amount: amount,
      energies: energies
    };
  }

  _debugConsumeEnery(who, unitId) {
    unitId *= 1;

    const user = this._getUser(who);
    const rId = user[unitId].rId;
    const unitR = this._getUnitR(rId);

    const res = this._realEnergy(unitR.energy);

    if (res.amount <= 0) {
      throw "not-enough-energy";
    }

    const now = Math.floor(tx.time / 1e9);

    if (res.amount == MAX_ENERGY) {
      unitR.energy.time = now;
    } else {
      unitR.energy.time = now - res.duration;
    }

    unitR.energy.amount = res.amount - 1;

    this._setUnitR(rId, unitR);

    return {
      amount: res.amount - 1,
      duration: res.duration,
      now: now
    };
  }

  markDuel(winner, loser) {
    const now = Math.floor(tx.time / 1e9);
    storage.mapPut("win", winner, now.toString());
    storage.mapPut("lose", loser, now.toString());
  }

  canDuel(me, peer) {
    const now = Math.floor(tx.time / 1e9);
    const myWin = +storage.mapGet("win", me) || 0;
    const hisLose = +storage.mapGet("lose", peer) || 0;

    return (myWin + 12 * 3600 < now &&
        hisLose + 24 * 3600 < now) * 1;
  }

  setDefenseUnitIdArray(unitIdArrayStr) {
    const unitIdArray = JSON.parse(unitIdArrayStr);

    if (unitIdArray.length != UNIT_LIMIT) {
      throw "invalid-input";
    }

    unitIdArray[0] *= 1;
    unitIdArray[1] *= 1;
    unitIdArray[2] *= 1;

    if ((unitIdArray[0] > 0 &&
        (unitIdArray[0] == unitIdArray[1] || unitIdArray[0] == unitIdArray[2]))
        || (unitIdArray[1] > 0 && unitIdArray[1] == unitIdArray[2])) {
      throw "duplicate units";
    }

    if (!this.hasUnits(tx.publisher, unitIdArrayStr)) {
      throw "has-no-units";
    }

    storage.mapPut("defense", tx.publisher, unitIdArrayStr);
  }

  _maybeAddOneDefenseUnit(who, unitId) {
    unitId *= 1;

    const defenseUnitIdArray = this._getDefenseUnitIdArray(who);
    var changed = false;

    for (let i = 0; i < defenseUnitIdArray.length; ++i) {
      if (!defenseUnitIdArray[i]) {
        defenseUnitIdArray[i] = unitId;
        changed = true;
        break;
      }
    }

    if (changed) {
      storage.mapPut("defense", who, JSON.stringify(defenseUnitIdArray));
    }
  }

  getDefenseUnitIdArray() {
    return this._getDefenseUnitIdArray(tx.publisher);
  }

  _getDefenseUnitIdArray(who) {
    return JSON.parse(storage.mapGet("defense", who) || "[0,0,0]");
  }

  _maybeRemoveDefense(who, unitId) {
    unitId *= 1;
    const unitIdArray = this._getDefenseUnitIdArray(who);
    unitIdArray.forEach((defenseUnitId, index) => {
      if (defenseUnitId * 1 == unitId) {
        unitIdArray[index] = 0;
      }
    });
    storage.mapPut("defense", who, JSON.stringify(unitIdArray));
  }

  _hp(unit, level) {
    return +(unit.hp + unit.hpStep * level).toFixed(0);
  }

  _attack(unit, level) {
    return +(unit.attack + unit.attackStep * level).toFixed(0);
  }

  _intelligence(unit, level) {
    return +(unit.intelligence + unit.intelligenceStep * level).toFixed(0);
  }

  _defense(unit, level) {
    return +(unit.defense + unit.defenseStep * level).toFixed(0);
  }

  _agility(unit, level) {
    return +(unit.agility + unit.agilityStep * level).toFixed(0);
  }

  _luck(unit, level) {
    return +(unit.luck + unit.luckStep * level).toFixed(0);
  }

  _recoverCost(unit, level) {
    // Fixed cost of 20 IOST.
    return 20;
  }

  _upgradeCost(unit, level) {
    let cost = unit.upgradeCost;

    for (let i = 1; i < level; ++i) {
      cost = cost * 11 / 10;
    }

    return +(cost).toFixed(0);
  }

  _realEnergy(energy) {
    const now = tx.time / 1e9;

    const realAmount = energy.amount + Math.floor((now - energy.time) / (3600));

    if (realAmount >= MAX_ENERGY) {
      return {
        amount: MAX_ENERGY,
        duration: 0,
        now: now
      };
    } else {
      return {
        amount: realAmount,
        duration: Math.floor(((now - energy.time) % (3600))),
        now: now
      };
    }
  }

  getRealEnergy(who, unitId) {
    // For debug.
    unitId *= 1;

    const user = this._getUser(who);
    const rId = user[unitId].rId;
    const unitR = this._getUnitR(rId);

    return this._realEnergy(unitR.energy);
  }

  getHp(unitId, level) {
    unitId *= 1;
    level *= 1;
    const unit = this._getUnit(unitId);
    if (!unit) return 0;
    return +(unit.hp + unit.hpStep * level).toFixed(0);
  }

  savePower(who) {
    const units = this._getHisUnits(who);

    var p = 0;
    units.forEach(u => {
      p = p + u.hp + u.hpP + u.attack + u.attackP + u.intelligence + u.intelligenceP +
          u.defense + u.defenseP + u.agility + u.agilityP;
    });

    p = +p.toFixed(0);

    blockchain.callWithAuth(this._getRankManager(), "setValue", [who, "power", p.toString()]);
  }

  getMyUnits() {
    return this._getHisUnits(tx.publisher);
  }

  _getHisUnits(who) {
    const user = this._getUser(who);

    const result = [];
    for (let unitId in user) {
      let rId = user[unitId].rId;
      let unitR = this._getUnitR(rId);
      let unit = this._getUnit(unitId);

      const mounted = JSON.parse(blockchain.call(
          this._getItemManager(),
          "getItemIdArrayFromRIdArray",
          [JSON.stringify(user[unitId].itemRIdArray)])[0]);

      const sum = JSON.parse(blockchain.call(
          this._getItemManager(),
          "getSum",
          [JSON.stringify(user[unitId].itemRIdArray), unitId.toString()])[0]);

      result.push({
        rId: rId,
        unitId: unitId,
        level: unitR.level,
        mounted: mounted,
        hp: this._hp(unit, unitR.level),
        hpP: sum.hp,
        attack: this._attack(unit, unitR.level),
        attackP: sum.attack,
        intelligence: this._intelligence(unit, unitR.level),
        intelligenceP: sum.intelligence,
        defense: this._defense(unit, unitR.level),
        defenseP: sum.defense,
        agility: this._agility(unit, unitR.level),
        agilityP: sum.agility,
        luck: this._luck(unit, unitR.level),
        luckP: sum.luck,
        recoverCost: this._recoverCost(unit, unitR.level),
        upgradeCost: this._upgradeCost(unit, unitR.level),
        energy: this._realEnergy(unitR.energy),
        forSale: user[unitId].page && user[unitId].page > 0
      });
    }

    return result;
  }

  getMyStatusAndConsumeEnergy(unitIdArrayStr, times) {
    const unitIdArray = JSON.parse(unitIdArrayStr);
    times *= 1;

    if (unitIdArray.length != UNIT_LIMIT && unitIdArray.length != UNIT_LIMIT * 2) {
      throw 'UNIT_LIMIT';
    }

    let i;

    const user = this._getUser(tx.publisher);

    const result = [];
    for (i = 0; i < unitIdArray.length; ++i) {
      const unitId = unitIdArray[i] * 1 || 0;

      if (!unitId || !user[unitId]) {
        result.push({
          rId: 0,
          unitId: 0,
          level: 0,
          hp: 0,
          attack: 0,
          intelligence: 0,
          defense: 0,
          agility: 0,
          luck: 0,
          hpR: 0,
          agilityR: 0,
          stunned: 0,
          fire: 0,
          round: 0,
          roundA: 0,
          used: 0,
          energy: null
        });

        continue;
      }

      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      const unit = this._getUnit(unitId);

      const energy = this._consumeEneryMore(rId, unitR, times);

      const sum = JSON.parse(blockchain.call(
          this._getItemManager(),
          "getSum",
          [JSON.stringify(user[unitId].itemRIdArray), unitId.toString()])[0]);

      const hp = this._hp(unit, unitR.level) + sum.hp;
      const agility = this._agility(unit, unitR.level) + sum.agility;

      result.push({
        rId: rId,
        unitId: unitId,
        level: unitR.level,
        hp: hp,
        attack: this._attack(unit, unitR.level) + sum.attack,
        intelligence: this._intelligence(unit, unitR.level) + sum.intelligence,
        defense: this._defense(unit, unitR.level) + sum.defense,
        agility: agility,
        luck: this._luck(unit, unitR.level) + sum.luck,
        hpR: hp,
        agilityR: agility,
        stunned: 0,
        fire: 0,
        round: 0,
        roundA: 0,
        used: 0,
        energy: energy
      });
    }

    return result;
  }

  debugGetMyStatusAndConsumeEnergy(who, unitIdArrayStr) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const unitIdArray = JSON.parse(unitIdArrayStr);

    if (unitIdArray.length != UNIT_LIMIT) {
      throw 'UNIT_LIMIT';
    }

    let i;

    const user = this._getUser(who);

    const result = [];
    for (i = 0; i < unitIdArray.length; ++i) {
      const unitId = unitIdArray[i] * 1 || 0;

      if (!unitId || !user[unitId]) {
        result.push({
          rId: 0,
          unitId: 0
        });

        continue;
      }

      const energy = this._debugConsumeEnery(who, unitId);

      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      const unit = this._getUnit(unitId);

      const sum = JSON.parse(blockchain.call(
          this._getItemManager(),
          "getSum",
          [JSON.stringify(user[unitId].itemRIdArray), unitId.toString()])[0]);

      const hp = this._hp(unit, unitR.level) + sum.hp;
      const agility = this._agility(unit, unitR.level) + sum.agility;

      result.push({
        rId: rId,
        unitId: unitId,
        level: unitR.level,
        hp: hp,
        attack: this._attack(unit, unitR.level) + sum.attack,
        intelligence: this._intelligence(unit, unitR.level) + sum.intelligence,
        defense: this._defense(unit, unitR.level) + sum.defense,
        agility: agility,
        luck: this._luck(unit, unitR.level) + sum.luck,
        hpR: hp,
        agilityR: agility,
        stunned: 0,
        fire: 0,
        round: 0,
        roundA: 0,
        used: 0,
        energy: energy
      });
    }

    return result;
  }

  getPeerStatus(who) {
    const unitIdArray = this._getDefenseUnitIdArray(who);
    return this._getPeerStatusOf(who, unitIdArray);
  }

  getPeerStatusOf(who, unitIdArrayStr) {
    const unitIdArray = JSON.parse(unitIdArrayStr);
    return this._getPeerStatusOf(who, unitIdArray);
  }

  _getPeerStatusOf(who, unitIdArray) {
    let i;

    const user = this._getUser(who);

    const result = [];
    for (i = 0; i < unitIdArray.length; ++i) {
      const unitId = unitIdArray[i];

      if (!unitId || !user[unitId]) {
        result.push({
          rId: 0,
          unitId: 0
        });

        continue;
      }

      const rId = user[unitId].rId;
      const unitR = this._getUnitR(rId);
      const unit = this._getUnit(unitId);

      const sum = JSON.parse(blockchain.call(
          this._getItemManager(),
          "getSum",
          [JSON.stringify(user[unitId].itemRIdArray), unitId.toString()])[0]);

      const hp = this._hp(unit, unitR.level) + sum.hp;
      const agility = this._agility(unit, unitR.level) + sum.agility;

      result.push({
        rId: rId,
        unitId: unitId * 1,
        level: unitR.level,
        hp: hp,
        attack: this._attack(unit, unitR.level) + sum.attack,
        intelligence: this._intelligence(unit, unitR.level) + sum.intelligence,
        defense: this._defense(unit, unitR.level) + sum.defense,
        agility: agility,
        luck: this._luck(unit, unitR.level) + sum.luck,
        hpR: hp,
        agilityR: agility,
        stunned: 0,
        fire: 0,
        round: 0,
        roundA: 0,
        used: 0
      });
    }

    return result;
  }

  getNPCStatus(stageId, placeIndex, battleIndex) {
    stageId *= 1;
    placeIndex *= 1;
    battleIndex *= 1;

    const unitArrayStr = blockchain.call(
        this._getStageManager(),
        "getUnitArray",
        [stageId.toString(),
         placeIndex.toString(),
         battleIndex.toString()])[0];
    const unitArray = JSON.parse(unitArrayStr);

    const result = [];
    for (let i = 0; i < unitArray.length; ++i) {
      const unitId = unitArray[i].unitId;
      const level = unitArray[i].level;

      let unit = this._getUnit(unitId);

      const hp = this._hp(unit, level);
      const agility = this._agility(unit, level);

      result.push({
        unitId: unitId,
        level: level,
        hp: hp,
        attack: this._attack(unit, level),
        intelligence: this._intelligence(unit, level),
        defense: this._defense(unit, level),
        agility: agility,
        luck: this._luck(unit, level),
        hpR: hp,
        agilityR: agility,
        stunned: 0,
        fire: 0,
        round: 0,
        roundA: 0,
        used: 0
      });
    }

    return result;
  }

  getEpicStatus(unitId, level) {
    unitId *= 1;
    level *= 1;

    const unit = this._getUnit(unitId);

    const hp = this._hp(unit, level);
    const agility = this._agility(unit, level);

    return {
      unitId: unitId,
      level: level,
      hp: hp,
      attack: this._attack(unit, level),
      intelligence: this._intelligence(unit, level),
      defense: this._defense(unit, level),
      agility: agility,
      luck: this._luck(unit, level),
      hpR: hp,
      agilityR: agility,
      stunned: 0,
      fire: 0,
      round: 0,
      roundA: 0,
      used: 0
    };
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const user = this._getUser(from);
    this._setUser(to, user);
    storage.mapDel("user", from);

    const amountBought = storage.mapGet("amount_bought", from);
    if (amountBought) {
      storage.mapPut("amount_bought", to, amountBought);
      storage.mapDel("amount_bought", from);
    }

    const info = storage.mapGet("recover_info", from);
    if (info) {
      storage.mapPut("recover_info", to, info);
      storage.mapDel("recover_info", from);
    }

    const pages = this._getPages();
    const res = [];

    pages.forEach((p, i) => {
      const offers = this._getOffers(i);

      offers.forEach(offer => {
        if (offer.seller == from) {
          offer.seller = to;
        }
      });

      this._setOffers(i, offers);
    });

    return res;
  }
}

module.exports = UnitManager;
