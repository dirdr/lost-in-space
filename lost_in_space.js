"use strict";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");



canvas.height = window.innerHeight;
canvas.width = window.innerWidth;



//tableau qui stocke les keys -> true si elle est enfoncé sinon false
let keyArray = {"ArrowRight": false, "ArrowLeft": false, "ArrowUp": false, "ArrowDown": false}

//declaration de toute les constantes 

//PLAYER
const PLAYER_VELOCITY = 2;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLAYER_PNG_OFFSET = 10;
const PLAYER_HITBOX_WIDTH = 30;
const PLAYER_HITBOX_HEIGHT = 30;
//ENEMY
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const NUMBER_OF_ENEMY = 300;
const ENEMY_PNG_OFFSET = 3;
const ENEMY_HITBOX_WIDTH = 35;
const ENEMY_HITBOX_HEIGHT = 35;
const ENEMY_X_VELOCITY = 1.5;
const ENEMY_Y_VELOCITY = 0.7;
//PROJECTILE
const PROJECTILE_WIDTH = 5;
const PROJECTILE_HEIGHT = 5;
//GameLoop
const FPS = 144;
const TIME_IN_MS_GAMELOOP = 1000/FPS;
const TIME_IN_MS_SPAWN_ENEMIES = 3000;

let numberOfEnemyKilled = 0;
let projectile_velocity = 2;
//Arrays
let projectiles = [];
let enemies = [];

//Création de l'image du joueur 
let ship = new Image();
//précision de la source de l'image
ship.src = "ship.png";
//Création de l'image d'un ennemi
let enemy = new Image();
//précision de la source de l'image
enemy.src = "alien-ship.png"

//change l'état des keys "onkeydown" == mettre la valeur dans le tableau a true 
window.onkeydown = function(event) {
    if (event.key in keyArray) {
        keyArray[event.key] = true;
    }
    if (event.key == " ") {
        player1.shoot();
    }
}
//change l'état des keys "onkeyup" == mettre la valeur dans le tableau a false
window.onkeyup = function(event) {
    if (event.key in keyArray) {
        keyArray[event.key] = false;
    }
}


class HitBox {

    //constructeur d'un réctangle
    constructor(x, y, width, height, xOffset, yOffset) {
        this.x = x + xOffset;
        this.y = y + yOffset;
        this.width = width; 
        this.height = height;
    }

    //permet de determiner si le rectangle courant s'intersecte avec un rectangle en param
    intersect(r) {

        let thisWidth = this.width;
        let thisHeight = this.height;
        let rWidth = r.width;
        let rHeight = r.height;

        if (thisWidth <= 0 || thisHeight <= 0 || rWidth <= 0 || rHeight <= 0) {
            return false;
        }

        let thisX = this.x;
        let thisY = this.y;
        let rX = r.x;
        let rY = r.y;

        thisWidth += thisX;
        thisHeight += thisY;
        rWidth += rX;
        rHeight += rY;
        return ((rWidth < rX || rWidth > thisX) && (rHeight < rY || rHeight > thisY) && (thisWidth < thisX || thisWidth > rX) && (thisHeight < thisY || thisHeight > rY));
    }
    update(pX, pY) {
        this.x = pX;
        this.y = pY;
    }
    draw() {
        ctx.fillStyle = "blue";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}


//SuperClass FieldObject 
//cette classe decrit un objet du champ de jeu
//elle servira de super classe pour toutes nos entités
class GameFieldObject {
    //constructor de la classe GameFieldObject
    constructor(x, y, hitboxWidth, hitboxHeight, xOffset, yOffset) {
        this.x = x;
        this.y = y;
        this.hitBox = new HitBox(x, y, hitboxWidth, hitboxHeight, xOffset, yOffset);
        this.alive = true;
    }
    //permet de changer la coordonnée x d'un objet 
    xSetter(pX) {
        this.x = pX;
    }
    //permet de changer la coordonnée y d'un objet 
    ySetter(pY) {
        this.y = pY;
    }
    //déplace un objet a droite 
    moveRight(velocity) {
        this.xSetter(this.x + velocity);
    }
    //déplace un objet a gauche
    moveLeft(velocity) {
        this.xSetter(this.x - velocity);
    }
    //déplace un objet en haut 
    moveUp(velocity) {
        this.ySetter(this.y - velocity)
    }
    //déplace un objet en bas
    moveDown(velocity) {
        this.ySetter(this.y + velocity);
    }

