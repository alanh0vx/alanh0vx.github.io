/* scene.js — three.js scene: room shell + props, look-around camera fixed at
 * the room centre, tap-vs-drag pointer handling, raycast picking, highlight
 * pulse for props that still hold secrets, door-open animation. */

import * as THREE from 'three';
import { buildRoomShell, buildProp } from './props.js';

const EYE_HEIGHT = 1.5;
const PITCH_MAX = 1.25;
const FOV_MIN = 40, FOV_MAX = 72, FOV_DEFAULT = 60;

export class RoomScene {
  constructor(container, room, { onTap } = {}) {
    this.container = container;
    this.room = room;
    this.onTap = onTap || (() => {});
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.canvas.style.touchAction = 'none';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#101418');

    this.camera = new THREE.PerspectiveCamera(FOV_DEFAULT, 1, 0.05, 60);
    this.camera.position.set(0, EYE_HEIGHT, 0);

    // gentle indoor light rig — no shadow maps (mobile perf)
    this.scene.add(new THREE.AmbientLight('#ffffff', 0.55));
    this.scene.add(new THREE.HemisphereLight('#fff4dd', '#3a3630', 0.55));
    const ceiling = new THREE.PointLight('#ffedc0', 28, 0, 1.8);
    ceiling.position.set(0, room.room.h - 0.25, 0);
    this.scene.add(ceiling);

    this.scene.add(buildRoomShell(room));
    this.propGroups = {};
    this.badges = {};
    this.doorPivot = null;
    for (const prop of room.props) {
      const g = buildProp(prop, room);
      this.propGroups[prop.id] = g;
      this.scene.add(g);
      if (g.userData.doorPivot) this.doorPivot = g.userData.doorPivot;
      g.traverse((o) => {
        if (o.userData && o.userData.lockId) this.badges[o.userData.lockId] = o;
      });
    }

    // camera state (targets are eased toward each frame)
    this.yaw = this._yawToward(room.props.find((p) => p.id === 'door'));
    this.pitch = 0;
    this.yawT = this.yaw;
    this.pitchT = this.pitch;
    this.fovT = FOV_DEFAULT;
    this.doorOpenT = 0;
    this.doorOpen = 0;
    this.hoverId = null;
    this._hoverXY = null;
    this._hoverTick = 0;
    this.canvas.style.cursor = 'grab';

    this.raycaster = new THREE.Raycaster();
    this._bindPointer();
    this._bindResize();

    this.clock = new THREE.Clock();
    this.running = true;
    const loop = () => {
      if (this.disposed) return;
      requestAnimationFrame(loop);
      if (!this.running || document.hidden) return;
      this._frame(Math.min(this.clock.getDelta(), 0.1));
    };
    this._resize();
    loop();
  }

  _yawToward(prop) {
    if (!prop) return 0;
    return Math.atan2(prop.pos[0], prop.pos[2]);
  }

