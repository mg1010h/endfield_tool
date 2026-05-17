import Optimizer from './optimizer.js';
import Modal from './modal.js';

export default class AppUI {
  constructor(gameData, inventory) {
    this.gameDatabase = gameData;
    this.userInventory = inventory;

    this.dom = {
      viewMain: document.getElementById('view-main'),
      viewDungeon: document.getElementById('view-dungeon'),
      allWeaponsGrid: document.getElementById('all-weapons'),
      dungeonButtons: document.getElementById('dungeon-buttons'),
      resultBody: document.getElementById('result-tbody'),
      filterBase: document.getElementById('filter-base'),
      filterExtra: document.getElementById('filter-extra'),
      filterSkill: document.getElementById('filter-skill'),
      viewFarming: document.getElementById('view-farming'),
      farmingTitle: document.getElementById('farming-title'),
      farmingSettingDesc: document.getElementById('farming-setting-desc'),
      farmingGrid: document.getElementById('farming-weapons-grid')
    };

    this.currentDungeonName = "";
    this.dungeonButtonElements = [];
    this.init();
  }

  init() {
    this.setupFilters();
    this.setupDungeonButtons();
    this.setupEventHandlers();
    this.renderAllWeapons();
  }

  setupFilters() {
    const populate = (selectElem, dataList) => {
      dataList.forEach(item => {
        const option = document.createElement('option');
        option.value = item; option.textContent = item;
        selectElem.appendChild(option);
      });
    };
    populate(this.dom.filterBase, this.gameDatabase.allBases);
    populate(this.dom.filterExtra, this.gameDatabase.allExtras);
    populate(this.dom.filterSkill, this.gameDatabase.allSkills);
  }

  getDungeonStarCount(dungeon) {
    let starCount = 0;
    this.gameDatabase.weaponList.forEach(weapon => {
      if (
        !this.userInventory.isWeaponOwned(weapon.id) &&
        this.userInventory.isWeaponBookmarked(weapon.id) &&
        dungeon.base.includes(weapon.base) &&
        dungeon.extra.includes(weapon.extra) &&
        dungeon.skill.includes(weapon.skill)
      ) {
        starCount++;
      }
    });
    return starCount;
  }

  setupDungeonButtons() {
    this.dom.dungeonButtons.innerHTML = '';
    this.dungeonButtonElements = [];

    this.gameDatabase.dungeonList.forEach((dungeon, index) => {
      const btn = document.createElement('button');
      btn.className = 'btn-dungeon';

      const count = this.getDungeonStarCount(dungeon);
      const badgeHtml = count > 0 ? `<div class="star-badge">⭐ <span class="badge-count">${count}</span></div>` : '';
      
      btn.innerHTML = `<div class="dungeon-name-text">${dungeon.name}</div>${badgeHtml}`;
      btn.onclick = () => this.openDungeonView(index);
      
      this.dom.dungeonButtons.appendChild(btn);
      this.dungeonButtonElements.push({ dungeon, btn });
    });
  }

  updateDungeonBadges() {
    this.dungeonButtonElements.forEach(({ dungeon, btn }) => {
      const count = this.getDungeonStarCount(dungeon);
      let badge = btn.querySelector('.star-badge');
      
      if (count > 0) {
        if (badge) {
          badge.querySelector('.badge-count').innerText = count;
        } else {
          badge = document.createElement('div');
          badge.className = 'star-badge';
          badge.innerHTML = `⭐ <span class="badge-count">${count}</span>`;
          btn.appendChild(badge);
        }
      } else {
        if (badge) {
          badge.remove();
        }
      }
    });
  }