    moveX(direction, velocity) {
        this.xSetter(this.x + velocity * direction);
    }

    moveY(direction, velocity) {
        this.ySetter(this.y + velocity * direction);
    }

    getAlive() {
        return this.alive;
    }

    setAlive(pAlive) {
        this.alive = pAlive;
    }

    
}


/**
 * classe décrivant un joueur
 * cette classe extend la superClasse GameFieldObject
 */
class Player extends GameFieldObject {
    //constructor de la classe Player 
    constructor(x, y) {
        //appel le constructeur de MapObject 
        super(x, y, PLAYER_HITBOX_WIDTH, PLAYER_HITBOX_HEIGHT, PLAYER_PNG_OFFSET, PLAYER_PNG_OFFSET);
    
    }
    //méthode draw de la classe player, dessine le joueur 
    draw(){
        ctx.drawImage(ship, this.x, this.y, PLAYER_WIDTH, PLAYER_HEIGHT);            
    }
    //méthode update de la classe Player, update la position du joueur 
    update() {
        if (keyArray['ArrowRight'] && this.x < (canvas.width - PLAYER_WIDTH + PLAYER_PNG_OFFSET)) {
            this.moveRight(PLAYER_VELOCITY); 
        } else if (keyArray['ArrowLeft'] && this.x > (0 - PLAYER_PNG_OFFSET)) {
            this.moveLeft(PLAYER_VELOCITY);
        }
        if (keyArray['ArrowDown'] && (this.y < canvas.height - PLAYER_HEIGHT)) {
            this.moveDown(PLAYER_VELOCITY);
        }
        else if (keyArray['ArrowUp'] && this.y > 0) {
            this.moveUp(PLAYER_VELOCITY);
        }
        this.hitBox.update(this.x + PLAYER_PNG_OFFSET, this.y + PLAYER_PNG_OFFSET);
        enemies.forEach(en => {
            if (en.hitBox.intersect(this.hitBox)) {
                this.setAlive(false);
            }
        }) 
        projectiles.forEach(proj => {
            if (proj.hitBox.intersect(this.hitBox)) {
                this.setAlive(false);
            }
        })
    }
    //méthode shoot du joueur, permet a ce même joueur de tirer une boule d'énérgie
    shoot() {
        //permet de changer la vitesse d'une boule d'énérgie si jamais le joueur va vers l'avant 
        if (keyArray["ArrowUp"]) {
            projectile_velocity = 2*projectile_velocity;
        }
        //ajoute un nouveau projectile au tableau de projectiles 
        projectiles.push(new Projectile((player1.x + PLAYER_HEIGHT/2) - 2, player1.y - 5, 0, projectile_velocity));
    }
}



/**
 * classe décrivant un projectile 
 * cette classe extend la superClasse GameFieldObject
 */
class Projectile extends GameFieldObject {
    //constructeur d'un projectile 
    constructor(x, y, lifeTime, currentVelocity) {
        super(x, y, 5, 5);
        this.lifeTime = lifeTime;
        this.currentVelocity = currentVelocity;
    }
    //applique la correction de vitesse de 99 pourcent aux balles
    applyVelocityCorrection() {
        this.currentVelocity = 0.99 * this.currentVelocity;
        this.lifeTime += projectile_velocity;
        projectile_velocity = 2;
    }
    //dessine le projectile courant 
    draw() {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, PROJECTILE_HEIGHT, PROJECTILE_WIDTH);
    }
    //update le projectile courant 
    update() {
        this.moveUp(this.currentVelocity);
        this.hitBox.update(this.x, this.y);
        this.applyVelocityCorrection();
        if (this.checkLifeTime()) {
            this.setAlive(false);
        }
    }

    //si le projectile est au dessus du canvas, on return true sinon false
    checkLifeTime() {
        return this.lifeTime > canvas.height/2;
    }
    //permet de detruire un projectile 
    delete() {
        projectiles.splice(projectiles.indexOf(this), 1);
    }
}




/**
 * classe décrivant un ennemi
 * cette classe extend la superClasse GameFieldObject
 */
class Enemy extends GameFieldObject {

