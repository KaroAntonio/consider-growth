

// A growth algorithm, inspired by inconvergent's differential line
// http://inconvergent.net/generative/differential-line/
// requires jquery

var line = []
var width = window.innerWidth;
var height = window.innerHeight;

function init_growth() {
	init_canvas();
		
	line = seed_line_from_circle(100,10,width/2, height/2);	
	draw_loop(line);
}

function seed_line_from_circle(r,n,cx,cy){
	// this is probably good as a sphere
	var line = [];	
	var d_theta = Math.PI * 2 / n;
	for (var i = 0; i < n; i++) {
		var theta = i * d_theta; 
		var coords = polar_to_cartesian_2d(r, theta)
		line.push({'x':coords[0]+cx,'y':coords[1]+cy});
	} 
	return line;
}

function polar_to_cartesian_2d(r, theta) {
	var x = r * Math.cos( theta );
	var y = r * Math.sin( theta );
	return [x,y]
}
