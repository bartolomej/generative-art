const canvasSketch = require('canvas-sketch');
const { Vector, Matrix } = require('../math');
const chroma = require('chroma-js')

const size = 2000;

const settings = {
  duration: 3,
  dimensions: [size, size],
  scaleToView: true,
  playbackRate: 'throttle',
  animate: true,
  fps: 24
};

const sketch = async ({ width: w, height: h, context }) => {
  const res = { xMin: -w / 2, xMax: w / 2, yMin: -h / 2, yMax: h / 2 };

  const nVectors = 10;
  const nParticles = 1000;
  const maxPathLength = 100;
  const pathWidth = 8;
  const integrationStep = 0.05;
  const span = 20;
  const spanX = span;
  const spanY = span;

  // transformation matrix
  const m = new Matrix([spanX / w, 0], [0, spanY / h]);
  // velocity gradient vector function
  const velocity = position => new Vector(
      Math.sin(position.abs()+Math.cos(position.x)),
      Math.cos(position.abs()+(Math.sin(position.x)+Math.cos(position.x)))
  ).scalarI(integrationStep);

  // calculate n of vectors for each dimension
  let vSrt = Math.sqrt(nVectors);
  let vdx = w / vSrt, vdy = h / vSrt;

  // calculate n of particles for each dimension
  let dSrt = Math.sqrt(nParticles);
  let pdx = w / dSrt, pdy = h / dSrt;

  // generate initial particles
  let particles = [];
  for (let y = res.yMin; y < res.yMax; y += pdy) {
    for (let x = res.xMin; x < res.xMax; x += pdx) {
      particles.push({
        path: [],
        v: m.transformI(new Vector(x, y)),
        color: ({progressTowardsPathEnd}) => chroma(`#C68FFF`).alpha(progressTowardsPathEnd)
      });
    }
  }

  return ({ context: ctx, width, height }) => {
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.scale(1, -1);
    ctx.beginPath();

    ctx.fillStyle = 'black';
    ctx.fillRect(-width, -height, width * 2, height * 2);

    if (nVectors > 0) {
      drawVectors(ctx);
    }
    if (nParticles > 0) {
      drawParticles(ctx);
    }
  };

  function drawParticles (ctx) {
    for (let i = 0; i < particles.length; i++) {
      let { path, v, color } = particles[i];

      path.push(v.clone());

      v.addM(velocity(v));
      if (path.length >= maxPathLength) {
        path.splice(0, 1);
      }

      for (let i = 0; i < path.length - 1; i++) {
        const v0 = m.inverseTransformI(path[i]);
        const v1 = m.inverseTransformI(path[i + 1]);
        ctx.beginPath();
        ctx.moveTo(v0.x, v0.y);
        ctx.lineTo(v1.x, v1.y);
        const progressTowardsPathEnd = i / path.length;
        ctx.lineWidth = Math.round(pathWidth * progressTowardsPathEnd) + 1;
        ctx.strokeStyle = color({ progressTowardsPathEnd });
        ctx.stroke();
      }
    }
  }

  function drawVectors (ctx) {
    const scale = 1;
    for (let y = res.yMin; y < res.yMax; y += vdy) {
      for (let x = res.xMin; x < res.yMax; x += vdx) {
        const p = m.transformI(new Vector(x, y));
        const v = velocity(p).scalarI(scale);
        const drawP = m.inverseTransformI(p);
        const drawV = m.inverseTransformI(v);
        ctx.moveTo(drawP.x, drawP.y);
        ctx.lineTo(drawP.x + drawV.x, drawP.y + drawV.y);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
  }

};

canvasSketch(sketch, settings);
