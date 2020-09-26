<style>
#game {
  font-family: sans-serif;
  background-color: #555;
  position: relative;
  width: 200px;
  height: 120px;
}
#preview, #lag, #nolag {
  box-sizing: border-box;
  padding: 5px;
  position: absolute;
  text-align: center;
  display: table;
  cursor: pointer;
}
#preview > span, #lag > span, #nolag > span {
  display: table-cell;
  vertical-align: middle;
}
#preview {
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  background-size: 50px 50px;
}
#preview.a { background-color: #000; color: #fff; }
#preview.b { background-color: #fff; color: #000; }
#lag, #nolag {
  color: #000;
  left: 100px;
  width: 100px;
  height: 50px;
}
#lag { top: 0px; background-color: #f33; }
#lag:hover { background-color: #f55; }
#lag:active { background-color: #d00; }
#nolag { top: 50px; background-color: #3d3; }
#nolag:hover { background-color: #5f5; }
#nolag:active { background-color: #0c0; }
#progress {
  position: absolute;
  top: 100px;
  left: 0;
  height: 20px;
  width: 0px;
  background-color: #888;
}
#summary {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: 120px;
  background-color: #000;
  color: #fff;
}
#verdict { margin: 10px; }
#summary > div {
  display: table-cell;
  text-align: center;
  vertical-align: middle;
}
#verdict.yup { color: #3f3; }
#verdict.nope { color: #f33; }
</style>

I was discussing with my colleague at work about how I found input lag annoying
and he made some comment about how I probably can't notice ~10-100ms of input
lag. Well, eager to prove my point I made a little game to test this assumption.

This game concerns a *very exciting* square. When you click the square, it will
toggle between black and white. The aim of the game is to decide whether there
is a lag between the click and the colour switch. Secretly, the game has decided
whether or not it will produce a small (<span class="ms">Xms</span>) delay. You
have to decide whether you think you see it or not and click either "Lag" or "No
lag". Once you clicked it, the game records whether you were right and then
resets itself so you can try again. After a number of attempts, the game will
tell you whether you managed to convince it that you can tell the difference.

<div id="game">
  <div id="preview" class="a"><span>Click to toggle</span></div>
  <div id="lag"><span>Lag</span></div>
  <div id="nolag"><span>No lag</span></div>
  <div id="progress"></div>
  <div id="summary">
    <div>
      So... can you tell?
      <div id="verdict">...</div>
      <span id="confidence" title="If we replaced you with a coin, this is how likely you'd be to guess correctly as many times as you did.">
        ...
      </span>
    </div>
  </div>
</div>

Turns out, I can just about recognise <span class="ms">Xms</span> lag. I was
expecting to be able to recognise lower numbers, but the game proved me wrong.
Can you spot the lag?

*Apologies to anybody viewing this on mobile, it's not as easy to judge the
timing with a touchscreen. You'll have to wait until you're sat at a computer
with a mouse in your hand.*

<script src="game.js"></script>
