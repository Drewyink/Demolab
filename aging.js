// image/aging.js
import sharp from "sharp";
import fs from "fs";

export function getPresets(){
  return [
    { id:"child", label:"Child (8)", hint:"Softer skin, brighter tones" },
    { id:"teen", label:"Teen (16)", hint:"Slight smoothing + warmth" },
    { id:"age30", label:"30s", hint:"Natural contrast + subtle texture" },
    { id:"age60", label:"60s", hint:"Wrinkle overlay + muted tones" },
    { id:"age80", label:"80s", hint:"Stronger wrinkles + grain + vignette" },
  ];
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function wrinkleSvg(intensity=0.5){
  const i = clamp(intensity, 0, 1);
  const opacity = 0.10 + i*0.25;
  const stroke = 0.10 + i*0.35;

  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
    <defs>
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="${0.85 + i*0.25}" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 ${0.22 + i*0.22} 0"/>
      </filter>
    </defs>
    <rect width="1200" height="1200" fill="rgba(0,0,0,0)" />
    <g opacity="${opacity}">
      <path d="M220,420 C420,360 520,360 720,420" fill="none" stroke="rgba(60,60,60,${stroke})" stroke-width="3"/>
      <path d="M260,520 C460,460 560,460 760,520" fill="none" stroke="rgba(60,60,60,${stroke})" stroke-width="3"/>
      <path d="M260,640 C460,600 560,600 760,640" fill="none" stroke="rgba(60,60,60,${stroke})" stroke-width="3"/>
      <path d="M380,760 C460,720 540,720 620,760" fill="none" stroke="rgba(60,60,60,${stroke})" stroke-width="3"/>
      <rect x="0" y="0" width="1200" height="1200" filter="url(#n)" opacity="${0.55 + i*0.25}"/>
    </g>
  </svg>`);
}

function vignetteSvg(strength=0.5){
  const s = clamp(strength, 0, 1);
  const a = 0.10 + s*0.35;
  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
    <defs>
      <radialGradient id="g" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="70%" stop-color="rgba(0,0,0,0.05)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,${a})"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="1200" fill="url(#g)"/>
  </svg>`);
}

function grainSvg(strength=0.5){
  const s = clamp(strength, 0, 1);
  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="${1.2 + s*0.6}" numOctaves="2"/>
      <feColorMatrix type="matrix" values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 ${0.12 + s*0.18} 0"/>
    </filter>
    <rect width="1200" height="1200" filter="url(#grain)" opacity="${0.25 + s*0.25}"/>
  </svg>`);
}

export async function applyAgePreset({ inputPath, outputPath, preset }){
  const inBuf = fs.readFileSync(inputPath);
  let img = sharp(inBuf, { failOn: "none" }).rotate();

  const meta = await img.metadata();
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(meta.width || maxSide, meta.height || maxSide));
  const w = Math.round((meta.width || maxSide) * scale);
  const h = Math.round((meta.height || maxSide) * scale);

  img = img.resize(w, h, { fit: "inside" });

  let mod = img;

  if(preset === "child"){
    mod = mod.modulate({ brightness: 1.08, saturation: 1.08, hue: 5 })
      .blur(0.3).sharpen({ sigma: 0.6, m1: 0.2, m2: 0.2 }).gamma(1.05);
  }
  if(preset === "teen"){
    mod = mod.modulate({ brightness: 1.04, saturation: 1.06, hue: 2 })
      .blur(0.15).sharpen({ sigma: 0.8, m1: 0.25, m2: 0.25 }).gamma(1.02);
  }
  if(preset === "age30"){
    mod = mod.modulate({ brightness: 1.00, saturation: 1.02, hue: 0 })
      .sharpen({ sigma: 1.0, m1: 0.4, m2: 0.3 }).linear(1.02, -2);
  }
  if(preset === "age60"){
    mod = mod.modulate({ brightness: 0.98, saturation: 0.92, hue: -2 })
      .linear(1.05, -5).sharpen({ sigma: 1.1, m1: 0.55, m2: 0.4 });
  }
  if(preset === "age80"){
    mod = mod.modulate({ brightness: 0.96, saturation: 0.86, hue: -4 })
      .linear(1.08, -8).sharpen({ sigma: 1.2, m1: 0.65, m2: 0.45 });
  }

  const baseBuf = await mod.ensureAlpha().toBuffer();

  const overlays = [];
  if(preset === "age60"){
    overlays.push({ input: wrinkleSvg(0.6), blend: "multiply" });
    overlays.push({ input: grainSvg(0.35), blend: "overlay" });
    overlays.push({ input: vignetteSvg(0.35), blend: "multiply" });
  } else if(preset === "age80"){
    overlays.push({ input: wrinkleSvg(0.9), blend: "multiply" });
    overlays.push({ input: grainSvg(0.65), blend: "overlay" });
    overlays.push({ input: vignetteSvg(0.55), blend: "multiply" });
  } else if(preset === "age30"){
    overlays.push({ input: grainSvg(0.18), blend: "overlay" });
    overlays.push({ input: vignetteSvg(0.18), blend: "multiply" });
  } else if(preset === "teen"){
    overlays.push({ input: vignetteSvg(0.10), blend: "multiply" });
  } else if(preset === "child"){
    overlays.push({ input: vignetteSvg(0.06), blend: "multiply" });
  }

  let out = sharp(baseBuf).composite(overlays);

  await out.jpeg({ quality: 92, mozjpeg: true }).toFile(outputPath);

  return { width: w, height: h, preset };
}
