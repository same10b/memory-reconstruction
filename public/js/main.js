// Socket.IOクライアントの初期化
const socket = io();

// BlockManagerのインスタンス化
const blockManager = new BlockManager();

// 必要な変数の初期化
const blockColors = [/* カラーコード配列は省略 */];
const shuffledKeywords = blockManager.distributeKeywords();

// メインのブロック配列の初期化
const outputBlocks = Array.from({ length: 570 }, (_, index) => ({
  color: blockColors[index % blockColors.length],
  keywordGroup: shuffledKeywords[index],
  filled: false,
  highlight: false
}));

// ランダムブロック配列の初期化
const randomBlocks = Array.from({ length: 260 }, (_, index) => ({
  color: blockManager.lightenColor(blockColors[index % blockColors.length]),
  filled: false,
  deleted: false,
  char: null
}));

// 出力ブロックの描画処理
function renderOutputBlocks() {
  const outputText = document.getElementById("outputText");
  if (!outputText) return;

  const existingBlocks = outputText.children;
  outputBlocks.forEach((block, index) => {
    let div = existingBlocks[index];
    if (!div) {
      div = document.createElement("div");
      div.className = "block";
      outputText.appendChild(div);
    }
    
    div.className = `block${block.highlight ? ' highlight' : ''}`;
    div.style.backgroundColor = block.filled ? block.color : "#f0f0f0";
    div.style.transition = `background-color 0.3s ease ${index * 0.001}s`;
  });

  // 状態の同期
  socket.emit('blockUpdate', {
    type: 'output',
    blocks: outputBlocks
  });
}

// ランダムブロックの描画処理
function renderRandomBlocks() {
  const randomBlocksDiv = document.getElementById("randomBlocks");
  if (!randomBlocksDiv) return;

  const filledBlocks = randomBlocks.filter(block => block.filled || block.deleted);
  
  if (filledBlocks.length > 0) {
    const grid = blockManager.calculateGrid(filledBlocks.length);
    randomBlocksDiv.style.gridTemplateColumns = `repeat(${grid.cols}, 1fr)`;
    
    const existingBlocks = randomBlocksDiv.children;
    filledBlocks.forEach((block, index) => {
      let div = existingBlocks[index];
      if (!div) {
        div = document.createElement("div");
        randomBlocksDiv.appendChild(div);
      }
      
      div.className = `block${block.deleted ? ' deleted' : ''}`;
      div.style.backgroundColor = block.deleted ? 
        blockManager.darkenColor(block.color) : 
        blockManager.lightenColor(block.color);
      div.style.transition = `all 0.3s ease ${index * 0.01}s`;
    });

    while (randomBlocksDiv.children.length > filledBlocks.length) {
      randomBlocksDiv.removeChild(randomBlocksDiv.lastChild);
    }
  } else {
    randomBlocksDiv.innerHTML = "";
  }

  // 状態の同期
  socket.emit('blockUpdate', {
    type: 'random',
    blocks: randomBlocks
  });
}
// 入力処理
function processInput() {
  const inputText = document.getElementById("inputText");
  if (!inputText) return;
  const currentText = inputText.value;
  const currentTime = Date.now();

  // 出力ブロックの状態更新
  const previousState = outputBlocks.map(block => block.filled);
  outputBlocks.forEach((block, index) => {
    const wasFilledBefore = previousState[index];
    block.filled = block.keywordGroup.some(keyword => currentText.includes(keyword));

    if (!wasFilledBefore && block.filled) {
      block.highlight = true;
      setTimeout(() => {
        block.highlight = false;
        renderOutputBlocks();
      }, 500);
    }
  });

  // 削除された文字の処理
  const previousText = blockManager.inputHistory.length > 0 
    ? blockManager.inputHistory[blockManager.inputHistory.length - 1].text 
    : "";

  if (currentText.length < previousText.length) {
    for(let i = 0; i < previousText.length; i++) {
      if (previousText[i] !== currentText[i]) {
        blockManager.deletedChars.set(previousText[i], i);
        break;
      }
    }
  }

  // キーワード以外の文字の処理
  const nonKeywordChars = [...currentText].filter(char => {
    if (!char.trim()) return false;
    return !blockManager.allKeywords.some(keyword => keyword.includes(char));
  });

  // ランダムブロックの状態更新
  randomBlocks.forEach((block, index) => {
    const isDeleted = Array.from(blockManager.deletedChars.values()).includes(index);
    
    if (isDeleted) {
      block.deleted = true;
      block.filled = false;
    } else if (index < nonKeywordChars.length) {
      block.filled = true;
      block.deleted = false;
      block.char = nonKeywordChars[index];
    } else {
      block.filled = false;
      block.deleted = false;
      block.char = null;
    }
  });

  // 入力履歴の更新
  if (currentText !== previousText) {
    blockManager.inputHistory.push({
      text: currentText,
      timestamp: currentTime
    });
    blockManager.lastInputTime = currentTime;

    // 入力状態の同期
    socket.emit('inputUpdate', {
      text: currentText,
      timestamp: currentTime
    });
  }

  renderOutputBlocks();
  renderRandomBlocks();
}

