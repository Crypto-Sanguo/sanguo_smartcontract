/*

#epic: {
  bossUnitId: bossUnitId
  otherUnitIdArray: otherUnitIdArray,
  bossLevel: bossLevel,
  otherLevel: otherLevel,
  bossHpFactor: bossHpFactor
}

#award
  [who, token, [itemId, amount], [itemI, amount], unitId]
}

#bossStatus: {
  unitId: unitId,
  level: level,
  hp: hp,
  hpX: hp * 200
  attack: this._attack(unit, level),
  intelligence: this._intelligence(unit, level),
  defense: this._defense(unit, level),
  agility: agility,
  luck: this._luck(unit, level),
  hpR: hp * 200,
  agilityR: agility,
  stunned: 0,
  fire: 0,
  round: 0,
  roundA: 0,
  used: 0,
  killer: 'who'
}

#history: [
  [time, who, damage, [unitId, hp, unitId, hp, unitId, hp]]
]

#records
index => []

#queue
[
  [who, times]
]

#information

*/

class EpicManager {

  init() {
  }

  debugFixQueue() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const epic = this._getEpic();

    const bossStatus = JSON.parse(blockchain.call(
        this._getUnitManager(), "getEpicStatus", [
            epic.bossUnitId.toString(), epic.bossLevel.toString()])[0]);
    bossStatus.hpR = bossStatus.hp * epic.bossHpFactor;
    bossStatus.hpX = bossStatus.hp * epic.bossHpFactor;
    bossStatus.killer = "";

    this._setBossStatus(bossStatus);
    storage.put("history", "[]");

    this.setAward("0");
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

  setUnitManager(unitManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("unitManager", unitManager);
  }

  _getUnitManager() {
    return storage.get("unitManager");
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

  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
  }

  setEpic(epicStr) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("epic", epicStr);
  }

  _getEpic() {
    return JSON.parse(storage.get("epic") || "{}");
  }

  setAward(awardStr) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("award", awardStr);
  }

  _getAward() {
    return JSON.parse(storage.get("award") || "{}");
  }

  setInformation(information) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("information", information);
  }

  _setBossStatus(bossStatus) {
    storage.put("bossStatus", JSON.stringify(bossStatus));
  }

  _getBossStatus() {
    const json = storage.get("bossStatus");
    if (!json) {
      throw "no boss";
    }
    return JSON.parse(json);
  }

  _setQueue(queue) {
    storage.put("queue", JSON.stringify(queue));
  }

  _getQueue() {
    return JSON.parse(storage.get("queue") || "[]");
  }

  startNewBoss() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const epic = this._getEpic();

    const bossStatus = JSON.parse(blockchain.call(
        this._getUnitManager(), "getEpicStatus", [
            epic.bossUnitId.toString(), epic.bossLevel.toString()])[0]);
    bossStatus.hpR = bossStatus.hp * epic.bossHpFactor;
    bossStatus.hpX = bossStatus.hp * epic.bossHpFactor;
    bossStatus.killer = "";

    this._setBossStatus(bossStatus);

    this._setQueue([]);
    storage.put("history", "[]");

    this.setAward("0");
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

  getAllEpicStatus() {
    const bossStatus = this._getBossStatus();

    const epic = this._getEpic();

    const index0 = this._random(Math.floor(bossStatus.hpR)) % epic.otherUnitIdArray.length;
    const index1 = this._random(Math.floor(bossStatus.hpR + 1)) % epic.otherUnitIdArray.length;

    const unitId0 = epic.otherUnitIdArray[index0];
    const unitId1 = epic.otherUnitIdArray[index1];

    const unit0Status = JSON.parse(blockchain.call(
        this._getUnitManager(), "getEpicStatus", [
            unitId0.toString(), epic.otherLevel.toString()])[0]);
    const unit1Status = JSON.parse(blockchain.call(
        this._getUnitManager(), "getEpicStatus", [
            unitId1.toString(), epic.otherLevel.toString()])[0]);

    return [
      unit0Status,
      bossStatus,
      unit1Status
    ];
  }

  saveBattle(who, damage, recordsStr, didIWin, cheatArrayStr) {
    if (!blockchain.requireAuth(this._getBattle(), "active")) {
      throw "only battle can save battle";
    }

    damage *= 1;
    didIWin *= 1;

    const history = JSON.parse(storage.get("history") || "[]");

    const now = Math.floor(tx.time / 1e9);

    history.push([now, who, damage, cheatArrayStr]);

    storage.put("history", JSON.stringify(history));
    storage.mapPut("records", (history.length - 1).toString(), recordsStr);

    const bossStatus = this._getBossStatus();

    if (didIWin) {
      bossStatus.hpR = 0;
      bossStatus.killer = who;
    } else {
      bossStatus.hpR = +(bossStatus.hpR - damage).toFixed(0);
    }

    this._setBossStatus(bossStatus);
  }

  queueForBattle(times) {
    const bossStatus = this._getBossStatus();

    if (bossStatus.hpR <= 0) {
      throw "boss is dead";
    }

    times *= 1;

    const cost = +(30 * times).toFixed(0);
    blockchain.callWithAuth(this._getTreasureManager(),
                            "destroy",
                            [cost.toString()]);

    const queue = this._getQueue();

    var found = 0;

    for (let i = 0; i < queue.length; ++i) {
      const pair = queue[i];

      if (pair[0] == tx.publisher) {
        pair[1] = pair[1] * 1 + times;
        found = 1;
        break;
      }
    }

    if (!found) {
      queue.push([tx.publisher, times]);
    }

    this._setQueue(queue);
  }

  debugQuickFix() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can execute";
    }

    const history = JSON.parse(storage.get("history") || "[]");

    const bossStatus = this._getBossStatus();
    var temp = bossStatus.hpX;

    history.forEach(entry => {
      temp -= entry[2];
      const obj = JSON.parse(entry[3]);
      obj[3] = temp;
      entry[3] = JSON.stringify(obj);
    });
    storage.put("history", JSON.stringify(history));
  }

  execute() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can execute";
    }

    const bossStatus = this._getBossStatus();

    if (bossStatus.hpR <= 0) {
      return;
    }

    const queue = this._getQueue();
    if (queue.length <= 0) return;

    const front = queue.shift();
    --front[1];

    if (front[1] > 0) {
      queue.push(front);
    }

    this._setQueue(queue);

    const who = front[0];
    blockchain.callWithAuth(this._getBattle(), "battleWithEpic", [who]);
  }
}


module.exports = EpicManager;
