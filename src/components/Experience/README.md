# Experience

What you see here is the absolute basics of what you'll need to get started with building out the 3D experience. Using the following components, you can quickly manipulate to fit your design.

-   **[Lighting]** - `Experience > Lights` - Use this to create your scene lighting.
-   **[Flooring]** - `Experience > Floor` - The base floor component, should you need it.
-   **[Environment]** - `Experience > Environment` - In case your scene needs a HDRI
-   **[PostProcessing]** - `Experience > PostProcessing` - Uses the EffectComposer to enable PP effects such as Bloom, Depth of Field, etc. There are lots of effect so look at https://react-postprocessing.docs.pmnd.rs/effects/autofocus
-   **[Monkey]** - `Experience > Monkey` - This is a simple GLB model loaded into the scene. Use this as a premise to import your own models.
-   **[Scene]** - `Experience > Scene` - I thought this would be a good place to build out the scene with different components (models) etc.

## Notes

-   Something to consider during development, I'm using the useControls from Leva in certain components which gives you the ability to tweak / find the right data (color / position / size etc) so you can get it right within the scene then make sure you set it as the defaults. For example, I change the light position using the controller, find the right values, set those values as default on the Light component, job done.

-   Helpers have been added in the parent `index.jsx` - be sure to turn these off in production.

## Performance & GLB optimization

To optimize 3D models (e.g. lower poly count, merge meshes, compress textures) before importing:

- **[glTF Transform](https://gltf.transform.dev/)** – CLI and API to optimize, resize, and compress glTF/GLB (recommended).
- **[gltfjsx](https://github.com/pmndrs/gltfjsx)** – Generates optimized React Three Fiber components from GLB; can output compressed or simplified meshes.
- **Blender** – Use “Decimate” modifier to reduce polygons; export as glTF 2.0 with “Compress” or “Draco” if available.
- **Online:** [glTF Viewer](https://gltf-viewer.donmccurdy.com/) for inspection; [Squoosh](https://squoosh.app/) for texture compression, then re-pack into GLB with glTF Transform.
