import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PATIENTS_DATA, Patient } from '../data/patientsData';
import {
  Volume2,
  VolumeX,
  Compass,
  Eye,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Move,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react';
import {
  speakIndonesian,
  stopSpeaking,
  playHospitalSound,
  triggerHaptic,
} from '../utils/speechUtils';

interface RobloxWorld3DProps {
  onSelectPatient: (patient: Patient) => void;
  onOpenConsultation: (patient?: Patient) => void;
  onOpenChecklist: () => void;
}

export const RobloxWorld3D: React.FC<RobloxWorld3DProps> = ({
  onSelectPatient,
  onOpenConsultation,
  onOpenChecklist,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient>(PATIENTS_DATA[0]);
  const [cameraMode, setCameraMode] = useState<'follow' | 'orbit'>('follow');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isDoctorSpeaking, setIsDoctorSpeaking] = useState(false);
  const [activeZone, setActiveZone] = useState<'all' | 'dahlia' | 'igd' | 'icu'>('all');
  const [isControlExpanded, setIsControlExpanded] = useState(true);

  // References to keep mutable 3D loop state outside React re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const doctorGroupRef = useRef<THREE.Group | null>(null);
  const doctorLimbsRef = useRef<{
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    head: THREE.Mesh;
  } | null>(null);

  const bedMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const joystickDelta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isJoystickActive = useRef<boolean>(false);
  const playerPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5));
  const playerRotation = useRef<number>(0);
  const isWalkingRef = useRef<boolean>(false);
  const walkTimeRef = useRef<number>(0);

  // Helper to create procedural textures
  const createTileTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clean hospital vinyl floor with soft grid and Roblox stud hints
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 256, 256);

      // Soft medical accent cross in corner
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(20, 20, 12, 12);
      ctx.fillRect(148, 148, 12, 12);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const createFaceTexture = (isDoctor: boolean = true) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffd8b8';
      ctx.fillRect(0, 0, 128, 128);

      if (isDoctor) {
        // Friendly doctor eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(26, 44, 20, 24);
        ctx.fillRect(82, 44, 20, 24);

        // White eye sparkles
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(30, 48, 6, 6);
        ctx.fillRect(86, 48, 6, 6);

        // Rosy cheeks
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(36, 80, 8, 0, Math.PI * 2);
        ctx.arc(92, 80, 8, 0, Math.PI * 2);
        ctx.fill();

        // Warm smile
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(64, 84, 18, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else {
        // Patient face (tired or resting)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(30, 52, 16, 12);
        ctx.fillRect(82, 52, 16, 12);

        // Gentle mouth
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(48, 88);
        ctx.lineTo(80, 88);
        ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // Build the 3D scene on mount
  useEffect(() => {
    if (!mountRef.current) return;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0f172a');
    scene.fog = new THREE.Fog('#0f172a', 30, 75);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 8, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 1. Lighting Setup: Warm Key Light + Cool Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#38bdf8', 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#fffbeb', 1.4);
    dirLight.position.set(15, 25, 20);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 80;
      const d = 35;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    scene.add(dirLight);

    // 2. Hospital Floor (Procedural Tiled Canvas)
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createTileTexture(),
      roughness: 0.35,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // 3. Hospital Walls & Architectural Partitions
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.8,
    });
    const wallTrimMat = new THREE.MeshStandardMaterial({
      color: '#0284c7', // Cyan hospital trim stripe
      roughness: 0.5,
    });

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(76, 8, 1), wallMat);
    backWall.position.set(0, 4, -28);
    scene.add(backWall);

    const backStripe = new THREE.Mesh(new THREE.BoxGeometry(76.2, 0.8, 1.05), wallTrimMat);
    backStripe.position.set(0, 2.5, -28);
    scene.add(backStripe);

    // Side walls
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 60), wallMat);
    leftWall.position.set(-36, 4, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 60), wallMat);
    rightWall.position.set(36, 4, 0);
    scene.add(rightWall);

    // 4. Central Nurse / Doctor Station Counter (Roblox Blocky Style)
    const stationGroup = new THREE.Group();
    const counterDesk = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.8, 4),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
    );
    counterDesk.position.set(0, 0.9, 0);
    counterDesk.castShadow = !isSoftwareGl;
    stationGroup.add(counterDesk);

    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(12.6, 0.2, 4.4),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.2 })
    );
    counterTop.position.set(0, 1.9, 0);
    stationGroup.add(counterTop);

    // Station Signboard "RUANG BELAJAR HIPERKES - DR. JUWITA NINDA, M.KES"
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.2, 0.2),
      new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.4 })
    );
    signBoard.position.set(0, 3.2, 0);
    stationGroup.add(signBoard);

    stationGroup.position.set(0, 0, -2);
    scene.add(stationGroup);

    // 5. Build 30 Hospital Beds with Roblox Blocky Patients
    // Arrange in 3 rows/aisles of 10 beds each
    const bedMap = new Map<number, THREE.Group>();

    PATIENTS_DATA.forEach((patient, index) => {
      const bedGroup = new THREE.Group();
      bedGroup.name = `patient_bed_${patient.id}`;

      // Calculate 3D grid layout coordinates
      let x = 0;
      let z = 0;
      let rotY = 0;

      if (index < 10) {
        // Zone 1: Dahlia Ward (Left Wing: Beds 1 to 10)
        x = -18 - (index % 2) * 8;
        z = -22 + Math.floor(index / 2) * 8;
        rotY = Math.PI / 2;
      } else if (index < 20) {
        // Zone 2: IGD & Isolasi (Right Wing: Beds 11 to 20)
        const subIdx = index - 10;
        x = 18 + (subIdx % 2) * 8;
        z = -22 + Math.floor(subIdx / 2) * 8;
        rotY = -Math.PI / 2;
      } else {
        // Zone 3: ICU, Hemodialisa, Penunjang (Center-South Wing: Beds 21 to 30)
        const subIdx = index - 20;
        x = -16 + (subIdx % 5) * 8;
        z = 14 + Math.floor(subIdx / 5) * 8;
        rotY = 0;
      }

      bedGroup.position.set(x, 0, z);
      bedGroup.rotation.y = rotY;

      // Bed Frame (Roblox Blocky)
      const bedFrame = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.6, 5.4),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 })
      );
      bedFrame.position.set(0, 0.5, 0);
      bedFrame.castShadow = !isSoftwareGl;
      bedFrame.receiveShadow = !isSoftwareGl;
      bedGroup.add(bedFrame);

      // Mattress
      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.5, 5.0),
        new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.8 })
      );
      mattress.position.set(0, 1.0, 0);
      bedGroup.add(mattress);

      // Pillow
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.35, 1.0),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 })
      );
      pillow.position.set(0, 1.35, -1.8);
      bedGroup.add(pillow);

      // Blanket
      const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(3.22, 0.2, 3.4),
        new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.8 })
      );
      blanket.position.set(0, 1.25, 0.6);
      bedGroup.add(blanket);

      // Headboard & Footboard
      const headBoard = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 1.8, 0.2),
        new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.4 })
      );
      headBoard.position.set(0, 1.2, -2.6);
      bedGroup.add(headBoard);

      // Side Guardrails (SKP 6 - Fall prevention)
      const railMat = new THREE.MeshStandardMaterial({
        color: patient.nurseSafetyDilemma.includes('side rails') ? '#ef4444' : '#64748b',
        metalness: 0.6,
      });
      const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 3.2), railMat);
      leftRail.position.set(-1.75, 1.4, 0);
      bedGroup.add(leftRail);

      const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 3.2), railMat);
      rightRail.position.set(1.75, 1.4, 0);
      bedGroup.add(rightRail);

      // 3D Blocky Roblox Patient Character lying on bed
      const patientMesh = new THREE.Group();
      // Patient Head
      const pHeadMat = new THREE.MeshStandardMaterial({
        map: createFaceTexture(false),
        roughness: 0.6,
      });
      const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), pHeadMat);
      pHead.position.set(0, 1.8, -1.7);
      pHead.rotation.x = Math.PI * 0.1; // resting angle
      patientMesh.add(pHead);

      // Patient Torso
      const pTorso = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 0.8),
        new THREE.MeshStandardMaterial({ color: '#7dd3fc', roughness: 0.7 })
      );
      pTorso.position.set(0, 1.4, -0.6);
      pTorso.rotation.x = -Math.PI / 2;
      patientMesh.add(pTorso);

      bedGroup.add(patientMesh);

      // Bedside Monitor & Stand
      const monitorPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3.2),
        new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8 })
      );
      monitorPole.position.set(2.4, 1.6, -2.0);
      bedGroup.add(monitorPole);

      const monitorBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.8, 0.5),
        new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 })
      );
      monitorBox.position.set(2.4, 2.8, -2.0);
      bedGroup.add(monitorBox);

      // Screen glow
      const screenLight = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.6),
        new THREE.MeshBasicMaterial({
          color: patient.hazardType === 'Biologis' ? '#10b981' : '#38bdf8',
        })
      );
      screenLight.position.set(2.4, 2.8, -1.74);
      bedGroup.add(screenLight);

      // Specific Hazard 3D indicator cues
      if (patient.hazardType === 'Fisik' && patient.environmentHazards.some(h => h.includes('Lantai'))) {
        // Yellow Caution Wet Floor Cone in Roblox blocky style
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 1.0, 4),
          new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.2 })
        );
        cone.position.set(-2.2, 0.5, 1.2);
        bedGroup.add(cone);
      } else if (patient.hazardType === 'Biologis') {
        // Yellow Sharps Safety Box
        const sharpsBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.7, 0.5),
          new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3 })
        );
        sharpsBox.position.set(2.4, 1.6, -1.2);
        bedGroup.add(sharpsBox);
      } else if (patient.hazardType === 'Kimia') {
        // Chemical bottle / canister
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: '#a855f7', roughness: 0.2 })
        );
        bottle.position.set(-2.2, 0.3, -1.5);
        bedGroup.add(bottle);
      }

      // Bed Number Text Badge Floating Above
      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.width = 256;
      badgeCanvas.height = 128;
      const bCtx = badgeCanvas.getContext('2d');
      if (bCtx) {
        bCtx.fillStyle = '#0284c7';
        bCtx.roundRect(10, 10, 236, 108, 20);
        bCtx.fill();

        bCtx.strokeStyle = '#ffffff';
        bCtx.lineWidth = 6;
        bCtx.stroke();

        bCtx.fillStyle = '#ffffff';
        bCtx.font = 'bold 36px sans-serif';
        bCtx.textAlign = 'center';
        bCtx.fillText(patient.bedNumber, 128, 56);

        bCtx.font = '22px sans-serif';
        bCtx.fillText(`[${patient.hazardType}]`, 128, 96);
      }
      const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
      badgeTexture.colorSpace = THREE.SRGBColorSpace;
      const badgeSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: badgeTexture, depthWrite: false })
      );
      badgeSprite.position.set(0, 3.8, 0);
      badgeSprite.scale.set(2.2, 1.1, 1);
      bedGroup.add(badgeSprite);

      scene.add(bedGroup);
      bedMap.set(patient.id, bedGroup);
    });

    bedMeshesRef.current = bedMap;

    // 6. dr. Juwita Ninda, M.Kes - 3D Roblox Character Model
    const doctorGroup = new THREE.Group();
    doctorGroup.position.set(playerPosition.current.x, 0, playerPosition.current.z);

    // Roblox Character Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#ffd8b8',
      roughness: 0.5,
    });
    const sneliMat = new THREE.MeshStandardMaterial({
      color: '#ffffff', // White Doctor Sneli Coat
      roughness: 0.35,
    });
    const scrubMat = new THREE.MeshStandardMaterial({
      color: '#0284c7', // Cyan scrubs
      roughness: 0.6,
    });
    const hijabMat = new THREE.MeshStandardMaterial({
      color: '#1e293b', // Dark neat hijab/hair
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: '#0369a1',
      roughness: 0.7,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.4,
    });

    // Torso: 2.0w x 2.0h x 1.0d (Classic Roblox Torso)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.8), sneliMat);
    torso.position.set(0, 2.0, 0);
    torso.castShadow = !isSoftwareGl;
    doctorGroup.add(torso);

    // Stethoscope around neck
    const stethTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 8, 16, Math.PI * 1.2),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8 })
    );
    stethTorus.rotation.x = Math.PI / 2;
    stethTorus.position.set(0, 2.5, 0.3);
    doctorGroup.add(stethTorus);

    // Head: 1.2w x 1.2h x 1.2d Cube with Face Texture
    const faceMat = new THREE.MeshStandardMaterial({
      map: createFaceTexture(true),
      roughness: 0.5,
    });
    const headMats = [
      skinMat, // right
      skinMat, // left
      hijabMat, // top
      skinMat, // bottom
      faceMat, // front
      hijabMat, // back
    ];
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), headMats);
    head.position.set(0, 3.4, 0);
    head.castShadow = !isSoftwareGl;
    doctorGroup.add(head);

    // Doctor Visor Cap
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.25, 1.2),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
    );
    cap.position.set(0, 4.0, 0);
    doctorGroup.add(cap);

    // Left Arm (pivot at shoulder)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-1.25, 2.7, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.5, 0.7), sneliMat);
    leftArmMesh.position.set(0, -0.75, 0);
    leftArmMesh.castShadow = !isSoftwareGl;
    leftArmGroup.add(leftArmMesh);
    doctorGroup.add(leftArmGroup);

    // Right Arm (pivot at shoulder)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(1.25, 2.7, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.5, 0.7), sneliMat);
    rightArmMesh.position.set(0, -0.75, 0);
    rightArmMesh.castShadow = !isSoftwareGl;
    rightArmGroup.add(rightArmMesh);

    // Doctor Clipboard in right hand
    const clipBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.0, 0.1),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3 })
    );
    clipBoard.position.set(0.1, -1.2, 0.3);
    clipBoard.rotation.x = Math.PI * 0.2;
    rightArmGroup.add(clipBoard);
    doctorGroup.add(rightArmGroup);

    // Left Leg (pivot at hip)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.45, 1.2, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), pantsMat);
    leftLegMesh.position.set(0, -0.7, 0);
    leftLegMesh.castShadow = !isSoftwareGl;
    leftLegGroup.add(leftLegMesh);
    doctorGroup.add(leftLegGroup);

    // Right Leg (pivot at hip)
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.45, 1.2, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), pantsMat);
    rightLegMesh.position.set(0, -0.7, 0);
    rightLegMesh.castShadow = !isSoftwareGl;
    rightLegGroup.add(rightLegMesh);
    doctorGroup.add(rightLegGroup);

    // Floating Name Label "dr. Juwita Ninda, M.Kes"
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 384;
    nameCanvas.height = 96;
    const nCtx = nameCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      nCtx.roundRect(10, 10, 364, 76, 20);
      nCtx.fill();
      nCtx.strokeStyle = '#38bdf8';
      nCtx.lineWidth = 4;
      nCtx.stroke();
      nCtx.fillStyle = '#ffffff';
      nCtx.font = 'bold 30px sans-serif';
      nCtx.textAlign = 'center';
      nCtx.fillText('dr. Juwita Ninda, M.Kes', 192, 48);
      nCtx.font = '20px sans-serif';
      nCtx.fillStyle = '#38bdf8';
      nCtx.fillText('Dosen & Dokter HIPERKES', 192, 72);
    }
    const nameTexture = new THREE.CanvasTexture(nameCanvas);
    nameTexture.colorSpace = THREE.SRGBColorSpace;
    const nameSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: nameTexture, depthWrite: false })
    );
    nameSprite.position.set(0, 4.8, 0);
    nameSprite.scale.set(3.2, 0.8, 1);
    doctorGroup.add(nameSprite);

    scene.add(doctorGroup);
    doctorGroupRef.current = doctorGroup;
    doctorLimbsRef.current = {
      leftArm: leftArmMesh,
      rightArm: rightArmMesh,
      leftLeg: leftLegMesh,
      rightLeg: rightLegMesh,
      head: head,
    };

    // 7. Raycasting for Clicking Beds in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr && curr.parent && curr.parent !== scene) {
            if (curr.name.startsWith('patient_bed_')) {
              const patientId = parseInt(curr.name.replace('patient_bed_', ''), 10);
              const foundPatient = PATIENTS_DATA.find((p) => p.id === patientId);
              if (foundPatient) {
                triggerHaptic('medium');
                playHospitalSound('beep');
                setSelectedPatient(foundPatient);
                onSelectPatient(foundPatient);

                // Smoothly walk or face toward the selected bed
                const targetPos = curr.position.clone();
                playerPosition.current.x = targetPos.x + (targetPos.x > 0 ? -3.5 : 3.5);
                playerPosition.current.z = targetPos.z;
                playerRotation.current = Math.atan2(
                  targetPos.x - playerPosition.current.x,
                  targetPos.z - playerPosition.current.z
                );
              }
              return;
            }
            curr = curr.parent;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Keyboard Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize Handler
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 8. Main 3D Animation Loop with Smooth Roblox Kinematics
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Movement vectors from keys or touch joystick
      let moveX = 0;
      let moveZ = 0;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveZ -= 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveZ += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveX -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveX += 1;

      // Combine with touch joystick
      if (isJoystickActive.current) {
        moveX += joystickDelta.current.x;
        moveZ += joystickDelta.current.y;
      }

      const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;
      isWalkingRef.current = isMoving;

      if (isMoving) {
        const speed = 7.5;
        const moveAngle = Math.atan2(moveX, moveZ);
        playerRotation.current = THREE.MathUtils.damp(
          playerRotation.current,
          moveAngle,
          12,
          delta
        );

        const vx = Math.sin(moveAngle) * speed * delta;
        const vz = Math.cos(moveAngle) * speed * delta;

        // Keep inside hospital boundaries
        playerPosition.current.x = THREE.MathUtils.clamp(
          playerPosition.current.x + vx,
          -32,
          32
        );
        playerPosition.current.z = THREE.MathUtils.clamp(
          playerPosition.current.z + vz,
          -25,
          25
        );

        walkTimeRef.current += delta * 12;
      } else {
        walkTimeRef.current = THREE.MathUtils.damp(walkTimeRef.current, 0, 8, delta);
      }

      // Update Roblox character position & rotation
      if (doctorGroupRef.current) {
        doctorGroupRef.current.position.x = playerPosition.current.x;
        doctorGroupRef.current.position.z = playerPosition.current.z;
        doctorGroupRef.current.rotation.y = playerRotation.current;

        // Roblox Limb Swing Kinematics
        const limbSwing = Math.sin(walkTimeRef.current) * 0.7;
        const limbs = doctorLimbsRef.current;
        if (limbs) {
          limbs.leftLeg.rotation.x = limbSwing;
          limbs.rightLeg.rotation.x = -limbSwing;
          limbs.leftArm.rotation.x = -limbSwing * 0.8;
          limbs.rightArm.rotation.x = limbSwing * 0.8;

          // Cute subtle Roblox head tilt
          limbs.head.position.y = 3.4 + Math.abs(Math.sin(walkTimeRef.current * 0.5)) * 0.06;
        }
      }

      // Camera Follow Behavior
      if (cameraRef.current && doctorGroupRef.current) {
        const targetCamX = playerPosition.current.x - Math.sin(playerRotation.current) * 8;
        const targetCamZ = playerPosition.current.z - Math.cos(playerRotation.current) * 8;
        const targetCamY = 6.5;

        cameraRef.current.position.x = THREE.MathUtils.damp(
          cameraRef.current.position.x,
          targetCamX,
          6,
          delta
        );
        cameraRef.current.position.y = THREE.MathUtils.damp(
          cameraRef.current.position.y,
          targetCamY,
          6,
          delta
        );
        cameraRef.current.position.z = THREE.MathUtils.damp(
          cameraRef.current.position.z,
          targetCamZ,
          6,
          delta
        );

        cameraRef.current.lookAt(
          playerPosition.current.x,
          playerPosition.current.y + 2.0,
          playerPosition.current.z
        );
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  // Teleport/Navigate directly to a bed
  const handleJumpToBed = (patientId: number) => {
    triggerHaptic('medium');
    playHospitalSound('click');
    const p = PATIENTS_DATA.find((item) => item.id === patientId);
    if (!p) return;

    setSelectedPatient(p);
    onSelectPatient(p);

    const bedGroup = bedMeshesRef.current.get(patientId);
    if (bedGroup) {
      const bPos = bedGroup.position;
      playerPosition.current.x = bPos.x + (bPos.x > 0 ? -3.5 : 3.5);
      playerPosition.current.z = bPos.y ? bPos.z : bPos.z + 1.5;
      playerRotation.current = Math.atan2(
        bPos.x - playerPosition.current.x,
        bPos.z - playerPosition.current.z
      );
    }
  };

  // Speak patient voice
  const handleSpeakPatient = () => {
    triggerHaptic('light');
    if (isPlayingVoice) {
      stopSpeaking();
      setIsPlayingVoice(false);
      return;
    }

    playHospitalSound('beep');
    setIsPlayingVoice(true);
    speakIndonesian(selectedPatient.patientVoicePrompt, {
      pitch: selectedPatient.patientVoicePitch,
      rate: selectedPatient.patientVoiceRate,
      onStart: () => setIsPlayingVoice(true),
      onEnd: () => setIsPlayingVoice(false),
      onError: () => setIsPlayingVoice(false),
    });
  };

  // Doctor lecture / guidance voice
  const handleDoctorSpeak = () => {
    triggerHaptic('medium');
    if (isDoctorSpeaking) {
      stopSpeaking();
      setIsDoctorSpeaking(false);
      return;
    }

    playHospitalSound('beep');
    setIsDoctorSpeaking(true);
    const speechText = `Halo Rekan Mahasiswa Keperawatan! Saya dokter Juwita Ninda. Pada pasien ${selectedPatient.name} di ${selectedPatient.bedNumber}, kita mengamati bahaya ${selectedPatient.hazardType}. Ingat selalu prinsip: Keselamatan Tenaga Kesehatan melindungi Pasien. Terapkan hierarki pengendalian sebelum memulai tindakan!`;

    speakIndonesian(speechText, {
      pitch: 1.05,
      rate: 1.0,
      onStart: () => setIsDoctorSpeaking(true),
      onEnd: () => setIsDoctorSpeaking(false),
      onError: () => setIsDoctorSpeaking(false),
    });
  };

  // Touch Virtual Joystick Handlers for Mobile / Android
  const joystickTouchStartRef = useRef<{ startX: number; startY: number } | null>(null);

  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    joystickTouchStartRef.current = { startX: touch.clientX, startY: touch.clientY };
    isJoystickActive.current = true;
    triggerHaptic('light');
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (!joystickTouchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickTouchStartRef.current.startX;
    const dy = touch.clientY - joystickTouchStartRef.current.startY;
    const maxDist = 45;

    const normX = Math.max(-1, Math.min(1, dx / maxDist));
    const normY = Math.max(-1, Math.min(1, dy / maxDist));

    joystickDelta.current = { x: normX, y: normY };
  };

  const handleJoystickTouchEnd = () => {
    joystickTouchStartRef.current = null;
    joystickDelta.current = { x: 0, y: 0 };
    isJoystickActive.current = false;
  };

  return (
    <div className="relative w-full h-[650px] sm:h-[720px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD: Title, Doctor Badge & Quick Bed Selector */}
      <div className="absolute top-4 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
        {/* Title & Doctor Badge */}
        <div className="bg-slate-900/90 border border-slate-700/80 p-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wider">
                Ruang Belajar HIPERKES 3D Roblox
              </span>
              <span className="text-[10px] bg-sky-950 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-800">
                Mahasiswa Keperawatan
              </span>
            </div>
            <h2 className="text-sm font-bold text-white">
              dr. Juwita Ninda, M.Kes <span className="text-xs text-slate-400 font-normal">· Dosen Pembimbing</span>
            </h2>
          </div>
        </div>

        {/* Quick Bed Selector & Checklist Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <select
            value={selectedPatient.id}
            onChange={(e) => handleJumpToBed(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-900/90 text-white border border-slate-700 rounded-xl px-3 py-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {PATIENTS_DATA.map((p) => (
              <option key={p.id} value={p.id}>
                {p.bedNumber} - {p.name} ({p.hazardType})
              </option>
            ))}
          </select>

          <button
            onClick={onOpenChecklist}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Checklist 7 Langkah</span>
          </button>
        </div>
      </div>

      {/* Floating Instructions for Desktop Keyboard Controls */}
      <div className="hidden lg:flex absolute top-20 left-4 bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 px-3 py-2 rounded-xl pointer-events-none items-center gap-3">
        <span>🎮 Kontrol Jalan: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">W</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">A</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">S</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">D</kbd></span>
        <span>🖱️ Klik ranjang pasien mana pun untuk mendekat!</span>
      </div>

      {/* Mobile Android On-Screen Virtual Joystick (Left Thumb) */}
      <div
        className="sm:hidden absolute bottom-24 left-4 w-28 h-28 rounded-full bg-slate-900/70 border-2 border-sky-500/40 flex items-center justify-center touch-none select-none z-30"
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
      >
        <div className="w-12 h-12 rounded-full bg-sky-500/80 shadow-md flex items-center justify-center text-white text-xs font-bold pointer-events-none">
          <Move className="w-5 h-5" />
        </div>
      </div>

      {/* Mobile Android Quick Action Buttons (Right Thumb) */}
      <div className="sm:hidden absolute bottom-24 right-4 flex flex-col gap-2 z-30">
        <button
          onClick={handleSpeakPatient}
          className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg active:scale-95"
          title="Suara Pasien"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        <button
          onClick={handleDoctorSpeak}
          className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg active:scale-95"
          title="Bimbingan dr. Juwita"
        >
          <Stethoscope className="w-5 h-5" />
        </button>

        <button
          onClick={() => onOpenConsultation(selectedPatient)}
          className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95"
          title="Konsultasi AI Pasien"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Consolidated Bottom Dock: Selected Bedside Patient Overview & Actions */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl transition-all duration-300 z-20 ${
          isControlExpanded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-60'
        }`}
      >
        {/* Toggle Collapse/Expand handle */}
        <button
          onClick={() => setIsControlExpanded(!isControlExpanded)}
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-0.5 rounded-t-lg border-t border-x border-slate-700 hover:text-white"
        >
          {isControlExpanded ? '▾ Sembunyikan Panel' : '▴ Buka Panel Pasien'}
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Bed & Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-sky-600 text-white">
                {selectedPatient.bedNumber}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedPatient.room} · {selectedPatient.unit}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  selectedPatient.hazardType === 'Biologis'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : selectedPatient.hazardType === 'Kimia'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : selectedPatient.hazardType === 'Fisik'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : selectedPatient.hazardType === 'Ergonomi'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                Bahaya {selectedPatient.hazardType}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                {selectedPatient.name} ({selectedPatient.age} th)
              </h3>
              <span className="text-xs text-slate-400 truncate">
                - {selectedPatient.diagnosis}
              </span>
            </div>

            <p className="text-xs text-amber-300/90 truncate mt-0.5">
              ⚠️ {selectedPatient.nurseSafetyDilemma}
            </p>
          </div>

          {/* Quick Voice & Case Interaction Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={handleSpeakPatient}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isPlayingVoice
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
              }`}
            >
              {isPlayingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingVoice ? 'Stop Suara' : 'Suara Pasien'}</span>
            </button>

            <button
              onClick={handleDoctorSpeak}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDoctorSpeaking
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>{isDoctorSpeaking ? 'Stop Dokter' : 'Bimbingan dr. Juwita'}</span>
            </button>

            <button
              onClick={() => onOpenConsultation(selectedPatient)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Tanya AI & Tangani</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
