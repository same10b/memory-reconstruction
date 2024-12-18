class BlockManager {
  constructor() {
    // キーワードグループの定義
    this.keywordGroups = [
      ["水族館"],
      ["フリッパープール"],
      ["イルカ"],
      ["黄色", "オレンジ", "屋根"],
      ["青"],
      ["水面", "水"],
      ["2人"],
      ["女性", "人"],
      ["飼育員"],
      ["スタッフ"],
      ["木"]
    ];

    this.allKeywords = this.keywordGroups.flat();
    this.inputHistory = [];
    this.lastInputTime = Date.now();
    this.deletedChars = new Map();
  }

  distributeKeywords() {
    let extendedKeywords = [];
    const blocksPerKeyword = Math.ceil(570 / this.keywordGroups.length);
    
    for (let i = 0; i < blocksPerKeyword; i++) {
      extendedKeywords = extendedKeywords.concat(this.keywordGroups);
    }
    
    extendedKeywords = extendedKeywords.slice(0, 570);
    
    for (let i = extendedKeywords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [extendedKeywords[i], extendedKeywords[j]] = [extendedKeywords[j], extendedKeywords[i]];
    }
    
    return extendedKeywords;
  }

  calculateGrid(totalBlocks) {
    if (totalBlocks === 0) return { cols: 1, rows: 1 };
    const ratio = 4 / 3;
    const cols = Math.ceil(Math.sqrt(totalBlocks * ratio));
    const rows = Math.ceil(totalBlocks / cols);
    return { cols, rows };
  }

  lightenColor(color) {
    if (!color) return '#ffffff';
    const r = parseInt(color.slice(1,3), 16);
    const g = parseInt(color.slice(3,5), 16);
    const b = parseInt(color.slice(5,7), 16);
    const brighten = (c) => Math.min(255, c + 40).toString(16).padStart(2, '0');
    return `#${brighten(r)}${brighten(g)}${brighten(b)}`;
  }

  darkenColor(color) {
    if (!color) return '#cccccc';
    const r = parseInt(color.slice(1,3), 16);
    const g = parseInt(color.slice(3,5), 16);
    const b = parseInt(color.slice(5,7), 16);
    const darken = (c) => Math.max(0, c - 40).toString(16).padStart(2, '0');
    return `#${darken(r)}${darken(g)}${darken(b)}`;
  }
}

// グローバルで利用可能にする
window.BlockManager = BlockManager;