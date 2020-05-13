/*

#queue
[ 
  [who, [unitId]]
]

#result
{
   gameOver:
   expiration:
}

#history
[
  [time, from, fromUnitIdArray, to, toUnitIdArray, loser, records]
]

#records
loser => string

#times
{
  [who]: value
}

#reward
{
  [who]: winningCount
  -total: amount
  -pre: amount
}

*/


class TournamentManager {

  init() {
  }

  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
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

  _ceilDate(time) {
    if (time < 46800) return 0;
    return Math.ceil((time - 46800) / 86400);
  }

  _getQueue() {
    return JSON.parse(storage.get("queue") || "[]");
  }

  _setQueue(queue) {
    storage.put("queue", JSON.stringify(queue));
  }

  _getTimes(who) {
    const data = JSON.parse(storage.get("times") || "{}");

    return data[who] || 0;
  }

  _setTimes(who, times) {
    var data = JSON.parse(storage.get("times") || "{}");
    data[who] = times;
    storage.put("times", JSON.stringify(data));
  }

  _resetTimes() {
    storage.put("times", "{}");
  }

  _getResult() {
    return JSON.parse(storage.get("result") ||
        "{\"expiration\": 0, \"gameOver\": 1}");  // By default game is over.
  }

  _setResult(result) {
    storage.put("result", JSON.stringify(result));
  }

  _getReward() {
    return JSON.parse(storage.get("reward") ||
        "{\"-total\": 0, \"-pre\": 0}");
  }

  _setReward(reward) {
    storage.put("reward", JSON.stringify(reward));
  }

  _getHistory() {
    return JSON.parse(storage.get("history") || "[]");
  }

  _setHistory(history) {
    storage.put("history", JSON.stringify(history));
  }

  _setRecords(index, records) {
    storage.mapPut("records", index.toString(), JSON.stringify(records));
  }

  clearData() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can call";
    }

    const now = Math.floor(tx.time / 1e9);

    this._setHistory([]);
    this._setReward({"-total": 0, "-pre": 0});
    this._setResult({"expiration": now + 12 * 3600, "gameOver": 1});
    this._resetTimes();
    this._setQueue([]);
  }

  queueForTournament(unitIdArrayStr) {
    const unitIdArray = JSON.parse(unitIdArrayStr);

    if (unitIdArray.length != 6) {
      throw "invalid size";
    }

    const queue = this._getQueue();

    for (let i = 0; i < queue.length; ++i) {
      if (queue[i][0] == tx.publisher) {
        // Already in queue
        throw "aleady-in-queue";
      }
    }

    const times = this._getTimes(tx.publisher);
    var cost;

    // With different times, gives different cost
    if (times == 0) {
      cost = 100;
    } else if (times == 1) {
      cost = 150;
    } else if (times == 2) {
      cost = 200;
    } else {
      throw "no-more";
    }

    blockchain.callWithAuth(this._getTreasureManager(),
                            "destroy",
                            [cost.toString()]);

    this._setTimes(tx.publisher, times + 1);

    queue.push([tx.publisher, unitIdArray]);
    this._setQueue(queue);

    // Add cost to reward pool.
    const reward = this._getReward();

    const result = this._getResult();
    if (result.gameOver) {
      reward["-pre"] += cost;
    } else {
      reward["-total"] += cost;
    }

    this._setReward(reward);
  }

  execute() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can call";
    }

    const result = this._getResult();
    var history = this._getHistory();

    const now = Math.floor(tx.time / 1e9);

    if (result.expiration && now < result.expiration) {
      // Wait for new game starts.
      return;
    }

    var queue = this._getQueue();

    var s = this._seed();

    if (queue.length >= 2 && !result.gameOver) {
      // Game is in process.

      const iA = this._random(s) % queue.length;
      var iB = this._random(iA) % queue.length;
      while (iB == iA) {
        // So that iB won't equal to iA.
        iB = (iB + 1) % queue.length;
      }

      const battleResult = JSON.parse(
          blockchain.callWithAuth(this._getBattle(),
                                  "battleInTournament",
                                  [queue[iA][0], JSON.stringify(queue[iA][1]),
                                   queue[iB][0], JSON.stringify(queue[iB][1])])[0]);
      // Remove loser from queue.
      for (let i = 0; i < queue.length; ++i) {
        if (queue[i][0] == battleResult.loser) {
          queue.splice(i, 1)[0];
          break;
        }
      }

      // Add to history.
      history.push([now, battleResult.from, battleResult.fromUnitIdArray,
                    battleResult.to, battleResult.toUnitIdArray, battleResult.loser, battleResult.records]);
      this._setRecords(history.length - 1, battleResult.records);

      // Game is not over yet.

      // Count winning.
      const reward = this._getReward();
      reward[battleResult.winner] = reward[battleResult.winner] ? reward[battleResult.winner] + 1 : 1;
      this._setReward(reward);
    } else if (queue.length == 1 && !result.gameOver) {
      // Make game over.

      result.gameOver = 1;
      result.expiration = now + 12 * 3600;  // New game starts in 12 hours.
      result.winner = queue[0][0];
      queue = [];  // New queue

      // Now distribute all the SGT.
      const reward = this._getReward();
      for (let who in reward) {
        // NOTE: May run out of gas.
        if (who == "-total" || who == "-pre") continue;

        const amount = reward[who] / history.length * reward["-total"];
        blockchain.callWithAuth(this._getTreasureManager(),
                                "debugIssueTo",
                                [who, amount.toFixed(2)]);
      }

      // Reset times so that players can queue again.
      this._resetTimes();
    } else if (queue.length >= 2 && result.gameOver) {
      // Now let's start new game.
      result.gameOver = 0;
      result.winner = "";
      history = [];

      // Clears reward (expect pool amount).
      const reward = this._getReward();
      for (let who in reward) {
        if (who == "-total" || who == "-pre") continue;

        delete reward[who];
      }

      reward["-total"] = reward["-pre"];  // New pool.
      reward["-pre"] = 0;  // Clears the pre amount.

      this._setReward(reward);
    } // Otherwise keep waiting.

    this._setQueue(queue);
    this._setResult(result);
    this._setHistory(history);
  }
}


module.exports = TournamentManager;
