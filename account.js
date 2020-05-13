/*

#channel
[user]

#game
[user] -> 0/1

#trial
[user] -> time

*/

class Account {

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

  setRankManager(rankManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }
    
    storage.put("rankManager", rankManager);
  }

  _getRankManager() {
    return storage.get("rankManager");
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

  startGame(channel, referrer) {
    if (this.hasStarted(tx.publisher)) {
      throw "already started";
    }

    storage.mapPut("channel", tx.publisher, channel.toLowerCase());
    storage.mapPut("game", tx.publisher, "1");

    blockchain.callWithAuth(this._getRankManager(), "addUser", [tx.publisher]);
    blockchain.callWithAuth(this._getRankManager(), "setValue", [tx.publisher, "score", "1000"]);

    if (referrer != "" && this.hasStarted(referrer)) {
      blockchain.callWithAuth(this._getTreasureManager(), "markReferral", [referrer, tx.publisher]);
    }
  }

  isInTrial() {
    const exp = +storage.mapGet("trial", tx.publisher) || 0;
    const now = Math.floor(tx.time / 1e9);
    return exp > 0 && now < exp ? 1 : 0;
  }

  didTrial() {
    const exp = +storage.mapGet("trial", tx.publisher) || 0;
    return exp > 0 ? 1 : 0;
  }

  debugRemoveTrial(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can remove trial";
    }

    storage.mapPut("trial", who, "0");
  }

  debugMaybeDeleteTrialUnits(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can delete trial units";
    }

    const exp = +storage.mapGet("trial", who) || 0;
    const now = Math.floor(tx.time / 1e9);
    const isInTrial = exp > 0 && now < exp ? 1 : 0;

    if (!isInTrial) {
      blockchain.call(this._getUnitManager(), "deleteTrial", [who]);
    }
  }

  debugJustDeleteTrialUnits(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can delete trial units";
    }

    blockchain.call(this._getUnitManager(), "deleteTrial", [who]);
    this.markTrial(who);
  }

  markTrial(who) {
    // Mark trial as expired.
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active") &&
        !blockchain.requireAuth(this._getUnitManager(), "active")) {
      throw "only owner, or unitManager can mark trial";
    }

    if (this.didTrial()) return;

    const now = Math.floor(tx.time / 1e9);
    storage.mapPut("trial", who, now.toString());
  }

  startTrial(option) {
    option *= 1;

    if (this.didTrial()) {
      throw "already did trial";
    } 

    const channel = storage.mapGet("channel", tx.publisher);

    // First of all, pay 100 IOST.
    const cost = 100;
    blockchain.transfer(tx.publisher, this._getTreasureManager(), cost.toString(), "trial");
    blockchain.callWithAuth(this._getTreasureManager(),
                            "pay",
                            [cost.toString()]);
    // Record spending.
    blockchain.callWithAuth(this._getRankManager(), "addValue",
        [tx.publisher, "spending", cost.toString()]);

    // 72 hours.
    const exp = Math.floor(tx.time / 1e9) + 72 * 3600;
    storage.mapPut("trial", tx.publisher, exp.toString());

    var unitIdArray;
    if (option == 0) {
      unitIdArray = [19, 1, 2];
    } else if (option == 1) {
      unitIdArray = [3, 4, 28];
    } else {
      unitIdArray = [5, 31, 40];
    }

    blockchain.callWithAuth(this._getUnitManager(),
                            "addTrial",
                            [tx.publisher,
                             JSON.stringify(unitIdArray),
                             exp.toString()] );
    return unitIdArray;
  }

  getChannel() {
    return storage.mapGet("channel", tx.publisher) || 'sg';
  }

  getChannelBy(who) {
    return storage.mapGet("channel", who) || 'sg';
  }

  debugChangeChannel(who, channel) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.mapPut("channel", who, channel.toLowerCase());
  }

  setScore(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    blockchain.callWithAuth(this._getRankManager(), "setValue", [who, "score", "1000"]);
    blockchain.callWithAuth(this._getRankManager(), "setValue", [who, "balance", "0"]);
    blockchain.callWithAuth(this._getRankManager(), "setValue", [who, "revenue", "0"]);
    blockchain.callWithAuth(this._getRankManager(), "setValue", [who, "spending", "0"]);
  }

  hasStarted(me) {
    return storage.mapGet("game", me) || 0;
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const channel = storage.mapGet("channel", from)
    storage.mapPut("channel", to, channel);
    storage.mapDel("channel", from);

    const game = storage.mapGet("game", from);
    storage.mapPut("game", to, game);
    storage.mapDel("game", from);
  }
}

module.exports = Account;
