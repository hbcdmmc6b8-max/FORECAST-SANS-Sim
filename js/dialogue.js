const ForecastDialogue=(()=>{"use strict";
const scripts={
opening:[
{speaker:"PROTAGONIST",text:"So you're the one waiting at the end."},
{speaker:"FORECAST",text:"Waiting? No. I already saw you arrive."},
{speaker:"PROTAGONIST",text:"Then you know I'm not turning around."},
{speaker:"FORECAST",text:"I know."},
{speaker:"FORECAST",text:"That's what makes this interesting."}
],
"1.5":[{speaker:"PROTAGONIST",text:"You let that hit you."},{speaker:"FORECAST",text:"I needed to know which future you chose."}],
"2":[{speaker:"FORECAST",text:"Again."},{speaker:"PROTAGONIST",text:"You don't sound worried."},{speaker:"FORECAST",text:"Worry is for things you don't see coming."}],
"2.5":[{speaker:"PROTAGONIST",text:"Your predictions aren't perfect."},{speaker:"FORECAST",text:"They don't have to be."}],
"3":[{speaker:"FORECAST",text:"Now we're past the easy futures."}],
"3.5":[{speaker:"PROTAGONIST",text:"How many endings did you see?"},{speaker:"FORECAST",text:"Enough to stop counting."}],
"4":[{speaker:"FORECAST",text:"You keep choosing the path that hurts most."},{speaker:"PROTAGONIST",text:"And I keep moving."}],
"4.5":[{speaker:"FORECAST",text:"One future left."},{speaker:"PROTAGONIST",text:"Mine."}],
"5":[{speaker:"FORECAST",text:"There it is."},{speaker:"PROTAGONIST",text:"What?"},{speaker:"FORECAST",text:"The same end anyway."}]
};
let queue=[],active=false,onDone=null;
function play(key,done){const src=Array.isArray(key)?key:scripts[key];if(!src||!src.length){if(done)done();return false}queue=src.map(x=>({...x}));active=true;onDone=done||null;show();window.dispatchEvent(new CustomEvent("forecast-dialogue-state",{detail:{active:true}}));return true}
function show(){const line=queue[0];if(!line){finish();return}window.dispatchEvent(new CustomEvent("forecast-dialogue-line",{detail:line}))}
function next(){if(!active)return false;queue.shift();if(queue.length)show();else finish();return true}
function finish(){active=false;queue=[];window.dispatchEvent(new CustomEvent("forecast-dialogue-state",{detail:{active:false}}));const cb=onDone;onDone=null;if(cb)cb()}
function isActive(){return active}
return{play,next,isActive,scripts};})();