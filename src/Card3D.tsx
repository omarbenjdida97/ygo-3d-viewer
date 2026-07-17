import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';
import { useTexture, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export type AnimState = 'default' | 'summon' | 'set' | 'attack';

interface Card3DProps {
    frontImageUrl: string;
    animState: AnimState;
    offsetX?: number;
    artOnly?: boolean; 
    idleAnimation?: boolean;
}

const CARD_BACK_URL = `${import.meta.env.BASE_URL}card-back.jpg`;

const getProxyUrl = (url: string) => {
    if (!url) return url;
    if (import.meta.env.DEV && url.includes('images.ygoprodeck.com')) {
        return url.replace('https://images.ygoprodeck.com', '/api/images');
    }
    if (!import.meta.env.DEV && url.includes('images.ygoprodeck.com')) {
        const cleanUrl = url.replace('https://', '');
        return `https://wsrv.nl/?url=${cleanUrl}&cors=1`;
    }
    return url;
};

export const Pack3D: React.FC<{ setName: string; coverImage: string; animState: AnimState }> = ({ setName, coverImage, animState }) => {
    const floatGroup = useRef<THREE.Group>(null);
    const [packTex, setPackTex] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        if (!coverImage) return;
        let isMounted = true;
        const loader = new THREE.TextureLoader();
        loader.load(getProxyUrl(coverImage), (tex) => {
            if (!isMounted) return;
            tex.colorSpace = THREE.SRGBColorSpace;
            setPackTex(tex);
        }, undefined, () => {});
        return () => { isMounted = false; };
    }, [coverImage]);

    const { pos, rot } = useSpring({
        pos: animState === 'attack' ? [0, 6, -2] : [0, 0.25, 0],
        rot: animState === 'attack' ? [-Math.PI, Math.PI * 2, 0] : [0, 0, 0],
        config: { mass: 1, tension: 120, friction: 14 }
    });

    useFrame(() => {
        if (!floatGroup.current) return;
        if (animState === 'default') {
            floatGroup.current.position.y = Math.sin(Date.now() * 0.005) * 0.1;
        }
    });

    const packMaterial = useMemo(
        () => new THREE.MeshPhysicalMaterial({ color: '#0f172a', metalness: 0.9, roughness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.1 }),
        []
    );

    return (
        <group ref={floatGroup}>
            <a.mesh position={pos as any} rotation={rot as any} scale={1} castShadow receiveShadow material={packMaterial}>
                <boxGeometry args={[2.4, 3.5, 0.15]} />
                {packTex && (
                    <mesh position={[0, 0.2, 0.08]}>
                        <planeGeometry args={[2.2, 2.2]} />
                        <meshBasicMaterial map={packTex} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
                    </mesh>
                )}
                <Text position={[0, -1.3, 0.08]} fontSize={0.16} color="#D6A033" maxWidth={2.2} textAlign="center" anchorX="center" anchorY="middle">
                    {setName}
                </Text>
            </a.mesh>
        </group>
    );
};

export const Card3D: React.FC<Card3DProps> = ({ frontImageUrl, animState, offsetX = 0, artOnly = false, idleAnimation = true }) => {
    const backTexture = useTexture(CARD_BACK_URL);
    const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
    const floatGroup = useRef<THREE.Group>(null);

    useMemo(() => {
        if (backTexture) {
            backTexture.anisotropy = 16;
            backTexture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [backTexture]);

    useEffect(() => {
        let isMounted = true;
        setFrontTexture(null);

        const loader = new THREE.TextureLoader();
        const secureUrl = getProxyUrl(frontImageUrl);

        loader.load(
            secureUrl,
            (tex) => {
                if (!isMounted) return;
                tex.anisotropy = 16;
                tex.colorSpace = THREE.SRGBColorSpace;
                setFrontTexture(tex);
            },
            undefined,
            () => {}
        );

        return () => { isMounted = false; };
    }, [frontImageUrl]);

    const { pos, rot } = useSpring({
        pos:
        animState === 'summon' ? [offsetX, 3.5, -2] :
        animState === 'attack' ? [offsetX, 0.25, 1.2] :
        [offsetX, 0.25, 0],
        rot:
        animState === 'summon' ? [Math.PI / 4, Math.PI * 4, 0] :
        animState === 'set'    ? [-Math.PI / 2, 0, 0] :
        animState === 'attack' ? [0.2, 0, 0] :
        [0, 0, 0],
        config: {
            mass: animState === 'summon' ? 2 : 1,
            tension: animState === 'summon' ? 120 : 250,
            friction: animState === 'summon' ? 14 : 25
        },
    });

    useFrame(() => {
        if (!floatGroup.current) return;
        if (animState === 'default' && idleAnimation) {
            floatGroup.current.position.y = Math.sin(Date.now() * 0.002) * 0.05;
        } else {
            floatGroup.current.position.y = THREE.MathUtils.lerp(floatGroup.current.position.y, 0, 0.1);
        }
    });

    const edgeMaterial = useMemo(
        () => new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.8 }),
        []
    );

    const materials = useMemo(() => [
        edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial,
        new THREE.MeshPhysicalMaterial({
            map: frontTexture || backTexture,
            roughness: 0.25, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.1,
        }),
        new THREE.MeshPhysicalMaterial({ map: backTexture, roughness: 0.4, metalness: 0.0 }),
    ], [edgeMaterial, frontTexture, backTexture]);

    return (
        <group ref={floatGroup}>
            <a.mesh position={pos as any} rotation={rot as any} scale={1} castShadow receiveShadow material={materials}>
                <boxGeometry args={artOnly ? [2.4, 2.4, 0.02] : [2, 2.914, 0.02]} />
            </a.mesh>
        </group>
    );
};