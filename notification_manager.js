/*

# notification
user => [[
  time  // time
  type  // type, 0: UNIT_SOLD, 1: ITEM_SOLD, 2: LAND_SOLD
  value0  // related unitId or itemId
  value1  // SGT amount
]]

*/

const NOTIFICATION_LIMIT = 20;


class NotificationManager {

  init() {
  }
  
  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
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

  setLandManager(landManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("landManager", landManager);
  }

  _getLandManager() {
    return storage.get("landManager");
  }

  add(who, type, value0, value1) {
    if (!blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getItemManager(), "active") &&
        !blockchain.requireAuth(this._getLandManager(), "active")) {
      throw "only unitManager, itemManager, or landManager can change";
    }

    type *= 1;
    value0 *= 1;
    value1 *= 1;

    const data = JSON.parse(storage.mapGet("notification", who) || "[]");

    if (data.length >= NOTIFICATION_LIMIT) {
      data.shift();
    }

    const now = Math.floor(tx.time / 1e9);

    data.push([
      now,
      type,
      value0,
      value1
    ]);

    storage.mapPut("notification", who, JSON.stringify(data));
  }

  addInBatch(whoArrayStr, type, value0, value1ArrayStr) {
    if (!blockchain.requireAuth(this._getUnitManager(), "active") &&
        !blockchain.requireAuth(this._getItemManager(), "active")) {
      throw "only unitManager, or itemManager can change";
    }

    const whoArray = JSON.parse(whoArrayStr);
    const value1Array = JSON.parse(value1ArrayStr);

    if (whoArray.length != value1Array.length) {
      throw "invalid input";
    }

    type *= 1;
    value0 *= 1;

    const now = Math.floor(tx.time / 1e9);

    for (let i = 0; i < whoArray.length; ++i) {
      const who = whoArray[i];
      const value1 = value1Array[i] * 1;

      const data = JSON.parse(storage.mapGet("notification", who) || "[]");

      if (data.length >= NOTIFICATION_LIMIT) {
        data.shift();
      }

      data.push([
        now,
        type,
        value0,
        value1
      ]);

      storage.mapPut("notification", who, JSON.stringify(data));
    }
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const notification = storage.mapGet("notification", from)
    storage.mapPut("notification", to, notification);
    storage.mapDel("notification", from);
  }
}

module.exports = NotificationManager;
