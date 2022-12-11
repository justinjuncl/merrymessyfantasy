import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

import { OutsideEdgesGeometry } from './OutsideEdgesGeometry.js';
import { ConditionalEdgesGeometry } from './ConditionalEdgesGeometry.js';
import { ConditionalEdgesShader } from './ConditionalEdgesShader.js';
import { ConditionalLineSegmentsGeometry } from './Lines2/ConditionalLineSegmentsGeometry.js';
import { ConditionalLineMaterial } from './Lines2/ConditionalLineMaterial.js';
import { ColoredShadowMaterial } from './ColoredShadowMaterial.js';

const COLOR_BACKGROUND = 0x111111;
const COLOR_MODEL = 0x111111;
const COLOR_LINES = 0xb0bec5;
const COLOR_SHADOW = 0x2c2e2f;

function generateModel(scene) {

    const params = {
        backgroundColor: COLOR_BACKGROUND,
        modelColor: COLOR_MODEL,
        lineColor: COLOR_LINES,
        shadowColor: COLOR_SHADOW,

        lit: false,
        opacity: 1,
        threshold: 10,
        display: 'THRESHOLD_EDGES',
        displayConditionalEdges: true,
        thickness: 1,
        useThickLines: false,
    };

    const originalModel = mergeObject(scene.clone());

    const edgesModel = initEdgesModel(originalModel, params);
    const [backgroundModel, shadowModel, _] = initBackgroundModel(originalModel);
    const conditionalModel = initConditionalModel(originalModel);

    colorize(conditionalModel, edgesModel, backgroundModel, shadowModel, params);

    return [originalModel, conditionalModel, edgesModel, backgroundModel, shadowModel];
}

function mergeObject(object) {

    // object.updateMatrixWorld(true);

    const geometry = [];
    object.traverse(c => {

        if (c.isMesh) {

            const g = c.geometry;
            // g.applyMatrix4(c.matrix);
            const pos = c.position;
            const scale = c.scale;
            const quaternion = c.quaternion;

            g.scale(scale.x, scale.y, scale.z);
            g.applyQuaternion(quaternion);
            g.translate(pos.x / 2, pos.y / 2, pos.z / 2);

            for (const key in g.attributes) {

                if (key !== 'position' && key !== 'normal') {

                    g.deleteAttribute(key);

                }

            }
            geometry.push(g.toNonIndexed());

        }

    });

    const mergedGeometries = BufferGeometryUtils.mergeBufferGeometries(geometry, false);
    const mergedGeometry = BufferGeometryUtils.mergeVertices(mergedGeometries).center();

    const group = new THREE.Group();
    const mesh = new THREE.Mesh(mergedGeometry);

    mesh.geometry.computeBoundingBox();
    mesh.castShadow = true;

    group.add(mesh);

    return group;

}

function initEdgesModel(originalModel, params) {

    const edgesModel = originalModel.clone();

    const meshes = [];
    edgesModel.traverse(c => {
        if (c.isMesh) {
            meshes.push(c);
        }
    });

    for (const key in meshes) {
        const mesh = meshes[key];
        const parent = mesh.parent;

        const lineGeom = new THREE.EdgesGeometry(mesh.geometry, params.threshold);
        const line = new THREE.LineSegments(lineGeom, new THREE.LineBasicMaterial({ color: COLOR_LINES }));
        line.position.copy(mesh.position);
        line.scale.copy(mesh.scale);
        line.rotation.copy(mesh.rotation);

        const thickLineGeom = new LineSegmentsGeometry().fromEdgesGeometry(lineGeom);
        const thickLines = new LineSegments2(thickLineGeom, new LineMaterial({ color: COLOR_LINES, linewidth: 3 }));
        thickLines.position.copy(mesh.position);
        thickLines.scale.copy(mesh.scale);
        thickLines.rotation.copy(mesh.rotation);

        parent.remove(mesh);
        parent.add(line);
        parent.add(thickLines);
    }

    return edgesModel;

}

