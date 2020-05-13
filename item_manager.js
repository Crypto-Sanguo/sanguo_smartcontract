/*

# item
itemId => {
  hp:
  attack:
  intelligence:
  defense:
  agility:
  luck:
  components: [{
    itemId:
    count:
  }, {
    itemId:
    count:
  }],
  positionIndex: 0/1/2/3,
  isMountable: 0,
  worth:
}

# itemR
rId => {
  itemId: 1
  level: 1,
  score: 100,
  mountedByUnitId:
  time  // last mount time.
  lastUnitId  // last mount unitId.
}

# user
user => {
  rId: {
    itemId:
    page  // page + 1
  }
},

# offer
[
  {
    seller:
    rId:
    itemId:
    price:

    // Populate on the fly.
    page:
    level:
    score:
  }
]

# pages
[
  100,
  80
]

*/


const PAGE_LIMIT = 100;


class ItemManager {

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

  setUnitManager(unitManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("unitManager", unitManager);
  }

  _getUnitManager() {
    return storage.get("unitManager");
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

  setBattle(battle) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("battle", battle);
  }

  _getBattle() {
    return storage.get("battle");
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

  setItem(itemId, json) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.mapPut("item", itemId.toString(), json);
  }

  _getItem(itemId) {
    return JSON.parse(storage.mapGet("item", itemId.toString()) || "0");
  }

  _setItemR(rId, itemR) {
    storage.mapPut("itemR", rId.toString(), JSON.stringify(itemR));
  }

  _removeItemR(rId) {
    storage.mapDel("itemR", rId.toString());
  }

  _getItemR(rId) {
    return JSON.parse(storage.mapGet("itemR", rId.toString()), "{}");
  }

  _getUser(userId) {
    return JSON.parse(storage.mapGet("user", userId.toString()) || "{}");
  }

  _setUser(userId, user) {
    storage.mapPut("user", userId.toString(), JSON.stringify(user));
  }

  _getPages() {
    return JSON.parse(storage.get("pages") || "[]");
  }

  _setPages(pages) {
    storage.put("pages", JSON.stringify(pages));
  }

  _getOffers(page) {
    return JSON.parse(storage.mapGet("offers", page.toString()) || "[]");
  }

  _setOffers(page, offers) {
    storage.mapPut("offers", page.toString(), JSON.stringify(offers));
  }

  _generateRId() {
    const rId = +(storage.get("rId")) || 1;
    storage.put("rId", (rId + 1).toString());
    return rId;
  }

  hasItem(me, itemRId) {
    itemRId *= 1;

    const user = this._getUser(me);
    return user[itemRId] ? 1 : 0;
  }

  getItemByRId(itemRId) {
    itemRId *= 1;

    if (!itemRId) return 0;

    const itemR = this._getItemR(itemRId);
    if (!itemR || !itemR.itemId) return 0;

    const item = this._getItem(itemR.itemId);
    return item;
  }

  getItemIdArrayFromRIdArray(itemRIdArrayStr) {
    const itemRIdArray = JSON.parse(itemRIdArrayStr);

    return itemRIdArray.map(itemRId => {
      if (!itemRId) return 0;
      const itemR = this._getItemR(itemRId);
      if (!itemR) return 0;

      return itemR.itemId;
    });
  }

  getSum(itemRIdArrayStr, unitId) {
    const itemRIdArray = JSON.parse(itemRIdArrayStr);
    unitId *= 1;

    var hp = 0;
    var attack = 0;
    var intelligence  = 0;
    var defense = 0;
    var agility = 0;
    var luck = 0;

    itemRIdArray.forEach(itemRId => {
      if (!itemRId) return;

      const itemR = this._getItemR(itemRId);
      if (!itemR || !itemR.itemId) return;

      const item = this._getItem(itemR.itemId);
      if (!item) return;

      if (item.unitIdS && item.unitIdS.indexOf(unitId) >= 0) {
        item.hp = (item.hp || 0) + (item.hpS || 0);
        item.attack = (item.attack || 0) + (item.attackS || 0);
        item.intelligence = (item.intelligence || 0) + (item.intelligenceS || 0);
        item.defense = (item.defense || 0) + (item.defenseS || 0);
        item.agility = (item.agility || 0) + (item.agilityS || 0);
        item.luck = (item.luck || 0) + (item.luckS || 0);
      }

      hp += this._value(item.hp, itemR.level, itemR.score);
      attack += this._value(item.attack, itemR.level, itemR.score);
      intelligence += this._value(item.intelligence, itemR.level, itemR.score);
      defense += this._value(item.defense, itemR.level, itemR.score);
      agility += this._value(item.agility, itemR.level, itemR.score);
      luck += this._value(item.luck, itemR.level, itemR.score);
    });

    return {
      hp: hp,
      attack: attack,
      intelligence: intelligence,
      defense: defense,
      agility: agility,
      luck: luck
    }
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
        const itemR = this._getItemR(offers[j].rId);
        offers[j].level = itemR.level;
        offers[j].score = itemR.score;

        result.push(offers[j]);
      }

