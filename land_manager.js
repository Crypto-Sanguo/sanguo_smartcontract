/*

# stat
{
  count:
  price:
}

# cityNames
{
  1: "Chang'an",
  2: "Luoyang",
  1024: "Zhuojun",
}

#all_city_ids
[]

# city
cityId => {
  owner:
  landIdArray: [],
  taxRate: 5  // 0 - 50
  taxRateTime: time,
  defeat: time
}

# pool
cityId => {
  accumulated: 0,
  bounty: 0
}

# prize
cityId => {
  who: amount of land or SGT
  -final:
  -date:
}

# taxRecord
cityId => [[who, amount]]  // 50 Records

# land
# landId starts from 1024
landId => {
  unitIdArray:
  unitIdTime:
  owner:
  render:
  expiration:
  cityId:
  cityIdTime:
  sellPage:
  rentPage:
  defense: time
  defenseCount: 0/1
  oath: time
}

# user => {
  cityIds: []
  landIds: [],
  units: {
    1: 0, 1, or landId,  // 0 means empty, 1 means defense
    2: 0, 1, or landId
  },
  oath: cityId
  oathLandId: landId
}

# rent_pages

# rent_offers
page => [
  {
    seller:
    landId:
    price:
    duration: // # of days.
  }
]

# sell_pages

# sell_offers
page => {
  {
    seller:
    landId:
    price:
  }
}

# oath
cityId => [user, user]

# attack_points
cityId => {
  user: count
  -date: date
}

# defense_points
cityId => {
  user: count
  -date: date
}

# attack_points_by_user
user {
  count: count,
  -date: date
}
SUM: sum

*/

const PAGE_LIMIT = 100;


class LandManager {

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

  setItemManager(itemManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("itemManager", itemManager);
  }

  _getItemManager() {
    return storage.get("itemManager");
  }

  setRankManager(rankManager) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    storage.put("rankManager", rankManager);
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

  _getRankManager() {
    return storage.get("rankManager");
  }

  _getStat() {
    return JSON.parse(storage.get("stat") || "{\"count\": 0, \"price\": 2000}");
  }

  _setStat(stat) {
    storage.put("stat", JSON.stringify(stat));
  }

  _getCity(cityId) {
    return JSON.parse(storage.mapGet("city", cityId.toString()) || "0");
  }

  _setCity(cityId, city) {
    storage.mapPut("city", cityId.toString(), JSON.stringify(city));
  }

  _getPrize(cityId) {
    return JSON.parse(storage.mapGet("prize", cityId.toString()) || "{}");
  }

  _setPrize(cityId, prize) {
    storage.mapPut("prize", cityId.toString(), JSON.stringify(prize));
  }

  _getAllCityIds() {
    return JSON.parse(storage.get("all_city_ids") || "[]");
  }

  _setAllCityIds(allCityIds) {
    storage.put("all_city_ids", JSON.stringify(allCityIds));
  }

  _getLand(landId) {
    return JSON.parse(storage.mapGet("land", landId.toString()) || "0");
  }

  _setLand(landId, land) {
    storage.mapPut("land", landId.toString(), JSON.stringify(land));
  }

  _getUser(who) {
    return JSON.parse(storage.mapGet("user", who) || "{\"cityIds\":[],\"landIds\":[],\"units\":[]}");
  }

  _setUser(who, user) {
    storage.mapPut("user", who, JSON.stringify(user));
  }

  _getLandId(stat, offset) {
    return stat.count + offset + 1024;
  }

  _getSellPages() {
    return JSON.parse(storage.get("sell_pages") || "[]");
  }

  _setSellPages(pages) {
    storage.put("sell_pages", JSON.stringify(pages));
  }

  _getSellOffers(page) {
    return JSON.parse(storage.mapGet("sell_offers", page.toString())) || [];
  }

  _setSellOffers(page, offers) {
    storage.mapPut("sell_offers", page.toString(), JSON.stringify(offers));
  }

  _getRentPages() {
    return JSON.parse(storage.get("rent_pages") || "[]");
  }

  _setRentPages(pages) {
    storage.put("rent_pages", JSON.stringify(pages));
  }

  _getRentOffers(page) {
    return JSON.parse(storage.mapGet("rent_offers", page.toString()) || '[]');
  }