  /** Ease the camera to face a prop (used when the inspect panel opens). */
  lookAt(propId) {
    const prop = this.room.props.find((p) => p.id === propId);
    if (!prop) return;
    let target = Math.atan2(prop.pos[0], prop.pos[2]);
    // unwrap so we take the short way around
    while (target - this.yawT > Math.PI) target -= Math.PI * 2;
    while (target - this.yawT < -Math.PI) target += Math.PI * 2;
    this.yawT = target;
    const y = (prop.pos[1] || 0) + 0.55;
    const dist = Math.hypot(prop.pos[0], prop.pos[2]) || 1;
    this.pitchT = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, Math.atan2(y - EYE_HEIGHT, dist)));
  }

  setLockSolved(lockId) {
    const badge = this.badges[lockId];
    if (badge) badge.visible = false;
  }

  openDoor() { this.doorOpenT = 1; }

  syncState(game) {
    game.room.locks.forEach((l) => {
      if (game.solvedLocks.has(l.id)) this.setLockSolved(l.id);
    });
    if (game.doorOpen()) this.openDoor();
  }

  // ------------------------------------------------------------- input

  _bindPointer() {
    const c = this.canvas;
    this.pointers = new Map();
    this.pinchDist = 0;
    let down = null;

    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
      } else if (this.pointers.size === 2) {
        const pts = [...this.pointers.values()];
        this.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        down = null;
      }
    });

    c.addEventListener('pointermove', (e) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) {
        // hover (mouse only, no buttons down) — drives cursor + highlight
        if (e.pointerType === 'mouse' && this.pointers.size === 0) {
          this._hoverXY = { x: e.clientX, y: e.clientY };
        }
        return;
      }
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        if (down) down.moved += Math.abs(dx) + Math.abs(dy);
        const k = 0.0032 * (this.camera.fov / FOV_DEFAULT);
        this.yawT += dx * k;
        this.pitchT = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, this.pitchT + dy * k));
      } else if (this.pointers.size === 2) {
        const pts = [...this.pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this.pinchDist > 0) {
          this.fovT = Math.max(FOV_MIN, Math.min(FOV_MAX, this.fovT * (this.pinchDist / dist)));
        }
        this.pinchDist = dist;
      }
    });

    const end = (e) => {
      this.pointers.delete(e.pointerId);
      if (down && this.pointers.size === 0) {
        const dt = performance.now() - down.t;
        const thresh = e.pointerType === 'touch' ? 12 : 8;
        if (dt < 350 && down.moved < thresh) this._tap(e.clientX, e.clientY);
        down = null;
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.fovT = Math.max(FOV_MIN, Math.min(FOV_MAX, this.fovT + e.deltaY * 0.02));
    }, { passive: false });
  }

  /** Raycast a client-space point → propId or null. */
  _pick(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((cx - rect.left) / rect.width) * 2 - 1,
      -((cy - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const groups = Object.values(this.propGroups);
    const hits = this.raycaster.intersectObjects(groups, true);
    for (const hit of hits) {
      let o = hit.object;
      while (o && !o.userData.propId) o = o.parent;
      if (o && o.userData.propId) return o.userData.propId;
    }
    return null;
  }

  _tap(cx, cy) {
    this.onTap(this._pick(cx, cy));
  }

  /** Steady hover highlight: tint the prop under the cursor and switch the
   *  cursor to a finger pointer. Original emissive values are saved so props
   *  with their own glow (bulbs, door light) restore cleanly. */
  _setHover(id) {
    if (id === this.hoverId) return;
    const old = this.propGroups[this.hoverId];
    if (old) {
      old.traverse((o) => {
        if (o.isMesh && o.userData._origEmissive !== undefined) {
          o.material.emissive.setHex(o.userData._origEmissive);
          o.material.emissiveIntensity = o.userData._origInt;
          delete o.userData._origEmissive;
          delete o.userData._origInt;
        }
      });
    }
    this.hoverId = id;
    const g = this.propGroups[id];
    if (g) {
      g.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) {
          o.userData._origEmissive = o.material.emissive.getHex();
          o.userData._origInt = o.material.emissiveIntensity;
          o.material.emissive.set('#ffd98a');
          o.material.emissiveIntensity = Math.max(0.22, o.userData._origInt);
        }
      });
    }
  }

  // ------------------------------------------------------------- frame loop

  _frame(dt) {
    const ease = this.reducedMotion ? 1 : Math.min(1, dt * 9);
    this.yaw += (this.yawT - this.yaw) * ease;
    this.pitch += (this.pitchT - this.pitch) * ease;
    if (Math.abs(this.camera.fov - this.fovT) > 0.05) {
      this.camera.fov += (this.fovT - this.camera.fov) * ease;
      this.camera.updateProjectionMatrix();
    }
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotateY(this.yaw + Math.PI); // yaw 0 faces -z; our yaw is atan2(x, z) toward +z
    this.camera.rotateX(this.pitch);

    // door swing
    if (this.doorPivot && this.doorOpen < this.doorOpenT) {
      this.doorOpen = Math.min(this.doorOpenT, this.doorOpen + (this.reducedMotion ? 1 : dt * 0.9));
      this.doorPivot.rotation.y = -this.doorOpen * 1.9;
    }

    // hover pick (throttled — the camera may still be easing under the cursor)
    if (this.pointers.size > 0) {
      this.canvas.style.cursor = 'grabbing';
      this._setHover(null);
    } else if (this._hoverXY && (this._hoverTick = (this._hoverTick + 1) % 4) === 0) {
      const id = this._pick(this._hoverXY.x, this._hoverXY.y);
      this._setHover(id);
      this.canvas.style.cursor = id ? 'pointer' : 'grab';
    }

    this.renderer.render(this.scene, this.camera);
  }

  // ------------------------------------------------------------- lifecycle

  _bindResize() {
    this._resizeHandler = () => this._resize();
    window.addEventListener('resize', this._resizeHandler);
    window.addEventListener('orientationchange', this._resizeHandler);
  }

  _resize() {
    const wpx = this.container.clientWidth || window.innerWidth;
    const hpx = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = wpx / hpx;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(wpx, hpx);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('orientationchange', this._resizeHandler);
    this.scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    this.renderer.dispose();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
