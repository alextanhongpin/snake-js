const keys = {
  ESC: 27,
  SPACEBAR: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  D: 68
};

class Snake {
  static events = {
    POWER_UP: "Snake:powerup",
    COLLISION: "Snake:colliion"
  };

  constructor(id, x, y, color, width = 16, height = 16) {
    this.id = id;
    this.color = color;
    this.head = { x, y };
    this.pieces = [this.head];
    this.width = width;
    this.height = height;
    this.readyToGrow = false;
    this.input = {};
  }

  setKey(key) {
    this.input[keys.UP] = false;
    this.input[keys.DOWN] = false;
    this.input[keys.LEFT] = false;
    this.input[keys.RIGHT] = false;
    this.input[key] = true;
  }

  update(delta) {
    if (this.readyToGrow) {
      this.pieces.push({ x: -10, y: -10 });
      this.readyToGrow = false;
    }

    for (let i = this.pieces.length - 1; i > 0; i--) {
      this.pieces[i].x = this.pieces[i - 1].x;
      this.pieces[i].y = this.pieces[i - 1].y;
    }

    if (this.input[keys.LEFT]) {
      this.head.x -= 1;
    } else if (this.input[keys.RIGHT]) {
      this.head.x += 1;
    } else if (this.input[keys.UP]) {
      this.head.y -= 1;
    } else if (this.input[keys.DOWN]) {
      this.head.y += 1;
    }
  }

  checkCollision() {
    const collide = this.pieces.some(
      (piece, i) => i > 0 && piece.x === this.head.x && piece.y === this.head.y
    );
    if (collide) {
      this.onCollide();
    }
  }

  grow() {
    this.readyToGrow = true;
  }
}

class Renderer {
  constructor(element) {
    this.canvas = element;
    this.ratio = 4 / 3; // Width to height.
    this.ctx = this.canvas.getContext("2d");

    this.resize();
    window.addEventListener("resize", this.resize.bind(this), false);
    window.addEventListener("orientationchange", this.resize.bind(this), false);
  }

  resize() {
    // Ensure that the game width/height is divisible by 16 (the cell size).
    const width = window.innerWidth - (window.innerWidth % 16);
    const height = width / this.ratio;
    this.canvas.width = width;
    this.canvas.height = height - (height % 16);
  }
}

class Game {
  constructor(fps = 60) {
    this.fps = fps;
    this.delay = 1_000 / this.fps;
    this.lastTime = 0;
    this.raf = 0;

    this.onUpdate = function onUpdate(delta) {};
    this.onRender = function onRender() {};
  }

  update(delta) {
    this.onUpdate(delta);
  }

  render() {
    this.onRender();
  }

  loop(now) {
    this.raf = requestAnimationFrame(this.loop.bind(this));

    const delta = now - this.lastTime;
    if (delta >= this.delay) {
      this.update(delta);
      this.render();
      this.lastTime = now;
    }
  }

  start() {
    if (this.raf < 1) {
      this.loop(0);
    }
  }

  stop() {
    if (this.raf > 0) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }
}

class Fruit {
  constructor(x, y, color, width = 16, height = 16) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.width = width;
    this.height = height;
  }
}

async function main() {
  const renderer = new Renderer(document.getElementById("canvas"));
  const ctx = renderer.ctx;

  const [WIDTH, HEIGHT] = [renderer.canvas.width, renderer.canvas.height];
  const BLOCK_WIDTH = 16;
  const BLOCK_HEIGHT = 16;
  const FPS = 2;
  const game = new Game(FPS);

  const randId = () => parseInt(Math.random() * 999_999, 10);
  const randX = () => {
    const x = parseInt((Math.random() * WIDTH) / BLOCK_WIDTH, 10);
    return x - (x % BLOCK_WIDTH);
  };
  const randY = () => {
    const y = parseInt((Math.random() * HEIGHT) / BLOCK_HEIGHT, 10);
    return y - (y % BLOCK_HEIGHT);
  };

  const player = new Snake(
    randId(),
    randX(),
    randY(),
    "green",
    BLOCK_WIDTH,
    BLOCK_HEIGHT
  );
  player.onCollide = () => {
    game.stop();
    window.alert("Game over");
  };

  const fruits = [];

  game.onUpdate = function(delta) {
    player.update(delta);
    player.checkCollision();

    if (player.head.x < 0) {
      player.head.x = parseInt(WIDTH / player.width, 10);
    }

    if (player.head.x > parseInt(WIDTH / player.width, 10)) {
      player.head.x = 0;
    }

    if (player.head.y < 0) {
      player.head.y = parseInt(HEIGHT / player.height, 10);
    }

    if (player.head.y > parseInt(HEIGHT / player.height, 10)) {
      player.head.y = 0;
    }

    if (fruits.length > 0) {
      if (player.head.x === fruits[0].x && player.head.y === fruits[0].y) {
        fruits.pop();
        player.grow();
      }
    } else {
      fruits.push(new Fruit(randX(), randY(), "red"));
    }
  };

  game.onRender = function() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.beginPath();
    ctx.fillStyle = player.color;
    player.pieces.forEach(function(piece) {
      ctx.fillRect(
        piece.x * player.width,
        piece.y * player.height,
        player.width,
        player.height
      );
    });

    fruits.forEach(function(fruit) {
      ctx.beginPath();
      ctx.fillStyle = fruit.color;
      ctx.fillRect(
        fruit.x * fruit.width,
        fruit.y * fruit.height,
        fruit.width,
        fruit.height
      );
    });
  };

  document.body.addEventListener("keydown", function(e) {
    const key = e.keyCode;

    switch (key) {
      case keys.ESC:
        game.stop();
        break;
      case keys.SPACEBAR:
        game.start();
        break;
      case keys.LEFT:
      case keys.RIGHT:
      case keys.UP:
      case keys.DOWN:
        player.setKey(key);
        break;
      case keys.D:
        console.log(player.pieces);
        break;
    }
  });
  game.start();
}

main().catch(console.error);
