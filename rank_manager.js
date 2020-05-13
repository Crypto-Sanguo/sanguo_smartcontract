/*

# all_values of top 1000
type => [
  [user, score], balance], revenue], spending], power ]
]

# user_pages
[500, 500]

# user_values
page => []

# value
user => {
  score:
  win:
  balance:
  revenue:
  spending:
}

*/

const PAGE_SIZE = 500;


class RankManager {

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

  setLandManager(landManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("landManager", landManager);
  }

  _getLandManager() {
    return storage.get("landManager");
  }

  _getItemManager() {
    return storage.get("itemManager");
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

  _findIndex(who, allValues) {
    for (let i = 0; i < allValues.length; ++i) {
      if (who == allValues[i][0]) {
        return i;
      }
    }
    return -1;
  }

  addValue(who, type, value) {
    value *= 1;

    if (!blockchain.requireAuth(this._getAccount(), "active") &&
        !blockchain.requireAuth(this._getBattle(), "active") &&
        !blockchain.requireAuth(this._getTreasureManager(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active") &&
        !blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getItemManager(), "active")) {
      throw "only account, battle, treasure, land, unit, or item manager can change";
    }

    if ((['score', 'balance', 'revenue', 'spending']).indexOf(type) < 0) {
      throw "type not supported";
    }

    var old = JSON.parse(storage.mapGet("value", who) || "{}");
    old[type] = old[type] ? old[type] * 1 + value : value;
    storage.mapPut("value", who, JSON.stringify(old));
  }

  addValueInBatch(mapStr, type) {
    const map = JSON.parse(mapStr);

    if (!blockchain.requireAuth(this._getAccount(), "active") &&
        !blockchain.requireAuth(this._getBattle(), "active") &&
        !blockchain.requireAuth(this._getTreasureManager(), "active") &&
        !blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getItemManager(), "active")) {
      throw "only account, battle, treasure, unit, or item manager can change";
    }

    if ((['score', 'balance', 'revenue', 'spending']).indexOf(type) < 0) {
      throw "type not supported";
    }

    for (let who in map) {
      const value = map[who];

      var old = JSON.parse(storage.mapGet("value", who) || "{}");
      old[type] = old[type] ? old[type] * 1 + value : value;
      storage.mapPut("value", who, JSON.stringify(old));
    }
  }

  setValue(who, type, value) {
    value *= 1;

    if (!blockchain.requireAuth(this._getAccount(), "active") &&
        !blockchain.requireAuth(this._getBattle(), "active") &&
        !blockchain.requireAuth(this._getTreasureManager(), "active") &&
        !blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getItemManager(), "active")) {
      throw "only account, battle, treasure, unit, or item manager can change";
    }

    if ((['score', 'balance', 'revenue', 'spending', 'power']).indexOf(type) < 0) {
      throw "type not supported";
    }

    var old = JSON.parse(storage.mapGet("value", who) || "{}");
    old[type] = value;
    storage.mapPut("value", who, JSON.stringify(old));
  }

  addUser(who) {
    if (!blockchain.requireAuth(this._getAccount(), "active") &&
        !blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only account or owner can change";
    }

    const pages = JSON.parse(storage.get("user_pages") || "[]");

    var currentPage;
    if (pages.length > 0 && pages[pages.length - 1] < PAGE_SIZE) {
      currentPage = pages.length - 1;
      ++pages[pages.length - 1];
    } else {
      currentPage = pages.length;
      pages.push(1);
    }

    storage.put("user_pages", JSON.stringify(pages));

    // Now write to current page;

    const values = JSON.parse(storage.mapGet("user_values", currentPage.toString()) || "[]");
    values.push(who);
    storage.mapPut("user_values", currentPage.toString(), JSON.stringify(values));
  }

  debugDeleteOldRanking() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.mapDel("all_values", "score");
    storage.mapDel("all_values", "balance");
    storage.mapDel("all_values", "revenue");
    storage.mapDel("all_values", "spending");
    storage.mapDel("all_values", "power");
  }

  debugDeleteUser(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.mapDel("value", who);
  }

  snatchScore(from, to) {
    if  (!blockchain.requireAuth(this._getBattle(), "active")) {
      throw "only battle can change";
    }

    const oldFrom = JSON.parse(storage.mapGet("value", from) || "0");
    const oldTo = JSON.parse(storage.mapGet("value", to) || "0");

    if (!oldFrom || !to) {
      throw 'non-existing-player';
    }

    if (!oldFrom.score) oldFrom.score = 0;
    if (!oldTo.score) oldTo.score = 0;

    const scoreFrom = oldFrom.score - 1;
    const scoreTo = oldTo.score + 1.2;

    oldFrom['score'] = scoreFrom;
    storage.mapPut("value", from, JSON.stringify(oldFrom));

    oldTo['score'] = scoreTo;
    oldTo['win'] = oldTo['win'] ? oldTo['win'] + 1 : 1;
    storage.mapPut("value", to, JSON.stringify(oldTo));
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const value = JSON.parse(storage.mapGet("value", from));
    storage.mapPut("value", to, JSON.stringify(value));
    storage.mapDel("value", from);
  }
}


module.exports = RankManager;
