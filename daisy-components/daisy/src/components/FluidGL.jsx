import { useRef, useEffect, useState } from "react";
import { useTheme, hexA } from "../ThemeContext.jsx";

function hexToVec3(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  return [r, g, b];
}

// ─── FluidGL ──────────────────────────────────────────────────────────────────
// Props:
//   active      — boolean, speeds up fluid when Daisy is awake
//   energy      — ref (0-1)
//   mouseEffect — boolean, enables cursor-driven fluid disturbance
//
export default function FluidGL({ active, energy, mouseEffect = false }) {
  const { C } = useTheme();
  const ref       = useRef(null);
  const raf       = useRef(0);
  const activeRef = useRef(active);
  const mouseEffRef = useRef(mouseEffect);
  activeRef.current   = active;
  mouseEffRef.current = mouseEffect;

  const glRef     = useRef(null);
  const uColRef   = useRef({});
  const uMouseRef = useRef({});
  const mouse     = useRef({ x:0.5, y:0.5, vx:0, vy:0, speed:0 });

  const [fallback, setFallback] = useState(false);

  // update colors when theme changes
  useEffect(() => {
    const gl = glRef.current;
    const u  = uColRef.current;
    if (!gl || !u.uTeal) return;
    gl.uniform3fv(u.uTeal,    hexToVec3(C.teal));
    gl.uniform3fv(u.uBright,  hexToVec3(C.tealBright));
    gl.uniform3fv(u.uWhisper, hexToVec3(C.whisper));
  }, [C]);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const gl = cv.getContext("webgl") || cv.getContext("experimental-webgl");
    if (!gl) { setFallback(true); return; }
    glRef.current = gl;

    const vsrc = "attribute vec2 p; void main(){ gl_Position=vec4(p,0.0,1.0); }";
    const fsrc = `
      precision highp float;
      uniform vec2  u_res;
      uniform float u_time;
      uniform float u_energy;
      uniform vec3  u_teal;
      uniform vec3  u_bright;
      uniform vec3  u_whisper;
      uniform vec2  u_mouse;
      uniform vec2  u_vel;
      uniform float u_speed;
      uniform float u_mouseOn;  // 0 or 1

      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);
        float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
        vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
      }
      float fbm(vec2 p){
        float v=0.0,a=0.5;
        for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
        return v;
      }
      void main(){
        vec2 uv=gl_FragCoord.xy/u_res.xy;
        vec2 asp=vec2(u_res.x/u_res.y,1.0);
        vec2 p=uv*asp*2.4;
        float t=u_time*0.04;

        // mouse disturbance (only when u_mouseOn = 1)
        if(u_mouseOn > 0.5){
          vec2 mouseP=u_mouse*asp*2.4;
          vec2 toMouse=p-mouseP;
          float dist=length(toMouse);
          float influence=exp(-dist*dist*20.0);
          vec2 velP=u_vel*asp*2.4*2.0;
          p -= velP*influence;
          float swirl=u_speed*influence*0.12;
          vec2 perp=vec2(-toMouse.y,toMouse.x)/(dist+0.001);
          p += perp*swirl;
        }

        vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
        vec2 r=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+t*0.5),fbm(p+3.5*q+vec2(8.3,2.8)-t*0.4));
        float f=fbm(p+3.5*r);

        vec3 deep=vec3(0.012,0.031,0.039);
        vec3 col=deep;
        col=mix(col,u_teal,smoothstep(0.25,0.95,f));
        col=mix(col,u_bright,pow(max(f,0.0),3.0)*(0.5+u_energy*0.22));
        col=mix(col,u_whisper,smoothstep(0.15,0.45,r.x*r.y)*0.10);

        if(u_mouseOn > 0.5){
          vec2 mouseP=u_mouse*asp*2.4;
          float dist=length(p-mouseP);
          float influence=exp(-dist*dist*20.0);
          col += u_teal*influence*u_speed*0.18;
        }

        float vig=smoothstep(1.25,0.25,length(uv-0.5));
        col*=0.45+0.55*vig;
        gl_FragColor=vec4(col,1.0);
      }`;

    const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;};
    const prog=gl.createProgram();
    gl.attachShader(prog,sh(gl.VERTEX_SHADER,vsrc));
    gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fsrc));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){setFallback(true);return;}
    gl.useProgram(prog);

    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,"p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

    const uRes    = gl.getUniformLocation(prog,"u_res");
    const uTime   = gl.getUniformLocation(prog,"u_time");
    const uEn     = gl.getUniformLocation(prog,"u_energy");
    const uMouseOn= gl.getUniformLocation(prog,"u_mouseOn");
    uColRef.current = {
      uTeal:    gl.getUniformLocation(prog,"u_teal"),
      uBright:  gl.getUniformLocation(prog,"u_bright"),
      uWhisper: gl.getUniformLocation(prog,"u_whisper"),
    };
    uMouseRef.current = {
      uMouse: gl.getUniformLocation(prog,"u_mouse"),
      uVel:   gl.getUniformLocation(prog,"u_vel"),
      uSpeed: gl.getUniformLocation(prog,"u_speed"),
    };

    // set initial colors
    gl.uniform3fv(uColRef.current.uTeal,    hexToVec3(C.teal));
    gl.uniform3fv(uColRef.current.uBright,  hexToVec3(C.tealBright));
    gl.uniform3fv(uColRef.current.uWhisper, hexToVec3(C.whisper));

    const resize=()=>{const d=Math.min(window.devicePixelRatio||1,1.75);cv.width=cv.clientWidth*d;cv.height=cv.clientHeight*d;gl.viewport(0,0,cv.width,cv.height);};
    resize(); window.addEventListener("resize",resize);

    // mouse tracking
    const onMove=(e)=>{
      const nx=e.clientX/window.innerWidth;
      const ny=1-e.clientY/window.innerHeight;
      mouse.current.vx=mouse.current.vx*0.75+(nx-mouse.current.x)*0.25;
      mouse.current.vy=mouse.current.vy*0.75+(ny-mouse.current.y)*0.25;
      mouse.current.x=nx; mouse.current.y=ny;
    };
    window.addEventListener("mousemove",onMove);

    let en=0;
    const start=performance.now();
    const loop=()=>{
      mouse.current.vx*=0.92; mouse.current.vy*=0.92;
      mouse.current.speed=Math.sqrt(mouse.current.vx**2+mouse.current.vy**2);
      en+=((energy.current||0)-en)*0.06;

      const on = mouseEffRef.current ? 1.0 : 0.0;
      gl.uniform2f(uRes,cv.width,cv.height);
      gl.uniform1f(uTime,(performance.now()-start)/1000);
      gl.uniform1f(uEn,activeRef.current?en:en*0.5);
      gl.uniform1f(uMouseOn,on);
      gl.uniform2f(uMouseRef.current.uMouse,mouse.current.x,mouse.current.y);
      gl.uniform2f(uMouseRef.current.uVel,  mouse.current.vx,mouse.current.vy);
      gl.uniform1f(uMouseRef.current.uSpeed,Math.min(mouse.current.speed*28,1.0));

      gl.drawArrays(gl.TRIANGLES,0,3);
      raf.current=requestAnimationFrame(loop);
    };
    loop();

    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);window.removeEventListener("mousemove",onMove);};
  },[]);

  if(fallback) return <div style={{position:"absolute",inset:0,background:"#04090b"}}/>;
  return <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>;
}
