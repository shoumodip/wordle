const GAP = 2
const COLS = 5
const ROWS = 6
const BOARD = ["QWERTYUIOP", "ASDFGHJKL", "⌫XCVBNM↲"]
const WIDTH = BOARD[0].length

const TEXT_COLOR = "#D4BE98"
const NORMAL_COLOR = "#32302F"
const ABSENT_COLOR = "#402120"
const PRESENT_COLOR = "#44341B"
const CORRECT_COLOR = "#34381B"
const BACKGROUND_COLOR = "#1D1D1D"

function drawKey(ctx, x, y, w, h, key, color) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)

  ctx.font = h * 0.5 + "px Monospace"
  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  ctx.fillStyle = TEXT_COLOR
  ctx.fillText(key, x + w * 0.5, y + h * 0.3)
}

function drawGame(game, app, ctx) {
  game.cell = Math.min(window.innerWidth, window.innerHeight) / 11 - GAP
  game.size = game.cell * WIDTH + GAP * (WIDTH - 1)
  game.x = (window.innerWidth - game.size) / 2
  game.y = game.cell / 2

  app.width = window.innerWidth
  app.height = window.innerHeight

  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, app.width, app.height)

  if (game.mode) {
    ctx.font = game.cell + "px Monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    if (game.mode == "W") {
      ctx.fillStyle = TEXT_COLOR
      ctx.fillText("You Won!", app.width * 0.5, app.height * 0.3)
    } else {
      ctx.fillStyle = TEXT_COLOR
      ctx.fillText("The word was " + game.word, app.width * 0.5, app.height * 0.3)
    }

    drawKey(ctx,
      app.width / 2 - game.cell * 1.5,
      app.height * 0.3 + game.cell * 1.5,
      game.cell * 3, game.cell,
      "Restart", NORMAL_COLOR)

    return
  }

  for (let i = 0; i < ROWS; i++) {
    const y = game.y + i * (game.cell + GAP)
    for (let j = 0; j < COLS; j++) {
      const x = game.x + ((WIDTH - COLS) / 2 + j) * (game.cell + GAP)
      drawKey(ctx, x, y, game.cell, game.cell, game.input[i][j], game.colors[i][j])
    }
  }

  for (let i = 0; i < BOARD.length; i++) {
    const y = game.y + (ROWS + i + 1) * (game.cell + GAP)
    const row = BOARD[i]
    for (let j = 0; j < row.length; j++) {
      const x = game.x + j * (game.cell + GAP) * WIDTH / row.length
      const ch = row.charAt(j)
      const color = game.absent.has(ch) ? ABSENT_COLOR : NORMAL_COLOR
      drawKey(ctx, x, y, game.cell * WIDTH / row.length, game.cell, ch, color)
    }
  }
}

function pressKey(game, key) {
  if (game.mode) {
    return
  }

  if (key == "Enter") {
    if (game.col == COLS) {
      const word = game.input[game.row].join("")
      if (game.word == word) {
        game.mode = "W"
        return
      }

      if (!game.list.has(word)) {
        return
      }

      game.needed.clear()

      for (let i = 0; i < game.word.length; i++) {
        const ch = game.word.charAt(i)
        if (ch == word.charAt(i)) {
          game.colors[game.row][i] = CORRECT_COLOR
        } else {
          game.needed.set(ch, (game.needed.get(ch) || 0) + 1)
          game.colors[game.row][i] = ABSENT_COLOR
        }
      }

      for (let i = 0; i < word.length; i++) {
        const ch = word.charAt(i)
        if (ch != game.word.charAt(i)) {
          const count = game.needed.get(ch) || 0
          if (count) {
            game.colors[game.row][i] = PRESENT_COLOR
            if (count == 1) {
              game.needed.delete(ch)
            } else {
              game.needed.set(ch, count - 1)
            }
          }
        }
      }

      for (let i = 0; i < word.length; i++) {
        if (game.colors[game.row][i] == ABSENT_COLOR) {
          game.absent.add(word.charAt(i))
        }
      }

      for (let i = 0; i < word.length; i++) {
        if (game.colors[game.row][i] != ABSENT_COLOR) {
          game.absent.delete(word.charAt(i))
        }
      }

      game.row++
      game.col = 0

      if (game.row == ROWS) {
        game.mode = "L"
      }
    }
    return
  }

  if (key == "Backspace") {
    if (game.col > 0) {
      game.input[game.row][--game.col] = " "
    }
    return
  }

  if (game.col < COLS) {
    game.input[game.row][game.col++] = key
  }
}

function initGame(game, data, list) {
  game.col = 0
  game.row = 0
  game.mode = ""
  game.list = list
  game.word = data[Math.floor(Math.random() * data.length)]
  game.input = Array.from(Array(ROWS), () => new Array(COLS).fill(" "))
  game.colors = Array.from(Array(ROWS), () => new Array(COLS).fill(NORMAL_COLOR))
  game.absent = new Set()
  game.needed = new Map()
}

window.onload = async () => {
  const app = document.getElementById("app")
  const ctx = app.getContext("2d")

  const game = {}
  const data = await fetch("words.txt").then(x => x.text()).then(x => x.split("\n"))

  initGame(game, data, new Set(data))

  window.onresize = () => drawGame(game, app, ctx)
  window.onresize()

  app.onclick = (e) => {
    if (game.mode) {
      const x = e.offsetX - (app.width / 2 - game.cell * 1.5)
      const y = e.offsetY - (app.height * 0.3 + game.cell * 1.5)

      if (x >= 0 && x <= game.cell * 3 && y >= 0 && y < game.cell) {
        initGame(game, data, game.list)
        window.onresize()
      }

      return
    }

    const x = e.offsetX - game.x
    const y = e.offsetY - game.y - (game.cell + GAP) * (ROWS + 1)

    if (x < 0 || x > game.size || y < 0 || y > game.size) {
      return
    }

    const row = Math.floor(y / (game.cell + GAP))
    const col = Math.floor(x / game.size * BOARD[row].length)

    if (row == BOARD.length - 1 && col == 0) {
      pressKey(game, "Backspace")
    } else if (row == BOARD.length - 1 && col == BOARD[row].length - 1) {
      pressKey(game, "Enter")
    } else {
      pressKey(game, BOARD[row][col])
    }

    window.onresize()
  }

  window.onkeyup = (e) => {
    if (game.mode && e.key == " ") {
      initGame(game, data, game.list)
    } else if (e.key == "Backspace" || e.key == "Enter") {
      pressKey(game, e.key)
    } else if ((e.keyCode >= 65 && e.keyCode < 91) || (e.keyCode >= 97 && e.keyCode < 123)) {
      pressKey(game, e.key.toUpperCase())
    }

    window.onresize()
  }
}
