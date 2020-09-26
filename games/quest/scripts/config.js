var Config = {
  animationFrameRate: 15,
  cameraTrackingRate: 0.999,
  creatures: {
    chicken: {
      jumpSpeed: 800,
      speed: 200,
    },
    pig: {
      jumpSpeed: 400,
      speed: 100,
    },
    monster: {
      attackDamage: 50,
      chaseRange: 500,
      color: {
        bones: "#5c5c5c",
        robe: "#cfd086",
        shoes: "#41351d",
        skin: "#87b144",
      },
      jumpSpeed: 400,
      speed: 100,
    },
    sheep: {
      jumpSpeed: 400,
      speed: 100,
    },
    wizard: {
      color: {
        bones: "#5c5c5c",
        robe: "#5c5c5c",
        shoes: "#1c1c1c",
        skin: "#acacac",
      },
      maxLife: 100,
      jumpSpeed: 750,
      lifeLostPerSecond: 5,
      speed: 300,
    },
  },
  deathScreenTimeout: 3,
  gravity: 30,
  levelMakerCameraSpeed: 500,
  loader: {
    backgroundColor: "#5c5c5c",
    color: "#acacac",
    largeFontSize: 50,
    smallFontSize: 20,
    history: 5,
  },
  monsterSpawnerCooldown: 1,
  screen: {
    width: 800,
    height: 600,
  },
  showBoundaries: false,
  successScreenTimeout: 2,
  updateDelay: 0.01,
  itemColor: {
    health: "#ff0000",
    portal: "#00ffff",
    transformSpell: "#ffff00",
    selection: "#ffffff",
  },
  rewardSpeed: 500,
  spellCost: 10,
  spellSpeed: 500,
};
