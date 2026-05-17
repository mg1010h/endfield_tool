export default class Optimizer {
  static getCombinations(array, selectNum) {
    const combinationsList = [];
    if (selectNum === 1) return array.map(value => [value]);
    array.forEach((fixedValue, index, originalArray) => {
      const restArray = originalArray.slice(index + 1);
      const combinationsOfRest = Optimizer.getCombinations(restArray, selectNum - 1);
      const attachedCombinations = combinationsOfRest.map(combination => [fixedValue, ...combination]);
      combinationsList.push(...attachedCombinations);
    });
    return combinationsList;
  }

  static calculate(dungeonData, allWeapons, userInventory, starWeight = 1) {
    const validWeapons = allWeapons.filter(weapon => 
      dungeonData.base.includes(weapon.base) && dungeonData.extra.includes(weapon.extra) && dungeonData.skill.includes(weapon.skill)
    );
    const targetWeapons = validWeapons.filter(weapon => !userInventory.isWeaponOwned(weapon.id));
    if (targetWeapons.length === 0) return [];

    const baseStatCombinations = Optimizer.getCombinations(dungeonData.base, 3);
    const optimizationStrategies = [];

    baseStatCombinations.forEach(baseStats => {
      dungeonData.extra.forEach(fixedExtraStat => {
        const targetedList = targetWeapons.filter(weapon => baseStats.includes(weapon.base) && weapon.extra === fixedExtraStat);
        if (targetedList.length > 0) optimizationStrategies.push({ baseStats, fixedType: "추가", fixedStat: fixedExtraStat, targetedWeapons: targetedList });
      });

      dungeonData.skill.forEach(fixedSkillStat => {
        const targetedList = targetWeapons.filter(weapon => baseStats.includes(weapon.base) && weapon.skill === fixedSkillStat);
        if (targetedList.length > 0) optimizationStrategies.push({ baseStats, fixedType: "스킬", fixedStat: fixedSkillStat, targetedWeapons: targetedList });
      });
    });

    let filteredStrategies = optimizationStrategies.filter(strategy => strategy.targetedWeapons.length >= 1);

    filteredStrategies.sort((strategyA, strategyB) => {
      const getScore = (weaponList) => weaponList.reduce((sum, weapon) => sum + (userInventory.isWeaponBookmarked(weapon.id) ? starWeight : 1), 0);

      const scoreA = getScore(strategyA.targetedWeapons);
      const scoreB = getScore(strategyB.targetedWeapons);
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      if (strategyB.targetedWeapons.length !== strategyA.targetedWeapons.length) return strategyB.targetedWeapons.length - strategyA.targetedWeapons.length;
      
      const countRarity = (weaponList, rarity) => weaponList.filter(weapon => weapon.rarity === rarity).length;
      const tier6CountA = countRarity(strategyA.targetedWeapons, 6); const tier6CountB = countRarity(strategyB.targetedWeapons, 6);
      if (tier6CountA !== tier6CountB) return tier6CountB - tier6CountA;

      const tier5CountA = countRarity(strategyA.targetedWeapons, 5); const tier5CountB = countRarity(strategyB.targetedWeapons, 5);
      if (tier5CountA !== tier5CountB) return tier5CountB - tier5CountA;

      return 0;
    });

    filteredStrategies.forEach(strategy => {
      strategy.targetedWeapons.sort((weaponA, weaponB) => weaponB.rarity - weaponA.rarity);
    });

    return filteredStrategies;
  }
}