// リセット処理
function resetAll() {
  const inputText = document.getElementById("inputText");
  if (!inputText) return;
  
  inputText.value = "";
  blockManager.inputHistory = [];
  blockManager.lastInputTime = Date.now();
  blockManager.deletedChars = new Map();

  outputBlocks.forEach(block => {
    block.filled = false;
    block.highlight = false;
  });

  randomBlocks.forEach(block => {
    block.filled = false;
    block.deleted = false;
    block.char = null;
  });

  renderOutputBlocks();
  renderRandomBlocks();

  // リセット状態の同期
  socket.emit('reset');
}

// スクリーンショット処理
async function captureBlocks() {
  const inputText = document.getElementById("inputText");
  if (!inputText) return;

  const currentText = inputText.value;
  const nonKeywords = [...currentText].filter(char => {
    if (!char.trim()) return false;
    return !blockManager.allKeywords.some(keyword => keyword.includes(char));
  }).join('');

  const now = new Date();
  const dateString = now.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const randomBlocksDiv = document.getElementById("randomBlocks");
  if (!randomBlocksDiv) return;

  const canvas = await html2canvas(randomBlocksDiv);
  
  const finalCanvas = document.createElement('canvas');
  const ctx = finalCanvas.getContext('2d');
  
  finalCanvas.width = canvas.width + 200;
  finalCanvas.height = canvas.height + 250;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  
  ctx.drawImage(canvas, 100, 100);
  
  ctx.font = '14px "Courier New"';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText(dateString, finalCanvas.width/2, canvas.height + 160);
  ctx.fillText(nonKeywords, finalCanvas.width/2, canvas.height + 190);
  
  const downloadLink = document.createElement('a');
  downloadLink.download = `memory_${now.getTime()}.png`;
  downloadLink.href = finalCanvas.toDataURL();
  downloadLink.click();
}

// イベントリスナーの初期化
function initializeEventListeners() {
  const inputText = document.getElementById("inputText");
  const resetButton = document.getElementById("resetButton");
  const captureButton = document.getElementById("captureButton");

  if (inputText) {
    inputText.addEventListener("input", processInput);
  }

  if (resetButton) {
    resetButton.addEventListener("click", resetAll);
  }

  if (captureButton) {
    captureButton.addEventListener("click", captureBlocks);
  }

  // Socket.IOイベントリスナー
  socket.on('blockUpdate', (data) => {
    if (data.type === 'output') {
      Object.assign(outputBlocks, data.blocks);
      renderOutputBlocks();
    } else if (data.type === 'random') {
      Object.assign(randomBlocks, data.blocks);
      renderRandomBlocks();
    }
  });

  socket.on('inputUpdate', (data) => {
    if (inputText && data.text !== inputText.value) {
      inputText.value = data.text;
      processInput();
    }
  });

  socket.on('reset', resetAll);
}

// DOMロード時の初期化
window.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  renderOutputBlocks();
  renderRandomBlocks();
});