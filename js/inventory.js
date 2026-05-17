export default class InventoryManager {
  constructor() {
    this.ownedWeaponIds = new Set();
    this.bookmarkedWeaponIds = new Set();

    this.CODE_LENGTH = 32; 
    this.XOR_KEY = 0x5A; 

    this.load();
  }

  load() {
    const savedOwnedWeaponData = localStorage.getItem('endfield_owned_weapons');
    if (savedOwnedWeaponData) this.ownedWeaponIds = new Set(JSON.parse(savedOwnedWeaponData));
    
    const savedBookmarkedWeaponData = localStorage.getItem('endfield_starred_weapons');
    if (savedBookmarkedWeaponData) {
      this.bookmarkedWeaponIds = new Set(JSON.parse(savedBookmarkedWeaponData));
    } else {
      this.bookmarkedWeaponIds = new Set(); 
    }
  }

  save() {
    localStorage.setItem('endfield_owned_weapons', JSON.stringify(Array.from(this.ownedWeaponIds)));
    localStorage.setItem('endfield_starred_weapons', JSON.stringify([...this.bookmarkedWeaponIds]));
  }

  toggleWeaponOwnership(weaponId) {
    if (this.ownedWeaponIds.has(weaponId)) this.ownedWeaponIds.delete(weaponId);
    else this.ownedWeaponIds.add(weaponId);
    this.save();
  }

  isWeaponOwned(weaponId) { return this.ownedWeaponIds.has(weaponId); }

  toggleWeaponBookmark(weaponId) {
    if (this.bookmarkedWeaponIds.has(weaponId)) this.bookmarkedWeaponIds.delete(weaponId);
    else this.bookmarkedWeaponIds.add(weaponId);
    this.save();
  }

  isWeaponBookmarked(weaponId) { return this.bookmarkedWeaponIds.has(weaponId); }

  getDeckCode() {
    if (this.ownedWeaponIds.size === 0 && this.bookmarkedWeaponIds.size === 0) return null;
    
    const saveDataBytes = new Uint8Array(this.CODE_LENGTH);
    const maxWeapons = this.CODE_LENGTH * 4;
    
    for (let weaponId = 0; weaponId < maxWeapons; weaponId++) {
      const bitPos = weaponId * 2;
      const byteIdx = Math.floor(bitPos / 8);
      const bitOffset = bitPos % 8;

      if (this.ownedWeaponIds.has(weaponId)) saveDataBytes[byteIdx] |= (1 << bitOffset);
      if (this.bookmarkedWeaponIds.has(weaponId)) saveDataBytes[byteIdx] |= (1 << (bitOffset + 1));
    }

    let binarySaveData = '';
    for (let i = 0; i < saveDataBytes.length; i++) {
      binarySaveData += String.fromCharCode(saveDataBytes[i] ^ ((this.XOR_KEY + i * 13) % 256));
    }
    return btoa(binarySaveData);
  }

  importDeckCode(code) {
    try {
      const decodedSaveData = atob(code);
      if (decodedSaveData.startsWith('[')) {
        const parsedWeaponIdArray = JSON.parse(decodedSaveData);
        if(Array.isArray(parsedWeaponIdArray)) {
          this.ownedWeaponIds = new Set(parsedWeaponIdArray);
          this.bookmarkedWeaponIds.clear();
          this.save();
          return true;
        }
      }

      if (decodedSaveData.length === 16) {
        const importedOwnedWeaponIds = new Set();
        for (let i = 0; i < 16; i++) {
          const byte = decodedSaveData.charCodeAt(i);
          for (let bit = 0; bit < 8; bit++) {
            if (byte & (1 << bit)) importedOwnedWeaponIds.add(i * 8 + bit);
          }
        }
        this.ownedWeaponIds = importedOwnedWeaponIds;
        this.bookmarkedWeaponIds.clear();
        this.save(); 
        return true;
      }

      if (decodedSaveData.length === 20) {
        const importedOwnedWeaponIds = new Set(); 
        const importedBookmarkedWeaponIds = new Set();

        for (let i = 0; i < decodedSaveData.length; i++) {
          const byte = decodedSaveData.charCodeAt(i);
          for (let bitOffset = 0; bitOffset < 8; bitOffset += 2) {
            const weaponId = (i * 8 + bitOffset) / 2;
            if (byte & (1 << bitOffset)) importedOwnedWeaponIds.add(weaponId);
            if (byte & (1 << (bitOffset + 1))) importedBookmarkedWeaponIds.add(weaponId);
          }
        }
        this.ownedWeaponIds = importedOwnedWeaponIds; 
        this.bookmarkedWeaponIds = importedBookmarkedWeaponIds;
        this.save(); 
        return true;
      }

      if (decodedSaveData.length === this.CODE_LENGTH) {
        const importedOwnedWeaponIds = new Set(); 
        const importedBookmarkedWeaponIds = new Set();

        for (let i = 0; i < decodedSaveData.length; i++) {
          const byte = decodedSaveData.charCodeAt(i) ^ ((this.XOR_KEY + i * 13) % 256);
          for (let bitOffset = 0; bitOffset < 8; bitOffset += 2) {
            const weaponId = (i * 8 + bitOffset) / 2;
            if (byte & (1 << bitOffset)) importedOwnedWeaponIds.add(weaponId);
            if (byte & (1 << (bitOffset + 1))) importedBookmarkedWeaponIds.add(weaponId);
          }
        }
        this.ownedWeaponIds = importedOwnedWeaponIds; 
        this.bookmarkedWeaponIds = importedBookmarkedWeaponIds;
        this.save(); 
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
}