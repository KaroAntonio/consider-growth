
var line;
var ctx, canvas;
var ctr = 0;
var pubnub;
 
var width;
var height;

var p1;
var p2;

var update_buffer = 2000;

var last_pub_1 = 0;
var last_pub_2 = 0;  

var dont_listen = false;

function setup() {
	$('#loading').hide();

	width = window.innerWidth;
	height = window.innerHeight;

	init_splash();
	init_pubnub();

	canvas = createCanvas(width, height).canvas
	$(canvas).css({top:0})

	ctx = canvas.getContext('2d');

	//line = init_diff_line(10);

	//animate_line();	

	p1 = reset_params()
	p2 = reset_params()

	background(0)
}

function draw() {


	p1.ctr += 1;	
	p2.ctr += 1;	
	ctr += 1

	//p1.speed = 1;
	
	// Turn these on and off to control who draws
	if (dont_listen || Date.now() - last_pub_1 < update_buffer) 
		draw_deformed_circle(p1,width/2,height/2, 70)
	if (dont_listen || Date.now() - last_pub_2 < update_buffer) 
		draw_deformed_circle(p2,width/2,height/2, 70)

	//background('rgba(0%,0%,0%,0.001)');

	if (p1.ctr%1000 == 0) p1 = reset_params()
	if (p2.ctr%1000 == 0) p2 = reset_params()
}

function init_splash() {
	$('#splash').css({
		zIndex:100,
		fontSize:40,
		color: 'white',
		background: 'absolute',
		position: 'fixed',
		top:height*0.25,
		left:width*0.25
	})

	$('#accessories-button').click(function(){
		$('#splash').remove()	
	});

	$('#plain-button').click(function(){
		$('#splash').remove()	
		dont_listen = true;
	});
}

function init_pubnub() {
	pubnub = new PubNub({
		subscribeKey: "sub-c-ac854de4-c885-11e7-9695-d62da049879f",
		publishKey: "pub-c-31315745-29a7-4863-bc2a-97a528df3c93",
		ssl: true
	})

	pubnub.addListener({
		status: function(statusEvent) {
			if (statusEvent.category === "PNConnectedCategory") {
				console.log('CONNECTED! I THINIK.')
			} else if (statusEvent.category === "PNUnknownCategory") {
				var newState = {
					new: 'error'
				};
				pubnub.setState({
					state: newState 
				},
			function (status) {
				console.log(statusEvent.errorData.message)
			});
			} 
		},
		message: function(message) {
			update_last_pub(message)
		}
	})

	pubnub.subscribe({
	    channels: ['channel1','channel2'],
	});
}

function update_last_pub(message) {
	if (message.channel == 'channel1') last_pub_1 = Date.now();
	if (message.channel == 'channel2') last_pub_2 = Date.now();
}

function draw_deformed_circle(p, cx, cy, n) {
	var circle = gen_deformed_circle(p, cx, cy, n);
	draw_loop(ctx, circle,1,p.ctr+p.ctr_off);
}

function reset_params() {
	return {
		'arc_mode' : choice([0,1]),
		'wave_mode' : choice(range(0,11,1)),
		'speed' : range_val(.5,2),
		'inner_r' : range_val(0,50),
		'theta_off' : range_val(0, Math.PI * 2),
		'ctr' : choice(range(0,200,1)),
		'ctr_off' :  choice(range(0,11,1)),
	}
}

function range(s, f, inc) {
	range_arr = [];
	for (var i=s; i < f; i+=inc) {
		range_arr.push(i);
	}
	return range_arr;
}

function range_val(lo, hi) {
	return Math.random() * (hi-lo)+lo
}

function choice(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}


function animate_line() {
	run_diff_line(line);
	//ctx.clearRect(0, 0, width, height);
	draw_loop(ctx, line,1,ctr*2);
}

// THIS IS VISUAL STUFF

