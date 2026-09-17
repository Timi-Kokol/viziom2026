"use client";

// Imports
// ------------
import React from "react";
import { useControls } from "leva";

// Component
// ------------
const Box = ({ ref, color, position, scale, wireframe }) => {
	const { color: boxColor, wireframe: boxWireframe } = useControls(
		"Just a box",
		{
			color: "#ff0000",
			wireframe: false,
		}
	);

	return (
		<mesh ref={ref} position={position} scale={scale} castShadow receiveShadow>
			<boxGeometry />
			<meshStandardMaterial color={boxColor} wireframe={boxWireframe} />
		</mesh>
	);
};

// Exports
// ------------
Box.displayName = "Box";
export default Box;
