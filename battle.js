const UNIT_LIMIT_ARRAY = [3, 6];
const ITEM_LIMIT = 3;
const HISTORY_LIMIT = 20;

/*

# time
user => {
attack: time
attackPaid: 0 / 1 / 2
attackCount: 0 / 1 / 2
defense: time
defenseCount: 0 / 1

defense: time
defenseCount: 0 / 1
}

# history
user => [[
who:,
isAttack:
didWin:
time:
snatch:
]]

# stage ----- delete?
user => {
didIWin:
records: [
[from,to,type,value]
],
drop: {
tokenAmount:
itemIdArray: []
}
}

*/


class Battle {

  init() {}

  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
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

  setAccount(account) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("account", account);
  }

  _getAccount() {
    return storage.get("account");
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

  setTreasureManager(treasureManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("treasureManager", treasureManager);
  }

  _getTreasureManager() {
    return storage.get("treasureManager");
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

  setLandManager(landManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("landManager", landManager);
  }

  _getLandManager() {
    return storage.get("landManager");
  }

  _getEpicManager() {
    return storage.get("epicManager");
  }

  _addHistory(owner, who, isAttack, didWin, time, snatch, note) {
    const all = JSON.parse(storage.mapGet("history", owner) || "[]");
    if (all.length > HISTORY_LIMIT) {
      all.shift();
    }
    all.push([who, isAttack, didWin, time, snatch, note]);
    storage.mapPut("history", owner, JSON.stringify(all));
  }

  getHistory() {
    return JSON.parse(storage.mapGet("history", tx.publisher) || "[]");
  }

  _setAttackTime(to) {
    const now = Math.floor(tx.time / 1e9);
    const toObj = JSON.parse(storage.mapGet("time", to) ||
      "{ \"defense\": 0, \"defenseCount\": 0 }");

    toObj.defenseCount = toObj.defenseCount || 0;

    if (this._ceilDate(now) != this._ceilDate(toObj.defense || 0)) {
      toObj.defense = now;
      toObj.defenseCount = 0;
    } else {
      toObj.defenseCount = 1;
    }

    storage.mapPut("time", to, JSON.stringify(toObj));
  }

  _ceilDate(time) {
    if (time < 46800) return 0;
    return Math.ceil((time - 46800) / 86400);
  }

  _canAttack(to, isPaid) {
    const now = Math.floor(tx.time / 1e9);

    const toObj = JSON.parse(storage.mapGet("time", to) ||
      "{ \"defense\": 0, \"defenseCount\": 0 }");

    if (this._ceilDate(now) > this._ceilDate(toObj.defense)) {
      return 1;
    }

    if (isPaid && toObj.defenseCount < 1) {
      return 1;
    }

    return 0;
  }

  battleWithStage(unitIdArrayStr,
    stageId,
    placeIndex,
    battleIndex) {
    stageId *= 1;
    placeIndex *= 1;
    battleIndex *= 1;
    this._sn = this._seed();

    const unitIdArray = JSON.parse(unitIdArrayStr || "[]");

    if (UNIT_LIMIT_ARRAY.indexOf(unitIdArray.length) < 0) {
      throw "invalid-input";
    }

    const canPlay = blockchain.call(
      this._getStageManager(),
      "canPlay",
      [tx.publisher,
        stageId.toString(),
        placeIndex.toString(),
        battleIndex.toString()
      ])[0] * 1;

    if (!canPlay) {
      throw "no-access";
    }

    const hasUnits = blockchain.call(
      this._getUnitManager(),
      "hasUnits",
      [tx.publisher, unitIdArrayStr])[0] * 1;

    if (!hasUnits) {
      throw "non-existing-unit";
    }

    const myStatusStr = blockchain.call(
      this._getUnitManager(),
      "getMyStatusAndConsumeEnergy",
      [unitIdArrayStr, "1"])[0];

    const enemyStatusStr = blockchain.call(
      this._getUnitManager(),
      "getNPCStatus",
      [stageId.toString(),
        placeIndex.toString(),
        battleIndex.toString()
      ])[0];

    const status = {
      myArray: JSON.parse(myStatusStr),
      enemyArray: JSON.parse(enemyStatusStr)
    };

    if (status.myArray.length != status.enemyArray.length) {
      throw "invalid-input";
    }

    const battleResult = this._innerBattle(status);

    if (battleResult.didIWin) {
      blockchain.call(
        this._getStageManager(),
        "finishBattle",
        [stageId.toString(),
          placeIndex.toString(),
          battleIndex.toString()
        ]);

      const sumOfLuck =
        (status.myArray[0].luck || 0) +
        (status.myArray[1].luck || 0) +
        (status.myArray[2].luck || 0);

      const dropStatusStr = blockchain.call(
        this._getStageManager(),
        "maybeDrop",
        [stageId.toString(),
          placeIndex.toString(),
          battleIndex.toString(),
          sumOfLuck.toString(),
          "1",
          (tx.time % 1000)
          .toString()
        ])[0];
      const dropStatus = JSON.parse(dropStatusStr);

      // Use land and pay tax.
      const landStatusStr = blockchain.call(
        this._getLandManager(),
        "getTaxRateAndCityInfo",
        [unitIdArrayStr])[0];
      const landStatus = JSON.parse(landStatusStr);

      var boostedAmount = 0;
      var taxMap = {};

      landStatus.forEach((entry, i) => {
        const rateCity = entry[0] || 0;
        const rateOwner = entry[1] || 0;
        const cityId = entry[2];
        const cityOwner = entry[3];

        if (rateCity < 0) return;

        const value = sumOfLuck ? dropStatus.tokenAmount * 0.4 * (status.myArray[i].luck || 0) / sumOfLuck : 0;
        boostedAmount += value * (100 - rateCity - rateOwner) / 100;

        if (cityId) {
          // Pay tax.
          const cityAmount = Math.floor(value * rateCity / 100);
          const ownerAmount = Math.floor(value * rateOwner / 100);

          if (taxMap[cityId]) {
            taxMap[cityId][2] += cityAmount;
            taxMap[cityId][3] += ownerAmount;
          } else {
            taxMap[cityId] = [cityId, cityOwner, cityAmount, ownerAmount];
          }
        }
      });

      for (let cityId in taxMap) {
        const taxData = taxMap[cityId];
        blockchain.call(this._getLandManager(), "payTax", [
          taxData[0].toString(), taxData[1],
          taxData[2].toString(), taxData[3].toString()
        ]);
      }

      dropStatus.tokenAmount = Math.floor(dropStatus.tokenAmount + boostedAmount);

      // Issue token and items.
      blockchain.callWithAuth(
        this._getTreasureManager(),
        "issue",
        [dropStatus.tokenAmount.toString()]);

      const iremRArray = []

      dropStatus.itemIdArray.forEach(itemId => {
        const itemRStr = blockchain.callWithAuth(
          this._getItemManager(),
          "issue",
          [itemId.toString()])[0];
        const itemR = JSON.parse(itemRStr);

        if (itemR) {
          iremRArray.push(itemR);
        }
      });

      const balance = +blockchain.call(this._getTreasureManager(), "balanceOfSGT", [tx.publisher])[0];
      const items = JSON.parse(blockchain.call(this._getItemManager(), "getMyItemsByItemRArray", [JSON.stringify(iremRArray)])[0] || '[]');

      return {
        didIWin: 1,
        records: battleResult.records,
        drop: dropStatus,
        balance: balance,
        items: items,
        energies: status.myArray.map(u => u.energy)
      };
    } else {
      return {
        didIWin: 0,
        records: battleResult.records,
        energies: status.myArray.map(u => u.energy)
      }
    }
  }

  battleWithStageBatch(unitIdArrayStr,
    stageId,
    placeIndex,
    battleIndex) {
    stageId *= 1;
    placeIndex *= 1;
    battleIndex *= 1;
    this._sn = this._seed();

    const unitIdArray = JSON.parse(unitIdArrayStr || "[]");

    if (UNIT_LIMIT_ARRAY.indexOf(unitIdArray.length) < 0) {
      throw "invalid-input";
    }

    const canPlay = blockchain.call(
      this._getStageManager(),
      "canPlay",
      [tx.publisher,
        stageId.toString(),
        placeIndex.toString(),
        battleIndex.toString()
      ])[0] * 1;

    if (!canPlay) {
      throw "no-access";
    }

    const hasUnits = blockchain.call(
      this._getUnitManager(),
      "hasUnits",
      [tx.publisher, unitIdArrayStr])[0] * 1;

    if (!hasUnits) {
      throw "non-existing-unit";
    }

    // Charges 3 IOST.
    const cost = 3;
    blockchain.transfer(tx.publisher, this._getTreasureManager(), cost.toString(), "b-b");
    blockchain.callWithAuth(this._getTreasureManager(),
      "pay",
      [cost.toString()]);
    // Record spending.
    blockchain.callWithAuth(this._getRankManager(), "addValue",
      [tx.publisher, "spending", cost.toString()]);

    const myStatusStr = blockchain.call(
      this._getUnitManager(),
      "getMyStatusAndConsumeEnergy",
      [unitIdArrayStr, "1"])[0];

    const enemyStatusStr = blockchain.call(
      this._getUnitManager(),
      "getNPCStatus",
      [stageId.toString(),
        placeIndex.toString(),
        battleIndex.toString()
      ])[0];

    const status = {
      myArray: JSON.parse(myStatusStr),
      enemyArray: JSON.parse(enemyStatusStr)
    };

    if (status.myArray.length != status.enemyArray.length) {
      throw "invalid-input";
    }

    const battleResult = this._innerBattle(status);

    if (battleResult.didIWin) {
      blockchain.call(
        this._getStageManager(),
        "finishBattle",
        [stageId.toString(),
          placeIndex.toString(),
          battleIndex.toString()
        ]);

      const consumeAllStatus = JSON.parse(blockchain.call(
        this._getUnitManager(),
        "consumeAllEnergy",
        [unitIdArrayStr])[0]);
      const more = consumeAllStatus.amount;
      if (more) {
        consumeAllStatus.energies.forEach((energy, i) => {
          status.myArray[i].energy = energy;
        });
      }

      const sumOfLuck =
        (status.myArray[0].luck || 0) +
        (status.myArray[1].luck || 0) +
        (status.myArray[2].luck || 0);

      const allStatusStr = blockchain.call(
        this._getStageManager(),
        "maybeDrop",
        [stageId.toString(),
          placeIndex.toString(),
          battleIndex.toString(),
          sumOfLuck.toString(),
          (more + 1)
          .toString(),
          (tx.time % 1000)
          .toString()
        ])[0];
      const allStatus = JSON.parse(allStatusStr);

      // Use land and pay tax.
      const landStatusStr = blockchain.call(
        this._getLandManager(),
        "getTaxRateAndCityInfo",
        [unitIdArrayStr])[0];
      const landStatus = JSON.parse(landStatusStr);

      var boostedAmount = 0;
      var taxMap = {};

      landStatus.forEach((entry, i) => {
        const rateCity = entry[0] || 0;
        const rateOwner = entry[1] || 0;
        const cityId = entry[2];
        const cityOwner = entry[3];

        if (rateCity < 0) return;

        const value = sumOfLuck ? allStatus.tokenAmount * 0.4 * (status.myArray[i].luck || 0) / sumOfLuck : 0;
        boostedAmount += value * (100 - rateCity - rateOwner) / 100;

        if (cityId) {
          // Pay tax.
          const cityAmount = Math.floor(value * rateCity / 100);
          const ownerAmount = Math.floor(value * rateOwner / 100);

          if (taxMap[cityId]) {
            taxMap[cityId][2] += cityAmount;
            taxMap[cityId][3] += ownerAmount;
          } else {
            taxMap[cityId] = [cityId, cityOwner, cityAmount, ownerAmount];
          }
        }
      });

      for (let cityId in taxMap) {
        const taxData = taxMap[cityId];
        blockchain.call(this._getLandManager(), "payTax", [
          taxData[0].toString(), taxData[1],
          taxData[2].toString(), taxData[3].toString()
        ]);
      }

      allStatus.tokenAmount = Math.floor(allStatus.tokenAmount + boostedAmount);

      // Issue token and items.
      blockchain.callWithAuth(
        this._getTreasureManager(),
        "issue",
        [allStatus.tokenAmount.toString()]);

      const iremRArray = JSON.parse(blockchain.callWithAuth(
        this._getItemManager(),
        "issueMultiple",
        [JSON.stringify(allStatus.itemIdArray)])[0]);

      const balance = +blockchain.call(this._getTreasureManager(), "balanceOfSGT", [tx.publisher])[0];
      const items = JSON.parse(blockchain.call(this._getItemManager(), "getMyItemsByItemRArray", [JSON.stringify(iremRArray)])[0] || '[]');

      return {
        didIWin: 1,
        records: battleResult.records,
        drop: allStatus,
        balance: balance,
        items: items,
        energies: status.myArray.map(u => u.energy)
      };
    } else {
      return {
        didIWin: 0,
        records: battleResult.records,
        energies: status.myArray.map(u => u.energy)
      }
    }
  }

  battleInTournament(from, fromUnitIdArrayStr, to, toUnitIdArrayStr) {
    this._sn = this._seed();

    var fromUnitIdArray = JSON.parse(fromUnitIdArrayStr || "[]");
    var toUnitIdArray = JSON.parse(toUnitIdArrayStr || "[]");

    if (UNIT_LIMIT_ARRAY.indexOf(fromUnitIdArray.length) < 0 ||
        UNIT_LIMIT_ARRAY.indexOf(toUnitIdArray.length) < 0) {
      throw "invalid-input";
    }

    fromUnitIdArray = JSON.parse(blockchain.call(
      this._getUnitManager(),
      "filterUnits",
      [from, fromUnitIdArrayStr])[0]);

    toUnitIdArray = JSON.parse(blockchain.call(
      this._getUnitManager(),
      "filterUnits",
      [to, toUnitIdArrayStr])[0]);

    if (from == to) {
      throw "not yourself";
    }

    const now = Math.floor(tx.time / 1e9);

    const fromStatusStr = blockchain.call(
      this._getUnitManager(),
      "getPeerStatusOf",
      [from, JSON.stringify(fromUnitIdArray)])[0];

    const toStatusStr = blockchain.call(
      this._getUnitManager(),
      "getPeerStatusOf",
      [to, JSON.stringify(toUnitIdArray)])[0];

    const status = {
      myArray: JSON.parse(fromStatusStr),
      enemyArray: JSON.parse(toStatusStr)
    };

    if (status.myArray.length != status.enemyArray.length) {
      throw "invalid-input";
    }

    const battleResult = this._innerBattle(status);

    return {
      from: from,
      fromUnitIdArray: fromUnitIdArray,
      to: to,
      toUnitIdArray: toUnitIdArray,
      winner: battleResult.didIWin ? from : to,
      loser: battleResult.didIWin ? to : from,
      records: battleResult.records
    };
  }

  battleWithPeer(unitIdArrayStr, peer, isPaid) {

    isPaid *= 1;

    this._sn = this._seed();

    const unitIdArray = JSON.parse(unitIdArrayStr || "[]");

    if (UNIT_LIMIT_ARRAY.indexOf(unitIdArray.length) < 0) {
      throw "invalid-input";
    }

    const hasUnits = blockchain.call(
      this._getUnitManager(),
      "hasUnits",
      [tx.publisher, unitIdArrayStr])[0] * 1;

    if (!hasUnits) {
      throw "non-existing-unit";
    }

    if (peer == tx.publisher) {
      throw "not yourself";
    }

    const hasStarted = blockchain.call(
      this._getAccount(),
      "hasStarted",
      [peer])[0] * 1;

    if (!hasStarted) {
      throw "peer-not-started";
    }

    const now = Math.floor(tx.time / 1e9);

    if (!this._canAttack(peer, isPaid)) {
      throw "can not attack";
    }

    const myStatusStr = blockchain.call(
      this._getUnitManager(),
      "getMyStatusAndConsumeEnergy",
      [unitIdArrayStr, "2"])[0];

    const enemyStatusStr = blockchain.call(
      this._getUnitManager(),
      "getPeerStatus",
      [peer])[0];

    const status = {
      myArray: JSON.parse(myStatusStr),
      enemyArray: JSON.parse(enemyStatusStr)
    };

    if (status.myArray.length != status.enemyArray.length) {
      throw "invalid-input";
    }

    const battleResult = this._innerBattle(status);

    if (battleResult.didIWin) {
      if (isPaid) {
        const cost = 200;
        blockchain.callWithAuth(this._getTreasureManager(),
          "destroy",
          [cost.toString()]);
      }

      const snatchStatusStr = blockchain.callWithAuth(
        this._getTreasureManager(),
        "snatch",
        [peer, "1"])[0];
      const snatchStatus = JSON.parse(snatchStatusStr);

      this._addHistory(tx.publisher, peer, true, true, now, snatchStatus.amount, 0);
      this._addHistory(peer, tx.publisher, false, true, now, snatchStatus.amount, 0);

      blockchain.callWithAuth(
        this._getRankManager(),
        "snatchScore",
        [peer, tx.publisher]);

      this._setAttackTime(peer);
      const balance = +blockchain.call(this._getTreasureManager(), "balanceOfSGT", [tx.publisher])[0];

      return {
        peer: peer,
        peerUnitIdArray: status.enemyArray.map(u => u.unitId),
        didIWin: 1,
        records: battleResult.records,
        snatch: snatchStatus,
        balance: balance,
        energies: status.myArray.map(u => u.energy)
      };
    } else {
      this._addHistory(tx.publisher, peer, true, false, now, 0, 0);
      this._addHistory(peer, tx.publisher, false, false, now, 0, 0);

      return {
        peer: peer,
        peerUnitIdArray: status.enemyArray.map(u => u.unitId),
        didIWin: 0,
        records: battleResult.records,
        energies: status.myArray.map(u => u.energy)
      }
    }
  }

  battleWithLand(unitIdArrayStr, cityId, landId, isPaid) {
    cityId *= 1;
    landId *= 1;
    isPaid *= 1;

    if (cityId && (landId || isPaid)) {
      throw "invalid input";
    }

    this._sn = this._seed();

    const unitIdArray = JSON.parse(unitIdArrayStr || "[]");

    if (UNIT_LIMIT_ARRAY.indexOf(unitIdArray.length) < 0) {
      throw "invalid-input";
    }

    const hasUnits = blockchain.call(
      this._getUnitManager(),
      "hasUnits",
      [tx.publisher, unitIdArrayStr])[0] * 1;

    if (!hasUnits) {
      throw "non-existing-unit";
    }

    const landStatus = JSON.parse(
      blockchain.call(this._getLandManager(),
        "getLandStatus",
        [cityId.toString(), landId.toString(), isPaid.toString()])[0]);

    if (landStatus.peer == tx.publisher) {
      throw "not yourself";
    }

    if (cityId && !landStatus.canAttack) {
      throw "already broken"
    }

    if (!cityId && !landStatus.canAttack) {
      throw "can not attack";
    }

    const now = Math.floor(tx.time / 1e9);

    const myStatusStr = blockchain.call(
      this._getUnitManager(),
      "getMyStatusAndConsumeEnergy",
      [unitIdArrayStr, cityId ? "1" : "2"])[0];

    const enemyStatusStr = blockchain.call(
      this._getUnitManager(),
      "getPeerStatusOf",
      [landStatus.peer, JSON.stringify(landStatus.unitIdArray)])[0];

    const status = {
      myArray: JSON.parse(myStatusStr),
      enemyArray: JSON.parse(enemyStatusStr)
    };

    if (status.myArray.length != status.enemyArray.length) {
      throw "invalid-input";
    }

    const battleResult = this._innerBattle(status);

    if (battleResult.didIWin) {
      if (isPaid) {
        const cost = 200;
        blockchain.callWithAuth(this._getTreasureManager(),
          "destroy",
          [cost.toString()]);
      }

      const snatchStatusStr = blockchain.callWithAuth(
        this._getTreasureManager(),
        "snatch",
        [landStatus.peer, landStatus.canSnatch.toString()])[0];
      const snatchStatus = JSON.parse(snatchStatusStr);

      this._addHistory(tx.publisher, landStatus.peer, true, true, now, snatchStatus.amount, landStatus.landId);
      this._addHistory(landStatus.peer, tx.publisher, false, true, now, snatchStatus.amount, landStatus.landId);

      blockchain.callWithAuth(
        this._getRankManager(),
        "snatchScore",
        [landStatus.peer, tx.publisher]);

      blockchain.callWithAuth(
        this._getLandManager(),
        "defeatLand",
        [cityId && landStatus.canDefeat ? cityId.toString() : "0", landStatus.landId.toString()]);

      if (cityId && landStatus.canDefeat) {
        // Issue extra token.
        blockchain.callWithAuth(
          this._getTreasureManager(),
          "issue",
          ["1000"]);
      }

      const balance = +blockchain.call(this._getTreasureManager(), "balanceOfSGT", [tx.publisher])[0];

      if (cityId && landStatus.landId) {
        blockchain.callWithAuth(
          this._getLandManager(), "trackDefense",
          [cityId.toString(), landStatus.landId.toString()]);
      }

      return {
        peer: landStatus.peer,
        peerUnitIdArray: landStatus.unitIdArray,
        didIWin: 1,
        records: battleResult.records,
        snatch: snatchStatus,
        balance: balance,
        energies: status.myArray.map(u => u.energy)
      };
    } else {
      this._addHistory(tx.publisher, landStatus.peer, true, false, now, 0, landStatus.landId);
      this._addHistory(landStatus.peer, tx.publisher, false, false, now, 0, landStatus.landId);

      if (cityId && landStatus.landId) {
        blockchain.callWithAuth(
          this._getLandManager(), "trackDefense",
          [cityId.toString(), landStatus.landId.toString()]);
      }

      return {
        peer: landStatus.peer,
        peerUnitIdArray: landStatus.unitIdArray,
        didIWin: 0,
        records: battleResult.records,
        energies: status.myArray.map(u => u.energy)
      }
    }
  }

  battleWithEpic(who) {
    if (!blockchain.requireAuth(this._getEpicManager(), "active")) {
      throw "only epicManager can battle with epic";
    }

    this._sn = this._seed();

    const myStatusStr = blockchain.call(
      this._getUnitManager(),
      "getPeerStatus",
      [who])[0];

    const enemyStatusStr = blockchain.call(
      this._getEpicManager(),
      "getAllEpicStatus",
      [])[0];

    const status = {
      myArray: JSON.parse(myStatusStr),
      enemyArray: JSON.parse(enemyStatusStr)
    };

    const cheatArray = [
      status.enemyArray[0].unitId,
      status.enemyArray[0].hpR,
      status.enemyArray[1].unitId,
      status.enemyArray[1].hpR,
      status.enemyArray[2].unitId,
      status.enemyArray[2].hpR
    ];

    // Mannually sets enemy agility.
    status.enemyArray.forEach(unit => {
      unit.agility = 120;
    });

    const oldHpR = status.enemyArray[1].hpR;
    const battleResult = this._innerBattle(status);
    const newHpR = status.enemyArray[1].hpR;
    const damage = Math.floor(oldHpR - newHpR);
    const didIWin = newHpR <= 0 ? 1 : 0;

    blockchain.callWithAuth(
      this._getEpicManager(),
      "saveBattle",
      [who, damage.toString(), JSON.stringify(battleResult.records), didIWin.toString(), JSON.stringify(cheatArray)]);
  }

  _innerBattle(status) {
    const context = {
      didIWin: 0,
      records: []
    };

    if (this._checkResult(status, context)) {
      return context;
    }

    let i;
    let j;

    let count = 0;
    const limit = status.myArray.length;

    for (i = 0; i < 1000; ++i) {
      let largest = 0;
      let k = 0;

      // Accumulate agility and find the largest one.
      for (j = 0; j < limit; ++j) {
        if (status.myArray[j].hpR > 0 && status.myArray[j].agilityR > largest) {
          largest = status.myArray[j].agilityR;
          k = j + 1;
        }

        if (status.enemyArray[j].hpR > 0 && status.enemyArray[j].agilityR > largest) {
          largest = status.enemyArray[j].agilityR;
          k = j + limit + 1;
        }
      }

      // If no one larger than 100, increase all.
      if (largest < 100) {
        for (j = 0; j < limit; ++j) {
          if (status.myArray[j].hpR > 0) {
            status.myArray[j].agilityR += status.myArray[j].agility;
          }

          if (status.enemyArray[j].hpR > 0) {
            status.enemyArray[j].agilityR += status.enemyArray[j].agility;
          }
        }
      } else {
        if (k > limit) {
          j = k - limit - 1;

          status.enemyArray[j].agilityR -= 100;

          if (status.enemyArray[j].stunned) {
            status.enemyArray[j].stunned = 0;
            continue;
          }

          ++status.enemyArray[j].round;
        } else {
          j = k - 1;

          status.myArray[j].agilityR -= 100;

          if (status.myArray[j].stunned) {
            status.myArray[j].stunned = false;
            continue;
          }

          ++status.myArray[j].round;
        }

        this._execute(k, i, status, context);

        if (this._checkResult(status, context)) {
          return context;
        }

        ++count;
        if (count >= 40) break;
      }
    }

    return context;
  }

  _checkResult(status, context) {
    let t = 0;
    let i;
    const limit = status.myArray.length;

    for (i = 0; i < limit; ++i) {
      if (status.myArray[i].hpR > 0) {
        ++t;
      }
    }

    if (t == 0) {
      context.didIWin = false;
      return true;
    }

    t = 0;

    for (i = 0; i < limit; ++i) {
      if (status.enemyArray[i].hpR > 0) {
        ++t;
      }
    }

    if (t == 0) {
      context.didIWin = true;
      return true;
    }

    return false;
  }

  _seed() {
    const hash = tx.hash;
    var result = 0;
    for (let i = 0; i < Math.min(hash.length, 16); ++i) {
      result = result * 2 + hash.charCodeAt(i) % 2;
    }
    return result;
  }

  _random(seed) {
    // Cheap random number generator.
    return (seed * 61583 + 101533) % 61153;
  }

  _attack(source, target, extraDamage, dodge) {
    ++target.roundA;

    if (dodge >= 0) {
      return target.hpR;
    }

    var attack = 0;
    var defense = 0;
    var damage = 0;

    attack = source.attack;
    defense = target.defense;
    const intelligenceDiff = Math.max(0, source.intelligence - target.intelligence);

    if (defense > attack * 3) {
      damage = (attack * 0.1 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
    } else if (defense > attack * 2) {
      damage = (attack * 0.1 + (attack * 3 - defense) * 0.05 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
    } else if (defense > attack) {
      damage = (attack * 0.15 + (attack * 2 - defense) * 0.15 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
    } else {
      damage = (attack - defense * 0.7 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
    }

    if (damage > target.hpR) {
      target.hpR = 0;
    } else {
      target.hpR -= damage;
    }

    return damage;
  }

  _attackAll(source, targetArray, extraDamage, dodge) {
    let attack = 0;
    let defense = 0;
    let damage = 0;
    let result = [0, 0, 0];
    const limit = targetArray.length;

    for (let targetIndex = 0; targetIndex < limit; ++targetIndex) {
      const target = targetArray[targetIndex];

      if (target.hpR == 0) {
        continue;
      }

      ++target.roundA;

      if (dodge == targetIndex) {
        continue;
      }

      attack = source.attack;
      defense = target.defense;
      const intelligenceDiff = Math.max(0, source.intelligence - target.intelligence);

      if (defense > attack * 3) {
        damage = (attack * 0.1 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
      } else if (defense > attack * 2) {
        damage = (attack * 0.1 + (attack * 3 - defense) * 0.05 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
      } else if (defense > attack) {
        damage = (attack * 0.15 + (attack * 2 - defense) * 0.15 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
      } else {
        damage = (attack - defense * 0.7 + intelligenceDiff * 0.1) * (100 + extraDamage) / 100;
      }

      if (damage > target.hpR) {
        target.hpR = 0;
      } else {
        target.hpR -= damage;
      }

      result[targetIndex] = damage;
    }

    return result;
  }

  _getRandomUnit(unitArray, nonce) {
    let t = 0;
    let i;
    const limit = unitArray.length;

    for (i = 0; i < limit; ++i) {
      if (unitArray[i].hpR > 0) {
        ++t;
      }
    }
    if (t == 0) return 0;

    this._sn = this._random(this._sn);
    t = this._sn % t + 1;
    for (i = 0; i < limit; ++i) {
      if (unitArray[i].hpR > 0) {
        --t;
        if (t == 0) return i;
      }
    }
  }

  _findAllyWithLeastHp(unitArray) {
    if (unitArray[0].hpR > 0 && (unitArray[1].hpR == 0 || unitArray[0].hpR <= unitArray[1].hpR) &&
      (unitArray[2].hpR == 0 || unitArray[0].hpR <= unitArray[2].hpR)) {
      return 0;
    }

    if (unitArray[1].hpR > 0 && (unitArray[2].hpR == 0 || unitArray[1].hpR <= unitArray[2].hpR)) {
      return 1;
    }

    if (unitArray[2].hpR > 0) {
      return 2;
    }

    return 0;
  }

  _findDodgeFromAll(targetArray) {
    for (let i = 0; i < targetArray.length; ++i) {
      if (targetArray[i].unitId == 19 && targetArray[i].roundA == 2) {
        return i;
      }
    }
    return -1;
  }

  _execute(index, round, status, context) {
    let sourceIndex;
    let source;
    let sourceArray;
    let targetIndex;
    let target;
    let targetArray;
    const limit = status.myArray.length;

    if (index > limit) {
      sourceIndex = index - 1 - limit;
      source = status.enemyArray[sourceIndex];
      sourceArray = status.enemyArray;
      targetArray = status.myArray;
    } else {
      sourceIndex = index - 1;
      source = status.myArray[sourceIndex];
      sourceArray = status.myArray;
      targetArray = status.enemyArray;
    }

    if (source.unitId == 32) {
      targetIndex = this._findAllyWithLeastHp(targetArray);
    } else {
      targetIndex = this._getRandomUnit(targetArray, round * limit * 2 + index);
    }

    target = targetArray[targetIndex];

    let dodge = -1;
    if (target.unitId == 19 && target.roundA == 2) {
      // Liu Bei, dodges the 3rd attack from emenies.
      dodge = targetIndex;
    }

    let i = 0;
    let t0 = 0;
    let t1 = 0;
    let result;

    if (source.unitId == 1) {
      // On any enemy with less than 30% hp, inflict additional 20% damage.
      if (target.hpR < target.hp * 0.3) {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 1, target.hpR, context);
      } else {
        result = this._attack(source, target, 20, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 2) {
      // In every 3 attacks, inflict additional 20% damage on the 3rd one.
      if (source.round % 3 == 2) {
        result = this._attack(source, target, 20, dodge);
        this._createOneRecord(index, targetIndex, 2, target.hpR, context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 3) {
      // Inflict 20% additional damage on the middle enemy.
      if (targetIndex == 1) {
        result = this._attack(source, target, 20, dodge);
        this._createOneRecord(index, targetIndex, 3, target.hpR, context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 4) {
      // After losing 50% HP, the next attack will be applied on all enemies.
      if (source.hpR <= source.hp * 0.5) {
        dodge = this._findDodgeFromAll(targetArray);
        result = this._attackAll(source, targetArray, 0, dodge);
        this._createLongRecord(index, targetIndex, 4,
          targetArray.map(e => e.hpR), context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 5) {
      // With 20% chance, stun one enemy for one round.
      result = this._attack(source, target, 0, dodge);

      this._sn = this._random(this._sn);
      t0 = this._sn % 100;

      if (t0 < 20) {
        target.stunned = 1;
        this._createOneRecord(index, targetIndex, 5, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 6) {
      // Increase agility by 20% after 3 attacks
      result = this._attack(source, target, 0, dodge);

      if (source.round == 3) {
        source.agility = source.agility * 1.2;
        this._createTwoRecords(index, targetIndex, 0, target.hpR, targetIndex, 6, i, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 7) {
      // After all allies die, inflict additional 20% damage on the next attack.
      for (i = 0; i < limit; ++i) {
        if (sourceArray[i].hpR > 0) ++t0;
      }

      if (t0 == 1) {
        result = this._attack(source, target, 20, dodge);
        this._createOneRecord(index, targetIndex, 7, target.hpR, context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 8) {
      // When attacking, decrease enemy's defense by 20% every time.
      target.defense = target.defense * 0.8;
      result = this._attack(source, target, 0, dodge);
      this._createTwoRecords(index, targetIndex, 8, target.defense, targetIndex, 0, target.hpR, context);
    } else if (source.unitId == 9) {
      // When attacking,  decrease enemy's agility by 20%.
      target.agility = target.agility * 0.8;
      result = this._attack(source, target, 0, dodge);
      this._createTwoRecords(index, targetIndex, 9, target.agility, targetIndex, 0, target.hpR, context);
    } else if (source.unitId == 10) {
      // Heals the ally with the least hp by 20%.
      t0 = this._findAllyWithLeastHp(sourceArray);
      t1 = sourceArray[t0].hpR + sourceArray[t0].hp / 5;

      if (t1 <= sourceArray[t0].hp) {
        sourceArray[t0].hpR = t1;
      } else if (!sourceArray[t0].hpX) {
        sourceArray[t0].hpR = sourceArray[t0].hp;
      }

      result = this._attack(source, target, 0, dodge);
      this._createTwoRecords(index, t0, 10, sourceArray[t0].hpR, targetIndex, 0, target.hpR, context);
    } else if (source.unitId == 11) {
      // Increase all allies agility by 5%.
      for (t0 = 0; t0 < limit; ++t0) {
        if (sourceArray[t0].hpR > 0) {
          sourceArray[t0].agility = sourceArray[t0].agility * 1.05;
        }
      }

      result = this._attack(source, target, 0, dodge);
      this._createTwoRecords(index, targetIndex, 11, 0, targetIndex, 0, target.hpR, context);
    } else if (source.unitId == 12) {
      // After one ally dies, increase his own hp by 20%.
      result = this._attack(source, target, 0, dodge);

      for (i = 0; i < limit; ++i) {
        if (sourceArray[i].hp > 0 && sourceArray[i].hpR == 0) ++t0;
      }

      if (t0 > 0) {
        t1 = source.hpR + source.hp / 5;

        if (t1 <= source.hp) {
          source.hpR = t1;
        } else if (!source.hpX) {
          source.hpR = source.hp;
        }

        this._createTwoRecords(index, sourceIndex, 12, source.hpR, targetIndex, 0, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 13) {
      // Gain hp by 20% after losing 50% hp.
      result = this._attack(source, target, 0, dodge);

      if (source.hpR * 2 < source.hp) {
        t0 = source.hpR + source.hp / 5;
        if (t0 <= source.hp) {
          source.hpR = t0;
        } else if (!source.hpX) {
          source.hpR = source.hp;
        }
        this._createTwoRecords(index, sourceIndex, 13, source.hpR, targetIndex, 0, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 14) {
      // Stun all enemy in the 3rd round.

      if (source.round == 3) {
        targetArray[0].stunned = 1;
        targetArray[1].stunned = 1;
        targetArray[2].stunned = 1;

        this._createOneRecord(index, targetIndex, 14, 0, context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 15) {
      // Gains hp by attacking enemies.
      t0 = target.hpR;
      result = this._attack(source, target, 0, dodge);
      t1 = source.hpR + Math.min(t0, result); // The actual hp that you damaged.

      if (source.hpR < source.hp) {
        if (t1 < source.hp) {
          source.hpR = t1;
        } else if (!source.hpX) {
          source.hpR = source.hp;
        }

        this._createTwoRecords(index, targetIndex, 0, target.hpR, sourceIndex, 15, source.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 16) {
      // Attack all on the 3rd of every three attacks.
      if (source.round % 3 == 0) {
        dodge = this._findDodgeFromAll(targetArray);
        result = this._attackAll(source, targetArray, 0, dodge);
        this._createLongRecord(index, targetIndex, 16,
          targetArray.map(e => e.hpR), context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 17) {
      // In every 3 attacks, stun the enemy being attacked for one round.
      result = this._attack(source, target, 0, dodge);

      if (source.round % 3 == 2) {
        target.stunned = 1;
        this._createOneRecord(index, targetIndex, 17, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 21) {
      // Lv Bu, attacks twice in one round with 30% chance.
      result = this._attack(source, target, 0, dodge);

      if (target.hpR > 0) {
        this._sn = this._random(this._sn);
        t0 = this._sn % 100;

        if (t0 < 30) {
          result = this._attack(source, target, 0, dodge);
          this._createOneRecord(index, targetIndex, 21, target.hpR, context);
        } else {
          this._createOneRecord(index, targetIndex, 0, target.hpR, context);
        }
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 28) {
      // Xu Chu, stuns one enemy in the first attack.
      result = this._attack(source, target, 0, dodge);

      if (source.round == 1) {
        target.stunned = 1;
        this._createOneRecord(index, targetIndex, 28, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 30) {
      // Sun Shang Xiang, with certain chance, kills an enemy with less than 50% hp
      // directly. The chance equals your intelligence / enemy's intelligence / 3.
      this._sn = this._random(this._sn);
      t0 = this._sn % 100;
      t1 = 100 * source.intelligence / target.intelligence / 3;

      if (t0 < t1 && target.hpR <= target.hp * 0.5) {
        result = target.hpR;
        target.hpR = 0;
        this._createOneRecord(index, targetIndex, 30, 0, context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 31) {
      // Zhou Yu, with 50% chance, starts fire on an enemy; the fire will inflict
      // continuous damage.
      result = this._attack(source, target, 0, dodge);

      this._sn = this._random(this._sn);
      t0 = this._sn % 100;

      if (t0 <= 50 && dodge < 0 && !target.fire) {
        target.fire = source.intelligence / target.intelligence;
        this._createTwoRecords(index, targetIndex, 31, target.fire, targetIndex, 0, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 32) {
      // Xu Huang, attacks the enemy with the least hp.
      t0 = limit;
      for (i = 0; i < limit; ++i) {
        if (targetArray[i].hpR <= 0) --t0;
      }

      result = this._attack(source, target, 0, dodge);
      this._createOneRecord(index, targetIndex, t0 > 1 ? 32 : 0, target.hpR, context);
    } else if (source.unitId == 33) {
      // Diao Chan attack and Stun all enemy by 30% to 50% chance.
      this._sn = this._random(this._sn);
      t0 = this._sn % 100;
      t1 = Math.min(30 + (source.intelligence - 100) / 20, 50);

      if (t0 < t1) {
        targetArray[0].stunned = 1;
        targetArray[1].stunned = 1;
        targetArray[2].stunned = 1;

        dodge = this._findDodgeFromAll(targetArray);
        result = this._attackAll(source, targetArray, 0, dodge);
        this._createLongRecord(index, targetIndex, 33,
          targetArray.map(e => e.hpR), context);
      } else {
        result = this._attack(source, target, 0, dodge);
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 40) {
      // Xiao Qiao, by 30% chance, heals all allies by 30% to 50% hp.
      this._sn = this._random(this._sn);
      t0 = this._sn % 100;
      t1 = Math.min(30 + (source.intelligence - 100) / 20, 50) / 100;

      if (t0 < 30) {
        let f = 0;
        for (i = 0; i < limit; ++i) {
          if (sourceArray[i].hpR > 0) {
            if (sourceArray[i].hpR != sourceArray[i].hp) {
              // TODO: Lv Bu.
              f = 1;
            }

            sourceArray[i].hpR = Math.min(sourceArray[i].hp, sourceArray[i].hpR + sourceArray[i].hp * t1);
          }
        }

        if (f) {
          this._createLongRecord(index, targetIndex, 40,
            sourceArray.map(e => e.hpR), context);
        }
      }

      result = this._attack(source, target, 0, dodge);
      this._createOneRecord(index, targetIndex, 0, target.hpR, context);
    } else if (source.unitId == 41) {
      // Da Qiao, on the 3rd attack, increases all allies attack temporarilly by 30% to 50%.
      t0 = Math.min(30 + (source.intelligence - 100) / 20, 50) / 100;
      if (source.round == 3) {
        for (i = 0; i < limit; ++i) {
          sourceArray[i].attackOld = sourceArray[i].attack;
          sourceArray[i].attack = sourceArray[i].attack * (1 + t0);
        }

        this._createOneRecord(index, targetIndex, 41, t0, context);
      }

      result = this._attack(source, target, 0, dodge);
      this._createOneRecord(index, targetIndex, 0, target.hpR, context);
    } else if (source.unitId == 42) {
      // Zhen Ji, on the 3rd attack, heals the ally with the least hp directly.
      if (source.round == 3) {
        t0 = this._findAllyWithLeastHp(sourceArray);

        if (sourceArray[t0].hpR != sourceArray[t0].hp) {
          if (sourceArray[t0].hpR > sourceArray[t0].hp) {
            sourceArray[t0].hpR = sourceArray[t0].hpR +
              sourceArray[t0].hp - (sourceArray[t0].hpR % sourceArray[t0].hp);
          } else {
            sourceArray[t0].hpR = sourceArray[t0].hp;
          }

          this._createOneRecord(index, t0, 42, sourceArray[t0].hpR, context);
        }
      }

      result = this._attack(source, target, 0, dodge);
      this._createOneRecord(index, targetIndex, 0, target.hpR, context);
    } else if (source.unitId == 36) {
      // Yan Liang, on the 3rd round, afflicts at least 30% hp damage.
      result = this._attack(source, target, 0, dodge);

      if (source.round == 3 && result < target.hp * 0.3 && target.hpR > 0) {
        const moreDamage = target.hp * 0.3 - result;

        if (moreDamage > target.hpR) {
          moreDamage = target.hpR;
          target.hpR = 0;
        } else {
          target.hpR -= moreDamage;
        }

        result += moreDamage;

        this._createOneRecord(index, targetIndex, 36, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else if (source.unitId == 39) {
      // Yuan Shao, group attacks on 1st round, stuns one enemy on 3rd round.
      if (source.round == 1) {
        dodge = this._findDodgeFromAll(targetArray);
        result = this._attackAll(source, targetArray, 0, dodge);
        this._createLongRecord(index, targetIndex, 39,
          targetArray.map(e => e.hpR), context);
      } else {
        result = this._attack(source, target, 0, dodge);

        if (source.round == 3) {
          target.stunned = 1;
          this._createOneRecord(index, targetIndex, 39, target.hpR, context);
        } else {
          this._createOneRecord(index, targetIndex, 0, target.hpR, context);
        }
      }
    } else if (source.unitId == 50) {
      // Ma Chao, afflicts additional damage if attack on the same enemy.
      let extra = 0;
      if (!source.extraMem) {
        source.extraMem = {};
      }

      if (source.extraMem[targetIndex] === undefined) {
        source.extraMem[targetIndex] = 0;
      } else {
        t0 = Math.min(Math.floor(10 + (source.intelligence - 100) / 10), 40);
        if (source.extraMem[targetIndex] < 120) {
          source.extraMem[targetIndex] += t0;
        }
      }

      result = this._attack(source, target, source.extraMem[targetIndex], dodge);

      if (source.extraMem[targetIndex]) {
        this._createOneRecord(index, targetIndex, 50, target.hpR, context);
      } else {
        this._createOneRecord(index, targetIndex, 0, target.hpR, context);
      }
    } else {
      // Just attack.
      result = this._attack(source, target, 0, dodge);
      this._createOneRecord(index, targetIndex, 0, target.hpR, context);
    }

    // Cao Cao, returns damage back to enemies before being killed.
    for (i = 0; i < limit; ++i) {
      if (targetArray[i].unitId == 20 && targetArray[i].hpR == 0) {
        let found = 0;

        if (targetIndex == i && (typeof result) == "number" && result > 0) {
          source.hpR = Math.max(0, source.hpR - result);
          found = 1;
        } else if ((typeof result) == "object" && result[i] > 0) {
          source.hpR = Math.max(0, source.hpR - result[i]);
          found = 1;
        }

        if (found) {
          if (index > limit) {
            this._createOneRecord(i + 1, sourceIndex, 20, source.hpR, context);
          } else {
            this._createOneRecord(i + limit + 1, sourceIndex, 20, source.hpR, context);
          }
        }
      }

      // Zhao Yun, every time been attack, gains additional 15% - 30% defense based on intelligence.
      if (targetArray[i].unitId == 29 && targetArray[i].hpR > 0 && ((typeof result) == "object" || targetIndex == i)) {
        t0 = Math.min(15 + (targetArray[i].intelligence - 100) / 50, 30) / 100;
        targetArray[i].defense = targetArray[i].defense * (1 + t0);

        if (index > limit) {
          this._createOneRecord(i + 1, i, 29, targetArray[i].defense, context);
        } else {
          this._createOneRecord(i + limit + 1, i, 29, targetArray[i].defense, context);
        }
      }

      // Wen Chou, reduce 50% damage and 25% damage on 1st and 2nd attack.
      if (targetArray[i].unitId == 37 && targetArray[i].hpR > 0 && ((typeof result) == "object" || targetIndex == i) && targetArray[i].roundA < 3) {
        t0 = (typeof result) == "object" ? result[i] : result;

        if (targetArray[i].roundA == 1) {
          targetArray[i].hpR += t0 / 2;
        } else if (targetArray[i].roundA == 2) {
          targetArray[i].hpR += t0 / 4;
        }

        if (index > limit) {
          this._createOneRecord(i + 1, i, 37, targetArray[i].hpR, context);
        } else {
          this._createOneRecord(i + limit + 1, i, 37, targetArray[i].hpR, context);
        }
      }
    }

    if (source.fire > 0) {
      // Zhou Yu's fire.
      // Cao Cao's skill not effective here.
      t0 = Math.min(0.3, 0.1 * source.fire);
      source.hpR = Math.max(0, source.hpR - source.hp * t0);
    }

    // Restores attack (after Da Qiao's temporary effect).
    if (source.attackOld) {
      source.attack = source.attackOld;
      source.attackOld = 0;
    }
  }

  _createOneRecord(index, targetIndex, t, result, context) {
    context.records.push([
      index, targetIndex, t, result
    ]);
  }

  _createLongRecord(index, targetIndex, t, results, context) {
    const entry = [
      index, targetIndex, t
    ];
    results.forEach(r => entry.push(r));
    context.records.push(entry);
  }

  _createTwoRecords(index, targetIndex, t, result, targetIndex1, t1, result1, context) {
    context.records.push([
      index, targetIndex, t, result
    ]);
    context.records.push([
      index, targetIndex1, t1, result1
    ]);
  }

  debugMarkSafe(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    this._setAttackTime(who);
  }

  debugMoveAccount(from, to) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const time = storage.mapGet("time", from)
    if (time) {
      storage.mapPut("time", to, time);
      storage.mapDel("time", from);
    }

    const history = storage.mapGet("history", from);
    if (history) {
      storage.mapPut("history", to, history);
      storage.mapDel("history", from);
    }
  }
}


module.exports = Battle;
