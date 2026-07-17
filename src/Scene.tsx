import React, { Suspense, useMemo, useRef, useEffect, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, useTexture, Sparkles, Grid as Grid3D } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';
import { Card3D, Pack3D, type AnimState } from './Card3D';

class CanvasErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch() {}
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

const CameraController = ({ packMode, resetTrigger, controlsRef }: { packMode?: boolean, resetTrigger: number, controlsRef: any }) => {
    const { camera } = useThree();
    
    useEffect(() => {
        if (!controlsRef.current) return;
        const isMobile = window.innerWidth < 768;
        
        if (packMode) {
            controlsRef.current.target.set(0, 0, 0);
            camera.position.set(0, 0, isMobile ? 8.5 : 5.5);
        } else {
            controlsRef.current.target.set(0, 0.25, 0);
            camera.position.set(0, 0.25, isMobile ? 6.5 : 3.9);
        }
        
        controlsRef.current.update();
    }, [packMode, resetTrigger]);
    
    return null;
};

const CameraTracker = ({ setIsZoomed, packMode }: { setIsZoomed: (z: boolean) => void, packMode?: boolean }) => {
    const target = useMemo(() => new THREE.Vector3(0, 0.25, 0), []);
    const zoomedRef = useRef(false);

    useFrame((state) => {
        if (packMode) return;
        const distance = state.camera.position.distanceTo(target);
        const aspect = window.innerWidth / window.innerHeight;
        const threshold = aspect < 0.8 ? 5.0 : 3.2;
        const isCurrentlyZoomed = distance < threshold;

        if (isCurrentlyZoomed !== zoomedRef.current) {
            zoomedRef.current = isCurrentlyZoomed;
            setIsZoomed(isCurrentlyZoomed);
        }
    });

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
    packMode?: boolean;
    packSealed?: boolean;
    activeSetName?: string;
    activeSetCoverImage?: string;
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
    idleAnimation,
    packMode,
    packSealed,
    activeSetName,
    activeSetCoverImage
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
            <Canvas shadows camera={{ fov: 45 }} gl={{ antialias: true }}>
                <CameraController controlsRef={controlsRef} packMode={packMode} resetTrigger={resetViewTrigger} />
                <ambientLight intensity={0.7} />
                <spotLight position={[5, 8, 5]} angle={0.25} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                <Environment preset="city" />

                <OrbitControls ref={controlsRef} enablePan={!packMode} enableZoom={true} minDistance={0.8} maxDistance={15.0} dampingFactor={0.05} rotateSpeed={0.8} />

                <CameraTracker setIsZoomed={setIsZoomed} packMode={packMode} />

                <Sparkles count={100} scale={12} size={1.5} speed={0.2} opacity={0.3} color="#0ea5e9" />
                <Sparkles count={60} scale={10} size={2.5} speed={0.6} opacity={0.5} color="#D6A033" />

                {playmat ? (
                    <Suspense fallback={null}>
                        <PlaymatPlane url={playmat} />
                    </Suspense>
                ) : (
                    <Grid3D position={[0, -1.54, 0]} args={[30, 30]} cellColor="#0ea5e9" sectionColor="#D6A033" sectionSize={2} cellSize={0.5} fadeDistance={15} cellThickness={0.5} sectionThickness={1} infiniteGrid />
                )}

                <a.group position-z={groupZ}>
                    <CanvasErrorBoundary>
                        <Suspense fallback={null}>
                            {packMode && packSealed ? (
                                <Pack3D setName={activeSetName || ''} coverImage={activeSetCoverImage || ''} animState={animState} />
                            ) : (
                                <Card3D
                                    key={`main-${cardImage}`}
                                    frontImageUrl={cardImage}
                                    animState={animState}
                                    offsetX={isComparing ? -cardOffset : 0}
                                    artOnly={artOnly}
                                    idleAnimation={idleAnimation}
                                />
                            )}
                        </Suspense>
                    </CanvasErrorBoundary>

                    {compareCardImage && !packMode && (
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