  _setRentOffers(page, offers) {
    storage.mapPut("rent_offers", page.toString(), JSON.stringify(offers));
  }

  _getPool(cityId) {
    return JSON.parse(storage.mapGet("pool", cityId.toString()) || "{}");
  }

  _setPool(cityId, pool) {
    storage.mapPut("pool", cityId.toString(), JSON.stringify(pool));
  }

  _getOath(cityId) {
    return JSON.parse(storage.mapGet("oath", cityId.toString()) || "[]");
  }

  _setOath(cityId, oath) {
    storage.mapPut("oath", cityId.toString(), JSON.stringify(oath));
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

  getLandStatus(cityId, landId, isPaid) {
    cityId *= 1;
    landId *= 1;
    isPaid *= 1;

    const now = Math.floor(tx.time / 1e9);
    const today = this._ceilDate(now);

    if (cityId) {
      const city = this._getCity(cityId);
      if (!city) {
        throw "invalid cityId";
      }

      if (this._ceilDate(city.defeat || 0) == today) {
        return {
          canAttack: 0
        };
      }

      const candidates = [];

      city.landIdArray.forEach(landId => {
        const land = this._getLand(landId);

        if (land &&
            // Not defeated today.
            this._ceilDate(land.defense || 0) < today &&
            // Has units in it.
            (land.unitIdArray && (land.unitIdArray[0] || land.unitIdArray[1] || land.unitIdArray[2]))) {
          candidates.push([landId, land.renter || land.owner, land.unitIdArray]);
        }
      });

      if (candidates.length == 0) {
        // Hack here to mark defeated city.
        city.defeat = now;
        this._setCity(cityId, city);

        return {
          canAttack: 0
        };
      }

      var seed = this._seed();
      seed = this._random(seed);
      const pair = candidates[seed % candidates.length];

      const land = this._getLand(pair[0]);

      return {
        landId: pair[0],
        peer: pair[1],
        unitIdArray: pair[2],
        canAttack: 1,
        canDefeat: candidates.length == 1 ? 1 : 0,
        canSnatch: this._ceilDate(land.reactivate || 0) < today ? 1 : 0
      };
    } else {
      const land = this._getLand(landId);
      if (land &&
          // Not defeated twice today.
          (this._ceilDate(land.defense || 0) < today ||
           (isPaid && (land.defenseCount || 0) < 1)) &&
          // Has units in it.
          (land.unitIdArray && (land.unitIdArray[0] || land.unitIdArray[1] || land.unitIdArray[2]))) {

        const city = this._getCity(land.cityId);
        if (this._ceilDate(city.defeat || 0) < today) {
          return {
            canAttack: 0
          }
        }

        return {
          landId: landId,
          peer: land.renter || land.owner,
          unitIdArray: land.unitIdArray,
          canAttack: 1,
          canSnatch: 1
        };
      } else {
        return {
          canAttack: 0
        }
      }
    }
  }

  trackDefense(cityId, landId) {
    cityId *= 1;
    landId *= 1;

    if (!blockchain.requireAuth(this._getBattle(), "active") &&
        !blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only battle can defeat land";
    }

    const land = this._getLand(landId);
    const now = Math.floor(tx.time / 1e9);
    const today = this._ceilDate(now);

    let defensePoints = JSON.parse(storage.mapGet("defense_points", cityId.toString()) || "{}");
    if (defensePoints['-date'] != today) {
      defensePoints = {
        '-date': today
      };
    }

    defensePoints[land.renter || land.owner] = defensePoints[land.renter || land.owner] ? defensePoints[land.renter || land.owner] + 1 : 1;
    storage.mapPut("defense_points", cityId.toString(), JSON.stringify(defensePoints));
  }

  _trackPrize(cityId, today) {
    const city = this._getCity(cityId);
    if (this._ceilDate(city.defeat) == today) {
      return;
    }

    let prize = this._getPrize(cityId);
    if (prize["-date"] && prize["-date"] != today) {
      prize = {};
    }

    prize[tx.publisher] = prize[tx.publisher] ? prize[tx.publisher] + 1 : 1;
    prize["-final"] = tx.publisher;
    prize["-date"] = today;
    this._setPrize(cityId, prize);
  }

  defeatLand(cityId, landId) {
    cityId *= 1;
    landId *= 1;

    if (!blockchain.requireAuth(this._getBattle(), "active") &&
        !blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only battle can defeat land";
    }

    const now = Math.floor(tx.time / 1e9);
    const today = this._ceilDate(now);

    // Defeat land.
    if (landId) {
      const land = this._getLand(landId);
      if (!land) {
        throw "invalid land";
      }

      if (this._ceilDate(land.defense || 0) < today) {
        land.defense = now;
        land.defenseCount = 0;

        // Increase attack points.
        const user = this._getUser(tx.publisher);
        if (user && user.oath) {
          let sum = JSON.parse(storage.mapGet("attack_points_by_user", "SUM") || "{}");

          let attackPoints = JSON.parse(storage.mapGet("attack_points", user.oath.toString()) || "{}");
          if (attackPoints['-date'] != today) {
            attackPoints = {
              '-date': today
            };
          }

          if (sum.date != today) {
            sum = {
              count: 0,
              date: today
            };
          }
          attackPoints[tx.publisher] = attackPoints[tx.publisher] ? attackPoints[tx.publisher] + 1 : 1;
          storage.mapPut("attack_points", user.oath.toString(), JSON.stringify(attackPoints));

          // Attack points by user.
          // MAYBE: Give points to all users with or without oath.
          storage.mapPut("attack_points_by_user", tx.publisher, JSON.stringify({
            count: attackPoints[tx.publisher],
            date: today
          }));

          sum.count += 1;
          storage.mapPut("attack_points_by_user", "SUM", JSON.stringify(sum));
        }
      } else {
        land.defenseCount = 1;
      }

      this._setLand(landId, land);

      // Track prize.
      this._trackPrize(land.cityId, today);
    }

    // Maybe defeat city.
    if (cityId) {
      const city = this._getCity(cityId);
      if (!city) {
        throw "invalid cityId";
      }

      city.defeat = now;
      this._setCity(cityId, city);

      const pool = this._getPool(cityId);
      pool.bounty = pool.accumulated;
      pool.accumulated = 0;
      this._setPool(cityId, pool);

      return landId ? 1 : 0;
    }

    return 0;
  }

  buyCity(cityId, amount) {
    cityId *= 1;
    amount *= 1;

    if (amount != 50 && amount != 100) {
      throw "invalid amount";
    }

    if (amount == 100 && (cityId <= 1 || cityId > 20)) {
      throw "invalid cityId";
    }

    if (amount == 50 && (cityId < 1024 || cityId > 1124)) {
      throw "invalid cityId";
    }

    var city = this._getCity(cityId);
    if (city) {
      throw "already exist"
    }

    const stat = this._getStat();
    const user = this._getUser(tx.publisher);
    const allCityIds = this._getAllCityIds();

    city = {
      owner: tx.publisher,
      landIdArray: []
    }

    var totalPrice = 0;

    for (let i = 0; i < amount; ++i) {
      const landId = this._getLandId(stat, i);
      city.landIdArray.push(landId);
      totalPrice += stat.price;
      stat.price += 1;

      const land = {
        unitIdArray: [],
        owner: tx.publisher,
        cityId: cityId,
        cityIdTime: 0
      };

      this._setLand(landId, land);

      user.landIds.push(landId);
    }

    user.cityIds.push(cityId);
    this._setUser(tx.publisher, user);

    allCityIds.push(cityId);
    this._setAllCityIds(allCityIds);

    stat.count += amount;

    this._setCity(cityId, city);
    this._setStat(stat);

    // Charges IOST.
    blockchain.transfer(tx.publisher,
                        blockchain.contractName(),
                        totalPrice.toString(),
                        "buyCity");
    // TODO: Transfers to treasureManager and tracks commission.

    // Record spending.
    blockchain.callWithAuth(this._getRankManager(), "addValue",
        [tx.publisher, "spending", totalPrice.toString()]);

    // Update data in treasureManager.
    blockchain.callWithAuth(this._getTreasureManager(),
                            'payLand',
                            [totalPrice.toString(), tx.publisher]);

    return user.landIds;
  }

  _ceilDate(time) {
    if (time < 46800) return 0;
    return Math.ceil((time - 46800) / 86400);
  }

  setCityTax(cityId, taxRate) {
    cityId *= 1;
    taxRate *= 1;

    taxRate = Math.min(50, Math.max(0, taxRate));

    const now = Math.floor(tx.time / 1e9);
    const city = this._getCity(cityId);

    if (blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      city.taxRate = taxRate;
      this._setCity(cityId, city);
      return;
    }

    if (!city) {
      throw "invalid city";
    }

    if (city.owner != tx.publisher) {
      throw "not your city";
    }

    if (now < city.taxRateTime + 3600 * 24 * 7) {
      throw "no more change in 7 days";
    }

    city.taxRate = taxRate;
    city.taxRateTime = now;

    this._setCity(cityId, city);
  }

  changeCity(landId, cityId) {
    landId *= 1;
    cityId *= 1;

    const land = this._getLand(landId);

    if (!land) {
      throw "invalid land";
    }

    if (land.owner != tx.publisher) {
      throw "not your land";
    }

    const now = Math.floor(tx.time / 1e9);

    const nowRemaining = now % (3600 * 24);
    if (nowRemaining >= 45000 && nowRemaining <= 54000) {
      throw "no change between 20:30 and 23:00";
    }

    if (this._ceilDate(now) == this._ceilDate(land.cityIdTime)) {
      throw "no more change today";
    }

    if (land.oath && now < land.oath + 3600 * 24 * 7) {
      throw "no more change in 7 days";
    }

    if (cityId == land.cityId) return;

    const city = this._getCity(cityId);
    if (city.landIdArray.indexOf(landId) < 0) {
      city.landIdArray.push(landId);
    }
    this._setCity(cityId, city);

    const oldCity = this._getCity(land.cityId);
    oldCity.landIdArray = oldCity.landIdArray.filter(id => id != landId);
    this._setCity(land.cityId, oldCity);

    land.cityId = cityId;
    land.cityIdTime = now;

    this._setLand(landId, land);
  }

  oath(landId) {
    landId *= 1;

    const now = Math.floor(tx.time / 1e9);

    const land = this._getLand(landId);

    if (!land) {
      throw "invalid land";
    }

    if (land.renter && land.renter != tx.publisher || !land.renter && land.owner != tx.publisher) {
      throw "not your land";
    }

    if (land.oath && now < land.oath + 3600 * 24 * 7) {
      throw "no more change in 7 days";
    }

    this.sellCancel(landId);
    this.rentCancel(landId);

    land.oath = now;
    this._setLand(landId, land);

    const user = this._getUser(tx.publisher);

    // Maybe remove tx.publisher from old oath (user list of the city)
    if (user.oath) {
      if (user.oathLandId) {
        const oldLand = this._getLand(user.oathLandId);
        if (oldLand.oath && now < oldLand.oath + 3600 * 24 * 7) {
          throw "already in oath";
        }
      }

      const oldOath = this._getOath(user.oath);
      const oldIndex = oldOath.indexOf(tx.publisher);
      if (oldIndex >= 0) {
        oldOath.splice(oldIndex, 1);
      }
      this._setOath(user.oath, oldOath);
    }

    user.oath = land.cityId;
    user.oathLandId = landId;
    this._setUser(tx.publisher, user);

    const oath = this._getOath(land.cityId);
    if (oath.indexOf(tx.publisher) < 0) {
      oath.push(tx.publisher);
    }
    this._setOath(land.cityId, oath);
  }

  reactivate(landId) {
    landId *= 1;

    const now = Math.floor(tx.time / 1e9);

    const land = this._getLand(landId);

    if (!land) {
      throw "invalid land";
    }

    if (land.owner != tx.publisher) {
      throw "not your land";
    }

    const today = this._ceilDate(now);

    if (this._ceilDate(land.reactivate || 0) >= today) {
      throw "no more reactivate";
    }

    const itemId = 112;
    const amount = 1;

    const rIdArray = JSON.parse(blockchain.callWithAuth(
        this._getItemManager(),
        "useItem",
        [itemId.toString(),
         amount.toString()])[0]);

    land.defense = 0;
    land.defenseCount = 0;
    land.reactivate = now;

    this._setLand(landId, land);

    return rIdArray;
  }

  rentTo(landId, price, duration) {
    landId *= 1;
    price *= 1;
    duration *= 1;

    if (duration < 3 || duration > 30) {
      throw "invalid duration";
    }

    // Check that the user has the land.
    const land = this._getLand(landId);

    if (land.owner != tx.publisher) {
      throw "not your land";
    }

    if (land.renter) {
      throw "in rental";
    }

    // Check that it's not on sale or rent yet.
    if (!land || land.sellPage || land.rentPage) {
      return;
    }

    const now = Math.floor(tx.time / 1e9);
    if (land.oath && now < land.oath + 3600 * 24 * 7) {
      throw "no more change in 7 days";
    }

    const pages = this._getRentPages();

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
    this._setRentPages(pages);

    // Set land.
    land.rentPage = currentPage + 1;
    this._setLand(landId, land);

    // Set offers.
    const offers = this._getRentOffers(currentPage);
    offers.push({
      seller: tx.publisher,
      landId: landId,
      price: price,
      duration: duration
    });
    this._setRentOffers(currentPage, offers);
  }

  rentCancel(landId) {
    landId *= 1;
    const land = this._getLand(landId);

    if (!land) {
      throw "invalid landId";
    }

    const currentPage = land.rentPage - 1;

    if (currentPage < 0) {
      return;
    }

    // Decrease amount in pages.
    const pages = this._getRentPages();
    if (pages[currentPage]) {
      --pages[currentPage];
    }

    this._setRentPages(pages);

    // Remove offer from offers.
    const offers = this._getRentOffers(currentPage);
    for (let i = 0; i < offers.length; ++i) {
      if (offers[i].landId == landId) {
        offers.splice(i, 1);
        break;
      }
    }

    this._setRentOffers(currentPage, offers);

    // Set land.
    land.sellPage = 0;
    land.rentPage = 0;
    land.expiration = 0;
    this._setLand(landId, land);
  }

  rentFrom(landId) {
    landId *= 1;
    const land = this._getLand(landId);

    if (!land) {
      throw "invalid landId";
    }

    const currentPage = land.rentPage - 1;
    if (currentPage < 0) return 0;

    // Check the offer is there.
    const offers = this._getRentOffers(currentPage);

    const all = offers.filter((offer) => {
      return offer.landId == landId;
    });

    if (all.length <= 0) return 0;

    const offer = all[0];
    const seller = offer.seller;
    const price = offer.price;
    const duration = offer.duration;

    // Check that the user does not own or rent the land yet.
    const user = this._getUser(tx.publisher);
    if (user.landIds.indexOf(landId) >= 0) {
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

    // Set user.
    user.landIds.push(landId);
    this._setUser(tx.publisher, user);

    // Set land.
    const now = Math.floor(tx.time / 1e9);
    land.sellPage = 0;
    land.rentPage = 0;
    land.expiration = now + duration * 24 * 3600;
    land.unitIdArray = [];
    land.unitIdTime = 0;
    land.renter = tx.publisher;
    this._setLand(landId, land);

    // Decrease amount in pages.
    const pages = this._getRentPages();
    if (pages[currentPage]) {
      --pages[currentPage];
    }
    this._setRentPages(pages);

    // Remove offer from offers.
    for (let i = 0; i < offers.length; ++i) {
      if (offers[i].landId == landId) {
        offers.splice(i, 1);
        break;
      }
    }

    this._setRentOffers(currentPage, offers);

    // Remove from seller user.
    const sellerUser = this._getUser(seller);

    if (sellerUser) {
      // Remove units.
      for (let unitId in sellerUser.units) {
        if (sellerUser.units[unitId] == landId) {
          sellerUser.units[unitId] = 0;
        }
      }

      sellerUser.landIds = sellerUser.landIds.filter(id => id != landId);

      this._setUser(seller, sellerUser);

      // Notification
      blockchain.callWithAuth(
          this._getNotificationManager(),
          "add",
          [seller,
           "3",
           landId.toString(),
           sellerAmount.toString()]);
    }

    return 1;
  }

  sellLand(landId, price) {
    landId *= 1;
    price *= 1;

    // Check that the user has the land.
    const land = this._getLand(landId);

    if (land.owner != tx.publisher) {
      throw "not your land";
    }

    if (land.renter) {
      throw "in rental";
    }

    // Check that it's not on sale or rent yet.
    if (!land || land.sellPage || land.rentPage) {
      return;
    }

    const now = Math.floor(tx.time / 1e9);
    if (land.oath && now < land.oath + 3600 * 24 * 7) {
      throw "no more change in 7 days";
    }

    const pages = this._getSellPages();

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
    this._setSellPages(pages);

    // Set land.
    land.sellPage = currentPage + 1;
    this._setLand(landId, land);

    // Set offers.
    const offers = this._getSellOffers(currentPage);
    offers.push({
      seller: tx.publisher,
      landId: landId,
      price: price
    });
    this._setSellOffers(currentPage, offers);
  }

  sellCancel(landId) {
    landId *= 1;
    const land = this._getLand(landId);
    
    if (!land) {
      throw "invalid landId";
    }

    const currentPage = land.sellPage - 1;
    if (currentPage < 0) {
      return;
    }

    // Decrease amount in pages.
    const pages = this._getSellPages();
    if (pages[currentPage]) {
      --pages[currentPage];
    }

    this._setSellPages(pages);
        
    // Remove offer from offers.
    const offers = this._getSellOffers(currentPage);
    for (let i = 0; i < offers.length; ++i) {
      if (offers[i].landId == landId) {
        offers.splice(i, 1);
        break;
      }
    }

    this._setSellOffers(currentPage, offers);

    // Set land.
    land.sellPage = 0;
    land.rentPage = 0;
    land.expiration = 0;
    this._setLand(landId, land);
  }

  buyLand(landId) {
    landId *= 1;
    const land = this._getLand(landId);

    if (!land) {
      throw "invalid landId";
    }

    const currentPage = land.sellPage - 1;
    if (currentPage < 0) return 0;

    // Check the offer is there.
    const offers = this._getSellOffers(currentPage);

    const all = offers.filter((offer) => {
      return offer.landId == landId;
    });

    if (all.length <= 0) return 0;

    const offer = all[0];
    const seller = offer.seller;
    const price = offer.price;

    // Check that the user does not own or rent the land yet.
    const user = this._getUser(tx.publisher);
    if (user.landIds.indexOf(landId) >= 0) {
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

    // Set user.
    user.landIds.push(landId);
    this._setUser(tx.publisher, user);

    // Set land.
    land.owner = tx.publisher;
    land.sellPage = 0;
    land.rentPage = 0;
    land.unitIdArray = [];
    land.unitIdTime = 0;
    this._setLand(landId, land);

    // Decrease amount in pages.
    const pages = this._getSellPages();
    if (pages[currentPage]) {
      --pages[currentPage];
    }
    this._setSellPages(pages);

    // Remove offer from offers.
    for (let i = 0; i < offers.length; ++i) {
      if (offers[i].landId == landId) {
        offers.splice(i, 1);
        break;
      }
    }

    this._setSellOffers(currentPage, offers);

    // Remove from seller user.
    const sellerUser = this._getUser(seller);

    if (sellerUser) {
      // Remove units.
      for (let unitId in sellerUser.units) {
        if (sellerUser.units[unitId] == landId) {
          sellerUser.units[unitId] = 0;
        }
      }

      sellerUser.landIds = sellerUser.landIds.filter(id => id != landId);

      this._setUser(seller, sellerUser);

      // Notification
      blockchain.callWithAuth(
          this._getNotificationManager(),
          "add",
          [seller,
           "2",
           landId.toString(),
           sellerAmount.toString()]);
    }

    return 1;
  }

  setUnitIdArray(landId, unitIdArrayStr) {
    landId *= 1;
    const unitIdArray = JSON.parse(unitIdArrayStr);

    if (unitIdArray.length != 3) {
      throw "invalid input";
    }

    const now = Math.floor(tx.time / 1e9);
    const today = this._ceilDate(now);

    const nowRemaining = now % (3600 * 24);
    if (nowRemaining >= 45000 && nowRemaining <= 54000) {
      throw "no change between 20:30 and 23:00";
    }

    const land = this._getLand(landId);
    if (!land) {
      throw "throw invalid land";
    }

    if (land.unitIdTime && this._ceilDate(land.unitIdTime) == today) {
      throw "no more change today";
    }

    land.unitIdTime = now;

    const user = this._getUser(tx.publisher);

    if (user.landIds.indexOf(landId) < 0) {
      // Need to own or rent the land.
      throw "not your land";
    }

    // Refresh this landId, any newly cleaned landId (#1),
    // and all landId with units in it (#2).
    const landIdToRefresh = [landId];

    unitIdArray.forEach((unitId, index) => {
      unitId *= 1;
      const landIdC = user.units[unitId];

      if (land.unitIdArray[index] > 0) {
        user.units[land.unitIdArray[index]] = 0;
      }

      if (unitId && landIdC && landIdC != landId) {
        // Remove from old land
        const oldLand = this._getLand(landIdC);
        for (let i = 0; i < oldLand.unitIdArray.length; ++i) {
          if (oldLand.unitIdArray[i] == unitId) {
            oldLand.unitIdArray[i] = 0;
          }
        }
        this._setLand(landIdC, oldLand);

        if (landIdToRefresh.indexOf(landIdC) < 0) {
          // # 1
          landIdToRefresh.push(landIdC);
        }
      }

      if (unitId) {
        user.units[unitId] = landId;
      }

      land.unitIdArray[index] = unitId;
    });

    this._setLand(landId, land);
    this._setUser(tx.publisher, user);

    for (let unitId in user.units) {
      const landIdC = user.units[unitId];

      if (landIdC && landIdToRefresh.indexOf(landIdC) < 0) {
        // # 2
        landIdToRefresh.push(landIdC);
      }
    }

    return landIdToRefresh;
  }

  getTaxRateAndCityInfo(unitIdArrayStr) {
    const unitIdArray = JSON.parse(unitIdArrayStr);
    const user = this._getUser(tx.publisher);
    return unitIdArray.map(unitId => {
      unitId *= 1;
      let landId = user.units[unitId];

      if (!landId) return [-1, 0];

      let land = this._getLand(landId);
      let city = this._getCity(land.cityId);

      return [10, (city.taxRate || 0), land.cityId, city.owner];
    });
  }

  payTax(cityId, cityOwner, cityAmount, ownerAmount) {
    cityId *= 1;
    cityAmount *= 1;
    ownerAmount *= 1;

    const pool = this._getPool(cityId);
    pool.accumulated = (pool.accumulated || 0) + cityAmount;
    this._setPool(cityId, pool);

    if (ownerAmount > 0) {
      const records = JSON.parse(storage.mapGet("taxRecord", cityId.toString()) || "[]");
      if (records.length >= 50) {
        records.shift();
      }
      records.push([tx.publisher, ownerAmount]);
      storage.mapPut("taxRecord", cityId.toString(), JSON.stringify(records));

      blockchain.callWithAuth(this._getTreasureManager(),
          "debugIssueTo",
          [cityOwner, ownerAmount.toString()]);
    }
  }

  countOfFarms(who) {
    const user = this._getUser(who);
    var farms = [];
    for (let unitId in user.units) {
      let landId = user.units[unitId];
      if (landId) {
        if (farms.indexOf(landId) < 0) {
          farms.push(landId);
        }
      }
    }
    return farms.length;
  }

  removeUnit(who, unitId) {
    unitId *= 1;

    if (!blockchain.requireAuth(this._getUnitManager(), "active")) {
      throw "only unitManager can removeUnit";
    }

    const user = this._getUser(who);

    const landId = user.units[unitId];

    if (landId) {
      const land = this._getLand(landId);
      for (let i = 0; i < land.unitIdArray.length; ++i) {
        if (land.unitIdArray[i] == unitId) {
          land.unitIdArray[i] = 0;
          break;
        }
      }
      this._setLand(landId, land);
    }

    if (user.cityIds.length || user.landIds.length || user.units.length) {
      user.units[unitId] = 0;
      this._setUser(who, user);
    }
  }

  debugSetLandPool() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const amount = +blockchain.callWithAuth(this._getTreasureManager(),
                                            "landSetLandPool",
                                            [])[0];
    if (amount) {
      blockchain.transfer(blockchain.contractName(),
                          this._getTreasureManager(),
                          amount.toString(),
                          "landPool");
    }
  }

  debugDeleteExpiredRental(landId) {
    landId *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const now = Math.floor(tx.time / 1e9);
    const land = this._getLand(landId);
    if (land.renter && land.expiration && now > land.expiration) {
      // Removes from renter.
      const rentUser = this._getUser(land.renter);
      // Remove units.
      for (let unitId in rentUser.units) {
        if (rentUser.units[unitId] == landId) {
          rentUser.units[unitId] = 0;
        }
      }
      rentUser.landIds = rentUser.landIds.filter(id => id != landId);
      this._setUser(land.renter, rentUser);

      // Resets land.
      land.unitIdArray = [];
      land.renter = '';
      this._setLand(landId, land);

      // Adds back to owner.
      const user = this._getUser(land.owner);
      user.landIds.push(landId);
      this._setUser(land.owner, user);
    }
    return [now, land.expiration || 0];
  }

  debugCleanUp() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const cityIds = this._getAllCityIds();
    cityIds.forEach(cityId => {
      const city = this._getCity(cityId);
      city.landIdArray.forEach(landId => {
        storage.mapDel("land", landId.toString());
      });
      storage.mapDel("city", cityId.toString());
    });

    storage.del("rent_pages");
    storage.mapDel("rent_offers", "0");
    storage.del("sell_pages");
    storage.mapDel("sell_offers", "0");
    storage.del("all_city_ids");
    storage.mapDel("user", "unseenmagic");
    storage.mapDel("user", "sanguopk");
    storage.del("stat");

    const total = +blockchain.call("token.iost", "balanceOf", ["iost", blockchain.contractName()])[0];;

    blockchain.withdraw(tx.publisher,
                        total.toString(),
                        "withdraw");
  }

  debugSetDefensePoints(dataStr) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const data = JSON.parse(dataStr);

    for (let cityId in data) {
      const points = data[cityId];

      storage.mapPut("defense_points", cityId.toString(), JSON.stringify(points));
    }
  }