function gen_deformed_circle(p,cx,cy,n){	
	r = Math.sin(p.ctr/(1000 * p.speed)) * height/2 + p.inner_r

	var circle = gen_circle_line(cx,cy,n,r)
	var center = new p5.Vector(cx, cy)

	for (var i=0;i < circle.length; i++) {
		deform_point(p, i, circle, center,r)
	}

	return circle;
}

function deform_point(p, i, circle, center,r) {
	// deform a point on the circle

	var pos = circle[i]['pos']
	var dir = p5.Vector.sub(pos,center)	
	var polar = cartesian_to_polar(dir.x, dir.y)
	var theta = polar[1]

	var n_wave_1 = noise(dir.x*0.1, dir.y*0.1)*2
	var n_wave_2 = noise(dir.x*0.01 + (ctr/1001)%1, dir.y*0.01 +(ctr/1001)%1)*2
	var n_wave_3 = noise(dir.x*0.02 + (r/500)%1, dir.y*0.02 +(r/500)%1)
	var n_wave_4 = noise(theta/(Math.PI*2), r/500)

	var wave_1 = Math.cos(polar[1]*5);
	var wave_2 = Math.cos(polar[1]*p.wave_mode);
	var wave_3 = Math.sin(theta*p.ctr_off)
	var wave_4 = Math.cos(n_wave_1*.6);
	var wave_5 = Math.cos(theta*4 * n_wave_2);
	var wave_6 = Math.sin(theta*3)
	var wave_7 = Math.sin(theta*2)
	
	//p.wave_mode = 0
	if (p.wave_mode==0) {
		pos.sub(center)
		pos.mult(.5)
		
		//pos.x = pos.x*.5 +(Math.sin(n_wave_1))*20
		//pos.y = pos.y*.5 + (Math.sin(n_wave_1))*20
		
		pos.add(center)

		rotate_point(center, pos, (p.ctr/500)+n_wave_1*3)
	}
	if (p.wave_mode==1) pos.add(dir.mult(wave_4*.6))
	if (p.wave_mode==2) {
		
		var coords = polar_to_cartesian(r+wave_3*10 *n_wave_2*2, theta)
		pos.x = coords[0]
		pos.y = coords[1]
		pos.add(center)
	}
	if (p.wave_mode==3) pos.sub(center).mult((wave_3*2+n_wave_1*.5)*.5).add(center)
	if (p.wave_mode==4) pos.sub(center).mult(wave_5).add(center)
	if (p.wave_mode==5) pos.sub(center).mult(wave_4*.7).add(center)
	if (p.wave_mode==6) pos.sub(center).mult(n_wave_2).add(center) //  SO GOOOd
	if (p.wave_mode==7) pos.sub(center).mult((2+n_wave_1)*.3).add(center)
	if (p.wave_mode==8) {
		pos.sub(center)

		pos.mult((n_wave_3 + 1 + ((p.ctr_off%3)*wave_1+((p.ctr_off+1)%3)*wave_6)/4)/4)

		pos.add(center)
	}
	if (p.wave_mode==9) pos.sub(center).add(dir.mult((1+n_wave_3)/2)).add(center)
	if (p.wave_mode==10) pos.sub(center).mult((n_wave_3+1)/4).add(center)
	
	
	rotate_point(center,pos,p.theta_off)

}

function rotate_point(center, pos, theta) {
	pos.sub(center)

	var polar = cartesian_to_polar(pos.x, pos.y)
	polar[1] += theta
	var coords = polar_to_cartesian(polar[0], polar[1])
	
	pos.x = coords[0]
	pos.y = coords[1]

	pos.add(center)

	return pos
	
}

function cartesian_to_polar(x,y) {
	var r = (x**2 + y ** 2) ** 0.5
	var theta = Math.atan(y/x);

	if (x<0) theta += Math.PI
	return [r,theta]
}

function polar_to_cartesian(r, theta) {
        var x = r * Math.cos( theta );
        var y = r * Math.sin( theta );
        return [x,y]
}


