import * as THREE from "three";
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from "MeshLine";

import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";

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

const COLOR_BACKGROUND = 0x111111;
const COLOR_MODEL = 0x111111;
const COLOR_LINES = 0xb0bec5;
const COLOR_SHADOW = 0x2c2e2f;

// extend({ MeshLine, MeshLineMaterial });
extend({ LineSegments2 });
useGLTF.preload(MUSEUM);

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

    const { scene: lineScene, materials: lineMaterials } = useGLTF(MUSEUM_LINES);

    const { scene, nodes, animations, materials } = useGLTF(MUSEUM);
    const { actions } = useAnimations(animations, groupRef);

    const { scroll, el } = useScroll();

    let edgeSceneMaterial = new LineMaterial({
        color: 0xff0000,
        linewidth: 5,
        vertexColors: true,
        //resolution:  // to be set by renderer, eventually
        dashed: false,
        alphaToCoverage: true,
    });
    // edgeSceneMaterial.resolution.set(window.innerWidth, window.innerHeight);

    let [edgeSceneGeometry, ls2] = useMemo(() => {
        lineScene.traverse(child => {
            if (child.type === "Mesh") {
                lineScene.remove(child);
            }
            if (child.name === "base001_2") {
                let geom = new LineSegmentsGeometry().fromLineSegments(child);
                let ls2 = new LineSegments2(geom);
                ls2.computeLineDistances();
                console.log(ls2);
                return [geom, ls2];
            }
        });

        let geom = new LineSegmentsGeometry();
        return [geom, new LineSegments2(geom)];
    }, [lineScene]);

    useEffect(() => {
        actions["Action"].play().paused = true;
        Object.values(materials).forEach(material => {
            material.opacity = 0.4;
            material.transparent = true;
            material.depthTest = true;
            material.flatShading = true;
            material.color.set(0x000000);
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

    // const [originalModel, conditionalModel, edgesModel, backgroundModel, shadowModel] = useMemo(() => {
    //     return LineMaterial.generateModel(scene);
    // }, [scene]);

    let lineSegments2Ref = useRef();
    useEffect(() => {
        console.log(lineSegments2Ref.current)
    })

    return (
        <group ref={groupRef} dispose={null}>
            <mesh>
                <boxGeometry args={[10, 10, 10]} />
                <meshStandardMaterial color={'orange'} />
            </mesh>

            {/* <primitive object={lineScene} /> */}
            <primitive object={newScene} />
            {ls2 && <primitive object={ls2} />}

            <lineSegments2 ref={lineSegments2Ref} args={[edgeSceneGeometry, edgeSceneMaterial]} />
            {/* <mesh> */}
            {/*     <meshLine ref={meshLineRef} attach="geometry" /> */}
            {/*     <meshLineMaterial */}
            {/*         attach="material" */}
            {/*         transparent */}
            {/*         depthTest={false} */}
            {/*         lineWidth={1} */}
            {/*         color={new THREE.Color(0x00ffff)} */}
            {/*         dashArray={0.05} */}
            {/*         dashRatio={0.95} */}
            {/*     /> */}
            {/* </mesh> */}

            {/* <primitive object={originalModel} /> */}
            {/* <primitive object={conditionalModel} /> */}
            {/* <primitive object={edgesModel} /> */}
            {/* <primitive object={backgroundModel} /> */}
            {/* <primitive object={shadowModel} /> */}
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