  debugRefreshPoints() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const now = Math.floor(tx.time / 1e9);
    const today = this._ceilDate(now);

    const allCityIds = JSON.parse(storage.get("all_city_ids") || "[]");

    allCityIds.forEach(cityId => {
      let defensePoints = JSON.parse(storage.mapGet("defense_points", cityId.toString()) || "{}");
      if (defensePoints['-date'] != today) {
        defensePoints = {
          '-date': today
        };
      }
      storage.mapPut("defense_points", cityId.toString(), JSON.stringify(defensePoints));

      let attackPoints = JSON.parse(storage.mapGet("attack_points", cityId.toString()) || "{}");
      if (attackPoints['-date'] != today) {
        attackPoints = {
          '-date': today
        };
      }
      storage.mapPut("attack_points", cityId.toString(), JSON.stringify(attackPoints));
    });
  }

  debugWritePoints() {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const now = Math.floor(tx.time / 1e9);
    const today = this._ceilDate(now);

    const allCityIds = JSON.parse(storage.get("all_city_ids") || "[]");

    var sum = 0;

    allCityIds.forEach(cityId => {
      let attackPoints = JSON.parse(storage.mapGet("attack_points", cityId.toString()) || "{}");

      for (let who in attackPoints) {
        if (who == '-date') continue;

        sum += attackPoints[who] * 1;

        storage.mapPut("attack_points_by_user", who, JSON.stringify({
          count: attackPoints[who] * 1,
          date: today
        }));
      }
    });

    storage.mapPut("attack_points_by_user", "SUM", JSON.stringify({
      count: sum,
      date: today
    }));
  }

  debugRemoveUnownedLandId(who) {
    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const user = this._getUser(who);

    if (!user.cityIds.length && !user.landIds.length && !user.units.length) {
      return;
    }

    for (let unitId in user.units) {
      const landId = user.units[unitId];
      if (landId) {
        const land = this._getLand(landId);
        if (land.renter) {
          if (land.renter != who) {
            user.units[unitId] = 0;
          }
        } else if (land.owner != who) {
          user.units[unitId] = 0;
        }
      }
    }

    this._setUser(who, user);
  }

  debugSetDefeated(cityId) {
    cityId *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const now = Math.floor(tx.time / 1e9);

    const city = this._getCity(cityId);
    city.defeat = now;
    this._setCity(cityId, city);
  }

  debugChangeCityOwner(cityId, owner) {
    cityId *= 1;

    if (!blockchain.requireAuth(blockchain.contractOwner(), "active")) {
      throw "only owner can change";
    }

    const city = this._getCity(cityId);
    city.owner = owner;
    this._setCity(cityId, city);
  }
}

module.exports = LandManager;
