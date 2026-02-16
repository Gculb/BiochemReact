const registry = {};

function importAll(r) {
  r.keys().forEach((key) => {
    const cleanKey = key.replace("./", "");
    registry[cleanKey] = r(key);


  });
}

importAll(require.context("../images", true, /\.(png|jpe?g|svg)$/));

export default registry;
