import React, { Suspense, useMemo, useRef, useEffect, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, useTexture, Sparkles, Grid as Grid3D } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';
import { Card3D, type AnimState } from './Card3D';

class CanvasErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: any) { console.error("Card failed to load:", error); }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

const CameraTracker = ({ setIsZoomed }: { setIsZoomed: (z: boolean) => void }) => {
    const target = useMemo(() => new THREE.Vector3(0, 0.25, 0), []);
    const zoomedRef = useRef(false);

    useFrame((state) => {
        const distance = state.camera.position.distanceTo(target);
        const isCurrentlyZoomed = distance < 3.2;

        if (isCurrentlyZoomed !== zoomedRef.current) {
            zoomedRef.current = isCurrentlyZoomed;
            setIsZoomed(isCurrentlyZoomed);
        }
    });

    return null;
};

const CameraResetter = ({ resetTrigger, controlsRef }: { resetTrigger: number, controlsRef: any }) => {
    const { camera } = useThree();
    useEffect(() => {
        if (resetTrigger > 0 && controlsRef.current) {
            controlsRef.current.target.set(0, 0.25, 0);
            camera.position.set(0, 0.25, 3.9);
            controlsRef.current.update();
        }
    }, [resetTrigger, camera, controlsRef]);
    return null;
};

const PlaymatPlane = ({ url }: { url: string }) => {
    const texture = useTexture(url);
    return (
        <mesh position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14.4, 8.4]} />
        <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
        </mesh>
    );
};


const MagicRing = ({ position, animState }: { position: [number, number, number], animState: AnimState }) => {
    const ringRef = useRef<THREE.Group>(null);

    
    const { pillarOpacity, pillarScale } = useSpring({
        pillarOpacity: animState === 'summon' ? 0.6 : 0,
        pillarScale: animState === 'summon' ? [1, 1, 1] : [1, 0.001, 1],
        config: { tension: 120, friction: 14 }
    });

    
    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
        }
    });

    return (
        <group position={position}>
       
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.55, 1.6, 64]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.6} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>

       
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.25, 1.28, 64]} />
        <meshBasicMaterial color="#D6A033" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>

        
        <mesh ref={ringRef as any} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <torusGeometry args={[1.40, 0.02, 4, 32]} />
        <meshBasicMaterial color="#D17B0F" transparent opacity={0.8} blending={THREE.AdditiveBlending} wireframe />
        </mesh>

        
        <a.mesh position={[0, 4, 0]} scale={pillarScale as any}>
        <cylinderGeometry args={[1.4, 1.4, 8, 64]} />
        <a.meshBasicMaterial color="#D6A033" transparent opacity={pillarOpacity} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </a.mesh>
        </group>
    );
};

interface SceneProps {
    cardImage: string;
    compareCardImage?: string;
    animState: AnimState;
    compareAnimState: AnimState;
    setIsZoomed: (isZoomed: boolean) => void;
    resetViewTrigger: number;
    artOnly: boolean;
    playmat?: string | null;
    idleAnimation: boolean;
}

export const Scene: React.FC<SceneProps> = ({
    cardImage,
    compareCardImage,
    animState,
    compareAnimState,
    setIsZoomed,
    resetViewTrigger,
    artOnly,
    playmat,
    idleAnimation
}) => {
    const isComparing = !!compareCardImage;
    const controlsRef = useRef<any>(null);

    const { groupZ } = useSpring({
        groupZ: isComparing ? -1.5 : 0,
        config: { mass: 1, tension: 170, friction: 26 }
    });

    const cardOffset = artOnly ? 1.35 : 1.1;

    return (
        <div className="w-full h-full absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 0.25, 3.9], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.7} />
        <spotLight position={[5, 8, 5]} angle={0.25} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Environment preset="city" />

        <OrbitControls ref={controlsRef} target={[0, 0.25, 0]} enablePan={true} enableZoom={true} minDistance={0.8} maxDistance={8.0} dampingFactor={0.05} rotateSpeed={0.8} />

        <CameraTracker setIsZoomed={setIsZoomed} />
        <CameraResetter resetTrigger={resetViewTrigger} controlsRef={controlsRef} />

        
        <Sparkles count={100} scale={12} size={1.5} speed={0.2} opacity={0.3} color="#0ea5e9" />
        <Sparkles count={60} scale={10} size={2.5} speed={0.6} opacity={0.5} color="#D6A033" />

        
        {playmat ? (
            <Suspense fallback={null}>
            <PlaymatPlane url={playmat} />
            </Suspense>
        ) : (
            <Grid3D position={[0, -1.54, 0]} args={[30, 30]} cellColor="#0ea5e9" sectionColor="#D6A033" sectionSize={2} cellSize={0.5} fadeDistance={15} cellThickness={0.5} sectionThickness={1} infiniteGrid />
        )}

        
        <MagicRing position={[isComparing ? -cardOffset : 0, -1.53, 0]} animState={animState} />
        {isComparing && (
            <MagicRing position={[cardOffset, -1.53, 0]} animState={compareAnimState} />
        )}

        <a.group position-z={groupZ}>
        <CanvasErrorBoundary>
        <Suspense fallback={null}>
        <Card3D
        key={`main-${cardImage}`}
        frontImageUrl={cardImage}
        animState={animState}
        offsetX={isComparing ? -cardOffset : 0}
        artOnly={artOnly}
        idleAnimation={idleAnimation}
        />
        </Suspense>
        </CanvasErrorBoundary>

        {compareCardImage && (
            <CanvasErrorBoundary>
            <Suspense fallback={null}>
            <Card3D
            key={`comp-${compareCardImage}`}
            frontImageUrl={compareCardImage}
            animState={compareAnimState}
            offsetX={cardOffset}
            artOnly={artOnly}
            idleAnimation={idleAnimation}
            />
            </Suspense>
            </CanvasErrorBoundary>
        )}
        </a.group>

        <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={15} blur={2} far={4} />
        </Canvas>
        </div>
    );
};
