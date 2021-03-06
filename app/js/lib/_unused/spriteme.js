/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

SpriteMe = {};

SpriteMe.bgImageCntr = SpriteMe.spriteCntr = 0;
SpriteMe.nBgImagesBefore = 0;   // # of bg images in the page before spriting
SpriteMe.nSizeBefore = 0;       // total size of bg images before spriting
SpriteMe.nSpritesBefore = 0;    // # of bg images that were already sprites
SpriteMe.nCreatedSprites = 0;   // # of sprites created
SpriteMe.savedImages = 0;       // # of HTTP requests eliminated (includes new sprites)
SpriteMe.savedSize = 0;         // # of bytes eliminated or gained (includes new sprites)
SpriteMe.bgposZeroZero = 0;
SpriteMe.bgposTotal = 0;
SpriteMe.bIE = ( -1 != navigator.userAgent.indexOf('MSIE') );

SpriteMe.hBgImages = null;  // a hash of BgImage objects
SpriteMe.suggestedSpriteCntr = 0;
SpriteMe.aSprites = [];
SpriteMe.bToggleAll = true;
SpriteMe.backgroundColor = "none";
SpriteMe.marginX = 10;
SpriteMe.marginY = 10;
SpriteMe.marginWiggle = 20; // how much we're willing to extend the margin (in addition to marginX and marginY) if necessary to accomodate more images
SpriteMe.resizeWiggle = 20; // how much we're willing to let repeating bg images be resized so they can be sprited with other bg images of different sizes

SpriteMe.GOOD = 0;
SpriteMe.REPEATX = 1;
SpriteMe.REPEATY = 2;
SpriteMe.REPEATBOTH = 3;
SpriteMe.NARROWLEFT = 4;
SpriteMe.NARROWRIGHT = 5;
SpriteMe.SHORTTOP = 6;
SpriteMe.SHORTBOTTOM = 7;
SpriteMe.NARROWSHORT = 8;
SpriteMe.NARROWREPEAT = 9;
SpriteMe.SHORTREPEAT = 10;
SpriteMe.ALREADYSPRITE = 11;
SpriteMe.NOELEMSIZE = 12;
SpriteMe.JPG = 13;
SpriteMe.ERROR = -1;


