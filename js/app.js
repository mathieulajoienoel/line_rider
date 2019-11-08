/*
  Line rider
  -------
  Traversing an empty cell marks it as your own.
  Traversing a cell marked by another player will kill you.
  Kill all other players to win.


*/

// Our canvas size. This will be reset upon initialisation.

function randomProperty(obj) {
  var keys = Object.keys(obj)
  return obj[keys[ keys.length * Math.random() << 0]];
};

function Vector2(x, y){
  this.x = x,
  this.y = y,
  this.value = function(){
    return [x, y];
  }
  ;
  return this;
}

var GAME_SIZE = {
  width: window.innerHeight,
  height: window.innerWidth
};

const TOTALPLAYERS = 1;

// The size of each cell
const CELL_SIZE = 16;

const PLAYERCONTROLS = [
  {
    up: 38,
    down: 40,
    left: 37,
    right: 39
  },
  {
    up: 87,
    down: 83,
    left: 65,
    right: 68
  }
];

const DIRECTIONS = {
  left: new Vector2(-1, 0),
  right: new Vector2(1, 0),
  up: new Vector2(0, -1), // Reversed, because we are on a webpage.
  down: new Vector2(0, 1)
};

const FRAME_DURATION = 1000 / 60;
const getTime = typeof performance === 'function' ? performance.now : Date.now;

