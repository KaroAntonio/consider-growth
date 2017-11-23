
// Differential Line growth Based off of Alberto Giachino's work on code plastic vv nice
// Requires p5.js https://p5js.org/download/
// http://www.codeplastic.com/2017/07/22/differential-line-growth-with-processing/

var max_force = 1;
var max_speed = 0.9;
var desired_separation = 9;
var seperation_cohesion_ratio = 1.1;
var max_edge_len = 5;

var width = window.innerWidth;
var height = window.innerHeight;

function run_perlin_line(line) {
	update_line(line);
	grow_line(line);
	return line;
}

function init_perlin_line(n) {
	var d_theta = Math.PI*2/n;
	var r = 10;
	var line = [];
	
	// seed a circle
	for (var theta=0; theta<Math.PI*2; theta+=d_theta) {
		var x = width/2 + Math.cos(theta) * r;
		var y = height/2 + Math.sin(theta) * r;
		line.push(new_node(x,y,max_force, max_speed));
	}
		
	return line;		
		
}

function grow_line(line) {
	for (var i = 0; i < line.length-1; i++) {
		var 	n1 = line[i],
			n2 = line[i+1];
		var d = n1['pos'].dist(n2['pos']);
		
		// insert nodes
		if (d > max_edge_len) {
			var mid = p5.Vector.add(n1['pos'],n2['pos']).div(2);
			var node = new_node(mid.x,mid.y,max_force, max_speed);
			line.splice(i+1,0,node)
		}	
	}
}

function update_line(line) {
	var separation_fs = get_separation_forces(line);
	var cohesion_fs = get_edge_cohesion_forces(line);

	for (var i=0; i<line.length; i++) {
		var separation = separation_fs[i];
		var cohesion = cohesion_fs[i];

		separation.mult(seperation_cohesion_ratio);

		apply_force_to_node(line[i],separation);
		apply_force_to_node(line[i],cohesion);
		update_node(line[i]);
	}
}

function get_separation_forces(line) {
	var n = line.length;
	var separation_fs = [];
	var origin = new p5.Vector(width/2,height/2)

	var other = new p5.Vector(width/2+20,height/2-20)

	for (var i=0; i<n; i++) {
		var pos = line[i]['pos']
		var x = pos.x;
		var y = pos.y;

		var sum = new p5.Vector(0,0);
		
		var dist = origin.dist(pos)
		var dir_f = p5.Vector.sub(pos,origin).normalize().mult(1/(dist/10))
		
		var other_d = other.dist(pos)
		var other_f = p5.Vector.sub(pos,other).normalize().mult(1/(dist/7))

		sum.add(dir_f)
		sum.add(other_f)

		separation_fs.push(sum);
	}


	return separation_fs;
}

function get_separation_force(n1, n2) {
	var steer = new p5.Vector(0, 0);
	var sq_d = (n2['pos'].x-n1['pos'].x)**2+(n2['pos'].y-n1['pos'].y)**2;

	if (sq_d>0 && sq_d<desired_separation**2) {
		var diff = p5.Vector.sub(n1['pos'], n2['pos']);
		diff.normalize();
		diff.div(Math.sqrt(sq_d)); //Weight by distance
		steer.add(diff);
	}
	return steer;
}

 function get_edge_cohesion_forces(diff_line) {
	var n = diff_line.length;
	var cohesion_fs = []

	for (var i=0; i<n; i++) {
		var sum = new p5.Vector(0, 0);      
		if (i!=0 && i!=n-1) {
			sum.add(diff_line[i-1]['pos']).add(diff_line[i+1]['pos']);
		} else if (i == 0) {
			sum.add(diff_line[n-1]['pos']).add(diff_line[i+1]['pos']);
		} else if (i == n-1) {
			sum.add(diff_line[i-1]['pos']).add(diff_line[0]['pos']);
		}
		sum.div(2);
		cohesion_fs.push(seek_node(diff_line[i],sum));
	}

	return cohesion_fs;
}

function new_node(x, y, mF, mS) {
	return {
		'pos': new p5.Vector(x,y),
		'a':new p5.Vector(0,0),
		'v':p5.Vector.random2D(),
		'mF':mF,
		'mS':mS,
		}
}

function apply_force_to_node(node, force) {
	node['a'].add(force);
}

function update_node(node) {
	node['v'].add(node['a']);
	node['v'].limit(node['mS']);	
	node['pos'].add(node['v']);
	node['a'].mult(0);
}

function seek_node(node,target) {
	var des = target.sub(node['pos']);
	des.setMag(node['mS']);
	var steer = des.sub(node['v']);
	steer.limit(node['mF']);

	return steer;
}

function polar_to_cartesian_2d(r, theta) {
        var x = r * Math.cos( theta );
        var y = r * Math.sin( theta );
        return [x,y]
}