      cur += pages[i];
      ++i;
    }

    return result;
  }

  sell(itemRId, price) {
    itemRId *= 1;
    price *= 1;

    if (price < 0) {
      throw "invalid price";
    }

    const isInTrial = +blockchain.callWithAuth(this._getAccount(), "isInTrial", [])[0];
    if (isInTrial) {
      throw "in trial";
    }

    // Check that the user has the item.
    const user = this._getUser(tx.publisher);

    if (!user[itemRId]) {
      return;
    }

    // Check that it's not on sale yet.
    if (user[itemRId].page) {
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
    user[itemRId].page = currentPage + 1;
    this._setUser(tx.publisher, user);

    // Set offers.
    const offers = this._getOffers(currentPage);
    offers.push({
      seller: tx.publisher,
      rId: itemRId,
      itemId: user[itemRId].itemId,
      price: price
    });
    this._setOffers(currentPage, offers);
  }

  sellInBatch(itemRIdArrayStr, price) {
    const itemRIdArray = JSON.parse(itemRIdArrayStr);
    price *= 1;

    const list = itemRIdArray.slice(0, 10).map(rId => rId * 1);

    list.forEach(rId => {
      this.sell(rId, price);
    });

    return list;
  }

  buyInBatch(itemId, price, amount) {
    itemId *= 1;
    price *= 1;
    amount *= 1;

    const user = this._getUser(tx.publisher);

    var count = 0;
    for (let eRId in user) {
      ++count;
    }

    if (count >= 1000) {
      throw "too many items";
    }

    // const item = this._getItem(itemId);
    // if (item.isMountable) {
    //  throw "not mountable";
    // }

    var totalSpending = 0;
    var totalFee = 0;
    var boughtAmount = 0;
    const res = [];
    const sellerToChange = {};
    const sellerRevenueMap = {};

    const pages = this._getPages();

    let currentPage = 0;
    while (currentPage < pages.length) {
      const offers = this._getOffers(currentPage);

      for (let i = offers.length - 1; i >= 0; --i) {
        if (offers[i].itemId != itemId) continue;
        if (offers[i].price > price) continue;

        const rId = offers[i].rId;
        const seller = offers[i].seller;

        // Don't buy from yourself.
        if (seller == tx.publisher) continue;

        const fee = +(offers[i].price * 0.05).toFixed(3);
        const sellerAmount = +(offers[i].price - fee).toFixed(3);
        blockchain.transfer(tx.publisher, seller, sellerAmount.toString(), "buy");

        totalSpending += price;
        totalFee += fee;

        // Record revenue
        sellerRevenueMap[seller] = sellerRevenueMap[seller] ? sellerRevenueMap[seller] + sellerAmount : sellerAmount;

        // Create record in user.
        user[rId] = {
          itemId: itemId,
          page: 0
        }

        // Remove offer from offers.
        offers.splice(i, 1);
        // Decrease amount in pages.
        --pages[currentPage];

        // Remove from seller user.
        const sellerUser = sellerToChange[seller] || this._getUser(seller);

        if (sellerUser) {
          delete sellerUser[rId];
          sellerToChange[seller] = sellerUser;

          // Unmount from seller.
          // blockchain.callWithAuth(
          //    this._getUnitManager(),
          //    "unmountHisItem",
          //    [seller, rId.toString()]);

          // Notification
          blockchain.callWithAuth(
              this._getNotificationManager(),
              "add",
              [seller,
               "1",
               itemId.toString(),
               sellerAmount.toString()]);
        }

        // Clear CD
        // const itemR = this._getItemR(rId);
        // itemR.time = 0;
        // itemR.lastUnitId = 0;
        // this._setItemR(rId, itemR);

        ++boughtAmount;
        res.push(rId);

        if (boughtAmount >= amount) break;
      }

      // Set offers after the possible change.
      this._setOffers(currentPage, offers);

      if (boughtAmount >= amount) break;

      ++currentPage;
    }

    for (let seller in sellerToChange) {
      this._setUser(seller, sellerToChange[seller]);
    }

    blockchain.callWithAuth(this._getRankManager(), "addValueInBatch",
        [JSON.stringify(sellerRevenueMap), "revenue"]);

    // Set user.
    this._setUser(tx.publisher, user);
    // Set pages.
    this._setPages(pages);

    // Record spending.
    if (totalSpending > 0) {
      blockchain.callWithAuth(this._getRankManager(), "addValue",
          [tx.publisher, "spending", totalSpending.toString()]);
    }

    if (totalFee > 0) {
      blockchain.transfer(tx.publisher,
                          this._getTreasureManager(),
                          totalFee.toString(),
                          "buy:fee");
      blockchain.callWithAuth(this._getTreasureManager(),
                              "payFee",
                              [totalFee.toString()]);
    }

    return res;
  }

  cancel(itemRId) {
    itemRId *= 1;

    // Check that the user has the unit.
    const user = this._getUser(tx.publisher);
    if (!user[itemRId]) {
      return;
    }

    // Check that it's on sale.
    if (!user[itemRId].page) {
      return;
    }

    const currentPage = user[itemRId].page - 1;

    // Set user
    user[itemRId].page = 0;
    this._setUser(tx.publisher, user);

    // Decrease amount in pages.
    const pages = this._getPages();
    if (pages[currentPage]) {
      --pages[currentPage];
    }
    this._setPages(pages);

    // Remove offer from offers.
    const offers = this._getOffers(currentPage);

    for (let i = 0; i < offers.length; ++i) {
      if (offers[i].rId == itemRId) {
        offers.splice(i, 1);
        break;
      }
    }

    this._setOffers(currentPage, offers);
  }

  debugCancel(itemRId) {
    itemRId *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    // Decrease amount in pages.
    const pages = this._getPages();
    pages.forEach((p, index) => {
      // Remove offer from offers.
      const offers = this._getOffers(index);
    
      for (let i = 0; i < offers.length; ++i) {
        if (offers[i].rId == itemRId) {
          offers.splice(i, 1);
          --pages[index];
          break;
        }
      }

      this._setOffers(index, offers);
    });

    this._setPages(pages);
  }

  buy(currentPage, rId) {
    currentPage *= 1;
    rId *= 1;

    // Check the offer is there.
    const offers = this._getOffers(currentPage);

    const all = offers.filter((offer) => {
      return offer.rId == rId;
    });

    if (all.length <= 0) return 0;

    const offer = all[0];
    const seller = offer.seller;
    const price = offer.price;
    const itemId = offer.itemId;

    const user = this._getUser(tx.publisher);

    var count = 0;
    for (let eRId in user) {
      ++count;
    }

    if (count >= 1000) {
      throw "too many items";
    }

    // Charges IOST.
    const fee = +(price * 0.05).toFixed(3);
    const sellerAmount = +(price - fee).toFixed(3);

    if (fee > 0) {
      blockchain.transfer(tx.publisher,
                          this._getTreasureManager(),
                          fee.toString(),
                          "buy:fee");
      blockchain.callWithAuth(this._getTreasureManager(),
                              "payFee",
                              [fee.toString()]);
    }

    if (sellerAmount > 0) {
      blockchain.transfer(tx.publisher, seller, sellerAmount.toString(), "buy");
      // Record spending.
      blockchain.callWithAuth(this._getRankManager(), "addValue",
          [tx.publisher, "spending", price.toString()]);
      // Record revenue
      blockchain.callWithAuth(this._getRankManager(), "addValue",
          [seller, "revenue", sellerAmount.toString()]);
    }

    user[rId] = {
      itemId: itemId,
      page: 0
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
      delete sellerUser[rId];
      this._setUser(seller, sellerUser);

      // Unmount from seller.
      blockchain.callWithAuth(
          this._getUnitManager(),
          "unmountHisItem",
          [seller, rId.toString()]);

      // Notification
      blockchain.callWithAuth(
          this._getNotificationManager(),
          "add",
          [seller,
           "1",
           itemId.toString(),
           sellerAmount.toString()]);
    }

    // Clear CD
    const itemR = this._getItemR(rId);
    itemR.time = 0;
    itemR.lastUnitId = 0;
    this._setItemR(rId, itemR);

    return 1;
  }

  _random(nonce) {
    // Cheap random number generator.

    const hash = tx.hash;

    var result = nonce;

    for (let i = 0; i < hash.length; ++i) {
      result = (result * 61583 + hash.charCodeAt(i) + 101533) % 61153;
    }

    return result % 60089;
  }

  issue(itemId) {
    itemId *= 1;

    if (!blockchain.requireAuth(this._getBattle(), "active")) {
      throw "only battle can issue";
    }

    const user = this._getUser(tx.publisher);

    var count = 0;
    for (let eRId in user) {
      ++count;
    }

    if (count >= 1000) return "0";

    const rId = this._generateRId();
    user[rId] = {
      itemId: itemId,
      page: 0
    }

    this._setUser(tx.publisher, user);

    // Set itemR
    // NOTE: only itemR after 8/25 has rId
    const itemR = {
      rId: rId,
      itemId: itemId,
      level: 1,
      score: this._random(rId) % 100,
      mountedByUnitId: 0
    };

    this._setItemR(rId, itemR);
    return itemR;
  }

  issueMultiple(itemIdArrayStr) {
    const itemIdArray = JSON.parse(itemIdArrayStr);

    if (!blockchain.requireAuth(this._getBattle(), "active")) {
      throw "only battle can issue";
    }

    const user = this._getUser(tx.publisher);

    var count = 0;
    for (let eRId in user) {
      ++count;
    }

    if (count >= 1000) return "0";

    const res = [];

    itemIdArray.forEach(itemId => {
      itemId *= 1;

      const rId = this._generateRId();
      user[rId] = {
        itemId: itemId,
        page: 0
      }

      // Set itemR
      // NOTE: only itemR after 8/25 has rId
      const itemR = {
        rId: rId,
        itemId: itemId,
        level: 1,
        score: this._random(rId) % 100,
        mountedByUnitId: 0
      };

      this._setItemR(rId, itemR);
      res.push(itemR);
    });

    this._setUser(tx.publisher, user);

    return res;
  }

  debugMake(who, itemId, level, score) {
    itemId *= 1;
    level *= 1;
    score *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const user = this._getUser(who);

    const rId = this._generateRId();
    user[rId] = {
      itemId: itemId,
      page: 0
    }
    this._setUser(who, user);

    const itemR = {
      rId: rId,
      itemId: itemId,
      level: level,
      score: score,
      mountedByUnitId: 0
    };

    this._setItemR(rId, itemR);
  }

  issueMultipleTo(whoArrayStr, itemId, amount) {
    const whoArray = JSON.parse(whoArrayStr);
    itemId *= 1;
    amount *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    whoArray.forEach(who => {
      const user = this._getUser(who);

      for (let i = 0; i < amount; ++i) {
        const rId = this._generateRId();
        user[rId] = {
          itemId: itemId,
          page: 0
        }

        this._setUser(who, user);

        // Set itemR
        // NOTE: only itemR after 8/25 has rId
        const itemR = {
          rId: rId,
          itemId: itemId,
          level: 1,
          score: this._random(rId) % 100,
          mountedByUnitId: 0
        };

        this._setItemR(rId, itemR);
      }
    });
  }

  takeMultipleFrom(whoArrayStr, itemId, amount) {
    const whoArray = JSON.parse(whoArrayStr);
    itemId *= 1;
    amount *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    whoArray.forEach(who => {
      const user = this._getUser(who);

      let count = 0;
      for (let rId in user) {
        if (user[rId].itemId == itemId && user[rId].page == 0) {
          // Destroy from user.
          delete user[rId];

          // Destroy from itemR.
          this._removeItemR(rId);

          ++count;
          if (count >= amount) {
            break;
          }
        }
      }

      this._setUser(who, user);
    });
  }

  useItem(itemId, amount) {
    itemId *= 1;
    amount *= 1;

    if (!blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only unitManager and landManager can change";
    }

    const item = this._getItem(itemId);
    if (item.isMountable) {
      throw "mountable items are not useable";
    }

    const user = this._getUser(tx.publisher);

    var count = 0;
    for (let rId in user) {
      if (user[rId].itemId == itemId) {
        ++count;
        if (count >= amount) {
          break;
        }
      }
    }

    if (count < amount) {
      throw "not enough item amount";
    }

    count = 0;
    const res = [];

    for (let rId in user) {
      if (user[rId].itemId == itemId) {
        // Cancel from offers.
        this.cancel(rId);

        // Destroy from user.
        delete user[rId];

        // Destroy from itemR.
        this._removeItemR(rId);

        res.push(rId * 1);

        ++count;
        if (count >= amount) {
          break;
        }
      }
    }

    this._setUser(tx.publisher, user);
    return res;
  }

  recycleItem(itemRId) {
    itemRId *= 1;

    const isInTrial = +blockchain.callWithAuth(this._getAccount(), "isInTrial", [])[0];
    if (isInTrial) {
      throw "in trial";
    }

    // Unmount from unit.
    blockchain.callWithAuth(this._getUnitManager(), "unmountItem", [itemRId.toString()]);

    // Cancel from offers.
    this.cancel(itemRId);

    // Destroy from user.
    const user = this._getUser(tx.publisher);
    const itemId = user[itemRId].itemId;
    delete user[itemRId];
    this._setUser(tx.publisher, user);

    // Get level and destroy from itemR.
    const itemR = this._getItemR(itemRId);

    if (itemR) {
      const level = itemR.level;
      this._removeItemR(itemRId);

      // Get amount.
      if (!itemId) return 0;

      const item = this._getItem(itemId);
      const amount = item.worth * level;

      // Mint SGT.
      if (amount) {
        blockchain.callWithAuth(this._getTreasureManager(), "issue", [amount.toString()]);
      }

      return amount || 0;
    }

    return 0;
  }

  recycleInBatch(itemRIdArrayStr) {
    const itemRIdArray = JSON.parse(itemRIdArrayStr);

    const isInTrial = +blockchain.callWithAuth(this._getAccount(), "isInTrial", [])[0];
    if (isInTrial) {
      throw "in trial";
    }

    let amount = 0;
    const user = this._getUser(tx.publisher);

    for (let i = 0; i < itemRIdArray.length; ++i) {
      const itemRId = itemRIdArray[i];

      // Unmount from unit.
      blockchain.callWithAuth(this._getUnitManager(), "unmountItem", [itemRId.toString()]);

      // Cancel from offers.
      this.cancel(itemRId);

      // Destroy from user.
      const itemId = user[itemRId].itemId;
      delete user[itemRId];

      // Get level and destroy from itemR.
      const itemR = this._getItemR(itemRId);
      const level = itemR.level;
      this._removeItemR(itemRId);

      if (!itemId) continue;

      const item = this._getItem(itemId);
      amount += item.worth * level;
    }

    this._setUser(tx.publisher, user);

    // Mint SGT.
    blockchain.callWithAuth(this._getTreasureManager(), "issue", [amount.toString()]);

    return amount;
  }

  _value(value, level, score) {
    value = value || 0;
    return +(value * (1 + (level * 2 + 1) / 6) * (1 + score / 100)).toFixed(0) || 0;
  }

  _worth(item, itemR) {
    return +(item.worth * itemR.level).toFixed(0) || 0;
  }

  _cooldown(level) {
    if (level <= 1) return 0;
    if (level == 2) return 2;
    if (level == 3) return 4;
    if (level == 4) return 10;
    return 24;
  }

  clearCooldown(rId) {
    rId *= 1;
    const itemR = this._getItemR(rId);
    const item = this._getItem(itemR.itemId);

    const cost = +(this._worth(item, itemR) / 2).toFixed(0);

    blockchain.callWithAuth(this._getTreasureManager(),
                            "destroy",
                            [cost.toString()]);

    itemR.time = 0;
    itemR.lastUnitId = 0;
    this._setItemR(rId, itemR);
  }

  mount(unitId, rId) {
    if (!blockchain.requireAuth(this._getUnitManager(), "active")) {
      throw "only unitManager can change";
    }

    const itemR = this._getItemR(rId);

    const now = Math.floor(tx.time / 1e9);
    if (itemR.lastUnitId && itemR.lastUnitId != unitId &&
        itemR.time && now < itemR.time + this._cooldown(itemR.level) * 3600) {
      throw "need cooldown";
    }

    itemR.time = now;
    itemR.lastUnitId = unitId;
    itemR.mountedByUnitId = unitId;
    this._setItemR(rId, itemR);
  }

  unmount(rId) {
    if (!blockchain.requireAuth(this._getUnitManager(), "active")) {
      throw "only unitManager can change";
    }

    const itemR = this._getItemR(rId);
    if (itemR) {
      itemR.lastUnitId = itemR.mountedByUnitId;
      itemR.mountedByUnitId = 0;
      this._setItemR(rId, itemR);
    }
  }

  unmountInBatch(rIdArrayStr) {
    if (!blockchain.requireAuth(this._getUnitManager(), "active")) {
      throw "only unitManager can change";
    }

    const rIdArray = JSON.parse(rIdArrayStr);

    rIdArray.forEach(rId => {
      if (!rId) return;

      const itemR = this._getItemR(rId);
      itemR.mountedByUnitId = 0;
      this._setItemR(rId, itemR);
    });
  }

  getMyItems() { 
    const user = this._getUser(tx.publisher);

    const result = [];
    for (let rId in user) {
      let itemId = user[rId].itemId;
      let itemR = this._getItemR(rId);
      let item = this._getItem(itemId);

      result.push({
        rId: rId,
        itemId: itemId,
        level: itemR.level,
        score: itemR.score,
        hp: this._value(item.hp, itemR.level, itemR.score),
        attack: this._value(item.attack, itemR.level, itemR.score),
        intelligence: this._value(item.intelligence, itemR.level, itemR.score),
        defense: this._value(item.defense, itemR.level, itemR.score),
        agility: this._value(item.agility, itemR.level, itemR.score),
        luck: this._value(item.luck, itemR.level, itemR.score),
        hpS: this._value(item.hpS, itemR.level, itemR.score),
        attackS: this._value(item.attackS, itemR.level, itemR.score),
        intelligenceS: this._value(item.intelligenceS, itemR.level, itemR.score),
        defenseS: this._value(item.defenseS, itemR.level, itemR.score),
        agilityS: this._value(item.agilityS, itemR.level, itemR.score),
        luckS: this._value(item.luckS, itemR.level, itemR.score),
        worth: this._worth(item, itemR),
        mountedByUnitId: itemR.mountedByUnitId,
        forSale: user[rId].page && user[rId].page > 0
      });
    }

    return result;
  }

  getMyItemsByItemRArray(itemRArrayStr) {
    const itemRArray = JSON.parse(itemRArrayStr);

    const result = [];
    itemRArray.forEach(itemR => {
      let item = this._getItem(itemR.itemId);

      result.push({
        rId: itemR.rId,
        itemId: itemR.itemId,
        level: itemR.level,
        score: itemR.score,
        worth: this._worth(item, itemR)
      });
    });

    return result;
  }

  upgrade(rIdA, rIdB) {
    rIdA *= 1;
    rIdB *= 1;

    if (rIdA == rIdB) {
      throw "not-another-item";
    }

    const user = this._getUser(tx.publisher);

    if (!user[rIdA] || !user[rIdB]) {
      throw "not your rid";
    }

    const itemRA = this._getItemR(rIdA);
    const itemRB = this._getItemR(rIdB);

    if (!itemRA.itemId || !itemRB.itemId) {
      throw "not-found";
    }

    if (itemRA.level != itemRB.level) {
      throw "not-same-level";
    }

    if (itemRA.itemId != itemRB.itemId) {
      throw "not-same-item";
    }

    if (itemRB.mountedByUnitId > 0) {
      throw "can-not-merge-mounted-item";
    }

    if (itemRA.level >= 15) {
      throw "level-limit";
    }

    let item = this._getItem(itemRA.itemId);
    const cost = this._worth(item, itemRA);
    blockchain.callWithAuth(this._getTreasureManager(),
                            "destroy",
                            [cost.toString()]);

    itemRA.level = itemRA.level + 1;
    itemRA.score = Math.max(itemRA.score, itemRB.score);
    this._setItemR(rIdA, itemRA);

    // Now delete item B

    // Remove order from market.
    if (user[rIdB].page > 0) {
      this.cancel(rIdB);
    }

    // Delete it now.
    storage.mapDel("itemR", rIdB.toString());
    delete user[rIdB];

    this._setUser(tx.publisher, user);
  }

  synthesize(rIdArrayStr, createdItemId) {
    const rIdArray = JSON.parse(rIdArrayStr);
    createdItemId *= 1;

    const user = this._getUser(tx.publisher);

    const countMap = {};

    rIdArray.forEach(rId => {
      if (!user[rId]) {
        throw "not your rid";
      }

      const itemId = user[rId].itemId;
      countMap[itemId] = countMap[itemId] ? countMap[itemId] + 1 : 1;
    });

    const itemToCreate = this._getItem(createdItemId);

    if (!itemToCreate.components || itemToCreate.components.length == 0) {
      throw "not synthesizable";
    }

    itemToCreate.components.forEach(c => {
      if (countMap[c.itemId] < c.count) {
        throw "not enough items";
      }
    });

    rIdArray.forEach(rId => {
      // Remove order from market.

      if (user[rId].page > 0) {
        this.cancel(rId);
      }

      // Delete it now.
      storage.mapDel("itemR", rId.toString());
      delete user[rId];
    });

    const createdRId = this._generateRId();

    this._setItemR(createdRId, {
      itemId: createdItemId,
      level: 1,
      score: this._random(createdRId) % 100,
      mountedByUnitId: 0
    });

    user[createdRId] = {
      itemId: createdItemId,
      page: 0
    };

    // Save changes on user.
    this._setUser(tx.publisher, user);

    return createdRId;
  }

  debugSynthesize(who, rIdArrayStr, createdItemId) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const rIdArray = JSON.parse(rIdArrayStr);
    createdItemId *= 1;

    const user = this._getUser(who);

    const countMap = {};

    rIdArray.forEach(rId => {
      if (!user[rId]) {
        throw "not your rid";
      }

      const itemId = user[rId].itemId;
      countMap[itemId] = countMap[itemId] ? countMap[itemId] + 1 : 1;
    });

    const itemToCreate = this._getItem(createdItemId);

    if (!itemToCreate.components || itemToCreate.components.length == 0) {
      throw "not synthesizable";
    }

    itemToCreate.components.forEach(c => {
      if (countMap[c.itemId] < c.count) {
        throw "not enough items";
      }
    });

    rIdArray.forEach(rId => {
      // Remove order from market.

      if (user[rId].page > 0) {
        this.cancel(rId);
      }

      // Delete it now.
      storage.mapDel("itemR", rId.toString());
      delete user[rId];
    });

    const createdRId = this._generateRId();

    this._setItemR(createdRId, {
      itemId: createdItemId,
      level: 1,
      score: this._random(createdRId) % 100,
      mountedByUnitId: 0
    });

    user[createdRId] = {
      itemId: createdItemId,
      page: 0
    };

    // Save changes on user.
    this._setUser(who, user);

    return createdRId;
  }

  debugResetPages() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    // Set offers.
    const offers = this._getOffers(0);

    // Set pages.
    this._setPages([offers.length]);
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const user = this._getUser(from);
    this._setUser(to, user);
    storage.mapDel("user", from);

    const pages = this._getPages();
    pages.forEach((p, i) => {
      const offers = this._getOffers(i);

      offers.forEach(offer => {
        if (offer.seller == from) {
          offer.seller = to;
        }
      });

      this._setOffers(i, offers);
    });
  }
}


module.exports = ItemManager;