    //constructeur de la classe Enemy
    constructor(x, y, sideOfScreen) {
        //appel du constructeur de la superclass
        super(x, y, ENEMY_HITBOX_WIDTH, ENEMY_HITBOX_HEIGHT, ENEMY_PNG_OFFSET, ENEMY_PNG_OFFSET);
        this.xVelocity = ENEMY_X_VELOCITY;
        this.yVelocity = ENEMY_Y_VELOCITY;
        if (sideOfScreen == "left") {
            this.xDelta = 1;
        } else {
            this.xDelta = -1;
        }
        this.yDelta = 1;
    }   

    
    update() {

        this.moveX(this.xDelta, this.xVelocity);
        this.moveY(this.yDelta, this.yVelocity);
        
        if (this.x > canvas.width) {
            this.xSetter(0);
        } 
        if (this.x < 0) {
            this.xSetter(canvas.width);
        }
        if (this.y > canvas.height - ENEMY_HEIGHT/2) {
            this.yDelta = -1;
            this.yVelocity *= 1.1;
        }
        if (this.y < 0) {
            this.yVelocity *= 1.1;
            this.yDelta = 1;
        }
        this.hitBox.update(this.x + ENEMY_PNG_OFFSET, this.y + ENEMY_PNG_OFFSET);
        projectiles.forEach(proj => {
            if (proj.hitBox.intersect(this.hitBox)) {
                this.setAlive(false);
                proj.setAlive(false);
                numberOfEnemyKilled+=1;
            }
        })
    }

   
    draw() {
        ctx.drawImage(enemy, this.x, this.y, ENEMY_WIDTH, ENEMY_HEIGHT);
    }

    delete() {
        enemies.splice(enemies.indexOf(this), 1);
    }
}


/**
 * fais apparaitre les ennemies a l'écran 
 */
function spawnEnemies() {

    for (let i = 0; i < canvas.width/4; i += 140) {
        enemies.push(new Enemy(i, 200, "left"));
    }
    for (let i = 70; i < canvas.width/4; i += 140) {
        enemies.push(new Enemy(i, 300, "left"));
    }
    
    for (let i = canvas.width; i > canvas.width - canvas.width/4; i -= 140) {
        enemies.push(new Enemy(i, 200, "right"));
    }
    for (let i = canvas.width-70; i > canvas.width - canvas.width/4; i -= 140) {
        enemies.push(new Enemy(i, 300, "right"));
    }
    
}



//création du joueur (vaisseau)
const player1 = new Player(canvas.width/2, 500, "ship.png");

let winning = true;
let gameRunning = true; 

/**
 * fonction update générale, update tout les objets du GameField
 */
function update() {
    if (player1.alive) {
        player1.update();
    } else {
        endGameLoose();
    }
    enemies.forEach(en => {
        if (en.getAlive()) {
            en.update();
        } else {
            en.delete();
        }
    });
    projectiles.forEach(proj => {
        if (proj.getAlive()) {
            proj.update();
        } else {
            proj.delete();
        }
    });  
    if (numberOfEnemyKilled >= NUMBER_OF_ENEMY && player1.alive) {
        endGameWin();
    }
}


function endGameLoose() {
    (enemies.forEach(en => {
        en.delete();
    }))
    projectiles.forEach(proj => {
        proj.delete();
    })
    gameRunning = false; 
    winning = false;
}

function endGameWin() {
    (enemies.forEach(en => {
        en.delete();
    }))
    projectiles.forEach(proj => {
        proj.delete();
    })
    gameRunning = false;
    winning = true;
}


/**
 * fonction draw générale, draw tout les objets sur le GameField
 */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (player1.alive) {
        player1.draw();
    }
    projectiles.forEach((proj) => proj.draw());
    enemies.forEach(en => en.draw());
    if (!gameRunning && !winning) {
        ctx.font = '48px serif';
        ctx.fillStyle = "White";
        ctx.fillText('Vous avez perdu...', canvas.width/2 - 200, canvas.height/2);
    }
    if (!gameRunning && winning) {
        ctx.font = '48px serif';
        ctx.fillStyle = "White";
        ctx.fillText('Bravo Victoire !!', canvas.width/2 - 200, canvas.height/2);
    }
}


//fonction setInterval, update et draw tout les TIME_IN_MS_GAMELOOP ms
setInterval(function() {
    update();
    draw(); 
}, TIME_IN_MS_GAMELOOP)

//fonction setInterval, fais apparaitre des ennemies tout les TIME_IN_MS_SPAWN_ENEMIES ms
setInterval(function() {
    if (gameRunning) {
        spawnEnemies();
    }
}, TIME_IN_MS_SPAWN_ENEMIES) 

