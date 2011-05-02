/*global window, console */
//	(That first line is for JSLint)

//	***************************************************************
//
//	VIDEOGAME
//	Released April 2011 by Steve Cochrane (steve@stevecochrane.com)
//
//	***************************************************************

//	Namespaced even though this is the only script file in use here,
//	because I'd never namespaced anything before. Woo!
var VIDEOGAME = (function () {

	//	Have some variables!
	//	These are all declared up front just to make things easier,
	//	so I don't have to worry about function scope and such.
	var addToHomeScreenMessage,
		aliens = [],
		aliensBullet = {},
		aliensDirection = "right",
		aliensFound = false,
		aliensHeight,
		aliensMovementRate,
		aliensMovingDown = false,
		aliensWidth,
		audioAlienDeath,
		audioAlienDeathPreloaded,
		audioAlienFire,
		audioAlienFirePreloaded,
		audioFanfare,
		audioFanfarePreloaded,
		audioFighterDeath,
		audioFighterDeathPreloaded,
		audioFruitGet = [],
		audioInGame,
		audioInGamePreloaded,
		audioLaser,
		audioLaserPreloaded,
		audioLaserArmed,
		audioLaserArmedPreloaded,
		audioNormalShot,
		audioNormalShotPreloaded,
		audioPressStart,
		audioPressStartPreloaded,
		audioSupport = true,
		audioTitleScreen,
		audioTitleScreenPreloaded,
		backgroundColorBase = 0,
		canPlayMp4,
		canPlayOgg,
		canvas,
		canvasHeight,
		canvasWidth,
		context,
		cursorColorBase = 0,
		cursorColorBaseCyclingUp = true,
		cycleCursorColorBase,
		draw,
		drawTitleScreen,
		endgameDelayTimer = 0,
		fighter = {},
		fighterBullet = {},
		fighterHeight,
		fighterMovementRate,
		fighterWidth,
		fireButton,
		fireHandler,
		firingCannon = false,
		fruits = [],
		fruitsCount = 0,
		fruitsCollected = 0,
		fruitsGetText = {},
		fruitsHeight,
		fruitsWidth,
		gameStatus = "preloading",
		goTextHidden = false,
		goTextTimeCounter = 0,
		highScore = 0,
		highScoreBeaten = false,
		i,
		imageAlien,
		imageAlienPreloaded,
		imageAlienFlashing,
		imageAlienFlashingPreloaded,
		imageExplosion,
		imageExplosionPreloaded,
		imageFighter,
		imageFighterPreloaded,
		imageForcePortraitView,
		imageForcePortraitViewPreloaded,
		imageFruit,
		imageFruitPreloaded,
		initPlacement,
		isLocalStorageSupported,
		isPreloadingComplete,
		j,
		laserArmed = false,
		laserBrightness = 0,
		laserCharge = 0,
		laserColorBase = 255,
		laserColorBaseCyclingUp = false,
		laserFired = false,
		laserButton,
		laserHandler,
		leftArrowButton,
		leftKeyDown = false,
		leftEndHandler,
		leftStartHandler,
		levelNumber = 1,
		lightFlashRate = 10,		
		lossConditions,
		onKeyDownHandler,
		onKeyUpHandler,
		onOrientationChangeHandler,
		ontouchstartSupport = false,
		preloadingComplete,
		previousGameStatus = false,
		readyGoTimeCounter = 250,
		ellipsisTimeCounter = 0,
		ellipsisState = 0,
		randomColumn,
		resFactor = 2,
		rightArrowButton,
		rightKeyDown = false,
		rightEndHandler,
		rightStartHandler,
		score = 0,
		showResizeMessage = false,
		stars = [],
		textColorBase = 255,
		touchConsole,
		verticalMovementLog = 0,
		winCheck,
		winConditions;
	
	//	Functions are declared alphabetically from here.
	//	If you want to navigate chronologically, scroll down to window.onload.
	
	//	This function cycles the text color up and down for a pulsing text effect.
	cycleCursorColorBase = function () {
		if (cursorColorBaseCyclingUp) {
			if (cursorColorBase < 255 && gameStatus !== "fadingTitleScreenToStart") {
				cursorColorBase += 5;	
			} else {
				cursorColorBaseCyclingUp = false;
				cursorColorBase -= 5;
			}
		} else {
			if (cursorColorBase < 105 && gameStatus !== "fadingTitleScreenToStart") {
				cursorColorBaseCyclingUp = true;
				cursorColorBase += 5;
			} else {
				cursorColorBase -= 5;
			}
		}
	};
	
	//	Here's the master drawing function that is called on every frame.
	draw = function () {
		
		if (gameStatus === "preloading") {
			
			//	Clear the screen
			context.clearRect(0, 0, canvasWidth, canvasHeight);

			//	Draw loading screen
			context.font = resFactor * 16 + "px 'ArmaFive'";
			context.fillStyle = "#fff";
			
			//	Uses an incremental time counter to animate the ellipsis.
			//	This code is largely reused later in the "READY..." message
			//	but it's different enough to keep separate.
			if (ellipsisTimeCounter < 22) {
				ellipsisTimeCounter += 1;
			} else {
				ellipsisTimeCounter = 0;
				if (ellipsisState < 2) {
					ellipsisState += 1;
				} else {
					ellipsisState = 0;
				}
			}
			if (ellipsisState === 0) {
				context.fillText("LOADING.", resFactor * 10, resFactor * 20);
			} else if (ellipsisState === 1) {
				context.fillText("LOADING..", resFactor * 10, resFactor * 20);
			} else {
				context.fillText("LOADING...", resFactor * 10, resFactor * 20);
			}
			
			//	Also show the message telling the user that it's running at half resolution,
			//	if they're using a desktop browser that is not big enough.
			if (showResizeMessage) {
				context.fillText("THIS IS CURRENTLY RUNNING AT", resFactor * 10, resFactor * 60);
				context.fillText("HALF SIZE. YOUR BROWSER VIEWPORT", resFactor * 10, resFactor * 80);
				context.fillText("MUST BE AT LEAST 640PX WIDE", resFactor * 10, resFactor * 100);
				context.fillText("AND 740PX TALL TO PLAY THIS", resFactor * 10, resFactor * 120);
				context.fillText("GAME AT FULL SIZE.", resFactor * 10, resFactor * 140);
			}

		} else if (gameStatus === "inLandscapeView") {

			//	Clear the screen and draw the "force portrait view" image
			context.clearRect(0, 0, canvasWidth, canvasHeight);
			context.drawImage(imageForcePortraitView, canvasWidth / 2 - (resFactor * 30), canvasHeight / 2 - (resFactor * 30));

		} else if (gameStatus === "playerWon" || gameStatus === "playerLost") {

			//	Run a short delay to make sure the player doesn't immediately
			//	hit space bar and instantly go to the next stage.
			if (endgameDelayTimer > 0) {
				endgameDelayTimer -= 1;
			}

		} else {
			
			//	Clear the screen
			context.clearRect(0, 0, canvasWidth, canvasHeight);

			//	Draw background
			context.fillStyle = "rgb(" + backgroundColorBase + ", " + backgroundColorBase + ", " + backgroundColorBase + ")";
			if (backgroundColorBase > 0) {
				backgroundColorBase -= lightFlashRate;
			}
			context.fillRect(0, 0, canvasWidth, canvasHeight);
					
			//	Draws the stars (just for the desktop version)
			if (!ontouchstartSupport) {
				context.fillStyle = "#666";
				//	Cycle through the stars array
				for (i = 0; i < stars.length; i += 1) {
					//	Draw the star
					context.fillRect(stars[i].x, stars[i].y, resFactor, resFactor);
					//	If the star is still on the canvas...
					if (stars[i].y < canvasHeight - 4) {
						//	Keep moving it down.
						stars[i].y = stars[i].y + resFactor;
					} else {
						//	If not, place it back on top with a random x coordinate.
						stars[i].x = Math.floor(Math.random() * canvasWidth);
						stars[i].y = 0;
					}
				}
			}
			
			if (gameStatus === "atTitleScreen") {

				drawTitleScreen();
			
			} else if (gameStatus === "fadingTitleScreenToStart") {

				//	Continue to draw the title screen but fade the text to black.
				drawTitleScreen();
				textColorBase -= 5;				

				//	Once the fade to black is complete, switch to the ready message.
				if (textColorBase < 1) {
					gameStatus = "readyAndGo";
				}

			} else {
				
				//	Draw text at top of screen
				context.fillStyle = "#fff";
				context.font = (resFactor * 8) + "px 'ArmaFive'";
				context.textAlign = "center";
				context.fillText("LASER POWER", resFactor * 60, resFactor * 20);
				context.fillText("LEVEL", resFactor * 157, resFactor * 20);
				context.fillText(levelNumber, resFactor * 157, resFactor * 31);
				context.fillText("SCORE", resFactor * 212, resFactor * 20);
				context.fillText(score, resFactor * 212, resFactor * 31);
				context.fillText("HIGH SCORE", resFactor * 280, resFactor * 20);
				context.fillText(highScore, resFactor * 280, resFactor * 31);
				context.font = resFactor * 16 + "px 'ArmaFive'";
				
				//	Draw the outline of the laser meter
				context.strokeStyle = "#fff";
				context.strokeRect((resFactor * 10) + (resFactor * 0.5), (resFactor * 25) + (resFactor * 0.5), resFactor * 99, resFactor * 6);
					
				if (gameStatus === "readyAndGo") {

					//	Draw the fighter.
					//	This is present for both readyAndGo and playing because it needs to be
					//	in a specific order for the losing explosion to be timed correctly.
					context.drawImage(imageFighter, fighter.x, fighter.y);
					
					//	Draw the aliens.
					//	Since we only need to draw them at this point, this is a
					//	simplified loop for now. It gets more involved when in-game.
					for (i = 0; i < 5; i += 1) {
						for (j = 0; j < 11; j += 1) {
							context.drawImage(imageAlien, aliens[i][j].x, aliens[i][j].y);
						}
					}
					
					//	Set text styles for the following text.
					context.textAlign = "left";
					context.fillStyle = "#fff";

					if (readyGoTimeCounter > 50) {
						//	Another ellipsis animation, pretty much the same as for "LOADING..."
						if (ellipsisTimeCounter < 22) {
							ellipsisTimeCounter += 1;
						} else {
							ellipsisTimeCounter = 0;
							if (ellipsisState < 2) {
								ellipsisState += 1;
							} else {
								ellipsisState = 0;
							}
						}
						if (ellipsisState === 0) {
							context.fillText("READY.", (canvasWidth / 2) - (resFactor * 24), resFactor * 195);
						} else if (ellipsisState === 1) {
							context.fillText("READY..", (canvasWidth / 2) - (resFactor * 24), resFactor * 195);
						} else {
							context.fillText("READY...", (canvasWidth / 2) - (resFactor * 24), resFactor * 195);
						}
					} else {
						//	Here's another text animation that quickly blinks the "GO!!!" text
						//	on and off every 2 frames. goTextHidden doesn't seem necessary,
						//	but I can't seem to read context.fillStyle in an if statement.
						context.textAlign = "center";
						if (goTextTimeCounter < 2) {
							goTextTimeCounter += 1;
						} else {
							goTextTimeCounter = 0;
							if (goTextHidden) {
								goTextHidden = false;
							} else {
								goTextHidden = true;
							}
						}
						if (goTextHidden) {
							context.fillStyle = "#000";
						} else {
							context.fillStyle = "#fff";
						}
						context.fillText("GO!!!", canvasWidth / 2, resFactor * 195);
					}
			
					//	Once the timer hits zero we're finally ready to start the game.
					if (readyGoTimeCounter > 0) {
						readyGoTimeCounter -= 1;
					} else {
						gameStatus = "playing";
						
						if (audioSupport) {
							audioInGame.currentTime = 0;
							audioInGame.play();
						}
					}

				} else {

					//	If we've made it this far we know that gameStatus = "playing"
					//	and that the player is currently in action playing the game.
					
					//	This is a flag to determine when the player has defeated all the aliens.
					//	If this remains true all the way through this function we'll know the player won.
					winCheck = true;
					
					//	Aliens bullet stuff 
					if (aliensBullet.status === "flashing" || aliensBullet.status === "flashingOff") {
						
						//	First get a random number from 1 to 11 to choose a column.
						//	For some reason when I put !aliensFound in the while conditional
						//	it would start an infinite loop, even though I do that elsewhere
						//	without any issues...
						while (aliensFound === false) {
							randomColumn = Math.floor(Math.random() * 11);
							//	The cycle through the aliens in that column, starting from the bottom.
							for (i = 4; i >= 0; i -= 1) {
								//	When a living alien is found, record it and the while loop stops.
								if (!aliens[i][randomColumn].isDead && !aliensFound) {
									aliens[i][randomColumn].firing = true;
									aliensFound = i;
								}
							}
						}

						//	Yet another manual text blink thing.
						//	This one will alternate the image for the blinking alien.
						if (aliensBullet.timeCounter % 3 === 0) {
							if (aliensBullet.status === "flashing") {
								aliensBullet.status = "flashingOff";
							} else {
								aliensBullet.status = "flashing";
							}
						}
						
						//	Continue to blink the alien for 30 frames.
						if (aliensBullet.timeCounter < 30) {
							aliensBullet.timeCounter += 1;
						} else {
							//	If the flashing alien is still alive at this point,
							//	fire its bullet. Otherwise, reset conditions and 
							//	choose a different alien to start flashing.
							if (!aliens[aliensFound][randomColumn].isDead) {
								aliensBullet.status = "bulletFired";
								aliensBullet.timeCounter = 0;
								if (audioSupport) {
									audioAlienFire.currentTime = 0;
									audioAlienFire.play();
								}
							} else {
								aliensBullet.status = "flashing";
								aliensBullet.x = aliensBullet.y = 0;
								aliens[aliensFound][randomColumn].firing = false;
								aliensFound = false;
								aliensBullet.timeCounter = 0;
							}
						}

					} else if (aliensBullet.status === "bulletFired") {
						
						//	If the location is 0 then this is the first frame where the bullet has been fired,
						//	so we'll place it directly under the blinking alien.
						if (aliensBullet.y === 0) {
							aliensBullet.x = aliens[aliensFound][randomColumn].x + (aliensWidth / 2);
							aliensBullet.y = aliens[aliensFound][randomColumn].y + aliensHeight;
						}
						
						//	If the bullet is still on screen...
						if (aliensBullet.y < canvasHeight) {
							//	Move the bullet farther down the screen, then draw it.
							aliensBullet.y += aliensBullet.movementRate;
							context.fillRect(aliensBullet.x, aliensBullet.y, aliensBullet.width, aliensBullet.height);
						} else {
							//	If not, reset conditions for the alien bullet.
							aliensBullet.status = "flashing";
							aliensBullet.x = aliensBullet.y = 0;
							aliens[aliensFound][randomColumn].firing = false;
							aliensFound = false;
						}
					}

					//	Check if the aliens are currently moving down.
					if (aliensMovingDown) {
						//	If so, check if they've moved down enough.
						if (verticalMovementLog >= resFactor * 20) {
							//	If so, stop moving down and start moving horizontally again.
							aliensMovingDown = false;
							verticalMovementLog = 0;
						} else {
							//	If not, keep moving down.
							verticalMovementLog += aliensMovementRate;
						}
					} else {
						//	If the aliens have hit their turning point, start moving them
						//	downward and then flip their horizontal direction.
						if (aliens[4][10].x + aliensWidth > canvasWidth - (resFactor * 38)) {
							aliensDirection = "left";
							aliensMovingDown = true;
						} else if (aliens[0][0].x < (resFactor * 38)) {
							aliensDirection = "right";
							aliensMovingDown = true;
						}
					}
					
					//	Cycle through the fruits array.
					for (i = 0; i < 5; i += 1) {
						//	If the current fruit is on screen...
						if (fruits[i].shown) {
							//	If the fruit is in contact with the fighter...
							if ((fighter.x > fruits[i].x && fighter.x < fruits[i].x + fruitsWidth) || (fighter.x + fighterWidth > fruits[i].x && fighter.x + fighterWidth < fruits[i].x + fruitsWidth)) {
								if ((fighter.y > fruits[i].y && fighter.y < fruits[i].y + fruitsHeight) || (fighter.y + fighterHeight > fruits[i].y && fighter.y + fighterHeight < fruits[i].y + fruitsHeight)) {

									//	Mark the fruit as no longer being on screen.
									fruits[i].shown = false;
									//	Play the "fruit get" sound effect.
									if (audioSupport) {
										audioFruitGet[fruitsCollected].currentTime = 0;
										audioFruitGet[fruitsCollected].play();
									}
									//	Activate the fruitsGetText
									fruitsGetText[i].shown = true;
									//	Add to the current total of collected fruit, so we know which sound to play.
									fruitsCollected += 1;
									//	Add to the player's score for each collected fruit.
									score += 20 * fruitsCollected;
									//	As usual when score is added, check if it's a new high score
									//	and if so, update the high score.
									if (score > highScore) {
										highScore = score;
										window.localStorage["videogame.highscore"] = highScore;
										highScoreBeaten = true;
									}
								}
							}

							//	Draw the fruit.	
							context.drawImage(imageFruit, parseInt(fruits[i].x, 10), parseInt(fruits[i].y, 10));
							//	Move it down a little for the next frame.
							fruits[i].y += resFactor;
						}
					}
					
					//	Cycle through the fruitsGetText array.
					context.font = (resFactor * 16) + "px 'ArmaFive'";
					for (i = 0; i < 5; i += 1) {
						if (fruitsGetText[i].shown) {
							if (fruitsGetText[i].brightness > 0) {
								if (!fruitsGetText[i].x) {
									fruitsGetText[i].x = fighter.x + fighterWidth + (resFactor * 14);
								}
								//	Draw the text
								context.fillStyle = "rgb(" + fruitsGetText[i].brightness + ", " + fruitsGetText[i].brightness + ", " + fruitsGetText[i].brightness + ")";
								context.fillText("X" + fruitsCollected, fruitsGetText[i].x, fruitsGetText[i].y);
								//	Raise the y position and reduce the brightness for the next frame
								fruitsGetText[i].brightness -= 10;
								fruitsGetText[i].y -= resFactor;
							} else {
								//	The text is now hidden, so mark it as no longer shown and reset its other values.
								fruitsGetText[i].brightness = 255;
								fruitsGetText[i].shown = false;
								fruitsGetText[i].x = false;
								fruitsGetText[i].y = resFactor * 258;
							}
						}
					}
					context.fillStyle = "#fff";

					//	Start cycling through the aliens (two-dimensional array)
					for (i = 0; i < 5; i += 1) {
						for (j = 0; j < 11; j += 1) {
							
							//	Determine which direction the alien is currently headed, and
							//	then move in that direction.
							if (aliensMovingDown) {
								aliens[i][j].y += aliensMovementRate;
							} else {
								if (aliensDirection === "right") {
									aliens[i][j].x += aliensMovementRate;
								} else {
									aliens[i][j].x -= aliensMovementRate;
								}
							}
							
							//	The rest of this only applies if the alien is still alive.
							if (!aliens[i][j].isDead) {
								
								//	If an alien is still alive, that means the player hasn't won yet,
								//	so we'll mark winCheck false for this frame.
								winCheck = false;
						
								//	Draw the current alien.
								if (aliens[i][j].firing && aliensBullet.status === "flashing") {
									context.drawImage(imageAlienFlashing, parseInt(aliens[i][j].x, 10), parseInt(aliens[i][j].y, 10));
								} else {
									context.drawImage(imageAlien, parseInt(aliens[i][j].x, 10), parseInt(aliens[i][j].y, 10));
								}
								
								//	If a bullet is currently on screen...
								if (fighterBullet.onScreen) {
									//	Check if the bullet is in contact with the current alien.
									//	These are separated into separate ifs in hopes that it improves performance.
									//	No need to make all the comparisons if it fails one early on.
									if (fighterBullet.x > aliens[i][j].x) {
										if (fighterBullet.y > aliens[i][j].y) {
											if (fighterBullet.x < aliens[i][j].x + aliensWidth) {
												if (fighterBullet.y < aliens[i][j].y + aliensHeight) {
													
													//	Mark the alien as dead.
													aliens[i][j].isDead = true;
													//	Reset the bullet.
													fighterBullet.onScreen = false;
													fighterBullet.y = fighter.y;
													//	Play the "alien death" sound effect.
													if (audioSupport) {
														audioAlienDeath.currentTime = 0;
														audioAlienDeath.play();
													}
													//	Add to the player's score for each downed alien.
													//	Aliens in the back rows are worth more.
													if (i === 0) {
														score += 30;
													} else if (i < 3) {
														score += 20;
													} else {
														score += 10;
													}
													//	As usual when score is added, check if it's a new high score
													//	and if so, update the high score.
													if (score > highScore) {
														highScore = score;
														window.localStorage["videogame.highscore"] = highScore;
														highScoreBeaten = true;
													}

												}
											}
										}
									}
								}

								//	If the laser has been fired in the previous frame...
								if (laserFired) {
									//	If the laser is in contact with the current alien...
									if (fighter.x + (fighterWidth / 2) > aliens[i][j].x) {
										if (fighter.x + (fighterWidth / 2) < aliens[i][j].x + aliensWidth) {
											
											//	Mark the alien as dead.
											aliens[i][j].isDead = true;
											//	Create a piece of fruit in its place.
											fruits[fruitsCount].x = aliens[i][j].x;
											fruits[fruitsCount].y = aliens[i][j].y;
											fruits[fruitsCount].shown = true;
											fruitsCount += 1;
											//	Add to the player's score for each downed alien.
											//	Aliens in the back rows are worth more.
											if (i === 0) {
												score += 30;
											} else if (i < 3) {
												score += 20;
											} else {
												score += 10;	
											}
											//	As usual when score is added, check if it's a new high score
											//	and if so, update the high score.
											if (score > highScore) {
												highScore = score;
												window.localStorage["videogame.highscore"] = highScore;
												highScoreBeaten = true;
											}

										}
									}
								}
								
								//	Trigger loss conditions if a living alien is at the same height as the fighter.
								if (aliens[i][j].y >= fighter.y) {
									lossConditions();
								}

							} else {
								//	If the alien has just died in the last 10 frames, they'll be exploding,
								//	so we'll show the explosion image and tick down the counter.
								if (aliens[i][j].explosionCounter < 10) {
									context.drawImage(imageExplosion, parseInt(aliens[i][j].x, 10), parseInt(aliens[i][j].y, 10));
									aliens[i][j].explosionCounter += 1;
								}
								//	If the alien is dead and also done exploding, do nothing else here.
							}
						}
					}
					
					//	Next, determine if the alien bullet is colliding with the fighter.
					if (aliensBullet.status === "bulletFired") {
						if (aliensBullet.x > fighter.x) {
							if (aliensBullet.y + aliensBullet.height > fighter.y) {
								if (aliensBullet.x < fighter.x + fighterWidth) {
									if (aliensBullet.y + aliensBullet.height < fighter.y + fighterHeight) {
										lossConditions();
									}
								}
							}
						}
					}
					
					//	Draw fighter
					if (leftKeyDown && fighter.x > 0) {
						fighter.x -= fighterMovementRate;
					}
					if (rightKeyDown && fighter.x < canvasWidth - fighterWidth - (resFactor * 2)) {
						fighter.x += fighterMovementRate;
					}
					//	If the player has just died this frame, show an explosion
					//	at the fighter's location. Otherwise, show the fighter.
					if (gameStatus === "playerLost") {
						context.drawImage(imageExplosion, fighter.x, fighter.y);
					} else {
						context.drawImage(imageFighter, fighter.x, fighter.y);
					}

					//	 Draw bullet
					if (firingCannon) {
						//	If there is already a bullet on screen, ignore additional button presses.
						if (!fighterBullet.onScreen) {
							//	If there is not a bullet on screen, we'll add one now.
							fighterBullet.onScreen = true;
							//	Position the bullet directly above the fighter.
							fighterBullet.x = fighter.x + (fighterWidth / 2) - (fighterBullet.width / 2);
							if (audioSupport) {
								audioNormalShot.currentTime = 0;
								audioNormalShot.play();
							}
						}
						firingCannon = false;
					}

					if (fighterBullet.onScreen) {
						if (fighterBullet.y > 0) {

							//	Move the bullet farther up the screen, then draw it.
							fighterBullet.y -= fighterBullet.movementRate;
							context.fillRect(fighterBullet.x, fighterBullet.y, fighterBullet.width, fighterBullet.height);

						} else {
							//	The bullet has gone off the top of the screen, reset it.
							fighterBullet.onScreen = false;
							fighterBullet.y = fighter.y;
						}
					}
					
					//	Additional actions if the laser has been fired
					if (laserFired) {

						fruitsCount = 0;
						fruitsCollected = 0;
						backgroundColorBase = 100;
						laserBrightness = 255;
						laserFired = false;
						laserArmed = false;
					}
			
					//	Laser meter
					context.fillStyle = "#fff";

					//	If the laser is not fully charged yet...
					if (laserCharge < 400) {
						//	Continue to fill the meter.
						laserCharge += 1;	
					} else {
						
						//	If the laser has just finished charging, play the "laser armed" sound once.
						if (!laserArmed) {
							if (audioSupport) {
								audioLaserArmed.currentTime = 0;
								audioLaserArmed.play();
							}
							laserArmed = true;
						}
						
						//	Copied from the above cursorColorBase stuff. I should probably centralize this
						//	into a function or something but I need to stop working on this at some point.
						if (laserColorBaseCyclingUp) {
							if (laserColorBase < 255) {
								laserColorBase += 20;
							} else {
								laserColorBaseCyclingUp = false;
								laserColorBase -= 20;
							}
						} else {
							if (laserColorBase > 15) {
								laserColorBase -= 20;
							} else {
								laserColorBaseCyclingUp = true;
								laserColorBase += 20;
							}
						}
						context.fillStyle = "rgb(" + laserColorBase + ", " + laserColorBase + ", " + laserColorBase + ")";
					}


					//	Then draw the contents of the laser meter,
					//	depending on the current level of charge.
					context.fillRect((resFactor * 10) + 0.5, resFactor * 25, (laserCharge / (4 / resFactor)) - 0.5, (resFactor * 7));

					//	If the laser is currently on screen...
					if (laserBrightness > 0) {
						//	Set the current color of the laser, which will scale down
						context.fillStyle = "rgb(" + laserBrightness + ", " + laserBrightness + ", " + laserBrightness + ")";
						//	Draw the laser based on the current location of the fighter
						//	The extra (resFactor * 0.5) is necessary to make sure it's exactly center
						context.fillRect(parseInt(fighter.x + (fighterWidth / 2) - (resFactor * 0.5), 10), 0, resFactor, fighter.y);
						//	Scale down the brightness of the beam until it hits zero again
						laserBrightness -= 13;
					}

					//	If winCheck is still true after looping through all aliens, we know 
					//	they're all dead and the player has won, so trigger the conditions.
					if (winCheck) {
						winConditions();
					}
				}
			}
		}
	};
	
	drawTitleScreen = function () {
		//	Draw the title screen text
		context.textAlign = "center";
		context.fillStyle = context.strokeStyle = "rgb(" + textColorBase + ", " + textColorBase + ", " + textColorBase + ")";
		context.font = (resFactor * 48) + "px 'ArmaFive'";
		//	For some reason some of this text is not exactly centered,
		//	so I'll add a bit more to correct it (like the resFactor * 3 here)
		context.fillText("VIDEOGAME", (canvasWidth / 2) + (resFactor * 3), resFactor * 120);
		context.font = (resFactor * 8) + "px 'ArmaFive'";
		context.lineWidth = resFactor;

		//	Draw the controls key, but only for the desktop version.
		//	The touchscreen version has labels on its buttons so it's fine without this.
		if (!ontouchstartSupport) {
			context.strokeRect((canvasWidth / 2) - (resFactor * 58), resFactor * 223, resFactor * 115, resFactor * 63);
			context.fillText("- CONTROLS -", canvasWidth / 2, resFactor * 237);
			context.fillText("ARROW KEYS : MOVE", canvasWidth / 2, resFactor * 250);
			context.fillText("Z : NORMAL SHOT", canvasWidth / 2, resFactor * 263);
			context.fillText("X : CHARGED LASER", canvasWidth / 2, resFactor * 276);
		}
		
		context.fillText("BY STEVE COCHRANE, 2011", canvasWidth / 2, resFactor * 321);
		context.font = (resFactor * 16) + "px 'ArmaFive'";
		context.fillStyle = "rgb(" + cursorColorBase + ", " + cursorColorBase + ", " + cursorColorBase + ")";
		if (ontouchstartSupport) {
			context.fillText("PRESS FIRE TO START", canvasWidth / 2, resFactor * 195);
		} else {
			context.fillText("PRESS Z TO START", (canvasWidth / 2) + resFactor, resFactor * 195);
		}
		//	Continue to cycle the blinking text color
		cycleCursorColorBase();
	};
	
	fireHandler = function () {
		if (gameStatus === "playing") {

			//	Fire the normal weapon.
			firingCannon = true;

		} else if (gameStatus === "atTitleScreen") {
			
			//	Start the game.
			gameStatus = "fadingTitleScreenToStart";
			if (audioSupport) {
				audioTitleScreen.pause();
				audioPressStart.play();
			}
			
		} else if (gameStatus === "playerLost") {

			//	Start the game over
			if (endgameDelayTimer === 0) {
				initPlacement();
				gameStatus = "readyAndGo";
				score = 0;
				aliensMovementRate = resFactor * 0.1;
				levelNumber = 1;
			}

		} else if (gameStatus === "playerWon") {

			//	Go to the next level
			if (endgameDelayTimer === 0) {
				initPlacement();
				gameStatus = "readyAndGo";
				levelNumber += 1;
			}

		}
	};
	
	initPlacement = function () {
		//	Initialize bullets
		aliensBullet.height = fighterBullet.height = resFactor * 5;
		aliensBullet.movementRate = resFactor * 2;
		fighterBullet.movementRate = resFactor * 5;
		fighterBullet.onScreen = false;
		aliensBullet.status = "flashing";
		aliensBullet.timeCounter = 0;
		aliensBullet.width = fighterBullet.width = resFactor;
		aliensBullet.x = aliensBullet.y = 0;
		
		//	Initialize fighter
		fighter.x = resFactor * 63;
		fighter.y = fighterBullet.y = resFactor * 265;

		//	Initialize aliens
		for (i = 0; i < 5; i += 1) {
			aliens[i] = [];
			for (j = 0; j < 11; j += 1) {
				aliens[i][j] = {};
				aliens[i][j].explosionCounter = 0;
				aliens[i][j].isDead = false;
				aliens[i][j].x = (resFactor * 63) + ((resFactor * 18) * j);
				aliens[i][j].y = (resFactor * 65) + ((resFactor * 20) * i);
			}
		}
		
		//	Initialize stars (only for desktop version)
		if (!ontouchstartSupport) {
			for (i = 0; i < 20; i += 1) {
				stars[i] = {};
				stars[i].x = Math.floor(Math.random() * canvasWidth);
				stars[i].y = Math.floor(Math.random() * canvasHeight);
			}
		}
		
		//	Initialize fruits
		for (i = 0; i < 5; i += 1) {
			fruits[i] = {};
			fruits[i].shown = false;
		}
		
		//	Initialize "fruits get" text
		for (i = 0; i < 5; i += 1) {
			fruitsGetText[i] = {};
			fruitsGetText[i].brightness = 255;
			fruitsGetText[i].shown = false;
			fruitsGetText[i].x = false;
			fruitsGetText[i].y = resFactor * 265;
		}

		readyGoTimeCounter = 250;
		laserCharge = 0;
	};
	
	//	From: http://diveintohtml5.org/detect.html#storage
	//	(Modified slightly to appease JSLint)
	isLocalStorageSupported = function () {
		try {
			return window.hasOwnProperty('localStorage') && window.localStorage !== null;
		} catch (e) {
			return false;
		}
	};
	
	//	This function is called each time an image or audio element is loaded, and checks
	//	to see if all assets have been marked as loaded. If so, go to the title screen.
	isPreloadingComplete = function () {
		//	I've added a check to make sure this function does nothing once the initial 
		//	preload is complete, because Firefox was annoying and kept throwing additional 
		//	onload/canplaythrough events for some reason.
		if (gameStatus === "preloading") {
			if (audioSupport) {
				if (audioAlienDeathPreloaded && audioAlienFirePreloaded && audioFanfarePreloaded && audioFighterDeathPreloaded && audioInGamePreloaded && audioLaserPreloaded && audioLaserArmedPreloaded && audioNormalShotPreloaded && audioPressStartPreloaded && audioTitleScreenPreloaded) {
					if (imageAlienPreloaded && imageAlienFlashingPreloaded && imageExplosionPreloaded && imageFighterPreloaded && imageForcePortraitViewPreloaded && imageFruitPreloaded) {
						preloadingComplete();
					}
				}
			} else {
				if (imageAlienPreloaded && imageAlienFlashingPreloaded && imageExplosionPreloaded && imageFighterPreloaded && imageForcePortraitViewPreloaded && imageFruitPreloaded) {
					preloadingComplete();
				}
			}
		}
	};
	
	laserHandler = function () {
		if (gameStatus === "playing") {
			//	If the laser is fully charged...
			if (laserCharge === 400) {
				//	Fire the laser.
				laserCharge = 0;
				laserFired = true;
				if (audioSupport) {
					audioLaser.currentTime = 0;
					audioLaser.play();
				}
			}
		}
	};
	
	leftStartHandler = function () {
		if (gameStatus === "playing") {
			leftKeyDown = true;
		}
	};
	
	leftEndHandler = function () {
		leftKeyDown = false;
	};
	
	lossConditions = function () {
		//	A function that fires once, immediately after the player loses.
		gameStatus = "playerLost";
		endgameDelayTimer = 60;
		if (audioSupport) {
			audioInGame.pause();
			audioFighterDeath.currentTime = 0;		
			audioFighterDeath.play();
		}
		
		//	Display a black box with a white border beneath the text,
		//	so the text doesn't overlap with aliens underneath.
		context.fillStyle = "#000";
		context.strokeStyle = "#fff";
		context.fillRect(0, resFactor * 50, canvasWidth, resFactor * 45);
		context.strokeRect(-resFactor, resFactor * 50, canvasWidth + (resFactor * 2), resFactor * 45);

		//	Display the loss text on screen.
		context.textAlign = "center";
		context.fillStyle = "#fff";
		//	If the player beat their high score, add a congratulatory message.
		if (highScoreBeaten) {
			context.fillText("A NEW HIGH SCORE!!!", canvasWidth / 2, resFactor * 70);
		} else {
			//	If not, scold them.
			context.fillText("THE ALIENS ATE YOU AND YOUR PLANET", canvasWidth / 2, resFactor * 70);
		}
		if (ontouchstartSupport) {
			context.fillText("TRY AGAIN? PRESS FIRE", canvasWidth / 2, resFactor * 85);
		} else {
			context.fillText("TRY AGAIN? PRESS Z", canvasWidth / 2, resFactor * 85);
		}

		//	Reset some in-game variables for the next round.
		aliensDirection = "right";
		aliensFound = false;
		aliensMovingDown = false;
		backgroundColorBase = 0;
		highScoreBeaten = false;
		laserBrightness = 0;
		verticalMovementLog = 0;
	};

	onKeyDownHandler = function (e) {
		if (e.keyCode === 37 || e.keyCode === 175) {
			//	Left arrow key or up on Wiimote d-pad pressed
			leftStartHandler();
		} else if (e.keyCode === 39 || e.keyCode === 176) {
			//	Right arrow key or down on Wiimote d-pad pressed
			rightStartHandler();
		} else if (e.keyCode === 90 || e.keyCode === 172) {
			//	Z key or 1 button on Wiimote pressed
			fireHandler();
		} else if (e.keyCode === 88 || e.keyCode === 173) {
			//	X key or 2 button on Wiimote pressed
			laserHandler();
		}
	};

	onKeyUpHandler = function (e) {
		if (e.keyCode === 37 || e.keyCode === 178) {
			//	Left arrow key or up on Wiimote d-pad
			leftEndHandler();
		} else if (e.keyCode === 39 || e.keyCode === 177) {
			//	Right arrow key or down on Wiimote d-pad
			rightEndHandler();
		}
	};
	
	onOrientationChangeHandler = function () {
		//	This gets called right away even in desktop browsers (?) so we still need to check for 
		//	touch support just to make sure we don't display touch controls in the desktop version.
		if (ontouchstartSupport) {
			if (window.orientation === 90 || window.orientation === -90) {
				//	Store the current gameStatus so it can be easily restored
				//	once the orientation has been corrected.
				previousGameStatus = gameStatus;
				gameStatus = "inLandscapeView";
			} else {
				if (previousGameStatus) {
					gameStatus = previousGameStatus;
				} else {
					gameStatus = "preloading";
				}
			}
		}
	};
	
	//	When all assets are ready, switch to the title screen and
	//	play the title screen music.
	preloadingComplete = function () {
		gameStatus = "atTitleScreen";
		if (audioSupport) {
			audioTitleScreen.play();
		}
	};

	rightStartHandler = function () {
		if (gameStatus === "playing") {
			rightKeyDown = true;
		}
	};
	
	rightEndHandler = function () {
		rightKeyDown = false;
	};
	
	winConditions = function () {
		//	A function that fires once, immediately after the player wins.
		gameStatus = "playerWon";
		endgameDelayTimer = 60;

		context.fillStyle = "#000";
		context.fillRect(0, resFactor * 50, canvasWidth, resFactor * 40);
		
		//	Display a black box with a white border beneath the text,
		//	so the text doesn't overlap with aliens underneath.
		context.fillStyle = "#000";
		context.strokeStyle = "#fff";
		context.fillRect(0, resFactor * 50, canvasWidth, resFactor * 45);
		context.strokeRect(-resFactor, resFactor * 50, canvasWidth + (resFactor * 2), resFactor * 45);		

		//	Display the loss text on screen.
		context.textAlign = "center";
		context.fillStyle = "#fff";
		context.fillText("VICTORY!", canvasWidth / 2, resFactor * 70);
		if (ontouchstartSupport) {
			context.fillText("PRESS FIRE FOR LEVEL " + (levelNumber + 1), canvasWidth / 2, resFactor * 85);
		} else {
			context.fillText("PRESS Z FOR LEVEL " + (levelNumber + 1), canvasWidth / 2, resFactor * 85);
		}

		//	Pause in-game music, play fanfare, rejoice.
		if (audioSupport) {
			audioInGame.pause();
			audioFanfare.currentTime = 0;
			audioFanfare.play();
		}

		//	Reset some in-game variables for the next round.
		aliensDirection = "right";
		aliensFound = false;
		aliensMovementRate += (resFactor * 0.05);
		aliensMovingDown = false;
		backgroundColorBase = 0;
		highScoreBeaten = false;
		laserBrightness = 0;
		verticalMovementLog = 0;
	};
	
	window.onload = function () {
		
		//	Alright, first order of business is some minimal user agent sniffing.
		//	If the user is on an iPhone or iPod Touch, they'll need to save the game to their
		//	home screen to that the browser chrome can be removed for more space.
		//	Some of the following code is lifted from Neven Mrgan's Pie Guy: http://mrgan.com/pieguy/
		//	If the user agent contains "iPhone" or "iPod", and if the user is not currently
		//	viewing this as a saved app...
		if ((window.navigator.appVersion.indexOf("iPhone") !== -1 || window.navigator.appVersion.indexOf("iPod") !== -1) && !window.navigator.standalone) {

			//	Then we'll set a body class and show the "please save to home screen" message.
			window.document.body.setAttribute("class", "add-to-home-screen");
			addToHomeScreenMessage = window.document.createElement("p");
			addToHomeScreenMessage.setAttribute("id", "add-to-home-screen-message");
			addToHomeScreenMessage.innerHTML = "HI!<br /><br />LET'S GET THAT BROWSER CHROME<br /> OUT OF THE WAY, SHALL WE?<br /><br />PLEASE PRESS 'ADD TO HOME SCREEN'<br /> AND LAUNCH THIS AS AN APP. THANKS!";
			window.document.body.appendChild(addToHomeScreenMessage);

		} else {

			//	OK, now that that unsavory user agent sniffing is out of the way...
			//	Immediately check for touch support so we know if we should preload audio elements.
			ontouchstartSupport = window.document.createElement('div').hasOwnProperty('ontouchstart');
		
			//	Now to set up the audio elements. Audio support in mobile browsers is spotty 
			//	at the time of writing this, so we'll ignore them and disable audio here.
			if (!ontouchstartSupport) {

				//	First, create the audio elements
				audioAlienDeath = window.document.createElement("audio");
				audioAlienFire = window.document.createElement("audio");
				audioFanfare = window.document.createElement("audio");
				audioFighterDeath = window.document.createElement("audio");
				audioInGame = window.document.createElement("audio");
				audioLaser = window.document.createElement("audio");
				audioLaserArmed = window.document.createElement("audio");
				audioNormalShot = window.document.createElement("audio");
				audioPressStart = window.document.createElement("audio");
				audioTitleScreen = window.document.createElement("audio");
				for (i = 0; i < 5; i += 1) {
					audioFruitGet[i] = window.document.createElement("audio");
				}

				//	Audio support check from http://html5doctor.com/native-audio-in-the-browser/
			    if (audioPressStart.canPlayType) {
					canPlayMp4 = !!audioPressStart.canPlayType && "" !== audioPressStart.canPlayType('audio/mp4');
					canPlayOgg = !!audioPressStart.canPlayType && "" !== audioPressStart.canPlayType('audio/ogg; codecs="vorbis"');

					//	If the current browser supports MP4 audio, then map the audio elements to the m4a assets.
					//	I've chosen MP4 over MP3 just because it's newer and has slightly more efficient file sizes.
					if (canPlayMp4) {
						audioAlienDeath.setAttribute("src", "audio/alien-death.m4a");
						audioAlienFire.setAttribute("src", "audio/alien-fire.m4a");
						audioFanfare.setAttribute("src", "audio/fanfare.m4a");
						audioFighterDeath.setAttribute("src", "audio/fighter-death.m4a");
						audioInGame.setAttribute("src", "audio/in-game.m4a");
						audioLaser.setAttribute("src", "audio/laser.m4a");
						audioLaserArmed.setAttribute("src", "audio/laser-armed.m4a");
						audioNormalShot.setAttribute("src", "audio/normal-shot.m4a");
						audioPressStart.setAttribute("src", "audio/press-start.m4a");
						audioTitleScreen.setAttribute("src", "audio/title-screen.m4a");
						for (i = 0; i < 5; i += 1) {
							audioFruitGet[i].setAttribute("src", "audio/fruit-get-" + i + ".m4a");
						}
				
					//	If the current browser doesn't support m4a, map the audio elements to the ogg assets instead.
					} else if (canPlayOgg) {
						audioAlienDeath.setAttribute("src", "audio/alien-death.ogg");
						audioAlienFire.setAttribute("src", "audio/alien-fire.ogg");
						audioFanfare.setAttribute("src", "audio/fanfare.ogg");
						audioFighterDeath.setAttribute("src", "audio/fighter-death.ogg");
						audioInGame.setAttribute("src", "audio/in-game.ogg");
						audioLaser.setAttribute("src", "audio/laser.ogg");
						audioLaserArmed.setAttribute("src", "audio/laser-armed.ogg");
						audioNormalShot.setAttribute("src", "audio/normal-shot.ogg");
						audioPressStart.setAttribute("src", "audio/press-start.ogg");
						audioTitleScreen.setAttribute("src", "audio/title-screen.ogg");
						for (i = 0; i < 5; i += 1) {
							audioFruitGet[i].setAttribute("src", "audio/fruit-get-" + i + ".ogg");
						}
					}
					
					//	Thanks to the answer in this thread for the tip about canplaythrough:
					//	http://stackoverflow.com/questions/5313646/how-to-preload-a-sound-in-javascript
					//	These throw an event when an audio element can be played, which marks the audio 
					//	element as loaded, and calls the preload check function to check if all are loaded.
					audioAlienDeath.addEventListener('canplaythrough', function () { audioAlienDeathPreloaded = true; isPreloadingComplete(); }, false);
					audioAlienFire.addEventListener('canplaythrough', function () { audioAlienFirePreloaded = true; isPreloadingComplete(); }, false);
					audioFanfare.addEventListener('canplaythrough', function () { audioFanfarePreloaded = true; isPreloadingComplete(); }, false);
					audioFighterDeath.addEventListener('canplaythrough', function () { audioFighterDeathPreloaded = true; isPreloadingComplete(); }, false);
					audioInGame.addEventListener('canplaythrough', function () { audioInGamePreloaded = true; isPreloadingComplete(); }, false);
					audioLaser.addEventListener('canplaythrough', function () { audioLaserPreloaded = true; isPreloadingComplete(); }, false);
					audioLaserArmed.addEventListener('canplaythrough', function () { audioLaserArmedPreloaded = true; isPreloadingComplete(); }, false);
					audioNormalShot.addEventListener('canplaythrough', function () { audioNormalShotPreloaded = true; isPreloadingComplete(); }, false);
					audioPressStart.addEventListener('canplaythrough', function () { audioPressStartPreloaded = true; isPreloadingComplete(); }, false);
					audioTitleScreen.addEventListener('canplaythrough', function () { audioTitleScreenPreloaded = true; isPreloadingComplete(); }, false);
			
					//	Volume correction (that I probably could just done in my audio editor)
					audioAlienDeath.volume = 0.15;
					audioAlienFire.volume = 0.25;
					audioFanfare.volume = 0.5;
					audioInGame.volume = 0.25;
					audioLaserArmed.volume = 0.5;
					audioNormalShot.volume = 0.25;
					audioPressStart.volume = 0.5;
					audioTitleScreen.volume = 0.25;
					for (i = 0; i < 5; i += 1) {
						audioFruitGet[i].volume = 0.25;
					}
			
					//	And some of these need to be looped, so we'll set that here.
					//	First I'll check if the current browser supports looping, and if not,
					//	I'll use a more roundabout method that works elsewhere.
					//	See: http://stackoverflow.com/questions/3273552/html-5-audio-looping
					if (typeof audioAlienDeath.loop === 'boolean') {
						audioInGame.loop = true;
						audioTitleScreen.loop = true;
					} else {
						audioInGame.addEventListener('ended', function () {
							this.currentTime = 0;
						}, false);
						audioTitleScreen.addEventListener('ended', function () {
							this.currentTime = 0;
						}, false);
					}
			
			    } else {
					//	If neither format is supported, then we'll make a note for later
					//	to not attempt to play any audio files.
					audioSupport = false;
				}
			} else {
				//	Same thing: if we're on a mobile device, mark audio support as disabled.
				audioSupport = false;
			}
		
			//	Set up the canvas
			canvas = window.document.getElementById("canvas");
			canvasWidth = canvas.getAttribute("width");
			canvasHeight = canvas.getAttribute("height");
			context = canvas.getContext("2d");
			context.font = resFactor * 16 + "px 'ArmaFive'";
		
			//	Set up event listeners
			window.onkeydown = onKeyDownHandler;
			window.onkeyup = onKeyUpHandler;
			window.onorientationchange = onOrientationChangeHandler;
		
			//	Check immediately in case the app is launched in landscape mode,
			//	and show the warning image right away if so.
			onOrientationChangeHandler();

			//	Also, find the device width and set the resolution factor as a body class,
			//	so we can show the right version of the touch controls with CSS.
			//	Ideally this would be called any time the window is resized so that 
			//	the game is resized immediately while playing, but I have to draw the line somewhere.
			if (window.innerWidth < 640 || window.innerHeight < 740 || ontouchstartSupport) {

				//	Resize the canvas to half size
				canvas.setAttribute("height", "370");
				canvas.setAttribute("width", "320");
				canvasWidth = canvas.getAttribute("width");
				canvasHeight = canvas.getAttribute("height");

				//	Set the display resolution to a factor of 1
				resFactor = 1;
			}
			
			//	If the current viewport size is below the default size for the canvas,
			//	then we'll also want to make sure the touch controls are half size,
			//	so that's what this class does. However, we don't *always* want this, 
			//	because we don't want always want the half-size controls for 
			//	touch devices like tablets (i.e. this is for iPad)
			if (window.innerWidth < 640 || window.innerHeight < 740) {
				window.document.body.className = "res1x";
			}
			
			//	Lastly if their display is not big enough to display the full size, *and* they're
			//	on a desktop browser, we'll display a message in the loading screen that tells 
			//	them the browser size necessary to play at full size. Supporting multiple devices
			//	and resolutions is a real pain :(
			if ((window.innerWidth < 640 || window.innerHeight < 740) && !ontouchstartSupport) {
				showResizeMessage = true;
			}

			//	Now, switch to touch mode and add controls if necessary.
			//	If the current browser supports touch events, then we'll want to add touch controls.
			//	I like that this approach switches to a "mobile mode" without sniffing the user agent.
			if (ontouchstartSupport) {
				
				//	This class allows extra vertical space for the controls we're about to build.
				window.document.body.className += " touch";

				//	Build the touch controls.
				touchConsole = window.document.createElement("div");
				leftArrowButton = window.document.createElement("button");
				rightArrowButton = window.document.createElement("button");
				fireButton = window.document.createElement("button");
				laserButton = window.document.createElement("button");

				touchConsole.setAttribute("id", "touch-console");
				leftArrowButton.setAttribute("id", "left-arrow-button");
				rightArrowButton.setAttribute("id", "right-arrow-button");
				fireButton.setAttribute("id", "fire-button");
				laserButton.setAttribute("id", "laser-button");

				leftArrowButton.innerHTML = "&larr;";
				rightArrowButton.innerHTML = "&rarr;";
				fireButton.innerHTML = "Fire";
				laserButton.innerHTML = "Laser";
			
				//	Attach event handlers to the touch controls.
				leftArrowButton.ontouchstart = leftStartHandler;
				leftArrowButton.ontouchend = leftEndHandler;
				rightArrowButton.ontouchstart = rightStartHandler;
				rightArrowButton.ontouchend = rightEndHandler;
				fireButton.ontouchstart = fireHandler;
				laserButton.ontouchstart = laserHandler;

				//	Attach the touch controls to the DOM.
				window.document.body.appendChild(touchConsole);
				touchConsole.appendChild(leftArrowButton);
				touchConsole.appendChild(rightArrowButton);
				touchConsole.appendChild(laserButton);
				touchConsole.appendChild(fireButton);
			
				//	Ignore touch events everywhere else, so the screen can't be dragged around.
				window.document.ontouchmove = function (e) {
					e.preventDefault();
				};			

			}
		
			//	Now that we know the display resolution we can set up the images.
			imageAlien = window.document.createElement("img");
			imageAlienFlashing = window.document.createElement("img");
			imageExplosion = window.document.createElement("img");
			imageFighter = window.document.createElement("img");
			imageForcePortraitView = window.document.createElement("img");
			imageFruit = window.document.createElement("img");
			
			//	These are about the same as the above audio preload checks, though I had better 
			//	luck attaching functions instead of event listeners here.
			//	Note that these need to come *before* assigning the src attribute.
			imageAlien.onload = function () { imageAlienPreloaded = true; isPreloadingComplete(); };
			imageAlienFlashing.onload = function () { imageAlienFlashingPreloaded = true; isPreloadingComplete(); };
			imageExplosion.onload = function () { imageExplosionPreloaded = true; isPreloadingComplete(); };
			imageFighter.onload = function () { imageFighterPreloaded = true; isPreloadingComplete(); };
			imageForcePortraitView.onload = function () { imageForcePortraitViewPreloaded = true; isPreloadingComplete(); };
			imageFruit.onload = function () { imageFruitPreloaded = true; isPreloadingComplete(); };

			imageAlien.setAttribute("src", "images/" + resFactor + "x/alien.png");
			imageAlienFlashing.setAttribute("src", "images/" + resFactor + "x/alien-flashing.png");
			imageExplosion.setAttribute("src", "images/" + resFactor + "x/explosion.png");
			imageFighter.setAttribute("src", "images/" + resFactor + "x/fighter.png");
			imageForcePortraitView.setAttribute("src", "images/" + resFactor + "x/force-portrait-view.png");
			imageFruit.setAttribute("src", "images/" + resFactor + "x/fruit.png");
		
			//	Initialize the high score.
			//	If there is a value stored, use that, otherwise keep the default value of 0.
			if (isLocalStorageSupported) {
				if (window.localStorage["videogame.highscore"]) {
					highScore = window.localStorage["videogame.highscore"];
				}
			}
		
			//	Initialize variables that depend on resFactor.
			aliensHeight = resFactor * 9;
			aliensMovementRate = resFactor * 0.1;
			aliensWidth = resFactor * 13;
			fighterHeight = resFactor * 9;
			fighterMovementRate = resFactor * 3;
			fighterWidth = resFactor * 13;
			fruitsHeight = resFactor * 9;
			fruitsWidth = resFactor * 13;
		
			//	Set starting positions for all the elements on screen.
			initPlacement();
		
			//	Run the game at 60 fps.
			window.setInterval(draw, 16);
		}
	};	
}());