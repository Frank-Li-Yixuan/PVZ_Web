import Phaser from "phaser";
import { PROJECT_NAME, PROJECT_VERSION } from "@sprout-and-steel/shared";
import "./styles.css";

class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#16201d");

    const graphics = this.add.graphics();
    graphics.fillStyle(0x23342e, 1);
    graphics.fillRoundedRect(84, 82, width - 168, height - 164, 18);
    graphics.lineStyle(2, 0x6f8d66, 0.7);
    graphics.strokeRoundedRect(84, 82, width - 168, height - 164, 18);

    graphics.fillStyle(0xf3c84b, 1);
    graphics.fillCircle(width / 2 - 290, 394, 36);
    graphics.fillStyle(0x64bf6a, 1);
    graphics.fillEllipse(width / 2 - 290, 440, 90, 32);

    graphics.fillStyle(0x55bdd2, 1);
    graphics.fillCircle(width / 2 + 290, 404, 30);
    graphics.lineStyle(8, 0xe8dfbd, 1);
    graphics.lineBetween(width / 2 + 310, 397, width / 2 + 376, 367);

    this.add
      .text(width / 2, 146, PROJECT_NAME, {
        fontFamily: "Arial, sans-serif",
        fontSize: "56px",
        color: "#f7f2df"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 212, "V0.1 Cooperative Plant Defense", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#cfe4ca"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 306, `Phase 0 bootstrap build ${PROJECT_VERSION}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f3c84b"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 374, "Client runtime is ready. Gameplay systems start in later phases.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "17px",
        color: "#d9e3d3"
      })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#16201d",
  scene: [TitleScene],
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});