function initBackgroundModel(originalModel) {

    const backgroundModel = originalModel.clone();
    backgroundModel.traverse(c => {

        if (c.isMesh) {

            c.material = new THREE.MeshBasicMaterial({ color: COLOR_MODEL });
            c.material.polygonOffset = true;
            c.material.polygonOffsetFactor = 1;
            c.material.polygonOffsetUnits = 1;
            c.renderOrder = 2;

        }

    });

    const shadowModel = originalModel.clone();
    shadowModel.traverse(c => {

        if (c.isMesh) {

            c.material = new ColoredShadowMaterial({ color: COLOR_MODEL, shininess: 1.0 });
            c.material.polygonOffset = true;
            c.material.polygonOffsetFactor = 1;
            c.material.polygonOffsetUnits = 1;
            c.receiveShadow = true;
            c.renderOrder = 2;

        }

    });

    const depthModel = originalModel.clone();
    depthModel.traverse(c => {

        if (c.isMesh) {

            c.material = new THREE.MeshBasicMaterial({ color: COLOR_MODEL });
            c.material.polygonOffset = true;
            c.material.polygonOffsetFactor = 1;
            c.material.polygonOffsetUnits = 1;
            c.material.colorWrite = false;
            c.renderOrder = 1;

        }

    });

    return [backgroundModel, shadowModel, depthModel];

}

function initConditionalModel(originalModel) {

    const conditionalModel = originalModel.clone();

    const meshes = [];
    conditionalModel.traverse(c => {
        if (c.isMesh) {
            meshes.push(c);
        }
    });

    for (const key in meshes) {

        const mesh = meshes[key];
        const parent = mesh.parent;

        // Remove everything but the position attribute
        const mergedGeom = mesh.geometry.clone();
        for (const key in mergedGeom.attributes) {

            if (key !== 'position') {

                mergedGeom.deleteAttribute(key);

            }

        }

        // Create the conditional edges geometry and associated material
        const lineGeom = new ConditionalEdgesGeometry(BufferGeometryUtils.mergeVertices(mergedGeom));
        const material = new THREE.ShaderMaterial(ConditionalEdgesShader);
        material.uniforms.diffuse.value.set(COLOR_LINES);

        const line = new THREE.LineSegments(lineGeom, material);
        line.position.copy(mesh.position);
        line.scale.copy(mesh.scale);
        line.rotation.copy(mesh.rotation);

        const thickLineGeom = new ConditionalLineSegmentsGeometry().fromConditionalEdgesGeometry(lineGeom);
        const thickLines = new LineSegments2(thickLineGeom, new ConditionalLineMaterial({ color: COLOR_LINES, linewidth: 2 }));
        thickLines.position.copy(mesh.position);
        thickLines.scale.copy(mesh.scale);
        thickLines.rotation.copy(mesh.rotation);
        parent.remove(mesh);
        parent.add(line);
        parent.add(thickLines);
    }

    return conditionalModel;

}

function colorize(conditionalModel, edgesModel, backgroundModel, shadowModel, params) {

    const linesColor = params.lineColor;
    const modelColor = params.modelColor;
    const backgroundColor = params.backgroundColor;
    const shadowColor = params.shadowColor;

    if (conditionalModel) {
        conditionalModel.visible = params.displayConditionalEdges;
        conditionalModel.traverse(c => {
            if (c.material && c.material.resolution) {
                // renderer.getSize( c.material.resolution);
                c.material.resolution.multiplyScalar(window.devicePixelRatio);
                c.material.linewidth = params.thickness;
            }
            if (c.material) {
                c.visible = c instanceof LineSegments2 ? params.useThickLines : !params.useThickLines;
                c.material.uniforms.diffuse.value.set(linesColor);
            }
        });
    }

    if (edgesModel) {
        edgesModel.traverse(c => {
            if (c.material && c.material.resolution) {
                // renderer.getSize(c.material.resolution);
                c.material.resolution.multiplyScalar(window.devicePixelRatio);
                c.material.linewidth = params.thickness;
            }
            if (c.material) {
                c.visible = c instanceof LineSegments2 ? params.useThickLines : !params.useThickLines;
                c.material.color.set(linesColor);
            }
        });
    }

    if (backgroundModel) {
        backgroundModel.visible = !params.lit;
        backgroundModel.traverse(c => {
            if (c.isMesh) {
                c.material.transparent = params.opacity !== 1.0;
                c.material.opacity = params.opacity;
                c.material.color.set(modelColor);
            }
        });
    }

    if (shadowModel) {
        shadowModel.visible = params.lit;
        shadowModel.traverse(c => {
            if (c.isMesh) {
                c.material.transparent = params.opacity !== 1.0;
                c.material.opacity = params.opacity;
                c.material.color.set(modelColor);
                c.material.shadowColor.set(shadowColor);
            }
        });
    }

}


export {
    generateModel,
    mergeObject,
    initEdgesModel,
    initBackgroundModel,
    initConditionalModel,
    colorize,
    COLOR_BACKGROUND,
    COLOR_MODEL,
    COLOR_LINES,
    COLOR_SHADOW
};