// Crawl through all DOM elements looking for specific properties that use background images.
SpriteMe.getBgImages = function() {
﻿  SpriteMe.dprint(9, "getBgImages: enter");
﻿  var elems = SpriteMe.doc.getElementsByTagName('*');
﻿  var nElems = elems.length;
﻿  SpriteMe.hBgImages = {};

﻿  for ( var i = 0; i < nElems; i++ ) { 
﻿  ﻿  var elem = elems[i];
﻿  ﻿  var imageUrl = SpriteMe.getStyleAndUrl(elem, 'backgroundImage', true);
﻿  ﻿  if ( imageUrl && !SpriteMe.skipImage(imageUrl) ) {
﻿  ﻿  ﻿  if ( 0 == imageUrl.toLowerCase().indexOf("data:") ) {
﻿  ﻿  ﻿  ﻿  SpriteMe.dprint(5, "skipping data: URI");
﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(SpriteMe.bDataUriWarning) ) {
﻿  ﻿  ﻿  ﻿  ﻿  alert("Background images using \"data:\" URIs are not supported by SpriteMe.");
﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.bDataUriWarning = true;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  continue;
﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  imageUrl = imageUrl.replace("\\", ""); // Firefox 3.5 added a backslash to a URL that contained a comma (",")
﻿  ﻿  ﻿  if ( ! SpriteMe.hBgImages[imageUrl] ) {
﻿  ﻿  ﻿  ﻿  new SpriteMe.BgImage(imageUrl);
﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  ﻿  ﻿  new SpriteMe.ImageElement(elem, bgImage);  // this adds the element to bgImage
﻿  ﻿  }
﻿  }

﻿  SpriteMe.nBgImagesBefore = SpriteMe.bgImageCntr;
﻿  SpriteMe.nSpritesBefore = SpriteMe.spriteCntr;
};


SpriteMe.getData = function(nTry) {
﻿  SpriteMe.dprint(9, "getData: enter");

﻿  // Need to wait for all of the background images to be fetched.
﻿  nTry = ( nTry ? nTry+1 : 1 );
﻿  if ( ! SpriteMe.doneFetching() && nTry < 10 ) {
﻿  ﻿  SpriteMe.dprint(5, "getData: calling setTimeout to wait for images to load, nTry = " + nTry);
﻿  ﻿  setTimeout("SpriteMe.getData(" + nTry + ")", 500);
﻿  ﻿  return;
﻿  }

﻿  // Iterate through all the BG images and their elements to gather information (repeat, background-position, etc.).
﻿  for ( var imageUrl in SpriteMe.hBgImages ) {
﻿  ﻿  if ( SpriteMe.hBgImages.hasOwnProperty(imageUrl) ) {
﻿  ﻿  ﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  ﻿  ﻿  bgImage.getDataFromElements();
﻿  ﻿  }
﻿  }

﻿  SpriteMe.createSuggestedSprites();
﻿  SpriteMe.showSpritemePanel();
};


// Main spriting logic: decide which images can be sprited together.
SpriteMe.createSuggestedSprites = function() {
﻿  SpriteMe.dprint(9, "SpriteMe.createSuggestedSprites: enter");

﻿  // Sort the images by iState.
﻿  var hStates = [];
﻿  for ( var imageUrl in SpriteMe.hBgImages ) {
﻿  ﻿  if ( SpriteMe.hBgImages.hasOwnProperty(imageUrl) ) {
﻿  ﻿  ﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  ﻿  ﻿  if ( "undefined" === typeof(hStates[bgImage.iState]) ) {
﻿  ﻿  ﻿  ﻿  hStates[bgImage.iState] = [];
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  hStates[bgImage.iState][hStates[bgImage.iState].length] = bgImage;
﻿  ﻿  }
﻿  }


﻿  // GOOD and NARROWLEFT
﻿  var aTmpBgImages = [];
﻿  var state = SpriteMe.GOOD;
﻿  if ( hStates[state] && 0 < hStates[state].length ) {
﻿  ﻿  aTmpBgImages = aTmpBgImages.concat(hStates[state]);
﻿  }
﻿  state = SpriteMe.NARROWLEFT;
﻿  if ( hStates[state] && 0 < hStates[state].length ) {
﻿  ﻿  aTmpBgImages = aTmpBgImages.concat(hStates[state]);
﻿  }
﻿  if ( 1 < aTmpBgImages.length ) {
﻿  ﻿  var spriteObj = new SpriteMe.Sprite("vertical, varied width", aTmpBgImages);
﻿  ﻿  SpriteMe.suggestedSpriteCntr++;
﻿  }


﻿  // REPEATX
﻿  state = SpriteMe.REPEATX;
﻿  if ( hStates[state] && 1 < hStates[state].length ) {
﻿  ﻿  // Sort images by width.
﻿  ﻿  var hWidths = {};
﻿  ﻿  var aCombine = [];
﻿  ﻿  for ( var i = 0; i < hStates[state].length; i++ ) {
﻿  ﻿  ﻿  var bgImage = hStates[state][i];
﻿  ﻿  ﻿  if ( "undefined" === typeof(hWidths[bgImage.width]) ) {
﻿  ﻿  ﻿  ﻿  hWidths[bgImage.width] = [];
﻿  ﻿  ﻿  ﻿  if ( bgImage.width <= SpriteMe.resizeWiggle ) {
﻿  ﻿  ﻿  ﻿  ﻿  aCombine[aCombine.length] = bgImage.width;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  hWidths[bgImage.width][hWidths[bgImage.width].length] = bgImage;
﻿  ﻿  }

﻿  ﻿  // We can resize repeat-x bg images of different widths.
﻿  ﻿  if ( aCombine.length ) {
﻿  ﻿  ﻿  var resizeWidth = SpriteMe.lcm(aCombine);
﻿  ﻿  ﻿  if ( resizeWidth <= SpriteMe.resizeWiggle ) {
﻿  ﻿  ﻿  ﻿  var aTmpBgImages = [];
﻿  ﻿  ﻿  ﻿  for ( var ac = 0; ac < aCombine.length; ac++ ) {
﻿  ﻿  ﻿  ﻿  ﻿  var acw = aCombine[ac];
﻿  ﻿  ﻿  ﻿  ﻿  aTmpBgImages = aTmpBgImages.concat(hWidths[acw]);
﻿  ﻿  ﻿  ﻿  ﻿  hWidths[acw] = undefined;
﻿  ﻿  ﻿  ﻿  ﻿  delete hWidths[acw]; // so we don't catch this in the logic below
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  for ( var i = 0; i < aTmpBgImages.length; i++ ) {
﻿  ﻿  ﻿  ﻿  ﻿  var bgImage = aTmpBgImages[i];
﻿  ﻿  ﻿  ﻿  ﻿  bgImage.resizeWidth = resizeWidth;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  if ( 1 < aTmpBgImages.length ) {
﻿  ﻿  ﻿  ﻿  ﻿  var spriteObj = new SpriteMe.Sprite("repeat-x width=" + resizeWidth, aTmpBgImages);
﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.suggestedSpriteCntr++;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  }

﻿  ﻿  // Handle any other repeat-x bg images we didn't catch in the resize logic above.
﻿  ﻿  for ( var width in hWidths ) {
﻿  ﻿  ﻿  if ( hWidths.hasOwnProperty(width) ) {
﻿  ﻿  ﻿  ﻿  if ( 1 < hWidths[width].length ) {
﻿  ﻿  ﻿  ﻿  ﻿  var spriteObj = new SpriteMe.Sprite("repeat-x width=" + width, hWidths[width]);
﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.suggestedSpriteCntr++;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }


﻿  // REPEATY
﻿  state = SpriteMe.REPEATY;
﻿  if ( hStates[state] && 1 < hStates[state].length ) {
﻿  ﻿  // Sort images by height.
﻿  ﻿  var hHeights = {}
﻿  ﻿  var aCombine = [];
﻿  ﻿  for ( var i = 0; i < hStates[state].length; i++ ) {
﻿  ﻿  ﻿  var bgImage = hStates[state][i];
﻿  ﻿  ﻿  if ( "undefined" === typeof(hHeights[bgImage.height]) ) {
﻿  ﻿  ﻿  ﻿  hHeights[bgImage.height] = [];
﻿  ﻿  ﻿  ﻿  if ( bgImage.height <= SpriteMe.resizeWiggle ) {
﻿  ﻿  ﻿  ﻿  ﻿  aCombine[aCombine.length] = bgImage.height;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  hHeights[bgImage.height][hHeights[bgImage.height].length] = bgImage;
﻿  ﻿  }

﻿  ﻿  // We can resize repeat-x bg images of different widths.
﻿  ﻿  if ( aCombine.length ) {
﻿  ﻿  ﻿  var resizeHeight = SpriteMe.lcm(aCombine);
﻿  ﻿  ﻿  if ( resizeHeight <= SpriteMe.resizeWiggle ) {
﻿  ﻿  ﻿  ﻿  var aTmpBgImages = [];
﻿  ﻿  ﻿  ﻿  for ( var ac = 0; ac < aCombine.length; ac++ ) {
﻿  ﻿  ﻿  ﻿  ﻿  var acw = aCombine[ac];
﻿  ﻿  ﻿  ﻿  ﻿  aTmpBgImages = aTmpBgImages.concat(hHeights[acw]);
﻿  ﻿  ﻿  ﻿  ﻿  hHeights[acw] = undefined;
﻿  ﻿  ﻿  ﻿  ﻿  delete hHeights[acw]; // so we don't catch this in the logic below
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  for ( var i = 0; i < aTmpBgImages.length; i++ ) {
﻿  ﻿  ﻿  ﻿  ﻿  var bgImage = aTmpBgImages[i];
﻿  ﻿  ﻿  ﻿  ﻿  bgImage.resizeHeight = resizeHeight;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  var spriteObj = new SpriteMe.Sprite("repeat-x width=" + resizeHeight, aTmpBgImages);
﻿  ﻿  ﻿  ﻿  SpriteMe.suggestedSpriteCntr++;
﻿  ﻿  ﻿  }
﻿  ﻿  }

﻿  ﻿  // Handle any other repeat-x bg images we didn't catch in the resize logic above.
﻿  ﻿  for ( var height in hHeights ) {
﻿  ﻿  ﻿  if ( hHeights.hasOwnProperty(height) ) {
﻿  ﻿  ﻿  ﻿  if ( 1 < hHeights[height].length ) {
﻿  ﻿  ﻿  ﻿  ﻿  var spriteObj = new SpriteMe.Sprite("repeat-y height=" + height, hHeights[height]);
﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.suggestedSpriteCntr++;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }

﻿  // containing block is wider - just stack horizontally!
﻿  state = SpriteMe.SHORTTOP;
﻿  if ( hStates[state] && 1 < hStates[state].length ) {
﻿  ﻿  var spriteObj = new SpriteMe.Sprite("taller containing block", hStates[state]);
﻿  ﻿  SpriteMe.suggestedSpriteCntr++;
﻿  }
};


// Render the topmost SpriteMe panel.
SpriteMe.showSpritemePanel = function() {
﻿  SpriteMe.dprint(9, "SpriteMe.showSpritemePanel: enter");

﻿  var sHtml = "";

﻿  // Draw the suggested sprites.
﻿  if ( SpriteMe.aSprites.length ) {
﻿  ﻿  sHtml += "<h1 id=spritemesuggestedheader>Suggested Sprites</h1>\n";
﻿  ﻿  for ( var i = 0; i < SpriteMe.aSprites.length; i++ ) {
﻿  ﻿  ﻿  var spriteObj = SpriteMe.aSprites[i];
﻿  ﻿  ﻿  sHtml += spriteObj.getHtml();
﻿  ﻿  }
﻿  }


﻿  // list all the unused CSS bg images
﻿  var sUnused = "";
﻿  var unusedBgImages = [];
﻿  for ( var imageUrl in SpriteMe.hBgImages ) {
﻿  ﻿  if ( SpriteMe.hBgImages.hasOwnProperty(imageUrl) ) {
﻿  ﻿  ﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  ﻿  ﻿  if ( "undefined" === typeof(bgImage.bUsed) ) {
﻿  ﻿  ﻿  ﻿  sUnused += bgImage.getHtml(true);
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }

﻿  sHtml += "<h1 id=spritemeunspritedheader>Non-Sprited Images</h1>\n" + 
﻿      "<div id=spritemeunsprited class=spritemespritediv style='border: 2px solid #CAC; background: transparent;'>" + 
﻿      sUnused + 
﻿      "<div class=spritemesortable style='line-height: 2px; background: transparent;'>&nbsp;</div>\n" +
﻿      "<div class=spritemesortable style='line-height: 2px; background: transparent;'>&nbsp;</div>\n" +
﻿      "</div>\n";


﻿  if ( 0 === SpriteMe.bgImageCntr ) {
﻿  ﻿  sHtml += '<div style="font-size: 12px; font-weight: bold; margin-top: 8px; color: #C00;">No CSS background images were found. Nothing to sprite!</div>';
﻿  }

﻿  sHtml = 
﻿  '<div id=spritemetitlebar class=spritemetitlebar>' +
﻿  '<a href="javascript:SpriteMe.toggleMin(1)" title="minimize"><img border=0 src="http://spriteme.org/images/minimize-10x11-t.png"></a>' +
﻿  '<a href="javascript:SpriteMe.closeSpriteMe()" style="padding-left: 4px;" title="close"><img border=0 src="http://spriteme.org/images/close-10x11-t.png"></a>' + 
﻿  '</div>' +
﻿  '<div style="padding: 2px 8px 0 8px;">' +
﻿  '<div style="float: right; text-align: right; margin-bottom: 4px; padding: 2px 0 2px 0; background: transparent;">' +
﻿  '<nobr><a class=spritemebuttonlink href="javascript:SpriteMe.makeAll()" style="color: white;" title="create all suggested sprites">make all</a>' +
﻿  '&nbsp;&nbsp;<a class=spritemebuttonlink href="javascript:SpriteMe.customSprite()" style="color: white;" title="create your own sprite">new sprite</a>' +
﻿  '&nbsp;&nbsp;<a class=spritemebuttonlink href="javascript:SpriteMe.exportCSS()" style="color: white;" title="export CSS changes">export CSS</a>' +
﻿  //'&nbsp;&nbsp;<a class=spritemebuttonlink href="javascript:SpriteMe.toggleAll()" style="color: white;" title="expand/collapse all lists of elements">toggle all</a>' +
﻿  '&nbsp;&nbsp;<a href="http://spriteme.org/faq.php" target="_blank"><img style="background: #F1E7F1; vertical-align: bottom;" border=0 width=15 height=16 src="http://spriteme.org/images/help-15x16-transp.gif"></nobr></a>' + 
﻿  '</div>' +
﻿  '<div style="margin-bottom: 6px; background: transparent;">' +
﻿  '<a title="SpriteMe home" href="http://spriteme.org/" target="_blank" style="background: transparent;"><img src="http://spriteme.org/images/logo-16x16.png" border=0 width=16 height=16></a>' +
﻿  '&nbsp;<a title="SpriteMe home" class=spritemehoverlink href="http://spriteme.org/" target="_blank" style="font-size: 2em; color: #404; font-weight: bold; background: transparent;">SpriteMe</a></div>' + 
﻿  SpriteMe.prettySavings() +
﻿  sHtml + 
﻿  '</div>';

﻿  // It's tricky to add an inline style block to the head.
﻿  var sStyle =
﻿      ".spritemepanel, .spritememin, .spritemepanel * { color: #000; background: #F1E7F1; margin: 0; padding: 0; font-family: Arial,Helvetica; font-size: 8pt; text-align: left; line-height: normal; font-weight: normal; }\n" + 
﻿      ".spritemetitlebar { background: #202; padding: 2px; text-align: right; }\n" +
﻿      ".spritemetitlebar:hover { cursor: move; }\n" +
﻿      ".spritemetitlebar A, .spritemetitlebar IMG { background: transparent; text-decoration: none; }\n" +
﻿      ".spritemespritediv { border: 2px solid #CAC; margin-bottom: 8px; padding: 4px; background: white; }\n" +
﻿      ".spritemespritediv * { background: white; }\n" +
﻿      ".spritemeimagediv { color: #FFF; background: black; margin: 0; padding: 0; font-family: Arial,Helvetica; font-size: 8pt; text-align: left; line-height: normal; }\n" +
﻿      ".spritemepanel A, .spritememin, .spritemeimagediv A { text-decoration: underline; color: #00C; border: 0; }\n" +
﻿      ".spritemepanel H1 { font-weight: bold; font-size: 1.2em; margin-top: 16px; margin-bottom: 4px; }\n" +
﻿      "#spritemesavings { border-spacing: 8pt 2pt; width: auto; border-collapse: separate; }\n" +
﻿      ".spritemesavings TH { text-align: center; font-weight: bold; padding: 0 2px 0 2px; border: 0; }\n" +
﻿      ".spritemesavings TD { text-align: right; border: 0; }\n" +
﻿      "TD.spritemenum { text-align: right; padding: 0 4px 0 4px; background: #FFF; border: 1px solid #CCC; }\n" +
﻿      "DIV.spritemeemptybgimage { border: 1px dotted #FFF; list-style: none; line-height: 2px; }\n" +
﻿      "DIV.spritemebgimage { background: #FFF; cursor: move; border: 1px dotted #FFF; list-style: none; }\n" +
﻿      "DIV.spritemebgimage:hover { border-color: #333; }\n" +
﻿      ".spritemebgimage * { background: transparent; }\n" +
﻿      "#spritemeunsprited .spritemebgimage { margin-bottom: 8px; }\n" +
﻿      "DIV.spritemeelem { margin-bottom: 4px; list-style: none; }\n" +
﻿      "A.spritemeelemhighlight { background: #EEE; color: #404; text-decoration: none; padding: 0 2px 0 2px; line-height: 70%; border: 1px dotted #999; }\n" +
﻿      "A.spritemeelemhighlight:hover { background: #EA3; border: 1px solid red; }\n" +
﻿      "A.spritemeelemselected { background: #EA3; color: #404; text-decoration: none; padding: 0 2px 0 2px; line-height: 70%; border: 2px solid red; }\n" +
﻿      "A.spritemebuttonlink { padding: 0 4px 0 4px; border: 2px ridge #B0B; text-decoration: none; color: white; background: #404; }\n" +
﻿      "A.spritemebuttonlink:hover { border-color: #404; background: #B0B; }\n" +
﻿      "A.spritemehoverlink { text-decoration: none; }\n" +
﻿      "A.spritemehoverlink:hover { text-decoration: underline; }\n" +
﻿      ".spritemeimagecount { background: white; border: 1px solid black; padding: 0 4px 0 4px; font-weight: bold;}\n" + 
﻿      "";
﻿  var spritemestyle = ( SpriteMe.bIE ? SpriteMe.doc.createStyleSheet() : SpriteMe.doc.createElement('style') );
﻿  spritemestyle[ ( SpriteMe.bIE ? 'cssText' : ( -1 != navigator.userAgent.indexOf('WebKit') ? 'innerText' : 'innerHTML' ) ) ] = sStyle;
﻿  if ( ! SpriteMe.bIE ) {
﻿  ﻿  SpriteMe.doc.getElementsByTagName('head')[0].appendChild(spritemestyle);
﻿  }

﻿  var spritemepanel = SpriteMe.doc.createElement('div');
﻿  spritemepanel.id = "spritemepanel";
﻿  spritemepanel.className = "spritemepanel";
﻿  spritemepanel.innerHTML = sHtml;
﻿  spritemepanel.style.cssText = 
﻿      "position: absolute; right: 10px; top: 40px; width: 400px; border: 2px solid #000; padding: 0; z-index: 12800; background: #F1E7F1;";
﻿  SpriteMe.doc.body.appendChild(spritemepanel);

﻿  SpriteMe.enableDnD();
﻿  SpriteMe.stopSpinner();
﻿  SpriteMe.dprint(8, "0% 0% = " + SpriteMe.bgposZeroZero + "/" + SpriteMe.bgposTotal);
﻿  SpriteMe.nSpritesBefore = SpriteMe.spriteCntr;

﻿  if ( "function" === typeof(SpriteMe_autospriteCallback) ) {
﻿  ﻿  SpriteMe.autoSprite();
﻿  }
};


SpriteMe.enableDnD = function() {
﻿  $('#spritemepanel').sortable({
﻿  ﻿  opacity: 0.4,
﻿  ﻿  stop: function(event, ui) { SpriteMe.handleDrop(ui.item); },
﻿  ﻿  items: '.spritemesortable',
        axis : 'y'
      });

﻿  $('#spritemepanel').draggable({handle: '#spritemetitlebar'});
};


SpriteMe.handleDrop = function(item) {
﻿  var bgImage = SpriteMe.getBgImage(item.context.id);
﻿  if ( bgImage ) {
﻿  ﻿  var spriteObj = SpriteMe.aSprites[bgImage.iSprite-1];
﻿  ﻿  // This is a little hacky: Rather than deal with drag&drop handlers, we update
﻿  ﻿  // the sprite's bgImage array based on the sortable HTML elements it contains.
﻿  ﻿  // See SpriteMe.requestSprite().
﻿  }
};


SpriteMe.doneFetching = function() {
﻿  for ( var imageUrl in SpriteMe.hBgImages ) {
﻿  ﻿  if ( SpriteMe.hBgImages.hasOwnProperty(imageUrl) ) {
﻿  ﻿  ﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  ﻿  ﻿  if ( !bgImage.width && !bgImage.bError ) {
﻿  ﻿  ﻿  ﻿  return false;
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }

﻿  return true;
};


SpriteMe.toggleMin = function(bMinify) {
﻿  var spritemepanel = SpriteMe.doc.getElementById('spritemepanel');
﻿  if ( spritemepanel ) {
﻿  ﻿  if ( bMinify ) {
﻿  ﻿  ﻿  spritemepanel.style.display = "none";
﻿  ﻿  ﻿  var spritemeimagediv = SpriteMe.doc.getElementById('spritemeimagediv');
﻿  ﻿  ﻿  if ( spritemeimagediv ) {
﻿  ﻿  ﻿  ﻿  spritemeimagediv.style.display = "none";
﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  var spritememin = SpriteMe.doc.getElementById('spritememin');
﻿  ﻿  ﻿  if ( ! spritememin ) {
﻿  ﻿  ﻿  ﻿  spritememin = SpriteMe.doc.createElement('div');
﻿  ﻿  ﻿  ﻿  spritememin.innerHTML = "<a title='display the SpriteMe panel' style='color: #FFF; font-weight: bold; font-size: 1.3em;' href='javascript:SpriteMe.toggleMin(0)'>SpriteMe</a>";
﻿  ﻿  ﻿  ﻿  spritememin.id = "spritememin";
﻿  ﻿  ﻿  ﻿  spritememin.className = "spritememin";
﻿  ﻿  ﻿  ﻿  spritememin.style.cssText = 
﻿  ﻿  ﻿  ﻿  ﻿  "position: absolute; right: 10px; top: 40px; width: 80px; border: 2px solid #404; padding: 4px 8px 4px 8px; z-index: 12801; background: #606; text-align: center; color: #FFF; opacity: 0.6; -moz-opacity: 0.6; filter: alpha(opacity=60);";
﻿  ﻿  ﻿  ﻿  SpriteMe.doc.body.appendChild(spritememin);
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  spritememin.style.display = "block";
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  SpriteMe.doc.getElementById('spritememin').style.display = "none";

﻿  ﻿  ﻿  spritemepanel.style.display = "block";
﻿  ﻿  ﻿  var spritemeimagediv = SpriteMe.doc.getElementById('spritemeimagediv');
﻿  ﻿  ﻿  if ( spritemeimagediv ) {
﻿  ﻿  ﻿  ﻿  spritemeimagediv.style.display = "block";
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }
};


SpriteMe.closeSpriteMe = function() {
﻿  SpriteMe.closeImage();
﻿  SpriteMe.elemUnhighlight();

﻿  var spritemepanel = SpriteMe.doc.getElementById('spritemepanel');
﻿  if ( spritemepanel ) {
﻿  ﻿  SpriteMe.doc.body.removeChild(spritemepanel);
﻿  }
};


SpriteMe.closeImage = function() {
﻿  var spritemeimagediv = SpriteMe.doc.getElementById('spritemeimagediv');
﻿  if ( spritemeimagediv ) {
﻿  ﻿  SpriteMe.doc.body.removeChild(spritemeimagediv);
﻿  }
};


SpriteMe.doHover = function(imageUrl) {
﻿  var spritemeimagediv = SpriteMe.doc.getElementById('spritemeimagediv');
﻿  if ( ! spritemeimagediv ) {
﻿  ﻿  spritemeimagediv = SpriteMe.doc.createElement('div');
﻿  ﻿  spritemeimagediv.id = "spritemeimagediv";
﻿  ﻿  spritemeimagediv.className = "spritemeimagediv";
﻿  ﻿  spritemeimagediv.style.cssText = 
﻿  ﻿  ﻿  "position: absolute; right: 450px; top: 40px; border: 2px solid #444; padding: 2px 4px 4px 4px; z-index: 12801;";
﻿  ﻿  SpriteMe.doc.body.appendChild(spritemeimagediv);
﻿  }

﻿  if ( spritemeimagediv.src != imageUrl ) {
﻿  ﻿  spritemeimagediv.style.display = "none";
﻿  ﻿  spritemeimagediv.src = imageUrl;
﻿  ﻿  spritemeimagediv.innerHTML = '<div style="text-align: right; margin-bottom: 4px; font-size: 8pt;"><a class=spritemebuttonlink style="color: white;" href="javascript:SpriteMe.closeImage()">close</a></div><img style="background: url(http://spriteme.org/images/hash-bg.gif) repeat;" src="' + imageUrl + '">';
﻿  ﻿  spritemeimagediv.style.top = ( ( SpriteMe.bIE ? SpriteMe.doc.body.scrollTop : window.scrollY ) + 40) + 'px';
﻿  ﻿  spritemeimagediv.style.display = "block";
﻿  }
};


SpriteMe.requestSprite = function(iSprite) {
﻿  // This is a little hacky: Rather than deal with drag&drop handlers, we update
﻿  // the sprite's bgImage array based on the sortable HTML elements it contains.
﻿  var spriteObj = SpriteMe.aSprites[iSprite];
﻿  if ( !spriteObj ) {
﻿  ﻿  SpriteMe.dprint(0, "ERROR: SpriteMe.requestSprite - couldn't find sprite #" + iSprite);
﻿  ﻿  return;
﻿  }

﻿  spriteObj.updateBgImages(); // update any drag&drop bg images

﻿  if ( 0 == spriteObj.bgImages.length ) {
﻿  ﻿  alert("Drag some images into this sprite before making it.");
﻿  ﻿  return;
﻿  }

﻿  var sJson = "";
﻿  var sPrevJson = "";
﻿  var iLeft = iTop = 0;
﻿  var iTotalHeight = iTotalWidth = 0;
﻿  for ( var i = 0; i < spriteObj.bgImages.length; i++ ) {
﻿  ﻿  var bgImage = spriteObj.bgImages[i];
﻿  ﻿  iTop = ( spriteObj.bVertical ? iTop + bgImage.marginTop : bgImage.marginTop );
﻿  ﻿  iLeft = ( !spriteObj.bVertical ? iLeft + bgImage.marginLeft : bgImage.marginLeft );
﻿  ﻿  sJson += ( sJson ? ', ' : '' ) + '{"url":"' + bgImage.url + '", "top":' + iTop + ', "left":' + iLeft + '}';
﻿  ﻿  bgImage.spriteTop = iTop;
﻿  ﻿  bgImage.spriteLeft = iLeft;
﻿  ﻿  if ( spriteObj.bVertical ) {
﻿  ﻿  ﻿  if ( "undefined" === typeof(bgImage.resizeWidth) ) {
﻿  ﻿  ﻿  ﻿  iTotalWidth = ( iTotalWidth < bgImage.width+bgImage.marginLeft+bgImage.marginRight ? 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  bgImage.width+bgImage.marginLeft+bgImage.marginRight : iTotalWidth );
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  var nRepeats = parseInt(bgImage.resizeWidth/bgImage.width);
﻿  ﻿  ﻿  ﻿  for ( var nr = 0; nr < nRepeats; nr++ ) {
﻿  ﻿  ﻿  ﻿  ﻿  sJson += ', {"url":"' + bgImage.url + '", "top":' + iTop + ', "left":' + (iLeft+((nr+1)*bgImage.width)) + '}';
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  iTotalWidth = ( iTotalWidth < bgImage.resizeWidth+bgImage.marginLeft+bgImage.marginRight ? 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  bgImage.resizeWidth+bgImage.marginLeft+bgImage.marginRight : iTotalWidth );
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  iTop += bgImage.height + bgImage.marginBottom;
﻿  ﻿  ﻿  iTotalHeight = iTop;
﻿  ﻿  ﻿  iLeft = iLeft;
﻿  ﻿  }
﻿  ﻿  else { // horizontal
﻿  ﻿  ﻿  iLeft += bgImage.width + bgImage.marginRight;
﻿  ﻿  ﻿  iTotalWidth = iLeft;
﻿  ﻿  ﻿  iTop = iTop;
﻿  ﻿  ﻿  iTotalHeight = ( iTotalHeight < bgImage.height+bgImage.marginTop+bgImage.marginBottom ? 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿   bgImage.height+bgImage.marginTop+bgImage.marginBottom : iTotalHeight );
﻿  ﻿  }
﻿  ﻿  if ( 3500 < sJson.length ) {
﻿  ﻿  ﻿  sJson = sPrevJson;
﻿  ﻿  ﻿  alert("Not all of the images can be combined into one sprite because the image URLs are too long."); // bug #30
﻿  ﻿  ﻿  break;
﻿  ﻿  }
﻿  ﻿  sPrevJson = sJson;
﻿  }

﻿  if ( sJson ) {
﻿  ﻿  coolRunnings = undefined;
﻿  ﻿  SpriteMe.closeImage();
﻿  ﻿  SpriteMe.elemUnhighlight();  // need to do this so the element's size is normal when injecting the sprite image
﻿  ﻿  sJson = '{"canvas": {"name":"' + spriteObj.filename + '", "height":' + iTotalHeight + ',"width":' + iTotalWidth + ', "background-color":"' + spriteObj.bgColor + '","comments":"normally"},"images":[' + sJson + ']}';
﻿  ﻿  var makeUrl = "http://jaredhirsch.com/coolrunnings/index.php?t=" + Number(new Date()) + "&format=json&absolute=" + sJson;
﻿  ﻿  var domscript = SpriteMe.doc.createElement('script');
﻿  ﻿  domscript.src = makeUrl;
﻿  ﻿  domscript.onloadDone = false;
﻿  ﻿  domscript.onload = function() { 
﻿  ﻿  ﻿  if ( !domscript.onloadDone ) {
﻿  ﻿  ﻿  ﻿  domscript.onloadDone = true;
﻿  ﻿  ﻿  ﻿  SpriteMe.handleSprite(spriteObj);
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  domscript.onreadystatechange = function() { 
﻿  ﻿  ﻿  if ( "loaded" === domscript.readyState && ! domscript.onloadDone ) {
﻿  ﻿  ﻿  ﻿  domscript.onloadDone = true; 
﻿  ﻿  ﻿  ﻿  SpriteMe.handleSprite(spriteObj);
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  domscript.onerror = function() { 
﻿  ﻿  ﻿  SpriteMe.abortSprite();
﻿  ﻿  ﻿  if ( "function" != typeof(SpriteMe_autospriteCallback) ) {
﻿  ﻿  ﻿  ﻿  alert("An error occurred trying to create the sprite image.");
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  SpriteMe.showSpinner();
﻿  ﻿  SpriteMe.doc.body.appendChild(domscript);
﻿  }
};


SpriteMe.makeAll = function() {
﻿  SpriteMe_autospriteCallback = function() {};
﻿  SpriteMe.autoSprite();
};


// Display a sprite container where the user can create their own custom sprite via D&D.
SpriteMe.customSprite = function() {
﻿  var spriteObj = new SpriteMe.Sprite("new sprite <span style='color: #888; font-weight: normal;'>(drag&amp;drop here)</span>", undefined);

﻿  var container = SpriteMe.doc.createElement("div");
﻿  container.id = spriteObj.id;
﻿  container.className = "spritemespritediv";

﻿  var header = SpriteMe.doc.getElementById("spritemesuggestedheader");
﻿  if ( header ) {
﻿  ﻿  header.parentNode.insertBefore(container, header.nextSibling);
﻿  ﻿  setTimeout(function() { spriteObj.getHtml(true, false); }, 50);
﻿  }
};


SpriteMe.abortSprite = function() {
﻿  SpriteMe.bAbortSprite = true;
﻿  SpriteMe.stopSpinner();
};


SpriteMe.handleSprite = function(spriteObj) {
﻿  if ( SpriteMe.bAbortSprite ) {
﻿  ﻿  SpriteMe.bAbortSprite = false;
﻿  ﻿  return;
﻿  }

﻿  if ( "undefined" === typeof(coolRunnings) ) {
﻿  ﻿  SpriteMe.dprint(1, "request to coolRunnings failed");
﻿  ﻿  return;
﻿  }

﻿  SpriteMe.stopSpinner();
﻿  spriteObj.spritify(coolRunnings.url, coolRunnings.spriteWidth, coolRunnings.spriteHeight, coolRunnings.inputSize, coolRunnings.outputSize);
﻿  spriteObj.getHtml(true, true);
﻿  SpriteMe.nCreatedSprites++;
﻿  
﻿  if ( "function" === typeof(SpriteMe_autospriteCallback) ) {
﻿  ﻿  SpriteMe.autoSprite();
﻿  }
};


SpriteMe.hBgImageRules = {}; // a hash of arrays - hash key is the bg image URL
SpriteMe.hBgPosRules = {};   // a hash of arrays - hash key is the bg position string
SpriteMe.exportCSS = function() {
﻿  if ( 0 === SpriteMe.nCreatedSprites ) {
﻿  ﻿  alert("Make some sprites first, and then you can export the CSS changes.");
﻿  ﻿  return;
﻿  }

﻿  var hChanges = {}; // hash of strings where the hash key is the stylesheet's URL


﻿  // *** begin INLINE STYLE ATTRIBUTES
﻿  // Iterate through every DOM element that has a bg image that is now in a sprite.
﻿  // Check if the background-image is part of the element's inline style (no rules).
﻿  // As a side effect, build a list of the sprite URLs.
﻿  var bSecondPass = false;
﻿  var sInlineStyleAttributes = "inline style attributes";
﻿  var sSpriteUrls = "";
﻿  for ( var i = 0; i < SpriteMe.aSprites.length; i++ ) {
﻿  ﻿  var spriteObj = SpriteMe.aSprites[i];
﻿  ﻿  if ( spriteObj.spriteUrl ) {
﻿  ﻿  ﻿  sSpriteUrls += "<li> <a href='" + spriteObj.spriteUrl + "' target='_blank'>" + spriteObj.spriteUrl + "</a></li>";
﻿  ﻿  ﻿  for ( var e = 0; e < spriteObj.bgImages[0].imgElements.length; e++ ) {
﻿  ﻿  ﻿  ﻿  var elemObj = spriteObj.bgImages[0].imgElements[e];
﻿  ﻿  ﻿  ﻿  if ( elemObj.oldBgImageInline ) {
﻿  ﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(hChanges[sInlineStyleAttributes]) ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  hChanges[sInlineStyleAttributes] = "<div style='margin-bottom: 8px;'>These elements in the page have their background-image set using the <code>style</code> attribute. You need to find each of these elements and change their <code>style</code>. To help you out, the following information is shown for each element:<ul style='margin-top: 0'><li>tagName (DIV, A, etc.)<li>classname (if there is one)<li> ID (if there is one)<li> <strike>old background-image</strike> (striked out)<li>new background-image and background-position<li>the first few characters of the innerHTML (if there is any)</ul>Merge these changes into the <code>style</code> attribute for these elements in the page:</div><div style='border: 1px solid; color: #555; background: #F0F0F0; padding: 8px; margin-bottom: 16px;'>";
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  hChanges[sInlineStyleAttributes] += elemObj.getCssHtml();
﻿  ﻿  ﻿  ﻿  ﻿  elemObj.bExported = true;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  ﻿  // If an element had a bg image but it was not an inline style,
﻿  ﻿  ﻿  ﻿  ﻿  // then we have to do the second pass.
﻿  ﻿  ﻿  ﻿  ﻿  bSecondPass = true;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }
﻿  // *** end INLINE STYLE ATTRIBUTES


﻿  var sInlineStyleRules = "inline CSS rules";
﻿  if ( bSecondPass ) {
﻿  ﻿  var aStylesheets = SpriteMe.doc.styleSheets;

﻿  ﻿  // Create an element that we can use to get the browser's post-processed format for backgroundImage.
﻿  ﻿  var tempdiv = SpriteMe.doc.createElement('div');
﻿  ﻿  tempdiv.style.display = "none";
﻿  ﻿  SpriteMe.doc.body.appendChild(tempdiv); // you have to append it for IE


﻿  ﻿  // *** begin COLLECT RELEVANT RULES
﻿  ﻿  // Loop through each stylesheet.
﻿  ﻿  var hRestrictedStylesheets = {};
﻿  ﻿  for ( var i = 0; i < aStylesheets.length; i++ ) {
﻿  ﻿  ﻿  var stylesheet = aStylesheets[i];
﻿  ﻿  ﻿  var url = ( stylesheet.href ? stylesheet.href : sInlineStyleRules );
﻿  ﻿  ﻿  var aRules = [];
﻿  ﻿  ﻿  try {
﻿  ﻿  ﻿  ﻿  aRules = ( SpriteMe.bIE ? stylesheet.rules : stylesheet.cssRules );
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  catch(err) {
﻿  ﻿  ﻿  ﻿  hRestrictedStylesheets[url] = true;
﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  if ( null == aRules ) {
﻿  ﻿  ﻿  ﻿  continue;
﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  // Loop through each rule
﻿  ﻿  ﻿  for ( var r = 0, nRules = aRules.length; r < nRules; r++ ) {
﻿  ﻿  ﻿  ﻿  var rule = aRules[r];
﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(rule.style) ) {
﻿  ﻿  ﻿  ﻿  ﻿  // It appears that "@media print { ... }" creates subrules???
﻿  ﻿  ﻿  ﻿  ﻿  continue;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  var bgPos = rule.style.backgroundPosition;
﻿  ﻿  ﻿  ﻿  var bgImage = rule.style.backgroundImage;
﻿  ﻿  ﻿  ﻿  if ("undefined" !== typeof(rule.selectorText) && -1 != rule.selectorText.indexOf('spriteme') ) {
﻿  ﻿  ﻿  ﻿  ﻿  // don't analyze SpriteMe rules
﻿  ﻿  ﻿  ﻿  ﻿  continue;
﻿  ﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  ﻿  if ( bgPos ) {
﻿  ﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(SpriteMe.hBgPosRules[bgPos]) ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.hBgPosRules[bgPos] = [];
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.hBgPosRules[bgPos][ SpriteMe.hBgPosRules[bgPos].length ] = new SpriteMe.CssRule(rule, url);
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  if ( bgImage && "none" != bgImage ) {
﻿  ﻿  ﻿  ﻿  ﻿  if ( -1 != bgImage.indexOf("../") ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  bgImage = SpriteMe.genFullUrl(bgImage, url);
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.setStyleAndUrl(tempdiv, "backgroundImage", bgImage);
﻿  ﻿  ﻿  ﻿  ﻿  var bgImageKey = SpriteMe.getStyleAndUrl(tempdiv, "backgroundImage");
﻿  ﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(SpriteMe.hBgImageRules[bgImageKey]) ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.hBgImageRules[bgImageKey] = [];
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  SpriteMe.hBgImageRules[bgImageKey][ SpriteMe.hBgImageRules[bgImageKey].length ] = new SpriteMe.CssRule(rule, url);
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  } // end rule loop
﻿  ﻿  } // end stylesheet loop
﻿  ﻿  // *** end COLLECT RELEVANT RULES


﻿  ﻿  // In Firefox, x-domain stylesheets are restricted. Build a list of these stylesheets.
﻿  ﻿  var sRestrictedStylesheets = "";
﻿  ﻿  var iRestricted = 0;
﻿  ﻿  for ( var sUrl in hRestrictedStylesheets ) {
﻿  ﻿  ﻿  if ( hRestrictedStylesheets.hasOwnProperty(sUrl) ) {
﻿  ﻿  ﻿  ﻿  sRestrictedStylesheets += "<li> <a href='" + sUrl + "'>" + sUrl + "</a></li>";
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  if ( sRestrictedStylesheets ) {
﻿  ﻿  ﻿  sRestrictedStylesheets = "You'll have to search " + 
﻿  ﻿  ﻿  ﻿  ( 1 === iRestricted ? "this stylesheet" : "these stylesheets" ) + " to find the appropriate rule:<ul>" +
﻿  ﻿  ﻿  ﻿  sRestrictedStylesheets + "</ul>";
﻿  ﻿  }


﻿  ﻿  // *** begin MATCH ELEMENTS TO RULES GROUPED BY STYLESHEET
﻿  ﻿  // Iterate through every DOM element that has a bg image.
﻿  ﻿  for ( var i = 0; i < SpriteMe.aSprites.length; i++ ) {
﻿  ﻿  ﻿  var spriteObj = SpriteMe.aSprites[i];
﻿  ﻿  ﻿  if ( spriteObj.spriteUrl ) {
﻿  ﻿  ﻿  ﻿  for ( var e = 0; e < spriteObj.bgImages[0].imgElements.length; e++ ) {
﻿  ﻿  ﻿  ﻿  ﻿  var elemObj = spriteObj.bgImages[0].imgElements[e];
﻿  ﻿  ﻿  ﻿  ﻿  if ( elemObj.bExported ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  continue;
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  var bgPos = SpriteMe.getStyleAndUrl(elemObj.elem, "backgroundPosition");
﻿  ﻿  ﻿  ﻿  ﻿  var bgImage = SpriteMe.getStyleAndUrl(elemObj.elem, "backgroundImage");
﻿  ﻿  ﻿  ﻿  ﻿  var aRules = SpriteMe.hBgImageRules[elemObj.oldBgImage];
﻿  ﻿  ﻿  ﻿  ﻿  if ( ! aRules ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(hChanges["restricted"]) ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  hChanges["restricted"] = 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  "<div style='margin-bottom: 8px;'>The rules for these CSS changes could not be found. " +
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ( -1 != navigator.userAgent.indexOf("Firefox") ? "This is most likely because Firefox restricts DOM access to cross-domain stylesheets. You could try running <a href='http://spriteme.org/'>SpriteMe</a> using a different browser. " : "" ) +
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  sRestrictedStylesheets + 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  "To help you find the rules that need to be updated, the following clues are provided: the tag of the element, the id and class (when available), and the original background-image.</div><div style='border: 1px solid; color: #555; background: #F0F0F0; padding: 8px; margin-bottom: 16px;'>"; // need to close this DIV
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  hChanges["restricted"] += elemObj.getCssHtml(true);
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  elemObj.bExported = true;
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  else if ( 1 < aRules.length ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  for ( var iRule = 0; iRule < aRules.length; iRule++ ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  var ruleObj = aRules[iRule];
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  if ( ! ruleObj.bExported ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  // Actually change the active rule. Cool!
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  // TODO - Do this **INSTEAD OF** changing each element's style so we can verify we found the right rules.
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  var oldBgImage = ruleObj.rule.style.backgroundImage;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  var oldBgPos = ruleObj.rule.style.backgroundPosition;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ruleObj.rule.style.backgroundImage = bgImage;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ruleObj.rule.style.backgroundPosition = bgPos;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(hChanges[ruleObj.url]) ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  hChanges[ruleObj.url] = "<div style='margin-bottom: 8px;'>Merge these changes into the CSS rules in <a href='" + 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ( sInlineStyleRules == ruleObj.url ? SpriteMe.doc.location : ruleObj.url ) + 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  "' target='_blank'>" + ruleObj.url + "</a>:</div><div style='border: 1px solid; color: #555; background: #F0F0F0; padding: 8px; margin-bottom: 16px;'>"; // need to close this DIV
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  hChanges[ruleObj.url] += "<em>This is one of multiple rules that use this background image:</em><br>" + ruleObj.getCssHtml(oldBgImage);
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  elemObj.bExported = true;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ruleObj.bExported = true;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  var ruleObj = aRules[0];
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  if ( ! ruleObj.bExported ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  // Actually change the active rule. Cool!
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  // TODO - Do this **INSTEAD OF** changing each element's style so we can verify we found the right rules.
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  var oldBgImage = ruleObj.rule.style.backgroundImage;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  var oldBgPos = ruleObj.rule.style.backgroundPosition;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ruleObj.rule.style.backgroundImage = bgImage;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ruleObj.rule.style.backgroundPosition = bgPos;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  if ( "undefined" === typeof(hChanges[ruleObj.url]) ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  hChanges[ruleObj.url] = "<div style='margin-bottom: 8px;'>Merge these changes into the CSS rules in <a href='" + 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ( sInlineStyleRules == ruleObj.url ? SpriteMe.doc.location : ruleObj.url ) + 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  "' target='_blank'>" + ruleObj.url + "</a>:</div><div style='border: 1px solid; color: #555; background: #F0F0F0; padding: 8px; margin-bottom: 16px;'>"; // need to close this DIV
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  hChanges[ruleObj.url] += ruleObj.getCssHtml(oldBgImage);
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  elemObj.bExported = true;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ruleObj.bExported = true;
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  // *** end MATCH ELEMENTS TO RULES GROUPED BY STYLESHEET
﻿  }


﻿  // *** compile the results
﻿  var sExport = "";
﻿  if ( "undefined" != typeof(hChanges[sInlineStyleAttributes]) ) {
﻿  ﻿  // do the inline style attributes first
﻿  ﻿  sExport += SpriteMe.formatRuleChanges(hChanges, sInlineStyleAttributes, sInlineStyleAttributes, SpriteMe.doc.location) + "</div>\n";
﻿  }
﻿  if ( "undefined" != typeof(hChanges[sInlineStyleRules]) ) {
﻿  ﻿  // do the inline CSS rules next
﻿  ﻿  sExport += SpriteMe.formatRuleChanges(hChanges, sInlineStyleRules, sInlineStyleRules, SpriteMe.doc.location) + "</div>\n";
﻿  }
﻿  for ( var cssUrl in hChanges ) {
﻿  ﻿  if ( hChanges.hasOwnProperty(cssUrl) && cssUrl != sInlineStyleAttributes && cssUrl != sInlineStyleRules && cssUrl != "restricted" ) {
﻿  ﻿  ﻿  sExport += SpriteMe.formatRuleChanges(hChanges, cssUrl, cssUrl, cssUrl) + "</div>\n";
﻿  ﻿  }
﻿  }
﻿  if ( "undefined" != typeof(hChanges["restricted"]) ) {
﻿  ﻿  // do "restricted" last
﻿  ﻿  sExport += SpriteMe.formatRuleChanges(hChanges, "restricted", "restricted") + "</div>\n";
﻿  }

﻿  if ( sExport ) {
﻿  ﻿  var exportWin = window.open("", "_blank");
﻿  ﻿  exportWin.document.open();
﻿  ﻿  exportWin.document.write("" +
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿   "<html><head><title>SpriteMe Export CSS</title><style>BODY { margin: 0; font-family: 'trebuchet ms', sans-serif; color: #222; font-size: 10.5pt; }#siteheader { padding: 8px 8px 0 12px; background: url(images/logo-64x64-04.png) repeat-x; height: 64px; }</style></head><body><div id=siteheader> <div style='width: 800px; font-size: 3em; color: #222;'><a href='http://spriteme.org' target='_blank'><img border=0 src='http://spriteme.org/images/spriteme-200x49-transp.gif' width=200 height=49 style='vertical-align: bottom;'></a> Export CSS</div></div>" +
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿   "<div style='color: #333; margin: 8px;'>" + 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿   "<p>Here are the CSS changes you need to integrate back into your web site.</p><p style='margin-bottom: 4px;'><span style='color: #A00;'>Make sure to download these sprite images to your own server. These URLs are temporary and will eventually be removed!</span> Replace these URLs with the URLs where you host the images.</p><ul style='margin-top: 0;'>" +
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿   sSpriteUrls + "</ul>" +
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿   sExport + 
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿  ﻿   "</div>");
﻿  ﻿  exportWin.document.close();
﻿  }
﻿  else {
﻿  ﻿  alert("No CSS changes were found.");
﻿  }
};


SpriteMe.formatRuleChanges = function(hChanges, key, title, url) {
﻿  var sHtml = "";
﻿  if ( "undefined" != typeof(hChanges[key]) ) {
﻿  ﻿  sHtml = "<h1 style='margin-bottom: 4px;'>" + title + "</h1>\n" +
﻿  ﻿  ﻿  "<div style='margin-left: 40px;'>" + hChanges[key] + "</div>\n\n";
﻿  }

﻿  return sHtml;
};


SpriteMe.toggleImage = function(imageUrl, bSelect) {
﻿  SpriteMe.hBgImages[imageUrl].checked = bSelect;
};


SpriteMe.toggleAll = function() {
﻿  for ( var imageUrl in SpriteMe.hBgImages ) {
﻿  ﻿  if ( SpriteMe.hBgImages.hasOwnProperty(imageUrl) ) {
﻿  ﻿  ﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  ﻿  ﻿  SpriteMe.toggleExpand(bgImage.id + "tog", bgImage.id + "elems", SpriteMe.bToggleAll);
﻿  ﻿  }
﻿  }

﻿  SpriteMe.bToggleAll = !SpriteMe.bToggleAll;
};


// togId - this is an anchor element whose innerHTML is the plus or minus image
// divId - this is the div that we're going to show and hide
// bExpand - explicitly say whether to expand or collapse, ow toggle the current state
SpriteMe.toggleExpand = function(togId, divId, bExpand) {
﻿  //SpriteMe.dprint(9, "toggleExpand: togId = " + togId + ", divId = " + divId);
﻿  var divElem = SpriteMe.doc.getElementById(divId);
﻿  if ( divElem ) {
﻿  ﻿  if ( "undefined" === typeof(bExpand) ) {
﻿  ﻿  ﻿  bExpand = ( "none" === divElem.style.display );
﻿  ﻿  }

﻿  ﻿  if ( bExpand ) {
﻿  ﻿  ﻿  divElem.style.display = "block";
﻿  ﻿  ﻿  SpriteMe.doc.getElementById(togId).innerHTML = "<img border=0 width=9 height=9 src='http://spriteme.org/images/minus-9x9.png'>";
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  divElem.style.display = "none";
﻿  ﻿  ﻿  SpriteMe.doc.getElementById(togId).innerHTML = "<img border=0 width=9 height=9 src='http://spriteme.org/images/plus-9x9.png'>";
﻿  ﻿  }
﻿  }
};


// TODO - Create an "element" object that encapsulates this logic. It should have an "element" data member that points to the DOM element.
SpriteMe.elemHighlight = function(imageUrl, iElem) {
﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  if ( bgImage ) {
﻿  ﻿  var imgElem = bgImage.imgElements[iElem];
﻿  ﻿  if ( imgElem ) {
﻿  ﻿  ﻿  imgElem.elem.style.border = "2px solid red";
﻿  ﻿  ﻿  if ( imgElem.elem != SpriteMe.prevElemHighlight ) {
﻿  ﻿  ﻿  ﻿  SpriteMe.elemUnhighlight();
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemHighlight = imgElem.elem;
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }
};


SpriteMe.elemUnhighlight = function() {
﻿  if ( SpriteMe.prevElemHighlight && SpriteMe.prevElemHighlight != SpriteMe.prevElemSelect ) {
﻿  ﻿  SpriteMe.prevElemHighlight.style.border = "";
﻿  ﻿  SpriteMe.prevElemHighlight = undefined;
﻿  }
};


SpriteMe.elemSelect = function(imageUrl, iElem, anchorId) {
﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  if ( bgImage ) {
﻿  ﻿  var elem = bgImage.imgElements[iElem].elem;
﻿  ﻿  var elemAnchor = SpriteMe.doc.getElementById(anchorId);
﻿  ﻿  if ( elem && elemAnchor ) {
﻿  ﻿  ﻿  var bSelect = ( -1 == elemAnchor.style.borderWidth.indexOf("2") );
﻿  ﻿  ﻿  if ( SpriteMe.prevElemSelect ) {
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemSelect.style.border = "";  // TODO - What if the original element had a border?!?!
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  if ( SpriteMe.prevElemAnchorSelect ) {
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemAnchorSelect.style.borderColor = "";
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemAnchorSelect.style.borderStyle = "";
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemAnchorSelect.style.borderWidth = "";
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemAnchorSelect.style.backgroundColor = "";
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemSelect = undefined;
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemAnchorSelect = undefined;
﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  if ( bSelect ) {
﻿  ﻿  ﻿  ﻿  // select it
﻿  ﻿  ﻿  ﻿  elemAnchor.style.borderColor = "red";
﻿  ﻿  ﻿  ﻿  elemAnchor.style.borderStyle = "solid";
﻿  ﻿  ﻿  ﻿  elemAnchor.style.borderWidth = "2px";
﻿  ﻿  ﻿  ﻿  elemAnchor.style.backgroundColor = "#EA3";
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemSelect = elem;
﻿  ﻿  ﻿  ﻿  SpriteMe.prevElemAnchorSelect = elemAnchor;
﻿  ﻿  ﻿  ﻿  SpriteMe.scrollToElement(elem);
﻿  ﻿  ﻿  ﻿  SpriteMe.inspectElement(elem);
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  SpriteMe.inspectElement(elem, true);
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }
};


SpriteMe.inspectElement = function(elem, bClear) {
﻿  if ( "undefined" != typeof( _firebug ) ) {
﻿  ﻿  alert("You must close Firebug (the Firefox add-on) if you want to use Firebug Lite. Alternatively, right-click on the highlighted DOM element to inspect it in Firebug.");
﻿  ﻿  return;
﻿  }

﻿  if ( "undefined" === typeof(SpriteMe.bFirebugInspect) ) {
﻿  ﻿  SpriteMe.bFirebugInspect = confirm("Do you want to inspect elements in Firebug Lite?");
﻿  }

﻿  if ( SpriteMe.bFirebugInspect ) {
﻿  ﻿  if ( "undefined" === typeof(SpriteMe.bFirebugLoaded) ) {
﻿  ﻿  ﻿  SpriteMe.bFirebugLoaded = true;
﻿  ﻿  ﻿  SpriteMe.firebugRetryCount = 0;
﻿  ﻿  ﻿  var firebugscript = SpriteMe.doc.createElement('script');
﻿  ﻿  ﻿  //firebugscript.src = "http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js";
﻿  ﻿  ﻿  firebugscript.src = "http://fbug.googlecode.com/svn/lite/branches/firebug1.2/firebug-lite-compressed.js";
﻿  ﻿  ﻿  SpriteMe.doc.getElementsByTagName('head')[0].appendChild(firebugscript);
﻿  ﻿  }

﻿  ﻿  if ( "undefined" === typeof(firebug) ) {
﻿  ﻿  ﻿  if ( SpriteMe.firebugRetryCount < 20 ) {
﻿  ﻿  ﻿  ﻿  setTimeout(function() { SpriteMe.inspectElement(elem); }, 500);
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  alert("Firebug Lite failed to load.");
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  return;
﻿  ﻿  }

﻿  ﻿  if ( "undefined" === typeof(SpriteMe.bFirebugInitted) ) {
﻿  ﻿  ﻿  SpriteMe.bFirebugInitted = true;
﻿  ﻿  ﻿  firebug.init();
﻿  ﻿  }

﻿  ﻿  if ( bClear ) {
﻿  ﻿  ﻿  firebug.win.hide();
﻿  ﻿  ﻿  firebug.d.html.highlight(elem, true);
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  firebug.win.show();
﻿  ﻿  ﻿  firebug.d.html.inspect(elem);
﻿  ﻿  ﻿  firebug.d.html.highlight(elem);
﻿  ﻿  }
﻿  }
};


SpriteMe.showSpinner = function() {
﻿  SpriteMe.spinner = SpriteMe.doc.createElement('div');

﻿  var spritemepanel = SpriteMe.doc.getElementById('spritemepanel');
﻿  var width, height;
﻿  if ( spritemepanel ) {
﻿  ﻿  spritemepanel.appendChild(SpriteMe.spinner);
﻿  ﻿  width = spritemepanel.offsetWidth-4;
﻿  ﻿  height = spritemepanel.offsetHeight-4;
﻿  }
﻿  else {
﻿  ﻿  SpriteMe.spinner.style.cssText = "position: absolute; right: 10px; top: 40px; width: 400px; height: 200px; border: 2px solid #000; z-index: 12800; background: #F1E7F1;";
﻿  ﻿  SpriteMe.doc.body.appendChild(SpriteMe.spinner);
﻿  ﻿  width = 400;
﻿  ﻿  height = 200;
﻿  }

﻿  SpriteMe.spinner.innerHTML = 
﻿      '<div style="position: absolute; z-index: 12801; left: 0; top: 0; background: white;' +
﻿      'width: ' + width + 'px; height: ' + height + 'px;' + 
﻿      ' opacity: 0.7; -moz-opacity: 0.7; filter: alpha(opacity=70);">&nbsp;</div>' + 
﻿      '<div style="position: absolute; z-index: 12801; left: 0; top: 0; text-align: center; padding-top: 60px;' +
﻿      ' background: transparent; width: ' + width + 'px;">' +
﻿      '<img src="http://spriteme.org/images/spinner.gif" width=35 height=35 style="margin-top: 20px; background: transparent;">' +
﻿      ( spritemepanel ? '<br><br><a class=spritemebuttonlink href="javascript:SpriteMe.abortSprite()">Cancel</a>' : '<br><br>finding images...' ) +
﻿      '</div></div>';
};


SpriteMe.stopSpinner = function() {
﻿  SpriteMe.spinner.style.display = "none";
};


SpriteMe.getStyleAndUrl = function(elem, prop, bGetUrl) {
﻿  var val = "";

﻿  if ( elem.currentStyle ) {
﻿  ﻿  val = elem.currentStyle[prop];
﻿  }

﻿  if ( elem.ownerDocument && elem.ownerDocument.defaultView && SpriteMe.doc.defaultView.getComputedStyle ) {
﻿  ﻿  var style = elem.ownerDocument.defaultView.getComputedStyle(elem, "");
﻿  ﻿  if ( style ) {
﻿  ﻿  ﻿  val = style[prop];
﻿  ﻿  }
﻿  }

﻿  if ( "backgroundPosition" === prop && SpriteMe.bIE ) {
﻿  ﻿  var posX = SpriteMe.getStyleAndUrl(elem, 'backgroundPositionX', false);
﻿  ﻿  posX = ( "left" == posX ? "0%" : ( "center" == posX ? "50%" : ( "right" == posX ? "100%" : posX ) ) );
﻿  ﻿  var posY = SpriteMe.getStyleAndUrl(elem, 'backgroundPositionY', false);
﻿  ﻿  posY = ( "top" == posY ? "0%" : ( "center" == posY ? "50%" : ( "bottom" == posY ? "100%" : posY ) ) );
﻿  ﻿  val = posX + " " + posY;
﻿  }

﻿  if ( !bGetUrl ) {
﻿  ﻿  return val;
﻿  }

﻿  if ( "string" != typeof(val) || 0 !== val.indexOf('url(') ) {
﻿  ﻿  return false;
﻿  }

﻿  val = val.replace(/url\(/, "");
﻿  val = val.substr(0, val.length - 1);
﻿  if ( 0 === val.indexOf('"') ) {
﻿  ﻿  val = val.substr(1, val.length - 2);
﻿  }

﻿  return val;
};


// Convert a relative URL to a full URL given a base URL.
SpriteMe.genFullUrl = function(relUrl, baseUrl) {
﻿  var fullUrl = relUrl;

﻿  // assume only one ".." at the very beginning
﻿  iDotDot = relUrl.indexOf("../");
﻿  if ( -1 !== iDotDot ) {
﻿  ﻿  var iSlash = baseUrl.lastIndexOf("/");
﻿  ﻿  iSlash = baseUrl.lastIndexOf("/", iSlash-1);
﻿  ﻿  var base = baseUrl.substring(0, iSlash+1);
﻿  ﻿  fullUrl = relUrl.replace("../", base);
﻿  }

﻿  return fullUrl;
};


SpriteMe.setStyleAndUrl = function(elem, prop, val, bSetUrl) {
﻿  if ( bSetUrl ) {
﻿  ﻿  val = "url('" + val + "')";
﻿  }

﻿  // TODO - opacity for IE is tricky
﻿  if ( "float" === prop ) {
﻿  ﻿  prop = ( SpriteMe.bIE ? "styleFloat" : "cssFloat" );
﻿  }
﻿  else if ( "backgroundPosition" === prop && SpriteMe.bIE) {
﻿  ﻿  var aPos = val.split(' ');
﻿  ﻿  SpriteMe.setStyleAndUrl(elem, 'backgroundPositionX', aPos[0], false);
﻿  ﻿  SpriteMe.setStyleAndUrl(elem, 'backgroundPositionY', aPos[1], false);
﻿  ﻿  return;
﻿  }

﻿  elem.style[prop] = val;
};


SpriteMe.shortenUrl = function(url) {
﻿  if ( 60 < url.length ) {
﻿  ﻿  if ( url.match(/(http.*\/\/.*?\/.*?\/).*(\/.*?)$/) ) {
﻿  ﻿  ﻿  url = RegExp.$1 + "..." + RegExp.$2;
﻿  ﻿  ﻿  if ( 60 < url.length ) {
﻿  ﻿  ﻿  ﻿  if ( url.match(/(http.*\/\/.*?\/).*(\/.*?)$/) ) {
﻿  ﻿  ﻿  ﻿  ﻿  url = RegExp.$1 + "..." + RegExp.$2;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }

﻿  return url;
};


SpriteMe.getBgImage = function(id) {
﻿  for ( var imageUrl in SpriteMe.hBgImages ) {
﻿  ﻿  if ( SpriteMe.hBgImages.hasOwnProperty(imageUrl) ) {
﻿  ﻿  ﻿  var bgImage = SpriteMe.hBgImages[imageUrl];
﻿  ﻿  ﻿  if ( id == bgImage.id ) {
﻿  ﻿  ﻿  ﻿  return bgImage;
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }

﻿  return undefined;
};


// There are some images we want to ignore, like Firebug Lite.
SpriteMe.skipImage = function(imageUrl) {
﻿  if ( 0 === imageUrl.indexOf("http://getfirebug.com/releases/lite/") ) {
﻿  ﻿  return true;
﻿  }

﻿  if ( 0 === imageUrl.indexOf("http://fbug.googlecode.com/svn/lite/branches/") ) {
﻿  ﻿  return true;
﻿  }

﻿  return false;
};


SpriteMe.scrollToElement = function(elem) {
﻿  SpriteMe.dprint(9, "scrollToElement: enter");
﻿  var y = 0;
﻿  var elemOrig = elem;
﻿  while ( elem && "undefined" != typeof(elem.offsetTop) ) {
﻿  ﻿  y += elem.offsetTop;
﻿  ﻿  elem = elem.offsetParent;
﻿  }
﻿  y += elemOrig.offsetHeight;

﻿  // Don't scroll if it's above the fold.
﻿  // TODO - Really, we want to check if it's currently in view, so need to check current scrollX and scrollY.
﻿  var windowHeight = ( window.innerHeight ? window.innerHeight : ( SpriteMe.doc.documentElement ? SpriteMe.doc.documentElement.clientHeight : ( SpriteMe.doc.body ? SpriteMe.doc.body.clientHeight : 0 ) ) );
﻿  y = ( y-40 > windowHeight ? y-40 : 0 );

﻿  SpriteMe.dprint(8, "scrollToElement: y = " + y + ", windowHeight = " + windowHeight);
﻿  window.scroll(0, y);
};


// 1 - critical messages
// 5 - warnings
// 8 - status messages
// 9 - log (detailed) messages
SpriteMe.dprintLevel = 0; // set this to 10 to see all messages
SpriteMe.bDprintAlert = undefined;

SpriteMe.dprint = function(level, msg) {
﻿  if ( level <= SpriteMe.dprintLevel ) {
﻿  ﻿  if ( "undefined" !== typeof(console) && "undefined" != typeof(console.log) ) {
﻿  ﻿  ﻿  console.log("SpriteMe: " + msg);
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  if ( "undefined" === typeof(SpriteMe.bDprintAlert) || SpriteMe.bDprintAlert ) {
﻿  ﻿  ﻿  ﻿  SpriteMe.bDprintAlert = confirm(msg + "\n\nContinue showing debug messages?");
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }
};


// Round off bytes to K.
SpriteMe.prettySize = function(bytes, bOnePlace) {
﻿  if ( bOnePlace ) {
﻿  ﻿  return parseInt( (bytes+50)/100 )/10;
﻿  }
﻿  else {
﻿  ﻿  return parseInt( (bytes+500)/1000 );
﻿  }
};

// based on http://jsfromhell.com/math/mmc
SpriteMe.lcm = function(aInts) {
﻿  var tmpInts = [];
﻿  tmpInts = tmpInts.concat(aInts);
﻿  for ( var i, j, n, d, lcm = 1; ( n = tmpInts.pop( )) != undefined; ) {
﻿  ﻿  while( n > 1 ) {
﻿  ﻿  ﻿  if ( n % 2 ) {
﻿  ﻿  ﻿  ﻿  for ( i = 3, j = Math.floor(Math.sqrt(n)); i <= j && n % i; i += 2 );
﻿  ﻿  ﻿  ﻿  d = i <= j ? i : n;
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  d = 2;
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  for( n /= d, lcm *= d, i = tmpInts.length; i; !(tmpInts[--i] % d) && (tmpInts[i] /= d) == 1 && tmpInts.splice(i, 1) );
﻿  ﻿  }
﻿  }

﻿  return lcm;
};

SpriteMe.getElementsByTagAndClass = function(tag, classname, text, parent) {
﻿  parent = parent || SpriteMe.doc;
﻿  var aElems = parent.getElementsByTagName(tag);

﻿  var aResults = [];
﻿  for ( var i = 0, len = aElems.length; i < len; i++ ) {
﻿  ﻿  var elem = aElems[i];
﻿  ﻿  if ( classname == elem.className ) {
﻿  ﻿  ﻿  if ( "undefined" != typeof(text) && text != elem.innerHTML ) {
﻿  ﻿  ﻿  ﻿  continue;
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  aResults[aResults.length] = elem;
﻿  ﻿  }
﻿  }

﻿  return aResults;
};


SpriteMe.autoSprite = function(iTry) {
﻿  SpriteMe.dprint(9, "SpriteMe.autoSprite - enter, iTry = " + iTry);

﻿  var spritemepanel = SpriteMe.doc.getElementById('spritemepanel');
﻿  iTry = ( "undefined" === typeof(iTry) ? 1 : iTry );
﻿  if ( !spritemepanel && iTry < 10 ) {
﻿  ﻿  setTimeout("SpriteMe.autoSprite(" + (iTry+1) + ")", 1000);
﻿  ﻿  return;
﻿  }

﻿  // See if there are any more "make sprite" links to execute.
﻿  var aLinks = SpriteMe.getElementsByTagAndClass('a', 'spritemebuttonlink', 'make sprite', spritemepanel);
﻿  var iLink = -1;
﻿  for ( var i = 0, len = aLinks.length; i < len; i++ ) {
﻿  ﻿  if ( "undefined" === typeof(aLinks[i].autosprited) ) {
﻿  ﻿  ﻿  iLink = i;
﻿  ﻿  ﻿  break;
﻿  ﻿  }
﻿  }

﻿  if ( -1 === iLink ) {
﻿  ﻿  SpriteMe_autospriteCallback();
﻿  }
﻿  else {
﻿  ﻿  aLinks[iLink].autosprited = true; // TODO - change this to not modify the DOM element
﻿  ﻿  eval(aLinks[iLink].href.replace("javascript:", ""));
﻿  }
};


SpriteMe.prettySavings = function(bUpdate) {
﻿  SpriteMe.dprint(9, "SpriteMe.prettySavings: enter");

﻿  var sSavings = "";

﻿  if ( 0 < SpriteMe.savedImages ) {
﻿  ﻿  sSavings +=
﻿  ﻿  ﻿  SpriteMe.savedImages + " request" + ( 1 === SpriteMe.savedImages ? "" : "s" ) + " eliminated, " +
﻿  ﻿  ﻿  ( 0 === SpriteMe.prettySize(SpriteMe.savedSize) ? "size unchanged" :
﻿  ﻿  ﻿    ( 0 < SpriteMe.savedSize ? 
﻿  ﻿  ﻿  ﻿  "size reduced by " + SpriteMe.prettySize(SpriteMe.savedSize) + "K" :
﻿  ﻿  ﻿  ﻿  "size increased by " + SpriteMe.prettySize((-1)*SpriteMe.savedSize) + "K" ) );
﻿  }
﻿  else if ( 0 < SpriteMe.suggestedSpriteCntr ) {
﻿  ﻿  sSavings += SpriteMe.suggestedSpriteCntr + " sprite suggestion" + ( 1 < SpriteMe.suggestedSpriteCntr ? "s" : "" );
﻿  }
﻿  else if ( 0 === SpriteMe.suggestedSpriteCntr ) {
﻿  ﻿  sSavings += "no sprite suggestions";
﻿  }

﻿  sSavings += "<a id=spritemeshare href='javascript:SpriteMe.shareSavings()' style='color: #404; margin-left: 8px;'>share your savings</a>";

﻿  if ( bUpdate ) {
﻿  ﻿  // Replace the HTML in an existing container.
﻿  ﻿  var container = SpriteMe.doc.getElementById("spritemesavings");
﻿  ﻿  if ( container ) {
﻿  ﻿  ﻿  container.innerHTML = sSavings;
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  SpriteMe.dprint(0, "Error: SpriteMe.prettySavings - couldn't find container for id = spritemesavings");
﻿  ﻿  }
﻿  }
﻿  else {
﻿  ﻿  // Otherwise, return HTML that includes the wrapping container.
﻿  ﻿  sSavings = "<div id=spritemesavings style='margin-bottom: 4px;'>" + sSavings + "</div>\n";
﻿  }

﻿  return sSavings;
};


SpriteMe.fetchDomScript = function(url, callback) {
﻿  var domscript = SpriteMe.doc.createElement('script');
﻿  domscript.src = url;

﻿  if ( "function" === typeof(callback) ) {
﻿  ﻿  domscript.onload = function() { 
﻿  ﻿  ﻿  if ( !domscript.onloadDone ) {
﻿  ﻿  ﻿  ﻿  domscript.onloadDone = true; 
﻿  ﻿  ﻿  ﻿  callback(); 
﻿  ﻿  ﻿  }
﻿  ﻿  };
﻿  ﻿  domscript.onreadystatechange = function() { 
﻿  ﻿  ﻿  if ( "loaded" === domscript.readyState && !domscript.onloadDone ) {
﻿  ﻿  ﻿  ﻿  domscript.onloadDone = true; 
﻿  ﻿  ﻿  ﻿  callback();
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  }


﻿  SpriteMe.doc.body.appendChild(domscript);
};


SpriteMe.shareSavings = function() {
﻿  if ( ! confirm("This will post your savings and URL to a public page. Do you want to continue?") ) {
﻿  ﻿  return;
﻿  }

﻿  new Image().src = "http://spriteme.org/results.php?url=" + escape(SpriteMe.doc.location.href) +
﻿  "&ib=" + SpriteMe.nBgImagesBefore + 
﻿  "&id=" + SpriteMe.savedImages + 
﻿  "&sb=" + SpriteMe.nSizeBefore + 
﻿  "&sd=" + SpriteMe.savedSize +
﻿  "&tb=" + SpriteMe.nSpritesBefore + 
﻿  "&tc=" + SpriteMe.nCreatedSprites + 
﻿  "";

﻿  var shareLink = SpriteMe.doc.getElementById('spritemeshare');
﻿  if ( shareLink ) {
﻿  ﻿  shareLink.href = 'http://spriteme.org/results.php';
﻿  ﻿  shareLink.innerHTML = 'shared';
﻿  ﻿  shareLink.target = '_blank';
﻿  }
};


SpriteMe.autoSpriteCallback = function() {
﻿  //SpriteMe.shareSavings();
﻿  return;
};

// UNcomment this line to automatically sprite as much as possible in the page.
//SpriteMe_autospriteCallback = SpriteMe.autoSpriteCallback;






////////////////////////////////////////////////////////////////////////////////
//
// Sprite object
//
////////////////////////////////////////////////////////////////////////////////
SpriteMe.Sprite = function(title, bgImages) {
﻿  this.title = title;
﻿  this.bgImages = [];
﻿  this.bVertical = true;
﻿  this.bgColor = "none";
﻿  this.bRepeatX = false;
﻿  this.bRepeatY = false;
﻿  this.short = false;
﻿  this.url = undefined; // sprite URL

﻿  SpriteMe.aSprites[SpriteMe.aSprites.length] = this;
﻿  this.iSprite = SpriteMe.aSprites.length; // NOTE: this is 1 greater than the index in SpriteMe.aSprites!!!
﻿  this.id = "spritemesprite" + this.iSprite;
﻿  this.filename = "spriteme" + this.iSprite; // do NOT add ".png"

﻿  if ( bgImages && 0 < bgImages.length ) {
﻿  ﻿  this.bgImages = bgImages;
﻿  ﻿  this.gatherSpriteData();
﻿  }
};


SpriteMe.Sprite.prototype = {
﻿  getHtml: function(bUpdate, bHideMake) {
﻿  ﻿  var sHtml = 
﻿      "<div style='margin-bottom: 4px;'>" + 
﻿      ( bHideMake ? "" : "<a class=spritemebuttonlink style='color: #FFF; float: right;' href='javascript:SpriteMe.requestSprite(" + (this.iSprite-1) + ")'>make sprite</a>" ) +
﻿      "<span style='font-size: 12px; font-weight: bold;'>" +
﻿      "<a id=" + this.id + "tog style='border: 0px solid #000; background: #FFF; color: #000; text-decoration: none; line-height: 40%; padding: 0 2px 0 2px;' href='javascript:SpriteMe.toggleExpand(\"" + this.id + "tog\", \"" + this.id + "images\")'><img border=0 width=9 height=9 src='http://spriteme.org/images/minus-9x9.png'></a>&nbsp;" +
﻿      this.title + "</span>" +
﻿      "</div>\n" + 
﻿      "<div id=" + this.id + "images style='margin-left: 10px; padding-bottom: 2px; left: 0; '>\n";

﻿  ﻿  for ( var i = 0; i < this.bgImages.length; i++ ) {
﻿  ﻿  ﻿  var bgImage = this.bgImages[i];
﻿  ﻿  ﻿  sHtml += bgImage.getHtml();
﻿  ﻿  ﻿  bgImage.bUsed = true; // it's weird to hide this here
﻿  ﻿  }

﻿  ﻿  sHtml += 
﻿  ﻿      "<div class=spritemesortable style='line-height: 2px;'>&nbsp;</div>\n" +
﻿  ﻿      "<div class=spritemesortable style='line-height: 2px;'>&nbsp;</div>\n" +
﻿  ﻿      "</div>\n";

﻿  ﻿  if ( bUpdate ) {
﻿  ﻿  ﻿  // Replace the HTML in an existing container.
﻿  ﻿  ﻿  var container = SpriteMe.doc.getElementById(this.id);
﻿  ﻿  ﻿  if ( container ) {
﻿  ﻿  ﻿  ﻿  container.innerHTML = sHtml;
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  SpriteMe.dprint(0, "Error: SpriteMe.Sprite.getHtml - couldn't find container for id = " + this.id);
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  // Otherwise, return HTML that includes the wrapping container.
﻿  ﻿  ﻿  sHtml = "<div id=" + this.id + " class=spritemespritediv>" + sHtml + "</div>";
﻿  ﻿  }

﻿  ﻿  return sHtml;
﻿  },

﻿  // Topmost handler for turning a sprite with multiple bg images into a sprited sprite
﻿  spritify: function(spriteUrl, width, height, sizeBefore, sizeAfter) { // Sprite object
﻿  ﻿  this.spriteUrl = spriteUrl;

﻿  ﻿  SpriteMe.savedImages += this.bgImages.length - 1;
﻿  ﻿  SpriteMe.nSizeBefore += sizeBefore;
﻿  ﻿  SpriteMe.savedSize += sizeBefore - sizeAfter;
﻿  ﻿  SpriteMe.dprint(8, "id = " + SpriteMe.savedImages + ", sd = " + SpriteMe.savedSize);

﻿  ﻿  // Create a new BgImage for the sprited image.
﻿  ﻿  var spriteBgImage = new SpriteMe.BgImage(this.spriteUrl); // this starts downloading the image to get width and height
﻿  ﻿  spriteBgImage.width = width;
﻿  ﻿  spriteBgImage.height = height;
﻿  ﻿  spriteBgImage.size = sizeAfter;

﻿  ﻿  // Change all the elements using the old bg images to use the new sprite image.
﻿  ﻿  for ( var i = 0; i < this.bgImages.length; i++ ) {
﻿  ﻿  ﻿  var bgImage = this.bgImages[i];
﻿  ﻿  ﻿  for ( var j = 0, len = bgImage.imgElements.length; j < len; j++ ) {
﻿  ﻿  ﻿  ﻿  var imgElem = bgImage.imgElements[j];
﻿  ﻿  ﻿  ﻿  imgElem.spritify(this.spriteUrl, bgImage);
﻿  ﻿  ﻿  ﻿  spriteBgImage.imgElements[spriteBgImage.imgElements.length] = imgElem; // add this element to the new sprite image object
﻿  ﻿  ﻿  }
﻿  ﻿  }
﻿  ﻿  spriteBgImage.getDataFromElements(); // update all the elements' info (repeat, etc.)
﻿  ﻿  this.bgImages = [ spriteBgImage ];

﻿  ﻿  SpriteMe.prettySavings(true);
﻿  },

﻿  updateBgImages: function() {
﻿  ﻿  // This is a little hacky: Rather than deal with drag&drop handlers, we update
﻿  ﻿  // the sprite's bgImage array based on the sortable HTML elements it contains.
﻿  ﻿  var spriteElem = SpriteMe.doc.getElementById(this.id);
﻿  ﻿  if ( !spriteElem ) {
﻿  ﻿  ﻿  SpriteMe.dprint(0, "Error: SpriteMe.Sprite.updateBgImages - sprite DOM element not found: " + this.id);
﻿  ﻿  ﻿  return;
﻿  ﻿  }

﻿  ﻿  var aElems = SpriteMe.getElementsByTagAndClass('div', 'spritemesortable spritemebgimage', undefined, spriteElem);
﻿  ﻿  this.bgImages = [];
﻿  ﻿  for ( var i = 0, len = aElems.length; i < len; i++ ) {
﻿  ﻿  ﻿  var elem = aElems[i];
﻿  ﻿  ﻿  this.bgImages[this.bgImages.length] = SpriteMe.getBgImage(elem.id);
﻿  ﻿  }
﻿  },

﻿  gatherSpriteData: function() {
﻿  ﻿  for ( var i = 0; i < this.bgImages.length; i++ ) {
﻿  ﻿  ﻿  var bgImage = this.bgImages[i];
﻿  ﻿  ﻿  bgImage.iSprite = this.iSprite;
﻿  ﻿  ﻿  this.bRepeatX = this.bRepeatX || bgImage.bRepeatX;
﻿  ﻿  ﻿  this.bRepeatY = this.bRepeatY || bgImage.bRepeatY;
﻿  ﻿  ﻿  this.short = this.short || bgImage.short;
﻿  ﻿  }

﻿  ﻿  if ( this.bRepeatX && this.bRepeatY ) {
﻿  ﻿  ﻿  //TODO alert("Trouble: You can't sprite background images that repeat both horizontally AND vertically.");
﻿  ﻿  }

﻿  ﻿  this.bVertical = (!this.bRepeatY && !this.short);
﻿  }  // NO COMMA!
};




////////////////////////////////////////////////////////////////////////////////
//
// BgImage object
//
////////////////////////////////////////////////////////////////////////////////
SpriteMe.BgImage = function(imageUrl) {
﻿  this.url = imageUrl;
﻿  this.imgElements = [];
﻿  this.height = undefined;
﻿  this.width = undefined;
﻿  this.iSprite = undefined;
﻿  this.spriteLeft = 0; // need to set this so calculateBackgroundPosition works even before we've sprited
﻿  this.spriteTop = 0;
﻿  this.marginLeft = SpriteMe.marginX;
﻿  this.marginRight = SpriteMe.marginX;
﻿  this.marginTop = SpriteMe.marginY;
﻿  this.marginBottom = SpriteMe.marginY;
﻿  SpriteMe.hBgImages[imageUrl] = this;

﻿  this.image = new Image();
﻿  var bgimage = this; // is this the right way to workaround this?
﻿  this.image.onload = function() { bgimage.imageOnload(); };
﻿  this.image.onerror = function() { bgimage.imageOnerror(); };
﻿  this.bError = false;
﻿  this.id = "spritemebgimage" + (SpriteMe.bgImageCntr++);

﻿  if ( this.url ) {
﻿  ﻿  this.image.src = this.url;
﻿  }
};


SpriteMe.BgImage.prototype = {
﻿  imageLink: function() {
﻿  ﻿  return '<a target="_blank" href="' + this.url + 
﻿         '" onmouseover="SpriteMe.doHover(\'' + this.url + '\')">' + SpriteMe.shortenUrl(this.url) + '</a>';
﻿  },

﻿  imageProps: function() {
﻿  ﻿  var sProps = "";
﻿  ﻿  if ( this.width && this.height ) {
﻿  ﻿  ﻿  sProps += this.width + "x" + this.height;
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  SpriteMe.dprint(0, "Error: SpriteMe.BgImage.imageProps - width and height undefined for image " + this.url);
﻿  ﻿  }
﻿  ﻿  if ( this.size ) {
﻿  ﻿  ﻿  sProps += ( sProps ? ", " : "" ) + SpriteMe.prettySize(this.size, true) + "K";
﻿  ﻿  }

﻿  ﻿  return sProps;
﻿  },

﻿  getDataFromElements: function() {
﻿  ﻿  for ( var i = 0; i < this.imgElements.length; i++ ) {
﻿  ﻿  ﻿  this.getDataFromElement(this.imgElements[i]);
﻿  ﻿  }
﻿  ﻿  this.setState(); // set this AFTER grokking all elements
﻿  },

﻿  // What do we know, given that this image is used as a background for this DOM element?
﻿  getDataFromElement: function(imgElem) {
﻿  ﻿  imgElem.backgroundRepeat = SpriteMe.getStyleAndUrl(imgElem.elem, 'backgroundRepeat', false);
﻿  ﻿  if ( -1 != imgElem.backgroundRepeat.indexOf('repeat-x') || 'repeat' == imgElem.backgroundRepeat ) {
﻿  ﻿  ﻿  this.bRepeatX = true;
﻿  ﻿  ﻿  this.marginLeft = this.marginRight = 0;
﻿  ﻿  }
﻿  ﻿  if ( -1 != imgElem.backgroundRepeat.indexOf('repeat-y') || 'repeat' == imgElem.backgroundRepeat ) {
﻿  ﻿  ﻿  this.bRepeatY = true;
﻿  ﻿  ﻿  this.marginTop = this.marginBottom = 0;
﻿  ﻿  }

﻿  ﻿  imgElem.backgroundPosition = SpriteMe.getStyleAndUrl(imgElem.elem, "backgroundPosition");
﻿  ﻿  /*
﻿  ﻿  if ( "0% 0%" == imgElem.backgroundPosition  ||
﻿  ﻿  ﻿   "0px 0px" == imgElem.backgroundPosition ||
﻿  ﻿  ﻿   "0 0" == imgElem.backgroundPosition ||
﻿  ﻿  ﻿   "0pt 0pt" == imgElem.backgroundPosition ||
﻿  ﻿  ﻿   "0em 0em" == imgElem.backgroundPosition ) {
﻿  ﻿  ﻿  SpriteMe.bgposZeroZero++;
﻿  ﻿  }
﻿  ﻿  */
﻿  ﻿  SpriteMe.bgposTotal++;

﻿  ﻿  if ( 0 !== imgElem.elem.offsetWidth && 0 !== imgElem.elem.offsetHeight ) {
﻿  ﻿  ﻿  // Calculate custom margins and determine if the bg image is narrow or short.
﻿  ﻿  ﻿  this.bElemSize = true; // there's at least one element that has real dimensions

﻿  ﻿  ﻿  var aPos = imgElem.calculateBackgroundPosition(this);
﻿  ﻿  ﻿  if ( !aPos ) {
﻿  ﻿  ﻿  ﻿  this.unknownBgPos = imgElem.backgroundPosition;
﻿  ﻿  ﻿  ﻿  return;
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  var marginLeft = aPos[0];
﻿  ﻿  ﻿  var marginRight = (imgElem.elem.offsetWidth - (aPos[0] + this.width));
﻿  ﻿  ﻿  var marginTop = aPos[1];
﻿  ﻿  ﻿  var marginBottom = (imgElem.elem.offsetHeight - (aPos[1] + this.height));
﻿  ﻿  ﻿  if ( ! this.bRepeatX && ( marginLeft > this.marginLeft || marginRight > this.marginRight ) ) {
﻿  ﻿  ﻿  ﻿  if ( (marginLeft - SpriteMe.marginX) < SpriteMe.marginWiggle && (marginRight - SpriteMe.marginX) < SpriteMe.marginWiggle ) { // not too big
﻿  ﻿  ﻿  ﻿  ﻿  if ( marginLeft > this.marginLeft ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  this.marginLeft = marginLeft;
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  if ( marginRight > this.marginRight ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  this.marginRight = marginRight;
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  ﻿  this.narrow = true;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  if ( ! this.bRepeatY && ( marginTop > this.marginTop || marginBottom > this.marginBottom ) ) {
﻿  ﻿  ﻿  ﻿  if ( (marginTop - SpriteMe.marginY) < SpriteMe.marginWiggle && (marginBottom - SpriteMe.marginY) < SpriteMe.marginWiggle ) { // not too big
﻿  ﻿  ﻿  ﻿  ﻿  if ( marginTop > this.marginTop ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  this.marginTop = marginTop;
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  ﻿  if ( marginBottom > this.marginBottom ) {
﻿  ﻿  ﻿  ﻿  ﻿  ﻿  this.marginBottom = marginBottom;
﻿  ﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  ﻿  else {
﻿  ﻿  ﻿  ﻿  ﻿  this.short = true;
﻿  ﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  }
﻿  ﻿  }

﻿  ﻿  if ( "undefined" === typeof(this.prevBackgroundPosition) && -1 != imgElem.backgroundPosition.indexOf('px') ) {
﻿  ﻿  ﻿  this.prevBackgroundPosition = imgElem.backgroundPosition;
﻿  ﻿  }

﻿  ﻿  if ( -1 != imgElem.backgroundPosition.indexOf('px') && this.prevBackgroundPosition != imgElem.backgroundPosition ) {
﻿  ﻿  ﻿  // If two different elements use this background image,
﻿  ﻿  ﻿  // and they both have a background-position with specific "px" values,
﻿  ﻿  ﻿  // then we're going to assume it's already a sprite.
﻿  ﻿  ﻿  // This is ~90% accurate.
﻿  ﻿  ﻿  this.sprite = true;
﻿  ﻿  }

﻿  ﻿  SpriteMe.dprint(8, this.url + ": getDataFromElement: " + "bRepeatX = " + this.bRepeatX + ", bRepeatY = " + this.bRepeatY + ", narrow = " + this.narrow + ", short = " + this.short + ", sprite = " + this.sprite + ", margin = " + this.marginTop + " " + this.marginRight + " " + this.marginBottom + " " + this.marginLeft);
﻿  },

﻿  getHtml: function(bShowWhy) { // SpriteMe.BgImage
﻿  ﻿  var sProps = this.imageProps();
﻿  ﻿  if ( bShowWhy ) {
﻿  ﻿  ﻿  var sWhy = this.reasonWhy();
﻿  ﻿  ﻿  sProps += ( sWhy ? ", <span style='color: #888;'>reason not sprited:</span> " + sWhy : "" );
﻿  ﻿  }

﻿  ﻿  var sElems = "";
﻿  ﻿  for ( var j = 0; j < this.imgElements.length; j++ ) {
﻿  ﻿  ﻿  var imgElem = this.imgElements[j];
﻿  ﻿  ﻿  sElems += imgElem.getHtml();
﻿  ﻿  }

﻿  ﻿  var sHtml = 
﻿  ﻿      "<div class='spritemesortable spritemebgimage' id=" + this.id + ">\n" +
﻿  ﻿      "<a id=" + this.id + "tog style='border: 0px solid #000; background: transparent; color: #000; text-decoration: none; line-height: 40%; padding: 0 2px 0 2px;' href='javascript:SpriteMe.toggleExpand(\"" + this.id + "tog\", \"" + this.id + "elems\")'><img border=0 width=9 height=9 src='http://spriteme.org/images/plus-9x9.png'></a>&nbsp;" +
﻿  ﻿      this.imageLink() + "<div style='margin-left: 16px;'>" + 
﻿  ﻿      sProps + "</div>\n" +
﻿  ﻿      "<div id='" + this.id + "elems' style='display: none; margin-left: 16px;'>" + sElems + "</div>\n" + 
﻿  ﻿      "</div>\n";

﻿  ﻿  return sHtml;
﻿  },

﻿  reasonWhy: function() {
﻿  ﻿  var sWhy = "";
﻿  ﻿  if ( SpriteMe.ERROR == this.iState ) {
﻿  ﻿  ﻿  return "error requesting image";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.ALREADYSPRITE == this.iState ) {
﻿  ﻿  ﻿  return "already a sprite";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.REPEATBOTH == this.iState ) {
﻿  ﻿  ﻿  return "repeats x AND y";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.JPG == this.iState ) {
﻿  ﻿  ﻿  return "jpeg";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.NOELEMSIZE == this.iState ) {
﻿  ﻿  ﻿  return "none of the elements are visible";
﻿  ﻿  }
﻿  ﻿  else if ( "undefined" != typeof(this.unknownBgPos) ) {
﻿  ﻿  ﻿  // TODO - this doesn't work - need to create a state that captures this case
﻿  ﻿  ﻿  return "unrecognized background-position: " + this.unknownBgPos;
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.NARROWSHORT == this.iState ) {
﻿  ﻿  ﻿  return "containing block is taller and wider";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.NARROWLEFT == this.iState ) {
﻿  ﻿  ﻿  return "containing block is wider";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.SHORTTOP == this.iState ) {
﻿  ﻿  ﻿  return "containing block is taller";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.REPEATX == this.iState ) {
﻿  ﻿  ﻿  return "repeats x, width=" + this.width;
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.REPEATY == this.iState ) {
﻿  ﻿  ﻿  return "repeats y, height=" + this.height;
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.NARROWREPEAT == this.iState ) {
﻿  ﻿  ﻿  return "repeats y and narrow";
﻿  ﻿  }
﻿  ﻿  else if ( SpriteMe.SHORTREPEAT == this.iState ) {
﻿  ﻿  ﻿  return "repeats x and short";
﻿  ﻿  }

﻿  ﻿  SpriteMe.dprint(8, "reasonWhy: unknown reason - " + this.iState);
﻿  ﻿  return "";
﻿  },

﻿  setState: function() {
﻿  ﻿  var iState = SpriteMe.GOOD;

﻿  ﻿  if ( this.bError ) {
﻿  ﻿  ﻿  iState = SpriteMe.ERROR;
﻿  ﻿  }
/* For now, we allow spriting images that are already sprites.
﻿  ﻿  else if ( this.sprite ) {
﻿  ﻿  ﻿  iState = SpriteMe.ALREADYSPRITE;
﻿  ﻿  }
*/
﻿  ﻿  else if ( this.bRepeatX && this.bRepeatY ) {
﻿  ﻿  ﻿  iState = SpriteMe.REPEATBOTH;
﻿  ﻿  }
﻿  ﻿  else if ( -1 != this.url.indexOf(".jpg") ) {
﻿  ﻿  ﻿  iState = SpriteMe.JPG;
﻿  ﻿  }
﻿  ﻿  else if ( ! this.bElemSize ) {
﻿  ﻿  ﻿  iState = SpriteMe.NOELEMSIZE;
﻿  ﻿  }
﻿  ﻿  else if ( this.bRepeatX && !this.short ) {
﻿  ﻿  ﻿  iState = SpriteMe.REPEATX;
﻿  ﻿  }
﻿  ﻿  else if ( this.bRepeatY && !this.narrow ) {
﻿  ﻿  ﻿  iState = SpriteMe.REPEATY;
﻿  ﻿  }
﻿  ﻿  else if ( this.narrow && this.short ) {
﻿  ﻿  ﻿  iState = SpriteMe.NARROWSHORT;
﻿  ﻿  }
﻿  ﻿  else if ( this.narrow && this.bRepeatY ) {
﻿  ﻿  ﻿  iState = SpriteMe.NARROWREPEAT;
﻿  ﻿  }
﻿  ﻿  else if ( this.short && this.bRepeatX ) {
﻿  ﻿  ﻿  iState = SpriteMe.SHORTREPEAT;
﻿  ﻿  }
﻿  ﻿  else if ( this.narrow ) {
﻿  ﻿  ﻿  iState = SpriteMe.NARROWLEFT;
﻿  ﻿  }
﻿  ﻿  else if ( this.short ) {
﻿  ﻿  ﻿  iState = SpriteMe.SHORTTOP;
﻿  ﻿  }
﻿  ﻿  this.iState = iState;

﻿  ﻿  if ( this.sprite ) {
﻿  ﻿  ﻿  SpriteMe.spriteCntr++;
﻿  ﻿  }
﻿  },

﻿  imageOnload: function() {
﻿  ﻿  this.width = this.image.width;
﻿  ﻿  this.height = this.image.height;
﻿  },

﻿  imageOnerror: function() {
﻿  ﻿  this.bError = true;
﻿  }
};



////////////////////////////////////////////////////////////////////////////////
//
// ImageElement object
//
////////////////////////////////////////////////////////////////////////////////
SpriteMe.ImageElement = function(elem, bgImage) {
﻿  this.bgImage = bgImage;
﻿  this.elem = elem; // this is the actual DOM element
﻿  this.iElem = bgImage.imgElements.length;
﻿  bgImage.imgElements[this.iElem] = this;
﻿  this.id = bgImage.id + "elem" + this.iElem;
};


SpriteMe.ImageElement.prototype = {
﻿  getHtml: function() {
﻿  ﻿  var anchorId = this.bgImage.id + "_" + this.iElem;

﻿  ﻿  var sHtml =
﻿  ﻿      "<div id=" + this.id + " class=spritemeelem>" +
﻿  ﻿      "<a id=" + anchorId + " class=spritemeelemhighlight href='#' onmouseover='SpriteMe.elemHighlight(\"" + this.bgImage.url + "\", " + this.iElem +
﻿  ﻿      ")' onmouseout='SpriteMe.elemUnhighlight()' onclick='SpriteMe.elemSelect(\"" + this.bgImage.url + "\", " + this.iElem + ", \"" + anchorId + 
﻿  ﻿      "\"); return false'>" +
﻿  ﻿      this.elem.tagName + ( this.elem.id ? " #" + this.elem.id : "" ) + "</a> - " +
﻿  ﻿      this.backgroundRepeat + ", " + this.backgroundPosition + ", " + this.elem.offsetWidth + "x" + this.elem.offsetHeight +
﻿  ﻿      "</div>\n";

﻿  ﻿  return sHtml;
﻿  },

﻿  getCssHtml: function(bRule) {
﻿  ﻿  var sHtml = "";
﻿  ﻿  if ( bRule ) {
﻿  ﻿  ﻿  sHtml = 
﻿  ﻿  ﻿  ﻿  "<div style='margin-bottom: 8px;'>" + this.elem.tagName + 
﻿  ﻿  ﻿  ﻿  ( this.elem.id ? " id=" + this.elem.id : "" ) +
﻿  ﻿  ﻿  ﻿  ( this.elem.className ? " class=" + this.elem.className : "" ) +
﻿  ﻿  ﻿  ﻿  "<br><code>{<br>" +
﻿  ﻿  ﻿  ﻿  "&nbsp;&nbsp;<strike>background-image: " + this.oldBgImage + "</strike><br>" +
﻿  ﻿  ﻿  ﻿  "&nbsp;&nbsp;<strong style='color: #000'>background-image: " + this.elem.style.backgroundImage +
﻿  ﻿  ﻿  ﻿  ";<br>&nbsp;&nbsp;background-position: " + this.elem.style.backgroundPosition +
﻿  ﻿  ﻿  ﻿  ";</strong>'<br>}</code></div>\n";
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  var snippet = this.elem.innerHTML.substring(0, 32);
﻿  ﻿  ﻿  snippet = snippet.replace("<", "&lt;").replace(">", "&gt;");
﻿  ﻿  ﻿  snippet += ( snippet ? "..." : "" );
﻿  ﻿  ﻿  sHtml = 
﻿  ﻿  ﻿  ﻿  "<div style='margin-bottom: 8px;'><code>&lt;" + this.elem.tagName + 
﻿  ﻿  ﻿  ﻿  ( this.elem.id ? "<br>&nbsp;&nbsp;id=" + this.elem.id : "" ) +
﻿  ﻿  ﻿  ﻿  ( this.elem.className ? "<br>&nbsp;&nbsp;class=" + this.elem.className : "" ) +
﻿  ﻿  ﻿  ﻿  "<br>&nbsp;&nbsp;<strike>style='background-image: " + this.oldBgImage + ";'</strike>" +
﻿  ﻿  ﻿  ﻿  "<br>&nbsp;&nbsp;style='<strong style='color: #000'>background-image: " + this.elem.style.backgroundImage +
﻿  ﻿  ﻿  ﻿  "; background-position: " + this.elem.style.backgroundPosition +
﻿  ﻿  ﻿  ﻿  ";</strong>'&gt;" + snippet + "</code></div>\n";
﻿  ﻿  }

﻿  ﻿  return sHtml;
﻿  },

﻿  spritify: function(url, bgImage) { // ImageElement
﻿  ﻿  var aPos = this.calculateBackgroundPosition(bgImage);
﻿  ﻿  if ( aPos ) {
﻿  ﻿  ﻿  this.oldBgPos = SpriteMe.getStyleAndUrl(this.elem, "backgroundPosition");
﻿  ﻿  ﻿  SpriteMe.setStyleAndUrl(this.elem, 'backgroundPosition', aPos[0] + 'px ' + aPos[1] + 'px');
﻿  ﻿  ﻿  this.oldBgImage = SpriteMe.getStyleAndUrl(this.elem, "backgroundImage");
﻿  ﻿  ﻿  this.oldBgImageInline = this.elem.style.backgroundImage;
﻿  ﻿  ﻿  SpriteMe.setStyleAndUrl(this.elem, 'backgroundImage', url, true);
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  SpriteMe.dprint(5, "SpriteMe.ImageElement.spritify: no regex match: " + this.backgroundPosition);
﻿  ﻿  ﻿  // TODO - deal with background-position that uses "px" values (other than "0px" which is handled above)
﻿  ﻿  ﻿  bgImage.unknownBgPos = this.backgroundPosition;
﻿  ﻿  }
﻿  },

﻿  calculateBackgroundPosition: function(bgImage) {
﻿  ﻿  if ( !this.backgroundPosition ) {
﻿  ﻿  ﻿  SpriteMe.dprint(5, "calculateBackgroundPosition: no backgroundPosition");
﻿  ﻿  ﻿  return undefined; // TODO - deal with elements that are missing backgroundPosition
﻿  ﻿  }

﻿  ﻿  var bgPos = this.backgroundPosition;
﻿  ﻿  var xOffset = 0;
﻿  ﻿  var yOffset = 0;
﻿  ﻿  if ( bgPos.match(/^([-.0-9]*)px/) ) {
﻿  ﻿  ﻿  xOffset = parseInt(RegExp.$1);
﻿  ﻿  ﻿  //SpriteMe.dprint(8, "calculateBackgroundPosition: xOffset = " + xOffset + " from " + bgPos);
﻿  ﻿  ﻿  bgPos = bgPos.replace(RegExp.$1 + "px", "0%");
﻿  ﻿  }
﻿  ﻿  if ( bgPos.match(/ ([-.0-9]*)px$/) ) {
﻿  ﻿  ﻿  yOffset = parseInt(RegExp.$1);
﻿  ﻿  ﻿  //SpriteMe.dprint(8, "calculateBackgroundPosition: yOffset = " + yOffset + " from " + bgPos);
﻿  ﻿  ﻿  bgPos = bgPos.replace(" " + RegExp.$1 + "px", " 0%");
﻿  ﻿  }

﻿  ﻿  if ( bgPos.match(/([.0-9]*)% ([.0-9]*)%/) ) {
﻿  ﻿  ﻿  var xPos = parseInt(RegExp.$1);
﻿  ﻿  ﻿  var yPos = parseInt(RegExp.$2);
﻿  ﻿  ﻿  var left = bgImage.spriteLeft;
﻿  ﻿  ﻿  var top = bgImage.spriteTop;
﻿  ﻿  ﻿  if ( 0 != xPos ) {
﻿  ﻿  ﻿  ﻿  left += (xPos*bgImage.width/100) - (xPos*this.elem.offsetWidth/100);
﻿  ﻿  ﻿  }
﻿  ﻿  ﻿  if ( 0 != yPos ) {
﻿  ﻿  ﻿  ﻿  top += ((yPos*bgImage.height/100) - (yPos*this.elem.offsetHeight/100));
﻿  ﻿  ﻿  }

﻿  ﻿  ﻿  left -= xOffset;
﻿  ﻿  ﻿  top -= yOffset;

﻿  ﻿  ﻿  return [(-1*left), (-1*top)];
﻿  ﻿  }
﻿  ﻿  else {
﻿  ﻿  ﻿  SpriteMe.dprint(5, "calculateBackgroundPosition: no regex match: " + bgPos);
﻿  ﻿  ﻿  // TODO - deal with background-position that uses "px" values (other than "0px" which is handled above)
﻿  ﻿  }

﻿  ﻿  return undefined;
﻿  } // NO COMMA!
};



////////////////////////////////////////////////////////////////////////////////
//
// CssRule object
//
////////////////////////////////////////////////////////////////////////////////
SpriteMe.CssRule = function(domRule, url) {
﻿  this.rule = domRule;
﻿  this.url = url;
};


SpriteMe.CssRule.prototype = {
﻿  getCssHtml: function(oldBgImage, oldBgPos) {
﻿  ﻿  var sHtml =
﻿  ﻿      "<div style='margin-bottom: 8px;'><code>" + 
﻿  ﻿      this.rule.selectorText + " {<br>" +
﻿  ﻿      "&nbsp;&nbsp;<strike>background-image: " + oldBgImage + ";</strike><br>" +
﻿  ﻿      ( oldBgPos ? "&nbsp;&nbsp;<strike>background-position: " + oldBgPos + ";</strike><br>" : "" ) +
﻿  ﻿      "&nbsp;&nbsp;<strong style='color: #000'>background-image: " + this.rule.style.backgroundImage +
﻿  ﻿      ";<br>&nbsp;&nbsp;background-position: " + this.rule.style.backgroundPosition +
﻿  ﻿      ";</strong><br>}</code></div>\n";

﻿  ﻿  return sHtml;
﻿  } // NO COMMA!
};


SpriteMe.init = function(doc) {
﻿  SpriteMe.doc = doc;
﻿  SpriteMe.bgImageCntr = 0;
﻿  SpriteMe.hBgImages = null;
﻿  SpriteMe.suggestedSpriteCntr = 0;
﻿  SpriteMe.aSprites = [];

﻿  SpriteMe.showSpinner();
﻿  SpriteMe.getBgImages();
﻿  SpriteMe.getData();
};




/*
 * jQuery JavaScript Library v1.3.2
 * http://jquery.com/
 *
 * Copyright (c) 2009 John Resig
 * Dual licensed under the MIT and GPL licenses.
 * http://docs.jquery.com/License
 *
 * Date: 2009-02-19 17:34:21 -0500 (Thu, 19 Feb 2009)
 * Revision: 6246
 */
(function(){var l=this,g,y=l.jQuery,p=l.$,o=l.jQuery=l.$=function(E,F){return new o.fn.init(E,F)},D=/^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/,f=/^.[^:#\[\.,]*$/;o.fn=o.prototype={init:function(E,H){E=E||document;if(E.nodeType){this[0]=E;this.length=1;this.context=E;return this}if(typeof E==="string"){var G=D.exec(E);if(G&&(G[1]||!H)){if(G[1]){E=o.clean([G[1]],H)}else{var I=document.getElementById(G[3]);if(I&&I.id!=G[3]){return o().find(E)}var F=o(I||[]);F.context=document;F.selector=E;return F}}else{return o(H).find(E)}}else{if(o.isFunction(E)){return o(document).ready(E)}}if(E.selector&&E.context){this.selector=E.selector;this.context=E.context}return this.setArray(o.isArray(E)?E:o.makeArray(E))},selector:"",jquery:"1.3.2",size:function(){return this.length},get:function(E){return E===g?Array.prototype.slice.call(this):this[E]},pushStack:function(F,H,E){var G=o(F);G.prevObject=this;G.context=this.context;if(H==="find"){G.selector=this.selector+(this.selector?" ":"")+E}else{if(H){G.selector=this.selector+"."+H+"("+E+")"}}return G},setArray:function(E){this.length=0;Array.prototype.push.apply(this,E);return this},each:function(F,E){return o.each(this,F,E)},index:function(E){return o.inArray(E&&E.jquery?E[0]:E,this)},attr:function(F,H,G){var E=F;if(typeof F==="string"){if(H===g){return this[0]&&o[G||"attr"](this[0],F)}else{E={};E[F]=H}}return this.each(function(I){for(F in E){o.attr(G?this.style:this,F,o.prop(this,E[F],G,I,F))}})},css:function(E,F){if((E=="width"||E=="height")&&parseFloat(F)<0){F=g}return this.attr(E,F,"curCSS")},text:function(F){if(typeof F!=="object"&&F!=null){return this.empty().append((this[0]&&this[0].ownerDocument||document).createTextNode(F))}var E="";o.each(F||this,function(){o.each(this.childNodes,function(){if(this.nodeType!=8){E+=this.nodeType!=1?this.nodeValue:o.fn.text([this])}})});return E},wrapAll:function(E){if(this[0]){var F=o(E,this[0].ownerDocument).clone();if(this[0].parentNode){F.insertBefore(this[0])}F.map(function(){var G=this;while(G.firstChild){G=G.firstChild}return G}).append(this)}return this},wrapInner:function(E){return this.each(function(){o(this).contents().wrapAll(E)})},wrap:function(E){return this.each(function(){o(this).wrapAll(E)})},append:function(){return this.domManip(arguments,true,function(E){if(this.nodeType==1){this.appendChild(E)}})},prepend:function(){return this.domManip(arguments,true,function(E){if(this.nodeType==1){this.insertBefore(E,this.firstChild)}})},before:function(){return this.domManip(arguments,false,function(E){this.parentNode.insertBefore(E,this)})},after:function(){return this.domManip(arguments,false,function(E){this.parentNode.insertBefore(E,this.nextSibling)})},end:function(){return this.prevObject||o([])},push:[].push,sort:[].sort,splice:[].splice,find:function(E){if(this.length===1){var F=this.pushStack([],"find",E);F.length=0;o.find(E,this[0],F);return F}else{return this.pushStack(o.unique(o.map(this,function(G){return o.find(E,G)})),"find",E)}},clone:function(G){var E=this.map(function(){if(!o.support.noCloneEvent&&!o.isXMLDoc(this)){var I=this.outerHTML;if(!I){var J=this.ownerDocument.createElement("div");J.appendChild(this.cloneNode(true));I=J.innerHTML}return o.clean([I.replace(/ jQuery\d+="(?:\d+|null)"/g,"").replace(/^\s*/,"")])[0]}else{return this.cloneNode(true)}});if(G===true){var H=this.find("*").andSelf(),F=0;E.find("*").andSelf().each(function(){if(this.nodeName!==H[F].nodeName){return}var I=o.data(H[F],"events");for(var K in I){for(var J in I[K]){o.event.add(this,K,I[K][J],I[K][J].data)}}F++})}return E},filter:function(E){return this.pushStack(o.isFunction(E)&&o.grep(this,function(G,F){return E.call(G,F)})||o.multiFilter(E,o.grep(this,function(F){return F.nodeType===1})),"filter",E)},closest:function(E){var G=o.expr.match.POS.test(E)?o(E):null,F=0;return this.map(function(){var H=this;while(H&&H.ownerDocument){if(G?G.index(H)>-1:o(H).is(E)){o.data(H,"closest",F);return H}H=H.parentNode;F++}})},not:function(E){if(typeof E==="string"){if(f.test(E)){return this.pushStack(o.multiFilter(E,this,true),"not",E)}else{E=o.multiFilter(E,this)}}var F=E.length&&E[E.length-1]!==g&&!E.nodeType;return this.filter(function(){return F?o.inArray(this,E)<0:this!=E})},add:function(E){return this.pushStack(o.unique(o.merge(this.get(),typeof E==="string"?o(E):o.makeArray(E))))},is:function(E){return !!E&&o.multiFilter(E,this).length>0},hasClass:function(E){return !!E&&this.is("."+E)},val:function(K){if(K===g){var E=this[0];if(E){if(o.nodeName(E,"option")){return(E.attributes.value||{}).specified?E.value:E.text}if(o.nodeName(E,"select")){var I=E.selectedIndex,L=[],M=E.options,H=E.type=="select-one";if(I<0){return null}for(var F=H?I:0,J=H?I+1:M.length;F<J;F++){var G=M[F];if(G.selected){K=o(G).val();if(H){return K}L.push(K)}}return L}return(E.value||"").replace(/\r/g,"")}return g}if(typeof K==="number"){K+=""}return this.each(function(){if(this.nodeType!=1){return}if(o.isArray(K)&&/radio|checkbox/.test(this.type)){this.checked=(o.inArray(this.value,K)>=0||o.inArray(this.name,K)>=0)}else{if(o.nodeName(this,"select")){var N=o.makeArray(K);o("option",this).each(function(){this.selected=(o.inArray(this.value,N)>=0||o.inArray(this.text,N)>=0)});if(!N.length){this.selectedIndex=-1}}else{this.value=K}}})},html:function(E){return E===g?(this[0]?this[0].innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g,""):null):this.empty().append(E)},replaceWith:function(E){return this.after(E).remove()},eq:function(E){return this.slice(E,+E+1)},slice:function(){return this.pushStack(Array.prototype.slice.apply(this,arguments),"slice",Array.prototype.slice.call(arguments).join(","))},map:function(E){return this.pushStack(o.map(this,function(G,F){return E.call(G,F,G)}))},andSelf:function(){return this.add(this.prevObject)},domManip:function(J,M,L){if(this[0]){var I=(this[0].ownerDocument||this[0]).createDocumentFragment(),F=o.clean(J,(this[0].ownerDocument||this[0]),I),H=I.firstChild;if(H){for(var G=0,E=this.length;G<E;G++){L.call(K(this[G],H),this.length>1||G>0?I.cloneNode(true):I)}}if(F){o.each(F,z)}}return this;function K(N,O){return M&&o.nodeName(N,"table")&&o.nodeName(O,"tr")?(N.getElementsByTagName("tbody")[0]||N.appendChild(N.ownerDocument.createElement("tbody"))):N}}};o.fn.init.prototype=o.fn;function z(E,F){if(F.src){o.ajax({url:F.src,async:false,dataType:"script"})}else{o.globalEval(F.text||F.textContent||F.innerHTML||"")}if(F.parentNode){F.parentNode.removeChild(F)}}function e(){return +new Date}o.extend=o.fn.extend=function(){var J=arguments[0]||{},H=1,I=arguments.length,E=false,G;if(typeof J==="boolean"){E=J;J=arguments[1]||{};H=2}if(typeof J!=="object"&&!o.isFunction(J)){J={}}if(I==H){J=this;--H}for(;H<I;H++){if((G=arguments[H])!=null){for(var F in G){var K=J[F],L=G[F];if(J===L){continue}if(E&&L&&typeof L==="object"&&!L.nodeType){J[F]=o.extend(E,K||(L.length!=null?[]:{}),L)}else{if(L!==g){J[F]=L}}}}}return J};var b=/z-?index|font-?weight|opacity|zoom|line-?height/i,q=document.defaultView||{},s=Object.prototype.toString;o.extend({noConflict:function(E){l.$=p;if(E){l.jQuery=y}return o},isFunction:function(E){return s.call(E)==="[object Function]"},isArray:function(E){return s.call(E)==="[object Array]"},isXMLDoc:function(E){return E.nodeType===9&&E.documentElement.nodeName!=="HTML"||!!E.ownerDocument&&o.isXMLDoc(E.ownerDocument)},globalEval:function(G){if(G&&/\S/.test(G)){var F=document.getElementsByTagName("head")[0]||document.documentElement,E=document.createElement("script");E.type="text/javascript";if(o.support.scriptEval){E.appendChild(document.createTextNode(G))}else{E.text=G}F.insertBefore(E,F.firstChild);F.removeChild(E)}},nodeName:function(F,E){return F.nodeName&&F.nodeName.toUpperCase()==E.toUpperCase()},each:function(G,K,F){var E,H=0,I=G.length;if(F){if(I===g){for(E in G){if(K.apply(G[E],F)===false){break}}}else{for(;H<I;){if(K.apply(G[H++],F)===false){break}}}}else{if(I===g){for(E in G){if(K.call(G[E],E,G[E])===false){break}}}else{for(var J=G[0];H<I&&K.call(J,H,J)!==false;J=G[++H]){}}}return G},prop:function(H,I,G,F,E){if(o.isFunction(I)){I=I.call(H,F)}return typeof I==="number"&&G=="curCSS"&&!b.test(E)?I+"px":I},className:{add:function(E,F){o.each((F||"").split(/\s+/),function(G,H){if(E.nodeType==1&&!o.className.has(E.className,H)){E.className+=(E.className?" ":"")+H}})},remove:function(E,F){if(E.nodeType==1){E.className=F!==g?o.grep(E.className.split(/\s+/),function(G){return !o.className.has(F,G)}).join(" "):""}},has:function(F,E){return F&&o.inArray(E,(F.className||F).toString().split(/\s+/))>-1}},swap:function(H,G,I){var E={};for(var F in G){E[F]=H.style[F];H.style[F]=G[F]}I.call(H);for(var F in G){H.style[F]=E[F]}},css:function(H,F,J,E){if(F=="width"||F=="height"){var L,G={position:"absolute",visibility:"hidden",display:"block"},K=F=="width"?["Left","Right"]:["Top","Bottom"];function I(){L=F=="width"?H.offsetWidth:H.offsetHeight;if(E==="border"){return}o.each(K,function(){if(!E){L-=parseFloat(o.curCSS(H,"padding"+this,true))||0}if(E==="margin"){L+=parseFloat(o.curCSS(H,"margin"+this,true))||0}else{L-=parseFloat(o.curCSS(H,"border"+this+"Width",true))||0}})}if(H.offsetWidth!==0){I()}else{o.swap(H,G,I)}return Math.max(0,Math.round(L))}return o.curCSS(H,F,J)},curCSS:function(I,F,G){var L,E=I.style;if(F=="opacity"&&!o.support.opacity){L=o.attr(E,"opacity");return L==""?"1":L}if(F.match(/float/i)){F=w}if(!G&&E&&E[F]){L=E[F]}else{if(q.getComputedStyle){if(F.match(/float/i)){F="float"}F=F.replace(/([A-Z])/g,"-$1").toLowerCase();var M=q.getComputedStyle(I,null);if(M){L=M.getPropertyValue(F)}if(F=="opacity"&&L==""){L="1"}}else{if(I.currentStyle){var J=F.replace(/\-(\w)/g,function(N,O){return O.toUpperCase()});L=I.currentStyle[F]||I.currentStyle[J];if(!/^\d+(px)?$/i.test(L)&&/^\d/.test(L)){var H=E.left,K=I.runtimeStyle.left;I.runtimeStyle.left=I.currentStyle.left;E.left=L||0;L=E.pixelLeft+"px";E.left=H;I.runtimeStyle.left=K}}}}return L},clean:function(F,K,I){K=K||document;if(typeof K.createElement==="undefined"){K=K.ownerDocument||K[0]&&K[0].ownerDocument||document}if(!I&&F.length===1&&typeof F[0]==="string"){var H=/^<(\w+)\s*\/?>$/.exec(F[0]);if(H){return[K.createElement(H[1])]}}var G=[],E=[],L=K.createElement("div");o.each(F,function(P,S){if(typeof S==="number"){S+=""}if(!S){return}if(typeof S==="string"){S=S.replace(/(<(\w+)[^>]*?)\/>/g,function(U,V,T){return T.match(/^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i)?U:V+"></"+T+">"});var O=S.replace(/^\s+/,"").substring(0,10).toLowerCase();var Q=!O.indexOf("<opt")&&[1,"<select multiple='multiple'>","</select>"]||!O.indexOf("<leg")&&[1,"<fieldset>","</fieldset>"]||O.match(/^<(thead|tbody|tfoot|colg|cap)/)&&[1,"<table>","</table>"]||!O.indexOf("<tr")&&[2,"<table><tbody>","</tbody></table>"]||(!O.indexOf("<td")||!O.indexOf("<th"))&&[3,"<table><tbody><tr>","</tr></tbody></table>"]||!O.indexOf("<col")&&[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"]||!o.support.htmlSerialize&&[1,"div<div>","</div>"]||[0,"",""];L.innerHTML=Q[1]+S+Q[2];while(Q[0]--){L=L.lastChild}if(!o.support.tbody){var R=/<tbody/i.test(S),N=!O.indexOf("<table")&&!R?L.firstChild&&L.firstChild.childNodes:Q[1]=="<table>"&&!R?L.childNodes:[];for(var M=N.length-1;M>=0;--M){if(o.nodeName(N[M],"tbody")&&!N[M].childNodes.length){N[M].parentNode.removeChild(N[M])}}}if(!o.support.leadingWhitespace&&/^\s/.test(S)){L.insertBefore(K.createTextNode(S.match(/^\s*/)[0]),L.firstChild)}S=o.makeArray(L.childNodes)}if(S.nodeType){G.push(S)}else{G=o.merge(G,S)}});if(I){for(var J=0;G[J];J++){if(o.nodeName(G[J],"script")&&(!G[J].type||G[J].type.toLowerCase()==="text/javascript")){E.push(G[J].parentNode?G[J].parentNode.removeChild(G[J]):G[J])}else{if(G[J].nodeType===1){G.splice.apply(G,[J+1,0].concat(o.makeArray(G[J].getElementsByTagName("script"))))}I.appendChild(G[J])}}return E}return G},attr:function(J,G,K){if(!J||J.nodeType==3||J.nodeType==8){return g}var H=!o.isXMLDoc(J),L=K!==g;G=H&&o.props[G]||G;if(J.tagName){var F=/href|src|style/.test(G);if(G=="selected"&&J.parentNode){J.parentNode.selectedIndex}if(G in J&&H&&!F){if(L){if(G=="type"&&o.nodeName(J,"input")&&J.parentNode){throw"type property can't be changed"}J[G]=K}if(o.nodeName(J,"form")&&J.getAttributeNode(G)){return J.getAttributeNode(G).nodeValue}if(G=="tabIndex"){var I=J.getAttributeNode("tabIndex");return I&&I.specified?I.value:J.nodeName.match(/(button|input|object|select|textarea)/i)?0:J.nodeName.match(/^(a|area)$/i)&&J.href?0:g}return J[G]}if(!o.support.style&&H&&G=="style"){return o.attr(J.style,"cssText",K)}if(L){J.setAttribute(G,""+K)}var E=!o.support.hrefNormalized&&H&&F?J.getAttribute(G,2):J.getAttribute(G);return E===null?g:E}if(!o.support.opacity&&G=="opacity"){if(L){J.zoom=1;J.filter=(J.filter||"").replace(/alpha\([^)]*\)/,"")+(parseInt(K)+""=="NaN"?"":"alpha(opacity="+K*100+")")}return J.filter&&J.filter.indexOf("opacity=")>=0?(parseFloat(J.filter.match(/opacity=([^)]*)/)[1])/100)+"":""}G=G.replace(/-([a-z])/ig,function(M,N){return N.toUpperCase()});if(L){J[G]=K}return J[G]},trim:function(E){return(E||"").replace(/^\s+|\s+$/g,"")},makeArray:function(G){var E=[];if(G!=null){var F=G.length;if(F==null||typeof G==="string"||o.isFunction(G)||G.setInterval){E[0]=G}else{while(F){E[--F]=G[F]}}}return E},inArray:function(G,H){for(var E=0,F=H.length;E<F;E++){if(H[E]===G){return E}}return -1},merge:function(H,E){var F=0,G,I=H.length;if(!o.support.getAll){while((G=E[F++])!=null){if(G.nodeType!=8){H[I++]=G}}}else{while((G=E[F++])!=null){H[I++]=G}}return H},unique:function(K){var F=[],E={};try{for(var G=0,H=K.length;G<H;G++){var J=o.data(K[G]);if(!E[J]){E[J]=true;F.push(K[G])}}}catch(I){F=K}return F},grep:function(F,J,E){var G=[];for(var H=0,I=F.length;H<I;H++){if(!E!=!J(F[H],H)){G.push(F[H])}}return G},map:function(E,J){var F=[];for(var G=0,H=E.length;G<H;G++){var I=J(E[G],G);if(I!=null){F[F.length]=I}}return F.concat.apply([],F)}});var C=navigator.userAgent.toLowerCase();o.browser={version:(C.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)||[0,"0"])[1],safari:/webkit/.test(C),opera:/opera/.test(C),msie:/msie/.test(C)&&!/opera/.test(C),mozilla:/mozilla/.test(C)&&!/(compatible|webkit)/.test(C)};o.each({parent:function(E){return E.parentNode},parents:function(E){return o.dir(E,"parentNode")},next:function(E){return o.nth(E,2,"nextSibling")},prev:function(E){return o.nth(E,2,"previousSibling")},nextAll:function(E){return o.dir(E,"nextSibling")},prevAll:function(E){return o.dir(E,"previousSibling")},siblings:function(E){return o.sibling(E.parentNode.firstChild,E)},children:function(E){return o.sibling(E.firstChild)},contents:function(E){return o.nodeName(E,"iframe")?E.contentDocument||E.contentWindow.document:o.makeArray(E.childNodes)}},function(E,F){o.fn[E]=function(G){var H=o.map(this,F);if(G&&typeof G=="string"){H=o.multiFilter(G,H)}return this.pushStack(o.unique(H),E,G)}});o.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(E,F){o.fn[E]=function(G){var J=[],L=o(G);for(var K=0,H=L.length;K<H;K++){var I=(K>0?this.clone(true):this).get();o.fn[F].apply(o(L[K]),I);J=J.concat(I)}return this.pushStack(J,E,G)}});o.each({removeAttr:function(E){o.attr(this,E,"");if(this.nodeType==1){this.removeAttribute(E)}},addClass:function(E){o.className.add(this,E)},removeClass:function(E){o.className.remove(this,E)},toggleClass:function(F,E){if(typeof E!=="boolean"){E=!o.className.has(this,F)}o.className[E?"add":"remove"](this,F)},remove:function(E){if(!E||o.filter(E,[this]).length){o("*",this).add([this]).each(function(){o.event.remove(this);o.removeData(this)});if(this.parentNode){this.parentNode.removeChild(this)}}},empty:function(){o(this).children().remove();while(this.firstChild){this.removeChild(this.firstChild)}}},function(E,F){o.fn[E]=function(){return this.each(F,arguments)}});function j(E,F){return E[0]&&parseInt(o.curCSS(E[0],F,true),10)||0}var h="jQuery"+e(),v=0,A={};o.extend({cache:{},data:function(F,E,G){F=F==l?A:F;var H=F[h];if(!H){H=F[h]=++v}if(E&&!o.cache[H]){o.cache[H]={}}if(G!==g){o.cache[H][E]=G}return E?o.cache[H][E]:H},removeData:function(F,E){F=F==l?A:F;var H=F[h];if(E){if(o.cache[H]){delete o.cache[H][E];E="";for(E in o.cache[H]){break}if(!E){o.removeData(F)}}}else{try{delete F[h]}catch(G){if(F.removeAttribute){F.removeAttribute(h)}}delete o.cache[H]}},queue:function(F,E,H){if(F){E=(E||"fx")+"queue";var G=o.data(F,E);if(!G||o.isArray(H)){G=o.data(F,E,o.makeArray(H))}else{if(H){G.push(H)}}}return G},dequeue:function(H,G){var E=o.queue(H,G),F=E.shift();if(!G||G==="fx"){F=E[0]}if(F!==g){F.call(H)}}});o.fn.extend({data:function(E,G){var H=E.split(".");H[1]=H[1]?"."+H[1]:"";if(G===g){var F=this.triggerHandler("getData"+H[1]+"!",[H[0]]);if(F===g&&this.length){F=o.data(this[0],E)}return F===g&&H[1]?this.data(H[0]):F}else{return this.trigger("setData"+H[1]+"!",[H[0],G]).each(function(){o.data(this,E,G)})}},removeData:function(E){return this.each(function(){o.removeData(this,E)})},queue:function(E,F){if(typeof E!=="string"){F=E;E="fx"}if(F===g){return o.queue(this[0],E)}return this.each(function(){var G=o.queue(this,E,F);if(E=="fx"&&G.length==1){G[0].call(this)}})},dequeue:function(E){return this.each(function(){o.dequeue(this,E)})}});
/*
 * Sizzle CSS Selector Engine - v0.9.3
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){var R=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g,L=0,H=Object.prototype.toString;var F=function(Y,U,ab,ac){ab=ab||[];U=U||document;if(U.nodeType!==1&&U.nodeType!==9){return[]}if(!Y||typeof Y!=="string"){return ab}var Z=[],W,af,ai,T,ad,V,X=true;R.lastIndex=0;while((W=R.exec(Y))!==null){Z.push(W[1]);if(W[2]){V=RegExp.rightContext;break}}if(Z.length>1&&M.exec(Y)){if(Z.length===2&&I.relative[Z[0]]){af=J(Z[0]+Z[1],U)}else{af=I.relative[Z[0]]?[U]:F(Z.shift(),U);while(Z.length){Y=Z.shift();if(I.relative[Y]){Y+=Z.shift()}af=J(Y,af)}}}else{var ae=ac?{expr:Z.pop(),set:E(ac)}:F.find(Z.pop(),Z.length===1&&U.parentNode?U.parentNode:U,Q(U));af=F.filter(ae.expr,ae.set);if(Z.length>0){ai=E(af)}else{X=false}while(Z.length){var ah=Z.pop(),ag=ah;if(!I.relative[ah]){ah=""}else{ag=Z.pop()}if(ag==null){ag=U}I.relative[ah](ai,ag,Q(U))}}if(!ai){ai=af}if(!ai){throw"Syntax error, unrecognized expression: "+(ah||Y)}if(H.call(ai)==="[object Array]"){if(!X){ab.push.apply(ab,ai)}else{if(U.nodeType===1){for(var aa=0;ai[aa]!=null;aa++){if(ai[aa]&&(ai[aa]===true||ai[aa].nodeType===1&&K(U,ai[aa]))){ab.push(af[aa])}}}else{for(var aa=0;ai[aa]!=null;aa++){if(ai[aa]&&ai[aa].nodeType===1){ab.push(af[aa])}}}}}else{E(ai,ab)}if(V){F(V,U,ab,ac);if(G){hasDuplicate=false;ab.sort(G);if(hasDuplicate){for(var aa=1;aa<ab.length;aa++){if(ab[aa]===ab[aa-1]){ab.splice(aa--,1)}}}}}return ab};F.matches=function(T,U){return F(T,null,null,U)};F.find=function(aa,T,ab){var Z,X;if(!aa){return[]}for(var W=0,V=I.order.length;W<V;W++){var Y=I.order[W],X;if((X=I.match[Y].exec(aa))){var U=RegExp.leftContext;if(U.substr(U.length-1)!=="\\"){X[1]=(X[1]||"").replace(/\\/g,"");Z=I.find[Y](X,T,ab);if(Z!=null){aa=aa.replace(I.match[Y],"");break}}}}if(!Z){Z=T.getElementsByTagName("*")}return{set:Z,expr:aa}};F.filter=function(ad,ac,ag,W){var V=ad,ai=[],aa=ac,Y,T,Z=ac&&ac[0]&&Q(ac[0]);while(ad&&ac.length){for(var ab in I.filter){if((Y=I.match[ab].exec(ad))!=null){var U=I.filter[ab],ah,af;T=false;if(aa==ai){ai=[]}if(I.preFilter[ab]){Y=I.preFilter[ab](Y,aa,ag,ai,W,Z);if(!Y){T=ah=true}else{if(Y===true){continue}}}if(Y){for(var X=0;(af=aa[X])!=null;X++){if(af){ah=U(af,Y,X,aa);var ae=W^!!ah;if(ag&&ah!=null){if(ae){T=true}else{aa[X]=false}}else{if(ae){ai.push(af);T=true}}}}}if(ah!==g){if(!ag){aa=ai}ad=ad.replace(I.match[ab],"");if(!T){return[]}break}}}if(ad==V){if(T==null){throw"Syntax error, unrecognized expression: "+ad}else{break}}V=ad}return aa};var I=F.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF_-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(T){return T.getAttribute("href")}},relative:{"+":function(aa,T,Z){var X=typeof T==="string",ab=X&&!/\W/.test(T),Y=X&&!ab;if(ab&&!Z){T=T.toUpperCase()}for(var W=0,V=aa.length,U;W<V;W++){if((U=aa[W])){while((U=U.previousSibling)&&U.nodeType!==1){}aa[W]=Y||U&&U.nodeName===T?U||false:U===T}}if(Y){F.filter(T,aa,true)}},">":function(Z,U,aa){var X=typeof U==="string";if(X&&!/\W/.test(U)){U=aa?U:U.toUpperCase();for(var V=0,T=Z.length;V<T;V++){var Y=Z[V];if(Y){var W=Y.parentNode;Z[V]=W.nodeName===U?W:false}}}else{for(var V=0,T=Z.length;V<T;V++){var Y=Z[V];if(Y){Z[V]=X?Y.parentNode:Y.parentNode===U}}if(X){F.filter(U,Z,true)}}},"":function(W,U,Y){var V=L++,T=S;if(!U.match(/\W/)){var X=U=Y?U:U.toUpperCase();T=P}T("parentNode",U,V,W,X,Y)},"~":function(W,U,Y){var V=L++,T=S;if(typeof U==="string"&&!U.match(/\W/)){var X=U=Y?U:U.toUpperCase();T=P}T("previousSibling",U,V,W,X,Y)}},find:{ID:function(U,V,W){if(typeof V.getElementById!=="undefined"&&!W){var T=V.getElementById(U[1]);return T?[T]:[]}},NAME:function(V,Y,Z){if(typeof Y.getElementsByName!=="undefined"){var U=[],X=Y.getElementsByName(V[1]);for(var W=0,T=X.length;W<T;W++){if(X[W].getAttribute("name")===V[1]){U.push(X[W])}}return U.length===0?null:U}},TAG:function(T,U){return U.getElementsByTagName(T[1])}},preFilter:{CLASS:function(W,U,V,T,Z,aa){W=" "+W[1].replace(/\\/g,"")+" ";if(aa){return W}for(var X=0,Y;(Y=U[X])!=null;X++){if(Y){if(Z^(Y.className&&(" "+Y.className+" ").indexOf(W)>=0)){if(!V){T.push(Y)}}else{if(V){U[X]=false}}}}return false},ID:function(T){return T[1].replace(/\\/g,"")},TAG:function(U,T){for(var V=0;T[V]===false;V++){}return T[V]&&Q(T[V])?U[1]:U[1].toUpperCase()},CHILD:function(T){if(T[1]=="nth"){var U=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(T[2]=="even"&&"2n"||T[2]=="odd"&&"2n+1"||!/\D/.test(T[2])&&"0n+"+T[2]||T[2]);T[2]=(U[1]+(U[2]||1))-0;T[3]=U[3]-0}T[0]=L++;return T},ATTR:function(X,U,V,T,Y,Z){var W=X[1].replace(/\\/g,"");if(!Z&&I.attrMap[W]){X[1]=I.attrMap[W]}if(X[2]==="~="){X[4]=" "+X[4]+" "}return X},PSEUDO:function(X,U,V,T,Y){if(X[1]==="not"){if(X[3].match(R).length>1||/^\w/.test(X[3])){X[3]=F(X[3],null,null,U)}else{var W=F.filter(X[3],U,V,true^Y);if(!V){T.push.apply(T,W)}return false}}else{if(I.match.POS.test(X[0])||I.match.CHILD.test(X[0])){return true}}return X},POS:function(T){T.unshift(true);return T}},filters:{enabled:function(T){return T.disabled===false&&T.type!=="hidden"},disabled:function(T){return T.disabled===true},checked:function(T){return T.checked===true},selected:function(T){T.parentNode.selectedIndex;return T.selected===true},parent:function(T){return !!T.firstChild},empty:function(T){return !T.firstChild},has:function(V,U,T){return !!F(T[3],V).length},header:function(T){return/h\d/i.test(T.nodeName)},text:function(T){return"text"===T.type},radio:function(T){return"radio"===T.type},checkbox:function(T){return"checkbox"===T.type},file:function(T){return"file"===T.type},password:function(T){return"password"===T.type},submit:function(T){return"submit"===T.type},image:function(T){return"image"===T.type},reset:function(T){return"reset"===T.type},button:function(T){return"button"===T.type||T.nodeName.toUpperCase()==="BUTTON"},input:function(T){return/input|select|textarea|button/i.test(T.nodeName)}},setFilters:{first:function(U,T){return T===0},last:function(V,U,T,W){return U===W.length-1},even:function(U,T){return T%2===0},odd:function(U,T){return T%2===1},lt:function(V,U,T){return U<T[3]-0},gt:function(V,U,T){return U>T[3]-0},nth:function(V,U,T){return T[3]-0==U},eq:function(V,U,T){return T[3]-0==U}},filter:{PSEUDO:function(Z,V,W,aa){var U=V[1],X=I.filters[U];if(X){return X(Z,W,V,aa)}else{if(U==="contains"){return(Z.textContent||Z.innerText||"").indexOf(V[3])>=0}else{if(U==="not"){var Y=V[3];for(var W=0,T=Y.length;W<T;W++){if(Y[W]===Z){return false}}return true}}}},CHILD:function(T,W){var Z=W[1],U=T;switch(Z){case"only":case"first":while(U=U.previousSibling){if(U.nodeType===1){return false}}if(Z=="first"){return true}U=T;case"last":while(U=U.nextSibling){if(U.nodeType===1){return false}}return true;case"nth":var V=W[2],ac=W[3];if(V==1&&ac==0){return true}var Y=W[0],ab=T.parentNode;if(ab&&(ab.sizcache!==Y||!T.nodeIndex)){var X=0;for(U=ab.firstChild;U;U=U.nextSibling){if(U.nodeType===1){U.nodeIndex=++X}}ab.sizcache=Y}var aa=T.nodeIndex-ac;if(V==0){return aa==0}else{return(aa%V==0&&aa/V>=0)}}},ID:function(U,T){return U.nodeType===1&&U.getAttribute("id")===T},TAG:function(U,T){return(T==="*"&&U.nodeType===1)||U.nodeName===T},CLASS:function(U,T){return(" "+(U.className||U.getAttribute("class"))+" ").indexOf(T)>-1},ATTR:function(Y,W){var V=W[1],T=I.attrHandle[V]?I.attrHandle[V](Y):Y[V]!=null?Y[V]:Y.getAttribute(V),Z=T+"",X=W[2],U=W[4];return T==null?X==="!=":X==="="?Z===U:X==="*="?Z.indexOf(U)>=0:X==="~="?(" "+Z+" ").indexOf(U)>=0:!U?Z&&T!==false:X==="!="?Z!=U:X==="^="?Z.indexOf(U)===0:X==="$="?Z.substr(Z.length-U.length)===U:X==="|="?Z===U||Z.substr(0,U.length+1)===U+"-":false},POS:function(X,U,V,Y){var T=U[2],W=I.setFilters[T];if(W){return W(X,V,U,Y)}}}};var M=I.match.POS;for(var O in I.match){I.match[O]=RegExp(I.match[O].source+/(?![^\[]*\])(?![^\(]*\))/.source)}var E=function(U,T){U=Array.prototype.slice.call(U);if(T){T.push.apply(T,U);return T}return U};try{Array.prototype.slice.call(document.documentElement.childNodes)}catch(N){E=function(X,W){var U=W||[];if(H.call(X)==="[object Array]"){Array.prototype.push.apply(U,X)}else{if(typeof X.length==="number"){for(var V=0,T=X.length;V<T;V++){U.push(X[V])}}else{for(var V=0;X[V];V++){U.push(X[V])}}}return U}}var G;if(document.documentElement.compareDocumentPosition){G=function(U,T){var V=U.compareDocumentPosition(T)&4?-1:U===T?0:1;if(V===0){hasDuplicate=true}return V}}else{if("sourceIndex" in document.documentElement){G=function(U,T){var V=U.sourceIndex-T.sourceIndex;if(V===0){hasDuplicate=true}return V}}else{if(document.createRange){G=function(W,U){var V=W.ownerDocument.createRange(),T=U.ownerDocument.createRange();V.selectNode(W);V.collapse(true);T.selectNode(U);T.collapse(true);var X=V.compareBoundaryPoints(Range.START_TO_END,T);if(X===0){hasDuplicate=true}return X}}}}(function(){var U=document.createElement("form"),V="script"+(new Date).getTime();U.innerHTML="<input name='"+V+"'/>";var T=document.documentElement;T.insertBefore(U,T.firstChild);if(!!document.getElementById(V)){I.find.ID=function(X,Y,Z){if(typeof Y.getElementById!=="undefined"&&!Z){var W=Y.getElementById(X[1]);return W?W.id===X[1]||typeof W.getAttributeNode!=="undefined"&&W.getAttributeNode("id").nodeValue===X[1]?[W]:g:[]}};I.filter.ID=function(Y,W){var X=typeof Y.getAttributeNode!=="undefined"&&Y.getAttributeNode("id");return Y.nodeType===1&&X&&X.nodeValue===W}}T.removeChild(U)})();(function(){var T=document.createElement("div");T.appendChild(document.createComment(""));if(T.getElementsByTagName("*").length>0){I.find.TAG=function(U,Y){var X=Y.getElementsByTagName(U[1]);if(U[1]==="*"){var W=[];for(var V=0;X[V];V++){if(X[V].nodeType===1){W.push(X[V])}}X=W}return X}}T.innerHTML="<a href='#'></a>";if(T.firstChild&&typeof T.firstChild.getAttribute!=="undefined"&&T.firstChild.getAttribute("href")!=="#"){I.attrHandle.href=function(U){return U.getAttribute("href",2)}}})();if(document.querySelectorAll){(function(){var T=F,U=document.createElement("div");U.innerHTML="<p class='TEST'></p>";if(U.querySelectorAll&&U.querySelectorAll(".TEST").length===0){return}F=function(Y,X,V,W){X=X||document;if(!W&&X.nodeType===9&&!Q(X)){try{return E(X.querySelectorAll(Y),V)}catch(Z){}}return T(Y,X,V,W)};F.find=T.find;F.filter=T.filter;F.selectors=T.selectors;F.matches=T.matches})()}if(document.getElementsByClassName&&(-1!=document.getElementsByClassName.toString().indexOf("native code"))&&document.documentElement.getElementsByClassName){(function(){var T=document.createElement("div");T.innerHTML="<div class='test e'></div><div class='test'></div>";if(T.getElementsByClassName("e").length===0){return}T.lastChild.className="e";if(T.getElementsByClassName("e").length===1){return}I.order.splice(1,0,"CLASS");I.find.CLASS=function(U,V,W){if(typeof V.getElementsByClassName!=="undefined"&&!W){return V.getElementsByClassName(U[1])}}})()}function P(U,Z,Y,ad,aa,ac){var ab=U=="previousSibling"&&!ac;for(var W=0,V=ad.length;W<V;W++){var T=ad[W];if(T){if(ab&&T.nodeType===1){T.sizcache=Y;T.sizset=W}T=T[U];var X=false;while(T){if(T.sizcache===Y){X=ad[T.sizset];break}if(T.nodeType===1&&!ac){T.sizcache=Y;T.sizset=W}if(T.nodeName===Z){X=T;break}T=T[U]}ad[W]=X}}}function S(U,Z,Y,ad,aa,ac){var ab=U=="previousSibling"&&!ac;for(var W=0,V=ad.length;W<V;W++){var T=ad[W];if(T){if(ab&&T.nodeType===1){T.sizcache=Y;T.sizset=W}T=T[U];var X=false;while(T){if(T.sizcache===Y){X=ad[T.sizset];break}if(T.nodeType===1){if(!ac){T.sizcache=Y;T.sizset=W}if(typeof Z!=="string"){if(T===Z){X=true;break}}else{if(F.filter(Z,[T]).length>0){X=T;break}}}T=T[U]}ad[W]=X}}}var K=document.compareDocumentPosition?function(U,T){return U.compareDocumentPosition(T)&16}:function(U,T){return U!==T&&(U.contains?U.contains(T):true)};var Q=function(T){return T.nodeType===9&&T.documentElement.nodeName!=="HTML"||!!T.ownerDocument&&Q(T.ownerDocument)};var J=function(T,aa){var W=[],X="",Y,V=aa.nodeType?[aa]:aa;while((Y=I.match.PSEUDO.exec(T))){X+=Y[0];T=T.replace(I.match.PSEUDO,"")}T=I.relative[T]?T+"*":T;for(var Z=0,U=V.length;Z<U;Z++){F(T,V[Z],W)}return F.filter(X,W)};o.find=F;o.filter=F.filter;o.expr=F.selectors;o.expr[":"]=o.expr.filters;F.selectors.filters.hidden=function(T){return T.offsetWidth===0||T.offsetHeight===0};F.selectors.filters.visible=function(T){return T.offsetWidth>0||T.offsetHeight>0};F.selectors.filters.animated=function(T){return o.grep(o.timers,function(U){return T===U.elem}).length};o.multiFilter=function(V,T,U){if(U){V=":not("+V+")"}return F.matches(V,T)};o.dir=function(V,U){var T=[],W=V[U];while(W&&W!=document){if(W.nodeType==1){T.push(W)}W=W[U]}return T};o.nth=function(X,T,V,W){T=T||1;var U=0;for(;X;X=X[V]){if(X.nodeType==1&&++U==T){break}}return X};o.sibling=function(V,U){var T=[];for(;V;V=V.nextSibling){if(V.nodeType==1&&V!=U){T.push(V)}}return T};return;l.Sizzle=F})();o.event={add:function(I,F,H,K){if(I.nodeType==3||I.nodeType==8){return}if(I.setInterval&&I!=l){I=l}if(!H.guid){H.guid=this.guid++}if(K!==g){var G=H;H=this.proxy(G);H.data=K}var E=o.data(I,"events")||o.data(I,"events",{}),J=o.data(I,"handle")||o.data(I,"handle",function(){return typeof o!=="undefined"&&!o.event.triggered?o.event.handle.apply(arguments.callee.elem,arguments):g});J.elem=I;o.each(F.split(/\s+/),function(M,N){var O=N.split(".");N=O.shift();H.type=O.slice().sort().join(".");var L=E[N];if(o.event.specialAll[N]){o.event.specialAll[N].setup.call(I,K,O)}if(!L){L=E[N]={};if(!o.event.special[N]||o.event.special[N].setup.call(I,K,O)===false){if(I.addEventListener){I.addEventListener(N,J,false)}else{if(I.attachEvent){I.attachEvent("on"+N,J)}}}}L[H.guid]=H;o.event.global[N]=true});I=null},guid:1,global:{},remove:function(K,H,J){if(K.nodeType==3||K.nodeType==8){return}var G=o.data(K,"events"),F,E;if(G){if(H===g||(typeof H==="string"&&H.charAt(0)==".")){for(var I in G){this.remove(K,I+(H||""))}}else{if(H.type){J=H.handler;H=H.type}o.each(H.split(/\s+/),function(M,O){var Q=O.split(".");O=Q.shift();var N=RegExp("(^|\\.)"+Q.slice().sort().join(".*\\.")+"(\\.|$)");if(G[O]){if(J){delete G[O][J.guid]}else{for(var P in G[O]){if(N.test(G[O][P].type)){delete G[O][P]}}}if(o.event.specialAll[O]){o.event.specialAll[O].teardown.call(K,Q)}for(F in G[O]){break}if(!F){if(!o.event.special[O]||o.event.special[O].teardown.call(K,Q)===false){if(K.removeEventListener){K.removeEventListener(O,o.data(K,"handle"),false)}else{if(K.detachEvent){K.detachEvent("on"+O,o.data(K,"handle"))}}}F=null;delete G[O]}}})}for(F in G){break}if(!F){var L=o.data(K,"handle");if(L){L.elem=null}o.removeData(K,"events");o.removeData(K,"handle")}}},trigger:function(I,K,H,E){var G=I.type||I;if(!E){I=typeof I==="object"?I[h]?I:o.extend(o.Event(G),I):o.Event(G);if(G.indexOf("!")>=0){I.type=G=G.slice(0,-1);I.exclusive=true}if(!H){I.stopPropagation();if(this.global[G]){o.each(o.cache,function(){if(this.events&&this.events[G]){o.event.trigger(I,K,this.handle.elem)}})}}if(!H||H.nodeType==3||H.nodeType==8){return g}I.result=g;I.target=H;K=o.makeArray(K);K.unshift(I)}I.currentTarget=H;var J=o.data(H,"handle");if(J){J.apply(H,K)}if((!H[G]||(o.nodeName(H,"a")&&G=="click"))&&H["on"+G]&&H["on"+G].apply(H,K)===false){I.result=false}if(!E&&H[G]&&!I.isDefaultPrevented()&&!(o.nodeName(H,"a")&&G=="click")){this.triggered=true;try{H[G]()}catch(L){}}this.triggered=false;if(!I.isPropagationStopped()){var F=H.parentNode||H.ownerDocument;if(F){o.event.trigger(I,K,F,true)}}},handle:function(K){var J,E;K=arguments[0]=o.event.fix(K||l.event);K.currentTarget=this;var L=K.type.split(".");K.type=L.shift();J=!L.length&&!K.exclusive;var I=RegExp("(^|\\.)"+L.slice().sort().join(".*\\.")+"(\\.|$)");E=(o.data(this,"events")||{})[K.type];for(var G in E){var H=E[G];if(J||I.test(H.type)){K.handler=H;K.data=H.data;var F=H.apply(this,arguments);if(F!==g){K.result=F;if(F===false){K.preventDefault();K.stopPropagation()}}if(K.isImmediatePropagationStopped()){break}}}},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),fix:function(H){if(H[h]){return H}var F=H;H=o.Event(F);for(var G=this.props.length,J;G;){J=this.props[--G];H[J]=F[J]}if(!H.target){H.target=H.srcElement||document}if(H.target.nodeType==3){H.target=H.target.parentNode}if(!H.relatedTarget&&H.fromElement){H.relatedTarget=H.fromElement==H.target?H.toElement:H.fromElement}if(H.pageX==null&&H.clientX!=null){var I=document.documentElement,E=document.body;H.pageX=H.clientX+(I&&I.scrollLeft||E&&E.scrollLeft||0)-(I.clientLeft||0);H.pageY=H.clientY+(I&&I.scrollTop||E&&E.scrollTop||0)-(I.clientTop||0)}if(!H.which&&((H.charCode||H.charCode===0)?H.charCode:H.keyCode)){H.which=H.charCode||H.keyCode}if(!H.metaKey&&H.ctrlKey){H.metaKey=H.ctrlKey}if(!H.which&&H.button){H.which=(H.button&1?1:(H.button&2?3:(H.button&4?2:0)))}return H},proxy:function(F,E){E=E||function(){return F.apply(this,arguments)};E.guid=F.guid=F.guid||E.guid||this.guid++;return E},special:{ready:{setup:B,teardown:function(){}}},specialAll:{live:{setup:function(E,F){o.event.add(this,F[0],c)},teardown:function(G){if(G.length){var E=0,F=RegExp("(^|\\.)"+G[0]+"(\\.|$)");o.each((o.data(this,"events").live||{}),function(){if(F.test(this.type)){E++}});if(E<1){o.event.remove(this,G[0],c)}}}}}};o.Event=function(E){if(!this.preventDefault){return new o.Event(E)}if(E&&E.type){this.originalEvent=E;this.type=E.type}else{this.type=E}this.timeStamp=e();this[h]=true};function k(){return false}function u(){return true}o.Event.prototype={preventDefault:function(){this.isDefaultPrevented=u;var E=this.originalEvent;if(!E){return}if(E.preventDefault){E.preventDefault()}E.returnValue=false},stopPropagation:function(){this.isPropagationStopped=u;var E=this.originalEvent;if(!E){return}if(E.stopPropagation){E.stopPropagation()}E.cancelBubble=true},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=u;this.stopPropagation()},isDefaultPrevented:k,isPropagationStopped:k,isImmediatePropagationStopped:k};var a=function(F){var E=F.relatedTarget;while(E&&E!=this){try{E=E.parentNode}catch(G){E=this}}if(E!=this){F.type=F.data;o.event.handle.apply(this,arguments)}};o.each({mouseover:"mouseenter",mouseout:"mouseleave"},function(F,E){o.event.special[E]={setup:function(){o.event.add(this,F,a,E)},teardown:function(){o.event.remove(this,F,a)}}});o.fn.extend({bind:function(F,G,E){return F=="unload"?this.one(F,G,E):this.each(function(){o.event.add(this,F,E||G,E&&G)})},one:function(G,H,F){var E=o.event.proxy(F||H,function(I){o(this).unbind(I,E);return(F||H).apply(this,arguments)});return this.each(function(){o.event.add(this,G,E,F&&H)})},unbind:function(F,E){return this.each(function(){o.event.remove(this,F,E)})},trigger:function(E,F){return this.each(function(){o.event.trigger(E,F,this)})},triggerHandler:function(E,G){if(this[0]){var F=o.Event(E);F.preventDefault();F.stopPropagation();o.event.trigger(F,G,this[0]);return F.result}},toggle:function(G){var E=arguments,F=1;while(F<E.length){o.event.proxy(G,E[F++])}return this.click(o.event.proxy(G,function(H){this.lastToggle=(this.lastToggle||0)%F;H.preventDefault();return E[this.lastToggle++].apply(this,arguments)||false}))},hover:function(E,F){return this.mouseenter(E).mouseleave(F)},ready:function(E){B();if(o.isReady){E.call(document,o)}else{o.readyList.push(E)}return this},live:function(G,F){var E=o.event.proxy(F);E.guid+=this.selector+G;o(document).bind(i(G,this.selector),this.selector,E);return this},die:function(F,E){o(document).unbind(i(F,this.selector),E?{guid:E.guid+this.selector+F}:null);return this}});function c(H){var E=RegExp("(^|\\.)"+H.type+"(\\.|$)"),G=true,F=[];o.each(o.data(this,"events").live||[],function(I,J){if(E.test(J.type)){var K=o(H.target).closest(J.data)[0];if(K){F.push({elem:K,fn:J})}}});F.sort(function(J,I){return o.data(J.elem,"closest")-o.data(I.elem,"closest")});o.each(F,function(){if(this.fn.call(this.elem,H,this.fn.data)===false){return(G=false)}});return G}function i(F,E){return["live",F,E.replace(/\./g,"`").replace(/ /g,"|")].join(".")}o.extend({isReady:false,readyList:[],ready:function(){if(!o.isReady){o.isReady=true;if(o.readyList){o.each(o.readyList,function(){this.call(document,o)});o.readyList=null}o(document).triggerHandler("ready")}}});var x=false;function B(){if(x){return}x=true;if(document.addEventListener){document.addEventListener("DOMContentLoaded",function(){document.removeEventListener("DOMContentLoaded",arguments.callee,false);o.ready()},false)}else{if(document.attachEvent){document.attachEvent("onreadystatechange",function(){if(document.readyState==="complete"){document.detachEvent("onreadystatechange",arguments.callee);o.ready()}});if(document.documentElement.doScroll&&l==l.top){(function(){if(o.isReady){return}try{document.documentElement.doScroll("left")}catch(E){setTimeout(arguments.callee,0);return}o.ready()})()}}}o.event.add(l,"load",o.ready)}o.each(("blur,focus,load,resize,scroll,unload,click,dblclick,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,change,select,submit,keydown,keypress,keyup,error").split(","),function(F,E){o.fn[E]=function(G){return G?this.bind(E,G):this.trigger(E)}});o(l).bind("unload",function(){for(var E in o.cache){if(E!=1&&o.cache[E].handle){o.event.remove(o.cache[E].handle.elem)}}});(function(){o.support={};var F=document.documentElement,G=document.createElement("script"),K=document.createElement("div"),J="script"+(new Date).getTime();K.style.display="none";K.innerHTML='   <link/><table></table><a href="/a" style="color:red;float:left;opacity:.5;">a</a><select><option>text</option></select><object><param/></object>';var H=K.getElementsByTagName("*"),E=K.getElementsByTagName("a")[0];if(!H||!H.length||!E){return}o.support={leadingWhitespace:K.firstChild.nodeType==3,tbody:!K.getElementsByTagName("tbody").length,objectAll:!!K.getElementsByTagName("object")[0].getElementsByTagName("*").length,htmlSerialize:!!K.getElementsByTagName("link").length,style:/red/.test(E.getAttribute("style")),hrefNormalized:E.getAttribute("href")==="/a",opacity:E.style.opacity==="0.5",cssFloat:!!E.style.cssFloat,scriptEval:false,noCloneEvent:true,boxModel:null};G.type="text/javascript";try{G.appendChild(document.createTextNode("window."+J+"=1;"))}catch(I){}F.insertBefore(G,F.firstChild);if(l[J]){o.support.scriptEval=true;delete l[J]}F.removeChild(G);if(K.attachEvent&&K.fireEvent){K.attachEvent("onclick",function(){o.support.noCloneEvent=false;K.detachEvent("onclick",arguments.callee)});K.cloneNode(true).fireEvent("onclick")}o(function(){var L=document.createElement("div");L.style.width=L.style.paddingLeft="1px";document.body.appendChild(L);o.boxModel=o.support.boxModel=L.offsetWidth===2;document.body.removeChild(L).style.display="none"})})();var w=o.support.cssFloat?"cssFloat":"styleFloat";o.props={"for":"htmlFor","class":"className","float":w,cssFloat:w,styleFloat:w,readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",tabindex:"tabIndex"};o.fn.extend({_load:o.fn.load,load:function(G,J,K){if(typeof G!=="string"){return this._load(G)}var I=G.indexOf(" ");if(I>=0){var E=G.slice(I,G.length);G=G.slice(0,I)}var H="GET";if(J){if(o.isFunction(J)){K=J;J=null}else{if(typeof J==="object"){J=o.param(J);H="POST"}}}var F=this;o.ajax({url:G,type:H,dataType:"html",data:J,complete:function(M,L){if(L=="success"||L=="notmodified"){F.html(E?o("<div/>").append(M.responseText.replace(/<script(.|\s)*?\/script>/g,"")).find(E):M.responseText)}if(K){F.each(K,[M.responseText,L,M])}}});return this},serialize:function(){return o.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?o.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||/select|textarea/i.test(this.nodeName)||/text|hidden|password|search/i.test(this.type))}).map(function(E,F){var G=o(this).val();return G==null?null:o.isArray(G)?o.map(G,function(I,H){return{name:F.name,value:I}}):{name:F.name,value:G}}).get()}});o.each("ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend".split(","),function(E,F){o.fn[F]=function(G){return this.bind(F,G)}});var r=e();o.extend({get:function(E,G,H,F){if(o.isFunction(G)){H=G;G=null}return o.ajax({type:"GET",url:E,data:G,success:H,dataType:F})},getScript:function(E,F){return o.get(E,null,F,"script")},getJSON:function(E,F,G){return o.get(E,F,G,"json")},post:function(E,G,H,F){if(o.isFunction(G)){H=G;G={}}return o.ajax({type:"POST",url:E,data:G,success:H,dataType:F})},ajaxSetup:function(E){o.extend(o.ajaxSettings,E)},ajaxSettings:{url:location.href,global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:function(){return l.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest()},accepts:{xml:"application/xml, text/xml",html:"text/html",script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},lastModified:{},ajax:function(M){M=o.extend(true,M,o.extend(true,{},o.ajaxSettings,M));var W,F=/=\?(&|$)/g,R,V,G=M.type.toUpperCase();if(M.data&&M.processData&&typeof M.data!=="string"){M.data=o.param(M.data)}if(M.dataType=="jsonp"){if(G=="GET"){if(!M.url.match(F)){M.url+=(M.url.match(/\?/)?"&":"?")+(M.jsonp||"callback")+"=?"}}else{if(!M.data||!M.data.match(F)){M.data=(M.data?M.data+"&":"")+(M.jsonp||"callback")+"=?"}}M.dataType="json"}if(M.dataType=="json"&&(M.data&&M.data.match(F)||M.url.match(F))){W="jsonp"+r++;if(M.data){M.data=(M.data+"").replace(F,"="+W+"$1")}M.url=M.url.replace(F,"="+W+"$1");M.dataType="script";l[W]=function(X){V=X;I();L();l[W]=g;try{delete l[W]}catch(Y){}if(H){H.removeChild(T)}}}if(M.dataType=="script"&&M.cache==null){M.cache=false}if(M.cache===false&&G=="GET"){var E=e();var U=M.url.replace(/(\?|&)_=.*?(&|$)/,"$1_="+E+"$2");M.url=U+((U==M.url)?(M.url.match(/\?/)?"&":"?")+"_="+E:"")}if(M.data&&G=="GET"){M.url+=(M.url.match(/\?/)?"&":"?")+M.data;M.data=null}if(M.global&&!o.active++){o.event.trigger("ajaxStart")}var Q=/^(\w+:)?\/\/([^\/?#]+)/.exec(M.url);if(M.dataType=="script"&&G=="GET"&&Q&&(Q[1]&&Q[1]!=location.protocol||Q[2]!=location.host)){var H=document.getElementsByTagName("head")[0];var T=document.createElement("script");T.src=M.url;if(M.scriptCharset){T.charset=M.scriptCharset}if(!W){var O=false;T.onload=T.onreadystatechange=function(){if(!O&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){O=true;I();L();T.onload=T.onreadystatechange=null;H.removeChild(T)}}}H.appendChild(T);return g}var K=false;var J=M.xhr();if(M.username){J.open(G,M.url,M.async,M.username,M.password)}else{J.open(G,M.url,M.async)}try{if(M.data){J.setRequestHeader("Content-Type",M.contentType)}if(M.ifModified){J.setRequestHeader("If-Modified-Since",o.lastModified[M.url]||"Thu, 01 Jan 1970 00:00:00 GMT")}J.setRequestHeader("X-Requested-With","XMLHttpRequest");J.setRequestHeader("Accept",M.dataType&&M.accepts[M.dataType]?M.accepts[M.dataType]+", */*":M.accepts._default)}catch(S){}if(M.beforeSend&&M.beforeSend(J,M)===false){if(M.global&&!--o.active){o.event.trigger("ajaxStop")}J.abort();return false}if(M.global){o.event.trigger("ajaxSend",[J,M])}var N=function(X){if(J.readyState==0){if(P){clearInterval(P);P=null;if(M.global&&!--o.active){o.event.trigger("ajaxStop")}}}else{if(!K&&J&&(J.readyState==4||X=="timeout")){K=true;if(P){clearInterval(P);P=null}R=X=="timeout"?"timeout":!o.httpSuccess(J)?"error":M.ifModified&&o.httpNotModified(J,M.url)?"notmodified":"success";if(R=="success"){try{V=o.httpData(J,M.dataType,M)}catch(Z){R="parsererror"}}if(R=="success"){var Y;try{Y=J.getResponseHeader("Last-Modified")}catch(Z){}if(M.ifModified&&Y){o.lastModified[M.url]=Y}if(!W){I()}}else{o.handleError(M,J,R)}L();if(X){J.abort()}if(M.async){J=null}}}};if(M.async){var P=setInterval(N,13);if(M.timeout>0){setTimeout(function(){if(J&&!K){N("timeout")}},M.timeout)}}try{J.send(M.data)}catch(S){o.handleError(M,J,null,S)}if(!M.async){N()}function I(){if(M.success){M.success(V,R)}if(M.global){o.event.trigger("ajaxSuccess",[J,M])}}function L(){if(M.complete){M.complete(J,R)}if(M.global){o.event.trigger("ajaxComplete",[J,M])}if(M.global&&!--o.active){o.event.trigger("ajaxStop")}}return J},handleError:function(F,H,E,G){if(F.error){F.error(H,E,G)}if(F.global){o.event.trigger("ajaxError",[H,F,G])}},active:0,httpSuccess:function(F){try{return !F.status&&location.protocol=="file:"||(F.status>=200&&F.status<300)||F.status==304||F.status==1223}catch(E){}return false},httpNotModified:function(G,E){try{var H=G.getResponseHeader("Last-Modified");return G.status==304||H==o.lastModified[E]}catch(F){}return false},httpData:function(J,H,G){var F=J.getResponseHeader("content-type"),E=H=="xml"||!H&&F&&F.indexOf("xml")>=0,I=E?J.responseXML:J.responseText;if(E&&I.documentElement.tagName=="parsererror"){throw"parsererror"}if(G&&G.dataFilter){I=G.dataFilter(I,H)}if(typeof I==="string"){if(H=="script"){o.globalEval(I)}if(H=="json"){I=l["eval"]("("+I+")")}}return I},param:function(E){var G=[];function H(I,J){G[G.length]=encodeURIComponent(I)+"="+encodeURIComponent(J)}if(o.isArray(E)||E.jquery){o.each(E,function(){H(this.name,this.value)})}else{for(var F in E){if(o.isArray(E[F])){o.each(E[F],function(){H(F,this)})}else{H(F,o.isFunction(E[F])?E[F]():E[F])}}}return G.join("&").replace(/%20/g,"+")}});var m={},n,d=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];function t(F,E){var G={};o.each(d.concat.apply([],d.slice(0,E)),function(){G[this]=F});return G}o.fn.extend({show:function(J,L){if(J){return this.animate(t("show",3),J,L)}else{for(var H=0,F=this.length;H<F;H++){var E=o.data(this[H],"olddisplay");this[H].style.display=E||"";if(o.css(this[H],"display")==="none"){var G=this[H].tagName,K;if(m[G]){K=m[G]}else{var I=o("<"+G+" />").appendTo("body");K=I.css("display");if(K==="none"){K="block"}I.remove();m[G]=K}o.data(this[H],"olddisplay",K)}}for(var H=0,F=this.length;H<F;H++){this[H].style.display=o.data(this[H],"olddisplay")||""}return this}},hide:function(H,I){if(H){return this.animate(t("hide",3),H,I)}else{for(var G=0,F=this.length;G<F;G++){var E=o.data(this[G],"olddisplay");if(!E&&E!=="none"){o.data(this[G],"olddisplay",o.css(this[G],"display"))}}for(var G=0,F=this.length;G<F;G++){this[G].style.display="none"}return this}},_toggle:o.fn.toggle,toggle:function(G,F){var E=typeof G==="boolean";return o.isFunction(G)&&o.isFunction(F)?this._toggle.apply(this,arguments):G==null||E?this.each(function(){var H=E?G:o(this).is(":hidden");o(this)[H?"show":"hide"]()}):this.animate(t("toggle",3),G,F)},fadeTo:function(E,G,F){return this.animate({opacity:G},E,F)},animate:function(I,F,H,G){var E=o.speed(F,H,G);return this[E.queue===false?"each":"queue"](function(){var K=o.extend({},E),M,L=this.nodeType==1&&o(this).is(":hidden"),J=this;for(M in I){if(I[M]=="hide"&&L||I[M]=="show"&&!L){return K.complete.call(this)}if((M=="height"||M=="width")&&this.style){K.display=o.css(this,"display");K.overflow=this.style.overflow}}if(K.overflow!=null){this.style.overflow="hidden"}K.curAnim=o.extend({},I);o.each(I,function(O,S){var R=new o.fx(J,K,O);if(/toggle|show|hide/.test(S)){R[S=="toggle"?L?"show":"hide":S](I)}else{var Q=S.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),T=R.cur(true)||0;if(Q){var N=parseFloat(Q[2]),P=Q[3]||"px";if(P!="px"){J.style[O]=(N||1)+P;T=((N||1)/R.cur(true))*T;J.style[O]=T+P}if(Q[1]){N=((Q[1]=="-="?-1:1)*N)+T}R.custom(T,N,P)}else{R.custom(T,S,"")}}});return true})},stop:function(F,E){var G=o.timers;if(F){this.queue([])}this.each(function(){for(var H=G.length-1;H>=0;H--){if(G[H].elem==this){if(E){G[H](true)}G.splice(H,1)}}});if(!E){this.dequeue()}return this}});o.each({slideDown:t("show",1),slideUp:t("hide",1),slideToggle:t("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"}},function(E,F){o.fn[E]=function(G,H){return this.animate(F,G,H)}});o.extend({speed:function(G,H,F){var E=typeof G==="object"?G:{complete:F||!F&&H||o.isFunction(G)&&G,duration:G,easing:F&&H||H&&!o.isFunction(H)&&H};E.duration=o.fx.off?0:typeof E.duration==="number"?E.duration:o.fx.speeds[E.duration]||o.fx.speeds._default;E.old=E.complete;E.complete=function(){if(E.queue!==false){o(this).dequeue()}if(o.isFunction(E.old)){E.old.call(this)}};return E},easing:{linear:function(G,H,E,F){return E+F*G},swing:function(G,H,E,F){return((-Math.cos(G*Math.PI)/2)+0.5)*F+E}},timers:[],fx:function(F,E,G){this.options=E;this.elem=F;this.prop=G;if(!E.orig){E.orig={}}}});o.fx.prototype={update:function(){if(this.options.step){this.options.step.call(this.elem,this.now,this)}(o.fx.step[this.prop]||o.fx.step._default)(this);if((this.prop=="height"||this.prop=="width")&&this.elem.style){this.elem.style.display="block"}},cur:function(F){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null)){return this.elem[this.prop]}var E=parseFloat(o.css(this.elem,this.prop,F));return E&&E>-10000?E:parseFloat(o.curCSS(this.elem,this.prop))||0},custom:function(I,H,G){this.startTime=e();this.start=I;this.end=H;this.unit=G||this.unit||"px";this.now=this.start;this.pos=this.state=0;var E=this;function F(J){return E.step(J)}F.elem=this.elem;if(F()&&o.timers.push(F)&&!n){n=setInterval(function(){var K=o.timers;for(var J=0;J<K.length;J++){if(!K[J]()){K.splice(J--,1)}}if(!K.length){clearInterval(n);n=g}},13)}},show:function(){this.options.orig[this.prop]=o.attr(this.elem.style,this.prop);this.options.show=true;this.custom(this.prop=="width"||this.prop=="height"?1:0,this.cur());o(this.elem).show()},hide:function(){this.options.orig[this.prop]=o.attr(this.elem.style,this.prop);this.options.hide=true;this.custom(this.cur(),0)},step:function(H){var G=e();if(H||G>=this.options.duration+this.startTime){this.now=this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;var E=true;for(var F in this.options.curAnim){if(this.options.curAnim[F]!==true){E=false}}if(E){if(this.options.display!=null){this.elem.style.overflow=this.options.overflow;this.elem.style.display=this.options.display;if(o.css(this.elem,"display")=="none"){this.elem.style.display="block"}}if(this.options.hide){o(this.elem).hide()}if(this.options.hide||this.options.show){for(var I in this.options.curAnim){o.attr(this.elem.style,I,this.options.orig[I])}}this.options.complete.call(this.elem)}return false}else{var J=G-this.startTime;this.state=J/this.options.duration;this.pos=o.easing[this.options.easing||(o.easing.swing?"swing":"linear")](this.state,J,0,1,this.options.duration);this.now=this.start+((this.end-this.start)*this.pos);this.update()}return true}};o.extend(o.fx,{speeds:{slow:600,fast:200,_default:400},step:{opacity:function(E){o.attr(E.elem.style,"opacity",E.now)},_default:function(E){if(E.elem.style&&E.elem.style[E.prop]!=null){E.elem.style[E.prop]=E.now+E.unit}else{E.elem[E.prop]=E.now}}}});if(document.documentElement.getBoundingClientRect){o.fn.offset=function(){if(!this[0]){return{top:0,left:0}}if(this[0]===this[0].ownerDocument.body){return o.offset.bodyOffset(this[0])}var G=this[0].getBoundingClientRect(),J=this[0].ownerDocument,F=J.body,E=J.documentElement,L=E.clientTop||F.clientTop||0,K=E.clientLeft||F.clientLeft||0,I=G.top+(self.pageYOffset||o.boxModel&&E.scrollTop||F.scrollTop)-L,H=G.left+(self.pageXOffset||o.boxModel&&E.scrollLeft||F.scrollLeft)-K;return{top:I,left:H}}}else{o.fn.offset=function(){if(!this[0]){return{top:0,left:0}}if(this[0]===this[0].ownerDocument.body){return o.offset.bodyOffset(this[0])}o.offset.initialized||o.offset.initialize();var J=this[0],G=J.offsetParent,F=J,O=J.ownerDocument,M,H=O.documentElement,K=O.body,L=O.defaultView,E=L.getComputedStyle(J,null),N=J.offsetTop,I=J.offsetLeft;while((J=J.parentNode)&&J!==K&&J!==H){M=L.getComputedStyle(J,null);N-=J.scrollTop,I-=J.scrollLeft;if(J===G){N+=J.offsetTop,I+=J.offsetLeft;if(o.offset.doesNotAddBorder&&!(o.offset.doesAddBorderForTableAndCells&&/^t(able|d|h)$/i.test(J.tagName))){N+=parseInt(M.borderTopWidth,10)||0,I+=parseInt(M.borderLeftWidth,10)||0}F=G,G=J.offsetParent}if(o.offset.subtractsBorderForOverflowNotVisible&&M.overflow!=="visible"){N+=parseInt(M.borderTopWidth,10)||0,I+=parseInt(M.borderLeftWidth,10)||0}E=M}if(E.position==="relative"||E.position==="static"){N+=K.offsetTop,I+=K.offsetLeft}if(E.position==="fixed"){N+=Math.max(H.scrollTop,K.scrollTop),I+=Math.max(H.scrollLeft,K.scrollLeft)}return{top:N,left:I}}}o.offset={initialize:function(){if(this.initialized){return}var L=document.body,F=document.createElement("div"),H,G,N,I,M,E,J=L.style.marginTop,K='<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;" cellpadding="0" cellspacing="0"><tr><td></td></tr></table>';M={position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"};for(E in M){F.style[E]=M[E]}F.innerHTML=K;L.insertBefore(F,L.firstChild);H=F.firstChild,G=H.firstChild,I=H.nextSibling.firstChild.firstChild;this.doesNotAddBorder=(G.offsetTop!==5);this.doesAddBorderForTableAndCells=(I.offsetTop===5);H.style.overflow="hidden",H.style.position="relative";this.subtractsBorderForOverflowNotVisible=(G.offsetTop===-5);L.style.marginTop="1px";this.doesNotIncludeMarginInBodyOffset=(L.offsetTop===0);L.style.marginTop=J;L.removeChild(F);this.initialized=true},bodyOffset:function(E){o.offset.initialized||o.offset.initialize();var G=E.offsetTop,F=E.offsetLeft;if(o.offset.doesNotIncludeMarginInBodyOffset){G+=parseInt(o.curCSS(E,"marginTop",true),10)||0,F+=parseInt(o.curCSS(E,"marginLeft",true),10)||0}return{top:G,left:F}}};o.fn.extend({position:function(){var I=0,H=0,F;if(this[0]){var G=this.offsetParent(),J=this.offset(),E=/^body|html$/i.test(G[0].tagName)?{top:0,left:0}:G.offset();J.top-=j(this,"marginTop");J.left-=j(this,"marginLeft");E.top+=j(G,"borderTopWidth");E.left+=j(G,"borderLeftWidth");F={top:J.top-E.top,left:J.left-E.left}}return F},offsetParent:function(){var E=this[0].offsetParent||document.body;while(E&&(!/^body|html$/i.test(E.tagName)&&o.css(E,"position")=="static")){E=E.offsetParent}return o(E)}});o.each(["Left","Top"],function(F,E){var G="scroll"+E;o.fn[G]=function(H){if(!this[0]){return null}return H!==g?this.each(function(){this==l||this==document?l.scrollTo(!F?H:o(l).scrollLeft(),F?H:o(l).scrollTop()):this[G]=H}):this[0]==l||this[0]==document?self[F?"pageYOffset":"pageXOffset"]||o.boxModel&&document.documentElement[G]||document.body[G]:this[0][G]}});o.each(["Height","Width"],function(I,G){var E=I?"Left":"Top",H=I?"Right":"Bottom",F=G.toLowerCase();o.fn["inner"+G]=function(){return this[0]?o.css(this[0],F,false,"padding"):null};o.fn["outer"+G]=function(K){return this[0]?o.css(this[0],F,false,K?"margin":"border"):null};var J=G.toLowerCase();o.fn[J]=function(K){return this[0]==l?document.compatMode=="CSS1Compat"&&document.documentElement["client"+G]||document.body["client"+G]:this[0]==document?Math.max(document.documentElement["client"+G],document.body["scroll"+G],document.documentElement["scroll"+G],document.body["offset"+G],document.documentElement["offset"+G]):K===g?(this.length?o.css(this[0],J):null):this.css(J,typeof K==="string"?K:K+"px")}})})();
/*
 * jQuery UI 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI
 */
jQuery.ui||(function(c){var i=c.fn.remove,d=c.browser.mozilla&&(parseFloat(c.browser.version)<1.9);c.ui={version:"1.7.2",plugin:{add:function(k,l,n){var m=c.ui[k].prototype;for(var j in n){m.plugins[j]=m.plugins[j]||[];if("function"===typeof(m.plugins[j].push)){m.plugins[j].push([l,n[j]])}}},call:function(j,l,k){var n=j.plugins[l];if(!n||!j.element[0].parentNode){return}for(var m=0;m<n.length;m++){if(j.options[n[m][0]]){n[m][1].apply(j.element,k)}}}},contains:function(k,j){return document.compareDocumentPosition?k.compareDocumentPosition(j)&16:k!==j&&k.contains(j)},hasScroll:function(m,k){if(c(m).css("overflow")=="hidden"){return false}var j=(k&&k=="left")?"scrollLeft":"scrollTop",l=false;if(m[j]>0){return true}m[j]=1;l=(m[j]>0);m[j]=0;return l},isOverAxis:function(k,j,l){return(k>j)&&(k<(j+l))},isOver:function(o,k,n,m,j,l){return c.ui.isOverAxis(o,n,j)&&c.ui.isOverAxis(k,m,l)},keyCode:{BACKSPACE:8,CAPS_LOCK:20,COMMA:188,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38}};if(d){var f=c.attr,e=c.fn.removeAttr,h="http://www.w3.org/2005/07/aaa",a=/^aria-/,b=/^wairole:/;c.attr=function(k,j,l){var m=l!==undefined;return(j=="role"?(m?f.call(this,k,j,"wairole:"+l):(f.apply(this,arguments)||"").replace(b,"")):(a.test(j)?(m?k.setAttributeNS(h,j.replace(a,"aaa:"),l):f.call(this,k,j.replace(a,"aaa:"))):f.apply(this,arguments)))};c.fn.removeAttr=function(j){return(a.test(j)?this.each(function(){this.removeAttributeNS(h,j.replace(a,""))}):e.call(this,j))}}c.fn.extend({remove:function(){c("*",this).add(this).each(function(){c(this).triggerHandler("remove")});return i.apply(this,arguments)},enableSelection:function(){return this.attr("unselectable","off").css("MozUserSelect","").unbind("selectstart.ui")},disableSelection:function(){return this.attr("unselectable","on").css("MozUserSelect","none").bind("selectstart.ui",function(){return false})},scrollParent:function(){var j;if((c.browser.msie&&(/(static|relative)/).test(this.css("position")))||(/absolute/).test(this.css("position"))){j=this.parents().filter(function(){return(/(relative|absolute|fixed)/).test(c.curCSS(this,"position",1))&&(/(auto|scroll)/).test(c.curCSS(this,"overflow",1)+c.curCSS(this,"overflow-y",1)+c.curCSS(this,"overflow-x",1))}).eq(0)}else{j=this.parents().filter(function(){return(/(auto|scroll)/).test(c.curCSS(this,"overflow",1)+c.curCSS(this,"overflow-y",1)+c.curCSS(this,"overflow-x",1))}).eq(0)}return(/fixed/).test(this.css("position"))||!j.length?c(document):j}});c.extend(c.expr[":"],{data:function(l,k,j){return !!c.data(l,j[3])},focusable:function(k){var l=k.nodeName.toLowerCase(),j=c.attr(k,"tabindex");return(/input|select|textarea|button|object/.test(l)?!k.disabled:"a"==l||"area"==l?k.href||!isNaN(j):!isNaN(j))&&!c(k)["area"==l?"parents":"closest"](":hidden").length},tabbable:function(k){var j=c.attr(k,"tabindex");return(isNaN(j)||j>=0)&&c(k).is(":focusable")}});function g(m,n,o,l){function k(q){var p=c[m][n][q]||[];return(typeof p=="string"?p.split(/,?\s+/):p)}var j=k("getter");if(l.length==1&&typeof l[0]=="string"){j=j.concat(k("getterSetter"))}return(c.inArray(o,j)!=-1)}c.widget=function(k,j){var l=k.split(".")[0];k=k.split(".")[1];c.fn[k]=function(p){var n=(typeof p=="string"),o=Array.prototype.slice.call(arguments,1);if(n&&p.substring(0,1)=="_"){return this}if(n&&g(l,k,p,o)){var m=c.data(this[0],k);return(m?m[p].apply(m,o):undefined)}return this.each(function(){var q=c.data(this,k);(!q&&!n&&c.data(this,k,new c[l][k](this,p))._init());(q&&n&&c.isFunction(q[p])&&q[p].apply(q,o))})};c[l]=c[l]||{};c[l][k]=function(o,n){var m=this;this.namespace=l;this.widgetName=k;this.widgetEventPrefix=c[l][k].eventPrefix||k;this.widgetBaseClass=l+"-"+k;this.options=c.extend({},c.widget.defaults,c[l][k].defaults,c.metadata&&c.metadata.get(o)[k],n);this.element=c(o).bind("setData."+k,function(q,p,r){if(q.target==o){return m._setData(p,r)}}).bind("getData."+k,function(q,p){if(q.target==o){return m._getData(p)}}).bind("remove",function(){return m.destroy()})};c[l][k].prototype=c.extend({},c.widget.prototype,j);c[l][k].getterSetter="option"};c.widget.prototype={_init:function(){},destroy:function(){this.element.removeData(this.widgetName).removeClass(this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled").removeAttr("aria-disabled")},option:function(l,m){var k=l,j=this;if(typeof l=="string"){if(m===undefined){return this._getData(l)}k={};k[l]=m}c.each(k,function(n,o){j._setData(n,o)})},_getData:function(j){return this.options[j]},_setData:function(j,k){this.options[j]=k;if(j=="disabled"){this.element[k?"addClass":"removeClass"](this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled").attr("aria-disabled",k)}},enable:function(){this._setData("disabled",false)},disable:function(){this._setData("disabled",true)},_trigger:function(l,m,n){var p=this.options[l],j=(l==this.widgetEventPrefix?l:this.widgetEventPrefix+l);m=c.Event(m);m.type=j;if(m.originalEvent){for(var k=c.event.props.length,o;k;){o=c.event.props[--k];m[o]=m.originalEvent[o]}}this.element.trigger(m,n);return !(c.isFunction(p)&&p.call(this.element[0],m,n)===false||m.isDefaultPrevented())}};c.widget.defaults={disabled:false};c.ui.mouse={_mouseInit:function(){var j=this;this.element.bind("mousedown."+this.widgetName,function(k){return j._mouseDown(k)}).bind("click."+this.widgetName,function(k){if(j._preventClickEvent){j._preventClickEvent=false;k.stopImmediatePropagation();return false}});if(c.browser.msie){this._mouseUnselectable=this.element.attr("unselectable");this.element.attr("unselectable","on")}this.started=false},_mouseDestroy:function(){this.element.unbind("."+this.widgetName);(c.browser.msie&&this.element.attr("unselectable",this._mouseUnselectable))},_mouseDown:function(l){l.originalEvent=l.originalEvent||{};if(l.originalEvent.mouseHandled){return}(this._mouseStarted&&this._mouseUp(l));this._mouseDownEvent=l;var k=this,m=(l.which==1),j=(typeof this.options.cancel=="string"?c(l.target).parents().add(l.target).filter(this.options.cancel).length:false);if(!m||j||!this._mouseCapture(l)){return true}this.mouseDelayMet=!this.options.delay;if(!this.mouseDelayMet){this._mouseDelayTimer=setTimeout(function(){k.mouseDelayMet=true},this.options.delay)}if(this._mouseDistanceMet(l)&&this._mouseDelayMet(l)){this._mouseStarted=(this._mouseStart(l)!==false);if(!this._mouseStarted){l.preventDefault();return true}}this._mouseMoveDelegate=function(n){return k._mouseMove(n)};this._mouseUpDelegate=function(n){return k._mouseUp(n)};c(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate);(c.browser.safari||l.preventDefault());l.originalEvent.mouseHandled=true;return true},_mouseMove:function(j){if(c.browser.msie&&!j.button){return this._mouseUp(j)}if(this._mouseStarted){this._mouseDrag(j);return j.preventDefault()}if(this._mouseDistanceMet(j)&&this._mouseDelayMet(j)){this._mouseStarted=(this._mouseStart(this._mouseDownEvent,j)!==false);(this._mouseStarted?this._mouseDrag(j):this._mouseUp(j))}return !this._mouseStarted},_mouseUp:function(j){c(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate);if(this._mouseStarted){this._mouseStarted=false;this._preventClickEvent=(j.target==this._mouseDownEvent.target);this._mouseStop(j)}return false},_mouseDistanceMet:function(j){return(Math.max(Math.abs(this._mouseDownEvent.pageX-j.pageX),Math.abs(this._mouseDownEvent.pageY-j.pageY))>=this.options.distance)},_mouseDelayMet:function(j){return this.mouseDelayMet},_mouseStart:function(j){},_mouseDrag:function(j){},_mouseStop:function(j){},_mouseCapture:function(j){return true}};c.ui.mouse.defaults={cancel:null,distance:1,delay:0}})(jQuery);;
/*
 * jQuery UI Draggable 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Draggables
 *
 * Depends:
 *﻿  ui.core.js
 */
(function(a){a.widget("ui.draggable",a.extend({},a.ui.mouse,{_init:function(){if(this.options.helper=="original"&&!(/^(?:r|a|f)/).test(this.element.css("position"))){this.element[0].style.position="relative"}(this.options.addClasses&&this.element.addClass("ui-draggable"));(this.options.disabled&&this.element.addClass("ui-draggable-disabled"));this._mouseInit()},destroy:function(){if(!this.element.data("draggable")){return}this.element.removeData("draggable").unbind(".draggable").removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled");this._mouseDestroy()},_mouseCapture:function(b){var c=this.options;if(this.helper||c.disabled||a(b.target).is(".ui-resizable-handle")){return false}this.handle=this._getHandle(b);if(!this.handle){return false}return true},_mouseStart:function(b){var c=this.options;this.helper=this._createHelper(b);this._cacheHelperProportions();if(a.ui.ddmanager){a.ui.ddmanager.current=this}this._cacheMargins();this.cssPosition=this.helper.css("position");this.scrollParent=this.helper.scrollParent();this.offset=this.element.offset();this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left};a.extend(this.offset,{click:{left:b.pageX-this.offset.left,top:b.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()});this.originalPosition=this._generatePosition(b);this.originalPageX=b.pageX;this.originalPageY=b.pageY;if(c.cursorAt){this._adjustOffsetFromHelper(c.cursorAt)}if(c.containment){this._setContainment()}this._trigger("start",b);this._cacheHelperProportions();if(a.ui.ddmanager&&!c.dropBehaviour){a.ui.ddmanager.prepareOffsets(this,b)}this.helper.addClass("ui-draggable-dragging");this._mouseDrag(b,true);return true},_mouseDrag:function(b,d){this.position=this._generatePosition(b);this.positionAbs=this._convertPositionTo("absolute");if(!d){var c=this._uiHash();this._trigger("drag",b,c);this.position=c.position}if(!this.options.axis||this.options.axis!="y"){this.helper[0].style.left=this.position.left+"px"}if(!this.options.axis||this.options.axis!="x"){this.helper[0].style.top=this.position.top+"px"}if(a.ui.ddmanager){a.ui.ddmanager.drag(this,b)}return false},_mouseStop:function(c){var d=false;if(a.ui.ddmanager&&!this.options.dropBehaviour){d=a.ui.ddmanager.drop(this,c)}if(this.dropped){d=this.dropped;this.dropped=false}if((this.options.revert=="invalid"&&!d)||(this.options.revert=="valid"&&d)||this.options.revert===true||(a.isFunction(this.options.revert)&&this.options.revert.call(this.element,d))){var b=this;a(this.helper).animate(this.originalPosition,parseInt(this.options.revertDuration,10),function(){b._trigger("stop",c);b._clear()})}else{this._trigger("stop",c);this._clear()}return false},_getHandle:function(b){var c=!this.options.handle||!a(this.options.handle,this.element).length?true:false;a(this.options.handle,this.element).find("*").andSelf().each(function(){if(this==b.target){c=true}});return c},_createHelper:function(c){var d=this.options;var b=a.isFunction(d.helper)?a(d.helper.apply(this.element[0],[c])):(d.helper=="clone"?this.element.clone():this.element);if(!b.parents("body").length){b.appendTo((d.appendTo=="parent"?this.element[0].parentNode:d.appendTo))}if(b[0]!=this.element[0]&&!(/(fixed|absolute)/).test(b.css("position"))){b.css("position","absolute")}return b},_adjustOffsetFromHelper:function(b){if(b.left!=undefined){this.offset.click.left=b.left+this.margins.left}if(b.right!=undefined){this.offset.click.left=this.helperProportions.width-b.right+this.margins.left}if(b.top!=undefined){this.offset.click.top=b.top+this.margins.top}if(b.bottom!=undefined){this.offset.click.top=this.helperProportions.height-b.bottom+this.margins.top}},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var b=this.offsetParent.offset();if(this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0])){b.left+=this.scrollParent.scrollLeft();b.top+=this.scrollParent.scrollTop()}if((this.offsetParent[0]==document.body)||(this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&a.browser.msie)){b={top:0,left:0}}return{top:b.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:b.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var b=this.element.position();return{top:b.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:b.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}else{return{top:0,left:0}}},_cacheMargins:function(){this.margins={left:(parseInt(this.element.css("marginLeft"),10)||0),top:(parseInt(this.element.css("marginTop"),10)||0)}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var e=this.options;if(e.containment=="parent"){e.containment=this.helper[0].parentNode}if(e.containment=="document"||e.containment=="window"){this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,a(e.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(a(e.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]}if(!(/^(document|window|parent)$/).test(e.containment)&&e.containment.constructor!=Array){var c=a(e.containment)[0];if(!c){return}var d=a(e.containment).offset();var b=(a(c).css("overflow")!="hidden");this.containment=[d.left+(parseInt(a(c).css("borderLeftWidth"),10)||0)+(parseInt(a(c).css("paddingLeft"),10)||0)-this.margins.left,d.top+(parseInt(a(c).css("borderTopWidth"),10)||0)+(parseInt(a(c).css("paddingTop"),10)||0)-this.margins.top,d.left+(b?Math.max(c.scrollWidth,c.offsetWidth):c.offsetWidth)-(parseInt(a(c).css("borderLeftWidth"),10)||0)-(parseInt(a(c).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,d.top+(b?Math.max(c.scrollHeight,c.offsetHeight):c.offsetHeight)-(parseInt(a(c).css("borderTopWidth"),10)||0)-(parseInt(a(c).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top]}else{if(e.containment.constructor==Array){this.containment=e.containment}}},_convertPositionTo:function(f,h){if(!h){h=this.position}var c=f=="absolute"?1:-1;var e=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,g=(/(html|body)/i).test(b[0].tagName);return{top:(h.top+this.offset.relative.top*c+this.offset.parent.top*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(g?0:b.scrollTop()))*c)),left:(h.left+this.offset.relative.left*c+this.offset.parent.left*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():g?0:b.scrollLeft())*c))}},_generatePosition:function(e){var h=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,i=(/(html|body)/i).test(b[0].tagName);if(this.cssPosition=="relative"&&!(this.scrollParent[0]!=document&&this.scrollParent[0]!=this.offsetParent[0])){this.offset.relative=this._getRelativeOffset()}var d=e.pageX;var c=e.pageY;if(this.originalPosition){if(this.containment){if(e.pageX-this.offset.click.left<this.containment[0]){d=this.containment[0]+this.offset.click.left}if(e.pageY-this.offset.click.top<this.containment[1]){c=this.containment[1]+this.offset.click.top}if(e.pageX-this.offset.click.left>this.containment[2]){d=this.containment[2]+this.offset.click.left}if(e.pageY-this.offset.click.top>this.containment[3]){c=this.containment[3]+this.offset.click.top}}if(h.grid){var g=this.originalPageY+Math.round((c-this.originalPageY)/h.grid[1])*h.grid[1];c=this.containment?(!(g-this.offset.click.top<this.containment[1]||g-this.offset.click.top>this.containment[3])?g:(!(g-this.offset.click.top<this.containment[1])?g-h.grid[1]:g+h.grid[1])):g;var f=this.originalPageX+Math.round((d-this.originalPageX)/h.grid[0])*h.grid[0];d=this.containment?(!(f-this.offset.click.left<this.containment[0]||f-this.offset.click.left>this.containment[2])?f:(!(f-this.offset.click.left<this.containment[0])?f-h.grid[0]:f+h.grid[0])):f}}return{top:(c-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(i?0:b.scrollTop())))),left:(d-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():i?0:b.scrollLeft())))}},_clear:function(){this.helper.removeClass("ui-draggable-dragging");if(this.helper[0]!=this.element[0]&&!this.cancelHelperRemoval){this.helper.remove()}this.helper=null;this.cancelHelperRemoval=false},_trigger:function(b,c,d){d=d||this._uiHash();a.ui.plugin.call(this,b,[c,d]);if(b=="drag"){this.positionAbs=this._convertPositionTo("absolute")}return a.widget.prototype._trigger.call(this,b,c,d)},plugins:{},_uiHash:function(b){return{helper:this.helper,position:this.position,absolutePosition:this.positionAbs,offset:this.positionAbs}}}));a.extend(a.ui.draggable,{version:"1.7.2",eventPrefix:"drag",defaults:{addClasses:true,appendTo:"parent",axis:false,cancel:":input,option",connectToSortable:false,containment:false,cursor:"auto",cursorAt:false,delay:0,distance:1,grid:false,handle:false,helper:"original",iframeFix:false,opacity:false,refreshPositions:false,revert:false,revertDuration:500,scope:"default",scroll:true,scrollSensitivity:20,scrollSpeed:20,snap:false,snapMode:"both",snapTolerance:20,stack:false,zIndex:false}});a.ui.plugin.add("draggable","connectToSortable",{start:function(c,e){var d=a(this).data("draggable"),f=d.options,b=a.extend({},e,{item:d.element});d.sortables=[];a(f.connectToSortable).each(function(){var g=a.data(this,"sortable");if(g&&!g.options.disabled){d.sortables.push({instance:g,shouldRevert:g.options.revert});g._refreshItems();g._trigger("activate",c,b)}})},stop:function(c,e){var d=a(this).data("draggable"),b=a.extend({},e,{item:d.element});a.each(d.sortables,function(){if(this.instance.isOver){this.instance.isOver=0;d.cancelHelperRemoval=true;this.instance.cancelHelperRemoval=false;if(this.shouldRevert){this.instance.options.revert=true}this.instance._mouseStop(c);this.instance.options.helper=this.instance.options._helper;if(d.options.helper=="original"){this.instance.currentItem.css({top:"auto",left:"auto"})}}else{this.instance.cancelHelperRemoval=false;this.instance._trigger("deactivate",c,b)}})},drag:function(c,f){var e=a(this).data("draggable"),b=this;var d=function(i){var n=this.offset.click.top,m=this.offset.click.left;var g=this.positionAbs.top,k=this.positionAbs.left;var j=i.height,l=i.width;var p=i.top,h=i.left;return a.ui.isOver(g+n,k+m,p,h,j,l)};a.each(e.sortables,function(g){this.instance.positionAbs=e.positionAbs;this.instance.helperProportions=e.helperProportions;this.instance.offset.click=e.offset.click;if(this.instance._intersectsWith(this.instance.containerCache)){if(!this.instance.isOver){this.instance.isOver=1;this.instance.currentItem=a(b).clone().appendTo(this.instance.element).data("sortable-item",true);this.instance.options._helper=this.instance.options.helper;this.instance.options.helper=function(){return f.helper[0]};c.target=this.instance.currentItem[0];this.instance._mouseCapture(c,true);this.instance._mouseStart(c,true,true);this.instance.offset.click.top=e.offset.click.top;this.instance.offset.click.left=e.offset.click.left;this.instance.offset.parent.left-=e.offset.parent.left-this.instance.offset.parent.left;this.instance.offset.parent.top-=e.offset.parent.top-this.instance.offset.parent.top;e._trigger("toSortable",c);e.dropped=this.instance.element;e.currentItem=e.element;this.instance.fromOutside=e}if(this.instance.currentItem){this.instance._mouseDrag(c)}}else{if(this.instance.isOver){this.instance.isOver=0;this.instance.cancelHelperRemoval=true;this.instance.options.revert=false;this.instance._trigger("out",c,this.instance._uiHash(this.instance));this.instance._mouseStop(c,true);this.instance.options.helper=this.instance.options._helper;this.instance.currentItem.remove();if(this.instance.placeholder){this.instance.placeholder.remove()}e._trigger("fromSortable",c);e.dropped=false}}})}});a.ui.plugin.add("draggable","cursor",{start:function(c,d){var b=a("body"),e=a(this).data("draggable").options;if(b.css("cursor")){e._cursor=b.css("cursor")}b.css("cursor",e.cursor)},stop:function(b,c){var d=a(this).data("draggable").options;if(d._cursor){a("body").css("cursor",d._cursor)}}});a.ui.plugin.add("draggable","iframeFix",{start:function(b,c){var d=a(this).data("draggable").options;a(d.iframeFix===true?"iframe":d.iframeFix).each(function(){a('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').css({width:this.offsetWidth+"px",height:this.offsetHeight+"px",position:"absolute",opacity:"0.001",zIndex:1000}).css(a(this).offset()).appendTo("body")})},stop:function(b,c){a("div.ui-draggable-iframeFix").each(function(){this.parentNode.removeChild(this)})}});a.ui.plugin.add("draggable","opacity",{start:function(c,d){var b=a(d.helper),e=a(this).data("draggable").options;if(b.css("opacity")){e._opacity=b.css("opacity")}b.css("opacity",e.opacity)},stop:function(b,c){var d=a(this).data("draggable").options;if(d._opacity){a(c.helper).css("opacity",d._opacity)}}});a.ui.plugin.add("draggable","scroll",{start:function(c,d){var b=a(this).data("draggable");if(b.scrollParent[0]!=document&&b.scrollParent[0].tagName!="HTML"){b.overflowOffset=b.scrollParent.offset()}},drag:function(d,e){var c=a(this).data("draggable"),f=c.options,b=false;if(c.scrollParent[0]!=document&&c.scrollParent[0].tagName!="HTML"){if(!f.axis||f.axis!="x"){if((c.overflowOffset.top+c.scrollParent[0].offsetHeight)-d.pageY<f.scrollSensitivity){c.scrollParent[0].scrollTop=b=c.scrollParent[0].scrollTop+f.scrollSpeed}else{if(d.pageY-c.overflowOffset.top<f.scrollSensitivity){c.scrollParent[0].scrollTop=b=c.scrollParent[0].scrollTop-f.scrollSpeed}}}if(!f.axis||f.axis!="y"){if((c.overflowOffset.left+c.scrollParent[0].offsetWidth)-d.pageX<f.scrollSensitivity){c.scrollParent[0].scrollLeft=b=c.scrollParent[0].scrollLeft+f.scrollSpeed}else{if(d.pageX-c.overflowOffset.left<f.scrollSensitivity){c.scrollParent[0].scrollLeft=b=c.scrollParent[0].scrollLeft-f.scrollSpeed}}}}else{if(!f.axis||f.axis!="x"){if(d.pageY-a(document).scrollTop()<f.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()-f.scrollSpeed)}else{if(a(window).height()-(d.pageY-a(document).scrollTop())<f.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()+f.scrollSpeed)}}}if(!f.axis||f.axis!="y"){if(d.pageX-a(document).scrollLeft()<f.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()-f.scrollSpeed)}else{if(a(window).width()-(d.pageX-a(document).scrollLeft())<f.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()+f.scrollSpeed)}}}}if(b!==false&&a.ui.ddmanager&&!f.dropBehaviour){a.ui.ddmanager.prepareOffsets(c,d)}}});a.ui.plugin.add("draggable","snap",{start:function(c,d){var b=a(this).data("draggable"),e=b.options;b.snapElements=[];a(e.snap.constructor!=String?(e.snap.items||":data(draggable)"):e.snap).each(function(){var g=a(this);var f=g.offset();if(this!=b.element[0]){b.snapElements.push({item:this,width:g.outerWidth(),height:g.outerHeight(),top:f.top,left:f.left})}})},drag:function(u,p){var g=a(this).data("draggable"),q=g.options;var y=q.snapTolerance;var x=p.offset.left,w=x+g.helperProportions.width,f=p.offset.top,e=f+g.helperProportions.height;for(var v=g.snapElements.length-1;v>=0;v--){var s=g.snapElements[v].left,n=s+g.snapElements[v].width,m=g.snapElements[v].top,A=m+g.snapElements[v].height;if(!((s-y<x&&x<n+y&&m-y<f&&f<A+y)||(s-y<x&&x<n+y&&m-y<e&&e<A+y)||(s-y<w&&w<n+y&&m-y<f&&f<A+y)||(s-y<w&&w<n+y&&m-y<e&&e<A+y))){if(g.snapElements[v].snapping){(g.options.snap.release&&g.options.snap.release.call(g.element,u,a.extend(g._uiHash(),{snapItem:g.snapElements[v].item})))}g.snapElements[v].snapping=false;continue}if(q.snapMode!="inner"){var c=Math.abs(m-e)<=y;var z=Math.abs(A-f)<=y;var j=Math.abs(s-w)<=y;var k=Math.abs(n-x)<=y;if(c){p.position.top=g._convertPositionTo("relative",{top:m-g.helperProportions.height,left:0}).top-g.margins.top}if(z){p.position.top=g._convertPositionTo("relative",{top:A,left:0}).top-g.margins.top}if(j){p.position.left=g._convertPositionTo("relative",{top:0,left:s-g.helperProportions.width}).left-g.margins.left}if(k){p.position.left=g._convertPositionTo("relative",{top:0,left:n}).left-g.margins.left}}var h=(c||z||j||k);if(q.snapMode!="outer"){var c=Math.abs(m-f)<=y;var z=Math.abs(A-e)<=y;var j=Math.abs(s-x)<=y;var k=Math.abs(n-w)<=y;if(c){p.position.top=g._convertPositionTo("relative",{top:m,left:0}).top-g.margins.top}if(z){p.position.top=g._convertPositionTo("relative",{top:A-g.helperProportions.height,left:0}).top-g.margins.top}if(j){p.position.left=g._convertPositionTo("relative",{top:0,left:s}).left-g.margins.left}if(k){p.position.left=g._convertPositionTo("relative",{top:0,left:n-g.helperProportions.width}).left-g.margins.left}}if(!g.snapElements[v].snapping&&(c||z||j||k||h)){(g.options.snap.snap&&g.options.snap.snap.call(g.element,u,a.extend(g._uiHash(),{snapItem:g.snapElements[v].item})))}g.snapElements[v].snapping=(c||z||j||k||h)}}});a.ui.plugin.add("draggable","stack",{start:function(b,c){var e=a(this).data("draggable").options;var d=a.makeArray(a(e.stack.group)).sort(function(g,f){return(parseInt(a(g).css("zIndex"),10)||e.stack.min)-(parseInt(a(f).css("zIndex"),10)||e.stack.min)});a(d).each(function(f){this.style.zIndex=e.stack.min+f});this[0].style.zIndex=e.stack.min+d.length}});a.ui.plugin.add("draggable","zIndex",{start:function(c,d){var b=a(d.helper),e=a(this).data("draggable").options;if(b.css("zIndex")){e._zIndex=b.css("zIndex")}b.css("zIndex",e.zIndex)},stop:function(b,c){var d=a(this).data("draggable").options;if(d._zIndex){a(c.helper).css("zIndex",d._zIndex)}}})})(jQuery);;
/*
 * jQuery UI Sortable 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Sortables
 *
 * Depends:
 *﻿  ui.core.js
 */
(function(a){a.widget("ui.sortable",a.extend({},a.ui.mouse,{_init:function(){var b=this.options;this.containerCache={};this.element.addClass("ui-sortable");this.refresh();this.floating=this.items.length?(/left|right/).test(this.items[0].item.css("float")):false;this.offset=this.element.offset();this._mouseInit()},destroy:function(){this.element.removeClass("ui-sortable ui-sortable-disabled").removeData("sortable").unbind(".sortable");this._mouseDestroy();for(var b=this.items.length-1;b>=0;b--){this.items[b].item.removeData("sortable-item")}},_mouseCapture:function(e,f){if(this.reverting){return false}if(this.options.disabled||this.options.type=="static"){return false}this._refreshItems(e);var d=null,c=this,b=a(e.target).parents().each(function(){if(a.data(this,"sortable-item")==c){d=a(this);return false}});if(a.data(e.target,"sortable-item")==c){d=a(e.target)}if(!d){return false}if(this.options.handle&&!f){var g=false;a(this.options.handle,d).find("*").andSelf().each(function(){if(this==e.target){g=true}});if(!g){return false}}this.currentItem=d;this._removeCurrentsFromItems();return true},_mouseStart:function(e,f,b){var g=this.options,c=this;this.currentContainer=this;this.refreshPositions();this.helper=this._createHelper(e);this._cacheHelperProportions();this._cacheMargins();this.scrollParent=this.helper.scrollParent();this.offset=this.currentItem.offset();this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left};this.helper.css("position","absolute");this.cssPosition=this.helper.css("position");a.extend(this.offset,{click:{left:e.pageX-this.offset.left,top:e.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()});this.originalPosition=this._generatePosition(e);this.originalPageX=e.pageX;this.originalPageY=e.pageY;if(g.cursorAt){this._adjustOffsetFromHelper(g.cursorAt)}this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]};if(this.helper[0]!=this.currentItem[0]){this.currentItem.hide()}this._createPlaceholder();if(g.containment){this._setContainment()}if(g.cursor){if(a("body").css("cursor")){this._storedCursor=a("body").css("cursor")}a("body").css("cursor",g.cursor)}if(g.opacity){if(this.helper.css("opacity")){this._storedOpacity=this.helper.css("opacity")}this.helper.css("opacity",g.opacity)}if(g.zIndex){if(this.helper.css("zIndex")){this._storedZIndex=this.helper.css("zIndex")}this.helper.css("zIndex",g.zIndex)}if(this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"){this.overflowOffset=this.scrollParent.offset()}this._trigger("start",e,this._uiHash());if(!this._preserveHelperProportions){this._cacheHelperProportions()}if(!b){for(var d=this.containers.length-1;d>=0;d--){this.containers[d]._trigger("activate",e,c._uiHash(this))}}if(a.ui.ddmanager){a.ui.ddmanager.current=this}if(a.ui.ddmanager&&!g.dropBehaviour){a.ui.ddmanager.prepareOffsets(this,e)}this.dragging=true;this.helper.addClass("ui-sortable-helper");this._mouseDrag(e);return true},_mouseDrag:function(f){this.position=this._generatePosition(f);this.positionAbs=this._convertPositionTo("absolute");if(!this.lastPositionAbs){this.lastPositionAbs=this.positionAbs}if(this.options.scroll){var g=this.options,b=false;if(this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"){if((this.overflowOffset.top+this.scrollParent[0].offsetHeight)-f.pageY<g.scrollSensitivity){this.scrollParent[0].scrollTop=b=this.scrollParent[0].scrollTop+g.scrollSpeed}else{if(f.pageY-this.overflowOffset.top<g.scrollSensitivity){this.scrollParent[0].scrollTop=b=this.scrollParent[0].scrollTop-g.scrollSpeed}}if((this.overflowOffset.left+this.scrollParent[0].offsetWidth)-f.pageX<g.scrollSensitivity){this.scrollParent[0].scrollLeft=b=this.scrollParent[0].scrollLeft+g.scrollSpeed}else{if(f.pageX-this.overflowOffset.left<g.scrollSensitivity){this.scrollParent[0].scrollLeft=b=this.scrollParent[0].scrollLeft-g.scrollSpeed}}}else{if(f.pageY-a(document).scrollTop()<g.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()-g.scrollSpeed)}else{if(a(window).height()-(f.pageY-a(document).scrollTop())<g.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()+g.scrollSpeed)}}if(f.pageX-a(document).scrollLeft()<g.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()-g.scrollSpeed)}else{if(a(window).width()-(f.pageX-a(document).scrollLeft())<g.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()+g.scrollSpeed)}}}if(b!==false&&a.ui.ddmanager&&!g.dropBehaviour){a.ui.ddmanager.prepareOffsets(this,f)}}this.positionAbs=this._convertPositionTo("absolute");if(!this.options.axis||this.options.axis!="y"){this.helper[0].style.left=this.position.left+"px"}if(!this.options.axis||this.options.axis!="x"){this.helper[0].style.top=this.position.top+"px"}for(var d=this.items.length-1;d>=0;d--){var e=this.items[d],c=e.item[0],h=this._intersectsWithPointer(e);if(!h){continue}if(c!=this.currentItem[0]&&this.placeholder[h==1?"next":"prev"]()[0]!=c&&!a.ui.contains(this.placeholder[0],c)&&(this.options.type=="semi-dynamic"?!a.ui.contains(this.element[0],c):true)){this.direction=h==1?"down":"up";if(this.options.tolerance=="pointer"||this._intersectsWithSides(e)){this._rearrange(f,e)}else{break}this._trigger("change",f,this._uiHash());break}}this._contactContainers(f);if(a.ui.ddmanager){a.ui.ddmanager.drag(this,f)}this._trigger("sort",f,this._uiHash());this.lastPositionAbs=this.positionAbs;return false},_mouseStop:function(c,d){if(!c){return}if(a.ui.ddmanager&&!this.options.dropBehaviour){a.ui.ddmanager.drop(this,c)}if(this.options.revert){var b=this;var e=b.placeholder.offset();b.reverting=true;a(this.helper).animate({left:e.left-this.offset.parent.left-b.margins.left+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollLeft),top:e.top-this.offset.parent.top-b.margins.top+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollTop)},parseInt(this.options.revert,10)||500,function(){b._clear(c)})}else{this._clear(c,d)}return false},cancel:function(){var b=this;if(this.dragging){this._mouseUp();if(this.options.helper=="original"){this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else{this.currentItem.show()}for(var c=this.containers.length-1;c>=0;c--){this.containers[c]._trigger("deactivate",null,b._uiHash(this));if(this.containers[c].containerCache.over){this.containers[c]._trigger("out",null,b._uiHash(this));this.containers[c].containerCache.over=0}}}if(this.placeholder[0].parentNode){this.placeholder[0].parentNode.removeChild(this.placeholder[0])}if(this.options.helper!="original"&&this.helper&&this.helper[0].parentNode){this.helper.remove()}a.extend(this,{helper:null,dragging:false,reverting:false,_noFinalSort:null});if(this.domPosition.prev){a(this.domPosition.prev).after(this.currentItem)}else{a(this.domPosition.parent).prepend(this.currentItem)}return true},serialize:function(d){var b=this._getItemsAsjQuery(d&&d.connected);var c=[];d=d||{};a(b).each(function(){var e=(a(d.item||this).attr(d.attribute||"id")||"").match(d.expression||(/(.+)[-=_](.+)/));if(e){c.push((d.key||e[1]+"[]")+"="+(d.key&&d.expression?e[1]:e[2]))}});return c.join("&")},toArray:function(d){var b=this._getItemsAsjQuery(d&&d.connected);var c=[];d=d||{};b.each(function(){c.push(a(d.item||this).attr(d.attribute||"id")||"")});return c},_intersectsWith:function(m){var e=this.positionAbs.left,d=e+this.helperProportions.width,k=this.positionAbs.top,j=k+this.helperProportions.height;var f=m.left,c=f+m.width,n=m.top,i=n+m.height;var o=this.offset.click.top,h=this.offset.click.left;var g=(k+o)>n&&(k+o)<i&&(e+h)>f&&(e+h)<c;if(this.options.tolerance=="pointer"||this.options.forcePointerForContainers||(this.options.tolerance!="pointer"&&this.helperProportions[this.floating?"width":"height"]>m[this.floating?"width":"height"])){return g}else{return(f<e+(this.helperProportions.width/2)&&d-(this.helperProportions.width/2)<c&&n<k+(this.helperProportions.height/2)&&j-(this.helperProportions.height/2)<i)}},_intersectsWithPointer:function(d){var e=a.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,d.top,d.height),c=a.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,d.left,d.width),g=e&&c,b=this._getDragVerticalDirection(),f=this._getDragHorizontalDirection();if(!g){return false}return this.floating?(((f&&f=="right")||b=="down")?2:1):(b&&(b=="down"?2:1))},_intersectsWithSides:function(e){var c=a.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,e.top+(e.height/2),e.height),d=a.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,e.left+(e.width/2),e.width),b=this._getDragVerticalDirection(),f=this._getDragHorizontalDirection();if(this.floating&&f){return((f=="right"&&d)||(f=="left"&&!d))}else{return b&&((b=="down"&&c)||(b=="up"&&!c))}},_getDragVerticalDirection:function(){var b=this.positionAbs.top-this.lastPositionAbs.top;return b!=0&&(b>0?"down":"up")},_getDragHorizontalDirection:function(){var b=this.positionAbs.left-this.lastPositionAbs.left;return b!=0&&(b>0?"right":"left")},refresh:function(b){this._refreshItems(b);this.refreshPositions()},_connectWith:function(){var b=this.options;return b.connectWith.constructor==String?[b.connectWith]:b.connectWith},_getItemsAsjQuery:function(b){var l=this;var g=[];var e=[];var h=this._connectWith();if(h&&b){for(var d=h.length-1;d>=0;d--){var k=a(h[d]);for(var c=k.length-1;c>=0;c--){var f=a.data(k[c],"sortable");if(f&&f!=this&&!f.options.disabled){e.push([a.isFunction(f.options.items)?f.options.items.call(f.element):a(f.options.items,f.element).not(".ui-sortable-helper"),f])}}}}e.push([a.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):a(this.options.items,this.element).not(".ui-sortable-helper"),this]);for(var d=e.length-1;d>=0;d--){e[d][0].each(function(){g.push(this)})}return a(g)},_removeCurrentsFromItems:function(){var d=this.currentItem.find(":data(sortable-item)");for(var c=0;c<this.items.length;c++){for(var b=0;b<d.length;b++){if(d[b]==this.items[c].item[0]){this.items.splice(c,1)}}}},_refreshItems:function(b){this.items=[];this.containers=[this];var h=this.items;var p=this;var f=[[a.isFunction(this.options.items)?this.options.items.call(this.element[0],b,{item:this.currentItem}):a(this.options.items,this.element),this]];var l=this._connectWith();if(l){for(var e=l.length-1;e>=0;e--){var m=a(l[e]);for(var d=m.length-1;d>=0;d--){var g=a.data(m[d],"sortable");if(g&&g!=this&&!g.options.disabled){f.push([a.isFunction(g.options.items)?g.options.items.call(g.element[0],b,{item:this.currentItem}):a(g.options.items,g.element),g]);this.containers.push(g)}}}}for(var e=f.length-1;e>=0;e--){var k=f[e][1];var c=f[e][0];for(var d=0,n=c.length;d<n;d++){var o=a(c[d]);o.data("sortable-item",k);h.push({item:o,instance:k,width:0,height:0,left:0,top:0})}}},refreshPositions:function(b){if(this.offsetParent&&this.helper){this.offset.parent=this._getParentOffset()}for(var d=this.items.length-1;d>=0;d--){var e=this.items[d];if(e.instance!=this.currentContainer&&this.currentContainer&&e.item[0]!=this.currentItem[0]){continue}var c=this.options.toleranceElement?a(this.options.toleranceElement,e.item):e.item;if(!b){e.width=c.outerWidth();e.height=c.outerHeight()}var f=c.offset();e.left=f.left;e.top=f.top}if(this.options.custom&&this.options.custom.refreshContainers){this.options.custom.refreshContainers.call(this)}else{for(var d=this.containers.length-1;d>=0;d--){var f=this.containers[d].element.offset();this.containers[d].containerCache.left=f.left;this.containers[d].containerCache.top=f.top;this.containers[d].containerCache.width=this.containers[d].element.outerWidth();this.containers[d].containerCache.height=this.containers[d].element.outerHeight()}}},_createPlaceholder:function(d){var b=d||this,e=b.options;if(!e.placeholder||e.placeholder.constructor==String){var c=e.placeholder;e.placeholder={element:function(){var f=a(document.createElement(b.currentItem[0].nodeName)).addClass(c||b.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper")[0];if(!c){f.style.visibility="hidden"}return f},update:function(f,g){if(c&&!e.forcePlaceholderSize){return}if(!g.height()){g.height(b.currentItem.innerHeight()-parseInt(b.currentItem.css("paddingTop")||0,10)-parseInt(b.currentItem.css("paddingBottom")||0,10))}if(!g.width()){g.width(b.currentItem.innerWidth()-parseInt(b.currentItem.css("paddingLeft")||0,10)-parseInt(b.currentItem.css("paddingRight")||0,10))}}}}b.placeholder=a(e.placeholder.element.call(b.element,b.currentItem));b.currentItem.after(b.placeholder);e.placeholder.update(b,b.placeholder)},_contactContainers:function(d){for(var c=this.containers.length-1;c>=0;c--){if(this._intersectsWith(this.containers[c].containerCache)){if(!this.containers[c].containerCache.over){if(this.currentContainer!=this.containers[c]){var h=10000;var g=null;var e=this.positionAbs[this.containers[c].floating?"left":"top"];for(var b=this.items.length-1;b>=0;b--){if(!a.ui.contains(this.containers[c].element[0],this.items[b].item[0])){continue}var f=this.items[b][this.containers[c].floating?"left":"top"];if(Math.abs(f-e)<h){h=Math.abs(f-e);g=this.items[b]}}if(!g&&!this.options.dropOnEmpty){continue}this.currentContainer=this.containers[c];g?this._rearrange(d,g,null,true):this._rearrange(d,null,this.containers[c].element,true);this._trigger("change",d,this._uiHash());this.containers[c]._trigger("change",d,this._uiHash(this));this.options.placeholder.update(this.currentContainer,this.placeholder)}this.containers[c]._trigger("over",d,this._uiHash(this));this.containers[c].containerCache.over=1}}else{if(this.containers[c].containerCache.over){this.containers[c]._trigger("out",d,this._uiHash(this));this.containers[c].containerCache.over=0}}}},_createHelper:function(c){var d=this.options;var b=a.isFunction(d.helper)?a(d.helper.apply(this.element[0],[c,this.currentItem])):(d.helper=="clone"?this.currentItem.clone():this.currentItem);if(!b.parents("body").length){a(d.appendTo!="parent"?d.appendTo:this.currentItem[0].parentNode)[0].appendChild(b[0])}if(b[0]==this.currentItem[0]){this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}}if(b[0].style.width==""||d.forceHelperSize){b.width(this.currentItem.width())}if(b[0].style.height==""||d.forceHelperSize){b.height(this.currentItem.height())}return b},_adjustOffsetFromHelper:function(b){if(b.left!=undefined){this.offset.click.left=b.left+this.margins.left}if(b.right!=undefined){this.offset.click.left=this.helperProportions.width-b.right+this.margins.left}if(b.top!=undefined){this.offset.click.top=b.top+this.margins.top}if(b.bottom!=undefined){this.offset.click.top=this.helperProportions.height-b.bottom+this.margins.top}},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var b=this.offsetParent.offset();if(this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0])){b.left+=this.scrollParent.scrollLeft();b.top+=this.scrollParent.scrollTop()}if((this.offsetParent[0]==document.body)||(this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&a.browser.msie)){b={top:0,left:0}}return{top:b.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:b.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var b=this.currentItem.position();return{top:b.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:b.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}else{return{top:0,left:0}}},_cacheMargins:function(){this.margins={left:(parseInt(this.currentItem.css("marginLeft"),10)||0),top:(parseInt(this.currentItem.css("marginTop"),10)||0)}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var e=this.options;if(e.containment=="parent"){e.containment=this.helper[0].parentNode}if(e.containment=="document"||e.containment=="window"){this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,a(e.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(a(e.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]}if(!(/^(document|window|parent)$/).test(e.containment)){var c=a(e.containment)[0];var d=a(e.containment).offset();var b=(a(c).css("overflow")!="hidden");this.containment=[d.left+(parseInt(a(c).css("borderLeftWidth"),10)||0)+(parseInt(a(c).css("paddingLeft"),10)||0)-this.margins.left,d.top+(parseInt(a(c).css("borderTopWidth"),10)||0)+(parseInt(a(c).css("paddingTop"),10)||0)-this.margins.top,d.left+(b?Math.max(c.scrollWidth,c.offsetWidth):c.offsetWidth)-(parseInt(a(c).css("borderLeftWidth"),10)||0)-(parseInt(a(c).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,d.top+(b?Math.max(c.scrollHeight,c.offsetHeight):c.offsetHeight)-(parseInt(a(c).css("borderTopWidth"),10)||0)-(parseInt(a(c).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top]}},_convertPositionTo:function(f,h){if(!h){h=this.position}var c=f=="absolute"?1:-1;var e=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,g=(/(html|body)/i).test(b[0].tagName);return{top:(h.top+this.offset.relative.top*c+this.offset.parent.top*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(g?0:b.scrollTop()))*c)),left:(h.left+this.offset.relative.left*c+this.offset.parent.left*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():g?0:b.scrollLeft())*c))}},_generatePosition:function(e){var h=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,i=(/(html|body)/i).test(b[0].tagName);if(this.cssPosition=="relative"&&!(this.scrollParent[0]!=document&&this.scrollParent[0]!=this.offsetParent[0])){this.offset.relative=this._getRelativeOffset()}var d=e.pageX;var c=e.pageY;if(this.originalPosition){if(this.containment){if(e.pageX-this.offset.click.left<this.containment[0]){d=this.containment[0]+this.offset.click.left}if(e.pageY-this.offset.click.top<this.containment[1]){c=this.containment[1]+this.offset.click.top}if(e.pageX-this.offset.click.left>this.containment[2]){d=this.containment[2]+this.offset.click.left}if(e.pageY-this.offset.click.top>this.containment[3]){c=this.containment[3]+this.offset.click.top}}if(h.grid){var g=this.originalPageY+Math.round((c-this.originalPageY)/h.grid[1])*h.grid[1];c=this.containment?(!(g-this.offset.click.top<this.containment[1]||g-this.offset.click.top>this.containment[3])?g:(!(g-this.offset.click.top<this.containment[1])?g-h.grid[1]:g+h.grid[1])):g;var f=this.originalPageX+Math.round((d-this.originalPageX)/h.grid[0])*h.grid[0];d=this.containment?(!(f-this.offset.click.left<this.containment[0]||f-this.offset.click.left>this.containment[2])?f:(!(f-this.offset.click.left<this.containment[0])?f-h.grid[0]:f+h.grid[0])):f}}return{top:(c-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(i?0:b.scrollTop())))),left:(d-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():i?0:b.scrollLeft())))}},_rearrange:function(g,f,c,e){c?c[0].appendChild(this.placeholder[0]):f.item[0].parentNode.insertBefore(this.placeholder[0],(this.direction=="down"?f.item[0]:f.item[0].nextSibling));this.counter=this.counter?++this.counter:1;var d=this,b=this.counter;window.setTimeout(function(){if(b==d.counter){d.refreshPositions(!e)}},0)},_clear:function(d,e){this.reverting=false;var f=[],b=this;if(!this._noFinalSort&&this.currentItem[0].parentNode){this.placeholder.before(this.currentItem)}this._noFinalSort=null;if(this.helper[0]==this.currentItem[0]){for(var c in this._storedCSS){if(this._storedCSS[c]=="auto"||this._storedCSS[c]=="static"){this._storedCSS[c]=""}}this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else{this.currentItem.show()}if(this.fromOutside&&!e){f.push(function(g){this._trigger("receive",g,this._uiHash(this.fromOutside))})}if((this.fromOutside||this.domPosition.prev!=this.currentItem.prev().not(".ui-sortable-helper")[0]||this.domPosition.parent!=this.currentItem.parent()[0])&&!e){f.push(function(g){this._trigger("update",g,this._uiHash())})}if(!a.ui.contains(this.element[0],this.currentItem[0])){if(!e){f.push(function(g){this._trigger("remove",g,this._uiHash())})}for(var c=this.containers.length-1;c>=0;c--){if(a.ui.contains(this.containers[c].element[0],this.currentItem[0])&&!e){f.push((function(g){return function(h){g._trigger("receive",h,this._uiHash(this))}}).call(this,this.containers[c]));f.push((function(g){return function(h){g._trigger("update",h,this._uiHash(this))}}).call(this,this.containers[c]))}}}for(var c=this.containers.length-1;c>=0;c--){if(!e){f.push((function(g){return function(h){g._trigger("deactivate",h,this._uiHash(this))}}).call(this,this.containers[c]))}if(this.containers[c].containerCache.over){f.push((function(g){return function(h){g._trigger("out",h,this._uiHash(this))}}).call(this,this.containers[c]));this.containers[c].containerCache.over=0}}if(this._storedCursor){a("body").css("cursor",this._storedCursor)}if(this._storedOpacity){this.helper.css("opacity",this._storedOpacity)}if(this._storedZIndex){this.helper.css("zIndex",this._storedZIndex=="auto"?"":this._storedZIndex)}this.dragging=false;if(this.cancelHelperRemoval){if(!e){this._trigger("beforeStop",d,this._uiHash());for(var c=0;c<f.length;c++){f[c].call(this,d)}this._trigger("stop",d,this._uiHash())}return false}if(!e){this._trigger("beforeStop",d,this._uiHash())}this.placeholder[0].parentNode.removeChild(this.placeholder[0]);if(this.helper[0]!=this.currentItem[0]){this.helper.remove()}this.helper=null;if(!e){for(var c=0;c<f.length;c++){f[c].call(this,d)}this._trigger("stop",d,this._uiHash())}this.fromOutside=false;return true},_trigger:function(){if(a.widget.prototype._trigger.apply(this,arguments)===false){this.cancel()}},_uiHash:function(c){var b=c||this;return{helper:b.helper,placeholder:b.placeholder||a([]),position:b.position,absolutePosition:b.positionAbs,offset:b.positionAbs,item:b.currentItem,sender:c?c.element:null}}}));a.extend(a.ui.sortable,{getter:"serialize toArray",version:"1.7.2",eventPrefix:"sort",defaults:{appendTo:"parent",axis:false,cancel:":input,option",connectWith:false,containment:false,cursor:"auto",cursorAt:false,delay:0,distance:1,dropOnEmpty:true,forcePlaceholderSize:false,forceHelperSize:false,grid:false,handle:false,helper:"original",items:"> *",opacity:false,placeholder:false,revert:false,scroll:true,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1000}})})(jQuery);;


SpriteMe.init(window.document);
