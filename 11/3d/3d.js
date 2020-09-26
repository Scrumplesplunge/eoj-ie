var region = {};
region.x = 0;
region.y = 0;
var cv1;
var cv2;
var area;
var hook = {};
hook.hooks = [];
hook.Add = function(type,id,func) {
    if(!hook.hooks[type]){
        hook.hooks[type]=[];
    }
    hook.hooks[type][id]=func;
}
hook.Remove = function(type,id) {
    delete hook.hooks[type][id];
}
hook.Call = function(type,def) {
    var out=def;
    var tmp;
    for(asd in hook.hooks[type]) {
        tmp=eval(hook.hooks[type][asd]);
        if(tmp!=def){out=!def}
    }
    return out;
}
var cvar = {};
cvar.vars = [];
cvar.Set = function(name,val) {
    cvar.vars[name] = val;
}
cvar.Get = function(name) {
    return cvar.vars[name];
}
function concmd(e) {
    e = (window.event) ? window.event : e;
    cmd = document.getElementById("console");
    out = document.getElementById("condisp");
    args = cmd.value.split(" ");
    if(cvar.Get(args[0])!==undefined) {
        out.style.color="rgb(0,150,0)";
        if(e.keyCode==13){
            cvar.Set(args[0],args[1]);
            out.value="Value set to: "+args[1];
            cmd.value="";
        }else{
            out.value="Current Value: "+cvar.Get(args[0]);
        }
    } else {
        out.style.color="rgb(100,0,0)";
        out.value="Invalid Console Variable";
    }
}
cvar.Set("r_contrast",0.2);
cvar.Set("r_alpha",1);
cvar.Set("r_fill",1);
cvar.Set("r_wireframe",0);
cvar.Set("debug_light",0);
var util = {};
util.Sin = function(deg) {
    return Math.sin(deg*2*Math.PI/360);
}
util.Cos = function(deg) {
    return Math.cos(deg*2*Math.PI/360);
}
util.ASin = function(num) {
    return Math.asin(num)*360/(2*Math.PI);
}
util.ACos = function(num) {
    return Math.acos(num)*360/(2*Math.PI);
}
util.Tan = function(deg) {
    return Math.tan(deg*2*Math.PI/360);
}
util.ATan = function(num) {
    return Math.atan(num)*360/(2*Math.PI);
}
util.Clear = function() {
    area.clearRect(0,0,region.x,region.y);
}
util.ToAngle = function(x,y) {
    var temp = VecLength(Vector(x,y,0));
    var ang = util.ACos(x/temp);
    if (y<0) {
        ang = 360-ang;
    }
    return ang;
}
util.TraceLine = function(mesh,spos,ang) {
    var lm = util.MeshToLocal(mesh.slice(),spos,ang);
	var ang;
    for ( face in lm ) {
		/* ang = 0;
		for ( poi = 0 ; poi < face.length ; poi++ ) {
			if ( poi == ( face.length - 1 ) ) {
				ang += Math.abs( util.ToAngle( face[ poi ].y , face[ poi ].z ) - util.ToAngle( face[ 0 ].y , face[ 0 ].z ) );
			} else {
				ang += Math.abs( util.ToAngle( face[ poi ].y , face[ poi ].z ) - util.ToAngle( face[ poi + 1 ].y , face[ poi + 1 ].z ) );
			}
		}
		alert( ang );
		if ( ang == 360 ) {
			alert( "Collision!" );
		} */
	}
}
util.FarPoint = function(face) {
    var out = Vector(0,0,0);
    var tvec = Vector(0,0,0);
    for(i=2;i<face.length;i++) {
        tvec = AddVec(tvec,face[i]);
    }
    tvec = MulVec(tvec,1/(face.length-2));
    out = SubVec(tvec,camera.pos);
    return out;
}
util.QDist = function(v) {
    return Math.pow(v.x,2)+Math.pow(v.y,2)+Math.pow(v.z,2);
}
util.MeshToLocal = function(mesh,pos,ang) {
    var out = mesh.slice();
    for(qa=0;qa<out.length;qa++) {
        for(ws=1;ws<out[qa].length;ws++) {
            out[qa][ws] = util.ToLocal(out[qa][ws],pos,ang);
        }
    }
    return out;
}
util.Rotate = function(mesh,y) {
    var out = mesh.slice();
    for(i=0;i<mesh.length;i++) {
        for(j=1;j<mesh[i].length;j++) {
            out[i][j] = RotVec(mesh[i][j],y);
        }
    }
    return out;
}
util.MoveBy = function(mesh,vec) {
    var out = mesh.slice();
    for(i=0;i<mesh.length;i++) {
        for(j=2;j<mesh[i].length;j++) {
            out[i][j] = AddVec(out[i][j],vec);
        }
    }
    return out;
}
util.AngToVec = function(ang) {
    var out = {};
    out.x = util.Cos(ang.y)*util.Cos(ang.p);
    out.y = util.Sin(ang.y)*util.Cos(ang.p);
    out.z = util.Sin(ang.p);
    return out;
}
util.Visible = function(face) {
    if(util.QDist(SubVec(camera.pos,face[2]))>(util.QDist(SubVec(camera.pos,AddVec(face[2],face[1])))-1)){
        for(edc=2;edc<face.length;edc++) {
            if(util.ToLocal(face[edc],camera.pos,camera.ang).x>1){return true}
        }
    }
}
util.ToLocal = function(vec,pos,ang) {
    var out = SubVec(vec,pos);
    out = RotVec(out,-ang.y);
    out = RotVec(Vector(out.x,out.z,out.y),-ang.p);
    out = Vector(out.x,out.z,out.y);
    return out;
}
util.ToScreen = function(vec) {
    var out = {};
    var lv=SubVec(vec,camera.pos);
    var local=util.ToLocal(vec,camera.pos,camera.ang);
    out.visible = true;
    if(local.x<0){local.x=1;out.visible=false}
    out.x = local.y*region.x/local.x;
    out.y = local.z*region.x/local.x;
    if(!out.visible){
        out.y=lv.z*region.x;
    }
    out.x += region.x*0.5;
    out.y = region.y*0.5-out.y;
    out.visible = (out.x>0&out.y>0&out.x<region.x&out.y<region.y) ? true : false;
    return out;
}
function sortByDistance( a , b ) {
	return util.QDist(util.FarPoint( a )) - util.QDist(util.FarPoint( b ));
}
util.Draw = function(mesh,force) {
    var lv;
    var ind;
    if(cvar.Get("r_fill")>0){
		var om = mesh.sort(sortByDistance);
    }else{
        var om = mesh;
    }
    for(i=om.length-1;i>=0;i--) {
        if(om[i].length>0&(util.Visible(om[i])|cvar.Get("r_wireframe")==1)){
            if(cvar.Get("r_fill")>0){
                var col = AddLight(om[i].slice());
                area.fillStyle = "rgba("+col.x+","+col.y+","+col.z+","+cvar.Get("r_alpha")+")";
                area.strokeStyle = "rgba("+col.x+","+col.y+","+col.z+","+cvar.Get("r_alpha")+")";
            }
            area.beginPath();
            var tmp = util.ToScreen(om[i][2]);
            area.moveTo(tmp.x,tmp.y);
            for(j=2;j<om[i].length;j++) {
                tmp = util.ToScreen(om[i][j]);
                area.lineTo(tmp.x,tmp.y);
            }
            area.closePath();
            if(cvar.Get("r_fill")>0){area.fill();area.stroke()}
            if(cvar.Get("r_wireframe")>0){
                area.strokeStyle = "rgb(0,0,0)";
                area.stroke();
            }
        }
    }
}
function AddLight(face) {
    var col = face[0];
    var norm = face[1];
    var mod = SubVec(Vector(255,255,255),col);
    var pos = Vector(0,0,0);
    for(p=2;p<face.length;p++) {
        pos = AddVec(pos,face[p]);
    }
    pos = MulVec(pos,1/(face.length-2));
    var dir = SubVec(pos,camera.light.pos);
    dir = MulVec(dir,camera.light.power/VecLength(dir));
    var mul = (VecLength(SubVec(dir,norm))-0.5)*camera.light.contrast;
    mod = MulVec(mod,mul*cvar.Get("r_contrast"));
    var out = RoundVec(AddVec(col,mod));
    return out;
}
function Vector(x,y,z) {
    var out = {};
    out.x = x;
    out.y = y;
    out.z = z;
    return out;
}
function RoundVec(v) {
    var out = {};
    out.x = Math.round(v.x);
    out.y = Math.round(v.y);
    out.z = Math.round(v.z);
    return out;
}
function VecLength(v) {
    return Math.sqrt(Math.pow(v.x,2)+Math.pow(v.y,2)+Math.pow(v.z,2));
}
function AddVec(a,b) {
    var out = {};
    out.x = a.x+b.x;
    out.y = a.y+b.y;
    out.z = a.z+b.z;
    return out;
}
function SubVec(a,b) {
    var out = {};
    out.x = a.x-b.x;
    out.y = a.y-b.y;
    out.z = a.z-b.z;
    return out;
}
function MulVec(a,b) {
    var out = {};
    out.x = a.x*b;
    out.y = a.y*b;
    out.z = a.z*b;
    return out;
}
function RotVec(v,y) {
    var out = {};
    var len = VecLength(Vector(v.x,v.y,0));
    var dir;
    if(len==0){dir=0}else{dir=(util.ToAngle(v.x,v.y)+y)%360}
    out.x = util.Cos(dir)*len;
    out.y = util.Sin(dir)*len;
    out.z = v.z;
    return out;
}
function Angle(p,y) {
    var out = {};
    out.p = p;
    out.y = y;
    return out;
}
function AddAng(a,b) {
    var out = {};
    out.p = a.p+b.p;
    out.y = a.y+b.y;
    return out;
}
function SubAng(a,b) {
    var out = {};
    out.p = a.p-b.p;
    out.y = a.y-b.y;
    return out;
}
function MulAng(a,b) {
    var out = {};
    out.p = a.p*b;
    out.y = a.y*b;
    return out;
}
function CurTime() {
	d=new Date();
	return d.getTime()/1000;
}
var camera = {};
camera.pos = Vector(0,0,0);
camera.ang = Angle(0,0);
camera.light = {};
camera.light.pos = Vector(0,0,0);
camera.light.power = 1;
camera.light.contrast = 1;
function init() {
	util.Clear();
	camera.pos = Vector(0,0,0);
	camera.ang = Angle(0,0);
    hook.Call("init");
}
var logo = new Image();
logo.src = "logo.png";
function drawLogo() {
	if(area) {
		area.drawImage(logo,region.x/2-200,region.y/2-125);
	} else {
		setTimeout("drawLogo()",100);
	}
}
util.cone = [
	[Vector(75,75,75),Vector(0,0,1),Vector(2,2,-1.9),Vector(2,-2,-1.9),Vector(-2,-2,-1.9),Vector(-2,2,-1.9)],
	[Vector(75,75,75),Vector(0,0,-1),Vector(2,2,-2),Vector(2,-2,-2),Vector(-2,-2,-2),Vector(-2,2,-2)],
	[Vector(75,75,75),Vector(1,0,0),Vector(2,2,-1.9),Vector(2,-2,-1.9),Vector(2,-2,-2),Vector(2,2,-2)],
	[Vector(75,75,75),Vector(0,-1,0),Vector(2,-2,-1.9),Vector(-2,-2,-1.9),Vector(-2,-2,-2),Vector(2,-2,-2)],
	[Vector(75,75,75),Vector(-1,0,0),Vector(-2,-2,-1.9),Vector(-2,2,-1.9),Vector(-2,2,-2),Vector(-2,-2,-2)],
	[Vector(75,75,75),Vector(0,1,0),Vector(-2,2,-1.9),Vector(2,2,-1.9),Vector(2,2,-2),Vector(-2,2,-2)],
	[Vector(200,100,0),Vector(0.97,0,0.24),Vector(1,1,-1.9),Vector(0,0,2),Vector(1,-1,-1.9)],
	[Vector(200,100,0),Vector(0,-0.97,0.24),Vector(1,-1,-1.9),Vector(0,0,2),Vector(-1,-1,-1.9)],
	[Vector(200,100,0),Vector(-0.97,0,0.24),Vector(-1,-1,-1.9),Vector(0,0,2),Vector(-1,1,-1.9)],
	[Vector(200,100,0),Vector(0,0.97,0.24),Vector(-1,1,-1.9),Vector(0,0,2),Vector(1,1,-1.9)]
];
logo.onload = drawLogo();
function watermark() {try{
    cv1 = document.getElementById("screena");
    cv2 = document.getElementById("screenb");
    area = cv1.getContext("2d");
    cv1s = true;
	camera.pos = Vector(-14,-14,10);
	camera.ang = Angle(-20,45);
	camera.light.pos = Vector(-10,0,5);
	util.Draw(util.cone.slice());
	setTimeout("init()",1000);
}catch(err){alert(err)}}
window.onload=watermark;
cvar.Set("r_targetfps",100);
var ct=0;
function think() {
    dif=CurTime()-ct;
    ct=CurTime();
    cvar.Set("r_fps",Math.round(1/dif));
    hook.Call("think");
	if(cvar.Get("debug_light")>0) {
		var lpos = util.ToScreen( camera.light.pos );
		area.beginPath();
		area.arc( lpos.x , lpos.y , 3 , 0 , Math.PI*2 );
		area.fillStyle = "rgb(255,255,255)";
		area.strokeStyle = "rgb(0,0,0)";
		area.fill();
		area.stroke();
	}
    if(cv1s){
        cv1.style.display = "block";
        cv2.style.display = "none";
        cv1s=false;
        area=cv2.getContext("2d");
    }else{
        cv2.style.display = "block";
        cv1.style.display = "none";
        cv1s=true;
        area=cv1.getContext("2d");
    }
    util.Clear();
    setTimeout("think()",Math.round(1000/cvar.Get("r_targetfps")));
}