  setupEventHandlers() {
    document.getElementById('btn-export').addEventListener('click', async () => {
      const code = this.userInventory.getDeckCode();
      if(!code) return Modal.alert("체크된 기질이 없습니다.");
      
      const input = document.getElementById('deck-code-input');
      input.value = code;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          Modal.alert("코드가 복사되었습니다!\n");
          return;
        } catch (err) {
          console.error('Clipboard API failed', err);
        }
      }
      
      input.select(); 
      document.execCommand('copy');
      Modal.alert("코드가 복사되었습니다!\n");
    });

    document.getElementById('btn-import').addEventListener('click', () => {
      const code = document.getElementById('deck-code-input').value.trim();
      if(this.userInventory.importDeckCode(code)) {
        this.renderAllWeapons();
        this.updateDungeonBadges();
        Modal.alert("기질 목록을 성공적으로 불러왔습니다!");
      } else {
        Modal.alert("유효하지 않은 코드입니다.");
      }
    });

    document.getElementById('btn-home').addEventListener('click', () => {
      this.dom.viewDungeon.classList.add('hidden');
      this.dom.viewMain.classList.remove('hidden');
    });

    [this.dom.filterBase, this.dom.filterExtra, this.dom.filterSkill].forEach(select => {
      select.addEventListener('change', () => this.renderAllWeapons());
    });
    
    document.getElementById('btn-reset-filter').addEventListener('click', () => {
      this.dom.filterBase.value = "";
      this.dom.filterExtra.value = "";
      this.dom.filterSkill.value = "";
      this.renderAllWeapons();
    });

    document.getElementById('btn-end-farming').addEventListener('click', () => {
      this.dom.viewFarming.classList.add('hidden');
      this.dom.viewMain.classList.remove('hidden');
      this.renderAllWeapons();
      this.updateDungeonBadges();
      Modal.alert("파밍 결과가 보유 현황에 업데이트 되었습니다!");
    });
  }

  renderAllWeapons() {
    const selectedBaseStatFilter = this.dom.filterBase.value;
    const selectedExtraStatFilter = this.dom.filterExtra.value;
    const selectedSkillStatFilter = this.dom.filterSkill.value;

    const filteredWeapons = this.gameDatabase.weaponList.filter(weapon => {
      return (!selectedBaseStatFilter || weapon.base === selectedBaseStatFilter) &&
             (!selectedExtraStatFilter || weapon.extra === selectedExtraStatFilter) &&
             (!selectedSkillStatFilter || weapon.skill === selectedSkillStatFilter);
    });

    this.dom.allWeaponsGrid.innerHTML = '';
    
    if(filteredWeapons.length === 0) {
      this.dom.allWeaponsGrid.innerHTML = '<p style="color:#888;">조건에 맞는 무기가 없습니다.</p>';
      return;
    }

    filteredWeapons.forEach(weapon => {
      const card = document.createElement('div');
      const isBookmarked = this.userInventory.isWeaponBookmarked(weapon.id);
      card.className = `weapon-card ${this.userInventory.isWeaponOwned(weapon.id) ? 'owned' : ''}`;
      
      card.innerHTML = `
        <div class="star-btn ${isBookmarked ? 'active' : 'inactive'}">⭐</div>
        <div class="type">${weapon.type}</div>
        <div class="name rarity-${weapon.rarity}">${weapon.name}</div>
        <div class="stats">
          <span>${weapon.base}</span>
          <span>${weapon.extra}</span>
          <span>${weapon.skill}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.userInventory.toggleWeaponOwnership(weapon.id);
        card.classList.toggle('owned');
        this.updateDungeonBadges();
      });

      const starBtn = card.querySelector('.star-btn');
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.userInventory.toggleWeaponBookmark(weapon.id);
        starBtn.classList.toggle('active');
        starBtn.classList.toggle('inactive');
        this.updateDungeonBadges();
      });

      this.dom.allWeaponsGrid.appendChild(card);
    });
  }

  openDungeonView(index) {
    const dungeon = this.gameDatabase.dungeonList[index];
    if (dungeon.base.length === 0) return Modal.alert("아직 데이터가 준비되지 않았습니다.");

    this.currentDungeonName = dungeon.name;

    this.dom.viewMain.classList.add('hidden');
    this.dom.viewDungeon.classList.remove('hidden');
    document.getElementById('dungeon-title').innerText = dungeon.name;

    const weightSelect = document.getElementById('filter-star-weight');
    const starWeight = weightSelect ? parseInt(weightSelect.value) : 1;

    const optimizationStrategies = Optimizer.calculate(dungeon, this.gameDatabase.weaponList, this.userInventory, starWeight);
    this.renderOptimizationResults(optimizationStrategies);
  }

  renderOptimizationResults(optimizationStrategies) {
    this.dom.resultBody.innerHTML = '';
    
    if(optimizationStrategies.length === 0) {
      this.dom.resultBody.innerHTML = '<tr><td colspan="4" class="center">이 지역에서 목표로 할 기질이 없습니다.</td></tr>';
      return;
    }

    optimizationStrategies.forEach((strategy, index) => {
      const weaponTags = strategy.targetedWeapons.map(weapon => {
        const isBookmarked = this.userInventory.isWeaponBookmarked(weapon.id);
        const starClass = isBookmarked ? 'starred-glow' : '';
        const starIcon = isBookmarked ? '⭐' : '';
        return `<span class="target-weapon rarity-${weapon.rarity} ${starClass}">${starIcon}${weapon.name}</span>`;
      }).join('');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="center">${strategy.baseStats.join(', ')}</td>
        <td class="center">[${strategy.fixedType}] ${strategy.fixedStat}</td>
        <td>${weaponTags}</td>
      `;
      
      tr.addEventListener('click', async () => {
        const isOk = await Modal.confirm("이 세팅으로 파밍을 시작하시겠습니까?");
        
        if (isOk) {
          this.openFarmingMode(strategy);
        }
      });

      this.dom.resultBody.appendChild(tr);
    });
  }

  openFarmingMode(strategy) {
    this.dom.viewDungeon.classList.add('hidden');
    this.dom.viewFarming.classList.remove('hidden');

    this.dom.farmingTitle.innerText = `${this.currentDungeonName} 파밍 중`;
    this.dom.farmingSettingDesc.innerHTML = `
      <strong>기초 속성:</strong> ${strategy.baseStats.join(', ')} <br>
      <strong>확정 속성:</strong> [${strategy.fixedType}] ${strategy.fixedStat}
    `;

    this.renderFarmingGrid(strategy.targetedWeapons);
  }

  renderFarmingGrid(targetedWeapons) {
    this.dom.farmingGrid.innerHTML = '';

    targetedWeapons.forEach(weapon => {
      const card = document.createElement('div');
      card.className = `weapon-card ${this.userInventory.isWeaponOwned(weapon.id) ? 'owned' : ''}`;
      
      card.innerHTML = `
        <div class="type">${weapon.type}</div>
        <div class="name rarity-${weapon.rarity}">${weapon.name}</div>
        <div class="stats">
          <span>${weapon.base}</span>
          <span>${weapon.extra}</span>
          <span>${weapon.skill}</span>
        </div>
      `;
      
      card.addEventListener('click', () => {
        this.userInventory.toggleWeaponOwnership(weapon.id);
        card.classList.toggle('owned');
      });
      
      this.dom.farmingGrid.appendChild(card);
    });
  }
}
