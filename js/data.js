export default class GameData {
  constructor() {
    this.weaponList = [];
    this.dungeonList = [];
    this.allBases = [];
    this.allExtras = [];
    this.allSkills = [];
  }

  async init() {
    try {
      const [weaponsResponse, dungeonsResponse] = await Promise.all([
        fetch('./data/weapons.json'),
        fetch('./data/dungeons.json')
      ]);

      if (!weaponsResponse.ok || !dungeonsResponse.ok) {
        throw new Error("데이터를 불러오는 데 실패했습니다.");
      }

      this.weaponList = await weaponsResponse.json();
      this.dungeonList = await dungeonsResponse.json();

      this._processSets();
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      throw error;
    }
  }

  _processSets() {
    const baseSet = new Set();
    const extraSet = new Set();
    const skillSet = new Set();

    this.weaponList.forEach(weapon => {
      if(weapon.base) baseSet.add(weapon.base);
      if(weapon.extra) extraSet.add(weapon.extra);
      if(weapon.skill) skillSet.add(weapon.skill);
    });

    this.dungeonList.forEach(dungeon => {
      if(dungeon.base) dungeon.base.forEach(stat => baseSet.add(stat));
      if(dungeon.extra) dungeon.extra.forEach(stat => extraSet.add(stat));
      if(dungeon.skill) dungeon.skill.forEach(stat => skillSet.add(stat));
    });
    
    this.allBases = [...baseSet].sort((a, b) => a.localeCompare(b));
    this.allExtras = [...extraSet].sort((a, b) => a.localeCompare(b));
    this.allSkills = [...skillSet].sort((a, b) => a.localeCompare(b));
  }
}
