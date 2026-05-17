import GameData from './data.js';
import InventoryManager from './inventory.js';
import AppUI from './app.js';
import Modal from './modal.js';

document.addEventListener('DOMContentLoaded', async () => {
  const gameData = new GameData();
  try {
    await gameData.init();
    
    document.getElementById('loading-overlay').classList.add('hidden');
    document.getElementById('view-main').classList.remove('hidden');

    const inventory = new InventoryManager();
    const app = new AppUI(gameData, inventory);
  } catch (error) {
    document.getElementById('loading-overlay').classList.add('hidden');
    Modal.alert("데이터를 불러오는 데 실패했습니다.<br>새로고침 해주세요.");
  }
});
