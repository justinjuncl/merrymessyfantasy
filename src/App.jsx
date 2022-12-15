import * as THREE from "three";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { extend, Canvas, useThree, useFrame, invalidate } from "@react-three/fiber";
import { useIntersect, Image, PerspectiveCamera, FirstPersonControls, useGLTF, useAnimations, ArcballControls, Html, Scroll, useScroll, ScrollControls } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";

import { InView, useInView } from 'react-intersection-observer';

import { LineBasicMaterial } from "three";
import { easing } from 'maath';

import { useInterval } from "Utils";
import { Overlay } from "Overlay";
import { artistsOrder } from "assets/artistsOrder";

import "App.css";

// import MUSEUM from "assets/example.glb";
import MUSEUM from "assets/museum.glb";
import MUSEUM_LINES from "assets/museum-lines.glb";
import FRAMES from "assets/frames.json";
import LOREM from "assets/lorem.json";
import { useFrameStore } from "Store";

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
        position: 'relative',
        margin: '20px',
        width: '100vw',
        height: '100vh',
    };

    const setCurrentFrame = useFrameStore(state => state.setCurrentFrame);
    const { ref, inView, entry } = useInView({
        threshold: 0,
        onChange: () => (inView && setCurrentFrame(index))
    });

    return (
        <div style={divStyle}>
            <div ref={ref} style={{
                position: 'sticky',
            }}>
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
                <FrameHTML key={index} index={index + 3} offset={3} {...frame} />
            ))}
        </>
    );
}
const _p = new THREE.Vector3();
const Museum = () => {
    const groupRef = useRef();

    const camera = useThree((state) => state.camera);

    const { nodes: lineNodes } = useGLTF(MUSEUM_LINES);
    const { scene, nodes, animations, materials } = useGLTF(MUSEUM);
    const { actions } = useAnimations(animations, groupRef);

    // const { scroll, el } = useScroll();

    let frames = useMemo(() => {
        let frames = {};
        Object.values(nodes).forEach(node => {
            if (node.name.startsWith("frame")) {
                frames[node.name] = {
                    position: node.position,
                    quaternion: node.quaternion,
                    distance: Math.random() * 2 + 2
                };
            }
        });

        let { position: p, quaternion: q, distance: d } = Object.values(frames)[0];
        _p.copy(p).add(new THREE.Vector3(0, 0, d).applyQuaternion(q));

        camera.position.lerp(_p, 1);
        camera.quaternion.slerp(q, 1);
        camera.updateWorldMatrix();

        return frames;
    }, [nodes, camera]);

    const currentFrame = useFrameStore(state => state.currentFrame);

    // const [count, setCount] = useState(0);
    // const [delay,] = useState(5000);
    // const [isPlaying,] = useState(true);

    // useInterval(
    //     () => {
    //         setCount(count + 1);
    //         console.log(count);
    //     },
    //     isPlaying ? delay : null,
    // )

    useFrame((state, dt) => {
        // actions["Action"].time = THREE.MathUtils.lerp(actions["Action"].time, actions["Action"].getClip().duration * scroll.current, 0.05);

        let { position: p, quaternion: q, distance: d } = Object.values(frames)[currentFrame];
        _p.copy(p).add(new THREE.Vector3(0, 0, d).applyQuaternion(q));

        easing.damp3(state.camera.position, _p, 0.4, dt)
        easing.dampQ(state.camera.quaternion, q, 0.4, dt)
    })

    // useEffect(() => {
    //     const pageCount = 72;
    //     el.onscroll = (e) => {
    //         let currentPageNumber = Math.floor(scroll.current * pageCount + 0.5);
    //         setCount(Math.max(0, currentPageNumber - 2));
    //     }
    // }, [el, scroll]);

    useEffect(() => {
        // actions["Action"].play().paused = true;
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

    const newScene = useMemo(() => {
        let newScene = scene.clone();
        let cameraObject = newScene.getObjectByName("Camera");
        if (cameraObject !== null)
            newScene.remove(cameraObject);
        return newScene;
    }, [scene]);

    const [active, setActive] = useState(true);

    const springs = useSpring({
        color: active ? '#ff5500' : '#00ff55',
        pos: active ? [0, 0, 2] : [0, 0, 0],
        config: { mass: 10, tension: 1000, friction: 300, precision: 0.00001 }
    })

    return (
        <group ref={groupRef} dispose={null} >
            <primitive object={newScene} onClick={() => setActive(a => !a)} />

            {Object.values(frames).map((frame, i) => (
                <group key={i} position={frame.position} quaternion={frame.quaternion}>
                    <axesHelper />
                </group>
            ))}

            <lineSegments
                geometry={lineNodes.base001_2.geometry}
            >
                <animated.lineBasicMaterial attach="material" color={springs.color} />
            </lineSegments>

            <group name="Camera">
                <PerspectiveCamera makeDefault fov={90}>
                </PerspectiveCamera>
            </group>
        </group>
    );
}

const Scene = () => {
    const setCurrentFrame = useFrameStore(state => state.setCurrentFrame);

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
                    <div style={{ height: '100vh' }}>
                        <InView onChange={(inView, entry) => inView && setCurrentFrame(0)}>
                            <h1 style={{ margin: '20px' }}>first page</h1>
                        </InView>
                    </div>
                    <div style={{ height: '100vh' }}>
                        <InView onChange={(inView, entry) => inView && setCurrentFrame(1)}>
                            <h1 style={{ margin: '20px' }}>second page</h1>
                        </InView>
                    </div>
                    <div style={{ height: '100vh' }}>
                        <InView onChange={(inView, entry) => inView && setCurrentFrame(2)}>
                            <h1 style={{ margin: '20px' }}>third page</h1>
                        </InView>
                    </div>
                    <Frames />
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
