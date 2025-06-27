const X = 'x';
const O = 'circle';
const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const board      = document.getElementById('board');
const menu       = document.getElementById('menu');
const modeBtns   = document.querySelectorAll('.mode');
const turnLabel  = document.getElementById('turnIndicator');
const scoreBoard = document.getElementById('scoreBoard');
const xScoreEl   = document.getElementById('xScore');
const oScoreEl   = document.getElementById('oScore');
const msgBox     = document.getElementById('winningMessage');
const msgTxt     = document.querySelector('[data-winning-message-text]');
const restartBtn = document.getElementById('restartButton');

let cells = [], circleTurn = false, aiMode = null;
let xWins = 0, oWins = 0;

// Optional: sound (safely ignore if missing)
const clickSfx = new Audio('click.mp3');
const winSfx   = new Audio('win.mp3');
const drawSfx  = new Audio('draw.mp3');

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    aiMode = btn.dataset.mode === 'friend' ? null : btn.dataset.mode;
    menu.style.display = 'none';
    turnLabel.hidden = false;
    scoreBoard.hidden = false;
    startGame();
  });
});

restartBtn.addEventListener('click', () => {
  toMenu();
});

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r' && msgBox.classList.contains('show')) startGame();
  if (e.key.toLowerCase() === 'm') toMenu();
});

function toMenu() {
  msgBox.classList.remove('show');
  msgBox.style.display = 'none';
  board.innerHTML = '';
  menu.style.display = 'flex';
  turnLabel.hidden = true;
  scoreBoard.hidden = true;
}

function startGame() {
  board.innerHTML = '';
  msgBox.classList.remove('show');
  msgBox.style.display = 'none';
  circleTurn = false;

  for (let i = 0; i < 9; i++) createCell();

  cells = [...board.querySelectorAll('[data-cell]')];
  board.className = 'board x';
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
    if ((e.key === 'Enter' || e.key === ' ') && !cell.classList.length) {
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
    highlightWin(mark);
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
      makeAIMove();

      if (checkWin(O)) {
        highlightWin(O);
        finishGame(false);
        return;
      }

      if (isDraw()) {
        finishGame(true);
        return;
      }

      swapTurns();
      setHover();
    }, 200);
  } else {
    setHover();
  }
}

function makeAIMove() {
  const empty = cells.filter(c => !c.classList.contains(X) && !c.classList.contains(O));
  let move = null;

  if (aiMode === 'easy')   move = randomMove(empty);
  if (aiMode === 'medium') move = mediumMove(empty);
  if (aiMode === 'hard')   move = hardMove();

  if (move) markCell(move, O);
}

function randomMove(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function mediumMove(options) {
  for (const cell of options) {
    markTemp(cell, O);
    if (checkWin(O)) return unmarkTemp(cell);
    unmarkTemp(cell);
  }

  for (const cell of options) {
    markTemp(cell, X);
    if (checkWin(X)) return unmarkTemp(cell);
    unmarkTemp(cell);
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
  const best = minimax(state, true, 0).index;
  return cells[best];
}

function minimax(state, isMax, depth) {
  if (hasWinner(state, O)) return { score: 10 - depth };
  if (hasWinner(state, X)) return { score: depth - 10 };
  if (state.every(cell => cell)) return { score: 0 };

  const moves = [];

  state.forEach((val, i) => {
    if (!val) {
      const next = [...state];
      next[i] = isMax ? O : X;
      const result = minimax(next, !isMax, depth + 1);
      moves.push({ index: i, score: result.score });
    }
  });

  return isMax
    ? moves.reduce((a, b) => a.score > b.score ? a : b)
    : moves.reduce((a, b) => a.score < b.score ? a : b);
}

function hasWinner(state, mark) {
  return WIN_COMBOS.some(combo => combo.every(i => state[i] === mark));
}

function markTemp(cell, mark) {
  cell.classList.add(mark);
}
function unmarkTemp(cell) {
  cell.classList.remove(X, O);
  return cell;
}

function markCell(cell, mark) {
  cell.classList.add(mark);
  navigator.vibrate?.(50);
  clickSfx.play().catch(() => {});
}

function highlightWin(mark) {
  const combo = WIN_COMBOS.find(c =>
    c.every(i => cells[i].classList.contains(mark))
  );
  if (combo) combo.forEach(i => cells[i].classList.add('win'));
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

  // update score
  if (!draw) {
    circleTurn ? oWins++ : xWins++;
    xScoreEl.textContent = xWins;
    oScoreEl.textContent = oWins;
    (circleTurn ? winSfx : winSfx).play().catch(() => {});
  } else {
    drawSfx.play().catch(() => {});
  }
}

function isDraw() {
  return cells.every(c =>
    c.classList.contains(X) || c.classList.contains(O)
  );
}

function checkWin(mark) {
  return WIN_COMBOS.some(combo =>
    combo.every(i => cells[i].classList.contains(mark))
  );
}
