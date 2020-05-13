# Background and Restrictions

This is the smart contract part of the Crypto Sanguo game (http://sanguo.pk).

Per the request of some players, I open source Cypto Sanguo with the following restrictions:


1) The license of the code will be GPL, that any forked project also need to be open source, and give some credit to Crypto Sanguo.

2) The code will open source, but the art assets won't be. I will reserve all the art assets for my future games, and they are still **proprietary**.

3) The forked project can't be another Sanguo game. The forked one needs to use some new theme.

At some point in the future I will create Cypto Sanguo II, but for now, I decide to give away the Sanguo code for free for the good of the community.

If someone got inspired by Crypto Sanguo, and can create some better game I will be very happy.


# Instructions

All the code are under IOST blockchain.

You need to do the following:

1) Deploy the smart contract to IOST
2) Link the smart contracts to each other by calling functions like "setAccount", "setTreasureManager" etc.
3) Add values to the smart contracts by calling functions like "setUnit(unitId, json)". All the json data are under "json"

# To Maintain

Daily you need to run some scripts, which are all under "daily-scripts"
