import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Volume2,
  VolumeX,
  Stethoscope,
  Move,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Play,
  RotateCcw,
  Pause,
  X,
  Sparkles,
  Info,
  BookOpen,
  FileCheck,
  ArrowRight,
  User,
  Heart,
} from 'lucide-react';
import {
  speakIndonesian,
  stopSpeaking,
  playHospitalSound,
  triggerHaptic,
  unlockAudioSystem,
  isAudioSystemUnlocked,
} from '../utils/speechUtils';
import { PATIENTS_DATA } from '../data/patientsData';

export interface VirtualHospital3DGameProps {
  onOpenHandbook?: () => void;
  onOpenSlides?: () => void;
  onOpenQuiz?: () => void;
  onOpenChecklist?: () => void;
  onOpenAiConsultation?: (patient?: any) => void;
}

interface InteractableEntity {
  id: string;
  type: 'npc_patient' | 'npc_nurse' | 'obj_bed' | 'obj_wheelchair' | 'obj_sink' | 'obj_sharps' | 'obj_ppe';
  name: string;
  position: THREE.Vector3;
  radius: number;
  label: string;
}

interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const VirtualHospital3DGame: React.FC<VirtualHospital3DGameProps> = ({
  onOpenHandbook,
  onOpenSlides,
  onOpenQuiz,
  onOpenChecklist,
  onOpenAiConsultation,
}) => {
  // Game state
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'paused'>('welcome');
  const [currentZone, setCurrentZone] = useState<string>('Koridor Utama');
  const [nearbyEntity, setNearbyEntity] = useState<InteractableEntity | null>(null);
  const [isAudioUnlockedState, setIsAudioUnlockedState] = useState(isAudioSystemUnlocked());
  const [activeDialogue, setActiveDialogue] = useState<{
    entity: InteractableEntity;
    step: number;
    speakerName: string;
    speakerRole: string;
    text: string;
    options: { text: string; nextStep?: number; feedback?: string; isCorrect?: boolean }[];
  } | null>(null);

  const [activeInspection, setActiveInspection] = useState<{
    title: string;
    category: string;
    description: string;
    rules: string[];
    safetyTip: string;
  } | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [safetyPoints, setSafetyPoints] = useState(0);
  const [inspectedObjects, setInspectedObjects] = useState<string[]>([]);
  const [showControlsHelp, setShowControlsHelp] = useState(false);

  // References
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const playerLimbsRef = useRef<{
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
  } | null>(null);

  // Character movement physics & state
  const playerPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 8)); // starts in corridor
  const playerRot = useRef<number>(Math.PI); // facing north
  const cameraAngle = useRef<{ theta: number; phi: number }>({ theta: 0, phi: 0.35 });
  const isDraggingCamera = useRef<boolean>(false);
  const prevPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const joystickDelta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isJoystickActive = useRef<boolean>(false);
  const walkTimeRef = useRef<number>(0);

  // All interactables in the hospital floor
  const interactablesRef = useRef<InteractableEntity[]>([
    {
      id: 'patient_hartono',
      type: 'npc_patient',
      name: 'Tn. Hartono (Pasien Post-Op)',
      position: new THREE.Vector3(-12, 0, -8),
      radius: 3.5,
      label: 'Bicara dengan Tn. Hartono',
    },
    {
      id: 'nurse_ratna',
      type: 'npc_nurse',
      name: 'Ners Ratna, S.Kep (Perawat Bangsal)',
      position: new THREE.Vector3(10, 0, -4),
      radius: 3.5,
      label: 'Konsultasi dengan Ners Ratna',
    },
    {
      id: 'bed_101',
      type: 'obj_bed',
      name: 'Tempat Tidur Pasien & Side Rails',
      position: new THREE.Vector3(-12, 0, -8),
      radius: 3.2,
      label: 'Periksa Pengaman Tempat Tidur (SKP 6)',
    },
    {
      id: 'wheelchair_101',
      type: 'obj_wheelchair',
      name: 'Kursi Roda Pasien',
      position: new THREE.Vector3(-7.5, 0, -4.5),
      radius: 2.8,
      label: 'Periksa Kursi Roda & Rem Transfer',
    },
    {
      id: 'sink_102',
      type: 'obj_sink',
      name: 'Wastafel Cuci Tangan 6 Langkah WHO',
      position: new THREE.Vector3(-14, 0, 10),
      radius: 2.8,
      label: 'Praktik Cuci Tangan WHO (SKP 5 / PPI)',
    },
    {
      id: 'sharps_102',
      type: 'obj_sharps',
      name: 'Safety Box Benda Tajam & Limbah B3',
      position: new THREE.Vector3(-8, 0, 6.5),
      radius: 2.8,
      label: 'Periksa Safety Box Benda Tajam K3',
    },
    {
      id: 'ppe_102',
      type: 'obj_ppe',
      name: 'Lemari APD (Alat Pelindung Diri)',
      position: new THREE.Vector3(-14, 0, 4),
      radius: 3.0,
      label: 'Inspeksi Lemari APD K3RS',
    },
  ]);

  // Collision Boxes (Hospital Walls, Room Partitions, Counters)
  // Hallway is from x: -5 to x: 5, z: -14 to 14
  // Room 101 is x: -17 to -5, z: -14 to -1 (door at x: -5, z: -8)
  // Room 102 is x: -17 to -5, z: 1 to 14 (door at x: -5, z: 8)
  // Nurse Station is x: 5 to 16, z: -12 to 0
  // Waiting Area is x: 5 to 16, z: 2 to 14
  const collisionBoxesRef = useRef<CollisionBox[]>([
    // Outer perimeter walls
    { minX: -18, maxX: 18, minZ: -16, maxZ: -14.5 }, // North wall
    { minX: -18, maxX: 18, minZ: 14.5, maxZ: 16 }, // South wall
    { minX: -18, maxX: -16.5, minZ: -15, maxZ: 15 }, // West wall
    { minX: 16.5, maxX: 18, minZ: -15, maxZ: 15 }, // East wall

    // Room 101 Divider Walls with Doorway at z: -9 to -7
    { minX: -5.5, maxX: -4.5, minZ: -15, maxZ: -9 }, // Room 101 wall north of door
    { minX: -5.5, maxX: -4.5, minZ: -7, maxZ: 0 }, // Room 101 wall south of door
    { minX: -17, maxX: -5, minZ: -0.5, maxZ: 0.5 }, // Wall between Room 101 and Room 102

    // Room 102 Divider Walls with Doorway at z: 7 to 9
    { minX: -5.5, maxX: -4.5, minZ: 0, maxZ: 7 }, // Room 102 wall north of door
    { minX: -5.5, maxX: -4.5, minZ: 9, maxZ: 15 }, // Room 102 wall south of door

    // Nurse Station Counter (solid)
    { minX: 6, maxX: 13, minZ: -7, maxZ: -2 },

    // Waiting Area Furniture
    { minX: 7, maxX: 14, minZ: 5, maxZ: 7.5 },
  ]);

  // Check collision with bounding boxes
  const checkCollision = (nextX: number, nextZ: number, radius = 0.55): boolean => {
    for (const box of collisionBoxesRef.current) {
      if (
        nextX + radius > box.minX &&
        nextX - radius < box.maxX &&
        nextZ + radius > box.minZ &&
        nextZ - radius < box.maxZ
      ) {
        return true; // Collision detected
      }
    }
    return false;
  };

  // Helper to create procedural tile texture
  const createTileTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 256, 256);

      // Subtle medical cross logo in tile corner
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(16, 16, 12, 12);
      ctx.fillRect(144, 144, 12, 12);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // Helper to create face texture
  const createFaceTexture = (isNurse = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffd8b8';
      ctx.fillRect(0, 0, 128, 128);

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, 48, 18, 22);
      ctx.fillRect(82, 48, 18, 22);

      // Eye highlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(32, 52, 6, 6);
      ctx.fillRect(86, 52, 6, 6);

      // Smile
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(64, 88, 16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Cheeks
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(32, 82, 8, 0, Math.PI * 2);
      ctx.arc(96, 82, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // Setup 3D Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Detect software rendering
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#f0f9ff'); // Fresh soft hospital sky
    scene.fog = new THREE.Fog('#f0f9ff', 28, 55);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 1. Lighting Setup
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#e0f2fe', 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 1.25);
    sunLight.position.set(12, 22, 16);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.bias = -0.0005;
    }
    scene.add(sunLight);

    // Warm ceiling downlights
    const createCeilingLight = (x: number, y: number, z: number, color = '#38bdf8') => {
      const pLight = new THREE.PointLight(color, 0.45, 12);
      pLight.position.set(x, y, z);
      scene.add(pLight);

      // Light fixture fixture mesh
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.1, 0.8),
        new THREE.MeshStandardMaterial({
          color: '#ffffff',
          emissive: '#e0f2fe',
          emissiveIntensity: 0.6,
        })
      );
      fixture.position.set(x, y + 0.1, z);
      scene.add(fixture);
    };

    createCeilingLight(0, 5.0, -8);
    createCeilingLight(0, 5.0, 0);
    createCeilingLight(0, 5.0, 8);
    createCeilingLight(-11, 5.0, -8);
    createCeilingLight(-11, 5.0, 8);
    createCeilingLight(10, 5.0, -5);

    // 2. Floor plane
    const floorGeo = new THREE.PlaneGeometry(36, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createTileTexture(),
      roughness: 0.25,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Central corridor yellow guideline strip (Hospital floor safety navigation)
    const lineGeo = new THREE.PlaneGeometry(0.35, 26);
    const lineMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
    const corridorLine = new THREE.Mesh(lineGeo, lineMat);
    corridorLine.rotation.x = -Math.PI / 2;
    corridorLine.position.set(0, 0.01, 0);
    scene.add(corridorLine);

    // 3. Wall Construction Materials
    const wallMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
    const wallTrimMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 }); // Hospital blue stripe

    const createWallSection = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = !isSoftwareGl;
      mesh.receiveShadow = !isSoftwareGl;
      scene.add(mesh);

      // Blue decorative safety stripe on wall
      const stripeH = 0.45;
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(w > d ? w + 0.02 : w, stripeH, d > w ? d + 0.02 : d),
        wallTrimMat
      );
      stripe.position.set(x, 1.8, z);
      scene.add(stripe);
    };

    // North wall
    createWallSection(36, 5.5, 0.8, 0, 2.75, -15);
    // South wall
    createWallSection(36, 5.5, 0.8, 0, 2.75, 15);
    // West wall
    createWallSection(0.8, 5.5, 30, -17.5, 2.75, 0);
    // East wall
    createWallSection(0.8, 5.5, 30, 17.5, 2.75, 0);

    // Room 101 Divider (Doorway gap between z: -9 and -7)
    createWallSection(0.8, 5.5, 6, -5, 2.75, -12); // north of door
    createWallSection(0.8, 5.5, 7, -5, 2.75, -3.5); // south of door
    // Wall header above door 101
    const door101Header = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 2.2), wallMat);
    door101Header.position.set(-5, 4.75, -8);
    scene.add(door101Header);

    // Partition wall between Room 101 and Room 102
    createWallSection(12.5, 5.5, 0.8, -11.25, 2.75, 0);

    // Room 102 Divider (Doorway gap between z: 7 and 9)
    createWallSection(0.8, 5.5, 7, -5, 2.75, 3.5); // north of door
    createWallSection(0.8, 5.5, 6, -5, 2.75, 12); // south of door
    // Wall header above door 102
    const door102Header = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 2.2), wallMat);
    door102Header.position.set(-5, 4.75, 8);
    scene.add(door102Header);

    // 4. Directional Signs above doorways
    const createSignboard = (text: string, x: number, y: number, z: number, color = '#0284c7') => {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.roundRect(10, 10, 364, 76, 16);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, 192, 54);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.6, 0.1),
        new THREE.MeshBasicMaterial({ map: texture })
      );
      signMesh.position.set(x, y, z);
      scene.add(signMesh);
    };

    createSignboard('🚪 KAMAR 101 (BEDAH)', -5.1, 3.8, -8);
    createSignboard('🚪 KAMAR 102 (ISOLASI & PPI)', -5.1, 3.8, 8);
    createSignboard('🏥 NURSE STATION TERPADU', 10, 3.6, -7.5);
    createSignboard('🛋️ RUANG TUNGGU KELUARGA', 10, 3.6, 2.5, '#059669');

    // 5. Furniture & Medical Equipments
    // A. Bed in Room 101 with resting Patient Tn. Hartono
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-12, 0, -8);

    // Frame
    const bedFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.6, 5.4),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
    );
    bedFrame.position.set(0, 0.5, 0);
    bedGroup.add(bedFrame);

    // Mattress
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.5, 5.0),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.8 })
    );
    mattress.position.set(0, 1.0, 0);
    bedGroup.add(mattress);

    // Blanket
    const blanket = new THREE.Mesh(
      new THREE.BoxGeometry(3.22, 0.25, 3.4),
      new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.7 })
    );
    blanket.position.set(0, 1.25, 0.6);
    bedGroup.add(blanket);

    // Headboard
    const headBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.8, 0.2),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.3 })
    );
    headBoard.position.set(0, 1.2, -2.6);
    bedGroup.add(headBoard);

    // Side Rails (SKP 6 - Fall Prevention)
    const railMat = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.7 });
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 3.2), railMat);
    leftRail.position.set(-1.75, 1.4, 0);
    bedGroup.add(leftRail);

    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 3.2), railMat);
    rightRail.position.set(1.75, 1.4, 0);
    bedGroup.add(rightRail);

    // 3D Patient NPC: Tn. Hartono (lying in bed)
    const patientHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ map: createFaceTexture(false), roughness: 0.5 })
    );
    patientHead.position.set(0, 1.75, -1.7);
    patientHead.rotation.x = Math.PI * 0.1;
    bedGroup.add(patientHead);

    const patientTorso = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.5, 0.8),
      new THREE.MeshStandardMaterial({ color: '#7dd3fc', roughness: 0.6 })
    );
    patientTorso.position.set(0, 1.35, -0.6);
    patientTorso.rotation.x = -Math.PI / 2;
    bedGroup.add(patientTorso);

    // Patient floating badge
    const pBadgeCanvas = document.createElement('canvas');
    pBadgeCanvas.width = 256;
    pBadgeCanvas.height = 80;
    const pCtx = pBadgeCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = '#0284c7';
      pCtx.roundRect(10, 10, 236, 60, 14);
      pCtx.fill();
      pCtx.fillStyle = '#ffffff';
      pCtx.font = 'bold 22px sans-serif';
      pCtx.textAlign = 'center';
      pCtx.fillText('Tn. Hartono (Post-Op)', 128, 46);
    }
    const pBadgeSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(pBadgeCanvas),
        depthWrite: false,
      })
    );
    pBadgeSprite.position.set(0, 3.4, -0.5);
    pBadgeSprite.scale.set(2.2, 0.7, 1);
    bedGroup.add(pBadgeSprite);

    // Bedside Monitor
    const monitorPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3.0),
      new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8 })
    );
    monitorPole.position.set(2.3, 1.5, -2.0);
    bedGroup.add(monitorPole);

    const monitorBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3 })
    );
    monitorBox.position.set(2.3, 2.6, -2.0);
    bedGroup.add(monitorBox);

    const screenLight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 0.55),
      new THREE.MeshBasicMaterial({ color: '#10b981' })
    );
    screenLight.position.set(2.3, 2.6, -1.79);
    bedGroup.add(screenLight);

    // IV Stand
    const ivPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.5),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9 })
    );
    ivPole.position.set(-2.2, 1.75, -2.0);
    bedGroup.add(ivPole);

    const ivBag = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.5, 0.15),
      new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.1, transparent: true, opacity: 0.85 })
    );
    ivBag.position.set(-2.2, 3.2, -1.8);
    bedGroup.add(ivBag);

    scene.add(bedGroup);

    // B. Wheelchair near Room 101 doorway
    const wheelchairGroup = new THREE.Group();
    wheelchairGroup.position.set(-7.5, 0, -4.5);
    wheelchairGroup.rotation.y = Math.PI * 0.4;

    const seatMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 1.2),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 })
    );
    seatMesh.position.set(0, 0.75, 0);
    wheelchairGroup.add(seatMesh);

    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.0, 0.1),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 })
    );
    seatBack.position.set(0, 1.25, -0.55);
    wheelchairGroup.add(seatBack);

    // Big side wheels
    const wheelGeo = new THREE.TorusGeometry(0.65, 0.06, 8, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8 });
    const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
    leftWheel.rotation.y = Math.PI / 2;
    leftWheel.position.set(-0.65, 0.65, 0);
    wheelchairGroup.add(leftWheel);

    const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rightWheel.rotation.y = Math.PI / 2;
    rightWheel.position.set(0.65, 0.65, 0);
    wheelchairGroup.add(rightWheel);

    scene.add(wheelchairGroup);

    // C. Room 102: Handwashing Station (Sink & Soap Dispenser)
    const sinkGroup = new THREE.Group();
    sinkGroup.position.set(-14, 0, 10);
    sinkGroup.rotation.y = Math.PI / 2;

    const sinkStand = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.4, 1.2),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
    );
    sinkStand.position.set(0, 0.7, 0);
    sinkGroup.add(sinkStand);

    const basin = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.3, 0.8),
      new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.2 })
    );
    basin.position.set(0, 1.35, 0);
    sinkGroup.add(basin);

    const faucet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.5),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9 })
    );
    faucet.position.set(0, 1.6, -0.3);
    sinkGroup.add(faucet);

    // Mirror on wall
    const mirror = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.5),
      new THREE.MeshStandardMaterial({ color: '#e0f2fe', metalness: 0.9, roughness: 0.1 })
    );
    mirror.position.set(0, 2.6, -0.58);
    sinkGroup.add(mirror);

    scene.add(sinkGroup);

    // D. Room 102: Sharps Container on Treatment Cart
    const cartGroup = new THREE.Group();
    cartGroup.position.set(-8, 0, 6.5);

    const cartMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.2, 1.0),
      new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.4 })
    );
    cartMesh.position.set(0, 0.6, 0);
    cartGroup.add(cartMesh);

    // Yellow Sharps Safety Box B3
    const sharpsBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.75, 0.55),
      new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.3 })
    );
    sharpsBox.position.set(0, 1.55, 0);
    cartGroup.add(sharpsBox);

    // Red Biohazard lid
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.1, 0.6),
      new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.3 })
    );
    lid.position.set(0, 1.95, 0);
    cartGroup.add(lid);

    scene.add(cartGroup);

    // E. Room 102: Lemari APD (PPE Cabinet)
    const ppeCabinet = new THREE.Group();
    ppeCabinet.position.set(-14, 0, 4);
    ppeCabinet.rotation.y = Math.PI / 2;

    const cabinetBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 3.5, 0.8),
      new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.4 })
    );
    cabinetBody.position.set(0, 1.75, 0);
    ppeCabinet.add(cabinetBody);

    // Glass display front
    const cabinetGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 3.0),
      new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.1, transparent: true, opacity: 0.6 })
    );
    cabinetGlass.position.set(0, 1.75, 0.41);
    ppeCabinet.add(cabinetGlass);

    scene.add(ppeCabinet);

    // F. Nurse Station Counter and Staff Nurse NPC: Ners Ratna
    const nsGroup = new THREE.Group();
    nsGroup.position.set(10, 0, -4);

    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 1.8, 2.5),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 })
    );
    counter.position.set(0, 0.9, 0);
    nsGroup.add(counter);

    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.15, 2.7),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.2 })
    );
    counterTop.position.set(0, 1.85, 0);
    nsGroup.add(counterTop);

    // PC Screen on counter
    const pc = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: '#0f172a' })
    );
    pc.position.set(-1.2, 2.25, 0.2);
    nsGroup.add(pc);

    // Staff Nurse 3D NPC: Ners Ratna, S.Kep
    const nurseGroup = new THREE.Group();
    nurseGroup.position.set(0, 0, -1.8); // standing behind counter
    nurseGroup.rotation.y = 0;

    const nTorso = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.4, 0.6),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 })
    );
    nTorso.position.set(0, 1.8, 0);
    nurseGroup.add(nTorso);

    const nHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ map: createFaceTexture(true), roughness: 0.5 })
    );
    nHead.position.set(0, 3.0, 0);
    nurseGroup.add(nHead);

    // Nurse floating badge
    const nBadgeCanvas = document.createElement('canvas');
    nBadgeCanvas.width = 256;
    nBadgeCanvas.height = 80;
    const nCtx = nBadgeCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = '#059669';
      nCtx.roundRect(10, 10, 236, 60, 14);
      nCtx.fill();
      nCtx.fillStyle = '#ffffff';
      nCtx.font = 'bold 22px sans-serif';
      nCtx.textAlign = 'center';
      nCtx.fillText('Ners Ratna, S.Kep', 128, 46);
    }
    const nBadgeSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(nBadgeCanvas),
        depthWrite: false,
      })
    );
    nBadgeSprite.position.set(0, 4.0, 0);
    nBadgeSprite.scale.set(2.4, 0.75, 1);
    nurseGroup.add(nBadgeSprite);

    nsGroup.add(nurseGroup);
    scene.add(nsGroup);

    // G. Waiting Area Benches & Table
    const waitingGroup = new THREE.Group();
    waitingGroup.position.set(10, 0, 7);

    const benchMat = new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.5 });
    const bench1 = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.75, 1.0), benchMat);
    bench1.position.set(0, 0.4, -1.2);
    waitingGroup.add(bench1);

    const bench2 = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.75, 1.0), benchMat);
    bench2.position.set(0, 0.4, 1.2);
    waitingGroup.add(bench2);

    const table = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.6, 1.0),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.3 })
    );
    table.position.set(0, 0.3, 0);
    waitingGroup.add(table);

    scene.add(waitingGroup);

    // 6. Playable Nursing Student Character (Roblox-inspired 3D Avatar)
    const playerGroup = new THREE.Group();
    playerGroup.position.copy(playerPos.current);

    // Torso: Student Nursing Uniform (Navy & White)
    const pTorsoMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
    const pTorso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.7), pTorsoMat);
    pTorso.position.set(0, 1.85, 0);
    pTorso.castShadow = !isSoftwareGl;
    playerGroup.add(pTorso);

    // Rajawali Student ID Badge on chest
    const pBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.45, 0.05),
      new THREE.MeshStandardMaterial({ color: '#0284c7' })
    );
    pBadge.position.set(0.35, 2.0, 0.36);
    playerGroup.add(pBadge);

    // Head
    const pHead = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 1.0),
      new THREE.MeshStandardMaterial({ map: createFaceTexture(false), roughness: 0.5 })
    );
    pHead.position.set(0, 3.15, 0);
    pHead.castShadow = !isSoftwareGl;
    playerGroup.add(pHead);

    // Hair / Cap
    const pCap = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.3, 1.1),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 })
    );
    pCap.position.set(0, 3.75, 0);
    playerGroup.add(pCap);

    // Arms
    const pArmMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.5), pArmMat);
    leftArm.position.set(-1.0, 1.85, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.5), pArmMat);
    rightArm.position.set(1.0, 1.85, 0);
    playerGroup.add(rightArm);

    // Legs
    const pPantsMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.25, 0.55), pPantsMat);
    leftLeg.position.set(-0.35, 0.65, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.25, 0.55), pPantsMat);
    rightLeg.position.set(0.35, 0.65, 0);
    playerGroup.add(rightLeg);

    // Floating Player Name
    const sNameCanvas = document.createElement('canvas');
    sNameCanvas.width = 384;
    sNameCanvas.height = 80;
    const snCtx = sNameCanvas.getContext('2d');
    if (snCtx) {
      snCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      snCtx.roundRect(10, 10, 364, 60, 14);
      snCtx.fill();
      snCtx.fillStyle = '#38bdf8';
      snCtx.font = 'bold 24px sans-serif';
      snCtx.textAlign = 'center';
      snCtx.fillText('Mahasiswa Ners Rajawali', 192, 48);
    }
    const sNameSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(sNameCanvas),
        depthWrite: false,
      })
    );
    sNameSprite.position.set(0, 4.3, 0);
    sNameSprite.scale.set(2.8, 0.6, 1);
    playerGroup.add(sNameSprite);

    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;
    playerLimbsRef.current = { leftArm, rightArm, leftLeg, rightLeg };

    // 7. Input Event Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === 'e' || e.key === 'E') {
        handleInteractTrigger();
      }
      if (e.key === 'Escape') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    // Mouse drag for camera orbit
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingCamera.current = true;
        prevPointer.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingCamera.current) return;
      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      cameraAngle.current.theta -= dx * 0.006;
      cameraAngle.current.phi = THREE.MathUtils.clamp(
        cameraAngle.current.phi + dy * 0.005,
        0.1,
        0.75
      );
    };

    const onMouseUp = () => {
      isDraggingCamera.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const canvasElem = renderer.domElement;
    canvasElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch handlers for camera rotation on right half
    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.clientX > window.innerWidth * 0.4) {
          prevPointer.current = { x: touch.clientX, y: touch.clientY };
          isDraggingCamera.current = true;
          break;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingCamera.current) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.clientX > window.innerWidth * 0.3) {
          const dx = touch.clientX - prevPointer.current.x;
          const dy = touch.clientY - prevPointer.current.y;
          prevPointer.current = { x: touch.clientX, y: touch.clientY };

          cameraAngle.current.theta -= dx * 0.008;
          cameraAngle.current.phi = THREE.MathUtils.clamp(
            cameraAngle.current.phi + dy * 0.006,
            0.1,
            0.75
          );
          break;
        }
      }
    };

    const onTouchEnd = () => {
      isDraggingCamera.current = false;
    };

    canvasElem.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasElem.addEventListener('touchmove', onTouchMove, { passive: true });
    canvasElem.addEventListener('touchend', onTouchEnd, { passive: true });

    // Window Resize
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 8. Main 3D Animation Loop with Collision & Camera
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Only move when playing and no modal is active
      if (gameState === 'playing' && !activeDialogue && !activeInspection) {
        let moveX = 0;
        let moveZ = 0;

        if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveZ -= 1;
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveZ += 1;
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveX -= 1;
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveX += 1;

        // Add touch joystick input
        if (isJoystickActive.current) {
          moveX += joystickDelta.current.x;
          moveZ += joystickDelta.current.y;
        }

        const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

        if (isMoving) {
          const speed = 7.0;

          // Align movement relative to current camera angle
          const inputAngle = Math.atan2(moveX, moveZ);
          const worldAngle = inputAngle + cameraAngle.current.theta;

          playerRot.current = THREE.MathUtils.damp(
            playerRot.current,
            worldAngle,
            14,
            delta
          );

          const stepX = Math.sin(worldAngle) * speed * delta;
          const stepZ = Math.cos(worldAngle) * speed * delta;

          // Attempt movement with collision sliding
          const proposedX = playerPos.current.x + stepX;
          const proposedZ = playerPos.current.z + stepZ;

          // Check combined step
          if (!checkCollision(proposedX, proposedZ)) {
            playerPos.current.x = proposedX;
            playerPos.current.z = proposedZ;
          } else {
            // Slide along X if possible
            if (!checkCollision(proposedX, playerPos.current.z)) {
              playerPos.current.x = proposedX;
            }
            // Slide along Z if possible
            if (!checkCollision(playerPos.current.x, proposedZ)) {
              playerPos.current.z = proposedZ;
            }
          }

          // Leg and arm animation
          walkTimeRef.current += delta * 14;
          if (playerLimbsRef.current) {
            const swing = Math.sin(walkTimeRef.current) * 0.65;
            playerLimbsRef.current.leftArm.rotation.x = swing;
            playerLimbsRef.current.rightArm.rotation.x = -swing;
            playerLimbsRef.current.leftLeg.rotation.x = -swing;
            playerLimbsRef.current.rightLeg.rotation.x = swing;
          }
        } else {
          // Reset limbs to neutral standing posture
          if (playerLimbsRef.current) {
            playerLimbsRef.current.leftArm.rotation.x = THREE.MathUtils.damp(
              playerLimbsRef.current.leftArm.rotation.x,
              0,
              10,
              delta
            );
            playerLimbsRef.current.rightArm.rotation.x = THREE.MathUtils.damp(
              playerLimbsRef.current.rightArm.rotation.x,
              0,
              10,
              delta
            );
            playerLimbsRef.current.leftLeg.rotation.x = THREE.MathUtils.damp(
              playerLimbsRef.current.leftLeg.rotation.x,
              0,
              10,
              delta
            );
            playerLimbsRef.current.rightLeg.rotation.x = THREE.MathUtils.damp(
              playerLimbsRef.current.rightLeg.rotation.x,
              0,
              10,
              delta
            );
          }
        }

        // Update player avatar position & rotation
        if (playerGroupRef.current) {
          playerGroupRef.current.position.copy(playerPos.current);
          playerGroupRef.current.rotation.y = playerRot.current;
        }

        // Zone detection
        const px = playerPos.current.x;
        const pz = playerPos.current.z;
        if (px < -5 && pz < 0) {
          setCurrentZone('Kamar 101 - Perawatan Bedah');
        } else if (px < -5 && pz >= 0) {
          setCurrentZone('Kamar 102 - Isolasi & PPI');
        } else if (px > 5 && pz < 1) {
          setCurrentZone('Nurse Station Terpadu');
        } else if (px > 5 && pz >= 1) {
          setCurrentZone('Ruang Tunggu Keluarga');
        } else {
          setCurrentZone('Koridor Utama');
        }

        // Proximity detection for interactables
        let closestEntity: InteractableEntity | null = null;
        let closestDist = Infinity;

        for (const item of interactablesRef.current) {
          const dist = playerPos.current.distanceTo(item.position);
          if (dist < item.radius && dist < closestDist) {
            closestDist = dist;
            closestEntity = item;
          }
        }
        setNearbyEntity(closestEntity);
      }

      // Smooth Third-Person Camera Placement
      if (cameraRef.current) {
        const camDistance = 8.5;
        const camHeight = 3.8 + cameraAngle.current.phi * 4.0;
        const camX = playerPos.current.x + Math.sin(cameraAngle.current.theta) * camDistance;
        const camZ = playerPos.current.z + Math.cos(cameraAngle.current.theta) * camDistance;

        cameraRef.current.position.x = THREE.MathUtils.damp(
          cameraRef.current.position.x,
          camX,
          8,
          delta
        );
        cameraRef.current.position.y = THREE.MathUtils.damp(
          cameraRef.current.position.y,
          playerPos.current.y + camHeight,
          8,
          delta
        );
        cameraRef.current.position.z = THREE.MathUtils.damp(
          cameraRef.current.position.z,
          camZ,
          8,
          delta
        );

        cameraRef.current.lookAt(
          playerPos.current.x,
          playerPos.current.y + 2.0,
          playerPos.current.z
        );
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      canvasElem.removeEventListener('mousedown', onMouseDown);
      canvasElem.removeEventListener('touchstart', onTouchStart);
      canvasElem.removeEventListener('touchmove', onTouchMove);
      canvasElem.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [gameState, activeDialogue, activeInspection]);

  // Handle interaction trigger (pressing E or clicking mobile action button)
  const handleInteractTrigger = useCallback(() => {
    if (!nearbyEntity) return;

    triggerHaptic('medium');
    playHospitalSound('click');

    // 1. NPC Patient: Tn. Hartono
    if (nearbyEntity.type === 'npc_patient') {
      const dialogueText =
        'Sus, punggung saya masih terasa agak ngilu setelah operasi kemarin. Tadi saya mau ambil air minum tapi lantainya agak licin. Tolong cek pengaman ranjang saya ya Sus...';

      setActiveDialogue({
        entity: nearbyEntity,
        step: 1,
        speakerName: 'Tn. Hartono (62 th)',
        speakerRole: 'Pasien Rawat Inap Post-Op Laparatomi',
        text: dialogueText,
        options: [
          {
            text: 'Baik Pak Hartono, saya kunci rem ranjang dan naikkan side rails sekarang. Bila perlu apa-apa tekan bel ya Pak.',
            isCorrect: true,
            feedback: 'Tindakan Tepat! Anda menerapkan SKP 6 (Pengurangan Risiko Jatuh) dengan mengunci side rails & rem roda.',
          },
          {
            text: 'Bapak jangan bangun dulu ya, saya panggilkan keluarga untuk membantu mengambil air.',
            isCorrect: true,
            feedback: 'Bagus! Melibatkan keluarga dalam pemantauan pasien risiko jatuh.',
          },
          {
            text: 'Saya periksa selang infus dan balutan operasi Bapak agar tidak tegang saat berbaring.',
            isCorrect: true,
            feedback: 'Pemeriksaan keamanan fisik dan kenyamanan pasien yang baik.',
          },
        ],
      });

      if (soundEnabled) {
        speakIndonesian(dialogueText, {
          pitch: 0.9,
          rate: 0.95,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
      return;
    }

    // 2. NPC Nurse: Ners Ratna
    if (nearbyEntity.type === 'npc_nurse') {
      const dialogueText =
        'Halo Rekan Mahasiswa Keperawatan! Selamat datang di simulasi bangsal. Di sini kita menerapkan prinsip HIPERKES dr. Juwita Ninda Suherman: "Dua Keselamatan, Satu Sistem". Ada yang ingin didiskusikan terkait SOP K3RS atau keselamatan pasien?';

      setActiveDialogue({
        entity: nearbyEntity,
        step: 1,
        speakerName: 'Ners Ratna, S.Kep',
        speakerRole: 'Perawat Pelaksana Bangsal Dahlia',
        text: dialogueText,
        options: [
          {
            text: 'Ners Ratna, bagaimana standar penanganan safety box benda tajam bila hampir penuh?',
            feedback:
              'Safety box harus ditutup dan disegel saat terisi 3/4 penuh. Jangan pernah menekan isi jarum dengan tangan, dan buang ke TPS Limbah B3 berizin!',
          },
          {
            text: 'Bagaimana cara mencegah penularan penyakit infeksius saat memeriksa pasien di bangsal?',
            feedback:
              'Terapkan 5 Momen Cuci Tangan WHO, gunakan APD sesuai tingkat risiko pajanan, dan pastikan kepatuhan isolasi airborne untuk kasus batuk berdarah!',
          },
          {
            text: 'Terima kasih Ners Ratna, saya akan melanjutkan patroli keselamatan kerja di ruangan.',
            feedback:
              'Semangat belajar! Selalu periksa lingkungan kerja perawat dan keselamatan pasien sebelum tindakan.',
          },
        ],
      });

      if (soundEnabled) {
        speakIndonesian(dialogueText, {
          pitch: 1.05,
          rate: 1.0,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
      return;
    }

    // 3. Interactive Objects
    let inspectionData: {
      title: string;
      category: string;
      description: string;
      rules: string[];
      safetyTip: string;
    } | null = null;

    if (nearbyEntity.type === 'obj_bed') {
      inspectionData = {
        title: 'Tempat Tidur Pasien & Pengaman Samping (Side Rails)',
        category: 'Sasaran Keselamatan Pasien (SKP 6) - Pencegahan Risiko Jatuh',
        description:
          'Tempat tidur rumah sakit dilengkapi mekanisme pengatur ketinggian, rem roda ganda, dan pembatas samping (side rails) untuk mencegah kejadian pasien jatuh dari ranjang.',
        rules: [
          'Selalu pasang kedua side rails pada pasien pasca operasi, lansia, atau pasien gelisah.',
          'Kunci kedua pedal rem roda tempat tidur sebelum meninggalkan ruangan pasien.',
          'Atur posisi tempat tidur pada ketinggian terendah saat pasien sedang tidur.',
          'Pastikan tombol bel pemanggil perawat (call bell) berada dalam jangkauan tangan pasien.',
        ],
        safetyTip: 'Pemasangan gelang kuning risiko jatuh wajib dilakukan sejak asesmen awal pasien masuk.',
      };
    } else if (nearbyEntity.type === 'obj_wheelchair') {
      inspectionData = {
        title: 'Kursi Roda & Prosedur Ergonomi Transfer Pasien',
        category: 'K3RS Ergonomi & Penyakit Akibat Kerja (PAK)',
        description:
          'Kursi roda adalah alat bantu mobilitas yang memerlukan teknik transfer ergonomis untuk mencegah cedera tulang belakang (Low Back Pain) pada perawat dan cedera jatuh pada pasien.',
        rules: [
          'Kunci kedua tuas rem roda kursi roda sebelum membantu pasien berdiri atau duduk.',
          'Lipat pijakan kaki ke atas agar tidak menghalangi langkah kaki pasien saat transfer.',
          'Tekuk lutut Anda dan jaga punggung tetap lurus, gunakan otot paha untuk mengangkat beban.',
          'Jika pasien memiliki keterbatasan fisik berat, gunakan alat bantu slide sheet atau minta bantuan rekan (team lift).',
        ],
        safetyTip: 'Dekatkan beban ke pusat gravitasi tubuh perawat untuk meminimalkan beban kompresi diskus lumbal.',
      };
    } else if (nearbyEntity.type === 'obj_sink') {
      inspectionData = {
        title: 'Wastafel & 6 Langkah Kebersihan Tangan WHO',
        category: 'Pencegahan & Pengendalian Infeksi (PPI / SKP 5) - Bahaya Biologis',
        description:
          'Mencuci tangan adalah pilar utama pemutusan rantai penularan infeksi nosokomial (HAIs) antara perawat dan pasien di rumah sakit.',
        rules: [
          '1. Ratakan sabun dengan menggosok kedua telapak tangan.',
          '2. Gosok punggung dan sela-sela jari tangan kiri dengan tangan kanan dan sebaliknya.',
          '3. Gosok kedua telapak tangan dan sela-sela jari.',
          '4. Jari-jari sisi dalam dari kedua tangan saling mengunci.',
          '5. Gosok ibu jari kiri berputar dalam genggaman tangan kanan dan sebaliknya.',
          '6. Gosok dengan memutar ujung jari-jari tangan kanan di telapak tangan kiri dan sebaliknya.',
        ],
        safetyTip: 'Lakukan cuci tangan air mengalir selama 40-60 detik atau handrub alkohol selama 20-30 detik.',
      };
    } else if (nearbyEntity.type === 'obj_sharps') {
      inspectionData = {
        title: 'Safety Box Benda Tajam & Pencegahan Tertusuk Jarum (NSI)',
        category: 'Pengendalian Bahaya Biologis & Limbah Medis B3',
        description:
          'Wadah tahan tusukan dan air berwarna kuning dengan logo biohazard untuk membuang spuit, jarum suntik, bisturi, dan pecahan ampul obat secara aman.',
        rules: [
          'Jangan pernah melakukan penutupan jarum suntik kembali dengan dua tangan (NO Two-Handed Recapping).',
          'Letakkan safety box langsung di titik tindakan (Point of Care) agar jarum segera dibuang.',
          'Segera tutup dan segel safety box bila isi telah mencapai batas 3/4 volume.',
          'Bila terjadi tertusuk jarum, segera cuci dengan air mengalir dan sabun, lalu lapor K3RS dalam 24 jam untuk PEP.',
        ],
        safetyTip: 'Tertusuk jarum berisiko menularkan patogen Hepatitis B, Hepatitis C, dan HIV kepada perawat.',
      };
    } else if (nearbyEntity.type === 'obj_ppe') {
      inspectionData = {
        title: 'Lemari Alat Pelindung Diri (APD / PPE)',
        category: 'Hierarki Pengendalian Bahaya K3RS - Perlindungan Personal',
        description:
          'Menyimpan persediaan APD standar untuk melindungi tenaga kesehatan dari paparan percikan darah, cairan tubuh, bioaerosol kuman, dan zat kimia sitotoksik.',
        rules: [
          'Sarung tangan nitril / lateks untuk tindakan kontak darah dan cairan tubuh.',
          'Masker bedah untuk droplet dan masker respirator N95 untuk ruangan isolasi airborne.',
          'Kacamata pelindung (goggles) atau face shield untuk mencegah percikan ke mukosa mata.',
          'Celemek plastik / gaun tahan air untuk prosedur pemandian dan irigasi luka basah.',
        ],
        safetyTip: 'Lepaskan sarung tangan terlebih dahulu, cuci tangan, baru kemudian lepaskan masker tanpa menyentuh bagian depan.',
      };
    }

    if (inspectionData) {
      setActiveInspection(inspectionData);

      // Record score points
      if (!inspectedObjects.includes(nearbyEntity.id)) {
        setInspectedObjects((prev) => [...prev, nearbyEntity.id]);
        setSafetyPoints((prev) => prev + 20);
      }

      if (soundEnabled) {
        speakIndonesian(`${inspectionData.title}. ${inspectionData.description}`, {
          pitch: 1.0,
          rate: 1.0,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    }
  }, [nearbyEntity, soundEnabled, inspectedObjects]);

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
    <div className="relative w-full h-[620px] sm:h-[720px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none flex flex-col font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 1. WELCOME SCREEN OVERLAY (When gameState === 'welcome') */}
      {gameState === 'welcome' && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5">
            {/* Institution Official Logo */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-white p-2 shadow-lg border-2 border-sky-500 flex items-center justify-center overflow-hidden">
                <img
                  src="/rajawali_logo.png"
                  alt="Institut Kesehatan Rajawali Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase">
                Simulasi Rumah Sakit Virtual 3D
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                HIPERKES 3D – VIRTUAL HOSPITAL
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
                Media Pembelajaran Keselamatan Pasien & K3RS untuk Mahasiswa Keperawatan
              </p>
            </div>

            {/* Author Credit Box */}
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">dr Juwita Ninda Suherman, M.Kes</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Dosen Pengampu HIPERKES & K3RS · Institut Kesehatan Rajawali
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={async () => {
                  triggerHaptic('medium');
                  playHospitalSound('click');
                  await unlockAudioSystem();
                  setIsAudioUnlockedState(true);
                  setGameState('playing');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Simulasi 3D (Start Game)</span>
              </button>

              <button
                onClick={() => setShowControlsHelp(true)}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-sky-500" />
                <span>Panduan Kontrol</span>
              </button>
            </div>

            {/* Quick Educational Resource Links */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
              {onOpenHandbook && (
                <button onClick={onOpenHandbook} className="hover:text-sky-600 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Modul dr. Juwita</span>
                </button>
              )}
              {onOpenSlides && (
                <button onClick={onOpenSlides} className="hover:text-sky-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>30 Slide Kuliah</span>
                </button>
              )}
              {onOpenQuiz && (
                <button onClick={onOpenQuiz} className="hover:text-sky-600 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>30 Soal CBT</span>
                </button>
              )}
            </div>

            {/* Mandatory Copyright Notice */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              © 2026 dr Juwita Ninda Suherman, M.Kes. Institut Kesehatan Rajawali. All Rights Reserved.
            </p>
          </div>
        </div>
      )}

      {/* 2. IN-GAME TOP HUD (When playing) */}
      {gameState === 'playing' && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none z-20">
          {/* Room Location & Institution Badge */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 pointer-events-auto backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0">
              <img
                src="/rajawali_logo.png"
                alt="Logo Rajawali"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-400 block tracking-wider uppercase">
                HIPERKES 3D · dr Juwita Ninda Suherman, M.Kes
              </span>
              <span className="text-xs font-black text-white flex items-center gap-1">
                📍 {currentZone}
              </span>
            </div>
          </div>

          {/* Top-Right HUD Controls: Points, Sound, Pause */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Audio unlock prompt for mobile */}
            {!isAudioUnlockedState && (
              <button
                onClick={async () => {
                  await unlockAudioSystem();
                  setIsAudioUnlockedState(true);
                  playHospitalSound('beep');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md animate-bounce flex items-center gap-1.5"
                title="Aktifkan audio untuk mendengar suara natural"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>AKTIFKAN AUDIO</span>
              </button>
            )}

            {/* Points Badge */}
            <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 shadow-md backdrop-blur-md flex items-center gap-1.5">
              <span>⭐ {safetyPoints} Poin</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                if (soundEnabled) stopSpeaking();
                setSoundEnabled(!soundEnabled);
                triggerHaptic('light');
              }}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white shadow-md"
              title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Controls Help */}
            <button
              onClick={() => setShowControlsHelp(true)}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white shadow-md"
              title="Panduan Kontrol"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Pause Button */}
            <button
              onClick={() => {
                stopSpeaking();
                setGameState('paused');
              }}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white shadow-md"
              title="Jeda Game"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. CENTER FLOATING INTERACTION PROMPT (When near an entity) */}
      {gameState === 'playing' && nearbyEntity && !activeDialogue && !activeInspection && (
        <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-bounce">
          <button
            onClick={handleInteractTrigger}
            className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm shadow-2xl flex items-center gap-2 border-2 border-white/50 active:scale-95 transition-all"
          >
            <span className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded font-mono text-xs">
              E
            </span>
            <span>{nearbyEntity.label}</span>
          </button>
        </div>
      )}

      {/* 4. MOBILE ON-SCREEN JOYSTICK & ACTION BUTTON (Bottom of screen) */}
      {gameState === 'playing' && (
        <>
          {/* Virtual Joystick (Left Thumb) */}
          <div
            className="sm:hidden absolute bottom-5 left-4 w-28 h-28 rounded-full bg-slate-900/70 border-2 border-sky-500/40 flex items-center justify-center touch-none select-none z-20"
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
          >
            <div className="w-12 h-12 rounded-full bg-sky-500/80 shadow-md flex items-center justify-center text-white text-xs font-bold pointer-events-none">
              <Move className="w-5 h-5" />
            </div>
          </div>

          {/* Action Trigger Button (Right Thumb) */}
          <div className="sm:hidden absolute bottom-6 right-4 z-20">
            <button
              onClick={handleInteractTrigger}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-2xl transition-transform active:scale-90 ${
                nearbyEntity ? 'bg-sky-600 ring-4 ring-sky-400 animate-pulse' : 'bg-slate-800/80 border border-slate-700 text-slate-400'
              }`}
            >
              <span className="text-xs font-black">AKSI</span>
              <span className="text-[10px] text-white/80">E</span>
            </button>
          </div>
        </>
      )}

      {/* 5. INTERACTIVE NPC DIALOGUE MODAL */}
      {activeDialogue && (
        <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header with NPC info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                  {activeDialogue.speakerName.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {activeDialogue.speakerName}
                  </h3>
                  <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                    {activeDialogue.speakerRole}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <span className="text-xs text-sky-600 flex items-center gap-1 font-semibold animate-pulse">
                    <Volume2 className="w-4 h-4" /> Berbicara...
                  </span>
                )}
                <button
                  onClick={() => {
                    stopSpeaking();
                    setActiveDialogue(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dialogue Spoken Bubble */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-xs sm:text-sm text-slate-800 dark:text-slate-100 italic leading-relaxed">
              "{activeDialogue.text}"
            </div>

            {/* Student Response Options */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Pilih Tanggapan Anda (Mahasiswa Ners):
              </span>
              {activeDialogue.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    triggerHaptic('medium');
                    playHospitalSound('click');
                    if (opt.isCorrect) setSafetyPoints((prev) => prev + 15);
                    if (opt.feedback) {
                      stopSpeaking();
                      if (soundEnabled) {
                        speakIndonesian(opt.feedback, { pitch: 1.0, rate: 1.0 });
                      }
                      alert(`[Umpan Balik K3RS & SKP]:\n\n${opt.feedback}`);
                    }
                    setActiveDialogue(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium transition-colors flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}

              {/* Seamless Jump to 3-Way Shared Conversation */}
              {onOpenAiConsultation && (
                <button
                  onClick={() => {
                    stopSpeaking();
                    setActiveDialogue(null);
                    onOpenAiConsultation(PATIENTS_DATA[0]);
                  }}
                  className="w-full mt-2 text-center py-2.5 px-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-sky-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Buka Diskusi Terpadu 3 Arah (Pasien, dr. Juwita & Keluarga)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. EDUCATIONAL OBJECT INSPECTION MODAL */}
      {activeInspection && (
        <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {activeInspection.title}
                  </h3>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    {activeInspection.category}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  stopSpeaking();
                  setActiveInspection(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeInspection.description}
            </p>

            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                SOP Praktik Keperawatan Aman:
              </span>
              {activeInspection.rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Catatan Klinis K3RS:</strong> {activeInspection.safetyTip}
              </span>
            </div>

            <button
              onClick={() => {
                stopSpeaking();
                setActiveInspection(null);
              }}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
            >
              Tutup & Lanjutkan Inspeksi
            </button>
          </div>
        </div>
      )}

      {/* 7. PAUSE MODAL */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Simulasi Dijeda (Paused)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              HIPERKES 3D – VIRTUAL HOSPITAL · dr Juwita Ninda Suherman, M.Kes
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md"
              >
                Lanjutkan Simulasi (Resume)
              </button>

              <button
                onClick={() => {
                  playerPos.current.set(0, 0, 8);
                  setGameState('playing');
                }}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Reset Posisi ke Koridor
              </button>

              <button
                onClick={() => setGameState('welcome')}
                className="w-full py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-semibold text-xs"
              >
                Kembali ke Layar Utama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CONTROLS GUIDE MODAL */}
      {showControlsHelp && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Panduan Kontrol Simulasi 3D
              </h3>
              <button onClick={() => setShowControlsHelp(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-bold text-sky-600 dark:text-sky-400 mb-1">💻 Laptop / Komputer Desktop:</p>
                <p>• <strong>W / S / A / D</strong> atau <strong>Panah</strong>: Berjalan maju, mundur, kiri, kanan</p>
                <p>• <strong>Geser Mouse (Klik Kiri & Drag)</strong>: Memutar sudut pandang kamera 360°</p>
                <p>• <strong>Tombol E</strong>: Berinteraksi dengan pasien, ners, atau peralatan rumah sakit</p>
                <p>• <strong>Esc</strong>: Membuka menu jeda (pause)</p>
              </div>

              <div>
                <p className="font-bold text-sky-600 dark:text-sky-400 mb-1">📱 Smartphone Android & Tablet:</p>
                <p>• <strong>Virtual Joystick</strong> di kiri bawah layar untuk menggerakkan karakter</p>
                <p>• <strong>Sentuh & Geser Jari</strong> di sisi kanan layar untuk memutar kamera</p>
                <p>• <strong>Tombol Aksi (E)</strong> di kanan bawah untuk berinteraksi dengan objek/pasien</p>
              </div>
            </div>

            <button
              onClick={() => setShowControlsHelp(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
            >
              Mengerti & Siap Bermain
            </button>
          </div>
        </div>
      )}

      {/* 9. BOTTOM COPYRIGHT BANNER */}
      <div className="absolute bottom-1 left-0 right-0 py-1 bg-slate-950/90 text-center pointer-events-none z-10 border-t border-slate-900">
        <p className="text-[10px] text-slate-400">
          <strong>HIPERKES 3D – VIRTUAL HOSPITAL</strong> · Created by: <strong>dr Juwita Ninda Suherman, M.Kes</strong> · Institut Kesehatan Rajawali © 2026 All Rights Reserved.
        </p>
      </div>
    </div>
  );
};
