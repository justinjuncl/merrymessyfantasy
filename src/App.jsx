import * as THREE from "three";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { extend, Canvas, useThree, useFrame } from "@react-three/fiber";
import { useIntersect, Image, PerspectiveCamera, FirstPersonControls, useGLTF, useAnimations, ArcballControls, Html, Scroll, useScroll, ScrollControls } from "@react-three/drei";

// import * as LineMaterial from "LineMaterial";
import { Overlay } from "Overlay";
import { artistsOrder } from "assets/artistsOrder";

import "App.css";

// import MUSEUM from "assets/example.glb";
import MUSEUM from "assets/museum.glb";
import MUSEUM_LINES from "assets/museum-lines.glb";
import FRAMES from "assets/frames.json";
import LOREM from "assets/lorem.json";
import { LineBasicMaterial } from "three";

const COLOR_BACKGROUND = 0x111111;
const COLOR_MODEL = 0x111111;
const COLOR_LINES = 0xb0bec5;
const COLOR_SHADOW = 0x2c2e2f;

useGLTF.preload(MUSEUM);
useGLTF.preload(MUSEUM_LINES);

function ImageHTML({ index, id, url }) {
    const visible = useRef(false)
    const [hovered, hover] = useState(false)
    const ref = useIntersect((isVisible) => (visible.current = isVisible))
    const { height } = useThree((state) => state.viewport)
    useFrame((state, delta) => {
        ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, visible.current ? 0 : -height / 2 + 1, 4, delta)
        ref.current.material.zoom = THREE.MathUtils.damp(ref.current.material.zoom, visible.current ? 1 : 1.5, 4, delta)
        ref.current.material.grayscale = THREE.MathUtils.damp(ref.current.material.grayscale, hovered ? 0 : 1, 4, delta)
    })
    return (
        <Image onPointerOver={() => hover(true)} onPointerOut={() => hover(false)} url={url} />
    );
}

function FrameHTML({ index, offset, id, artist, title, materials, size }) {
    const divStyle = {
        position: 'absolute',
        top: `${(index + offset) * 100}vh`,
        color: 'white',
        margin: '20px',
        width: '100vw',
        height: '100vh',
    };

    return (
        <div style={divStyle}>
            <div>{id}</div>
            <div>{artist}</div>
            <div>{title}</div>
            <div>{materials}</div>
            <div>{size}</div>
            {/* <div style={{ */}
            {/*     height: "50%", */}
            {/*     width: "50%", */}
            {/*     overflow: 'auto' */}
            {/* }}>{LOREM.text}</div> */}
        </div>
    );
}

const Frames = (props) => {
    const frameElements = useMemo(() => {
        const artist2ids = {};
        const id2frames = {};

        FRAMES.forEach(frame => {
            const artist = frame.artist.split(',')[0];
            if (artist in artist2ids) {
                artist2ids[artist].push(frame.id);
            } else {
                artist2ids[artist] = [frame.id];
            }

            id2frames[frame.id] = frame;
        });

        return artistsOrder.map(artist => {
            return artist2ids[artist].map(id => id2frames[id]);
        }).flat();
    }, []);

    return (
        <>
            {frameElements.map((frame, index) => (
                <FrameHTML key={index} index={index} offset={3} {...frame} />
            ))}
        </>
    );
}

const Museum = () => {
    const groupRef = useRef();

    const { nodes: lineNodes } = useGLTF(MUSEUM_LINES);
    const { scene, nodes, animations, materials } = useGLTF(MUSEUM);
    const { actions } = useAnimations(animations, groupRef);

    const { scroll, el } = useScroll();

    useEffect(() => {
        actions["Action"].play().paused = true;
        Object.values(materials).forEach(material => {
            material.opacity = 0.7;
            material.transparent = true;
            material.depthTest = true;
            material.flatShading = true;
            material.color.set(0x000000);
            material.polygonOffset = true;
            material.polygonOffsetFactor = 1;
        });
    }, [actions, materials]);

    useFrame((state) => {
        actions["Action"].time = THREE.MathUtils.lerp(actions["Action"].time, actions["Action"].getClip().duration * scroll.current, 0.05);
    })

    useEffect(() => Object.values(nodes).forEach((node) => (node.receiveShadow = node.castShadow = true)));

    // useEffect(() => {
    //     el.onscroll = (e) => {
    //         console.log(el, e);
    //     }
    // }, [el]);

    const newScene = useMemo(() => {
        let newScene = scene.clone();
        let cameraObject = newScene.getObjectByName("Camera");
        if (cameraObject !== null)
            newScene.remove(cameraObject);
        return newScene;
    }, [scene])

    return (
        <group ref={groupRef} dispose={null}>
            {/* <mesh> */}
            {/*     <boxGeometry args={[10, 10, 10]} /> */}
            {/*     <meshStandardMaterial color={'orange'} /> */}
            {/* </mesh> */}

            <primitive object={newScene} />
            {/* <primitive object={lineScene} /> */}

            <lineSegments
                name="base001_2"
                geometry={lineNodes.base001_2.geometry}
                material={new LineBasicMaterial({
                    color: 0xff1101,
                    depthTest: true,
                    transparent: false,
                    opacity: 0.2,
                    dashed: false
                })}
            />

            <group name="Camera">
                <PerspectiveCamera makeDefault fov={90}>
                </PerspectiveCamera>
            </group>
        </group>
    );
}

const Scene = () => {
    return (
        <Canvas
            frameloop="demand"
            colorManagement
            shadowMap
            camera={{ position: [-5, 2, 10], fov: 60 }}>

            <color attach="background" args={[COLOR_BACKGROUND]} />

            <ambientLight intensity={0.3} />

            {/* <directionalLight */}
            {/*     castShadow */}
            {/*     position={[0, 10, 0]} */}
            {/*     intensity={1.5} */}
            {/*     shadow-mapSize-width={1024} */}
            {/*     shadow-mapSize-height={1024} */}
            {/*     shadow-camera-far={50} */}
            {/*     shadow-camera-left={-10} */}
            {/*     shadow-camera-right={10} */}
            {/*     shadow-camera-top={10} */}
            {/*     shadow-camera-bottom={-10} */}
            {/* /> */}

            {/* <pointLight position={[-10, 0, -20]} intensity={0.5} /> */}
            {/* <pointLight position={[0, -10, 0]} intensity={1.5} /> */}
            <ScrollControls
                pages={72}
                damping={100}
                style={{
                    background: "linear-gradient(to right, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0) 70%"
                }}
            >
                <Scroll>
                    {/* <group scale={[10, 10, 10]}> */}
                    <Museum />
                    {/* </group> */}
                </Scroll>
                <Scroll html>
                    <Frames />
                    <h1 style={{ position: 'absolute', top: '0vh', color: 'white', margin: '20px' }}>first page</h1>
                    <h1 style={{ position: 'absolute', top: '100vh', color: 'white', margin: '20px' }}>second page</h1>
                    <h1 style={{ position: 'absolute', top: '200vh', color: 'white', margin: '20px' }}>third page</h1>
                </Scroll>
            </ScrollControls>

            {/* <FirstPersonControls */}
            {/*     activeLook={false} */}
            {/*     movementSpeed={5} */}
            {/* /> */}
            {/* <ArcballControls /> */}
        </Canvas >
    );
}

const App = () => {
    return (
        <>
            <Suspense fallback={null}>
                <Scene />
            </Suspense>
            <Overlay />
        </>
    );
};

export default App;
