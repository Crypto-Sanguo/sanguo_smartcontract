const UNIT_LIMIT = 3;
const ITEM_LIMIT = 3;
const ITEM_DROP_LIMIT = 2;

/*

# stage
[
  // place
  [{  // battle
    units: [{
      unitId: 1,
      level: 2
    }],
    dropItems: [{
      itemId: 2,
      chance: 0.004
    }],
    dropToken: {
      low: 100,
      high: 300
    }
  }]
]

# dependency
{
  stageId: 1,
}

# progress_stageId, user
{
  placeIndex:
  battleIndex:
  finished:
}
*/

class StageManager {

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

  setStage(stageId, json) {
    storage.mapPut("stage", stageId.toString(), json);
  }

  _getStage(stageId) {
    return JSON.parse(storage.mapGet("stage", stageId.toString()) || "[]");
  }

  setDependency(stageId, json) {
    storage.mapPut("dependency", stageId.toString(), json);
  }

  hasFinished(user, stageId) {
    let json;

    json = storage.mapGet("progress_" + stageId, user);
    if (!json) {
      return 0;
    }

    const progress = JSON.parse(json);
    return progress.finished;
  }

  canPlay(user, stageId, placeIndex, battleIndex) {
    placeIndex *= 1;
    battleIndex *= 1;

    const dependency = JSON.parse(storage.mapGet("dependency", stageId.toString()) || "{}");
    if (dependency.stageId && !this.hasFinished(user, dependency.stageId)) {
      return 0;
    }

    const progress = JSON.parse(storage.mapGet("progress_" + stageId, user) ||
        "{\"placeIndex\": 0, \"battleIndex\": 0}");

    return (placeIndex < progress.placeIndex || (
        placeIndex == progress.placeIndex &&
        battleIndex <= progress.battleIndex)) * 1;
  }

  finishBattle(stageId, placeIndex, battleIndex) {
    placeIndex *= 1;
    battleIndex *= 1;

    const stage = this._getStage(stageId);
    if (placeIndex >= stage.length) return;

    const progress = JSON.parse(storage.mapGet("progress_" + stageId, tx.publisher) ||
        "{\"placeIndex\": 0, \"battleIndex\": 0, \"finished\": 0}");

    battleIndex += 1;
    if (battleIndex >= stage[placeIndex].length) {
      placeIndex += 1;
      battleIndex = 0;
    }

    if (placeIndex > progress.placeIndex) {
      progress.placeIndex = placeIndex;
      progress.battleIndex = 0;
    } else if (placeIndex == progress.placeIndex) {
      if (battleIndex > progress.battleIndex) {
        progress.battleIndex = battleIndex;
      }
    }

    if (placeIndex >= stage.length) {
      progress.finished = 1;
    }

    storage.mapPut("progress_" + stageId, tx.publisher, JSON.stringify(progress));
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

  maybeDrop(stageId, placeIndex, battleIndex, sumOfLuck, times, nonce) {
    placeIndex *= 1;
    battleIndex *= 1;
    sumOfLuck *= 1;
    times *= 1;

    const stage = this._getStage(stageId);
    const battle = stage[placeIndex][battleIndex];

    const itemIdArray = [];

    const r = Math.min(2, sumOfLuck / 300);

    var seed = this._seed() + nonce;

    var allAmount = 0;
    for (let i = 0; i < times; ++i) {
      battle.dropItems.forEach((item, index) => {
        seed = this._random(seed);
        const randomNumber = (seed % 1000) / 1000;
        if (randomNumber < item.chance * r) {
          itemIdArray.push(item.itemId);
        }
      });

      seed = this._random(seed);
      var tokenAmount = battle.dropToken.low +
          seed %
          Math.max(1, battle.dropToken.high - battle.dropToken.low);
      allAmount += Math.floor(tokenAmount * r);
    }

    return {
      tokenAmount: allAmount,
      itemIdArray: itemIdArray
    }
  }

  getStage(stageId) {
    var clearOnDependency = true;

    const dependency = JSON.parse(storage.mapGet("dependency", stageId.toString()) || "{}");
    if (dependency.stageId && !this.hasFinished(tx.publisher, dependency.stageId)) {
      clearOnDependency = false;
    }

    const stage = this._getStage(stageId);
    const progress = JSON.parse(storage.mapGet("progress_" + stageId, tx.publisher) ||
                                "{\"placeIndex\": 0, \"battleIndex\": 0}");

    for (let placeIndex = 0; placeIndex < stage.length; ++placeIndex) {
      for (let battleIndex = 0; battleIndex < stage[placeIndex].length; ++battleIndex) {
        if (clearOnDependency &&
            (placeIndex < progress.placeIndex ||
             (placeIndex == progress.placeIndex && battleIndex <= progress.battleIndex))) {
          stage[placeIndex][battleIndex].available = 1;

          if (placeIndex == progress.placeIndex && battleIndex == progress.battleIndex) {
            stage[placeIndex][battleIndex].finished = 0;
          } else {
            stage[placeIndex][battleIndex].finished = 1;
          }
        } else {
          stage[placeIndex][battleIndex].available = 0;
        }

        for (let i = 0; i < stage[placeIndex][battleIndex].units.length; ++i) {
          const hp = JSON.parse(blockchain.call(
              this._getUnitManager(),
              "getHp",
              [stage[placeIndex][battleIndex].units[i].unitId.toString(),
               stage[placeIndex][battleIndex].units[i].level.toString()])[0]);
          stage[placeIndex][battleIndex].units[i].hp = hp;
        }
      }
    }

    return stage;
  }

  getUnitArray(stageId, placeIndex, battleIndex) {
    stageId *= 1;
    placeIndex *= 1;
    battleIndex *= 1;

    const stage = this._getStage(stageId);
    return stage[placeIndex][battleIndex].units;
  }
}


module.exports = StageManager;
