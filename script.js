const X = 'x';
const O = 'circle';
const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const board = document.getElementById('board');
const menu = document.getElementById('menu');
const modeBtns = document.querySelectorAll('.mode');
const turnLabel = document.getElementById('turnIndicator');
const scoreBoard = document.getElementById('scoreBoard');
const xScoreEl = document.getElementById('xScore');
const oScoreEl = document.getElementById('oScore');
const msgBox = document.getElementById('winningMessage');
const msgTxt = document.querySelector('[data-winning-message-text]');
const restartBtn = document.getElementById('restartButton');

let circleTurn = false;
let cells = [];
let aiMode = null;
let xWins = 0, oWins = 0;

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    aiMode = btn.dataset.mode === 'friend' ? null : btn.dataset.mode;
    menu.style.display = 'none';
    turnLabel.hidden = false;
    scoreBoard.hidden = false;
    startGame();
  });
});

restartBtn.addEventListener('click', showMenu);

function showMenu() {
  msgBox.classList.remove('show');
  msgBox.style.display = 'none';
  board.innerHTML = '';
  menu.style.display = 'flex';
  turnLabel.hidden = true;
  scoreBoard.hidden = true;
}

function startGame() {
  msgBox.classList.remove('show');
  msgBox.style.display = 'none';
  board.innerHTML = '';
  circleTurn = false;
  for (let i = 0; i < 9; i++) createCell();
  cells = Array.from(board.querySelectorAll('[data-cell]'));
  setHover();
}

function createCell() {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.cell = '';
  cell.role = 'gridcell';
  cell.tabIndex = 0;
  cell.addEventListener('click', handleClick, { once: true });
  cell.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !cell.classList.contains(X) && !cell.classList.contains(O)) {
      e.preventDefault();
      cell.click();
    }
  });
  board.appendChild(cell);
}

function handleClick(e) {
  const cell = e.target;
  if (cell.classList.contains(X) || cell.classList.contains(O)) return;

  const mark = circleTurn ? O : X;
  markCell(cell, mark);

  if (checkWin(mark)) {
    finishGame(false);
    return;
  }

  if (isDraw()) {
    finishGame(true);
    return;
  }

  swapTurns();

  if (aiMode && circleTurn) {
    setTimeout(() => {
      const aiMove = getAIMove();
      if (aiMove) {
        markCell(aiMove, O);
        if (checkWin(O)) {
          finishGame(false);
          return;
        }
        if (isDraw()) {
          finishGame(true);
          return;
        }
        swapTurns();
      }
      setHover();
    }, 200);
  } else {
    setHover();
  }
}

function getAIMove() {
  const empty = cells.filter(c => !c.classList.contains(X) && !c.classList.contains(O));
  if (aiMode === 'easy') return randomMove(empty);
  if (aiMode === 'medium') return mediumMove(empty);
  if (aiMode === 'hard') return hardMove();
  return null;
}

function randomMove(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function mediumMove(options) {
  // Try to win
  for (const cell of options) {
    cell.classList.add(O);
    if (checkWin(O)) {
      cell.classList.remove(O);
      return cell;
    }
    cell.classList.remove(O);
  }

  // Block opponent
  for (const cell of options) {
    cell.classList.add(X);
    if (checkWin(X)) {
      cell.classList.remove(X);
      return cell;
    }
    cell.classList.remove(X);
  }

  const center = options.find(c => cells.indexOf(c) === 4);
  if (center) return center;

  const corners = options.filter(c => [0, 2, 6, 8].includes(cells.indexOf(c)));
  if (corners.length) return randomMove(corners);

  return randomMove(options);
}

function hardMove() {
  const state = cells.map(c =>
    c.classList.contains(X) ? X :
    c.classList.contains(O) ? O : null
  );
  const result = minimax(state, true, 0);
  return result.index !== undefined ? cells[result.index] : null;
}

function minimax(state, isMax, depth) {
  if (checkStaticWin(state, O)) return { score: 10 - depth };
  if (checkStaticWin(state, X)) return { score: depth - 10 };
  if (state.every(cell => cell !== null)) return { score: 0 };

  const scores = [];

  state.forEach((val, idx) => {
    if (val === null) {
      const nextState = [...state];
      nextState[idx] = isMax ? O : X;
      const result = minimax(nextState, !isMax, depth + 1);
      scores.push({ index: idx, score: result.score });
    }
  });

  return isMax
    ? scores.reduce((a, b) => a.score > b.score ? a : b)
    : scores.reduce((a, b) => a.score < b.score ? a : b);
}

function checkStaticWin(state, player) {
  return WIN_COMBOS.some(combo => combo.every(i => state[i] === player));
}

function markCell(cell, mark) {
  cell.classList.add(mark);
}

function swapTurns() {
  circleTurn = !circleTurn;
}

function setHover() {
  board.classList.remove(X, O);
  board.classList.add(circleTurn ? O : X);
  turnLabel.textContent = circleTurn ? "O's Turn" : "X's Turn";
}

function finishGame(draw) {
  msgTxt.textContent = draw ? "It's a draw!" : `${circleTurn ? "O" : "X"} wins!`;
  msgBox.classList.add('show');
  msgBox.style.display = 'flex';
}

function checkWin(mark) {
  const winningCombo = WIN_COMBOS.find(combo =>
    combo.every(index => cells[index].classList.contains(mark))
  );

  if (winningCombo) {
    winningCombo.forEach(index => cells[index].classList.add('win'));
    return true;
  }
  return false;
}

function isDraw() {
  return cells.every(cell => cell.classList.contains(X) || cell.classList.contains(O));
}
