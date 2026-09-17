'use client';

// Imports
// ------------
import React from 'react';
import PropTypes from 'prop-types';
import { Circle } from '@react-three/drei';

// Component
// ------------
const Floor = ({ color }) => {
    return (
        <Circle args={[10]} rotation-x={-Math.PI / 2} receiveShadow>
            <meshStandardMaterial />
        </Circle>
    );
};

// PropTypes
// ------------
Floor.propTypes = {
    color: PropTypes.string,
};

// Exports
// ------------
Floor.displayName = 'Floor';
export default Floor;