// The game master initialises the grid and updates it. It overviews the simulation.
function GameMaster(){
  // Our object containing the cells. They are ordered by [x][y]
  this.cells = {},
  // The canvas element
  this.game = null,
  // The canvas' context
  this.context = null,
  this.lastRafUpdate = 0,
  this.players = [],
  this.isGameOver = false,
  // Initialize the game
  this.init = function(){
    // Get the game element and context, for drawing.
    this.game = document.getElementById("game");
    this.context = this.game.getContext("2d");
    // Focus on the game
    this.game.setAttribute('tabindex','0');
    this.game.focus();

    // Fix for blurry canvas!
    this.game.width = this.game.getBoundingClientRect().width;
    this.game.height = this.game.getBoundingClientRect().height;
    // Reset vars for game size since they changed.
    GAME_SIZE = {
      width: this.game.width,
      height: this.game.height
    };

    // Start the generation.
    this.generateCells();

    // Create the players
    this.players.push(new Player(this, 1, "#0000ff", "#111177", this.getCellPosition(0.5), true, Math.floor(Math.random() * 4 + 1)));
    this.players.push(new Player(this, 2, "#ff0000", "#771111", this.getCellPosition(0.25), TOTALPLAYERS == 2 ? true : false, Math.floor(Math.random() * 4 + 1)));
    this.players.push(new Player(this, 3, "#00ff00", "#117711", this.getCellPosition(0.75), false, Math.floor(Math.random() * 4 + 1)));
    this.players.push(new Player(this, 4, "#ff00ff", "#771177", this.getCellPosition(0.40), false, Math.floor(Math.random() * 4 + 1)));
    this.players.push(new Player(this, 5, "#ffff00", "#777711", this.getCellPosition(0.65), false, Math.floor(Math.random() * 4 + 1)));
    this.players.push(new Player(this, 6, "#00ffff", "#117777", this.getCellPosition(0.90), false, Math.floor(Math.random() * 4 + 1)));

    // Init all objects
    this.players.forEach(function(obj, k){
      if(typeof obj.init === 'function') {
        obj.init();
      }
    });

    // Start updating the game board.
    setTimeout((e) => { this.update(); }, 100);

    return this;
  },
  // Generate the cells, set their states and draw them.
  this.generateCells = function(){
    // Loop on x axis.
    for (let x = 0; x < GAME_SIZE.width; x += CELL_SIZE) {
      this.cells[x] = {};
      // Loop on y axis.
      for (let y = 0; y < GAME_SIZE.height; y += CELL_SIZE) {
        // Create the cell for these coordinates.
        this.cells[x][y] = {
          is_obstacle: Math.random() < 0.05,
          ownedBy: null
        };
        // Set its color
        this.context.fillStyle = "#dddddd";
        if (this.cells[x][y].is_obstacle) {
          this.context.fillStyle = "#4a4a4a";
        }
        // Draw it
        this.context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
    return this;
  },
  this.getCellPosition = function(fPercentage){
    let xkeys = Object.keys(this.cells);
    let x = parseInt(xkeys[Math.floor((xkeys.length - 1) * fPercentage)]);

    let ykeys = Object.keys(this.cells[x]);
    let y = parseInt(ykeys[Math.floor((ykeys.length - 1) * fPercentage)]);

    return new Vector2(x, y);
  },
  this.redrawOldCell = function(position){
    if (!this.cells[position.x] || !this.cells[position.x][position.y]) {
      return this;
    }
    this.context.clearRect(position.x, position.y, CELL_SIZE, CELL_SIZE);

    this.context.fillStyle = "#dddddd";
    if (this.cells[position.x][position.y].is_obstacle) {
      this.context.fillStyle = "#4a4a4a";
    }
    // Draw it
    this.context.fillRect(position.x, position.y, CELL_SIZE, CELL_SIZE);
    return this;
  },
  this.actOnCell = function(position, color, id){
    if ((!this.cells[position.x] || !this.cells[position.x][position.y]) || this.cells[position.x][position.y].is_obstacle) {
      return this;
    }
    if (this.cells[position.x][position.y].ownedBy != null && this.cells[position.x][position.y].ownedBy != id) {
      var totalAlive = this.players.length;
      this.players.forEach((obj, k) => {
          if (obj.id == id) {
            obj.active = false;
          }
          if (!obj.active) {
            totalAlive--;
          }
      });
      if (totalAlive <= 1) {
        this.isGameOver = true;
      }
      return this;
    }
    if (this.cells[position.x][position.y].ownedBy == id) {
      color = "#dddddd";
      this.cells[position.x][position.y].ownedBy = null;
    } else if (this.cells[position.x][position.y].ownedBy == null) {
      this.cells[position.x][position.y].ownedBy = id;
    }

    this.context.clearRect(position.x, position.y, CELL_SIZE, CELL_SIZE);
    this.context.fillStyle = color;
    this.context.fillRect(position.x, position.y, CELL_SIZE, CELL_SIZE);
    // Draw it
    return this;
  },
  this.isCellAvailable = function(position){
    if (!this.cells[position.x] || !this.cells[position.x][position.y]) {
      return false;
    }
    return !this.cells[position.x][position.y].is_obstacle;
  }
  // Update the game board on each animation frame.
  this.update = function(){
    let time = new Date().getTime() * 0.0002;
    let now = getTime();
    let delta = (now - this.lastRafUpdate) / FRAME_DURATION;

    // Update the players
    this.players.forEach(function(obj, k){
      if (obj.active) {
        obj.update(delta);
      }
    });

    this.lastRafUpdate = now;

    // Game for game over state
    if (!this.isGameOver) {
      // Request the next frame when available.
      window.requestAnimationFrame((e) => { this.update(); });
    } else {
      var lastAliveId = null;
      this.players.forEach((obj, k) => {
        if (obj.active) {
          lastAliveId = obj.id;
          return;
        }
      });
      alert("Game over! Player " + lastAliveId + " wins!");
    }
  },
  // Get a new direction, depending of the side
  this.getNewDirection = function(current, side){
    if (side == 1) {
      if (current == DIRECTIONS.up) {
        return DIRECTIONS.right;
      } else if (current == DIRECTIONS.right) {
        return DIRECTIONS.down;
      } else if (current == DIRECTIONS.down) {
        return DIRECTIONS.left;
      } else if (current == DIRECTIONS.left) {
        return DIRECTIONS.up;
      }
    } else {
      if (current == DIRECTIONS.up) {
        return DIRECTIONS.left;
      } else if (current == DIRECTIONS.left) {
        return DIRECTIONS.down;
      } else if (current == DIRECTIONS.down) {
        return DIRECTIONS.right;
      } else if (current == DIRECTIONS.right) {
        return DIRECTIONS.up;
      }
    }
  }
  ;
  return this;
}

function Player(master, id, color, ownedColor, position, isPlayer = false, behaviour){
  this.id = id,
  this.color = color,
  this.ownedColor = ownedColor,
  this.position = position,
  this.direction = DIRECTIONS.up,
  this.master = master,
  this.isPlayer = isPlayer,
  this.nextMove = null,
  this.active = true,
  this.behaviour = behaviour,
  this.init = function(){
    if (this.isPlayer) {
      this.master.game.addEventListener("keydown", (e) => { this.onKeyPress(this, e); });
    }
    this.draw();
    return this;
  },
  this.setNPCNextMove = function(){
    switch (this.behaviour) {
      case 1:
        // Lines
        this.nextMove = new Vector2(this.direction.x * CELL_SIZE, this.direction.y * CELL_SIZE);
        if (!this.master.isCellAvailable(new Vector2(this.position.x + this.nextMove.x, this.position.y + this.nextMove.y))) {

          this.direction = this.master.getNewDirection(this.direction, (Math.random() > 0.5 ? 1 : -1));
          this.nextMove = new Vector2(this.direction.x * CELL_SIZE, this.direction.y * CELL_SIZE);
        }
        break;
      case 2:
        // Forward then sides
        if (Math.random() < 0.2) {
          this.direction = this.master.getNewDirection(this.direction, (Math.random() > 0.5 ? 1 : -1));
        }
        this.nextMove = new Vector2(this.direction.x * CELL_SIZE, this.direction.y * CELL_SIZE);
        if (!this.master.isCellAvailable(new Vector2(this.position.x + this.nextMove.x, this.position.y + this.nextMove.y))) {

          this.direction = this.master.getNewDirection(this.direction, (Math.random() > 0.5 ? 1 : -1));
          this.nextMove = new Vector2(this.direction.x * CELL_SIZE, this.direction.y * CELL_SIZE);
        }
        break;
      case 3:
        // Semi-Intelligent
      case 5:
        // Semi-Intelligent not own path
        var foundValidPath = false;
        this.nextMove = new Vector2(this.direction.x * CELL_SIZE, this.direction.y * CELL_SIZE);
        var pos;
        for (var i = 0; i <= Math.floor(Math.random() * 9 + 1); i++) {
          pos = new Vector2(this.position.x + this.nextMove.x, this.position.y + this.nextMove.y)
          if (this.master.isCellAvailable(pos) && this.master.cells[pos.x] && this.master.cells[pos.x][pos.y]) {
            if ((this.behaviour == 3 && this.master.cells[pos.x][pos.y].ownedBy == this.id) || !this.master.cells[pos.x][pos.y].ownedBy) {
              foundValidPath = true;
            }
          }

          if (foundValidPath) {
            break;
          } else {
            this.direction = this.master.getNewDirection(this.direction, (Math.random() > 0.5 ? 1 : -1));
            this.nextMove = new Vector2(this.direction.x * CELL_SIZE, this.direction.y * CELL_SIZE);
          }
        }
        break;
      case 4:
        // Random
        let direction = randomProperty(DIRECTIONS);
        this.nextMove = new Vector2(direction.x * CELL_SIZE, direction.y * CELL_SIZE);
        break;
    }
  },
  this.update = function(gm, delta){
    //TEST
    if (!this.isPlayer) {
      this.setNPCNextMove();
    }

    if (this.nextMove) {
      // x = posx + (dirx * step)
      let pos = new Vector2(this.position.x + this.nextMove.x, this.position.y + this.nextMove.y);
      if (this.master.isCellAvailable(pos)) {
        this.master.actOnCell(this.position, this.ownedColor, this.id);
        this.position = pos;
        this.draw();
      }
      this.nextMove = null;
    }
  },
  this.onKeyPress = function(self, e){
    self.act(e);
  },
  this.act = function(e){
    switch (e.keyCode) {
      case PLAYERCONTROLS[this.id - 1].up:
        // up
        this.nextMove = new Vector2(DIRECTIONS.up.x * CELL_SIZE, DIRECTIONS.up.y * CELL_SIZE);
        break;
      case PLAYERCONTROLS[this.id - 1].down:
        // down
        this.nextMove = new Vector2(DIRECTIONS.down.x * CELL_SIZE, DIRECTIONS.down.y * CELL_SIZE);
        break;
      case PLAYERCONTROLS[this.id - 1].left:
        // left
        this.nextMove = new Vector2(DIRECTIONS.left.x * CELL_SIZE, DIRECTIONS.left.y * CELL_SIZE);
        //this.direction = this.master.getNewDirection(this.direction, -1);
        break;
      case PLAYERCONTROLS[this.id - 1].right:
        // right
        this.nextMove = new Vector2(DIRECTIONS.right.x * CELL_SIZE, DIRECTIONS.right.y * CELL_SIZE);
        //this.direction = this.master.getNewDirection(this.direction, 1);
        break;
    }
  },
  this.draw = function(){
    this.master.context.clearRect(this.position.x, this.position.y, CELL_SIZE, CELL_SIZE);
    this.master.context.fillStyle = this.color;
    this.master.context.fillRect(this.position.x, this.position.y, CELL_SIZE, CELL_SIZE);
    return this;
  }
  ;
  return this;
}

// Create the master and start the game.
var gameMaster = new GameMaster().init();
